import React, { JSX } from 'react';
import { SafeAreaView, StyleSheet, Text, View, FlatList, RefreshControl, Modal, Alert, TouchableOpacity } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useState, useEffect } from 'react';
import messaging from '@react-native-firebase/messaging'
import { useFocusEffect } from "@react-navigation/native"
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from './API'

// 함수 부분
function Main_List(): JSX.Element {
  console.log("-- Main_list()")

  const [callList, setCallList] = useState([])
  const [loading, setLoading] = useState(false);

  const requestCallList = async () => {
    let userId = await AsyncStorage.getItem('userId') || ""
    setLoading(true)
    api.list(userId)
      .then(response => {
        let {code, message, data} = response.data[0]
        if (code == 0) {
          // 호출이 정상이면 목록 보여줌
          setCallList(data)
        } else {
          // 실패면 팝업을 띄워준다.
          Alert.alert("오류", message, [
            {
              text: '확인',
              onPress: () => console.log('Cancel Pressed'),
              style: 'cancel',
            },
          ]);
        }
        setLoading(false)
      })
      .catch(err => {
        console.log(JSON.stringify(err))
        setLoading(false)
      })
  }

  const Header = () => (
    <View style={styles.header}>
      <Text style={[styles.headerText, {width: wp(80)}]}>출발지 / 도착지</Text>
      <Text style={[styles.headerText, {width: wp(20)}]}>상태</Text>
    </View>
  );

// ListItem 함수
  const ListItem = ({ item }: { item: any }) => { // row -> { item }
    console.log("item = " + JSON.stringify(item))
    return (
      <View style={{flexDirection: 'row', marginBottom: 5, width: wp(100)}}>
        <View style={[{width: wp(80)}]}>
          <Text style={styles.textForm}>{item.start_addr}</Text>
          <Text style={[styles.textForm, {borderTopWidth: 0}]}>{item.end_addr}</Text>
        </View>
        <View style={{width: wp(20), alignItems: 'center', justifyContent: 'center'}}>
          {item.call_state == 'REQ' ? (
            <TouchableOpacity style={styles.button} onPress={() => onAccept(item)}>
              <Text style={styles.buttonText}>{item.call_state}</Text>
            </TouchableOpacity>
          ) : (
            <Text>{item.call_state}</Text>
          )}
        </View>
      </View>
    )
  }
  useFocusEffect(React.useCallback(() => {
    requestCallList()
  }, []))

  const onAccept = async (item: any) => {
    // 현재 로그인한 사용자가 기사 ID라고 가정합니다.
    let driverId = await AsyncStorage.getItem('userId') || ""
    setLoading(true)
    api.accept(driverId, item.id, item.user_id)
      .then(response => {
        let {code, message} = response.data[0]
        if (code == 0) {
          // 호출이 정상이면 성공 메시지를 보여주고 목록을 새로고침합니다.
          Alert.alert("알림", message);
          requestCallList();
        } else {
          Alert.alert("오류", message);
        }
      })
      .catch(err => {
        console.log(JSON.stringify(err));
        Alert.alert("오류", "요청에 실패했습니다.");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    // foreground 메시지 받기.
    const message = messaging().onMessage(remoteMessage => {
      console.log('[Remote Message]', JSON.stringify(remoteMessage));
      // 푸시를 수신하면 목록 다시 그리기
      requestCallList()
    });
    return message
  })

  return (
    <SafeAreaView style={styles.container}>
      <FlatList style={{flex: 1}}
                data={callList}
                ListHeaderComponent={Header}
                renderItem={(row) => <ListItem item={row.item} />}
        // 또는 renderItem={ListItem} 으로 직접 전달하고 ListItem 컴포넌트가 {item}을 props로 받도록 함
                keyExtractor={(item: any) => item.id.toString()} // key는 문자열이어야 하므로 .toString() 추가
                refreshControl={
                  <RefreshControl refreshing={loading} onRefresh={requestCallList} />
                }
      />

      <Modal transparent={true} visible={loading}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Icon name="spinner" size={50} color="#3498db" />
          <Text style={{color: 'black'}}>Loading...</Text>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

// style 부분
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'white'
  },
  header: {
    flexDirection: 'row',
    height: 50,
    marginBottom: 5,
    backgroundColor: '#3498db',
    color: 'white',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    textAlign: 'center',
    color: 'white'
  },
  textForm: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#3498db',
    height: hp(5),
    paddingLeft: 10,
    paddingRight: 10,
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
});

// export 부분
export default Main_List;