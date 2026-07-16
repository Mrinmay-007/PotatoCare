
# from fastapi import APIRouter, HTTPException, Query
# from googletrans import Translator

# router = APIRouter(
#     prefix="/translate",
#     tags=["Translation"]
# )
# translator = Translator()

# # Supported Indian languages and their language codes for Google Translate
# SUPPORTED_LANGUAGES = {
#     "bengali": "bn",
#     "bhojpuri": "bho",
#     "gujarati": "gu",
#     "hindi": "hi",
#     "kannada": "kn",
#     "maithili": "mai",
#     "malayalam": "ml",
#     "marathi": "mr",
#     "meitei": "mni-Mtei",
#     "odia": "or",
#     "punjabi": "pa",
#     "sanskrit": "sa",
#     "tamil": "ta",
#     "telugu": "te",
#     "urdu": "ur",
#     "santali": "sat",
#     "awadhi": "awa",
#     "bodo": "brx",
#     "khasi": "kha",
#     "kokborok": "trp",
#     "marwadi": "mwr",
#     "tulu": "tcy"
# }


# @router.get("/")
# async def translate_text(
#     text: str = Query(..., description="Text to translate (English)"),
#     target_language: str = Query(..., description="Target Indian language name (e.g., 'hindi')")
# ):
#     target_language = target_language.lower()

#     if target_language not in SUPPORTED_LANGUAGES:
#         raise HTTPException(
#             status_code=400,
#             detail=f"Unsupported language. Choose from: {', '.join(SUPPORTED_LANGUAGES.keys())}"
#         )

#     try:
#         lang_code = SUPPORTED_LANGUAGES[target_language]
#         translated = translator.translate(text, src='en', dest=lang_code)
#         return {
#             "source_language": "English",
#             "target_language": target_language.capitalize(),
#             "translated_text": translated.text 
#         }

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))



from functools import lru_cache

from fastapi import APIRouter, HTTPException, Query
from deep_translator import GoogleTranslator

router = APIRouter(
    prefix="/translate",
    tags=["Translation"]
)

# Supported Indian languages
SUPPORTED_LANGUAGES = {
    "bengali": "bn",
    "bhojpuri": "bho",
    "gujarati": "gu",
    "hindi": "hi",
    "kannada": "kn",
    "maithili": "mai",
    "malayalam": "ml",
    "marathi": "mr",
    "meitei": "mni-Mtei",
    "odia": "or",
    "punjabi": "pa",
    "sanskrit": "sa",
    "tamil": "ta",
    "telugu": "te",
    "urdu": "ur",
    "santali": "sat",
    "awadhi": "awa",
    "bodo": "brx",
    "khasi": "kha",
    "kokborok": "trp",
    "marwadi": "mwr",
    "tulu": "tcy",
}


@lru_cache(maxsize=1000)
def translate_cached(text: str, target_lang: str) -> str:
    """
    Cache translations to improve performance for repeated requests.
    """
    return GoogleTranslator(
        source="en",
        target=target_lang
    ).translate(text)


@router.get("/")
async def translate_text(
    text: str = Query(..., description="Text to translate from English"),
    target_language: str = Query(
        ...,
        description="Target language (e.g. hindi, bengali, tamil)"
    ),
):
    target_language = target_language.strip().lower()

    if target_language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Unsupported language.",
                "supported_languages": sorted(SUPPORTED_LANGUAGES.keys()),
            },
        )

    try:
        lang_code = SUPPORTED_LANGUAGES[target_language]

        translated_text = translate_cached(text, lang_code)

        return {
            "success": True,
            "source_language": "English",
            "target_language": target_language.title(),
            "translated_text": translated_text,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Translation failed: {str(e)}"
        )







# import asyncio
# import hashlib
# import json
# import threading
# from pathlib import Path

# import httpx
# from fastapi import APIRouter, HTTPException, Query

# router = APIRouter(
#     prefix="/translate",
#     tags=["Translation"]
# )

# # Supported Indian languages
# SUPPORTED_LANGUAGES = {
#     "bengali": "bn",
#     "bhojpuri": "bho",
#     "gujarati": "gu",
#     "hindi": "hi",
#     "kannada": "kn",
#     "maithili": "mai",
#     "malayalam": "ml",
#     "marathi": "mr",
#     "meitei": "mni-Mtei",
#     "odia": "or",
#     "punjabi": "pa",
#     "sanskrit": "sa",
#     "tamil": "ta",
#     "telugu": "te",
#     "urdu": "ur",
#     "santali": "sat",
#     "awadhi": "awa",
#     "bodo": "brx",
#     "khasi": "kha",
#     "kokborok": "trp",
#     "marwadi": "mwr",
#     "tulu": "tcy",
# }

# # ---------------------------------------------------------------------------
# # Persistent cache (survives restarts/redeploys on Railway, unlike lru_cache)
# # ---------------------------------------------------------------------------
# CACHE_PATH = Path(__file__).parent / "translation_cache.json"
# _cache_lock = threading.Lock()

# if CACHE_PATH.exists():
#     try:
#         with open(CACHE_PATH, "r", encoding="utf-8") as f:
#             _cache: dict[str, str] = json.load(f)
#     except (json.JSONDecodeError, OSError):
#         _cache = {}
# else:
#     _cache = {}


# def _cache_key(text: str, lang_code: str) -> str:
#     # md5 keeps keys short/fixed-length regardless of input text size
#     raw = f"{lang_code}:{text}"
#     return hashlib.md5(raw.encode("utf-8")).hexdigest()


# def _save_cache_to_disk() -> None:
#     # Runs in a thread so it never blocks the event loop
#     with _cache_lock:
#         tmp_path = CACHE_PATH.with_suffix(".tmp")
#         with open(tmp_path, "w", encoding="utf-8") as f:
#             json.dump(_cache, f, ensure_ascii=False)
#         tmp_path.replace(CACHE_PATH)  # atomic write, avoids corruption


# _GOOGLE_ENDPOINT = "https://translate.googleapis.com/translate_a/single"


# def _call_google_raw(text: str, lang_code: str) -> str:
#     """
#     Hits Google's translate endpoint directly (the same one deep_translator
#     wraps internally), bypassing deep_translator's outdated language
#     whitelist. This lets newer codes like kha (Khasi), trp (Kokborok),
#     sat (Santali), tcy (Tulu), mwr (Marwadi) work, since Google's backend
#     already supports them even though some client libraries don't know it yet.
#     """
#     params = {
#         "client": "gtx",
#         "sl": "en",
#         "tl": lang_code,
#         "dt": "t",
#         "q": text,
#     }
#     resp = httpx.get(_GOOGLE_ENDPOINT, params=params, timeout=10.0)
#     resp.raise_for_status()
#     data = resp.json()
#     # data[0] is a list of [translated_chunk, original_chunk, ...] segments
#     return "".join(segment[0] for segment in data[0] if segment[0])


# def _translate_blocking(text: str, lang_code: str) -> str:
#     """
#     Runs in a worker thread via asyncio.to_thread so it never blocks
#     the event loop. Checks cache first, only calls Google on a miss.
#     """
#     key = _cache_key(text, lang_code)

#     with _cache_lock:
#         cached = _cache.get(key)
#     if cached is not None:
#         return cached

#     result = _call_google_raw(text, lang_code)

#     with _cache_lock:
#         _cache[key] = result

#     # Persist without blocking the caller's return
#     threading.Thread(target=_save_cache_to_disk, daemon=True).start()

#     return result


# # ---------------------------------------------------------------------------
# # Route — same input/output shape as before
# # ---------------------------------------------------------------------------
# @router.get("/")
# async def translate_text(
#     text: str = Query(..., description="Text to translate from English"),
#     target_language: str = Query(
#         ...,
#         description="Target language (e.g. hindi, bengali, tamil)"
#     ),
# ):
#     target_language = target_language.strip().lower()

#     if target_language not in SUPPORTED_LANGUAGES:
#         raise HTTPException(
#             status_code=400,
#             detail={
#                 "message": "Unsupported language.",
#                 "supported_languages": sorted(SUPPORTED_LANGUAGES.keys()),
#             },
#         )

#     lang_code = SUPPORTED_LANGUAGES[target_language]

#     try:
#         translated_text = await asyncio.to_thread(
#             _translate_blocking, text, lang_code
#         )

#         return {
#             "success": True,
#             "source_language": "English",
#             "target_language": target_language.title(),
#             "translated_text": translated_text,
#         }

#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Translation failed: {str(e)}"
#         )


# # Optional: batch endpoint for translating many strings in one call
# # (useful for pre-warming the cache with all your UI strings at once)
# @router.post("/batch")
# async def translate_batch(
#     texts: list[str],
#     target_language: str = Query(...),
# ):
#     target_language = target_language.strip().lower()

#     if target_language not in SUPPORTED_LANGUAGES:
#         raise HTTPException(
#             status_code=400,
#             detail={
#                 "message": "Unsupported language.",
#                 "supported_languages": sorted(SUPPORTED_LANGUAGES.keys()),
#             },
#         )

#     lang_code = SUPPORTED_LANGUAGES[target_language]

#     async def translate_one(t: str) -> str:
#         return await asyncio.to_thread(_translate_blocking, t, lang_code)

#     # Cache hits resolve instantly; only real misses hit the network,
#     # and they run concurrently instead of one-by-one
#     results = await asyncio.gather(*(translate_one(t) for t in texts))

#     return {
#         "success": True,
#         "source_language": "English",
#         "target_language": target_language.title(),
#         "translations": dict(zip(texts, results)),
#     }