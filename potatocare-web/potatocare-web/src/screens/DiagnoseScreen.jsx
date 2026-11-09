import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, Image, Touchable, ScrollView, Spinner, notify } from "../components/ui";
import { TText } from "../components/T";
import Icon from "../components/Icon";
import api, { mlApi, errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import useTranslate from "../hooks/useTranslate";
import { prepareImage } from "../utils/image";
import styles from "../styles/DiagnoseStyle";
import { sx } from "../utils/rn";

// Minimum confidence required to accept the /detect/ result as "this is a potato leaf"
const POTATO_CONFIDENCE_THRESHOLD = 0.5;

const SEVERITY_COLORS = {
  Mild: "#F5A623",
  Moderate: "#E8590C",
  Severe: "#D0021B",
  Healthy: "#2E7D32",
};

const RISK_COLORS = {
  Low: "#2E7D32",
  Moderate: "#E8590C",
  High: "#D0021B",
};

const DISEASE_META = {
  Healthy: { color: "#2E7D32", icon: "checkmark-circle", bg: "#E8F5E9" },
  "Early Blight": { color: "#E8590C", icon: "warning", bg: "#FFF3E0" },
  "Late Blight": { color: "#D0021B", icon: "alert-circle", bg: "#FFEBEE" },
};
// Unknown class from the model: still show the result instead of hiding the whole card.
const FALLBACK_META = { color: "#616161", icon: "information-circle", bg: "#F5F5F5" };

const fmt = (n) => (Number.isFinite(Number(n)) ? Number(n).toFixed(2) : "–");

export default function DiagnoseScreen() {
  const { user } = useAuth();

  const diagnoseTitle = useTranslate("Diagnose Screen");
  const selectPhotoLabel = useTranslate("Select a Photo");
  const takePhotoLabel = useTranslate("Take Photo");
  const chooseFromGalleryLabel = useTranslate("Choose from Gallery");
  const analyzeLabel = useTranslate("Analyze Leaf");
  const resetLabel = useTranslate("Scan Another Leaf");
  const notPotatoLabel = useTranslate(
    "This does not appear to be a potato leaf. Please try again with a clearer photo of a potato leaf."
  );
  const checkingLeafLabel = useTranslate("Checking leaf type...");
  const analyzingLabel = useTranslate("Analyzing leaf image...");
  const errorLabel = useTranslate("Something went wrong. Please try again.");
  const confidenceLabel = useTranslate("Confidence");
  const severityLabel = useTranslate("Severity");
  const infectedAreaLabel = useTranslate("Infected Area");
  const treatmentTitleLabel = useTranslate("Recommended Treatment");
  const riskLevelLabel = useTranslate("Risk Level");
  const criticalPeriodLabel = useTranslate("Critical Period");
  const weatherConditionLabel = useTranslate("Weather Condition");
  const preventiveMeasuresLabel = useTranslate("Preventive Measures");
  const weatherCompatTitleLabel = useTranslate("Weather Risk Forecast");
  const avgRiskLabel = useTranslate("Average Risk Score");
  const saveLabel = useTranslate("Save Diagnosis");
  const savingLabel = useTranslate("Saving diagnosis...");
  const savedLabel = useTranslate("Diagnosis Saved");
  const saveErrorLabel = useTranslate("Could not save diagnosis. Please try again.");
  const loadingInsightsLabel = useTranslate("Fetching treatment & weather insights...");
  const loginRequiredLabel = useTranslate("Please login first.");
  const noDiagnosisLabel = useTranslate("No diagnosis available.");
  const errorTitle = useTranslate("Error");
  const successTitle = useTranslate("Success");
  const savedMessage = useTranslate("Diagnosis saved successfully.");
  const saveFailedTitle = useTranslate("Save Failed");

  const [image, setImage] = useState(null); // { url, blob }
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(""); // "detecting" | "predicting" | "insights"
  const [result, setResult] = useState(null);
  const [treatment, setTreatment] = useState(null);
  const [weatherCompat, setWeatherCompat] = useState(null);
  const [error, setError] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const galleryRef = useRef(null);
  const cameraRef = useRef(null);
  const abortRef = useRef(null);

  // Free the preview blob URL when it is replaced / on unmount (it leaked before),
  // and cancel any request still running when the user leaves the screen.
  useEffect(() => {
    return () => {
      if (image?.url) URL.revokeObjectURL(image.url);
    };
  }, [image]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const clearResults = useCallback(() => {
    setResult(null);
    setTreatment(null);
    setWeatherCompat(null);
    setError(null);
    setSaved(false);
    setSaveError(false);
  }, []);

  const removeImage = () => {
    abortRef.current?.abort();
    setImage(null);
    setLoading(false);
    setLoadingStage("");
    clearResults();
  };

  const resetState = () => {
    removeImage();
    setSaving(false);
  };

  const onFileChosen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    try {
      const blob = await prepareImage(file);
      clearResults();
      setImage({ url: URL.createObjectURL(blob), blob });
    } catch {
      setError({ type: "generic" });
    }
  };

  const buildFormData = (blob) => {
    const formData = new FormData();
    formData.append("file", blob, "leaf.jpg");
    return formData;
  };

  const analyzeLeaf = async () => {
    if (!image || loading) return;

    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    setLoading(true);
    clearResults();

    try {
      // Step 1: /detect/ - verify the uploaded image is a potato leaf
      setLoadingStage("detecting");
      const { data: detectData } = await mlApi.post("/detect/", buildFormData(image.blob), { signal });

      // Backend may report confidence as 0-1 or 0-100; normalise before comparing.
      const rawConf = Number(detectData?.confidence);
      const conf01 = rawConf > 1 ? rawConf / 100 : rawConf;
      const isPotato =
        detectData?.label?.toLowerCase() === "potato" && conf01 >= POTATO_CONFIDENCE_THRESHOLD;

      if (!isPotato) {
        setError({ type: "not_potato" });
        return;
      }

      // Step 2: /predict/ - classify the disease
      setLoadingStage("predicting");
      const { data: predictData } = await mlApi.post("/predict/", buildFormData(image.blob), { signal });
      setResult(predictData);

      // Step 3: treatment + weather compatibility in parallel (same routes as before)
      if (predictData?.class) {
        setLoadingStage("insights");
        const disease = predictData.class.toLowerCase();
        const [treatmentRes, weatherRes] = await Promise.allSettled([
          api.get(`/treatment/${encodeURIComponent(disease)}`, { signal }),
          api.get("/weather/compatible", { params: { leaf: disease }, signal }),
        ]);
        if (treatmentRes.status === "fulfilled") setTreatment(treatmentRes.value.data);
        if (weatherRes.status === "fulfilled") setWeatherCompat(weatherRes.value.data);
      }
    } catch (err) {
      if (signal.aborted) return;
      console.error("Diagnose error:", err);
      setError({ type: "generic" });
    } finally {
      if (!signal.aborted) {
        setLoading(false);
        setLoadingStage("");
      }
    }
  };

  const handleSaveLog = async () => {
    if (!result) {
      notify(errorTitle, noDiagnosisLabel);
      return;
    }
    if (!user?.user_id) {
      notify(errorTitle, loginRequiredLabel);
      return;
    }

    setSaving(true);
    setSaveError(false);
    setSaved(false);

    try {
      await api.post("/log/save", {
        user_id: user.user_id,
        predicted_class: result.class,
        confidence: Number(result.confidence ?? 0),
        severity: result.severity ?? "",
        ratio: Number(result.infected_ratio ?? 0),
      });

      setSaved(true);
      notify(successTitle, savedMessage);
    } catch (err) {
      console.error("Save log error:", err);
      setSaveError(true);
      notify(saveFailedTitle, errorMessage(err, "Something went wrong."));
    } finally {
      setSaving(false);
    }
  };

  const meta = result ? DISEASE_META[result.class] || FALLBACK_META : null;
  const severityColor = result ? SEVERITY_COLORS[result.severity] || "#616161" : "#616161";
  const riskColor = weatherCompat ? RISK_COLORS[weatherCompat.risk_level] || "#616161" : "#616161";

  const loadingText =
    loadingStage === "detecting"
      ? checkingLeafLabel
      : loadingStage === "insights"
      ? loadingInsightsLabel
      : analyzingLabel;

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🌿 {diagnoseTitle}</Text>

        {/* Hidden file inputs: gallery + camera (camera opens on phones) */}
        <input ref={galleryRef} type="file" accept="image/*" hidden onChange={onFileChosen} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onFileChosen} />

        {/* Image preview / placeholder */}
        <View style={styles.imageWrapper}>
          {image ? (
            <>
              <Image src={image.url} alt="Selected leaf" style={styles.image} />
              <Touchable style={styles.closeButton} onPress={removeImage} activeOpacity={0.8} aria-label="Remove photo">
                <Icon name="close" size={20} color="#FFFFFF" />
              </Touchable>
            </>
          ) : (
            <View style={styles.placeholder}>
              <Icon name="leaf-outline" size={48} color="#9E9E9E" />
              <Text style={styles.placeholderText}>{selectPhotoLabel}</Text>
            </View>
          )}
        </View>

        {/* Image source buttons */}
        {!loading && !result && (
          <View style={styles.buttonRow}>
            <Touchable style={styles.secondaryButton} onPress={() => cameraRef.current?.click()} activeOpacity={0.8}>
              <Icon name="camera-outline" size={20} color="#2E7D32" />
              <Text style={styles.secondaryButtonText}>{takePhotoLabel}</Text>
            </Touchable>

            <Touchable style={styles.secondaryButton} onPress={() => galleryRef.current?.click()} activeOpacity={0.8}>
              <Icon name="images-outline" size={20} color="#2E7D32" />
              <Text style={styles.secondaryButtonText}>{chooseFromGalleryLabel}</Text>
            </Touchable>
          </View>
        )}

        {/* Analyze button */}
        {image && !loading && !result && (
          <Touchable style={styles.primaryButton} onPress={analyzeLeaf} activeOpacity={0.85}>
            <Icon name="scan-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>{analyzeLabel}</Text>
          </Touchable>
        )}

        {/* Loading state */}
        {loading && (
          <View style={styles.loadingBox}>
            <Spinner size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        )}

        {/* Error: not a potato leaf */}
        {error?.type === "not_potato" && (
          <View style={styles.errorBox}>
            <Icon name="alert-circle-outline" size={28} color="#D0021B" />
            <Text style={styles.errorText}>{notPotatoLabel}</Text>
          </View>
        )}

        {/* Error: generic failure */}
        {error?.type === "generic" && (
          <View style={styles.errorBox}>
            <Icon name="cloud-offline-outline" size={28} color="#D0021B" />
            <Text style={styles.errorText}>{errorLabel}</Text>
          </View>
        )}

        {/* Result card */}
        {result && meta && (
          <View style={sx(styles.resultCard, { backgroundColor: meta.bg })}>
            <View style={styles.resultHeader}>
              <Icon name={meta.icon} size={32} color={meta.color} />
              <TText style={sx(styles.resultTitle, { color: meta.color })}>{result.class}</TText>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{confidenceLabel}</Text>
              <Text style={styles.resultValue}>{fmt(result.confidence)}%</Text>
            </View>

            {result.severity && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{severityLabel}</Text>
                <View style={sx(styles.severityBadge, { backgroundColor: severityColor })}>
                  <TText style={styles.severityBadgeText}>{result.severity}</TText>
                </View>
              </View>
            )}

            {typeof result.infected_ratio === "number" && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{infectedAreaLabel}</Text>
                <Text style={styles.resultValue}>{fmt(result.infected_ratio)}%</Text>
              </View>
            )}
          </View>
        )}

        {/* Treatment card */}
        {result && treatment && (
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Icon name="medkit-outline" size={22} color="#2E7D32" />
              <Text style={styles.infoCardTitle}>{treatmentTitleLabel}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{riskLevelLabel}</Text>
              <View
                style={sx(styles.severityBadge, {
                  backgroundColor: RISK_COLORS[treatment.risk_level] || "#616161",
                })}
              >
                <TText style={styles.severityBadgeText}>{treatment.risk_level}</TText>
              </View>
            </View>

            {typeof treatment.average_risk_score === "number" && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{avgRiskLabel}</Text>
                <Text style={styles.resultValue}>{treatment.average_risk_score}</Text>
              </View>
            )}

            {treatment.critical_period && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{criticalPeriodLabel}</Text>
                <TText style={styles.resultValue}>{treatment.critical_period}</TText>
              </View>
            )}

            {treatment.weather_based_treatment && (
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>{weatherConditionLabel}</Text>
                <TText style={styles.subSectionText}>
                  {treatment.weather_based_treatment.weather_condition}
                </TText>

                {Array.isArray(treatment.weather_based_treatment.treatment) &&
                  treatment.weather_based_treatment.treatment.map((item, idx) => (
                    <View key={`wt-${idx}`} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <TText style={styles.bulletText}>{item}</TText>
                    </View>
                  ))}
              </View>
            )}

            {Array.isArray(treatment.preventive_measures) && treatment.preventive_measures.length > 0 && (
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>{preventiveMeasuresLabel}</Text>
                {treatment.preventive_measures.map((item, idx) => (
                  <View key={`pm-${idx}`} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <TText style={styles.bulletText}>{item}</TText>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Weather compatibility / risk forecast card */}
        {result && weatherCompat && (
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Icon name="rainy-outline" size={22} color="#2E7D32" />
              <Text style={styles.infoCardTitle}>{weatherCompatTitleLabel}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{riskLevelLabel}</Text>
              <View style={sx(styles.severityBadge, { backgroundColor: riskColor })}>
                <TText style={styles.severityBadgeText}>{weatherCompat.risk_level}</TText>
              </View>
            </View>

            {typeof weatherCompat.average_risk_score === "number" && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{avgRiskLabel}</Text>
                <Text style={styles.resultValue}>{weatherCompat.average_risk_score}</Text>
              </View>
            )}

            {weatherCompat.critical_period && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{criticalPeriodLabel}</Text>
                <TText style={styles.resultValue}>{weatherCompat.critical_period}</TText>
              </View>
            )}
          </View>
        )}

        {/* Save button */}
        {result && !saved && (
          <Touchable
            style={sx(styles.primaryButton, saving && styles.primaryButtonDisabled)}
            onPress={handleSaveLog}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? <Spinner color="#FFFFFF" /> : <Icon name="save-outline" size={20} color="#FFFFFF" />}
            <Text style={styles.primaryButtonText}>{saving ? savingLabel : saveLabel}</Text>
          </Touchable>
        )}

        {/* Saved confirmation */}
        {saved && (
          <View style={styles.savedBox}>
            <Icon name="checkmark-circle" size={22} color="#2E7D32" />
            <Text style={styles.savedText}>{savedLabel}</Text>
          </View>
        )}

        {/* Save error */}
        {saveError && (
          <View style={styles.errorBox}>
            <Icon name="cloud-offline-outline" size={28} color="#D0021B" />
            <Text style={styles.errorText}>{saveErrorLabel}</Text>
          </View>
        )}

        {/* Reset button */}
        {(result || error) && (
          <Touchable style={styles.secondaryFullButton} onPress={resetState} activeOpacity={0.85}>
            <Icon name="refresh-outline" size={20} color="#2E7D32" />
            <Text style={styles.secondaryButtonText}>{resetLabel}</Text>
          </Touchable>
        )}
      </ScrollView>
    </View>
  );
}
