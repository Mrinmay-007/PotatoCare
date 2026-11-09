

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  SafeAreaView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import useTranslate from "../hooks/useTranslate";
import styles from "../styles/DiagnoseStyle";

const BASE_URL = "https://modelapi.fastapicloud.dev";
const INSIGHTS_BASE_URL = "https://server-511b3f14.fastapicloud.dev";

// Minimum confidence required to accept the /detect/ result as "this is a potato leaf"
const POTATO_CONFIDENCE_THRESHOLD = 0.5;

// Translates dynamic strings coming from the API (disease names, severities,
// treatment text, preventive measures, weather conditions, etc). These can't
// be translated with the top-level useTranslate() calls below because their
// values aren't known until after the API responds. Hooks can't be called
// inside .map() loops directly, so this wrapper component gives each dynamic
// string its own stable hook call instead.
const TranslatedText = ({ children, style, numberOfLines }) => {
  const translated = useTranslate(children);
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {translated}
    </Text>
  );
};

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
  Healthy: {
    color: "#2E7D32",
    icon: "checkmark-circle",
    bg: "#E8F5E9",
  },
  "Early Blight": {
    color: "#E8590C",
    icon: "warning",
    bg: "#FFF3E0",
  },
  "Late Blight": {
    color: "#D0021B",
    icon: "alert-circle",
    bg: "#FFEBEE",
  },
};

export default function DiagnoseScreen() {
  const diagnoseTitle = useTranslate("Diagnose Screen");
  const selectPhotoLabel = useTranslate("Select a Photo");
  const takePhotoLabel = useTranslate("Take Photo");
  const chooseFromGalleryLabel = useTranslate("Choose from Gallery");
  const analyzeLabel = useTranslate("Analyze Leaf");
  const resetLabel = useTranslate("Scan Another Leaf");
  const notPotatoLabel = useTranslate(
    "This does not appear to be a potato leaf. Please try again with a clearer photo of a potato leaf."
  );
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
  const savedLabel = useTranslate("Diagnosis Saved");
  const saveErrorLabel = useTranslate("Could not save diagnosis. Please try again.");
  const loadingInsightsLabel = useTranslate("Fetching treatment & weather insights...");
  const loginRequiredLabel = useTranslate("Please login first.");
  const noDiagnosisLabel = useTranslate("No diagnosis available.");

  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(""); // "detecting" | "predicting" | "insights"
  const [result, setResult] = useState(null); // predict response
  const [treatment, setTreatment] = useState(null);
  const [weatherCompat, setWeatherCompat] = useState(null);
  const [error, setError] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // Same user object shape/source as ProfileScreen, so `user_id` here always
  // matches the logged-in account rather than a locally-generated device id.
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const data = await AsyncStorage.getItem("user");
      if (data) {
        setUser(JSON.parse(data));
      }
    } catch (err) {
      console.error("Load user error:", err);
    }
  };

  const resetState = () => {
    setImageUri(null);
    setResult(null);
    setTreatment(null);
    setWeatherCompat(null);
    setError(null);
    setLoading(false);
    setLoadingStage("");
    setSaving(false);
    setSaved(false);
    setSaveError(false);
  };

  const requestPermission = async (type) => {
    const { status } =
      type === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        `Please allow access to your ${
          type === "camera" ? "camera" : "photo library"
        } to continue.`
      );
      return false;
    }
    return true;
  };

  const pickImage = async (fromCamera) => {
    const hasPermission = await requestPermission(
      fromCamera ? "camera" : "library"
    );
    if (!hasPermission) return;

    const pickerResult = fromCamera
      ? await ImagePicker.launchCameraAsync({
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        });

    if (!pickerResult.canceled && pickerResult.assets?.length > 0) {
      setResult(null);
      setTreatment(null);
      setWeatherCompat(null);
      setError(null);
      setSaved(false);
      setSaveError(false);
      setImageUri(pickerResult.assets[0].uri);
    }
  };

  const buildFormData = (uri) => {
    const filename = uri.split("/").pop() || "leaf.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : "jpg";
    const mimeType = ext === "png" ? "image/png" : "image/jpeg";

    const formData = new FormData();
    formData.append("file", {
      uri,
      name: filename,
      type: mimeType,
    });
    return formData;
  };

  // Fetch treatment recommendations for a given disease class
  const fetchTreatment = async (diseaseClass) => {
    try {
      const diseaseParam = encodeURIComponent(diseaseClass.toLowerCase());
      const res = await fetch(
        `${INSIGHTS_BASE_URL}/treatment/${diseaseParam}`,
        { headers: { accept: "application/json" } }
      );
      if (!res.ok) throw new Error("Treatment request failed");
      const data = await res.json();
      setTreatment(data);
    } catch (err) {
      console.error("Treatment fetch error:", err);
      setTreatment(null);
    }
  };

  // Fetch weather compatibility/risk forecast for a given disease class
  const fetchWeatherCompatibility = async (diseaseClass) => {
    try {
      const leafParam = encodeURIComponent(diseaseClass.toLowerCase());
      const res = await fetch(
        `${INSIGHTS_BASE_URL}/weather/compatible?leaf=${leafParam}`,
        { headers: { accept: "application/json" } }
      );
      if (!res.ok) throw new Error("Weather compatibility request failed");
      const data = await res.json();
      setWeatherCompat(data);
    } catch (err) {
      console.error("Weather compatibility fetch error:", err);
      setWeatherCompat(null);
    }
  };

  const analyzeLeaf = async () => {
    if (!imageUri) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setTreatment(null);
    setWeatherCompat(null);
    setSaved(false);
    setSaveError(false);

    try {
      // Step 1: /detect/ - verify the uploaded image is a potato leaf
      setLoadingStage("detecting");
      const detectFormData = buildFormData(imageUri);
      const detectResponse = await fetch(`${BASE_URL}/detect/`, {
        method: "POST",
        headers: { accept: "application/json" },
        body: detectFormData,
      });

      if (!detectResponse.ok) {
        throw new Error("Detection request failed");
      }

      const detectData = await detectResponse.json();
      const isPotato =
        detectData?.label?.toLowerCase() === "potato" &&
        detectData?.confidence >= POTATO_CONFIDENCE_THRESHOLD;

      if (!isPotato) {
        setError({ type: "not_potato" });
        setLoading(false);
        setLoadingStage("");
        return;
      }

      // Step 2: /predict/ - classify the disease
      setLoadingStage("predicting");
      const predictFormData = buildFormData(imageUri);
      const predictResponse = await fetch(`${BASE_URL}/predict/`, {
        method: "POST",
        headers: { accept: "application/json" },
        body: predictFormData,
      });

      if (!predictResponse.ok) {
        throw new Error("Prediction request failed");
      }

      const predictData = await predictResponse.json();
      setResult(predictData);

      // Step 3: fetch treatment + weather compatibility insights in parallel
      if (predictData?.class) {
        setLoadingStage("insights");
        await Promise.all([
          fetchTreatment(predictData.class),
          fetchWeatherCompatibility(predictData.class),
        ]);
      }
    } catch (err) {
      console.error("Diagnose error:", err);
      setError({ type: "generic" });
    } finally {
      setLoading(false);
      setLoadingStage("");
    }
  };

  const handleSaveLog = async () => {
    if (!result) {
      Alert.alert("Error", noDiagnosisLabel);
      return;
    }

    // Same user_id source as ProfileScreen (AsyncStorage "user" object),
    // so saved logs line up with the logged-in account.
    if (!user || !user.user_id) {
      Alert.alert("Error", loginRequiredLabel);
      return;
    }

    setSaving(true);
    setSaveError(false);
    setSaved(false);

    try {
      const payload = {
        user_id: user.user_id,
        predicted_class: result.class,
        confidence: Number(result.confidence ?? 0),
        severity: result.severity ?? "",
        ratio: Number(result.infected_ratio ?? 0),
      };

      const response = await fetch(`${INSIGHTS_BASE_URL}/log/save`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          responseData.detail ||
            responseData.message ||
            "Failed to save diagnosis."
        );
      }

      setSaved(true);
      Alert.alert("Success", "Diagnosis saved successfully.");
    } catch (err) {
      console.error("Save log error:", err);
      setSaveError(true);
      Alert.alert("Save Failed", err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const meta = result ? DISEASE_META[result.class] : null;
  const severityColor = result
    ? SEVERITY_COLORS[result.severity] || "#616161"
    : "#616161";
  const riskColor = weatherCompat
    ? RISK_COLORS[weatherCompat.risk_level] || "#616161"
    : "#616161";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>🌿 {diagnoseTitle}</Text>

        {/* Image preview / placeholder */}
        <View style={styles.imageWrapper}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.image} />

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setImageUri(null);
                  setResult(null);
                  setTreatment(null);
                  setWeatherCompat(null);
                  setError(null);
                  setSaved(false);
                  setSaveError(false);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="leaf-outline" size={48} color="#9E9E9E" />
              <Text style={styles.placeholderText}>{selectPhotoLabel}</Text>
            </View>
          )}
        </View>

        {/* Image source buttons */}
        {!loading && !result && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => pickImage(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={20} color="#2E7D32" />
              <Text style={styles.secondaryButtonText}>{takePhotoLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => pickImage(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="images-outline" size={20} color="#2E7D32" />
              <Text style={styles.secondaryButtonText}>
                {chooseFromGalleryLabel}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Analyze button */}
        {imageUri && !loading && !result && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={analyzeLeaf}
            activeOpacity={0.85}
          >
            <Ionicons name="scan-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>{analyzeLabel}</Text>
          </TouchableOpacity>
        )}

        {/* Loading state */}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>
              {loadingStage === "detecting"
                ? "Checking leaf type..."
                : loadingStage === "predicting"
                ? analyzingLabel
                : loadingStage === "insights"
                ? loadingInsightsLabel
                : analyzingLabel}
            </Text>
          </View>
        )}

        {/* Error: not a potato leaf */}
        {error?.type === "not_potato" && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={28} color="#D0021B" />
            <Text style={styles.errorText}>{notPotatoLabel}</Text>
          </View>
        )}

        {/* Error: generic failure */}
        {error?.type === "generic" && (
          <View style={styles.errorBox}>
            <Ionicons name="cloud-offline-outline" size={28} color="#D0021B" />
            <Text style={styles.errorText}>{errorLabel}</Text>
          </View>
        )}

        {/* Result card */}
        {result && meta && (
          <View style={[styles.resultCard, { backgroundColor: meta.bg }]}>
            <View style={styles.resultHeader}>
              <Ionicons name={meta.icon} size={32} color={meta.color} />
              <TranslatedText
                style={[styles.resultTitle, { color: meta.color }]}
              >
                {result.class}
              </TranslatedText>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{confidenceLabel}</Text>
              <Text style={styles.resultValue}>
                {result.confidence?.toFixed(2)}%
              </Text>
            </View>

            {result.severity && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{severityLabel}</Text>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: severityColor },
                  ]}
                >
                  <TranslatedText style={styles.severityBadgeText}>
                    {result.severity}
                  </TranslatedText>
                </View>
              </View>
            )}

            {typeof result.infected_ratio === "number" && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{infectedAreaLabel}</Text>
                <Text style={styles.resultValue}>
                  {result.infected_ratio.toFixed(2)}%
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Treatment card */}
        {result && treatment && (
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="medkit-outline" size={22} color="#2E7D32" />
              <Text style={styles.infoCardTitle}>{treatmentTitleLabel}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{riskLevelLabel}</Text>
              <View
                style={[
                  styles.severityBadge,
                  {
                    backgroundColor:
                      RISK_COLORS[treatment.risk_level] || "#616161",
                  },
                ]}
              >
                <TranslatedText style={styles.severityBadgeText}>
                  {treatment.risk_level}
                </TranslatedText>
              </View>
            </View>

            {typeof treatment.average_risk_score === "number" && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{avgRiskLabel}</Text>
                <Text style={styles.resultValue}>
                  {treatment.average_risk_score}
                </Text>
              </View>
            )}

            {treatment.critical_period && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{criticalPeriodLabel}</Text>
                <TranslatedText style={styles.resultValue}>
                  {treatment.critical_period}
                </TranslatedText>
              </View>
            )}

            {treatment.weather_based_treatment && (
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>
                  {weatherConditionLabel}
                </Text>
                <TranslatedText style={styles.subSectionText}>
                  {treatment.weather_based_treatment.weather_condition}
                </TranslatedText>

                {Array.isArray(
                  treatment.weather_based_treatment.treatment
                ) &&
                  treatment.weather_based_treatment.treatment.map(
                    (item, idx) => (
                      <View key={`wt-${idx}`} style={styles.bulletRow}>
                        <Text style={styles.bulletDot}>•</Text>
                        <TranslatedText style={styles.bulletText}>
                          {item}
                        </TranslatedText>
                      </View>
                    )
                  )}
              </View>
            )}

            {Array.isArray(treatment.preventive_measures) &&
              treatment.preventive_measures.length > 0 && (
                <View style={styles.subSection}>
                  <Text style={styles.subSectionTitle}>
                    {preventiveMeasuresLabel}
                  </Text>
                  {treatment.preventive_measures.map((item, idx) => (
                    <View key={`pm-${idx}`} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <TranslatedText style={styles.bulletText}>
                        {item}
                      </TranslatedText>
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
              <Ionicons name="rainy-outline" size={22} color="#2E7D32" />
              <Text style={styles.infoCardTitle}>
                {weatherCompatTitleLabel}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{riskLevelLabel}</Text>
              <View
                style={[styles.severityBadge, { backgroundColor: riskColor }]}
              >
                <TranslatedText style={styles.severityBadgeText}>
                  {weatherCompat.risk_level}
                </TranslatedText>
              </View>
            </View>

            {typeof weatherCompat.average_risk_score === "number" && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{avgRiskLabel}</Text>
                <Text style={styles.resultValue}>
                  {weatherCompat.average_risk_score}
                </Text>
              </View>
            )}

            {weatherCompat.critical_period && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{criticalPeriodLabel}</Text>
                <TranslatedText style={styles.resultValue}>
                  {weatherCompat.critical_period}
                </TranslatedText>
              </View>
            )}
          </View>
        )}

        {/* Save button */}
        {result && !saved && (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              saving && styles.primaryButtonDisabled,
            ]}
            onPress={handleSaveLog}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="save-outline" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.primaryButtonText}>
              {saving ? loadingInsightsLabel : saveLabel}
            </Text>
          </TouchableOpacity>
        )}

        {/* Saved confirmation */}
        {saved && (
          <View style={styles.savedBox}>
            <Ionicons name="checkmark-circle" size={22} color="#2E7D32" />
            <Text style={styles.savedText}>{savedLabel}</Text>
          </View>
        )}

        {/* Save error */}
        {saveError && (
          <View style={styles.errorBox}>
            <Ionicons name="cloud-offline-outline" size={28} color="#D0021B" />
            <Text style={styles.errorText}>{saveErrorLabel}</Text>
          </View>
        )}

        {/* Reset button */}
        {(result || error) && (
          <TouchableOpacity
            style={styles.secondaryFullButton}
            onPress={resetState}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh-outline" size={20} color="#2E7D32" />
            <Text style={styles.secondaryButtonText}>{resetLabel}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}