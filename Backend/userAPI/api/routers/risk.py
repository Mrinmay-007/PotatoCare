import statistics
import joblib
from pathlib import Path
import numpy as np
from .weather2 import forecast_input,forecast

from ... import model_loader



def healthy_leaf_score(temp, humidity, rainfall, cloud):
    score = 0

    # High humidity favors disease
    if humidity >= 80:
        score += 35
    elif humidity >= 60:
        score += 20

    # Rainfall increases disease risk
    if rainfall > 0:
        score += 30

    # Dense cloud cover keeps leaves wet longer
    if cloud >= 80:
        score += 20
    elif cloud >= 50:
        score += 10

    # Moderate temperatures favor fungal growth
    if 18 <= temp <= 30:
        score += 15

    return min(score, 100)

def early_blight_score(temp, humidity, rainfall, cloud):
    score = 0

    if 24 <= temp <= 30:
        score += 30

    if humidity >= 60:
        score += 25

    if rainfall > 0:
        score += 25

    if cloud >= 70:
        score += 20

    return score

def late_blight_score(temp, humidity, rainfall, cloud):
    score = 0

    if 10 <= temp <= 25:
        score += 20

    if humidity >= 85:
        score += 35

    if rainfall > 0:
        score += 25

    if cloud >= 80:
        score += 20

    return score

def analyze_disease_risk( leaf):
    forecast_data = forecast()
    scores = []
    max_score = 0
    critical_time = None

    for item in forecast_data["forecast"]:

        temp = float(item["temperature"]["current"].split()[0])
        humidity = float(item["humidity"].replace("%", "").strip())
        rainfall = float(item["rainfall"].split()[0])
        cloud = float(item["cloud_cover"].replace("%", "").strip())

        if leaf.lower() == "early blight":
            score = early_blight_score(
                temp,
                humidity,
                rainfall,
                cloud
            )

        elif leaf.lower() == "late blight":
            score = late_blight_score(
                temp,
                humidity,
                rainfall,
                cloud
            )

        elif leaf.lower() == "healthy":
            score = healthy_leaf_score(
                temp,
                humidity,
                rainfall,
                cloud
            )
           

        scores.append(score)

        if score > max_score:
            max_score = score
            critical_time = item["timestamp"]

    avg_score = round(sum(scores) / len(scores), 2)


    if  avg_score >= 90 :
        risk ='Critical'
    elif avg_score >= 70:
        risk = "High"
    elif avg_score >= 50:
        risk = "Moderate"
    elif avg_score >= 30:
        risk = "Low"
    else :
        risk = 'Very Low'
        
    scores.sort()
    return {
        "disease": leaf,
        "average_risk_score": avg_score,
        "maximum_risk_score": max_score,
        "risk_level": risk,
        "critical_period": critical_time,
        "mode_risk_score": statistics.mode(scores),
        "median_risk_score": statistics.median(scores),
        "forecast_records_analyzed": len(scores)
    }
  


# Example new data (replace with actual new observation)
# Ensure the order of features matches the training data: Temperature, Humidity, Wind Speed, Wind Bearing, Visibility, Pressure
# new_data = np.array([[20.5, 70, 5.0, 150, 10.0, 1015.0]])

def predict_threat():
    data = forecast_input()

    new_data = np.array([[
        data["Temperature"],
        data["Humidity"],
        data["Wind_Speed"],
        data["Wind_Bearing"],
        data["Pressure"]
    ]])

    prediction = int(model_loader.disease_model.predict(new_data)[0])

    threat = "Early Blight" if prediction == 1 else "Late Blight"
    risk = analyze_disease_risk(threat)
    return {
        "status": "success",
        "Disease_Threat": threat,
        "Risk_Level": risk['risk_level']
    }
