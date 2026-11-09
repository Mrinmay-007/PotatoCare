import React from "react";
import { View, Text, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import styles from "../styles/ProfileStyle";

const LANGUAGES = [
  ["english", "English"], ["hindi", "Hindi"], ["bengali", "Bengali"], ["gujarati", "Gujarati"],
  ["kannada", "Kannada"], ["malayalam", "Malayalam"], ["marathi", "Marathi"], ["odia", "Odia"],
  ["punjabi", "Punjabi"], ["tamil", "Tamil"], ["telugu", "Telugu"], ["urdu", "Urdu"],
  ["sanskrit", "Sanskrit"], ["bhojpuri", "Bhojpuri"], ["maithili", "Maithili"], ["meitei", "Meitei"],
  ["santali", "Santali"], ["awadhi", "Awadhi"], ["bodo", "Bodo"], ["khasi", "Khasi"],
  ["kokborok", "Kokborok"], ["marwadi", "Marwadi"], ["tulu", "Tulu"],
];

export default function ProfileScreen() {
  const { user } = useAuth();
  const { language, changeLanguage } = useLanguage();

  if (!user) {
    return (
      <View style={styles.loader}>
        <Spinner size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👤 Profile</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{user.name}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user.email}</Text>

        <Text style={styles.label}>User ID</Text>
        <Text style={styles.value}>{user.user_id}</Text>

        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>{user.role}</Text>

        <Text style={styles.label}>Created Date</Text>
        <Text style={styles.value}>{user.created_date}</Text>

        <Text style={styles.label}>Created Time</Text>
        <Text style={styles.value}>{user.created_time}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.languageTitle}>🌐 Select Language</Text>

        <select
          value={language}
          onChange={(e) => changeLanguage(e.target.value)}
          aria-label="Select language"
          style={{
            width: "100%",
            padding: "12px 10px",
            fontSize: 16,
            borderRadius: 8,
            border: "1px solid #ddd",
            background: "#fff",
          }}
        >
          {LANGUAGES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </View>
    </View>
  );
}
