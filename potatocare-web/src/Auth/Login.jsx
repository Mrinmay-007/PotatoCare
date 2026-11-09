import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { View, Text, TextInput, Touchable, Gradient, Spinner, notify } from "../components/ui";
import Icon from "../components/Icon";
import api, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import styles from "../styles/LoginStyle";
import { sx } from "../utils/rn";

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  async function handleLogin(e) {
    e?.preventDefault();
    if (loading) return;

    const cleanEmail = email.trim();
    if (!cleanEmail || !pin) {
      notify("Error", "Please enter email and PIN.");
      return;
    }

    try {
      setLoading(true);

      // Same backend route as before: POST /user/login?email=...&pin=...
      const res = await api.post("/user/login", null, {
        params: { email: cleanEmail, pin },
      });

      login(res.data);
      navigate("/home", { replace: true });
    } catch (err) {
      notify("Login Failed", errorMessage(err, "Invalid credentials"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Gradient
      colors={["#1E1712", "#2F251C", "#1E1712"]}
      style={sx(styles.container, { height: "100%", overflowY: "auto", justifyContent: "safe center" })}
    >
      <View style={styles.logoSection}>
        <View style={styles.circle}>
          <Icon name="leaf" size={70} color="#4F8261" />
        </View>

        <Text style={styles.title}>Potato Disease Detection</Text>
        <Text style={styles.subtitle}>AI-powered diagnosis for healthier potato crops.</Text>
      </View>

      <form onSubmit={handleLogin} style={sx(styles.card, { display: "flex", flexDirection: "column" })}>
        <Text style={styles.welcome}>Welcome Back</Text>
        <Text style={styles.description}>Login to continue monitoring your crops.</Text>

        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          type="email"
          autoCapitalize="none"
          autoComplete="username"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="PIN"
            style={styles.passwordInput}
            type={showPin ? "text" : "password"}
            inputMode="numeric"
            autoComplete="current-password"
            value={pin}
            onChangeText={(t) => setPin(t.replace(/\D/g, ""))}
          />

          <Touchable onPress={() => setShowPin((v) => !v)} aria-label={showPin ? "Hide PIN" : "Show PIN"}>
            <Icon name={showPin ? "eye-off" : "eye"} size={22} color="#555" />
          </Touchable>
        </View>

        <Touchable type="submit" style={sx(styles.button, loading && { opacity: 0.7 })} disabled={loading}>
          {loading ? <Spinner color="#fff" /> : <Text style={styles.buttonText}>LOGIN</Text>}
        </Touchable>

        <Touchable onPress={() => navigate("/signup")}>
          <Text style={styles.signup}>
            Don't have an account?
            <Text style={{ color: "#2E7D32", fontWeight: "700" }}> Sign Up</Text>
          </Text>
        </Touchable>
      </form>
    </Gradient>
  );
}
