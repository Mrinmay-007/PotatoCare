# # recommendation.py

# from fastapi import APIRouter, HTTPException
# import json
# import os

# from .weather import weather

# router = APIRouter(
#     prefix="/recommendation",
#     tags=["Recommendation"]
# )

# BASE_DIR = os.path.dirname(
#     os.path.dirname(
#         os.path.abspath(__file__)
#     )
# )

# JSON_PATH = os.path.join(
#     BASE_DIR,
#     "data",
#     "recommendation.json"
# )

# with open(JSON_PATH, "r", encoding="utf-8") as f:
#     RECOMMENDATIONS = json.load(f)


# def get_weather_risk(
#     disease: str,
#     temp: float,
#     humidity: float
# ):
#     disease = disease.lower()

#     if disease == "late blight":

#         if humidity > 90 and 10 <= temp <= 20:
#             return "high_risk"

#         elif humidity >= 75:
#             return "moderate_risk"

#         return "low_risk"

#     elif disease == "early blight":

#         if humidity > 80 and temp > 25:
#             return "high_risk"

#         elif humidity >= 65:
#             return "moderate_risk"

#         return "low_risk"

#     return "low_risk"


# @router.get("/{disease_name}")
# async def get_recommendation(
#     disease_name: str
# ):

#     weather_data = weather()
#     disease_name = disease_name.strip().title()
#     temp = float(
#         weather_data["Temperature"]
#         .replace("°C", "")
#         .strip()
#     )

#     humidity = float(
#         weather_data["Humidity"]
#         .replace("%", "")
#         .strip()
#     )

#     risk = get_weather_risk(
#         disease_name,
#         temp,
#         humidity
#     )

#     disease_data = RECOMMENDATIONS.get(
#         disease_name
#     )

#     if not disease_data:
#         raise HTTPException(
#             status_code=404,
#             detail="Disease not found"
#         )

#     recommendation = disease_data.get(
#         risk
#     )

#     return {
#         "disease": disease_name,
#         "city": weather_data["City"],
#         "temperature": weather_data["Temperature"],
#         "humidity": weather_data["Humidity"],
#         "weather": weather_data["Weather"],
#         "risk_level": risk,
#         "recommendation": recommendation
#     }