


import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import HomeScreen from "../screens/HomeScreen";
import DiagnoseScreen from "../screens/DiagnoseScreen";
import TreatmentScreen from "../screens/TreatmentScreen";
import LogbookScreen from "../screens/LogbookScreen";
import WeatherScreen from "../screens/WeatherScreen";

import Header from "../components/Header";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const logout = async (navigation) => {
    await AsyncStorage.removeItem("user");
    navigation.replace("Login");
  };

  return (
    <Tab.Navigator
      screenOptions={({ navigation, route }) => ({
        header: () => (
          <Header
            navigation={navigation}
            onLogout={() => logout(navigation)}
          />
        ),

        tabBarActiveTintColor: "#2E7D32",
        tabBarInactiveTintColor: "gray",

        tabBarStyle: {
          height: 65,
          paddingTop: 8,
          paddingBottom: 8,
        },

        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case "Home":
              iconName = "home";
              break;

            case "Weather":
              iconName =  "cloud" ;
              break;

            case "Diagnose":
              iconName = "scan";
              break;

            case "Treatment":
              iconName = "medkit";
              break;

            case "Logbook":
              iconName = "book";
              break;

            default:
              iconName = "ellipse";
          }

          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Weather" component={WeatherScreen} />
      <Tab.Screen name="Diagnose" component={DiagnoseScreen} />
      <Tab.Screen name="Treatment" component={TreatmentScreen} />
      <Tab.Screen name="Logbook" component={LogbookScreen} />
    </Tab.Navigator>
  );
}