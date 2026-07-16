

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useLanguage } from "../context/LanguageContext";
import styles from "../styles/ProfileStyle";


export default function ProfileScreen() {
  const [user, setUser] = useState(null);

  const { language, changeLanguage } = useLanguage();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const data = await AsyncStorage.getItem("user");

    if (data) {
      setUser(JSON.parse(data));
    }
  };

  if (!user) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2E7D32" />
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

        <Picker
          selectedValue={language}
          onValueChange={(itemValue) => changeLanguage(itemValue)}
        >
          <Picker.Item label="English" value="english" />
          <Picker.Item label="Hindi" value="hindi" />
          <Picker.Item label="Bengali" value="bengali" />
          <Picker.Item label="Gujarati" value="gujarati" />
          <Picker.Item label="Kannada" value="kannada" />
          <Picker.Item label="Malayalam" value="malayalam" />
          <Picker.Item label="Marathi" value="marathi" />
          <Picker.Item label="Odia" value="odia" />
          <Picker.Item label="Punjabi" value="punjabi" />
          <Picker.Item label="Tamil" value="tamil" />
          <Picker.Item label="Telugu" value="telugu" />
          <Picker.Item label="Urdu" value="urdu" />
          <Picker.Item label="Sanskrit" value="sanskrit" />
          <Picker.Item label="Bhojpuri" value="bhojpuri" />
          <Picker.Item label="Maithili" value="maithili" />
          <Picker.Item label="Meitei" value="meitei" />
          <Picker.Item label="Santali" value="santali" />
          <Picker.Item label="Awadhi" value="awadhi" />
          <Picker.Item label="Bodo" value="bodo" />
          <Picker.Item label="Khasi" value="khasi" />
          <Picker.Item label="Kokborok" value="kokborok" />
          <Picker.Item label="Marwadi" value="marwadi" />
          <Picker.Item label="Tulu" value="tulu" />
        </Picker>
      </View>
    </View>
  );
}

