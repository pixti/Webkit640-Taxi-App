// import 부분
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, Modal, View, Alert } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackNavigationProp } from '@react-navigation/stack/';
import { useNavigation, ParamListBase } from '@react-navigation/native';
import api from './API'
import Icon from 'react-native-vector-icons/FontAwesome';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import React, { JSX, useState, useRef, useEffect } from 'react';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Geolocation from '@react-native-community/geolocation';

// map api key
const GOOGLE_MAPS_API_KEY = '';

const query = {
  key: GOOGLE_MAPS_API_KEY,
  language: 'ko',
  components: 'country:kr',
};

// 함수 부분
function Main_Map(): JSX.Element {
  console.log('-- Main_Map() - 타입 오류 최종 해결 버전');

  // --- 상태 관리  ---
  const [marker1, setMarker1] = useState({ latitude: 0, longitude: 0, address: '' });
  const [marker2, setMarker2] = useState({ latitude: 0, longitude: 0, address: '' });
  const [showBtn, setShowBtn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isNotFound1, setIsNotFound1] = useState(false);
  const [isNotFound2, setIsNotFound2] = useState(false);

  // --- Ref 관리 ---
  const mapRef = useRef<MapView>(null);
  const autoComplete1 = useRef<any>(null);
  const autoComplete2 = useRef<any>(null);
  const longPressData = useRef({ latitude: 0, longitude: 0, address: '' });

  // --- 상수 정의 ---
  const initialRegion = {
    latitude: 37.5666612,
    longitude: 126.9783785,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  // --- 함수 로직 ---
  const handleLongPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    setLoading(true);
    try {
      const response = await api.geoCoding(coordinate, query.key);
      const address = response.data.results[0]?.formatted_address;
      if (address) {
        longPressData.current = { ...coordinate, address };
        setShowBtn(true);
      } else {
        Alert.alert('오류', '해당 위치의 주소를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.log('Geocoding Error:', err);
      Alert.alert('오류', '주소를 가져오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMarker = (title: string) => {
    const { latitude, longitude, address } = longPressData.current;
    if (title === "출발지") {
      setMarker1({ latitude, longitude, address });
      autoComplete1.current?.setAddressText(address);
    } else {
      setMarker2({ latitude, longitude, address });
      autoComplete2.current?.setAddressText(address);
    }
    setShowBtn(false);
  };

  const onSelectAddr = (data: any, details: any, type: string) => {
    console.log(` ${type} 주소 선택! 함수 호출됨`);
    console.log('선택된 주소:', data.description, '좌표:', details?.geometry.location);

    if (details) {
      const { lat, lng } = details.geometry.location;
      const address = data.description;

      mapRef.current?.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.0073,
        longitudeDelta: 0.0064,
      }, 1000);

      if (type === 'start') {
        setMarker1({ latitude: lat, longitude: lng, address });
      } else {
        setMarker2({ latitude: lat, longitude: lng, address });
      }
    }
  };

  const setMyLocation = () => {
    setLoading(true);
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await api.geoCoding({ latitude, longitude }, query.key);
          const address = response.data.results[0]?.formatted_address;
          if (address) {
            setMarker1({ latitude, longitude, address });
            autoComplete1.current?.setAddressText(address);
            mapRef.current?.animateToRegion({
              latitude,
              longitude,
              latitudeDelta: 0.0073,
              longitudeDelta: 0.0064,
            }, 1000);
          }
        } catch (err) {
          console.log('Geocoding Error:', err);
          Alert.alert('오류', '주소를 가져올 수 없습니다.');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.log("Geolocation Error:", error);
        Alert.alert('오류', '위치 정보를 가져올 수 없습니다. 권한 설정을 확인해주세요.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const callTaxi = async () => {

    console.log('---  호출 버튼 클릭! 서버 전송 직전 데이터 ---');
    console.log('출발지 상태:', marker1);
    console.log('도착지 상태:', marker2);

    const userId = await AsyncStorage.getItem('userId') || "";
    const { address: startAddr, latitude: startLat, longitude: startLng } = marker1;
    const { address: endAddr, latitude: endLat, longitude: endLng } = marker2;

    if (marker1.latitude === 0 || marker2.latitude === 0) {
      Alert.alert("알림", "출발지와 도착지를 모두 설정해주세요.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.call(userId, `${startLat}`, `${startLng}`, startAddr, `${endLat}`, `${endLng}`, endAddr);
      const { code, message } = response.data[0];
      Alert.alert(code === 0 ? "알림" : "오류", message, [
        { text: '확인', onPress: () => { if (code === 0) navigation.navigate('Main_List') } },
      ]);
    } catch (err) {
      console.log('Call Taxi Error:', err);
      Alert.alert('오류', '호출에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (marker1.latitude !== 0 && marker2.latitude !== 0 && mapRef.current) {
      mapRef.current.fitToCoordinates([marker1, marker2], {
        edgePadding: { top: 150, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [marker1, marker2]);


  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        onPress={() => setShowBtn(false)}
        onLongPress={handleLongPress}
      >
        {marker1.latitude !== 0 && <Marker coordinate={marker1} title="출발 위치" />}
        {marker2.latitude !== 0 && <Marker coordinate={marker2} title="도착 위치" pinColor="blue" />}
        {marker1.latitude !== 0 && marker2.latitude !== 0 && (
          <Polyline coordinates={[marker1, marker2]} strokeColor="blue" strokeWidth={3} />
        )}
      </MapView>

      <View style={styles.searchContainer}>
        <View style={styles.autocompleteWrapper}>
          <GooglePlacesAutocomplete
            ref={autoComplete1}
            placeholder="출발지 검색"
            onPress={(data, details) => {
              if (data.description === '연관검색 결과가 없습니다.') return;
              onSelectAddr(data, details, 'start');
              setIsNotFound1(false);
            }}
            query={query}
            fetchDetails={true}
            styles={autocompleteStyles}
            enablePoweredByContainer={false}
            textInputProps={{
              onChangeText: (text) => {
                console.log('--- ⌨️ 출발지 타이핑 감지! 텍스트:', text);
                setIsNotFound1(false);
              },}}
            onNotFound={() => setIsNotFound1(true)}
            onFail={(error) => console.error('검색 실패:', error)}
            // --- 최종 타입 오류 해결 ---
            predefinedPlaces={isNotFound1 ? [{
              description: '연관검색 결과가 없습니다.',
              geometry: { location: { lat: 0, lng: 0 } },
            }] as any : []}
          />
        </View>

        {/* 도착지 검색 */}
        <View style={[styles.autocompleteWrapper, { top: 50 }]}>
          <GooglePlacesAutocomplete
            ref={autoComplete2}
            placeholder="도착지 검색"
            onPress={(data, details) => {
              if (data.description === '연관검색 결과가 없습니다.') return;
              onSelectAddr(data, details, 'end');
              setIsNotFound2(false);
            }}
            query={query}
            fetchDetails={true}
            styles={autocompleteStyles}
            enablePoweredByContainer={false}
            textInputProps={{
              onChangeText: (text) => {
                console.log('--- ⌨️ 출발지 타이핑 감지! 텍스트:', text);
                setIsNotFound1(false);
              },}}
            onNotFound={() => setIsNotFound2(true)}
            onFail={(error) => console.error('검색 실패:', error)}
            // --- 최종 타입 오류 해결 ---
            predefinedPlaces={isNotFound2 ? [{
              description: '연관검색 결과가 없습니다.',
              geometry: { location: { lat: 0, lng: 0 } },
            }] as any : []}
          />
        </View>
      </View>

      {/* 나머지 UI 요소들은 overlay 위에 직접 배치 */}
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.callButton} onPress={callTaxi}>
          <Text style={styles.buttonText}>호출</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.myLocationButton} onPress={setMyLocation}>
          <Icon name="crosshairs" size={40} color={'#3498db'} />
        </TouchableOpacity>
        {showBtn && (
          <View style={styles.popupContainer}>
            <TouchableOpacity style={styles.popupButton} onPress={() => handleAddMarker('출발지')}>
              <Text style={styles.buttonText}>출발지로 등록</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.popupButton, { marginTop: 1 }]} onPress={() => handleAddMarker('도착지')}>
              <Text style={styles.buttonText}>도착지로 등록</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

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
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  searchContainer: {
    position: 'absolute',
    top: wp(2),
    left: wp(2),
    width: wp(75),
    zIndex: 99,
  },
  autocompleteWrapper: {
    position: 'absolute',
    width: '100%',
  },
  overlay: { position: 'absolute', width: '100%', height: '100%', pointerEvents: 'box-none' },
  callButton: {
    position: 'absolute',
    width: wp(18),
    top: wp(2),
    right: wp(2),
    height: 100,
    justifyContent: 'center',
    backgroundColor: '#3498db',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 10,
    pointerEvents: 'auto',
  },
  myLocationButton: { position: 'absolute', bottom: 20, right: 20, pointerEvents: 'auto' },
  popupContainer: { position: 'absolute', top: hp(50) - 45, left: wp(50) - 75, height: 90, width: 150, pointerEvents: 'auto' },
  buttonText: { color: 'white', textAlign: 'center' },
  popupButton: { flex: 1, backgroundColor: '#3498db', borderRadius: 5, justifyContent: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.2)' },
  loadingText: { color: 'black', marginTop: 10 },
});

const autocompleteStyles = {
  container: {},
  textInputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    height: 45,
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  textInput: {
    height: 45,
    color: '#5d5d5d',
    fontSize: 16,
    borderRadius: 8,
  },
  listView: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 5,
    zIndex: 10,
  },
};

export default Main_Map;