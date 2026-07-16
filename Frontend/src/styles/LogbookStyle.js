import { StyleSheet  } from "react-native";


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6C63FF",
    fontWeight: "600",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
  },

  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },

  userBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    maxWidth: 130,
  },

  userIdText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },

  scrollView: {
    flex: 1,
  },

  dashboardContainer: {
    padding: 16,
    paddingTop: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 14,
  },

  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A2E",
  },

  statLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },

  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  subsectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    alignSelf: "flex-start",
  },

  historyContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },

  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    marginRight: 6,
  },

  filterButtonActive: {
    backgroundColor: "#6C63FF",
  },

  filterButtonText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },

  filterButtonTextActive: {
    color: "#fff",
  },

  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  sortButtonText: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },

  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  emptyStateText: {
    fontSize: 18,
    color: "#999",
    marginTop: 12,
    fontWeight: "600",
  },

  emptyStateSubtext: {
    fontSize: 14,
    color: "#bbb",
    marginTop: 4,
    textAlign: "center",
  },

  predictionCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  predictionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },

  predictionDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  predictionDate: {
    fontSize: 12,
    color: "#888",
  },

  predictionTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  predictionTime: {
    fontSize: 12,
    color: "#888",
  },

  predictionBody: {
    gap: 10,
  },

  diseaseInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  diseaseTag: {
    backgroundColor: "#EEF0FF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  diseaseTagText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6C63FF",
  },

  severityTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  severityTagText: {
    fontSize: 12,
    fontWeight: "600",
  },

  predictionStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    padding: 10,
  },

  statItem: {
    alignItems: "center",
    flex: 1,
  },

  statItemLabel: {
    fontSize: 11,
    color: "#999",
  },

  statItemValue: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },

  statDivider: {
    width: 1,
    backgroundColor: "#e8e8e8",
  },

  confidenceHigh: {
    color: "#4CAF50",
  },

  confidenceMedium: {
    color: "#FF9800",
  },

  confidenceLow: {
    color: "#f44336",
  },

  severityLow: {
    backgroundColor: "#E8F5E9",
  },

  severityMedium: {
    backgroundColor: "#FFF3E0",
  },

  severityHigh: {
    backgroundColor: "#FFEBEE",
  },

  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },

  footerText: {
    fontSize: 13,
    color: "#999",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "92%",
    maxHeight: "85%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A2E",
  },

  detailCard: {
    gap: 4,
  },

  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },

  detailLabel: {
    fontSize: 14,
    color: "#666",
  },

  detailValue: {
    fontSize: 14,
    color: "#1A1A2E",
    fontWeight: "500",
  },

  closeButton: {
    backgroundColor: "#f5f5f5",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },

  closeButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
});

export default styles;