    
from fastapi import File, UploadFile, APIRouter, HTTPException
import numpy as np
from io import BytesIO
from PIL import Image
import os
import logging
import cv2
import threading

# ------------------------
# TFLite runtime import (same preference order as detection_tf_lite.py,
# kept consistent across both routers so the app only needs one heavy
# dependency path, not two different ones).
# ------------------------
try:
    from ai_edge_litert.interpreter import Interpreter  # type: ignore
except ImportError:
    try:
        from tflite_runtime.interpreter import Interpreter  # type: ignore
    except ImportError:
        import tensorflow as tf
        Interpreter = tf.lite.Interpreter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/predict",
    tags=["Prediction"],
)

# -------------------------------
# Define Model Path
# -------------------------------
BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "ml_models",
    "V1.tflite"
)

# -------------------------------
# Validate Model Path
# -------------------------------
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Model not found: {MODEL_PATH}"
    )

if os.path.getsize(MODEL_PATH) == 0:
    raise ValueError(f"Model file is empty: {MODEL_PATH}")

# -------------------------------
# Load TFLite Model
# -------------------------------
logger.info("Loading disease model (TFLite)...")

# NOTE: V1.tflite was exported with a fixed batch of 32. It has been patched so
# its Reshape op infers the batch dimension (-1) instead of a hard-coded 32.
# Two things keep memory low (~66 MB instead of ~400+ MB, which caused the
# OOM crash loop on deploy):
#   1. resize the input to batch 1 BEFORE the first allocate_tensors();
#   2. disable the default XNNPACK delegate, which prepares the original
#      batch-32 graph and allocates its workspace regardless of the resize.
# Latency is ~25 ms/request on CPU, outputs identical to the original model.
_interp_kwargs = {"num_threads": int(os.getenv("TFLITE_THREADS", "1"))}
try:
    from ai_edge_litert.interpreter import OpResolverType  # type: ignore
    _interp_kwargs["experimental_op_resolver_type"] = (
        OpResolverType.BUILTIN_WITHOUT_DEFAULT_DELEGATES
    )
except ImportError:
    pass

INTERPRETER = Interpreter(model_path=MODEL_PATH, **_interp_kwargs)
_in = INTERPRETER.get_input_details()[0]
INTERPRETER.resize_tensor_input(_in["index"], [1] + [int(d) for d in _in["shape"][1:]])
INTERPRETER.allocate_tensors()
logger.info("TFLite input resized to batch 1")

INPUT_DETAILS = INTERPRETER.get_input_details()
OUTPUT_DETAILS = INTERPRETER.get_output_details()
FIXED_BATCH_SIZE = INPUT_DETAILS[0]["shape"][0]  # always 1 now

# TFLite interpreters are NOT thread-safe. FastAPI can process requests
# concurrently, so without this lock, two overlapping requests can corrupt
# each other's tensors mid-inference -- one of the most common causes of
# "same/garbage output for every input" with a shared interpreter instance.
INTERPRETER_LOCK = threading.Lock()

logger.info(
    "Disease model loaded successfully. Input shape: %s, dtype: %s",
    INPUT_DETAILS[0]["shape"],
    INPUT_DETAILS[0]["dtype"],
)

CLASS_NAMES = [
    "Early Blight",
    "Late Blight",
    "Healthy"
]

IMAGE_SIZE = 256


# -------------------------------
# Read Image
# -------------------------------
def read_file_as_image(data: bytes) -> np.ndarray:
    image = Image.open(BytesIO(data)).convert("RGB")
    image = image.resize((IMAGE_SIZE, IMAGE_SIZE))
    image = np.array(image)
    return image


# -------------------------------
# TFLite Inference
# -------------------------------
def run_tflite_inference(img_batch: np.ndarray) -> np.ndarray:
    """
    Runs a single forward pass through the TFLite interpreter.

    Casts the input to whatever dtype the model actually expects
    (float32 for a standard model, uint8/int8 if it were quantized)
    instead of assuming float32 -- a mismatched dtype is a common
    cause of flat/identical predictions across different inputs.
    """
    input_detail = INPUT_DETAILS[0]
    expected_dtype = input_detail["dtype"]

    # If the model is quantized, apply its quantization params.
    scale, zero_point = input_detail.get("quantization", (0.0, 0))
    if expected_dtype in (np.uint8, np.int8) and scale not in (0.0, None):
        img_batch = (img_batch / scale + zero_point).astype(expected_dtype)
    else:
        img_batch = img_batch.astype(expected_dtype)

    # If resize_tensor_input(batch=1) succeeded at startup, FIXED_BATCH_SIZE
    # is 1 and img_batch (shape (1, H, W, C)) is used as-is. If the graph
    # couldn't be resized (some ops hardcode batch size), pad up to the
    # model's required fixed batch by repeating the single image, run
    # inference, and only keep the first result.
    if FIXED_BATCH_SIZE > img_batch.shape[0]:
        pad_count = FIXED_BATCH_SIZE - img_batch.shape[0]
        padding = np.repeat(img_batch[:1], pad_count, axis=0)
        img_batch = np.concatenate([img_batch, padding], axis=0)

    # Ensure a fresh, contiguous buffer -- reused/non-contiguous numpy
    # views can cause TFLite to read stale memory.
    img_batch = np.ascontiguousarray(img_batch)

    with INTERPRETER_LOCK:
        INTERPRETER.set_tensor(input_detail["index"], img_batch)
        INTERPRETER.invoke()
        output = INTERPRETER.get_tensor(OUTPUT_DETAILS[0]["index"])

    # Only the first row corresponds to our actual image; the rest (if any)
    # is padding.
    return output[:1]


# -------------------------------
# Severity Detection
# -------------------------------

def get_severity_from_bytes(image_bytes: bytes):

    np_arr = np.frombuffer(
        image_bytes,
        np.uint8
    )

    img = cv2.imdecode(
        np_arr,
        cv2.IMREAD_COLOR
    )

    if img is None:
        return "Unknown", 0.0

    hsv = cv2.cvtColor(
        img,
        cv2.COLOR_BGR2HSV
    )

    # Detect green leaf
    leaf_mask = cv2.inRange(
        hsv,
        np.array([25, 40, 40]),
        np.array([85, 255, 255])
    )

    # Detect dark infected area
    disease_mask = cv2.inRange(
        hsv,
        np.array([0, 0, 0]),
        np.array([180, 255, 80])
    )

    infected_mask = cv2.bitwise_and(
        disease_mask,
        leaf_mask
    )

    infected_area = np.count_nonzero(
        infected_mask
    )

    total_leaf_area = np.count_nonzero(
        leaf_mask
    )

    ratio = (
        infected_area / total_leaf_area * 100
        if total_leaf_area > 0 else 0
    )

    if ratio < 10:
        severity = "Mild"
    elif ratio < 30:
        severity = "Moderate"
    elif ratio < 50:
        severity = "Severe"
    elif ratio < 70:
        severity = "Critical"
    else:
        severity = "Devastating"
    return severity, round(ratio, 2)


# -------------------------------
# Health Check
# -------------------------------
@router.get("/ping")
async def ping():
    return {"message": "Prediction API is running"}


# -------------------------------
# Prediction Endpoint
# -------------------------------
@router.post("/")
async def predict(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()

        image = read_file_as_image(image_bytes)

        img_batch = np.expand_dims(
            image,
            axis=0
        )

        predictions = run_tflite_inference(img_batch)

        predicted_class = CLASS_NAMES[
            np.argmax(predictions[0])
        ]

        confidence = float(
            np.max(predictions[0]) * 100
        )

        severity, infected_ratio = get_severity_from_bytes(
            image_bytes
        )

        # Healthy leaf override
        if predicted_class == "Healthy":
            severity = "No Infection"
            infected_ratio = 0.0

        return {
            "class": predicted_class,
            "confidence": round(confidence, 2),
            "severity": severity,
            "infected_ratio": infected_ratio
        }

    except Exception as e:
        logger.exception("Prediction failed")
        raise HTTPException(
            status_code=500,
            detail="Prediction failed. Please try again with a valid leaf image."
        )