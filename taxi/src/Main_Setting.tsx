import React, { JSX, useMemo } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, ParamListBase, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

interface SetMenuItem {
    id: number;
    name: string;
}

function Main_Setting(): JSX.Element {
    console.log("-- Main_Setting()")
    const arrSetMenu: SetMenuItem[] = useMemo(() => [{id: 0, name: '로그아웃'}], []);

    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

    const onLogout = () => {
        AsyncStorage.removeItem('userId').then(() => {
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                })
            );
        });
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList style={{width: '100%'}}
                      data={arrSetMenu}
                      renderItem={({ item }: { item: SetMenuItem }) => {
                          console.log("item = " + JSON.stringify(item)); // 디버깅을 위해 추가
                          return (
                              <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
                                  <Text style={styles.textForm}>{item.name}</Text>
                              </TouchableOpacity>
                          );
                      }}
                      keyExtractor={(item: SetMenuItem) => item.id.toString()}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItem: {
        width: '100%',
        backgroundColor: 'white',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textForm: {
        width: '100%',
        fontSize: 18,
        textAlign: 'center',
        color: '#3498db',
        marginBottom: 2
    },
});

export default Main_Setting;