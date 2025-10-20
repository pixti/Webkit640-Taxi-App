import React, { JSX } from 'react';
import { SafeAreaView, StyleSheet, Text, Alert } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useEffect } from 'react'
import messaging from '@react-native-firebase/messaging'
// Stack Navigation을 사용하기 위한 import
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Intro from './Intro'
import Login from './Login'
import Register from './Register'
import Main from './Main'

// background 메시지 받기
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[Background Remote Message]', remoteMessage)
})

// 함수 부분
function TaxiApp(): JSX.Element {
  console.log("-- TaxiApp()")
  const Stack = createStackNavigator()

  const getFcmToken = async () => {
    const fcmToken = await messaging().getToken()
    await AsyncStorage.setItem("fcmToken", fcmToken)
    console.log(">>> fcmToken = " + fcmToken)
  }

  useEffect(() => {
    getFcmToken() // 토큰 받기
    // foreground 메시지 받기.
    messaging().onMessage(remoteMessage => {
      console.log('[Remote Message]', JSON.stringify(remoteMessage));
      let title = ""
      let body = ""
      if (remoteMessage.notification && remoteMessage.notification.title) {
        title = remoteMessage.notification.title
      }
      if (remoteMessage.notification && remoteMessage.notification.body) {
        body = remoteMessage.notification.body
      }

      if (remoteMessage) {
        Alert.alert(title, body, [{text: '확인', style: 'cancel'},
        ]);
      }
    });
  })

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name='Intro' component={Intro} options={{headerShown: false}} />
        <Stack.Screen name='Login' component={Login} options={{headerShown: false}}/>
        <Stack.Screen name='Register' component={Register} options={{headerShown: true, title: '회원가입'}}/>
        <Stack.Screen name='Main' component={Main} options={{headerShown: false}} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

// style 부분
const styles = StyleSheet.create({
  textBlack: {
    fontSize: 18,
    color: 'black',
  },
  textBlue: {
    fontSize: 18,
    color: 'blue',
  },
});

// export 부분
export default TaxiApp;