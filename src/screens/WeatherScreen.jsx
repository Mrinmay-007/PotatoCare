

import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  RefreshControl,
  Dimensions
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import api from "../services/api";
import useTranslate from "../hooks/useTranslate";
import styles from "../styles/WeatherStyles";

const { width } = Dimensions.get("window");


// ---------- Small presentational helpers ----------

function TField({ label, value, style }) {
  const translatedLabel = useTranslate(label);
  const translatedValue = useTranslate(String(value ?? ""));
  return (
    <View style={styles.fieldCard}>
      <Text style={styles.fieldLabel}>{translatedLabel}</Text>
      <Text style={[styles.fieldValue, style]}>{translatedValue}</Text>
    </View>
  );
}

function TFieldPressable({ label, value, style, onPress }) {
  const translatedLabel = useTranslate(label);
  const translatedValue = useTranslate(String(value ?? ""));
  return (
    <TouchableOpacity style={[styles.fieldCard, styles.riskFieldCard]} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.fieldLabel}>{translatedLabel}</Text>
      <View style={styles.riskValueRow}>
        <Text style={[styles.fieldValue, style]}>{translatedValue}</Text>
        <Ionicons name="chevron-forward" size={14} color="#B08900" />
      </View>
    </TouchableOpacity>
  );
}

function TNestedTitle({ text }) {
  const t = useTranslate(text);
  return <Text style={styles.nestedTitle}>{t}</Text>;
}

function TCardTitle({ text }) {
  const t = useTranslate(text);
  return <Text style={styles.cardTitle}>{t}</Text>;
}

const specialLabels = {
  "Potato Suitability": "🥔 Suitability",
  "Risk Level": "⚠️ Risk",
  average_risk_score: "📊 Avg Risk",
  maximum_risk_score: "📈 Max Risk",
  risk_level: "⚠️ Risk",
  critical_period: "⏰ Critical",
  mode_risk_score: "📊 Mode",
  median_risk_score: "📊 Median",
  forecast_records_analyzed: "📋 Records",
  Disease_Threat: "🦠 Threat",
};

function humanizeKey(key) {
  let displayKey = key.replace(/([A-Z])/g, " $1").trim();
  displayKey = displayKey.charAt(0).toUpperCase() + displayKey.slice(1);
  return specialLabels[key] || displayKey;
}

function fieldStyleFor(key, value) {
  if (key === "risk_level" || key === "Risk Level") {
    if (value === "Low" || value === "Very Low") return styles.lowRisk;
    if (value === "High" || value === "Critical") return styles.highRisk;
    return styles.mediumRisk;
  }
  if (key === "average_risk_score" || key === "maximum_risk_score") {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      if (numValue >= 70) return styles.highRisk;
      if (numValue >= 50) return styles.mediumRisk;
      return styles.lowRisk;
    }
  }
  if (key === "Potato Suitability") {
    if (value === "Suitable") return styles.suitable;
    if (value === "Unsuitable") return styles.unsuitable;
  }
  return {};
}

function DataBlock({ data, onRiskPress }) {
  if (!data) return null;
  return Object.entries(data).map(([key, value]) => {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return (
        <View key={key} style={styles.nestedContainer}>
          <TNestedTitle text={key.charAt(0).toUpperCase() + key.slice(1)} />
          <NestedFields obj={value} />
        </View>
      );
    }

    const isRiskField = key === "risk_level" || key === "Risk Level";
    const style = fieldStyleFor(key, value);
    const label = humanizeKey(key);

    if (isRiskField) {
      return (
        <TFieldPressable
          key={key}
          label={label}
          value={value}
          style={style}
          onPress={() => onRiskPress && onRiskPress(value)}
        />
      );
    }
    return <TField key={key} label={label} value={value} style={style} />;
  });
}

function NestedFields({ obj, indent = 0 }) {
  if (!obj || typeof obj !== "object") return null;
  return Object.entries(obj).map(([key, value]) => {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return (
        <View key={key} style={[styles.nestedContainer, { marginLeft: indent * 10 }]}>
          <TNestedTitle text={key.charAt(0).toUpperCase() + key.slice(1)} />
          <NestedFields obj={value} indent={indent + 1} />
        </View>
      );
    }
    return (
      <View key={key} style={{ marginLeft: indent * 10 }}>
        <TField label={key.charAt(0).toUpperCase() + key.slice(1)} value={value} />
      </View>
    );
  });
}

// ---------- Forecast helpers ----------

function parseTemp(v) {
  if (v == null) return null;
  const n = parseFloat(String(v).replace("°C", "").trim());
  return isNaN(n) ? null : n;
}

function shortTime(ts) {
  if (!ts) return "";
  const [datePart, timePart] = ts.split(" ");
  const [, m, d] = datePart.split("-");
  const hhmm = (timePart || "").slice(0, 5);
  return `${d}/${m} ${hhmm}`;
}

const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(60, 60, 76, ${opacity})`,
  propsForDots: { r: "3", strokeWidth: "1", stroke: "#4338CA" },
  propsForBackgroundLines: { stroke: "#F0F0F5" },
};

const conditionColors = {
  Rain: "#4C8BF5",
  Clouds: "#9AA5B1",
  Clear: "#F5B942",
  Snow: "#B5D8EB",
  Thunderstorm: "#4F46E5",
  Mist: "#B0BEC5",
  Drizzle: "#7FB3D5",
};
const fallbackPalette = ["#4F46E5", "#4C8BF5", "#F5B942", "#4CAF50", "#f44336", "#9AA5B1", "#7FB3D5"];

function ForecastCharts({ forecast }) {
  const title1 = useTranslate("🌡️ Temperature Trend (next readings)");
  const title2 = useTranslate("🌧️ Conditions Breakdown");
  const title3 = useTranslate("💧 Feels-like vs Actual");
  const emptyText = useTranslate("No forecast data available.");

  const sample = useMemo(() => (forecast || []).slice(0, 8), [forecast]);

  const lineData = useMemo(() => {
    return {
      labels: sample.map((f) => shortTime(f.timestamp)),
      datasets: [
        {
          data: sample.map((f) => parseTemp(f.temperature?.current) ?? 0),
          color: (o = 1) => `rgba(79, 70, 229, ${o})`,
          strokeWidth: 2,
        },
      ],
    };
  }, [sample]);

  const barData = useMemo(() => {
    return {
      labels: sample.map((f) => shortTime(f.timestamp)),
      datasets: [
        {
          data: sample.map((f) => parseTemp(f.temperature?.max) ?? 0),
        },
      ],
    };
  }, [sample]);

  const pieData = useMemo(() => {
    const counts = {};
    (forecast || []).forEach((f) => {
      const c = f.condition || "Unknown";
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count], i) => ({
      name,
      population: count,
      color: conditionColors[name] || fallbackPalette[i % fallbackPalette.length],
      legendFontColor: "#555",
      legendFontSize: 12,
    }));
  }, [forecast]);

  if (!forecast || forecast.length === 0) {
    return (
      <View style={styles.weatherCard}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  const chartWidth = width - 32 - 32;

  return (
    <>
      <View style={styles.weatherCard}>
        <Text style={styles.cardTitle}>{title1}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={lineData}
            width={Math.max(chartWidth, sample.length * 60)}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chartStyle}
          />
        </ScrollView>
      </View>

      <View style={styles.weatherCard}>
        <Text style={styles.cardTitle}>{title3}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={barData}
            width={Math.max(chartWidth, sample.length * 60)}
            height={200}
            chartConfig={chartConfig}
            style={styles.chartStyle}
            fromZero
            yAxisLabel=""
            yAxisSuffix="°"
          />
        </ScrollView>
      </View>

      <View style={styles.weatherCard}>
        <Text style={styles.cardTitle}>{title2}</Text>
        <PieChart
          data={pieData}
          width={chartWidth}
          height={200}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="8"
          style={styles.chartStyle}
        />
      </View>
    </>
  );
}

function ForecastList({ forecast }) {
  const title = useTranslate("📋 Upcoming Forecast");
  if (!forecast || forecast.length === 0) return null;
  return (
    <View style={styles.weatherCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      {forecast.slice(0, 10).map((f, idx) => (
        <ForecastRow key={idx} item={f} />
      ))}
    </View>
  );
}

function ForecastRow({ item }) {
  const condition = useTranslate(item.condition || "");
  const description = useTranslate(item.description || "");
  return (
    <View style={styles.forecastRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.forecastTime}>{shortTime(item.timestamp)}</Text>
        <Text style={styles.forecastCondition}>
          {condition} · {description}
        </Text>
      </View>
      <Text style={styles.forecastTemp}>{item.temperature?.current}</Text>
    </View>
  );
}

// ---------- Tab config ----------

const TABS = [
  { key: "weather", icon: "partly-sunny-outline", label: "Weather" },
  { key: "forecast", icon: "calendar-outline", label: "Forecast" },
  { key: "compatible", icon: "flask-outline", label: "Analysis" },
  { key: "threat", icon: "warning-outline", label: "Threat" },
];

// ---------- Main screen ----------

export default function Weather() {
  const [weather, setWeather] = useState(null);
  const [compatibleData, setCompatibleData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationSource, setLocationSource] = useState(null);
  const [selectedLeaf, setSelectedLeaf] = useState("healthy");
  const [viewMode, setViewMode] = useState("weather");
  const [riskModalVisible, setRiskModalVisible] = useState(false);
  const [riskLevel, setRiskLevel] = useState("");

  const fetchCurrentWeather = async () => {
    try {
      const { data } = await api.get("/weather/current");
      setWeather(data);
      setLocationSource("gps/ip");
    } catch (error) {
      console.error("❌ Error fetching weather:", error);
      Alert.alert("Error", "Unable to fetch weather data. Please try again later.");
    }
  };

  const fetchCompatibleWeather = async (leafType) => {
    try {
      const { data } = await api.get("/weather/compatible", { params: { leaf: leafType } });
      setCompatibleData(data);
      if (data.risk_level) {
        setRiskLevel(data.risk_level);
        setRiskModalVisible(true);
      }
    } catch (error) {
      console.error("❌ Error fetching compatible weather:", error);
      Alert.alert("Error", "Unable to fetch disease analysis data. Please try again later.");
    }
  };

  const fetchThreatPrediction = async () => {
    try {
      const { data } = await api.get("/weather/threat");
      setCompatibleData(data);
      if (data.Risk_Level) {
        setRiskLevel(data.Risk_Level);
        setRiskModalVisible(true);
      }
    } catch (error) {
      console.error("❌ Error fetching threat prediction:", error);
      Alert.alert("Error", "Unable to fetch threat prediction. Please try again later.");
    }
  };

  const fetchForecast = async () => {
    try {
      const { data } = await api.get("/weather/forecast");
      setForecastData(data);
    } catch (error) {
      console.error("❌ Error fetching forecast:", error);
      Alert.alert("Error", "Unable to fetch forecast data. Please try again later.");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (viewMode === "weather") await fetchCurrentWeather();
      else if (viewMode === "compatible") await fetchCompatibleWeather(selectedLeaf);
      else if (viewMode === "threat") await fetchThreatPrediction();
      else if (viewMode === "forecast") await fetchForecast();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [viewMode, selectedLeaf]);

  const getRiskColor = (risk) => {
    switch (risk) {
      case "Critical": return "#d32f2f";
      case "High": return "#f44336";
      case "Moderate": return "#FF9800";
      case "Low": return "#4CAF50";
      case "Very Low": return "#2E7D32";
      default: return "#666";
    }
  };

  const getRiskEmoji = (risk) => {
    switch (risk) {
      case "Critical": return "🔴";
      case "High": return "🟠";
      case "Moderate": return "🟡";
      case "Low": return "🟢";
      case "Very Low": return "✅";
      default: return "⚪";
    }
  };

  const getRiskDescription = (risk) => {
    switch (risk) {
      case "Critical": return "🚨 Immediate action required! Disease outbreak highly likely.";
      case "High": return "⚠️ High risk conditions. Monitor closely and consider preventive measures.";
      case "Moderate": return "⚡ Moderate risk. Regular monitoring recommended.";
      case "Low": return "✅ Low risk. Standard care is sufficient.";
      case "Very Low": return "🌟 Optimal conditions. Minimal disease threat.";
      default: return "Risk level not available.";
    }
  };

  const getRiskIndicatorStyle = (level) => {
    switch (level) {
      case "Critical": return styles.riskCritical;
      case "High": return styles.riskHigh;
      case "Moderate": return styles.riskModerate;
      case "Low": return styles.riskLow;
      case "Very Low": return styles.riskVeryLow;
      default: return {};
    }
  };

  const modalDescription = useTranslate(getRiskDescription(riskLevel));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading weather data...</Text>
      </View>
    );
  }

  const hasAnyData = weather || compatibleData || forecastData;
  if (!hasAnyData) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cloud-offline-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No Weather Data</Text>
        <Text style={styles.emptyText}>Unable to fetch weather information.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <LinearGradient
            colors={["#4F46E5", "#4338CA"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.retryGradient}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const currentData = viewMode === "weather" ? weather : compatibleData;

  return (
    <View style={styles.container}>
      {/* Risk Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={riskModalVisible}
        onRequestClose={() => setRiskModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: getRiskColor(riskLevel), borderWidth: 3 }]}>
            <Text style={styles.modalEmoji}>{getRiskEmoji(riskLevel)}</Text>
            <Text style={[styles.modalTitle, { color: getRiskColor(riskLevel) }]}>
              {riskLevel} Risk Level
            </Text>
            <View style={styles.modalDivider} />
            <Text style={styles.modalDescription}>{modalDescription}</Text>
            <View style={styles.riskIndicators}>
              {["Critical", "High", "Moderate", "Low", "Very Low"].map((level) => (
                <View
                  key={level}
                  style={[
                    styles.riskIndicator,
                    getRiskIndicatorStyle(level),
                    riskLevel === level && styles.riskActive,
                  ]}
                >
                  <Text style={styles.riskIndicatorText}>{level}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: getRiskColor(riskLevel) }]}
              onPress={() => setRiskModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <LinearGradient
        colors={["#4F46E5", "#6D66F0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>🌤️ Weather Assistant</Text>
        <Text style={styles.headerSubtitle}>Real-time weather for potato farming</Text>
      </LinearGradient>

      {/* Tab bar */}
      <View style={styles.tabBarWrapper}>
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const active = viewMode === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabItem}
                onPress={() => setViewMode(tab.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={active ? "#4F46E5" : "#9AA0AC"}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
                {active && <View style={styles.tabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4F46E5"]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Leaf Selector */}
        {viewMode === "compatible" && (
          <View style={styles.leafSelector}>
            <Text style={styles.leafLabel}>🌿 Leaf Condition</Text>
            <View style={styles.leafButtons}>
              {["healthy", "early blight", "late blight"].map((leaf) => (
                <TouchableOpacity
                  key={leaf}
                  style={[styles.leafButton, selectedLeaf === leaf && styles.leafButtonActive]}
                  onPress={() => setSelectedLeaf(leaf)}
                >
                  <Text style={[styles.leafButtonText, selectedLeaf === leaf && styles.leafButtonTextActive]}>
                    {leaf === "healthy" ? "Healthy" : leaf === "early blight" ? "Early" : "Late"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Forecast view: charts + list */}
        {viewMode === "forecast" && (
          <>
            <ForecastCharts forecast={forecastData?.forecast} />
            <ForecastList forecast={forecastData?.forecast} />
          </>
        )}

        {/* Weather / Analysis / Threat view */}
        {viewMode !== "forecast" && (
          <View style={styles.weatherCard}>
            <TCardTitle
              text={
                viewMode === "weather"
                  ? "🌡️ Current Weather"
                  : viewMode === "threat"
                  ? "🚨 Threat Prediction"
                  : "🌡️ Disease Analysis"
              }
            />
            <DataBlock
              data={currentData}
              onRiskPress={(value) => {
                setRiskLevel(value);
                setRiskModalVisible(true);
              }}
            />
          </View>
        )}

        {/* Info Card */}
        {viewMode !== "forecast" && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color="#4F46E5" />
              <Text style={styles.infoText}>{currentData?.City || "Auto-detected"}</Text>
            </View>
            {currentData?.Timestamp && (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={16} color="#4F46E5" />
                <Text style={styles.infoText}>{currentData.Timestamp}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Ionicons name="navigate-outline" size={16} color="#4F46E5" />
              <Text style={styles.infoText}>Source: {locationSource || "Auto-detected"}</Text>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#F5F6FA" },

//   headerGradient: {
//     paddingTop: 22,
//     paddingBottom: 26,
//     paddingHorizontal: 20,
//     borderBottomLeftRadius: 28,
//     borderBottomRightRadius: 28,
//   },
//   headerTitle: { fontSize: 24, fontWeight: "800", color: "#FFFFFF", textAlign: "center" },
//   headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.85)", textAlign: "center", marginTop: 4 },

//   loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F6FA" },
//   loadingText: { marginTop: 12, fontSize: 16, color: "#4F46E5", fontWeight: "600" },
//   emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F6FA", padding: 20 },
//   emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#333", marginTop: 12, marginBottom: 8 },
//   emptyText: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 20 },
//   retryButton: { borderRadius: 12, overflow: "hidden" },
//   retryGradient: { paddingVertical: 12, paddingHorizontal: 32, alignItems: "center" },
//   retryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

//   /* --- Tab bar (compact, underline style) --- */
//   tabBarWrapper: {
//     marginTop: -18,
//     marginHorizontal: 18,
//     marginBottom: 14,
//     backgroundColor: "#fff",
//     borderRadius: 14,
//     shadowColor: "#1A1A2E",
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 3 },
//     elevation: 4,
//   },
//   tabBar: {
//     flexDirection: "row",
//     height: 42,
//   },
//   tabItem: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   tabLabel: { fontSize: 12, fontWeight: "600", color: "#9AA0AC" },
//   tabLabelActive: { color: "#4F46E5" },
//   tabUnderline: {
//     position: "absolute",
//     bottom: 0,
//     left: "20%",
//     right: "20%",
//     height: 2.5,
//     borderRadius: 2,
//     backgroundColor: "#4F46E5",
//   },

//   scrollView: { flex: 1, paddingHorizontal: 16 },

//   leafSelector: {
//     backgroundColor: "#fff",
//     borderRadius: 14,
//     padding: 14,
//     marginBottom: 12,
//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 2 },
//     elevation: 2,
//   },
//   leafLabel: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 },
//   leafButtons: { flexDirection: "row", justifyContent: "space-around" },
//   leafButton: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, backgroundColor: "#F0F0F5" },
//   leafButtonActive: { backgroundColor: "#4F46E5" },
//   leafButtonText: { fontSize: 12, fontWeight: "600", color: "#666" },
//   leafButtonTextActive: { color: "#fff" },

//   weatherCard: {
//     backgroundColor: "#fff",
//     borderRadius: 18,
//     padding: 16,
//     marginBottom: 12,
//     shadowColor: "#1A1A2E",
//     shadowOpacity: 0.06,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 4 },
//     elevation: 3,
//   },
//   cardTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E", marginBottom: 12, textAlign: "center" },
//   chartStyle: { borderRadius: 12, marginTop: 4 },
//   forecastRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: "#F0F0F5",
//   },
//   forecastTime: { fontSize: 12, fontWeight: "600", color: "#4F46E5" },
//   forecastCondition: { fontSize: 12, color: "#555", marginTop: 2 },
//   forecastTemp: { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },

//   fieldCard: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 9,
//     paddingHorizontal: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#F0F0F5",
//   },
//   riskFieldCard: {
//     backgroundColor: "#FFF8E1",
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: "#FFD54F",
//     marginBottom: 4,
//   },
//   riskValueRow: { flexDirection: "row", alignItems: "center", gap: 4 },
//   fieldLabel: { fontSize: 13, fontWeight: "500", color: "#555", flex: 1 },
//   fieldValue: { fontSize: 13, color: "#1A1A2E", fontWeight: "600", textAlign: "right" },
//   nestedContainer: { marginBottom: 8, padding: 10, backgroundColor: "#F5F6FA", borderRadius: 10 },
//   nestedTitle: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 4 },
//   suitable: { color: "#4CAF50", fontWeight: "bold" },
//   unsuitable: { color: "#f44336", fontWeight: "bold" },
//   lowRisk: { color: "#4CAF50", fontWeight: "bold" },
//   highRisk: { color: "#f44336", fontWeight: "bold" },
//   mediumRisk: { color: "#FF9800", fontWeight: "bold" },

//   infoCard: {
//     backgroundColor: "#fff",
//     borderRadius: 14,
//     padding: 14,
//     marginBottom: 12,
//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 2 },
//     elevation: 2,
//   },
//   infoRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
//   infoText: { fontSize: 13, color: "#666" },
//   bottomSpacer: { height: 20 },

//   modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
//   modalContent: {
//     backgroundColor: "#fff",
//     borderRadius: 20,
//     padding: 24,
//     width: "85%",
//     maxWidth: 400,
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   modalEmoji: { fontSize: 48, marginBottom: 8 },
//   modalTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },
//   modalDivider: { width: "100%", height: 2, backgroundColor: "#e0e0e0", marginVertical: 12 },
//   modalDescription: { fontSize: 16, textAlign: "center", color: "#333", marginBottom: 16, lineHeight: 24 },
//   riskIndicators: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginVertical: 12, width: "100%" },
//   riskIndicator: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, margin: 3, opacity: 0.5 },
//   riskActive: { opacity: 1, transform: [{ scale: 1.1 }] },
//   riskIndicatorText: { fontSize: 10, fontWeight: "600", color: "#fff" },
//   riskCritical: { backgroundColor: "#d32f2f" },
//   riskHigh: { backgroundColor: "#f44336" },
//   riskModerate: { backgroundColor: "#FF9800" },
//   riskLow: { backgroundColor: "#4CAF50" },
//   riskVeryLow: { backgroundColor: "#2E7D32" },
//   modalButton: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 25, marginTop: 8, width: "100%", alignItems: "center" },
//   modalButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
// });
