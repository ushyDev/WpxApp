import * as AppAuth from "expo-app-auth";

import React, { Component } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Configuration } from "../config";
import Indicator from "../components/Indicator";

let StorageKey = "@MyApp:CustomGoogleOAuthKey";
let StorageKeyFb = "@MyApp:CustomFacebookOAuthKey";
let StorageKeyPassword = "@MyApp:CustomPasswordOAuthKey";

let config = {
  issuer: "https://accounts.google.com",
  scopes: ["openid", "profile", "email"],
  clientId: Configuration.clientId,
};

export default class LoadingScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      authState: null,
    };
  }

  async componentDidMount() {
    const googleLog = await AsyncStorage.getItem(StorageKey);
    const fbLog = await AsyncStorage.getItem(StorageKeyFb);
    const passwordLog = await AsyncStorage.getItem(StorageKeyPassword);

    if (googleLog !== null) {
      let cachedAuth = await this.getCachedAuthAsync();
      if (cachedAuth && !this.state.authState) {
        this.setState({ authState: cachedAuth });
      }
    } else if (fbLog !== null) {
      let cachedAuth = await this.getCachedAuthAsyncFb();
      if (cachedAuth && !this.state.authState) {
        this.setState({ authState: cachedAuth });
      }
    } else if (passwordLog !== null) {
      let value = await AsyncStorage.getItem(StorageKeyPassword);
      let authState = JSON.parse(value);
      this.props.navigation.navigate("main", { url: authState });
    } else {
      this.props.navigation.navigate("login");
    }
  }

  getCachedAuthAsyncFb = async () => {
    let value = await AsyncStorage.getItem(StorageKeyFb);
    let authState = JSON.parse(value);

    if (authState) {
      if (this.checkIfTokenExpired(authState)) {
        this.props.navigation.navigate("login");
      } else {
        this.signInAsyncFb(authState);
      }
    }
    return null;
  };

  cacheAuthAsync = async (authState) => {
    return await AsyncStorage.setItem(StorageKey, JSON.stringify(authState));
  };

  getCachedAuthAsync = async () => {
    let value = await AsyncStorage.getItem(StorageKey);
    let authState = JSON.parse(value);

    if (authState) {
      if (this.checkIfTokenExpired(authState)) {
        return this.refreshAuthAsync(authState);
      } else {
        this.signInAsync(authState);
      }
    }
    return null;
  };

  checkIfTokenExpired = ({ accessTokenExpirationDate }) => {
    return new Date(accessTokenExpirationDate) < new Date();
  };

  refreshAuthAsync = async ({ refreshToken }) => {
    let authState = await AppAuth.refreshAsync(config, refreshToken);
    await this.cacheAuthAsync(authState);
    this.signInAsync(authState);
    return authState;
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

  signInAsync = async (authState) => {
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
      }),
    };

    fetch(Configuration.urlWebView + "/wpx-prepareuser/", requestOptions)
      .then((response) => response.json())
      .then((data) => {
        this.setState({ loading: false });
        this.props.navigation.navigate("main", { url: data.data.signon_url });
      });
  };

  signInAsyncFb = async (authState) => {
    const requestOptions = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "facebook",
        secret_key: Configuration.secret_key,
        user_password: authState.token,
        ext_user_id: authState.id,
        user_email: authState.email,
      }),
    };

    fetch(Configuration.urlWebView + "/wpx-prepareuser/", requestOptions)
      .then((response) => response.json())
      .then((data) => {
        this.setState({ loading: false });
        this.props.navigation.navigate("main", { url: data.data.signon_url });
      });
  };

  render() {
    return <Indicator />;
  }
}
