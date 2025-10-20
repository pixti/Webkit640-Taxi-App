// import 부분
import React, { JSX } from 'react';
import { SafeAreaView, StyleSheet, Text, View, FlatList, RefreshControl, Modal, Alert } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useState, useEffect } from 'react'; // useEffect를 import에 추가합니다.
import messaging from '@react-native-firebase/messaging';
import { useFocusEffect } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from './API';

// 함수 부분
function Main_List(): JSX.Element {
  console.log("-- Main_list() - 사용자용");

  const [callList, setCallList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const requestCallList = async () => {
    let userId = await AsyncStorage.getItem('userId') || "";
    if (!userId) return; // userId가 없으면 요청하지 않음

    setLoading(true);
    api.list(userId)
      .then(response => {
        let { code, message, data } = response.data[0];
        if (code === 0) {
          setCallList(data);
        } else {
          Alert.alert("오류", message, [{ text: '확인' }]);
        }
      })
      .catch(err => {
        console.log(JSON.stringify(err));
        Alert.alert("오류", "목록을 불러오는 데 실패했습니다.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const Header = () => (
    <View style={styles.header}>
      <Text style={[styles.headerText, { width: wp(80) }]}>출발지 / 도착지</Text>
      <Text style={[styles.headerText, { width: wp(20) }]}>상태</Text>
    </View>
  );

  // ***** 여기가 핵심 수정입니다 *****
  // 기존 listItem 함수를 제공해주신 코드로 완전히 대체합니다.
  const listItem = ({ item }: { item: any }) => {
    return (
      <View style={{ flexDirection: 'row', marginBottom: 5, width: wp(100) }}>
        <View style={[{ width: wp(80) }]}>
          <Text style={styles.textForm}>{item.start_addr}</Text>
          <Text style={[styles.textForm, { borderTopWidth: 0 }]}>{item.end_addr}</Text>
        </View>
        <View style={{ width: wp(20), alignItems: 'center', justifyContent: 'center' }}>
          {/* 호출 상태가 'RES'(응답)일 때는 파란색, 그 외에는 회색으로 표시합니다. */}
          {item.call_state === "RES" ?
            (<Text style={{ color: 'blue' }}>{item.call_state}</Text>) :
            (<Text style={{ color: 'gray' }}>{item.call_state}</Text>)
          }
        </View>
      </View>
    );
  };

  useFocusEffect(React.useCallback(() => {
    requestCallList();
  }, []));

  useEffect(() => {
    // foreground 메시지 받기.
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('[Remote Message]', JSON.stringify(remoteMessage));
      // 푸시를 수신하면 목록 다시 그리기
      Alert.alert('알림', '호출 상태가 변경되었습니다.');
      requestCallList();
    });
    return unsubscribe;
  }, []); // useEffect는 두 번째 인자로 빈 배열을 전달해야 한 번만 실행됩니다.

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        style={{ flex: 1, width: '100%' }}
        data={callList}
        ListHeaderComponent={Header}
        renderItem={listItem}
        keyExtractor={(item: any) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={requestCallList} />
        }
      />

      <Modal transparent={true} visible={loading}>
        <View style={styles.loadingContainer}>
          <Icon name="spinner" size={50} color="#3498db" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
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
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    textAlign: 'center',
    color: 'white'
  },
  textForm: {
    borderWidth: 1,
    borderColor: '#3498db',
    paddingVertical: 10, // height 대신 padding을 사용하면 텍스트 길이에 따라 유연하게 늘어남
    paddingHorizontal: 10,
    textAlignVertical: 'center',
  },
  // '수락' 버튼 관련 스타일은 이제 필요 없으므로 제거해도 됩니다.
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)'
  },
  loadingText: {
    color: 'black',
    marginTop: 10,
    fontSize: 16
  },
});

export default Main_List;