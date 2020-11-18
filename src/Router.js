import React, { Component } from 'react';
import { Text, View, SafeAreaView, StatusBar, AsyncStorage, Image, TouchableOpacity, Platform } from 'react-native';
import { Actions, Router, Scene } from 'react-native-router-flux';
import Home from './pages/Home/Home';
import OneSignal from 'react-native-onesignal';
import { getUniqueId, getVersion } from 'react-native-device-info';

export class Routes extends Component {
    constructor(props) {
        super(props)
        // OneSignal.setLogLevel(6, 0);
        OneSignal.init("1f3a9369-3346-4647-a1dd-d90f14ec7f31", {kOSSettingsKeyAutoPrompt : false, kOSSettingsKeyInAppLaunchURL: false, kOSSettingsKeyInFocusDisplayOption:2});
        OneSignal.inFocusDisplaying(2);
        OneSignal.promptForPushNotificationsWithUserResponse(myiOSPromptCallback);
        OneSignal.addEventListener('received', this.onReceived);
        OneSignal.addEventListener('opened', this.onOpened);
        OneSignal.addEventListener('ids', this.onIds);

        this.state = {
            appVer: 'Ver.'+getVersion()
        }
    }

    componentDidMount() {

    }

    componentWillReceiveProps() {

    }

    componentWillUnmount() {
        OneSignal.removeEventListener('received', this.onReceived);
        OneSignal.removeEventListener('opened', this.onOpened);
        OneSignal.removeEventListener('ids', this.onIds);
    }

    onReceived(notification) {
        console.log("Notification received: ", notification);
    }
    
    onOpened(openResult) {
        console.log('Message: ', openResult.notification.payload.body);
        console.log('Data: ', openResult.notification.payload.additionalData);
        console.log('isActive: ', openResult.notification.isAppInFocus);
        console.log('openResult: ', openResult);
    }
    
    onIds(device) {
        console.log('Device info: ', device.userId);
    }

    render() {

        return (
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar
                    backgroundColor='#990000'
                    barStyle={Platform.OS == 'ios'?'dark-content':'light-content'}
                />
                <Router
                    navigationBarStyle={{ backgroundColor: '#990000' }}
                    titleStyle={{ color: 'white' }}
                    tintColor={'white'}
                    backAndroidHandler={() => {

                    }}>
                    <Scene key="root" hideNavBar headerLayoutPreset="center">
                      <Scene
                            type={'replace'}
                            key="Home"
                            component={Home}
                            initial={true}
                            title="Absensi Karyawan"
                            hideNavBar={false}
                            duration={0}
                            onEnter={() => {
                                Actions.refresh({
                                    enterTime: new Date()
                                })
                            }}
                            
                            rightTitle={this.state.appVer}
                            onRight={()=>{

                            }}
                        />
                    </Scene>
                </Router>
            </SafeAreaView>
        )
    }
}

function myiOSPromptCallback(permission){
    console.log(permission);
    // do something with permission value
}

export default Routes;
