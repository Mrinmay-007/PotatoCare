import requests

import os
from fastapi import HTTPException
import datetime as dt
from dotenv import load_dotenv
from .location import get_device_location
import math
from datetime import datetime
import statistics as stat

load_dotenv()
API_KEY = os.getenv("WEATHER_API_KEY")

API_KEY2 = os.getenv("WEATHER_API_KEY2")
lat, lon = get_device_location()
URL = "https://api.agromonitoring.com/agro/1.0/"




def format_weather(weather):
    return {
        "timestamp": datetime.fromtimestamp(
            weather["dt"]
        ).strftime("%Y-%m-%d %H:%M:%S"),

        "condition": weather["weather"][0]["main"],
        "description": weather["weather"][0]["description"],

        "temperature": {
            "current": f"{weather['main']['temp'] - 273.15:.1f} °C",
            "feels_like": f"{weather['main']['feels_like'] - 273.15:.1f} °C",
            "min": f"{weather['main']['temp_min'] - 273.15:.1f} °C",
            "max": f"{weather['main']['temp_max'] - 273.15:.1f} °C"
        },

        "humidity": f"{weather['main']['humidity']} %",
        "pressure": f"{weather['main']['pressure']} hPa",

        "wind": {
            "speed": f"{weather['wind']['speed']} m/s",
            "direction": f"{weather['wind']['deg']}°",
            "gust": f"{weather['wind'].get('gust', 0)} m/s"
        },

        "cloud_cover": f"{weather['clouds']['all']} %"
    }


def format_forecast(forecast_data):
    formatted = []

    for item in forecast_data:
        formatted.append({
            "timestamp": datetime.fromtimestamp(
                item["dt"]
            ).strftime("%Y-%m-%d %H:%M:%S"),

            "condition": item["weather"][0]["main"],
            "description": item["weather"][0]["description"],

            "temperature": {
                "current": f"{item['main']['temp'] - 273.15:.1f} °C",
                "feels_like": f"{item['main']['feels_like'] - 273.15:.1f} °C",
                "min": f"{item['main']['temp_min'] - 273.15:.1f} °C",
                "max": f"{item['main']['temp_max'] - 273.15:.1f} °C"
            },

            "humidity": f"{item['main']['humidity']} %",

            "pressure": f"{item['main']['pressure']} hPa",

            "wind": {
                "speed": f"{item['wind']['speed']} m/s",
                "direction": f"{item['wind']['deg']}°",
                "gust": f"{item['wind'].get('gust', 0)} m/s"
            },

            "cloud_cover": f"{item['clouds']['all']} %",

            "rainfall": f"{item.get('rain', {}).get('3h', 0)} mm"
        })

    return formatted


def current_weather():
   
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Weather API key not configured")

    if not lat or not lon:
        raise HTTPException(status_code=400, detail="Could not determine location")

    url = f"{URL}weather?lat={lat}&lon={lon}&appid={API_KEY2}"
    
    try:
        resp = requests.get(url, timeout=5)
        resp.raise_for_status()
        weather =resp.json()
        
       
        data = format_weather(weather)

        
        return data
    
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Weather API error: {e}")


def forecast():
    if not API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Weather API key not configured"
        )

    if lat is None or lon is None:
        raise HTTPException(
            status_code=400,
            detail="Could not determine location"
        )

    url = f"{URL}weather/forecast?lat={lat}&lon={lon}&appid={API_KEY2}"

    try:
        resp = requests.get(url, timeout=5)
        resp.raise_for_status()

        weather = resp.json()

        return {
            "count": len(weather),
            "forecast": format_forecast(weather)
        }

    except requests.RequestException as e:
        raise HTTPException(
            status_code=502,
            detail=f"Weather API error: {e}"
        )



    # {
    #   "timestamp": "2026-06-13 17:30:00",
    #   "condition": "Clouds",
    #   "description": "broken clouds",
    #   "temperature": {
    #     "current": "34.0 °C",
    #     "feels_like": "39.4 °C",
    #     "min": "34.0 °C",
    #     "max": "34.0 °C"
    #   },
    #   "humidity": "53 %",
    #   "pressure": "1000 hPa",
    #   "wind": {
    #     "speed": "3.98 m/s",
    #     "direction": "166°",
    #     "gust": "6.09 m/s"
    #   },
    #   "cloud_cover": "77 %",
    #   "rainfall": "0 mm"
    # },
# Temperature, Humidity, Wind Speed, Wind Bearing, Visibility, Pressure
def forecast_input():
    data = forecast()
    Temperature = []
    Humidity = []
    Wind_Speed =[]
    Wind_Bearing = []
    Pressure = []
    
    for item in data["forecast"]:
        Temperature.append(float(item["temperature"]["feels_like"].split()[0]))
        Humidity.append(float(item["humidity"].replace("%", "").strip()))
        Wind_Speed.append (float(item["wind"]["speed"].replace("m/s", "").strip()))
        Wind_Bearing.append(float(item["wind"]["direction"].replace("°","").strip()))
        # Visibility.append
        Pressure.append(float(item["pressure"].replace("hPa","").strip()))
        
    return {
        "Temperature" :stat.mean(Temperature),
        "Humidity" : stat.mean(Humidity),
        "Wind_Speed":stat.mean(Wind_Speed),
        "Wind_Bearing":stat.mean(Wind_Bearing),
        "Visibility":"null",
        "Pressure" :stat.mean(Pressure)
             
    }
    
    


def dew_point(temp_c: float, humidity: float) -> float:
    """
    Calculate dew point (°C) given temperature (°C) and relative humidity (%).
    """
    a, b = 17.27, 237.7
    gamma = (a * temp_c) / (b + temp_c) + math.log(humidity / 100.0)
    dp = (b * gamma) / (a - gamma)
    return round(dp, 2)

def weather():
   
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Weather API key not configured")

    lat, lon = get_device_location()
    if not lat or not lon:
        raise HTTPException(status_code=400, detail="Could not determine location")

    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
    
    try:
        resp = requests.get(url, timeout=5)
        resp.raise_for_status()
        weather =resp.json()
        
        timestamp = str(dt.datetime.utcfromtimestamp(weather['dt'])) # yy/mm/dd  hh/mm/ss
        dew =dew_point(weather["main"]["temp"],weather["main"]['humidity'])
        data ={
            'City':weather['name'],
            "Timestamp" :timestamp,
            "Weather": weather["weather"][0]["description"],
            "Temperature": str(weather["main"]["temp"]) + " °C",
            "Humidity": str(weather["main"]['humidity']) +" %",
            "Feels Like": str(weather['main']['feels_like'])+" °C",
            "Dew Point":str(dew) + ' °C',
            "Pressure":weather["main"]['pressure'] ,
            "Wind Speed":str(weather['wind']['speed'])+" m/s",
            "Cloudy":str(weather['clouds']['all'])+' %',
            "Visibility": str(round((weather['visibility']/1000 ),2)) +' Km'
        }
        return data
    
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Weather API error: {e}")




