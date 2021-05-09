import React, { Component } from 'react';
import { View, Text, StyleSheet, BackHandler, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';


let StorageKey = '@MyApp:CustomGoogleOAuthKey';
let StorageKeyFb = '@MyApp:CustomFacebookOAuthKey';
let StorageKeyPassword = '@MyApp:CustomPasswordOAuthKey';

export default class MainScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: true
    };
    this.WEBVIEW_REF = React.createRef();
  }

componentDidMount(){
  BackHandler.addEventListener('hardwareBackPress', this.handleBackButton)
}

componentWillUnmount(){
  BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton)
}

handleBackButton = () => {
  this.WEBVIEW_REF.current.goBack();
  return true;
}

onNavigationStateChange(navState){
  this.setState({
    canGoBack: navState.canGoBack
  });
}

hideSpiner(){
  this.setState({visible: false});
}

onMessege = async (event) => {
  const {data} = event.nativeEvent;
  let messegeType = JSON.parse(data);
  console.log('Messege from webview', messegeType.type)
    if(messegeType.type === 'signedOut'){
      console.log('uzytkownik wylogowany- zrob tutuaj usuwanie z asyncstorage')
      await AsyncStorage.removeItem(StorageKeyPassword);
      await AsyncStorage.removeItem(StorageKey);
      await AsyncStorage.removeItem(StorageKeyFb);
      this.props.navigation.navigate('login')

    }
}

  render() {
    return (
      <View style={{flex: 1, justifyContent: 'center'}}>
        <WebView
        source={{ uri: this.props.navigation.getParam('url') }}
        onLoad={() => this.hideSpiner()}
        style={{ marginTop: 30, flex: 1 }}
        ref={this.WEBVIEW_REF}
        onNavigationStateChange={this.onNavigationStateChange.bind(this)}
        onMessage={(event) => this.onMessege(event)}
        />
      {this.state.visible && (
        <ActivityIndicator 
        style={{position: 'absolute', alignSelf: 'center', justifyContent: 'center'}}
        size="large"
        />
      )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
    
});