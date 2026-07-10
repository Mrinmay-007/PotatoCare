

// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   ActivityIndicator,
//   Alert,
//   TouchableOpacity,
//   Modal,
//   RefreshControl,
//   SafeAreaView,
//   Dimensions,
// } from "react-native";
// import { LinearGradient } from "expo-linear-gradient";
// import { Ionicons } from "@expo/vector-icons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { PieChart, BarChart } from "react-native-chart-kit";
// import baseURL from "../services/baseURL";
// import styles from "../styles/LogbookStyle";

// const { width } = Dimensions.get("window");
// const CHART_WIDTH = width - 32;

// const DISEASE_COLORS = {
//   "Early Blight": "#FF9800",
//   "Late Blight": "#f44336",
//   Healthy: "#4CAF50",
// };

// const FALLBACK_COLORS = ["#9C27B0", "#3F51B5", "#00BCD4", "#8BC34A", "#FFC107"];

// const getDiseaseColor = (disease, index = 0) =>
//   DISEASE_COLORS[disease] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];

// export default function Logbook() {
//   const [userId, setUserId] = useState(null);
//   const [history, setHistory] = useState([]);
//   const [dashboardData, setDashboardData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [selectedPrediction, setSelectedPrediction] = useState(null);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [filterDisease, setFilterDisease] = useState("All");
//   const [sortOrder, setSortOrder] = useState("newest");

//   useEffect(() => {
//     initUser();
//   }, []);

//   // Re-load the logged-in user every time this screen regains focus is a good
//   // idea too (e.g. via useFocusEffect from @react-navigation/native), so that
//   // switching accounts elsewhere in the app is reflected here immediately.
//   const initUser = async () => {
//     try {
//       const raw = await AsyncStorage.getItem("user");
//       if (!raw) {
//         setLoading(false);
//         Alert.alert("Not logged in", "Please log in to view your logbook.");
//         return;
//       }
//       const user = JSON.parse(raw);
//       const uid = user.user_id;

//       if (!uid) {
//         setLoading(false);
//         Alert.alert("Error", "Could not determine logged-in user.");
//         return;
//       }

//       setUserId(uid);
//       await fetchData(uid);
//     } catch (error) {
//       console.error("Error initializing user:", error);
//       setLoading(false);
//       Alert.alert("Error", "Failed to load your profile");
//     }
//   };

//   const fetchData = async (uid) => {
//     if (!uid) return;
//     try {
//       setLoading(true);
//       const historyResponse = await fetch(`${baseURL}/log/history/${uid}`);
//       const historyData = await historyResponse.json();
//       setHistory(Array.isArray(historyData) ? historyData : []);

//       const dashboardResponse = await fetch(`${baseURL}/log/dashboard/${uid}`);
//       const dashboardJson = await dashboardResponse.json();
//       setDashboardData(dashboardJson);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       Alert.alert("Error", "Failed to fetch prediction history");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     // Re-read the logged-in user in case the account changed since last load.
//     const raw = await AsyncStorage.getItem("user");
//     const uid = raw ? JSON.parse(raw).user_id : userId;
//     setUserId(uid);
//     await fetchData(uid);
//     setRefreshing(false);
//   };

//   // Kept for use from the Diagnose screen after a prediction is made.
//   const savePredictionFromDiagnose = async (predictionData) => {
//     try {
//       const raw = await AsyncStorage.getItem("user");
//       const uid = raw ? JSON.parse(raw).user_id : userId;
//       if (!uid) return false;

//       const response = await fetch(`${baseURL}/log/save`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           user_id: uid,
//           predicted_class: predictionData.class || predictionData.predicted_class,
//           confidence: parseFloat(predictionData.confidence || 0),
//           severity: predictionData.severity || "Medium",
//           ratio: parseFloat(predictionData.infected_ratio || 0),
//         }),
//       });
//       const data = await response.json();
//       if (response.ok) {
//         fetchData(uid);
//         return true;
//       }
//       console.error("Failed to save prediction:", data.detail);
//       return false;
//     } catch (error) {
//       console.error("Error saving prediction:", error);
//       return false;
//     }
//   };

//   const getSeverityColor = (severity) => {
//     switch (severity?.toLowerCase()) {
//       case "low":
//         return styles.severityLow;
//       case "medium":
//         return styles.severityMedium;
//       case "high":
//         return styles.severityHigh;
//       default:
//         return styles.severityLow;
//     }
//   };

//   const getConfidenceColor = (confidence) => {
//     if (confidence >= 80) return styles.confidenceHigh;
//     if (confidence >= 60) return styles.confidenceMedium;
//     return styles.confidenceLow;
//   };

//   const getSeverityEmoji = (severity) => {
//     switch (severity?.toLowerCase()) {
//       case "low":
//         return "🟢";
//       case "medium":
//         return "🟡";
//       case "high":
//         return "🔴";
//       default:
//         return "⚪";
//     }
//   };

//   const getFilteredHistory = () => {
//     let filtered = history;
//     if (filterDisease !== "All") {
//       filtered = filtered.filter((item) =>
//         item.class?.toLowerCase().includes(filterDisease.toLowerCase())
//       );
//     }
//     filtered = [...filtered].sort((a, b) =>
//       sortOrder === "newest"
//         ? new Date(b.prediction_date) - new Date(a.prediction_date)
//         : new Date(a.prediction_date) - new Date(b.prediction_date)
//     );
//     return filtered;
//   };

//   const getUniqueDiseases = () => {
//     const diseases = history.map((item) => item.class).filter(Boolean);
//     return ["All", ...new Set(diseases)];
//   };

//   const buildPieData = () => {
//     if (!dashboardData?.disease_stats?.length) return [];
//     return dashboardData.disease_stats.map((d, i) => ({
//       name: d._id,
//       population: d.count,
//       color: getDiseaseColor(d._id, i),
//       legendFontColor: "#333",
//       legendFontSize: 12,
//     }));
//   };

//   const buildSeverityBarData = () => {
//     const counts = { Low: 0, Medium: 0, High: 0 };
//     history.forEach((item) => {
//       const sev = item.severity;
//       const key =
//         sev?.toLowerCase() === "low"
//           ? "Low"
//           : sev?.toLowerCase() === "medium" || sev?.toLowerCase() === "mild"
//           ? "Medium"
//           : sev?.toLowerCase() === "high" || sev?.toLowerCase() === "severe"
//           ? "High"
//           : null;
//       if (key) counts[key] += 1;
//     });
//     return {
//       labels: ["Low", "Medium", "High"],
//       datasets: [{ data: [counts.Low, counts.Medium, counts.High] }],
//     };
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#6C63FF" />
//         <Text style={styles.loadingText}>Loading your prediction history...</Text>
//       </View>
//     );
//   }

//   const filteredHistory = getFilteredHistory();
//   const uniqueDiseases = getUniqueDiseases();
//   const pieData = buildPieData();
//   const barData = buildSeverityBarData();
//   const hasHistory = history.length > 0;

//   const chartConfig = {
//     backgroundGradientFrom: "#fff",
//     backgroundGradientTo: "#fff",
//     decimalPlaces: 0,
//     color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
//     labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
//     barPercentage: 0.6,
//     propsForBackgroundLines: { stroke: "#f0f0f0" },
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <LinearGradient
//         colors={["#6C63FF", "#5A52D5"]}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//         style={styles.header}
//       >
//         <View style={styles.headerContent}>
//           <View>
//             <Text style={styles.title}>📒 Logbook</Text>
//             <Text style={styles.headerSubtitle}>Your prediction history</Text>
//           </View>
//           <View style={styles.userBadge}>
//             <Ionicons name="person-outline" size={14} color="#fff" />
//             <Text style={styles.userIdText} numberOfLines={1}>
//               {userId ? userId.replace("user_", "").substring(0, 8) : "..."}
//             </Text>
//           </View>
//         </View>
//       </LinearGradient>

//       <ScrollView
//         style={styles.scrollView}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6C63FF"]} />
//         }
//         showsVerticalScrollIndicator={false}
//       >
//         {dashboardData && (
//           <View style={styles.dashboardContainer}>
//             <Text style={styles.sectionTitle}>📊 Statistics</Text>

//             <View style={styles.statsGrid}>
//               <View style={styles.statCard}>
//                 <View style={[styles.statIcon, { backgroundColor: "#EEF0FF" }]}>
//                   <Ionicons name="analytics-outline" size={24} color="#6C63FF" />
//                 </View>
//                 <Text style={styles.statNumber}>{dashboardData.total_predictions ?? 0}</Text>
//                 <Text style={styles.statLabel}>Total Predictions</Text>
//               </View>
//               <View style={styles.statCard}>
//                 <View style={[styles.statIcon, { backgroundColor: "#FFF3E0" }]}>
//                   <Ionicons name="calendar-outline" size={24} color="#FF9800" />
//                 </View>
//                 <Text style={styles.statNumber}>
//                   {history.length > 0
//                     ? new Date(history[0]?.prediction_date).toLocaleDateString()
//                     : "N/A"}
//                 </Text>
//                 <Text style={styles.statLabel}>Latest</Text>
//               </View>
//             </View>

//             {pieData.length > 0 && (
//               <View style={styles.chartCard}>
//                 <Text style={styles.subsectionTitle}>Disease Distribution</Text>
//                 <PieChart
//                   data={pieData}
//                   width={CHART_WIDTH - 32}
//                   height={190}
//                   chartConfig={chartConfig}
//                   accessor="population"
//                   backgroundColor="transparent"
//                   paddingLeft="8"
//                   absolute
//                 />
//               </View>
//             )}

//             {hasHistory && (
//               <View style={styles.chartCard}>
//                 <Text style={styles.subsectionTitle}>Severity Breakdown</Text>
//                 <BarChart
//                   data={barData}
//                   width={CHART_WIDTH - 32}
//                   height={190}
//                   chartConfig={{
//                     ...chartConfig,
//                     color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
//                   }}
//                   fromZero
//                   showValuesOnTopOfBars
//                   withInnerLines={false}
//                   style={{ borderRadius: 12 }}
//                 />
//               </View>
//             )}
//           </View>
//         )}

//         <View style={styles.historyContainer}>
//           <Text style={styles.sectionTitle}>📜 History</Text>

//           {hasHistory && (
//             <View style={styles.filterContainer}>
//               <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//                 {uniqueDiseases.map((disease) => (
//                   <TouchableOpacity
//                     key={disease}
//                     style={[
//                       styles.filterButton,
//                       filterDisease === disease && styles.filterButtonActive,
//                     ]}
//                     onPress={() => setFilterDisease(disease)}
//                   >
//                     <Text
//                       style={[
//                         styles.filterButtonText,
//                         filterDisease === disease && styles.filterButtonTextActive,
//                       ]}
//                     >
//                       {disease === "All" ? "All" : disease}
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
//               </ScrollView>

//               <TouchableOpacity
//                 style={styles.sortButton}
//                 onPress={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
//               >
//                 <Ionicons name="swap-vertical" size={18} color="#666" />
//                 <Text style={styles.sortButtonText}>
//                   {sortOrder === "newest" ? "Newest" : "Oldest"}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           )}

//           {filteredHistory.length === 0 ? (
//             <View style={styles.emptyState}>
//               <Ionicons name="book-outline" size={64} color="#ddd" />
//               <Text style={styles.emptyStateText}>No predictions yet</Text>
//               <Text style={styles.emptyStateSubtext}>
//                 Scan a leaf on the Diagnose tab to get started
//               </Text>
//             </View>
//           ) : (
//             filteredHistory.map((prediction, index) => (
//               <TouchableOpacity
//                 key={prediction._id || index}
//                 style={styles.predictionCard}
//                 onPress={() => {
//                   setSelectedPrediction(prediction);
//                   setModalVisible(true);
//                 }}
//                 activeOpacity={0.9}
//               >
//                 <View style={styles.predictionHeader}>
//                   <View style={styles.predictionDateContainer}>
//                     <Ionicons name="calendar-outline" size={14} color="#888" />
//                     <Text style={styles.predictionDate}>{prediction.prediction_date}</Text>
//                   </View>
//                   <View style={styles.predictionTimeContainer}>
//                     <Ionicons name="time-outline" size={14} color="#888" />
//                     <Text style={styles.predictionTime}>{prediction.prediction_time}</Text>
//                   </View>
//                 </View>

//                 <View style={styles.predictionBody}>
//                   <View style={styles.diseaseInfo}>
//                     <View style={styles.diseaseTag}>
//                       <Text style={styles.diseaseTagText}>{prediction.class}</Text>
//                     </View>
//                     <View style={[styles.severityTag, getSeverityColor(prediction.severity)]}>
//                       <Text style={styles.severityTagText}>
//                         {getSeverityEmoji(prediction.severity)} {prediction.severity}
//                       </Text>
//                     </View>
//                   </View>

//                   <View style={styles.predictionStats}>
//                     <View style={styles.statItem}>
//                       <Text style={styles.statItemLabel}>Confidence</Text>
//                       <Text
//                         style={[styles.statItemValue, getConfidenceColor(prediction.confidence)]}
//                       >
//                         {prediction.confidence}%
//                       </Text>
//                     </View>
//                     <View style={styles.statDivider} />
//                     <View style={styles.statItem}>
//                       <Text style={styles.statItemLabel}>Infected Ratio</Text>
//                       <Text style={styles.statItemValue}>{prediction.infected_ratio}%</Text>
//                     </View>
//                   </View>
//                 </View>
//               </TouchableOpacity>
//             ))
//           )}
//         </View>

//         <View style={styles.footer}>
//           <Text style={styles.footerText}>Total: {history.length} predictions</Text>
//         </View>
//       </ScrollView>

//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={modalVisible}
//         onRequestClose={() => setModalVisible(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Prediction Details</Text>
//               <TouchableOpacity onPress={() => setModalVisible(false)}>
//                 <Ionicons name="close-circle" size={28} color="#888" />
//               </TouchableOpacity>
//             </View>

//             {selectedPrediction && (
//               <ScrollView showsVerticalScrollIndicator={false}>
//                 <View style={styles.detailCard}>
//                   <View style={styles.detailItem}>
//                     <Text style={styles.detailLabel}>🦠 Disease</Text>
//                     <Text style={[styles.detailValue, { fontWeight: "bold" }]}>
//                       {selectedPrediction.class}
//                     </Text>
//                   </View>
//                   <View style={styles.detailItem}>
//                     <Text style={styles.detailLabel}>📊 Confidence</Text>
//                     <Text
//                       style={[
//                         styles.detailValue,
//                         getConfidenceColor(selectedPrediction.confidence),
//                       ]}
//                     >
//                       {selectedPrediction.confidence}%
//                     </Text>
//                   </View>
//                   <View style={styles.detailItem}>
//                     <Text style={styles.detailLabel}>⚠️ Severity</Text>
//                     <Text
//                       style={[styles.detailValue, getSeverityColor(selectedPrediction.severity)]}
//                     >
//                       {getSeverityEmoji(selectedPrediction.severity)} {selectedPrediction.severity}
//                     </Text>
//                   </View>
//                   <View style={styles.detailItem}>
//                     <Text style={styles.detailLabel}>📈 Infected Ratio</Text>
//                     <Text style={styles.detailValue}>{selectedPrediction.infected_ratio}%</Text>
//                   </View>
//                   <View style={styles.detailItem}>
//                     <Text style={styles.detailLabel}>📅 Date</Text>
//                     <Text style={styles.detailValue}>{selectedPrediction.prediction_date}</Text>
//                   </View>
//                   <View style={styles.detailItem}>
//                     <Text style={styles.detailLabel}>⏰ Time</Text>
//                     <Text style={styles.detailValue}>{selectedPrediction.prediction_time}</Text>
//                   </View>
//                 </View>
//               </ScrollView>
//             )}

//             <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
//               <Text style={styles.closeButtonText}>Close</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// }

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  RefreshControl,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PieChart, BarChart } from "react-native-chart-kit";
import baseURL from "../services/baseURL";
import useTranslate from "../hooks/useTranslate";
import styles from "../styles/LogbookStyle";

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 32;

const DISEASE_COLORS = {
  "Early Blight": "#FF9800",
  "Late Blight": "#f44336",
  Healthy: "#4CAF50",
};

const FALLBACK_COLORS = ["#9C27B0", "#3F51B5", "#00BCD4", "#8BC34A", "#FFC107"];

const getDiseaseColor = (disease, index = 0) =>
  DISEASE_COLORS[disease] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];

// Translates dynamic strings coming from the API (disease names, severities,
// dates, etc). These can't be translated with the top-level useTranslate()
// calls below because their values aren't known until after the API
// responds. Hooks can't be called inside .map() loops directly, so this
// wrapper component gives each dynamic string its own stable hook call.
const TranslatedText = ({ children, style, numberOfLines }) => {
  const translated = useTranslate(children);
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {translated}
    </Text>
  );
};

export default function Logbook() {
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
  const noPredictionsSubtextLabel = useTranslate(
    "Scan a leaf on the Diagnose tab to get started"
  );
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
  const couldNotDetermineUserLabel = useTranslate("Could not determine logged-in user.");
  const failedToLoadProfileLabel = useTranslate("Failed to load your profile");
  const failedToFetchHistoryLabel = useTranslate("Failed to fetch prediction history");
  // Chart labels must be plain strings (react-native-chart-kit doesn't render
  // React nodes for its axis labels), so translate them directly here rather
  // than via <TranslatedText>. Declared alongside the other label hooks,
  // before any early return, to satisfy the rules of hooks.
  const lowLabelText = useTranslate("Low");
  const mediumLabelText = useTranslate("Medium");
  const highLabelText = useTranslate("High");

  const [userId, setUserId] = useState(null);
  const [history, setHistory] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterDisease, setFilterDisease] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    initUser();
  }, []);

  // Re-load the logged-in user every time this screen regains focus is a good
  // idea too (e.g. via useFocusEffect from @react-navigation/native), so that
  // switching accounts elsewhere in the app is reflected here immediately.
  const initUser = async () => {
    try {
      const raw = await AsyncStorage.getItem("user");
      if (!raw) {
        setLoading(false);
        Alert.alert(notLoggedInTitleLabel, notLoggedInMessageLabel);
        return;
      }
      const user = JSON.parse(raw);
      const uid = user.user_id;

      if (!uid) {
        setLoading(false);
        Alert.alert(errorTitleLabel, couldNotDetermineUserLabel);
        return;
      }

      setUserId(uid);
      await fetchData(uid);
    } catch (error) {
      console.error("Error initializing user:", error);
      setLoading(false);
      Alert.alert(errorTitleLabel, failedToLoadProfileLabel);
    }
  };

  const fetchData = async (uid) => {
    if (!uid) return;
    try {
      setLoading(true);
      const historyResponse = await fetch(`${baseURL}/log/history/${uid}`);
      const historyData = await historyResponse.json();
      setHistory(Array.isArray(historyData) ? historyData : []);

      const dashboardResponse = await fetch(`${baseURL}/log/dashboard/${uid}`);
      const dashboardJson = await dashboardResponse.json();
      setDashboardData(dashboardJson);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert(errorTitleLabel, failedToFetchHistoryLabel);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Re-read the logged-in user in case the account changed since last load.
    const raw = await AsyncStorage.getItem("user");
    const uid = raw ? JSON.parse(raw).user_id : userId;
    setUserId(uid);
    await fetchData(uid);
    setRefreshing(false);
  };

  // Kept for use from the Diagnose screen after a prediction is made.
  const savePredictionFromDiagnose = async (predictionData) => {
    try {
      const raw = await AsyncStorage.getItem("user");
      const uid = raw ? JSON.parse(raw).user_id : userId;
      if (!uid) return false;

      const response = await fetch(`${baseURL}/log/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: uid,
          predicted_class: predictionData.class || predictionData.predicted_class,
          confidence: parseFloat(predictionData.confidence || 0),
          severity: predictionData.severity || "Medium",
          ratio: parseFloat(predictionData.infected_ratio || 0),
        }),
      });
      const data = await response.json();
      if (response.ok) {
        fetchData(uid);
        return true;
      }
      console.error("Failed to save prediction:", data.detail);
      return false;
    } catch (error) {
      console.error("Error saving prediction:", error);
      return false;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "low":
        return styles.severityLow;
      case "medium":
        return styles.severityMedium;
      case "high":
        return styles.severityHigh;
      default:
        return styles.severityLow;
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return styles.confidenceHigh;
    if (confidence >= 60) return styles.confidenceMedium;
    return styles.confidenceLow;
  };

  const getSeverityEmoji = (severity) => {
    switch (severity?.toLowerCase()) {
      case "low":
        return "🟢";
      case "medium":
        return "🟡";
      case "high":
        return "🔴";
      default:
        return "⚪";
    }
  };

  const getFilteredHistory = () => {
    let filtered = history;
    if (filterDisease !== "All") {
      filtered = filtered.filter((item) =>
        item.class?.toLowerCase().includes(filterDisease.toLowerCase())
      );
    }
    filtered = [...filtered].sort((a, b) =>
      sortOrder === "newest"
        ? new Date(b.prediction_date) - new Date(a.prediction_date)
        : new Date(a.prediction_date) - new Date(b.prediction_date)
    );
    return filtered;
  };

  const getUniqueDiseases = () => {
    const diseases = history.map((item) => item.class).filter(Boolean);
    return ["All", ...new Set(diseases)];
  };

  const buildPieData = () => {
    if (!dashboardData?.disease_stats?.length) return [];
    return dashboardData.disease_stats.map((d, i) => ({
      name: d._id,
      population: d.count,
      color: getDiseaseColor(d._id, i),
      legendFontColor: "#333",
      legendFontSize: 12,
    }));
  };

  const buildSeverityBarData = () => {
    const counts = { Low: 0, Medium: 0, High: 0 };
    history.forEach((item) => {
      const sev = item.severity;
      const key =
        sev?.toLowerCase() === "low"
          ? "Low"
          : sev?.toLowerCase() === "medium" || sev?.toLowerCase() === "mild"
          ? "Medium"
          : sev?.toLowerCase() === "high" || sev?.toLowerCase() === "severe"
          ? "High"
          : null;
      if (key) counts[key] += 1;
    });
    return {
      labels: [lowLabelText, mediumLabelText, highLabelText],
      datasets: [{ data: [counts.Low, counts.Medium, counts.High] }],
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>{loadingLabel}</Text>
      </View>
    );
  }

  const filteredHistory = getFilteredHistory();
  const uniqueDiseases = getUniqueDiseases();
  const pieData = buildPieData();
  const barData = buildSeverityBarData();
  const hasHistory = history.length > 0;

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
    barPercentage: 0.6,
    propsForBackgroundLines: { stroke: "#f0f0f0" },
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
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
            <Ionicons name="person-outline" size={14} color="#fff" />
            <Text style={styles.userIdText} numberOfLines={1}>
              {userId ? userId.replace("user_", "").substring(0, 8) : "..."}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6C63FF"]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {dashboardData && (
          <View style={styles.dashboardContainer}>
            <Text style={styles.sectionTitle}>📊 {statisticsLabel}</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: "#EEF0FF" }]}>
                  <Ionicons name="analytics-outline" size={24} color="#6C63FF" />
                </View>
                <Text style={styles.statNumber}>{dashboardData.total_predictions ?? 0}</Text>
                <Text style={styles.statLabel}>{totalPredictionsLabel}</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: "#FFF3E0" }]}>
                  <Ionicons name="calendar-outline" size={24} color="#FF9800" />
                </View>
       

                  <Text
                    style={[
                      styles.statNumber,
                      {
                        fontSize: 25,
                      },
                    ]}
                  >
                    {history.length > 0
                      ? history[0]?.prediction_date
                      : naLabel}
                  </Text>
                <Text style={styles.statLabel}>{latestLabel}</Text>
              </View>
            </View>

            {pieData.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.subsectionTitle}>{diseaseDistributionLabel}</Text>
                <PieChart
                  data={pieData}
                  width={CHART_WIDTH - 32}
                  height={190}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="8"
                  absolute
                />
              </View>
            )}

            {hasHistory && (
              <View style={styles.chartCard}>
                <Text style={styles.subsectionTitle}>{severityBreakdownLabel}</Text>
                <BarChart
                  data={barData}
                  width={CHART_WIDTH - 32}
                  height={190}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
                  }}
                  fromZero
                  showValuesOnTopOfBars
                  withInnerLines={false}
                  style={{ borderRadius: 12 }}
                />
              </View>
            )}
          </View>
        )}

        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>📜 {historyLabel}</Text>

          {hasHistory && (
            <View style={styles.filterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {uniqueDiseases.map((disease) => (
                  <TouchableOpacity
                    key={disease}
                    style={[
                      styles.filterButton,
                      filterDisease === disease && styles.filterButtonActive,
                    ]}
                    onPress={() => setFilterDisease(disease)}
                  >
                    {disease === "All" ? (
                      <Text
                        style={[
                          styles.filterButtonText,
                          filterDisease === disease && styles.filterButtonTextActive,
                        ]}
                      >
                        {allLabel}
                      </Text>
                    ) : (
                      <TranslatedText
                        style={[
                          styles.filterButtonText,
                          filterDisease === disease && styles.filterButtonTextActive,
                        ]}
                      >
                        {disease}
                      </TranslatedText>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
              >
                <Ionicons name="swap-vertical" size={18} color="#666" />
                <Text style={styles.sortButtonText}>
                  {sortOrder === "newest" ? newestLabel : oldestLabel}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {filteredHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={64} color="#ddd" />
              <Text style={styles.emptyStateText}>{noPredictionsLabel}</Text>
              <Text style={styles.emptyStateSubtext}>{noPredictionsSubtextLabel}</Text>
            </View>
          ) : (
            filteredHistory.map((prediction, index) => (
              <TouchableOpacity
                key={prediction._id || index}
                style={styles.predictionCard}
                onPress={() => {
                  setSelectedPrediction(prediction);
                  setModalVisible(true);
                }}
                activeOpacity={0.9}
              >
                <View style={styles.predictionHeader}>
                  <View style={styles.predictionDateContainer}>
                    <Ionicons name="calendar-outline" size={14} color="#888" />
                    <Text style={styles.predictionDate}>{prediction.prediction_date}</Text>
                  </View>
                  <View style={styles.predictionTimeContainer}>
                    <Ionicons name="time-outline" size={14} color="#888" />
                    <Text style={styles.predictionTime}>{prediction.prediction_time}</Text>
                  </View>
                </View>

                <View style={styles.predictionBody}>
                  <View style={styles.diseaseInfo}>
                    <View style={styles.diseaseTag}>
                      <TranslatedText style={styles.diseaseTagText}>
                        {prediction.class}
                      </TranslatedText>
                    </View>
                    <View style={[styles.severityTag, getSeverityColor(prediction.severity)]}>
                      <TranslatedText style={styles.severityTagText}>
                        {`${getSeverityEmoji(prediction.severity)} ${prediction.severity}`}
                      </TranslatedText>
                    </View>
                  </View>

                  <View style={styles.predictionStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statItemLabel}>{confidenceLabel}</Text>
                      <Text
                        style={[styles.statItemValue, getConfidenceColor(prediction.confidence)]}
                      >
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
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {totalPrefixLabel}: {history.length} {predictionsSuffixLabel}
          </Text>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{predictionDetailsLabel}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#888" />
              </TouchableOpacity>
            </View>

            {selectedPrediction && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailCard}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>🦠 {diseaseDetailLabel}</Text>
                    <TranslatedText style={[styles.detailValue, { fontWeight: "bold" }]}>
                      {selectedPrediction.class}
                    </TranslatedText>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>📊 {confidenceLabel}</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        getConfidenceColor(selectedPrediction.confidence),
                      ]}
                    >
                      {selectedPrediction.confidence}%
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>⚠️ {severityDetailLabel}</Text>
                    <TranslatedText
                      style={[styles.detailValue, getSeverityColor(selectedPrediction.severity)]}
                    >
                      {`${getSeverityEmoji(selectedPrediction.severity)} ${selectedPrediction.severity}`}
                    </TranslatedText>
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

            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>{closeLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}