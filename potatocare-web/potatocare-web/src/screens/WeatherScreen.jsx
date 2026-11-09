import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { View, Text, ScrollView, Touchable, Gradient, Modal, Spinner, notify } from "../components/ui";
import { T } from "../components/T";
import Icon from "../components/Icon";
import api from "../services/api";
import useTranslate from "../hooks/useTranslate";
import styles from "../styles/WeatherStyles";
import { sx } from "../utils/rn";

// ---------- Small presentational helpers ----------

function TField({ label, value, style }) {
  const translatedLabel = useTranslate(label);
  const translatedValue = useTranslate(String(value ?? ""));
  return (
    <View style={styles.fieldCard}>
      <Text style={styles.fieldLabel}>{translatedLabel}</Text>
      <Text style={sx(styles.fieldValue, style)}>{translatedValue}</Text>
    </View>
  );
}

function TFieldPressable({ label, value, style, onPress }) {
  const translatedLabel = useTranslate(label);
  const translatedValue = useTranslate(String(value ?? ""));
  return (
    <Touchable style={sx(styles.fieldCard, styles.riskFieldCard)} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.fieldLabel}>{translatedLabel}</Text>
      <View style={styles.riskValueRow}>
        <Text style={sx(styles.fieldValue, style)}>{translatedValue}</Text>
        <Icon name="chevron-forward" size={14} color="#B08900" />
      </View>
    </Touchable>
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

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function DataBlock({ data, onRiskPress }) {
  if (!data) return null;
  return (
    <>
      {Object.entries(data).map(([key, value]) => {
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          return (
            <View key={key} style={styles.nestedContainer}>
              <TNestedTitle text={cap(key)} />
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
      })}
    </>
  );
}

function NestedFields({ obj, indent = 0 }) {
  if (!obj || typeof obj !== "object") return null;
  return (
    <>
      {Object.entries(obj).map(([key, value]) => {
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          return (
            <View key={key} style={sx(styles.nestedContainer, { marginLeft: indent * 10 })}>
              <TNestedTitle text={cap(key)} />
              <NestedFields obj={value} indent={indent + 1} />
            </View>
          );
        }
        return (
          <View key={key} style={{ marginLeft: indent * 10 }}>
            <TField label={cap(key)} value={value} />
          </View>
        );
      })}
    </>
  );
}

// ---------- Forecast helpers ----------

function parseTemp(v) {
  if (v == null) return null;
  const n = parseFloat(String(v).replace("°C", "").trim());
  return isNaN(n) ? null : n;
}

// "2026-11-09 15:00:00" -> "09/11 15:00" (tolerates missing / odd timestamps)
function shortTime(ts) {
  if (!ts || typeof ts !== "string") return "";
  const [datePart = "", timePart = ""] = ts.split(/[ T]/);
  const [, m, d] = datePart.split("-");
  if (!m || !d) return ts;
  return `${d}/${m} ${timePart.slice(0, 5)}`;
}

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

const axisProps = { tick: { fontSize: 10, fill: "#3C3C4C" }, stroke: "#E5E5EE" };

function ChartCard({ title, children }) {
  return (
    <View style={styles.weatherCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ForecastCharts({ forecast }) {
  const title1 = useTranslate("🌡️ Temperature Trend (next readings)");
  const title2 = useTranslate("🌧️ Conditions Breakdown");
  // The bar chart plots max temperature; the old title ("Feels-like vs Actual") did not match the data.
  const title3 = useTranslate("🔥 Max Temperature");
  const emptyText = useTranslate("No forecast data available.");

  const sample = useMemo(() => (forecast || []).slice(0, 8), [forecast]);

  const lineData = useMemo(
    () =>
      sample.map((f) => ({
        name: shortTime(f.timestamp),
        temp: parseTemp(f.temperature?.current),
        max: parseTemp(f.temperature?.max),
      })),
    [sample]
  );

  const pieData = useMemo(() => {
    const counts = {};
    (forecast || []).forEach((f) => {
      const c = f.condition || "Unknown";
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count], i) => ({
      name,
      value: count,
      color: conditionColors[name] || fallbackPalette[i % fallbackPalette.length],
    }));
  }, [forecast]);

  if (!forecast || forecast.length === 0) {
    return (
      <View style={styles.weatherCard}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  const innerWidth = Math.max(sample.length * 60, 280);

  return (
    <>
      <ChartCard title={title1}>
        <ScrollView horizontal contentContainerStyle={{ minWidth: "100%" }}>
          <div style={{ width: innerWidth, minWidth: "100%", height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="#F0F0F5" vertical={false} />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} unit="°" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="temp"
                  name="Temp"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  dot={{ r: 3, stroke: "#4338CA", strokeWidth: 1 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ScrollView>
      </ChartCard>

      <ChartCard title={title3}>
        <ScrollView horizontal contentContainerStyle={{ minWidth: "100%" }}>
          <div style={{ width: innerWidth, minWidth: "100%", height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lineData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="#F0F0F5" vertical={false} />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} unit="°" domain={[0, "auto"]} />
                <Tooltip />
                <Bar dataKey="max" name="Max" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ScrollView>
      </ChartCard>

      <ChartCard title={title2}>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="35%" cy="50%" outerRadius={70}>
                {pieData.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </>
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

function ForecastList({ forecast }) {
  const title = useTranslate("📋 Upcoming Forecast");
  if (!forecast || forecast.length === 0) return null;
  return (
    <View style={styles.weatherCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      {forecast.slice(0, 10).map((f, idx) => (
        <ForecastRow key={`${f.timestamp}-${idx}`} item={f} />
      ))}
    </View>
  );
}

// ---------- Risk helpers ----------

const RISK_LEVELS = ["Critical", "High", "Moderate", "Low", "Very Low"];

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

// ---------- Tab config ----------

const TABS = [
  { key: "weather", icon: "partly-sunny-outline", label: "Weather" },
  { key: "forecast", icon: "calendar-outline", label: "Forecast" },
  { key: "compatible", icon: "flask-outline", label: "Analysis" },
  { key: "threat", icon: "warning-outline", label: "Threat" },
];

const LEAVES = [
  { value: "healthy", label: "Healthy" },
  { value: "early blight", label: "Early" },
  { value: "late blight", label: "Late" },
];

// ---------- Main screen ----------

export default function Weather() {
  // One cache entry per view (and per leaf type for "Analysis"), so switching tabs
  // does not refetch or show another tab's data. Pull-to-refresh forces a reload.
  const [data, setData] = useState({});
  const dataRef = useRef({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLeaf, setSelectedLeaf] = useState("healthy");
  const [viewMode, setViewMode] = useState("weather");
  const [riskModalVisible, setRiskModalVisible] = useState(false);
  const [riskLevel, setRiskLevel] = useState("");

  const reqId = useRef(0);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const keyFor = (view, leaf) => (view === "compatible" ? `compatible:${leaf}` : view);

  const load = useCallback(async (view, leaf, force = false) => {
    const key = keyFor(view, leaf);
    const id = ++reqId.current; // later calls invalidate earlier in-flight ones

    if (!force && dataRef.current[key]) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let res;
      if (view === "weather") res = await api.get("/weather/current");
      else if (view === "compatible") res = await api.get("/weather/compatible", { params: { leaf } });
      else if (view === "threat") res = await api.get("/weather/threat");
      else res = await api.get("/weather/forecast");

      if (!alive.current || id !== reqId.current) return; // user already moved on

      dataRef.current = { ...dataRef.current, [key]: res.data };
      setData(dataRef.current);

      // Pop the risk dialog for freshly loaded analysis / threat data (as before).
      // The backend uses risk_level for /compatible and Risk_Level for /threat.
      const risk = res.data?.risk_level ?? res.data?.Risk_Level;
      if ((view === "compatible" || view === "threat") && risk) {
        setRiskLevel(risk);
        setRiskModalVisible(true);
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
      if (alive.current && id === reqId.current) {
        const msg = {
          weather: "Unable to fetch weather data. Please try again later.",
          compatible: "Unable to fetch disease analysis data. Please try again later.",
          threat: "Unable to fetch threat prediction. Please try again later.",
          forecast: "Unable to fetch forecast data. Please try again later.",
        }[view];
        notify("Error", msg);
      }
    } finally {
      if (alive.current && id === reqId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    load(viewMode, selectedLeaf);
  }, [viewMode, selectedLeaf, load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(viewMode, selectedLeaf, true);
  };

  const modalDescription = useTranslate(getRiskDescription(riskLevel));
  const loadingText = useTranslate("Loading weather data...");
  const emptyTitle = useTranslate("No Weather Data");
  const emptyText = useTranslate("Unable to fetch weather information.");
  const retryText = useTranslate("Retry");

  const currentKey = keyFor(viewMode, selectedLeaf);
  const currentData = data[currentKey];
  const hasAnyData = Object.keys(data).length > 0;
  const locationSource = data.weather ? "gps/ip" : null;

  if (loading && !hasAnyData) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>{loadingText}</Text>
      </View>
    );
  }

  if (!loading && !hasAnyData) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="cloud-offline-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptyText}>{emptyText}</Text>
        <Touchable style={styles.retryButton} onPress={() => load(viewMode, selectedLeaf, true)}>
          <Gradient
            colors={["#4F46E5", "#4338CA"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.retryGradient}
          >
            <Text style={styles.retryButtonText}>{retryText}</Text>
          </Gradient>
        </Touchable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Risk Modal */}
      <Modal visible={riskModalVisible} onRequestClose={() => setRiskModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={sx(styles.modalContent, { border: `3px solid ${getRiskColor(riskLevel)}` })}>
            <Text style={styles.modalEmoji}>{getRiskEmoji(riskLevel)}</Text>
            <Text style={sx(styles.modalTitle, { color: getRiskColor(riskLevel) })}>
              {riskLevel} <T>Risk Level</T>
            </Text>
            <View style={styles.modalDivider} />
            <Text style={styles.modalDescription}>{modalDescription}</Text>
            <View style={styles.riskIndicators}>
              {RISK_LEVELS.map((level) => (
                <View
                  key={level}
                  style={sx(styles.riskIndicator, getRiskIndicatorStyle(level), riskLevel === level && styles.riskActive)}
                >
                  <Text style={styles.riskIndicatorText}>{level}</Text>
                </View>
              ))}
            </View>
            <Touchable
              style={sx(styles.modalButton, { backgroundColor: getRiskColor(riskLevel) })}
              onPress={() => setRiskModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>
                <T>Close</T>
              </Text>
            </Touchable>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <Gradient
        colors={["#4F46E5", "#6D66F0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>
          🌤️ <T>Weather Assistant</T>
        </Text>
        <Text style={styles.headerSubtitle}>
          <T>Real-time weather for potato farming</T>
        </Text>
      </Gradient>

      {/* Tab bar */}
      <View style={styles.tabBarWrapper}>
        <View style={styles.tabBar} role="tablist">
          {TABS.map((tab) => {
            const active = viewMode === tab.key;
            return (
              <Touchable
                key={tab.key}
                style={styles.tabItem}
                onPress={() => setViewMode(tab.key)}
                activeOpacity={0.7}
                role="tab"
                aria-selected={active}
              >
                <Icon
                  name={tab.icon}
                  size={16}
                  color={active ? "#4F46E5" : "#9AA0AC"}
                  style={{ marginRight: 5 }}
                />
                <Text style={sx(styles.tabLabel, active && styles.tabLabelActive)}>
                  <T>{tab.label}</T>
                </Text>
                {active && <View style={styles.tabUnderline} />}
              </Touchable>
            );
          })}
        </View>
      </View>

      <ScrollView style={styles.scrollView} onRefresh={onRefresh} refreshing={refreshing}>
        {/* Leaf Selector */}
        {viewMode === "compatible" && (
          <View style={styles.leafSelector}>
            <Text style={styles.leafLabel}>
              🌿 <T>Leaf Condition</T>
            </Text>
            <View style={styles.leafButtons}>
              {LEAVES.map((leaf) => (
                <Touchable
                  key={leaf.value}
                  style={sx(styles.leafButton, selectedLeaf === leaf.value && styles.leafButtonActive)}
                  onPress={() => setSelectedLeaf(leaf.value)}
                >
                  <Text style={sx(styles.leafButtonText, selectedLeaf === leaf.value && styles.leafButtonTextActive)}>
                    <T>{leaf.label}</T>
                  </Text>
                </Touchable>
              ))}
            </View>
          </View>
        )}

        {/* In-place loader: the tab bar and leaf selector stay mounted while a view loads */}
        {loading && !currentData && (
          <View style={{ alignItems: "center", padding: 32 }}>
            <Spinner size="large" color="#4F46E5" />
          </View>
        )}

        {/* View failed to load and there is nothing cached for it */}
        {!loading && !currentData && (
          <View style={sx(styles.weatherCard, { alignItems: "center" })}>
            <Text style={styles.emptyText}>{emptyText}</Text>
            <Touchable style={styles.retryButton} onPress={() => load(viewMode, selectedLeaf, true)}>
              <Gradient colors={["#4F46E5", "#4338CA"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.retryGradient}>
                <Text style={styles.retryButtonText}>{retryText}</Text>
              </Gradient>
            </Touchable>
          </View>
        )}

        {/* Forecast view: charts + list */}
        {viewMode === "forecast" && currentData && (
          <>
            <ForecastCharts forecast={currentData.forecast} />
            <ForecastList forecast={currentData.forecast} />
          </>
        )}

        {/* Weather / Analysis / Threat view */}
        {viewMode !== "forecast" && currentData && (
          <>
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

            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Icon name="location-outline" size={16} color="#4F46E5" />
                <Text style={styles.infoText}>{currentData?.City || "Auto-detected"}</Text>
              </View>
              {currentData?.Timestamp && (
                <View style={styles.infoRow}>
                  <Icon name="time-outline" size={16} color="#4F46E5" />
                  <Text style={styles.infoText}>{currentData.Timestamp}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Icon name="navigate-outline" size={16} color="#4F46E5" />
                <Text style={styles.infoText}>Source: {locationSource || "Auto-detected"}</Text>
              </View>
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}
