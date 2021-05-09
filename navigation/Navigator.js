import { createAppContainer, createSwitchNavigator } from 'react-navigation';
import LoginScreen from '../screens/LoginScreen';
import MainScreen from '../screens/MainScreen';
import LoadingScreen from '../screens/LoadingScreen';
import * as Linking from 'expo-linking'
import React from 'react';


const MainNavigator = createSwitchNavigator({
    loading: LoadingScreen,
    login: LoginScreen,
    main: MainScreen,
    
    },{
        mode: 'card',
        animationEnabled: true, 
        initialRouteName: 'loading' ,
        defaultNavigationOptions: {
            header: null, 
                     
    }})
    
    const AppContainer = createAppContainer(MainNavigator)

    export default () => {

        const prefix = Linking.makeUrl('screens/login/+/signon/info',{
            user_email: 'user_email', user_password: 'user_passwoed'
        })

        console.log(prefix)

        return <AppContainer uriPrefix={prefix}/>
    }