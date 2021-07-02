import * as AppAuth from "expo-app-auth";
import * as Facebook from "expo-facebook";
import * as Google from "expo-google-app-auth";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import * as WebBrowser from "expo-web-browser";

import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Configuration, ImageAssets, Texts } from "../../config";
import React, { Component } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import styles from "./styles";

WebBrowser.maybeCompleteAuthSession();

let config = {
  issuer: "https://accounts.google.com",
  scopes: ["openid", "profile", "email"],
  clientId: Configuration.clientId,
};

//Storage Keys
let StorageKeyGoogle = "@MyApp:CustomGoogleOAuthKey";
let StorageKeyFb = "@MyApp:CustomFacebookOAuthKey";
let StorageKeyPassword = "@MyApp:CustomPasswordOAuthKey";

//Notifications Options
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

  componentDidMount() {
    this.registerForPushNotificationsAsync();
  }

  // Token for notifications (only in prod version)
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

  //Login after email verification
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

    fetch(Configuration.urlWebView + "/wpx-prepareuser/", requestOptions)
      .then((response) => response.json())
      .then((data) => {
        this.props.navigation.navigate("main", { url: data.data.signon_url });
      });
  };

  //Login with mode password
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

    fetch(Configuration.urlWebView + "/wpx-prepareuser/", requestOptions)
      .then((response) => response.json())
      .then((data) => {
        if (data.success === true) {
          this.cacheAuthAsyncPassword(data.data.signon_url);
          this.props.navigation.navigate("main", { url: data.data.signon_url });
        } else {
          //make alert
        }
      });
  };

  //Save token to AsyncStorage
  cacheAuthAsyncPassword = async (authState) => {
    return await AsyncStorage.setItem(
      StorageKeyPassword,
      JSON.stringify(authState)
    );
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

  //new google login
  signInWithGoogleAsync = async () => {
    try {
      const result = await Google.logInAsync({
        androidClientId:
          "818839509895-ofq76sn4ic8cahc2dedlgql0cr7c2ork.apps.googleusercontent.com",
        iosClientId:
          "818839509895-uvp7mg3mhbejmqje83fvkbsrj8385mcm.apps.googleusercontent.com", //tu jeszcze trzeba zmienic na standolone appp
        scopes: ["profile", "email"],
      });

      if (result.type === "success") {
        this.onSignIn(result);
        return result.accessToken;
      } else {
        return { cancelled: true };
      }
    } catch (e) {
      return { error: true };
    }
  };

  //SignIn with google mode
  signInAsyncGoogle = async () => {
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

    fetch(Configuration.urlWebView + "/wpx-prepareuser/", requestOptions)
      .then((response) => response.json())
      .then((data) => {
        this.setState({ loading: false });
        this.props.navigation.navigate("main", { url: data.data.signon_url });
      });
  };

  cacheAuthAsync = async (authState) => {
    return await AsyncStorage.setItem(
      StorageKeyGoogle,
      JSON.stringify(authState)
    );
  };

  //SignIn with facebook mode
  signInAsyncFacebook = async () => {
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

        fetch(Configuration.urlWebView + "/wpx-prepareuser/", requestOptions)
          .then((response) => response.json())
          .then((data) => {
            this.setState({ loading: false });
            this.props.navigation.navigate("main", {
              url: data.data.signon_url,
            });
          });
      } else {
        // make alert
      }
    } catch ({ message }) {
      alert(`Facebook Login Error: ${message}`);
    }
  };

  cacheAuthAsyncFb = async (authState) => {
    return await AsyncStorage.setItem(StorageKeyFb, JSON.stringify(authState));
  };

  //Open register Browser
  handleBrowserLogin = async () => {
    let result = await WebBrowser.openBrowserAsync(
      Configuration.urlWebView + "/register/"
    );
    this.setState({ webBrowserLoaded: result });
  };

  render() {
    //Depp linking
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
        <Image source={ImageAssets.logoMain} />
        <Text style={styles.logo}>{Texts.welcomeMain}</Text>

        <View style={styles.inputView}>
          <TextInput
            style={styles.inputText}
            placeholder={Texts.email}
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
            placeholder={Texts.password}
            placeholderTextColor="#003f5c"
            onChangeText={(text) => this.setState({ password: text })}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity>
          <Text style={styles.forgot}>{Texts.forgotPassword}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => this.loginPassword()}
        >
          <Text style={styles.loginText}>{Texts.login}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.handleBrowserLogin}>
          <Text style={styles.create}>{Texts.createAccount}</Text>
        </TouchableOpacity>
        <View style={styles.orContener}>
          <View style={styles.borderline}></View>
          <Text style={styles.or}>{Texts.or}</Text>
          <View style={styles.borderline}></View>
          <View></View>
        </View>
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={async () => {
            const _authState = await this.signInAsyncGoogle();

            this.setState({ authState: _authState });
          }}
        >
          <Image
            style={{ width: 25, height: 25 }}
            source={ImageAssets.logoGoogle}
          />
          <Text style={styles.loginGoogleText}>{Texts.buttonGoogle}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fbBtn}
          onPress={() => this.signInAsyncFacebook()}
        >
          <Image
            style={{ width: 30, height: 30 }}
            source={ImageAssets.logoFb}
          />
          <Text style={styles.loginGoogleText}>{Texts.buttonGoogle}</Text>
        </TouchableOpacity>
      </View>
    );
  }
}
