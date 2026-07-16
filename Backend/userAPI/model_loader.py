import joblib
from pathlib import Path
# BASE_DIR = Path(__file__).resolve().parent.parent.parent
BASE_DIR = Path(__file__).resolve().parent
print("🟡🟡🟡",BASE_DIR)
MODEL_PATH = BASE_DIR /"api"/ "data" / "disease_prediction_model2.joblib"

disease_model = None

def load_model():
    global disease_model
    disease_model = joblib.load(MODEL_PATH)
    print("Disease model loaded successfully  🟢🟢🟢")