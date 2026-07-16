# treatment.py

from fastapi import APIRouter, HTTPException
from pathlib import Path
import json
from .risk import analyze_disease_risk

# =====================
router = APIRouter(
    prefix="/treatment",
    tags=["Treatment"]
)

# Load treatment data once when the server starts
BASE_DIR = Path(__file__).resolve().parent.parent
JSON_PATH = BASE_DIR / "data" / "treatment.json"

try:
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        treatment_data = json.load(f)
except Exception as e:
    treatment_data = {}
    print(f"Error loading treatment.json: {e}")


@router.get("/")
async def get_all_treatments():
    """
    Get all disease treatments
    """
    return {
        "success": True,
        "count": len(treatment_data),
        "data": treatment_data
    }



@router.get("/{disease_name}")
async def get_treatment(disease_name: str):

    disease_key = disease_name.lower().replace(" ", "_")

    if disease_key not in treatment_data:
        raise HTTPException(
            status_code=404,
            detail=f"Treatment data not found for '{disease_key}'"
        )

    risk_data = analyze_disease_risk(disease_name)

    risk_key = risk_data["risk_level"].lower().replace(" ", "_")

    disease_info = treatment_data[disease_key]

    risk_treatment = disease_info.get(risk_key, {})

    return {
        "disease": disease_name,
        "risk_level": risk_data["risk_level"],
        "average_risk_score": risk_data["average_risk_score"],
        "critical_period": risk_data["critical_period"],
        "weather_based_treatment": risk_treatment,
        "preventive_measures": disease_info.get(
            "preventive_measures", []
        ),
        "resistant_varieties": disease_info.get(
            "resistant_varieties", []
        )
    }
    
