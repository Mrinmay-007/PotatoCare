import React from "react";
import { View, Text, Touchable } from "./ui";
import Icon from "./Icon";
import { createStyles } from "../utils/rn";

export default function Header({ onProfile, onLogout }) {
  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.logo}>🌿 PotatoCare</Text>

        <View style={styles.right}>
          <Touchable onPress={onProfile} aria-label="Profile">
            <Icon name="person-circle-outline" size={30} color="#2E7D32" />
          </Touchable>

          <Touchable style={{ marginLeft: 15 }} onPress={onLogout} aria-label="Log out">
            <Icon name="log-out-outline" size={28} color="red" />
          </Touchable>
        </View>
      </View>
    </View>
  );
}

const styles = createStyles({
  safeArea: {
    backgroundColor: "#fff",
    paddingTop: "env(safe-area-inset-top, 0px)",
    boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
    zIndex: 5,
  },
  container: {
    height: 60,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
