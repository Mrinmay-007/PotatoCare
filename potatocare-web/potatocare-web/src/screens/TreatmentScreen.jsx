import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, ScrollView, Touchable, Gradient, Spinner, notify } from "../components/ui";
import Icon from "../components/Icon";
import api, { errorMessage } from "../services/api";
import useTranslate from "../hooks/useTranslate";
import styles from "../styles/TreatmentStyle";
import { sx } from "../utils/rn";

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

const getRiskColor = (level) => {
  switch (level?.toLowerCase()) {
    case "critical": return "#d32f2f";
    case "high": return "#f44336";
    case "moderate": return "#FF9800";
    case "low": return "#4CAF50";
    case "very low": return "#2E7D32";
    default: return "#666";
  }
};

const getRiskBgColor = (level) => {
  switch (level?.toLowerCase()) {
    case "critical": return "#ffebee";
    case "high": return "#fce4ec";
    case "moderate": return "#fff3e0";
    case "low":
    case "very low": return "#e8f5e9";
    default: return "#f5f5f5";
  }
};

const getRiskIcon = (level) => {
  switch (level?.toLowerCase()) {
    case "critical":
    case "high": return "alert-circle";
    case "moderate": return "warning";
    case "low":
    case "very low": return "checkmark-circle";
    default: return "information-circle";
  }
};

// ---- Small translated pieces -------------------------------------------------
// These used to be declared INSIDE the screen component, which gave React a new
// component type on every render: every list item remounted (and re-requested its
// translation) whenever any state changed. They live at module level now.

function DetailRow({ text }) {
  const translated = useTranslate(text);
  return <Text style={styles.infoText}>{translated}</Text>;
}

function DetailListItem({ text, bulletColor }) {
  const translated = useTranslate(text);
  return (
    <View style={styles.measureItem}>
      <View style={sx(styles.measureBullet, { backgroundColor: bulletColor })} />
      <Text style={styles.measureText}>{translated}</Text>
    </View>
  );
}

function WeatherEntry({ label, value }) {
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
}

function RiskValue({ level }) {
  const translated = useTranslate(level);
  return <Text style={sx(styles.riskValue, { color: getRiskColor(level) })}>{translated}</Text>;
}

function DiseaseCardTitle({ name }) {
  const translated = useTranslate(name);
  return <Text style={styles.cardTitle}>{translated}</Text>;
}

function SectionHeader({ icon, children }) {
  return (
    <View style={styles.sectionHeader}>
      <Icon name={icon} size={18} color="#6C63FF" />
      <Text style={styles.sectionTitle}>{children}</Text>
    </View>
  );
}

function TreatmentDetails({ data, labels }) {
  return (
    <View style={styles.detailContainer}>
      {data.description && (
        <View style={styles.detailSection}>
          <SectionHeader icon="document-text-outline">{labels.description}</SectionHeader>
          <View style={styles.infoCard}>
            <DetailRow text={data.description} />
          </View>
        </View>
      )}

      {data.cause && (
        <View style={styles.detailSection}>
          <SectionHeader icon="alert-circle-outline">{labels.cause}</SectionHeader>
          <View style={styles.infoCard}>
            <DetailRow text={data.cause} />
          </View>
        </View>
      )}

      {data.risk_level && (
        <View style={sx(styles.riskCard, { backgroundColor: getRiskBgColor(data.risk_level) })}>
          <View style={styles.riskRow}>
            <View style={styles.riskIconContainer}>
              <Icon name={getRiskIcon(data.risk_level)} size={24} color={getRiskColor(data.risk_level)} />
            </View>
            <View style={styles.riskInfo}>
              <Text style={styles.riskLabel}>{labels.riskLevel}</Text>
              <RiskValue level={data.risk_level} />
            </View>
            {data.average_risk_score !== undefined && (
              <View style={styles.riskScore}>
                <Text style={styles.riskScoreLabel}>{labels.score}</Text>
                <Text style={styles.riskScoreValue}>{data.average_risk_score}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {data.critical_period && (
        <View style={styles.detailSection}>
          <SectionHeader icon="time-outline">{labels.criticalPeriod}</SectionHeader>
          <View style={styles.periodCard}>
            <Icon name="calendar-outline" size={16} color="#666" />
            <View style={{ flex: 1 }}>
              <DetailRow text={data.critical_period} />
            </View>
          </View>
        </View>
      )}

      {data.weather_based_treatment && Object.keys(data.weather_based_treatment).length > 0 && (
        <View style={styles.detailSection}>
          <SectionHeader icon="cloud-outline">{labels.weatherTreatment}</SectionHeader>
          <View style={styles.weatherCard}>
            {Object.entries(data.weather_based_treatment).map(([key, value]) => (
              <WeatherEntry key={key} label={key} value={value} />
            ))}
          </View>
        </View>
      )}

      {data.preventive_measures && data.preventive_measures.length > 0 && (
        <View style={styles.detailSection}>
          <SectionHeader icon="shield-checkmark-outline">{labels.preventive}</SectionHeader>
          <View style={styles.measuresCard}>
            {data.preventive_measures.map((measure, index) => (
              <DetailListItem key={index} text={measure} bulletColor="#4CAF50" />
            ))}
          </View>
        </View>
      )}

      {data.resistant_varieties && data.resistant_varieties.length > 0 && (
        <View style={styles.detailSection}>
          <SectionHeader icon="leaf-outline">{labels.resistant}</SectionHeader>
          <View style={styles.varietiesCard}>
            {data.resistant_varieties.map((variety, index) => (
              <DetailListItem key={index} text={variety} bulletColor="#6C63FF" />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export default function Treatment() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [treatments, setTreatments] = useState([]);
  const [expandedDisease, setExpandedDisease] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  // Cache of GET /treatment/{name} responses so re-opening a card is instant.
  const detailsRef = useRef({});
  const [details, setDetails] = useState({});

  // --- Translated UI strings ---
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
  const noTreatmentsText = useTranslate("Unable to load treatment data from the server.");
  const retryLabel = useTranslate("Retry");
  const diseasesStatLabel = useTranslate("Diseases");
  const organicStatLabel = useTranslate("Organic");
  const chemicalStatLabel = useTranslate("Chemical");
  const chatbotTitle = useTranslate("AI Plant Doctor");
  const chatbotText = useTranslate("Ask me anything about plant diseases, treatments, or prevention tips.");
  const startChatLabel = useTranslate("Start Chat");
  const errorTitle = useTranslate("Error");
  const errorFetchTreatments = useTranslate("Could not fetch treatment data from server.");
  const errorNoData = useTranslate("No treatment data available from the server.");

  const labels = {
    description: descriptionLabel,
    cause: causeLabel,
    riskLevel: riskLevelLabel,
    score: scoreLabel,
    criticalPeriod: criticalPeriodLabel,
    weatherTreatment: weatherTreatmentLabel,
    preventive: preventiveLabel,
    resistant: resistantLabel,
  };

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const fetchTreatments = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/treatment/");

      if (data.success && data.data) {
        const mainDiseases = ["early_blight", "late_blight", "healthy"];
        const formattedData = Object.keys(data.data)
          .filter((key) => mainDiseases.includes(key.toLowerCase()))
          .map((key, index) => {
            const diseaseData = data.data[key];
            const diseaseName = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
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
        if (alive.current) setTreatments(formattedData);
      } else {
        notify(errorTitle, errorNoData);
        if (alive.current) setTreatments([]);
      }
    } catch (error) {
      console.error("Error fetching treatments:", error);
      notify(errorTitle, errorFetchTreatments);
      if (alive.current) setTreatments([]);
    } finally {
      if (alive.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDisease = async (diseaseName) => {
    if (expandedDisease === diseaseName) {
      setExpandedDisease(null);
      return;
    }

    if (detailsRef.current[diseaseName]) {
      setExpandedDisease(diseaseName);
      return;
    }

    try {
      setExpandedDisease(diseaseName);
      setDetailLoading(true);
      const { data } = await api.get(`/treatment/${encodeURIComponent(diseaseName)}`);

      const diseaseInfo = DISEASE_INFO[diseaseName] || {};
      const merged = {
        ...data,
        description: data.description || diseaseInfo.description || "",
        cause: data.cause || diseaseInfo.cause || "",
      };
      detailsRef.current[diseaseName] = merged;
      if (alive.current) setDetails({ ...detailsRef.current });
    } catch (error) {
      console.error("Error fetching disease treatment:", error);
      notify(errorTitle, errorMessage(error, "Failed to load treatment details."));
      if (alive.current) setExpandedDisease(null);
    } finally {
      if (alive.current) setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchTreatments();
  }, [fetchTreatments]);

  const onRefresh = () => {
    detailsRef.current = {};
    setDetails({});
    setExpandedDisease(null);
    setRefreshing(true);
    fetchTreatments();
  };

  const renderDiseaseCard = (item) => {
    const isExpanded = expandedDisease === item.name;
    const data = details[item.name];
    const isLoading = isExpanded && detailLoading && !data;

    return (
      <Touchable
        style={sx(styles.card, isExpanded && styles.cardExpanded)}
        onPress={() => toggleDisease(item.name)}
        activeOpacity={0.9}
        key={item.id}
        aria-expanded={isExpanded}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <DiseaseCardTitle name={item.name} />
            <View style={sx(styles.cardBadge, isExpanded && styles.cardBadgeExpanded)}>
              <Text style={styles.cardBadgeText}>
                {isExpanded ? `▲ ${closeLabel}` : `▼ ${detailsLabel}`}
              </Text>
            </View>
          </View>
          <Icon
            name={isExpanded ? "chevron-up-circle" : "chevron-down-circle"}
            size={28}
            color={isExpanded ? "#6C63FF" : "#4CAF50"}
          />
        </View>

        {!isExpanded && (
          <View style={styles.cardBody}>
            <View style={styles.cardInfoRow}>
              <Icon name="document-text-outline" size={14} color="#888" />
              <Text style={styles.cardInfoLabel}>{descriptionLabel}</Text>
            </View>
            <View style={{ paddingLeft: 20 }}>
              <DetailRow text={item.description} />
            </View>

            <View style={styles.cardInfoRow}>
              <Icon name="alert-circle-outline" size={14} color="#888" />
              <Text style={styles.cardInfoLabel}>{causeLabel}</Text>
            </View>
            <View style={{ paddingLeft: 20 }}>
              <DetailRow text={item.cause} />
            </View>

            <View style={styles.treatmentOptions}>
              <Text style={styles.treatmentOptionsLabel}>{treatmentOptionsLabel}</Text>
              <View style={styles.treatmentOptionsTags}>
                <View style={sx(styles.tag, styles.organicTag)}>
                  <Icon name="leaf" family="fa" size={12} color="#2e7d32" />
                  <Text style={sx(styles.tagText, styles.organicTagText)}>{organicLabel}</Text>
                </View>
                <View style={sx(styles.tag, styles.chemicalTag)}>
                  <Icon name="flask" family="fa" size={12} color="#c62828" />
                  <Text style={sx(styles.tagText, styles.chemicalTagText)}>{chemicalLabel}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {isLoading && (
          <View style={styles.inlineLoading}>
            <Spinner color="#6C63FF" />
            <Text style={styles.loadingText}>{loadingDetailsText}</Text>
          </View>
        )}

        {isExpanded && data && <TreatmentDetails data={data} labels={labels} />}
      </Touchable>
    );
  };

  if (loading && treatments.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>{loadingTreatmentsText}</Text>
      </View>
    );
  }

  if (treatments.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="medical-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>{noTreatmentsTitle}</Text>
        <Text style={styles.emptyText}>{noTreatmentsText}</Text>
        <Touchable style={styles.retryButton} onPress={fetchTreatments}>
          <Gradient
            colors={["#6C63FF", "#5A52D5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.retryGradient}
          >
            <Text style={styles.retryButtonText}>{retryLabel}</Text>
          </Gradient>
        </Touchable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 30 }}
        onRefresh={onRefresh}
        refreshing={refreshing}
      >
        <Gradient
          colors={["#6C63FF", "#8B85FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerContainer}
        >
          <Text style={styles.title}>🌿 {screenTitle}</Text>
          <Text style={styles.subtitle}>{screenSubtitle}</Text>
        </Gradient>

        <View style={styles.cardsContainer}>{treatments.map((item) => renderDiseaseCard(item))}</View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={sx(styles.statIcon, { backgroundColor: "#EEF0FF" })}>
              <Icon name="medical-outline" size={20} color="#6C63FF" />
            </View>
            <Text style={styles.statNumber}>{treatments.length}</Text>
            <Text style={styles.statLabel}>{diseasesStatLabel}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={sx(styles.statIcon, { backgroundColor: "#E8F5E9" })}>
              <Icon name="leaf-outline" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.statNumber}>🌱</Text>
            <Text style={styles.statLabel}>{organicStatLabel}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={sx(styles.statIcon, { backgroundColor: "#FFEBEE" })}>
              <Icon name="flask-outline" size={20} color="#f44336" />
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
          <Touchable style={styles.chatButton}>
            <Gradient
              colors={["#6C63FF", "#5A52D5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.chatGradient}
            >
              <Icon name="chatbubble-ellipses-outline" size={20} color="#fff" />
              <Text style={styles.chatButtonText}>{startChatLabel}</Text>
            </Gradient>
          </Touchable>
        </View>
      </ScrollView>
    </View>
  );
}
