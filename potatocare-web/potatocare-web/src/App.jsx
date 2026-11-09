import React from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import TabLayout from "./components/TabLayout";
import { View, Text, Touchable } from "./components/ui";
import Icon from "./components/Icon";

import LoginScreen from "./Auth/Login";
import SignupScreen from "./Auth/Signup";
import HomeScreen from "./screens/HomeScreen";
import WeatherScreen from "./screens/WeatherScreen";
import DiagnoseScreen from "./screens/DiagnoseScreen";
import TreatmentScreen from "./screens/TreatmentScreen";
import LogbookScreen from "./screens/LogbookScreen";
import ProfileScreen from "./screens/ProfileScreen";

// Blocks the app screens until the user has logged in.
function RequireAuth() {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

// Login / Signup: skip straight to the app if a session already exists.
function PublicOnly() {
  const { user } = useAuth();
  return user ? <Navigate to="/home" replace /> : <Outlet />;
}

// Stack-style "Profile" page with a back header (was a native-stack screen).
function ProfileLayout() {
  const navigate = useNavigate();
  return (
    <View style={{ flex: 1, height: "100%", backgroundColor: "#F5F5F5" }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          height: 56,
          padding: "0 16px",
          backgroundColor: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
        }}
      >
        <Touchable onPress={() => navigate(-1)} aria-label="Back">
          <Icon name="chevron-back" size={24} color="#222" />
        </Touchable>
        <Text style={{ fontSize: 18, fontWeight: "600", color: "#222" }}>Profile</Text>
      </View>
      <View style={{ flex: 1, overflow: "auto" }}>
        <ProfileScreen />
      </View>
    </View>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          {/* Phone-width column, same proportions as the mobile UI */}
          <div
            style={{
              maxWidth: 520,
              height: "100dvh",
              margin: "0 auto",
              background: "#fff",
              boxShadow: "0 0 24px rgba(0,0,0,0.12)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Routes>
              <Route element={<PublicOnly />}>
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/signup" element={<SignupScreen />} />
              </Route>

              <Route element={<RequireAuth />}>
                <Route element={<TabLayout />}>
                  <Route path="/home" element={<HomeScreen />} />
                  <Route path="/weather" element={<WeatherScreen />} />
                  <Route path="/diagnose" element={<DiagnoseScreen />} />
                  <Route path="/treatment" element={<TreatmentScreen />} />
                  <Route path="/logbook" element={<LogbookScreen />} />
                </Route>
                <Route path="/profile" element={<ProfileLayout />} />
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
