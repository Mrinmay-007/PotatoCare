import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";
import { View, Text, ScrollView, Touchable, Gradient, Modal, Spinner, notify } from "../components/ui";
import { TText } from "../components/T";
import Icon from "../components/Icon";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import useTranslate from "../hooks/useTranslate";
import styles from "../styles/LogbookStyle";
import { sx } from "../utils/rn";

const DISEASE_COLORS = {
  "Early Blight": "#FF9800",
  "Late Blight": "#f44336",
  Healthy: "#4CAF50",
};

const FALLBACK_COLORS = ["#9C27B0", "#3F51B5", "#00BCD4", "#8BC34A", "#FFC107"];

const getDiseaseColor = (disease, index = 0) =>
  DISEASE_COLORS[disease] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];

// Diagnose saves severities as Healthy / Mild / Moderate / Severe, while this screen
// only understood low / medium / high. "Moderate" and "Severe" therefore rendered as
// "low" (green) and "Moderate" was dropped from the bar chart. Normalise everything here.
function normalizeSeverity(severity) {
  switch (String(severity ?? "").toLowerCase()) {
    case "healthy":
    case "low":
    case "mild":
      return "low";
    case "medium":
    case "moderate":
      return "medium";
    case "high":
    case "severe":
      return "high";
    default:
      return null;
  }
}

const SEVERITY_STYLE = {
  low: styles.severityLow,
  medium: styles.severityMedium,
  high: styles.severityHigh,
};
const SEVERITY_EMOJI = { low: "🟢", medium: "🟡", high: "🔴" };

const getSeverityStyle = (severity) => SEVERITY_STYLE[normalizeSeverity(severity)] || styles.severityLow;
const getSeverityEmoji = (severity) => SEVERITY_EMOJI[normalizeSeverity(severity)] || "⚪";

const getConfidenceStyle = (confidence) => {
  if (confidence >= 80) return styles.confidenceHigh;
  if (confidence >= 60) return styles.confidenceMedium;
  return styles.confidenceLow;
};

// Date + time -> timestamp. Accepts ISO-like strings and DD-MM-YYYY / DD/MM/YYYY.
function parseDateTime(date, time) {
  if (!date) return 0;
  const direct = Date.parse(`${date} ${time || ""}`.trim());
  if (!Number.isNaN(direct)) return direct;
  const m = String(date).match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) {
    const iso = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")} ${time || ""}`.trim();
    const t = Date.parse(iso);
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

const chartAxis = { tick: { fontSize: 11, fill: "#333" }, stroke: "#e5e5e5" };

export default function Logbook() {
  const { user } = useAuth();
  const userId = user?.user_id ?? null;

  const logbookTitleLabel = useTranslate("Logbook");
  const headerSubtitleLabel = useTranslate("Your prediction history");
  const loadingLabel = useTranslate("Loading your prediction history...");
  const statisticsLabel = useTranslate("Statistics");
  const totalPredictionsLabel = useTranslate("Total Predictions");
  const latestLabel = useTranslate("Latest");
  const naLabel = useTranslate("N/A");
  const diseaseDistributionLabel = useTranslate("Disease Distribution");
  const severityBreakdownLabel = useTranslate("Severity Breakdown");
  const historyLabel = useTranslate("History");
  const allLabel = useTranslate("All");
  const newestLabel = useTranslate("Newest");
  const oldestLabel = useTranslate("Oldest");
  const noPredictionsLabel = useTranslate("No predictions yet");
  const noPredictionsSubtextLabel = useTranslate("Scan a leaf on the Diagnose tab to get started");
  const confidenceLabel = useTranslate("Confidence");
  const infectedRatioLabel = useTranslate("Infected Ratio");
  const totalPrefixLabel = useTranslate("Total");
  const predictionsSuffixLabel = useTranslate("predictions");
  const predictionDetailsLabel = useTranslate("Prediction Details");
  const diseaseDetailLabel = useTranslate("Disease");
  const severityDetailLabel = useTranslate("Severity");
  const dateDetailLabel = useTranslate("Date");
  const timeDetailLabel = useTranslate("Time");
  const closeLabel = useTranslate("Close");
  const notLoggedInTitleLabel = useTranslate("Not logged in");
  const notLoggedInMessageLabel = useTranslate("Please log in to view your logbook.");
  const errorTitleLabel = useTranslate("Error");
  const failedToFetchHistoryLabel = useTranslate("Failed to fetch prediction history");
  const lowLabelText = useTranslate("Low");
  const mediumLabelText = useTranslate("Medium");
  const highLabelText = useTranslate("High");

  const [history, setHistory] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [filterDisease, setFilterDisease] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // History + dashboard are independent: fetch them in parallel (they ran one after
  // the other before) and check HTTP status via axios instead of parsing error bodies.
  const fetchData = useCallback(
    async (uid) => {
      const [historyRes, dashboardRes] = await Promise.allSettled([
        api.get(`/log/history/${uid}`),
        api.get(`/log/dashboard/${uid}`),
      ]);
      if (!alive.current) return;

      if (historyRes.status === "fulfilled") {
        const rows = historyRes.value.data;
        setHistory(Array.isArray(rows) ? rows : []);
      } else {
        console.error("Error fetching history:", historyRes.reason);
        notify(errorTitleLabel, failedToFetchHistoryLabel);
      }

      setDashboardData(dashboardRes.status === "fulfilled" ? dashboardRes.value.data : null);
    },
    [errorTitleLabel, failedToFetchHistoryLabel]
  );

  // Runs on every visit to the screen (each tab is its own route now), so a
  // diagnosis saved a moment ago shows up here - the mobile tab stayed mounted and
  // kept showing stale data until the user pulled to refresh.
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      notify(notLoggedInTitleLabel, notLoggedInMessageLabel);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      await fetchData(userId);
      if (!cancelled && alive.current) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const onRefresh = async () => {
    if (!userId) return;
    setRefreshing(true);
    await fetchData(userId);
    if (alive.current) setRefreshing(false);
  };

  const sortedHistory = useMemo(() => {
    const withTime = history.map((item) => ({
      item,
      t: parseDateTime(item.prediction_date, item.prediction_time),
    }));
    withTime.sort((a, b) => (sortOrder === "newest" ? b.t - a.t : a.t - b.t));
    return withTime.map((x) => x.item);
  }, [history, sortOrder]);

  const filteredHistory = useMemo(
    () => (filterDisease === "All" ? sortedHistory : sortedHistory.filter((i) => i.class === filterDisease)),
    [sortedHistory, filterDisease]
  );

  const uniqueDiseases = useMemo(
    () => ["All", ...new Set(history.map((item) => item.class).filter(Boolean))],
    [history]
  );

  // "Latest" is the newest record, not whatever the server happened to return first.
  const latestDate = useMemo(() => {
    if (history.length === 0) return null;
    let best = history[0];
    let bestT = parseDateTime(best.prediction_date, best.prediction_time);
    history.forEach((item) => {
      const t = parseDateTime(item.prediction_date, item.prediction_time);
      if (t > bestT) {
        best = item;
        bestT = t;
      }
    });
    return best.prediction_date;
  }, [history]);

  const pieData = useMemo(() => {
    if (!dashboardData?.disease_stats?.length) return [];
    return dashboardData.disease_stats.map((d, i) => ({
      name: d._id,
      value: d.count,
      color: getDiseaseColor(d._id, i),
    }));
  }, [dashboardData]);

  const barData = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0 };
    history.forEach((item) => {
      const key = normalizeSeverity(item.severity);
      if (key) counts[key] += 1;
    });
    return [
      { name: lowLabelText, count: counts.low },
      { name: mediumLabelText, count: counts.medium },
      { name: highLabelText, count: counts.high },
    ];
  }, [history, lowLabelText, mediumLabelText, highLabelText]);

  const hasHistory = history.length > 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>{loadingLabel}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Gradient
        colors={["#6C63FF", "#5A52D5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>📒 {logbookTitleLabel}</Text>
            <Text style={styles.headerSubtitle}>{headerSubtitleLabel}</Text>
          </View>
          <View style={styles.userBadge}>
            <Icon name="person-outline" size={14} color="#fff" />
            <Text style={styles.userIdText} numberOfLines={1}>
              {userId ? userId.replace("user_", "").substring(0, 8) : "..."}
            </Text>
          </View>
        </View>
      </Gradient>

      <ScrollView style={styles.scrollView} onRefresh={onRefresh} refreshing={refreshing}>
        {dashboardData && (
          <View style={styles.dashboardContainer}>
            <Text style={styles.sectionTitle}>📊 {statisticsLabel}</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={sx(styles.statIcon, { backgroundColor: "#EEF0FF" })}>
                  <Icon name="analytics-outline" size={24} color="#6C63FF" />
                </View>
                <Text style={styles.statNumber}>{dashboardData.total_predictions ?? 0}</Text>
                <Text style={styles.statLabel}>{totalPredictionsLabel}</Text>
              </View>

              <View style={styles.statCard}>
                <View style={sx(styles.statIcon, { backgroundColor: "#FFF3E0" })}>
                  <Icon name="calendar-outline" size={24} color="#FF9800" />
                </View>
                <Text style={sx(styles.statNumber, { fontSize: 25 })}>{latestDate ?? naLabel}</Text>
                <Text style={styles.statLabel}>{latestLabel}</Text>
              </View>
            </View>

            {pieData.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.subsectionTitle}>{diseaseDistributionLabel}</Text>
                <div style={{ width: "100%", height: 190 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="35%"
                        cy="50%"
                        outerRadius={70}
                        label={({ value }) => value}
                        labelLine={false}
                      >
                        {pieData.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </View>
            )}

            {hasHistory && (
              <View style={styles.chartCard}>
                <Text style={styles.subsectionTitle}>{severityBreakdownLabel}</Text>
                <div style={{ width: "100%", height: 190 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 16, right: 8, left: -24, bottom: 0 }}>
                      <XAxis dataKey="name" {...chartAxis} />
                      <YAxis allowDecimals={false} domain={[0, "auto"]} {...chartAxis} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#FF9800" radius={[6, 6, 0, 0]} barSize={36}>
                        <LabelList dataKey="count" position="top" fontSize={11} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </View>
            )}
          </View>
        )}

        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>📜 {historyLabel}</Text>

          {hasHistory && (
            <View style={styles.filterContainer}>
              <ScrollView horizontal style={{ flex: 1 }}>
                {uniqueDiseases.map((disease) => (
                  <Touchable
                    key={disease}
                    style={sx(styles.filterButton, filterDisease === disease && styles.filterButtonActive)}
                    onPress={() => setFilterDisease(disease)}
                  >
                    {disease === "All" ? (
                      <Text style={sx(styles.filterButtonText, filterDisease === disease && styles.filterButtonTextActive)}>
                        {allLabel}
                      </Text>
                    ) : (
                      <TText style={sx(styles.filterButtonText, filterDisease === disease && styles.filterButtonTextActive)}>
                        {disease}
                      </TText>
                    )}
                  </Touchable>
                ))}
              </ScrollView>

              <Touchable
                style={styles.sortButton}
                onPress={() => setSortOrder((o) => (o === "newest" ? "oldest" : "newest"))}
              >
                <Icon name="swap-vertical" size={18} color="#666" />
                <Text style={styles.sortButtonText}>{sortOrder === "newest" ? newestLabel : oldestLabel}</Text>
              </Touchable>
            </View>
          )}

          {filteredHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="book-outline" size={64} color="#ddd" />
              <Text style={styles.emptyStateText}>{noPredictionsLabel}</Text>
              <Text style={styles.emptyStateSubtext}>{noPredictionsSubtextLabel}</Text>
            </View>
          ) : (
            filteredHistory.map((prediction, index) => (
              <Touchable
                key={prediction._id || `${prediction.prediction_date}-${prediction.prediction_time}-${index}`}
                style={styles.predictionCard}
                onPress={() => setSelectedPrediction(prediction)}
                activeOpacity={0.9}
              >
                <View style={styles.predictionHeader}>
                  <View style={styles.predictionDateContainer}>
                    <Icon name="calendar-outline" size={14} color="#888" />
                    <Text style={styles.predictionDate}>{prediction.prediction_date}</Text>
                  </View>
                  <View style={styles.predictionTimeContainer}>
                    <Icon name="time-outline" size={14} color="#888" />
                    <Text style={styles.predictionTime}>{prediction.prediction_time}</Text>
                  </View>
                </View>

                <View style={styles.predictionBody}>
                  <View style={styles.diseaseInfo}>
                    <View style={styles.diseaseTag}>
                      <TText style={styles.diseaseTagText}>{prediction.class}</TText>
                    </View>
                    <View style={sx(styles.severityTag, getSeverityStyle(prediction.severity))}>
                      <TText style={styles.severityTagText}>
                        {`${getSeverityEmoji(prediction.severity)} ${prediction.severity}`}
                      </TText>
                    </View>
                  </View>

                  <View style={styles.predictionStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statItemLabel}>{confidenceLabel}</Text>
                      <Text style={sx(styles.statItemValue, getConfidenceStyle(prediction.confidence))}>
                        {prediction.confidence}%
                      </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statItemLabel}>{infectedRatioLabel}</Text>
                      <Text style={styles.statItemValue}>{prediction.infected_ratio}%</Text>
                    </View>
                  </View>
                </View>
              </Touchable>
            ))
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {totalPrefixLabel}: {history.length} {predictionsSuffixLabel}
          </Text>
        </View>
      </ScrollView>

      <Modal visible={!!selectedPrediction} onRequestClose={() => setSelectedPrediction(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{predictionDetailsLabel}</Text>
              <Touchable onPress={() => setSelectedPrediction(null)} aria-label="Close">
                <Icon name="close-circle" size={28} color="#888" />
              </Touchable>
            </View>

            {selectedPrediction && (
              <ScrollView>
                <View style={styles.detailCard}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>🦠 {diseaseDetailLabel}</Text>
                    <TText style={sx(styles.detailValue, { fontWeight: "bold" })}>{selectedPrediction.class}</TText>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>📊 {confidenceLabel}</Text>
                    <Text style={sx(styles.detailValue, getConfidenceStyle(selectedPrediction.confidence))}>
                      {selectedPrediction.confidence}%
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>⚠️ {severityDetailLabel}</Text>
                    <TText style={sx(styles.detailValue, getSeverityStyle(selectedPrediction.severity))}>
                      {`${getSeverityEmoji(selectedPrediction.severity)} ${selectedPrediction.severity}`}
                    </TText>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>📈 {infectedRatioLabel}</Text>
                    <Text style={styles.detailValue}>{selectedPrediction.infected_ratio}%</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>📅 {dateDetailLabel}</Text>
                    <Text style={styles.detailValue}>{selectedPrediction.prediction_date}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>⏰ {timeDetailLabel}</Text>
                    <Text style={styles.detailValue}>{selectedPrediction.prediction_time}</Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <Touchable style={styles.closeButton} onPress={() => setSelectedPrediction(null)}>
              <Text style={styles.closeButtonText}>{closeLabel}</Text>
            </Touchable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
