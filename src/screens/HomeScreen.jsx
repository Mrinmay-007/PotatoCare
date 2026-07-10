

import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

import api from "../services/api";
import useTranslate from "../hooks/useTranslate";
import styles from "../styles/HomeStyle"

// const { width } = Dimensions.get("window");

export default function Home({ navigation }) {

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
  const [greeting, setGreeting] = useState(goodMorningText);

  useEffect(() => {
    fetchWeather();
    getGreeting();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(goodMorningText);
    else if (hour < 17) setGreeting(goodAfternoonText);
    else setGreeting(goodEveningText);
  };


const fetchWeather = async () => {
  try {
    setLoading(true);

    // console.log("Fetching weather...");

    const response = await api.get("/weather/current");

    // console.log("Weather:", response.data);

    setWeather(response.data);
  } catch (error) {
    // console.log("Weather Error:", error);

    if (error.response) {
      // console.log("Status:", error.response.status);
      // console.log("Data:", error.response.data);
    }

    setWeather(null);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

const onRefresh = () => {
  setRefreshing(true);
  fetchWeather();
};

useEffect(() => {
  fetchWeather();
  getGreeting();
}, []);

  const getWeatherIcon = (condition) => {
    const cond = condition?.toLowerCase() || "";
    if (cond.includes("rain") || cond.includes("shower")) return "rainy";
    if (cond.includes("cloud")) return "cloudy";
    if (cond.includes("sun") || cond.includes("clear")) return "sunny";
    if (cond.includes("snow")) return "snow";
    if (cond.includes("fog") || cond.includes("mist")) return "cloudy-night";
    return "partly-sunny";
  };

  const menuItems = [
    {
      id: "diagnose",
      title: diagnoseTitle,
      subtitle: diagnoseSubtitle,
      icon: "local-florist",
      iconType: "material",
      color: "#6C63FF",
      route: "Diagnose",
    },
    {
      id: "treatment",
      title: treatmentTitle,
      subtitle: treatmentSubtitle,
      icon: "pills",
      iconType: "fontawesome5",
      color: "#FF6B6B",
      route: "Treatment",
    },
    {
      id: "logbook",
      title: logbookTitle,
      subtitle: logbookSubtitle,
      icon: "person",
      iconType: "material",
      color: "#00B894",
      route: "Logbook",
    },
    {
      id: "weather",
      title: weatherTitle,
      subtitle: weatherSubtitle,
      icon: "cloud-outline",
      iconType: "ionicon",
      color: "#2196F3",
      route: "Weather",
    },
  ];

  const renderIcon = (item, size = 26) => {
    if (item.iconType === "material") {
      return <MaterialIcons name={item.icon} size={size} color={item.color} />;
    } else if (item.iconType === "fontawesome5") {
      return <FontAwesome5 name={item.icon} size={size - 4} color={item.color} />;
    } else if (item.iconType === "ionicon") {
      return <Ionicons name={item.icon} size={size} color={item.color} />;
    }
    return <Ionicons name={item.icon} size={size} color={item.color} />;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Hero header */}
      <LinearGradient
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
          <TouchableOpacity style={styles.bellButton} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={20} color="#F5F3FF" />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        {/* Compact weather chip inside hero */}
        <TouchableOpacity
          style={styles.weatherChip}
          onPress={() => navigation.navigate("Weather")}
          activeOpacity={0.85}
        >
          <View style={styles.weatherChipIconWrap}>
            <Ionicons
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
          <Ionicons name="chevron-forward" size={18} color="rgba(245,243,255,0.6)" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" colors={["#6C63FF"]} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>{quickActionsTitle}</Text>
        <Text style={styles.sectionSubtitle}>{quickActionsSubtitle}</Text>

        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.tile,
                index % 2 === 0 ? { marginRight: 8 } : { marginLeft: 8 },
              ]}
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.88}
            >
              <View style={[styles.tileIconWrap, { backgroundColor: `${item.color}18` }]}>
                {renderIcon(item, 26)}
              </View>
              <Text style={styles.tileTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.tileSubtitle} numberOfLines={2}>
                {item.subtitle}
              </Text>
              <View style={[styles.tileAccent, { backgroundColor: item.color }]} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>{footerTaglineText}</Text>
          <Text style={styles.footerVersion}>{footerVersionText}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
