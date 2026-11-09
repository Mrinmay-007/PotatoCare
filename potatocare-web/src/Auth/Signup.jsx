import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { View, Text, TextInput, Touchable, Gradient, Spinner, notify } from "../components/ui";
import Icon from "../components/Icon";
import api, { errorMessage } from "../services/api";
import styles from "../styles/SignupStyle";
import { sx } from "../utils/rn";

export default function SignupScreen() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  async function handleSignup(e) {
    e?.preventDefault();
    if (loading) return;

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanEmail || !pin) {
      notify("Error", "Please fill all fields.");
      return;
    }

    if (pin.length !== 6) {
      notify("Invalid PIN", "PIN must be exactly 6 digits.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/user", {
        name: cleanName,
        email: cleanEmail,
        pin,
        role: "user",
      });

      notify("Account Created", "Your account has been created successfully.");
      navigate("/login", { replace: true });
    } catch (err) {
      notify("Signup Failed", errorMessage(err, "Unable to create account."));
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
        <Text style={styles.subtitle}>Create your account to start protecting your crops.</Text>
      </View>

      <form onSubmit={handleSignup} style={sx(styles.card, { display: "flex", flexDirection: "column" })}>
        <Text style={styles.welcome}>Create Account</Text>
        <Text style={styles.description}>Join us and monitor your potato crops with AI.</Text>

        <TextInput
          placeholder="Full Name"
          style={styles.input}
          value={name}
          onChangeText={setName}
          autoComplete="name"
        />

        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          type="email"
          autoComplete="username"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Create 6-Digit PIN"
            style={styles.passwordInput}
            type={showPin ? "text" : "password"}
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={6}
            value={pin}
            onChangeText={(t) => setPin(t.replace(/\D/g, ""))}
          />

          <Touchable onPress={() => setShowPin((v) => !v)} aria-label={showPin ? "Hide PIN" : "Show PIN"}>
            <Icon name={showPin ? "eye-off" : "eye"} size={22} color="#555" />
          </Touchable>
        </View>

        <Touchable type="submit" style={sx(styles.button, loading && { opacity: 0.7 })} disabled={loading}>
          {loading ? <Spinner color="#fff" /> : <Text style={styles.buttonText}>CREATE ACCOUNT</Text>}
        </Touchable>

        <Touchable onPress={() => navigate("/login")}>
          <Text style={styles.signup}>
            Already have an account?
            <Text style={styles.link}> Login</Text>
          </Text>
        </Touchable>
      </form>
    </Gradient>
  );
}
