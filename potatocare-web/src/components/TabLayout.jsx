import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { View, Text } from "./ui";
import Icon from "./Icon";
import Header from "./Header";
import { useAuth } from "../context/AuthContext";
import { createStyles } from "../utils/rn";

// Same five tabs / icons / colors as the original bottom-tab navigator.
const TABS = [
  { path: "/home", label: "Home", icon: "home" },
  { path: "/weather", label: "Weather", icon: "cloud" },
  { path: "/diagnose", label: "Diagnose", icon: "scan" },
  { path: "/treatment", label: "Treatment", icon: "medkit" },
  { path: "/logbook", label: "Logbook", icon: "book" },
];

export default function TabLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <View style={styles.root}>
      <Header onProfile={() => navigate("/profile")} onLogout={handleLogout} />

      <View style={styles.content}>
        <Outlet />
      </View>

      <nav style={styles.tabBar}>
        {TABS.map((tab) => (
          <NavLink key={tab.path} to={tab.path} style={{ textDecoration: "none", flex: 1 }}>
            {({ isActive }) => {
              const color = isActive ? "#2E7D32" : "gray";
              return (
                <View style={styles.tabItem}>
                  <Icon name={tab.icon} size={24} color={color} />
                  <Text style={{ ...styles.tabLabel, color }}>{tab.label}</Text>
                </View>
              );
            }}
          </NavLink>
        ))}
      </nav>
    </View>
  );
}

const styles = createStyles({
  root: { flex: 1, height: "100%", backgroundColor: "#fff" },
  content: { flex: 1, overflow: "hidden", backgroundColor: "#F5F5F5" },
  tabBar: {
    display: "flex",
    flexShrink: 0,
    height: 65,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderTop: "1px solid #e5e5e5",
  },
  tabItem: { alignItems: "center", justifyContent: "center", gap: 2 },
  tabLabel: { fontSize: 10, fontWeight: "500" },
});
