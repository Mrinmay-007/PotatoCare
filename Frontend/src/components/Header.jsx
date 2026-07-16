// import React from "react";
// import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
// import { Ionicons } from "@expo/vector-icons";

// export default function Header({ navigation, onLogout }) {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.logo}>🌿 PotatoCare</Text>

//       <View style={styles.right}>
//         <TouchableOpacity
//           onPress={() => navigation.navigate("Profile")}
//         >
//           <Ionicons
//             name="person-circle-outline"
//             size={30}
//             color="#2E7D32"
//           />
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={{ marginLeft: 15 }}
//           onPress={onLogout}
//         >
//           <Ionicons
//             name="log-out-outline"
//             size={28}
//             color="red"
//           />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     height: 60,
//     paddingHorizontal: 18,
//     backgroundColor: "#fff",
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     elevation: 4,
//   },

//   logo: {
//     fontSize: 22,
//     fontWeight: "700",
//     color: "#2E7D32",
//   },

//   right: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
// });


import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Header({ navigation, onLogout }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.logo}>🌿 PotatoCare</Text>

        <View style={styles.right}>
          <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
            <Ionicons
              name="person-circle-outline"
              size={30}
              color="#2E7D32"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginLeft: 15 }}
            onPress={onLogout}
          >
            <Ionicons
              name="log-out-outline"
              size={28}
              color="red"
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#fff",
    paddingTop: 25, // Increase to 15 or 20 if you want more space
  },

  container: {
    height: 60,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
    backgroundColor: "#fff",
  },

  logo: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2E7D32",
  },

  right: {
    flexDirection: "row",
    alignItems: "center",
  },
});