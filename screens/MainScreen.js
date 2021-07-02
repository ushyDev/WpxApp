import React, { Component } from "react";
import { View, BackHandler } from "react-native";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Indicator from "../components/Indicator";

//Storage
let StorageKey = "@MyApp:CustomGoogleOAuthKey";
let StorageKeyFb = "@MyApp:CustomFacebookOAuthKey";
let StorageKeyPassword = "@MyApp:CustomPasswordOAuthKey";

const INJECTEDJAVASCRIPT = `(function() {
  const meta = document.createElement('meta'); meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'); meta.setAttribute('name', 'viewport'); document.getElementsByTagName('head')[0].appendChild(meta);
})();`;

export default class MainScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.WEBVIEW_REF = React.createRef();
  }

  componentDidMount() {
    BackHandler.addEventListener("hardwareBackPress", this.handleBackButton);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener("hardwareBackPress", this.handleBackButton);
  }

  handleBackButton = () => {
    this.WEBVIEW_REF.current.goBack();
    return true;
  };

  onNavigationStateChange(navState) {
    this.setState({
      canGoBack: navState.canGoBack,
    });
  }

  onMessege = async (event) => {
    const { data } = event.nativeEvent;
    let messegeType = JSON.parse(data);
    if (messegeType.type === "signedOut") {
      await AsyncStorage.removeItem(StorageKeyPassword);
      await AsyncStorage.removeItem(StorageKey);
      await AsyncStorage.removeItem(StorageKeyFb);
      this.props.navigation.navigate("login");
    }
  };

  render() {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <WebView
          injectedJavaScript={INJECTEDJAVASCRIPT} //disable zoom
          // scrollEnabled={false} //disable zoom
          source={{ uri: this.props.navigation.getParam("url") }}
          style={{ marginTop: 30, flex: 1 }}
          ref={this.WEBVIEW_REF}
          onNavigationStateChange={this.onNavigationStateChange.bind(this)}
          onMessage={(event) => this.onMessege(event)}
          startInLoadingState={true}
          renderLoading={() => <Indicator />}
        />
      </View>
    );
  }
}
