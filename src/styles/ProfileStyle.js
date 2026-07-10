import { StyleSheet } from "react-native";



const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2E7D32",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 18,
    marginBottom: 20,
    elevation: 3,
  },

  label: {
    fontSize: 13,
    color: "#777",
    marginTop: 10,
  },

  value: {
    fontSize: 17,
    fontWeight: "600",
    color: "#222",
    marginBottom: 5,
  },

  languageTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2E7D32",
  },
});

export default styles