import React, { Component } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import Constants from "expo-constants";
import * as Facebook from "expo-facebook";
import * as AppAuth from "expo-app-auth";
import * as WebBrowser from "expo-web-browser";
import * as Notifications from "expo-notifications";
import * as Permissions from "expo-permissions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { Configuration, Colors } from "../config";

WebBrowser.maybeCompleteAuthSession();

let config = {
  issuer: "https://accounts.google.com",
  scopes: ["openid", "profile", "email"],
  clientId: Configuration.clientId,
};

//Storage Keys
let StorageKey = "@MyApp:CustomGoogleOAuthKey";
let StorageKeyFb = "@MyApp:CustomFacebookOAuthKey";
let StorageKeyPassword = "@MyApp:CustomPasswordOAuthKey";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default class LoginScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
      token: "",

      loggedIn: false,
      username: null,
      userLogged: false,
      authState: null,
      loading: false,
      expoPushToken: null,
      webBrowserLoaded: false,
    };
  }

  urlRedicted = (url) => {
    if (!url) return;
    let { path, queryParams } = Linking.parse(url);

    const requestOptions = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "otp",
        secret_key: Configuration.secret_key,
        user_password: queryParams.user_password,
        user_email: queryParams.user_email,
        nf_expo_token: this.state.token,
      }),
    };

    fetch("http://buddypress.var.ovh/wpx-prepareuser/", requestOptions)
      .then((response) => response.json())
      .then((data) => {
        this.props.navigation.navigate("main", { url: data.data.signon_url });
      });
  };

  loginPassword = () => {
    const requestOptions = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "password",
        secret_key: Configuration.secret_key,
        user_password: this.state.password,
        user_email: this.state.email,
        register: 0,
        nf_expo_token: this.state.token,
      }),
    };

    fetch("http://buddypress.var.ovh/wpx-prepareuser/", requestOptions)
      .then((response) => response.json())
      .then((data) => {
        if (data.success === true) {
          this.cacheAuthAsyncPassword(data.data.signon_url);
          this.props.navigation.navigate("main", { url: data.data.signon_url });
        } else {
          console.log(data.data);
        }
      });
  };

  cacheAuthAsyncPassword = async (authState) => {
    return await AsyncStorage.setItem(
      StorageKeyPassword,
      JSON.stringify(authState)
    );
  };

  // Tylko w wersji produkcyjnej
  componentDidMount() {
    this.registerForPushNotificationsAsync();
  }

  registerForPushNotificationsAsync = async () => {
    if (Constants.isDevice) {
      const {
        status: existingStatus,
      } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        alert("Permission Granted");
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notification!");
        return;
      }
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log(token);
      this.setState({ token: token });
    } else {
      alert("Must use physical device for Push Notifications");
    }

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }
  };

  fetchUserInfo = async (token) => {
    const response = await fetch("https://www.googleapis.com/userinfo/v2/me", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  };

  signInAsync = async () => {
    let authState = await AppAuth.authAsync(config);
    await this.cacheAuthAsync(authState);
    this.setState({ loading: true });

    const userInfo = await this.fetchUserInfo(authState.accessToken);

    const requestOptions = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "google",
        secret_key: Configuration.secret_key,
        user_password: authState.idToken,
        ext_user_id: userInfo.id,
        user_email: userInfo.email,
        nf_expo_token: this.state.token,
      }),
    };

    fetch("http://buddypress.var.ovh/wpx-prepareuser/", requestOptions)
      .then((response) => response.json())
      .then((data) => {
        this.setState({ loading: false });
        this.props.navigation.navigate("main", { url: data.data.signon_url });
      });
  };

  cacheAuthAsync = async (authState) => {
    return await AsyncStorage.setItem(StorageKey, JSON.stringify(authState));
  };

  cacheAuthAsyncFb = async (authState) => {
    return await AsyncStorage.setItem(StorageKeyFb, JSON.stringify(authState));
  };

  fbLog = async () => {
    try {
      await Facebook.initializeAsync({
        appId: Configuration.facebookAppId,
      });
      const {
        type,
        token,
        expirationDate,
      } = await Facebook.logInWithReadPermissionsAsync({
        permissions: ["public_profile", "email"],
      });
      if (type === "success") {
        // Get the user's name using Facebook's Graph API
        const response = await fetch(
          `https://graph.facebook.com/me?fields=id,name,email,birthday&access_token=${token}`
        );
        const responseJson = await response.json();
        const AuthStateFb = {
          id: responseJson.id,
          email: responseJson.email,
          token: token,
          accessTokenExpirationDate: expirationDate,
        };
        await this.cacheAuthAsyncFb(AuthStateFb);

        const requestOptions = {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode: "facebook",
            secret_key: Configuration.secret_key,
            user_password: token,
            ext_user_id: responseJson.id,
            user_email: responseJson.email,
            nf_expo_token: this.state.token,
          }),
        };

        fetch("http://buddypress.var.ovh/wpx-prepareuser/", requestOptions)
          .then((response) => response.json())
          .then((data) => {
            this.setState({ loading: false });
            console.log(data.data);
            this.props.navigation.navigate("main", {
              url: data.data.signon_url,
            });
          });
      } else {
        // type === 'cancel'
      }
    } catch ({ message }) {
      alert(`Facebook Login Error: ${message}`);
    }
  };

  handleBrowserLogin = async () => {
    let result = await WebBrowser.openBrowserAsync(
      "http://buddypress.var.ovh/register/"
    );
    this.setState({ webBrowserLoaded: result });
  };

  render() {
    Linking.addEventListener("url", (event) => {
      this.urlRedicted(event.url);
    });

    return (
      <View style={styles.container}>
        {this.state.loading && (
          <ActivityIndicator
            style={{
              flex: 1,
              position: "absolute",
              justifyContent: "center",
              alignSelf: "center",
            }}
            size="large"
          />
        )}
        <Image source={require("../assets/logowpx.png")} />
        <Text style={styles.logo}>Welcome to WPX</Text>

        <View style={styles.inputView}>
          <TextInput
            style={styles.inputText}
            placeholder="Email..."
            placeholderTextColor="#003f5c"
            onChangeText={(text) => this.setState({ email: text })}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.inputView}>
          <TextInput
            secureTextEntry
            style={styles.inputText}
            placeholder="Password..."
            placeholderTextColor="#003f5c"
            onChangeText={(text) => this.setState({ password: text })}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity>
          <Text style={styles.forgot}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => this.loginPassword()}
        >
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.handleBrowserLogin}>
          <Text style={styles.create}>Create an Account</Text>
        </TouchableOpacity>
        <View style={styles.orContener}>
          <View style={styles.borderline}></View>
          <Text style={styles.or}>OR</Text>
          <View style={styles.borderline}></View>
          <View></View>
        </View>
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={async () => {
            const _authState = await this.signInAsync();

            this.setState({ authState: _authState });
          }}
        >
          <Image
            style={{ width: 25, height: 25 }}
            source={require("../assets/googlelogo.png")}
          />
          <Text style={styles.loginGoogleText}>Continue with Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fbBtn} onPress={() => this.fbLog()}>
          <Image
            style={{ width: 30, height: 30 }}
            source={require("../assets/fblogo.png")}
          />
          <Text style={styles.loginGoogleText}>Continue with Facebook</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

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
    color: "black",
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
    backgroundColor: "#ededed",
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
    backgroundColor: "rgba(29, 64, 222,0.2)",
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "center",
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
    backgroundColor: "#a6a6a6",
    borderColor: "#a6a6a6",
  },
  or: {
    color: "#a6a6a6",
    fontWeight: "bold",
    marginHorizontal: 10,
  },
});
