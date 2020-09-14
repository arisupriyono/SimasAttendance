import React, { Component } from 'react';
import { Text, View, SafeAreaView, StatusBar, AsyncStorage, Image, TouchableOpacity } from 'react-native';
import { Actions, Router, Scene } from 'react-native-router-flux';
import Home from './pages/Home/Home';

export class Routes extends Component {
    constructor(props) {
        super(props)

    }

    componentDidMount() {

    }

    componentWillReceiveProps() {

    }


    render() {

        return (
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar
                    backgroundColor='#990000'
                    barStyle='dark-content'
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
                        />
                    </Scene>
                </Router>
            </SafeAreaView>
        )
    }
}

export default Routes;
