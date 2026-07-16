

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import baseURL from "../services/baseURL";
import useTranslate from "../hooks/useTranslate";
import styles from "../styles/TreatmentStyle";

const DISEASE_INFO = {
  "Early Blight": {
    description:
      "Brown spots with concentric rings (target-like) on older leaves, leading to leaf drop.",
    cause: "Fungus Alternaria solani.",
  },
  "Late Blight": {
    description:
      "Dark brown irregular spots on leaves with white fungal growth on undersides. Spreads rapidly in humid conditions.",
    cause: "Fungus-like organism Phytophthora infestans.",
  },
  Healthy: {
    description: "Plant appears healthy with no visible disease symptoms.",
    cause: "No disease detected.",
  },
};

export default function Treatment() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [treatments, setTreatments] = useState([]);
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [expandedDisease, setExpandedDisease] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // --- Translated UI strings (auto language via useTranslate, same as Logbook) ---
  const screenTitle = useTranslate("Treatment Guide");
  const screenSubtitle = useTranslate("Tap a card to view detailed treatment");
  const detailsLabel = useTranslate("Details");
  const closeLabel = useTranslate("Close");
  const descriptionLabel = useTranslate("Description");
  const causeLabel = useTranslate("Cause");
  const treatmentOptionsLabel = useTranslate("Treatment Options");
  const organicLabel = useTranslate("Organic");
  const chemicalLabel = useTranslate("Chemical");
  const riskLevelLabel = useTranslate("Risk Level");
  const scoreLabel = useTranslate("Score");
  const criticalPeriodLabel = useTranslate("Critical Period");
  const weatherTreatmentLabel = useTranslate("Weather-Based Treatment");
  const preventiveLabel = useTranslate("Preventive Measures");
  const resistantLabel = useTranslate("Resistant Varieties");
  const loadingTreatmentsText = useTranslate("Loading treatments...");
  const loadingDetailsText = useTranslate("Loading details...");
  const noTreatmentsTitle = useTranslate("No Treatments Available");
  const noTreatmentsText = useTranslate(
    "Unable to load treatment data from the server."
  );
  const retryLabel = useTranslate("Retry");
  const diseasesStatLabel = useTranslate("Diseases");
  const organicStatLabel = useTranslate("Organic");
  const chemicalStatLabel = useTranslate("Chemical");
  const chatbotTitle = useTranslate("AI Plant Doctor");
  const chatbotText = useTranslate(
    "Ask me anything about plant diseases, treatments, or prevention tips."
  );
  const startChatLabel = useTranslate("Start Chat");
  const errorTitle = useTranslate("Error");
  const errorFetchTreatments = useTranslate(
    "Could not fetch treatment data from server."
  );
  const errorNoData = useTranslate("No treatment data available from the server.");

  const fetchTreatments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseURL}/treatment/`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const data = await response.json();

      if (data.success && data.data) {
        const mainDiseases = ["early_blight", "late_blight", "healthy"];
        const formattedData = Object.keys(data.data)
          .filter((key) => mainDiseases.includes(key.toLowerCase()))
          .map((key, index) => {
            const diseaseData = data.data[key];
            const diseaseName = key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase());
            const diseaseInfo = DISEASE_INFO[diseaseName] || {};
            return {
              id: index + 1,
              name: diseaseName,
              disease_key: key,
              description: diseaseInfo.description || "No description available.",
              cause: diseaseInfo.cause || "Unknown cause.",
              preventive_measures: diseaseData.preventive_measures || [],
              resistant_varieties: diseaseData.resistant_varieties || [],
            };
          });
        setTreatments(formattedData);
      } else {
        Alert.alert(errorTitle, errorNoData);
        setTreatments([]);
      }
    } catch (error) {
      console.error("Error fetching treatments:", error);
      Alert.alert(errorTitle, errorFetchTreatments);
      setTreatments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDiseaseTreatment = async (diseaseName) => {
    if (expandedDisease === diseaseName) {
      setExpandedDisease(null);
      setSelectedDisease(null);
      return;
    }
    try {
      setDetailLoading(true);
      const response = await fetch(
        `${baseURL}/treatment/${encodeURIComponent(diseaseName)}`,
        { method: "GET", headers: { Accept: "application/json" } }
      );
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const data = await response.json();

      const diseaseInfo = DISEASE_INFO[diseaseName] || {};
      if (!data.description) data.description = diseaseInfo.description || "";
      if (!data.cause) data.cause = diseaseInfo.cause || "";

      setSelectedDisease(data);
      setExpandedDisease(diseaseName);
    } catch (error) {
      console.error("Error fetching disease treatment:", error);
      Alert.alert(errorTitle, error.message);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchTreatments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTreatments();
  };

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case "critical":
        return "#d32f2f";
      case "high":
        return "#f44336";
      case "moderate":
        return "#FF9800";
      case "low":
        return "#4CAF50";
      case "very low":
        return "#2E7D32";
      default:
        return "#666";
    }
  };

  const getRiskBgColor = (level) => {
    switch (level?.toLowerCase()) {
      case "critical":
        return "#ffebee";
      case "high":
        return "#fce4ec";
      case "moderate":
        return "#fff3e0";
      case "low":
      case "very low":
        return "#e8f5e9";
      default:
        return "#f5f5f5";
    }
  };

  const getRiskIcon = (level) => {
    switch (level?.toLowerCase()) {
      case "critical":
      case "high":
        return "alert-circle";
      case "moderate":
        return "warning";
      case "low":
      case "very low":
        return "checkmark-circle";
      default:
        return "information-circle";
    }
  };

  const DetailRow = ({ text }) => {
    const translated = useTranslate(text);
    return <Text style={styles.infoText}>{translated}</Text>;
  };

  const DetailListItem = ({ text, bulletColor }) => {
    const translated = useTranslate(text);
    return (
      <View style={styles.measureItem}>
        <View style={[styles.measureBullet, { backgroundColor: bulletColor }]} />
        <Text style={styles.measureText}>{translated}</Text>
      </View>
    );
  };

  const WeatherEntry = ({ label, value }) => {
    const translatedLabel = useTranslate(
      label.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );
    return (
      <View style={styles.weatherItem}>
        <Text style={styles.weatherItemLabel}>{translatedLabel}</Text>
        {Array.isArray(value) ? (
          <View style={{ gap: 3 }}>
            {value.map((item, i) => (
              <DetailListItem key={i} text={item} bulletColor="#6C63FF" />
            ))}
          </View>
        ) : (
          <DetailRow text={String(value)} />
        )}
      </View>
    );
  };

  const RiskValue = ({ level }) => {
    const translated = useTranslate(level);
    return (
      <Text style={[styles.riskValue, { color: getRiskColor(level) }]}>
        {translated}
      </Text>
    );
  };

  const renderTreatmentDetails = () => {
    if (!selectedDisease || expandedDisease !== selectedDisease.disease) return null;

    return (
      <View style={styles.detailContainer}>
        {selectedDisease.description && (
          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={18} color="#6C63FF" />
              <Text style={styles.sectionTitle}>{descriptionLabel}</Text>
            </View>
            <View style={styles.infoCard}>
              <DetailRow text={selectedDisease.description} />
            </View>
          </View>
        )}

        {selectedDisease.cause && (
          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle-outline" size={18} color="#6C63FF" />
              <Text style={styles.sectionTitle}>{causeLabel}</Text>
            </View>
            <View style={styles.infoCard}>
              <DetailRow text={selectedDisease.cause} />
            </View>
          </View>
        )}

        {selectedDisease.risk_level && (
          <View
            style={[
              styles.riskCard,
              { backgroundColor: getRiskBgColor(selectedDisease.risk_level) },
            ]}
          >
            <View style={styles.riskRow}>
              <View style={styles.riskIconContainer}>
                <Ionicons
                  name={getRiskIcon(selectedDisease.risk_level)}
                  size={24}
                  color={getRiskColor(selectedDisease.risk_level)}
                />
              </View>
              <View style={styles.riskInfo}>
                <Text style={styles.riskLabel}>{riskLevelLabel}</Text>
                <RiskValue level={selectedDisease.risk_level} />
              </View>
              {selectedDisease.average_risk_score !== undefined && (
                <View style={styles.riskScore}>
                  <Text style={styles.riskScoreLabel}>{scoreLabel}</Text>
                  <Text style={styles.riskScoreValue}>
                    {selectedDisease.average_risk_score}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {selectedDisease.critical_period && (
          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={18} color="#6C63FF" />
              <Text style={styles.sectionTitle}>{criticalPeriodLabel}</Text>
            </View>
            <View style={styles.periodCard}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <View style={{ flex: 1 }}>
                <DetailRow text={selectedDisease.critical_period} />
              </View>
            </View>
          </View>
        )}

        {selectedDisease.weather_based_treatment &&
          Object.keys(selectedDisease.weather_based_treatment).length > 0 && (
            <View style={styles.detailSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="cloud-outline" size={18} color="#6C63FF" />
                <Text style={styles.sectionTitle}>{weatherTreatmentLabel}</Text>
              </View>
              <View style={styles.weatherCard}>
                {Object.entries(selectedDisease.weather_based_treatment).map(
                  ([key, value]) => (
                    <WeatherEntry key={key} label={key} value={value} />
                  )
                )}
              </View>
            </View>
          )}

        {selectedDisease.preventive_measures &&
          selectedDisease.preventive_measures.length > 0 && (
            <View style={styles.detailSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#6C63FF" />
                <Text style={styles.sectionTitle}>{preventiveLabel}</Text>
              </View>
              <View style={styles.measuresCard}>
                {selectedDisease.preventive_measures.map((measure, index) => (
                  <DetailListItem key={index} text={measure} bulletColor="#4CAF50" />
                ))}
              </View>
            </View>
          )}

        {selectedDisease.resistant_varieties &&
          selectedDisease.resistant_varieties.length > 0 && (
            <View style={styles.detailSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="leaf-outline" size={18} color="#6C63FF" />
                <Text style={styles.sectionTitle}>{resistantLabel}</Text>
              </View>
              <View style={styles.varietiesCard}>
                {selectedDisease.resistant_varieties.map((variety, index) => (
                  <DetailListItem key={index} text={variety} bulletColor="#6C63FF" />
                ))}
              </View>
            </View>
          )}
      </View>
    );
  };

  const DiseaseCardTitle = ({ name }) => {
    const translated = useTranslate(name);
    return <Text style={styles.cardTitle}>{translated}</Text>;
  };

  const renderDiseaseCard = (item) => {
    const isExpanded = expandedDisease === item.name;
    const isLoading = isExpanded && detailLoading;

    return (
      <TouchableOpacity
        style={[styles.card, isExpanded && styles.cardExpanded]}
        onPress={() => fetchDiseaseTreatment(item.name)}
        activeOpacity={0.9}
        key={item.id}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <DiseaseCardTitle name={item.name} />
            <View style={[styles.cardBadge, isExpanded && styles.cardBadgeExpanded]}>
              <Text style={styles.cardBadgeText}>
                {isExpanded ? `▲ ${closeLabel}` : `▼ ${detailsLabel}`}
              </Text>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up-circle" : "chevron-down-circle"}
            size={28}
            color={isExpanded ? "#6C63FF" : "#4CAF50"}
          />
        </View>

        {!isExpanded && (
          <View style={styles.cardBody}>
            <View style={styles.cardInfoRow}>
              <Ionicons name="document-text-outline" size={14} color="#888" />
              <Text style={styles.cardInfoLabel}>{descriptionLabel}</Text>
            </View>
            <View style={{ paddingLeft: 20 }}>
              <DetailRow text={item.description} />
            </View>

            <View style={styles.cardInfoRow}>
              <Ionicons name="alert-circle-outline" size={14} color="#888" />
              <Text style={styles.cardInfoLabel}>{causeLabel}</Text>
            </View>
            <View style={{ paddingLeft: 20 }}>
              <DetailRow text={item.cause} />
            </View>

            <View style={styles.treatmentOptions}>
              <Text style={styles.treatmentOptionsLabel}>{treatmentOptionsLabel}</Text>
              <View style={styles.treatmentOptionsTags}>
                <View style={[styles.tag, styles.organicTag]}>
                  <FontAwesome5 name="leaf" size={12} color="#2e7d32" />
                  <Text style={[styles.tagText, styles.organicTagText]}>
                    {organicLabel}
                  </Text>
                </View>
                <View style={[styles.tag, styles.chemicalTag]}>
                  <FontAwesome5 name="flask" size={12} color="#c62828" />
                  <Text style={[styles.tagText, styles.chemicalTagText]}>
                    {chemicalLabel}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {isExpanded && isLoading && (
          <View style={styles.inlineLoading}>
            <ActivityIndicator size="small" color="#6C63FF" />
            <Text style={styles.loadingText}>{loadingDetailsText}</Text>
          </View>
        )}

        {isExpanded && !isLoading && renderTreatmentDetails()}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>{loadingTreatmentsText}</Text>
      </View>
    );
  }

  if (treatments.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="medical-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>{noTreatmentsTitle}</Text>
        <Text style={styles.emptyText}>{noTreatmentsText}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchTreatments}>
          <LinearGradient
            colors={["#6C63FF", "#5A52D5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.retryGradient}
          >
            <Text style={styles.retryButtonText}>{retryLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6C63FF"]} />
        }
      >
        <LinearGradient
          colors={["#6C63FF", "#8B85FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerContainer}
        >
          <Text style={styles.title}>🌿 {screenTitle}</Text>
          <Text style={styles.subtitle}>{screenSubtitle}</Text>
        </LinearGradient>

        <View style={styles.cardsContainer}>
          {treatments.map((item) => renderDiseaseCard(item))}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#EEF0FF" }]}>
              <Ionicons name="medical-outline" size={20} color="#6C63FF" />
            </View>
            <Text style={styles.statNumber}>{treatments.length}</Text>
            <Text style={styles.statLabel}>{diseasesStatLabel}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#E8F5E9" }]}>
              <Ionicons name="leaf-outline" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.statNumber}>🌱</Text>
            <Text style={styles.statLabel}>{organicStatLabel}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#FFEBEE" }]}>
              <Ionicons name="flask-outline" size={20} color="#f44336" />
            </View>
            <Text style={styles.statNumber}>🧪</Text>
            <Text style={styles.statLabel}>{chemicalStatLabel}</Text>
          </View>
        </View>

        <View style={styles.chatbotContainer}>
          <View style={styles.chatbotHeader}>
            <Text style={styles.chatbotTitle}>🤖 {chatbotTitle}</Text>
            <View style={styles.chatbotBadge}>
              <Text style={styles.chatbotBadgeText}>24/7</Text>
            </View>
          </View>
          <Text style={styles.chatbotSubtext}>{chatbotText}</Text>
          <TouchableOpacity style={styles.chatButton}>
            <LinearGradient
              colors={["#6C63FF", "#5A52D5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.chatGradient}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
              <Text style={styles.chatButtonText}>{startChatLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

