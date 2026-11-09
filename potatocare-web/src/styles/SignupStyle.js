import { createStyles } from "../utils/rn";

const styles = createStyles({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  logoSection: {
    alignItems: "center",
    marginBottom: 35,
  },

  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },

  subtitle: {
    color: "#d5d5d5",
    marginTop: 10,
    textAlign: "center",
    fontSize: 15,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 25,
    elevation: 10,
  },

  welcome: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#222",
  },

  description: {
    marginTop: 5,
    marginBottom: 25,
    color: "#777",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 15,
    marginBottom: 18,
    fontSize: 16,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 22,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
  },

  button: {
    backgroundColor: "#2E7D32",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
  },

  signup: {
    marginTop: 20,
    textAlign: "center",
    color: "#666",
    fontSize: 15,
  },

  link: {
    color: "#2E7D32",
    fontWeight: "700",
  },
});
export default styles