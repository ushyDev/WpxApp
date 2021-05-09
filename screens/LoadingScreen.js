import React, { Component } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppAuth from 'expo-app-auth';



let StorageKey = '@MyApp:CustomGoogleOAuthKey';
let StorageKeyFb = '@MyApp:CustomFacebookOAuthKey';
let StorageKeyPassword = '@MyApp:CustomPasswordOAuthKey';



let config = {
  issuer: 'https://accounts.google.com',
  scopes: ['openid', 'profile', 'email'],
  /* This is the CLIENT_ID generated from a Firebase project */
  clientId: '705147091498-44ib933gnlvnqlhstk1qm1d9ha53vbov.apps.googleusercontent.com',
  // clientId: '705147091498-tvsl32j6h87cidr73j5hga1djugm395m.apps.googleusercontent.com',
};

export default class LoadingScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      authState: null
    };
  }

async  componentDidMount(){
    
      const googleLog = await AsyncStorage.getItem(StorageKey)
      const fbLog = await AsyncStorage.getItem(StorageKeyFb)
      const passwordLog = await AsyncStorage.getItem(StorageKeyPassword)


      if(googleLog !== null){
        console.log('Google LOGOWANIE')
        let cachedAuth = await this.getCachedAuthAsync();
        if (cachedAuth && !this.state.authState){
          this.setState({authState: cachedAuth})
        }
      }else if(fbLog !== null){
        console.log('Facebook Logowanie')

        let cachedAuth = await this.getCachedAuthAsyncFb();
        if (cachedAuth && !this.state.authState){
          this.setState({authState: cachedAuth})
        }
      }else if(passwordLog !== null){
        let value = await AsyncStorage.getItem(StorageKeyPassword);
        let authState = JSON.parse(value);
        this.props.navigation.navigate('main', {url: authState})
      }
      else{
        console.log('Niezalogowany uzytkownik')
        this.props.navigation.navigate('login')
      }
  }

  getCachedAuthAsyncFb = async () => {
    let value = await AsyncStorage.getItem(StorageKeyFb);
    let authState = JSON.parse(value);
    console.log('getCachedAuthAsyncFBBBB', authState);
  
    if (authState) {
      if (this.checkIfTokenExpired(authState)) {
        console.log('token expired is niewazny')
        this.props.navigation.navigate('login')
      } else {
          this.signInAsyncFb(authState)
      }
    }
  
    return null;
    }


  cacheAuthAsync = async (authState) => {
    return await AsyncStorage.setItem(StorageKey, JSON.stringify(authState));
  }

  getCachedAuthAsync = async () => {
  let value = await AsyncStorage.getItem(StorageKey);
  let authState = JSON.parse(value);
  console.log('getCachedAuthAsync', authState);

  if (authState) {
    if (this.checkIfTokenExpired(authState)) {
      console.log('token expired is niewazny')
     return this.refreshAuthAsync(authState);
    } else {
        this.signInAsync(authState)
    }
  }

  return null;
  }

  checkIfTokenExpired = ({ accessTokenExpirationDate }) => {
    return new Date(accessTokenExpirationDate) < new Date();
  }

  refreshAuthAsync = async ({ refreshToken }) => {
    let authState = await AppAuth.refreshAsync(config, refreshToken);
    console.log('refreshAuth', authState);
    await this.cacheAuthAsync(authState);
    console.log('new', authState)
    this.signInAsync(authState)
    return authState;
  }

  fetchUserInfo = async (token) => {
    const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
  
    return await response.json();
  }

  signInAsync = async (authState) => {
    console.log('jestem tu')
    
    const userInfo = await this.fetchUserInfo(authState.accessToken);
    console.log('USERiNFO', userInfo)

    const requestOptions = {
      method: 'POST',
      headers: {Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
      mode: 'google', 
      secret_key: '2bPC4xW7qztgfA6%ZTs08dmuY@RkSpMi',
      user_password: authState.idToken,
      ext_user_id: userInfo.id,
      user_email: userInfo.email
    })
  };

    fetch('http://buddypress.var.ovh/wpx-prepareuser/', requestOptions)
    .then(response => response.json())
    .then(data => {
      this.setState({loading: false})
      this.props.navigation.navigate('main', {url: data.data.signon_url})
    })
  }

  signInAsyncFb = async (authState) => {
    
    const requestOptions = {
      method: 'POST',
      headers: {Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
      mode: 'facebook', 
      secret_key: '2bPC4xW7qztgfA6%ZTs08dmuY@RkSpMi',
      user_password: authState.token,
      ext_user_id: authState.id,
      user_email: authState.email
    })
  };

    fetch('http://buddypress.var.ovh/wpx-prepareuser/', requestOptions)
    .then(response => response.json())
    .then(data => {
      this.setState({loading: false})
      console.log(data)
      this.props.navigation.navigate('main', {url: data.data.signon_url})
    })
  }


  render() {
    return (
      <View style={[styles.container, styles.horizontal]}>
        <ActivityIndicator size="small" color="#0000ff" />
      </View>
    );
  }
}
 const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  horizontal: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
 });