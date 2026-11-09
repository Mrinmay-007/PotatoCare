import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Text, View, Touchable, ScrollView, Gradient } from "../components/ui";
import Icon from "../components/Icon";
import api from "../services/api";
import useTranslate from "../hooks/useTranslate";
import styles from "../styles/HomeStyle";
import { sx } from "../utils/rn";

const getWeatherIcon = (condition) => {
  const cond = condition?.toLowerCase() || "";
  if (cond.includes("rain") || cond.includes("shower")) return "rainy";
  if (cond.includes("cloud")) return "cloudy";
  if (cond.includes("sun") || cond.includes("clear")) return "sunny";
  if (cond.includes("snow")) return "snow";
  if (cond.includes("fog") || cond.includes("mist")) return "cloudy-night";
  return "partly-sunny";
};

export default function Home() {
  const navigate = useNavigate();

  const welcomeText = useTranslate("Welcome to PotatoCare");
  const quickActionsTitle = useTranslate("Quick Actions");
  const quickActionsSubtitle = useTranslate("Everything you need, one tap away");
  const weatherLoadingText = useTranslate("Loading...");
  const weatherClearText = useTranslate("Clear");
  const weatherYourLocationText = useTranslate("Your Location");
  const footerTaglineText = useTranslate("🌱 Keep your plants healthy");
  const footerVersionText = useTranslate("Version 2.0.0");

  const diagnoseTitle = useTranslate("Diagnose Your Plant");
  const diagnoseSubtitle = useTranslate("Detect disease from plant leaves");
  const treatmentTitle = useTranslate("Treatment Guide");
  const treatmentSubtitle = useTranslate("Get treatment suggestions");
  const logbookTitle = useTranslate("Your Logbook");
  const logbookSubtitle = useTranslate("View prediction history");
  const weatherTitle = useTranslate("Weather");
  const weatherSubtitle = useTranslate("Check weather conditions");

  const goodMorningText = useTranslate("Good Morning");
  const goodAfternoonText = useTranslate("Good Afternoon");
  const goodEveningText = useTranslate("Good Evening");

  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Derived on render (was copied into state once, so it stayed English after
  // the translation arrived or the language changed).
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return goodMorningText;
    if (hour < 17) return goodAfternoonText;
    return goodEveningText;
  }, [goodMorningText, goodAfternoonText, goodEveningText]);

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const fetchWeather = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/weather/current");
      if (alive.current) setWeather(response.data);
    } catch {
      if (alive.current) setWeather(null);
    } finally {
      if (alive.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Single fetch on mount (the original registered this effect twice, so the
  // weather request was sent two times on every visit).
  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWeather();
  };

  const menuItems = [
    { id: "diagnose", title: diagnoseTitle, subtitle: diagnoseSubtitle, icon: "local-florist", family: "material", color: "#6C63FF", route: "/diagnose" },
    { id: "treatment", title: treatmentTitle, subtitle: treatmentSubtitle, icon: "pills", family: "fa", color: "#FF6B6B", route: "/treatment" },
    { id: "logbook", title: logbookTitle, subtitle: logbookSubtitle, icon: "person", family: "material", color: "#00B894", route: "/logbook" },
    { id: "weather", title: weatherTitle, subtitle: weatherSubtitle, icon: "cloud-outline", family: "ion", color: "#2196F3", route: "/weather" },
  ];

  return (
    <View style={styles.safeArea}>
      {/* Hero header */}
      <Gradient
        colors={["#141327", "#241F45"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroEyebrow}>{greeting}</Text>
            <Text style={styles.heroTitle}>{welcomeText}</Text>
          </View>
          <Touchable style={styles.bellButton} activeOpacity={0.8} aria-label="Notifications">
            <Icon name="notifications-outline" size={20} color="#F5F3FF" />
            <View style={styles.bellDot} />
          </Touchable>
        </View>

        {/* Compact weather chip inside hero */}
        <Touchable style={styles.weatherChip} onPress={() => navigate("/weather")} activeOpacity={0.85}>
          <View style={styles.weatherChipIconWrap}>
            <Icon
              name={
                weather && !loading
                  ? getWeatherIcon(weather?.condition || weather?.Weather)
                  : "cloud-outline"
              }
              size={22}
              color="#141327"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.weatherChipTemp}>
              {loading
                ? weatherLoadingText
                : `${weather?.temperature?.current || "N/A"} · ${
                    weather?.condition || weather?.Weather || weatherClearText
                  }`}
            </Text>
            <Text style={styles.weatherChipLocation} numberOfLines={1}>
              {loading ? "..." : weather?.City || weatherYourLocationText}
            </Text>
          </View>
          <Icon name="chevron-forward" size={18} color="rgba(245,243,255,0.6)" />
        </Touchable>
      </Gradient>

      <ScrollView contentContainerStyle={styles.container} onRefresh={onRefresh} refreshing={refreshing}>
        <Text style={styles.sectionTitle}>{quickActionsTitle}</Text>
        <Text style={styles.sectionSubtitle}>{quickActionsSubtitle}</Text>

        <View style={styles.grid}>
          {menuItems.map((item) => (
            <Touchable
              key={item.id}
              style={styles.tile}
              onPress={() => navigate(item.route)}
              activeOpacity={0.88}
            >
              <View style={sx(styles.tileIconWrap, { backgroundColor: `${item.color}18` })}>
                <Icon
                  name={item.icon}
                  family={item.family}
                  size={item.family === "fa" ? 22 : 26}
                  color={item.color}
                />
              </View>
              <Text style={styles.tileTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.tileSubtitle} numberOfLines={2}>
                {item.subtitle}
              </Text>
              <View style={sx(styles.tileAccent, { backgroundColor: item.color })} />
            </Touchable>
          ))}
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>{footerTaglineText}</Text>
          <Text style={styles.footerVersion}>{footerVersionText}</Text>
        </View>
      </ScrollView>
    </View>
  );
}
