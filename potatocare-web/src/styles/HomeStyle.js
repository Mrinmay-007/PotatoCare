

import { createStyles } from "../utils/rn";


const styles = createStyles({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F5FB",
  },

  hero: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },

  heroEyebrow: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(245,243,255,0.6)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },

  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  bellDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#FF6B6B",
    borderWidth: 1.5,
    borderColor: "#241F45",
  },

  weatherChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  weatherChipIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  weatherChipTemp: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  weatherChipLocation: {
    fontSize: 12,
    color: "rgba(245,243,255,0.6)",
    marginTop: 2,
  },

  container: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 30,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 4,
  },

  sectionSubtitle: {
    fontSize: 13,
    color: "#8B8B9E",
    marginBottom: 18,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  tile: {
    width: "calc((100% - 16px) / 2)",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.06,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowRadius: 14,
    elevation: 3,
  },

  tileIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  tileTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 4,
  },

  tileSubtitle: {
    fontSize: 12,
    color: "#9494A6",
    lineHeight: 16,
  },

  tileAccent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },

  footerContainer: {
    alignItems: "center",
    marginTop: 10,
    paddingBottom: 10,
  },

  footerText: {
    fontSize: 13,
    color: "#B0B0C0",
    fontWeight: "500",
  },

  footerVersion: {
    fontSize: 11,
    color: "#CACAD6",
    marginTop: 4,
  },
});

export default styles;