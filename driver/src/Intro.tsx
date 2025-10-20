import React, { JSX } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useNavigation, ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import Icon from 'react-native-vector-icons/FontAwesome';
import { useFocusEffect } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage";

// 함수 부분
function Intro(): JSX.Element {
  console.log("-- Intro()")
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>()

  useFocusEffect(React.useCallback(() => {
    setTimeout( async () => {
      let userID = await AsyncStorage.getItem('userId')
      let isAutoLogin = userID ? true : false

      if (isAutoLogin) {
        navigation.push('Main')
      } else {
        navigation.push('Login')
      }
    }, 2000)
  }, []))

  return (
    <SafeAreaView style={styles.container}>
      <Icon name="drivers-license" size={100} color={'#3498db'} />
    </SafeAreaView>
  )
}

// style 부분
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', // 자식 요소들을 수직으로 중앙정렬
    alignItems: 'center', // 자식 요소들을 수평으로 중앙정렬
  },
});

// export 부분
export default Intro;