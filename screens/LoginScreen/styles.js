import { Colors } from "../../config";
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    fontWeight: "bold",
    fontSize: 42,
    color: Colors.primary,
    marginBottom: 40,
  },
  inputView: {
    width: "80%",
    backgroundColor: Colors.background,
    borderRadius: 25,
    height: 50,
    marginBottom: 20,
    justifyContent: "center",
    padding: 20,
    borderWidth: 0.5,
    borderColor: Colors.gray,
  },
  inputText: {
    height: 50,
    color: Colors.black,
  },
  forgot: {
    color: Colors.primary,
    fontSize: 11,
  },
  loginBtn: {
    width: "80%",
    backgroundColor: Colors.primary,
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  googleBtn: {
    width: "80%",
    backgroundColor: Colors.googleButton,
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    marginTop: 40,
    marginBottom: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
  fbBtn: {
    width: "80%",
    backgroundColor: Colors.fbButton,
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    marginBottom: 10,
    flexDirection: "row",
  },
  loginText: {
    color: Colors.white,
  },
  loginGoogleText: {
    color: Colors.black,
    marginLeft: 10,
  },
  create: {
    color: Colors.primary,
    fontWeight: "bold",
  },
  orContener: {
    width: "80%",
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  borderline: {
    borderWidth: 0.5,
    width: "40%",
    height: 0.5,
    backgroundColor: Colors.smallText,
    borderColor: Colors.smallText,
  },
  or: {
    color: Colors.smallText,
    fontWeight: "bold",
    marginHorizontal: 10,
  },
});

export default styles;
