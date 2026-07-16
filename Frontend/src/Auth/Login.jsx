import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";
import styles from "../styles/LoginStyle";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  async function handleLogin() {
    if (!email || !pin) {
      Alert.alert("Error", "Please enter email and PIN.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post(
        `/user/login?email=${encodeURIComponent(email)}&pin=${pin}`
      );

      await AsyncStorage.setItem("user", JSON.stringify(res.data));

      // navigation.replace("Home");
      navigation.replace("MainTabs");
    } catch (err) {
      Alert.alert(
        "Login Failed",
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Invalid credentials"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={["#1E1712", "#2F251C", "#1E1712"]}
      style={styles.container}
    >
      <View style={styles.logoSection}>
        <View style={styles.circle}>
          <Ionicons
            name="leaf"
            size={70}
            color="#4F8261"
          />
        </View>

        <Text style={styles.title}>Potato Disease Detection</Text>

        <Text style={styles.subtitle}>
          AI-powered diagnosis for healthier potato crops.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.welcome}>Welcome Back</Text>

        <Text style={styles.description}>
          Login to continue monitoring your crops.
        </Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="PIN"
            placeholderTextColor="#999"
            style={styles.passwordInput}
            secureTextEntry={!showPin}
            keyboardType="number-pad"
            value={pin}
            onChangeText={setPin}
          />

          <TouchableOpacity onPress={() => setShowPin(!showPin)}>
            <Ionicons
              name={showPin ? "eye-off" : "eye"}
              size={22}
              color="#555"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>LOGIN</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Signup")}
        >
          <Text style={styles.signup}>
            Don't have an account?
            <Text style={{ color: "#2E7D32", fontWeight: "700" }}>
              {" "}
              Sign Up
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

