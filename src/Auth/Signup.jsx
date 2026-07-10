import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";
import styles from "../styles/SignupStyle";

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);



async function handleSignup() {
  if (!name || !email || !pin) {
    Alert.alert("Error", "Please fill all fields.");
    return;
  }

  if (pin.length !== 6) {
    Alert.alert("Invalid PIN", "PIN must be exactly 6 digits.");
    return;
  }

  try {
    setLoading(true);

    await api.post("/user", {
      name,
      email,
      pin,
      role: "user",
    });

    Alert.alert(
      "Account Created",
      "Your account has been created successfully.",
      [
        {
          text: "OK",
          onPress: () => navigation.replace("Login"),
        },
      ]
    );
  } catch (err) {
    Alert.alert(
      "Signup Failed",
      err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Unable to create account."
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
          Create your account to start protecting your crops.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.welcome}>Create Account</Text>

        <Text style={styles.description}>
          Join us and monitor your potato crops with AI.
        </Text>

        <TextInput
          placeholder="Full Name"
          placeholderTextColor="#999"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.passwordContainer}>
  <TextInput
    placeholder="Create 6-Digit PIN"
    placeholderTextColor="#999"
    style={styles.passwordInput}
    secureTextEntry={!showPin}
    keyboardType="number-pad"
    maxLength={6}
    value={pin}
    onChangeText={(text) => setPin(text.replace(/[^0-9]/g, ""))}
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
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.signup}>
            Already have an account?
            <Text style={styles.link}> Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
