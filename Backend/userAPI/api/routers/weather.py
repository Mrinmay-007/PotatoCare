

import requests

import os
from fastapi import HTTPException, APIRouter
import datetime as dt
from dotenv import load_dotenv
import math

from .weather2 import current_weather, forecast,dew_point,weather
from .risk import analyze_disease_risk,predict_threat
# from ..data.test import predict_threat

load_dotenv()
API_KEY = os.getenv("WEATHER_API_KEY")



# ---------- FastAPI Router ----------
router = APIRouter(
    prefix="/weather",
    tags=["Weather"]
)



@router.get("/current")
async def get_weather():
    return current_weather()


@router.get("/forecast")
async def get_forecast():
    return forecast()



# @router.get("/present")
# async def get_present_weather():
#    data = weather()
#    return data



@router.get("/compatible")
async def get_disease_risk(leaf: str):
    forecast_data = forecast()
    risk_analysis = analyze_disease_risk(leaf)
    return risk_analysis

from .risk import analyze_disease_risk,predict_threat
@router.get("/threat")
async def get_disease_threat():
    return predict_threat()
    


