import React, { Component } from 'react';
import { Text, StyleSheet, View, TouchableOpacity, Alert, ActivityIndicator, Image , ScrollView , Linking, PermissionsAndroid, Platform} from 'react-native';
import { getUniqueId, getManufacturer, getAndroidId } from 'react-native-device-info';
import { Container, Content, Form, Item, Label, Input } from 'native-base';
import Config from '../../configs/configs';
import * as Constants from './../../configs/constants';
import RNLocation from 'react-native-location';
import Geolocation from 'react-native-geolocation-service';

watchId = null;
export default class Home extends Component {
    constructor(props) {
        super(props)
    
        this.state = {
            uniqueID : '',
            NIK:'',
            TANGGAL_IN:'',
            GEOTAG_IN:'',
            TANGGAL_OUT:'',
            GEOTAG_OUT:'',
            NAMA: '',
            getLocPermission: 0,
            location: null,
            isLoading:true,

            forceLocation: true,
            highAccuracy: true,
            loading: false,
            showLocationDialog: true,
            significantChanges: false,
            updatesEnabled: false,
            foregroundService: false,
        }
    }

    hasLocationPermission = async () => {
        if (Platform.OS === 'ios') {
          const hasPermission = await this.hasLocationPermissionIOS();
          return hasPermission;
        }
    
        if (Platform.OS === 'android' && Platform.Version < 23) {
          return true;
        }
    
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
    
        if (hasPermission) {
          return true;
        }
    
        const status = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
    
        if (status === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        }
    
        if (status === PermissionsAndroid.RESULTS.DENIED) {
          ToastAndroid.show(
            'Location permission denied by user.',
            ToastAndroid.LONG,
          );
        } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          ToastAndroid.show(
            'Location permission revoked by user.',
            ToastAndroid.LONG,
          );
        }
    
        return false;
      };

    hasLocationPermissionIOS = async () => {
        const openSetting = () => {
          Linking.openSettings().catch(() => {
            Alert.alert('Unable to open settings');
          });
        };
        const status = await Geolocation.requestAuthorization('whenInUse');
    
        if (status === 'granted') {
          return true;
        }
    
        if (status === 'denied') {
          Alert.alert('Location permission denied');
        }
    
        if (status === 'disabled') {
          Alert.alert(
            `Turn on Location Services to allow Simas Attendance to determine your location.`,
            '',
            [
              { text: 'Go to Settings', onPress: openSetting },
              { text: "Don't Use Location", onPress: () => {} },
            ],
          );
        }
    
        return false;
      };

      getLocationUpdates = async () => {
        const hasLocationPermission = await this.hasLocationPermission();
    
        if (!hasLocationPermission) {
          return;
        }
    
        this.setState({ updatesEnabled: true }, () => {
          this.watchId = Geolocation.watchPosition(
            (position) => {
            alert(position)
              this.setState({ location: position });
              console.log(position);
            },
            (error) => {
              this.setState({ location: error });
              console.log(error);
            },
            {
              enableHighAccuracy: this.state.highAccuracy,
              distanceFilter: 0,
              interval: 5000,
              fastestInterval: 2000,
              forceRequestLocation: this.state.forceLocation,
              showLocationDialog: this.state.showLocationDialog,
              useSignificantChanges: this.state.significantChanges,
            },
          );
        });
      };

      getLocation = async () => {

        const hasLocationPermission = await this.hasLocationPermission();
    
        if (!hasLocationPermission) {
          return;
        }
    
        this.setState({ loading: true }, () => {
          Geolocation.getCurrentPosition(
            (position) => {
                alert(position);
              this.setState({ location: position, loading: false });
              console.log(position);
            },
            (error) => {
              this.setState({ location: error, loading: false });
              console.log(error);
            },
            {
              enableHighAccuracy: this.state.highAccuracy,
              timeout: 15000,
              maximumAge: 10000,
              distanceFilter: 0,
              forceRequestLocation: this.state.forceLocation,
              showLocationDialog: this.state.showLocationDialog,
            },
          );
        });
      };

      removeLocationUpdates = () => {
        if (this.watchId !== null) {
          this.stopForegroundService();
          Geolocation.clearWatch(this.watchId);
          this.watchId = null;
          this.setState({ updatesEnabled: false });
        }
      };

    componentWillUnmount(){
        this.removeLocationUpdates();
    }

    componentDidMount(){

        const uniqueID = getUniqueId();
        this.setState({uniqueID},()=>{
            this.checkUID(uniqueID);
            Platform.OS === 'ios' ? this.getLocation() : this.locationInit();
            
        });
    }
    

    locationInit() {
        RNLocation.configure({
            distanceFilter: 5.0,
            maxWaitTime: 5000
        }).then(() => RNLocation.requestPermission({
            ios: "whenInUse",
            android: {
                detail: "fine",
                rationale: {
                    title: "Location permission",
                    message: "We use your location to complete this form",
                    buttonPositive: "OK",
                    buttonNegative: "Cancel"
                }
            }
        })).then(granted => {
            if (granted) {
                this.setState({
                    getLocPermission: 1
                }, () => {
                    this._startUpdatingLocation();
                })
            }
        });
    }



    _startUpdatingLocation() {
        const unsubscribe = RNLocation.subscribeToLocationUpdates(
            locations => {
                let latitude = locations[0].latitude;
                let longitude = locations[0].longitude;
                let loc = latitude + ',' + longitude;
                this.setState({ location: loc });
                if(unsubscribe){
                    unsubscribe();
                }
            }
        );
    };

    checkUID(uidVal){
        console.log('jalan kok');
        fetch(Config.CheckAPI.CheckUID + '?uid_hp=' +uidVal)
            .then((response) => response.json())
            .then((responseJson) => {
            console.log(responseJson);
              let error = responseJson[0].error;
              let message = responseJson[0].message;
              let NIK = responseJson[0].NIK;
              let TANGGAL_IN = responseJson[0].TANGGAL_IN
              let GEOTAG_IN = responseJson[0].GEOTAG_IN
              let TANGGAL_OUT = responseJson[0].TANGGAL_OUT
              let GEOTAG_OUT = responseJson[0].GEOTAG_OUT

              this.setState({NIK, TANGGAL_IN, GEOTAG_IN, TANGGAL_OUT, GEOTAG_OUT});
              if(NIK!= undefined && NIK.length == 6){
                  this.checkNIK();
              }

              this.setState({isLoading:false})
            }).catch((err)=>{
                this.setState({isLoading:false});
                console.log(err);
            })
    }
    
    checkNIK(){
        fetch(Config.CheckAPI.CheckNIK + '?nik=' +this.state.NIK)
            .then((response) => response.json())
            .then((responseJson) => {
            console.log(responseJson);
              let error = responseJson[0].error;
              let message = responseJson[0].message;
              let NAMA = responseJson[0].NAMA;
              this.setState({ NAMA });
            }).catch((err)=>{
                console.log(err);
            })
    }
    

    submitIn(){
        let NIK = this.state.NIK;
        let location = this.state.location;
        let getLocPermission = this.state.getLocPermission;
        let uniqueID = this.state.uniqueID;

        if(NIK == '' || NIK == null){
            Alert.alert('','Mohon untuk mengisi NIK anda.');
        }else if(getLocPermission == 0){
            Alert.alert('','Pastikan anda memberikan akses aplikasi terhadap lokasi anda agar aplikasi dapat digunakan.');
        }else if(location == null){
            Alert.alert('','Pastikan GPS anda aktif agar aplikasi dapat digunakan.');
        }else{
            fetch(Config.AttendanceAPI.Entry+ '?nik='+NIK+'&uid_hp='+uniqueID+'&absen_typ=I&geo_tag='+location)
            .then((response) => response.json())
            .then((responseJson) => {
              let sts = responseJson[0].Result_sts;
              let message = responseJson[0].Result_msg;
              if(sts == '1'){
                Alert.alert('',message);
              }else{
                Alert.alert('',message);
              }

              this.checkUID(this.state.uniqueID);
            }).catch((err)=>{
                this.setState({isLoading:false});
                console.log(err);
            })
        }
    }

    submitOut(){
        let NIK = this.state.NIK;
        let uniqueID = this.state.uniqueID;
        let location = this.state.location;
        let getLocPermission = this.state.getLocPermission;

        if(NIK == '' || NIK == null){
            Alert.alert('','Mohon untuk mengisi NIK anda.');
        }else if(getLocPermission == 0){
            Alert.alert('','Pastikan anda memberikan akses aplikasi terhadap lokasi anda agar aplikasi dapat digunakan.');
        }else if(location == null){
            Alert.alert('','Pastikan GPS anda aktif agar aplikasi dapat digunakan.');
        }else{
            console.log(Config.AttendanceAPI.Entry+ '?nik='+NIK+'&uid_hp='+uniqueID+'&absen_typ=O&geo_tag='+location);
            fetch(Config.AttendanceAPI.Entry+ '?nik='+NIK+'&uid_hp='+uniqueID+'&absen_typ=O&geo_tag='+location)
            .then((response) => response.json())
            .then((responseJson) => {
              let sts = responseJson[0].Result_sts;
              let message = responseJson[0].Result_msg;
              if(sts == '1'){
                Alert.alert('',message);
              }else{
                Alert.alert('',message);
              }
              this.checkUID(this.state.uniqueID);

            }).catch((err)=>{
                this.setState({isLoading:false});
                console.log(err);
            })
        }
    }

    handleNIKchange = (text)=>{
        this.setState({ NIK : text },()=>{
            if(text.length == 6){
                this.checkNIK();
            }else{
                this.setState({ NAMA:'' })
            }
        });
        
    }

    openMaps(link){
        if(link != null && link !='' && link != undefined){
            Linking.canOpenURL(link).then(supported => {
                if (supported) {
                  Linking.openURL(link);
                } else {
                  console.log("Invalid Link : " + link);
                }
            });
        }
        
    }

    setAccuracy = (value) => this.setState({ highAccuracy: value });
    setSignificantChange = (value) =>
      this.setState({ significantChanges: value });
    setLocationDialog = (value) => this.setState({ showLocationDialog: value });
    setForceLocation = (value) => this.setState({ forceLocation: value });
    setForegroundService = (value) => this.setState({ foregroundService: value });
    
    render() {
        const { NIK, TANGGAL_IN, GEOTAG_IN, TANGGAL_OUT, GEOTAG_OUT, NAMA, isLoading } = this.state;
        return (
            <View style={{ flex:1 }}>
                {isLoading ? 
                    <View style={{alignItems:'center', justifyContent:'center', height: Constants.heightDevice * 0.85}}>
                        <ActivityIndicator size={'small'}/>
                        <Text>Mohon menunggu. . .</Text>
                    </View>
                :
                    <View>
                        <View style={{alignItems:'center', justifyContent:'center',marginBottom:Constants.heightDevice * 0.05, marginTop:0.05 * Constants.heightDevice}}>
                            <Image source={require('../../assets/icons/clock.png')} 
                            style={{width:0.3 * Constants.widthDevice, height: 0.3 * Constants.widthDevice}}
                            resizeMode={'stretch'}/>
                        </View>
                        <View style={{marginBottom:10}}>
                            <View style={{width:0.9 * Constants.widthDevice, alignSelf:'center', alignItems:'center'}}>
                                <Text style={{fontWeight:'bold', fontSize:25, textAlign:'center'}}>{NAMA}</Text>
                            </View> 
                        </View>
                        <View style={{ marginBottom:50 }}>
                            <View style={{width: 0.9 * Constants.widthDevice, alignSelf:'center', flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
                                {/* <Item style={{}}> */}
                                    <Input
                                        placeholder={'Nomor Induk Karyawan'} 
                                        value={NIK}
                                        keyboardType={'numeric'}
                                        onChangeText={this.handleNIKchange} 
                                        style={{backgroundColor: '#d9d9d9', height: 60, borderTopLeftRadius: 5,  borderBottomLeftRadius: 5, textAlign:'center', fontSize:25}}
                                        maxLength={6}
                                    />
                                    {/* <TouchableOpacity onPress={()=>{this.checkNIK()}}>
                                    <View style={{alignItems:'center', justifyContent:'center', padding:10, backgroundColor:'#990000', height:60, borderBottomRightRadius:5, borderTopRightRadius:5}}>
                                        <Text style={{fontWeight:'bold', color:'white'}}>
                                            Check
                                        </Text>
                                    </View>
                                </TouchableOpacity> */}
                                
                                {/* </Item> */}
                                
                            </View>
                        </View>
                        
                        <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center', marginBottom: 0.1 * Constants.heightDevice}}>
                            <TouchableOpacity onPress={()=>{this.submitIn()}}>
                                <View style={{backgroundColor:'#7ea04d', width:100, height:40, alignItems:'center', justifyContent:'center', borderRadius:8}}>
                                    <Text style={{fontWeight:'bold', color:'white'}}>
                                        MASUK
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            <View style={{marginHorizontal:10}}/>
                            <TouchableOpacity onPress={()=>{this.submitOut()}}>
                                <View  style={{backgroundColor:'#7ea04d', width:100, height:40, alignItems:'center', justifyContent:'center', borderRadius:8}}>
                                    <Text style={{fontWeight:'bold', color:'white'}}>
                                        PULANG
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                       
                       <View>
                           {/* {TANGGAL_IN != '' && TANGGAL_IN != null && TANGGAL_IN != undefined ? */}
                            <View style={{ width: 0.9 * Constants.widthDevice, alignSelf:'center'}}>
                                {/* <ScrollView horizontal> */}
                                {TANGGAL_IN != '' && TANGGAL_IN != null && TANGGAL_IN != undefined ? 
                                <View>
                                    <View style={{width:0.8 * Constants.widthDevice, flexDirection:'row', marginBottom:10}}>
                                        <View style={{ width:0.3 * Constants.widthDevice, alignItems:'flex-start', justifyContent:'center'}}><Text style={{fontWeight:'bold'}}>Jam Masuk</Text></View>
                                        <View style={{alignItems:'center', justifyContent:'center', width:10}}><Text style={{fontWeight:'bold'}}>:</Text></View>
                                        <View style={{alignItems:'center', justifyContent:'center'}}><Text style={{textAlign:'center', textAlignVertical:'center'}}>{TANGGAL_IN}</Text></View>
                                    </View>
                                    <View style={{width:0.8 * Constants.widthDevice, flexDirection:'row', marginBottom:10}}>
                                        <View style={{ width:0.3 * Constants.widthDevice, alignItems:'flex-start', justifyContent:'center'}}><Text style={{fontWeight:'bold'}}>Lokasi Masuk</Text></View>
                                        <View style={{alignItems:'center', justifyContent:'center', width:10}}><Text style={{fontWeight:'bold'}}>:</Text></View>
                                        <View style={{alignItems:'center', justifyContent:'center'}}><TouchableOpacity onPress={()=>{this.openMaps(GEOTAG_IN)}}><View style={{backgroundColor:'#cf7500', alignItems:'center', justifyContent:'center', padding:5, borderRadius:3}}><Text style={{color:'white'}}>show</Text></View></TouchableOpacity></View>
                                    </View>
                                </View>
                                : null}
                                {TANGGAL_OUT != '' && TANGGAL_OUT != null && TANGGAL_OUT != undefined ? 
                                <View>
                                    <View style={{width:0.8 * Constants.widthDevice, flexDirection:'row', marginBottom:10}}>
                                        <View style={{width:0.3 * Constants.widthDevice, alignItems:'flex-start', justifyContent:'center'}}><Text style={{fontWeight:'bold'}}>Jam Keluar</Text></View>
                                        <View style={{alignItems:'center', justifyContent:'center', width:10}}><Text style={{fontWeight:'bold'}}>:</Text></View>
                                        <View style={{alignItems:'center', justifyContent:'center'}}><Text style={{textAlign:'center', textAlignVertical:'center'}}>{TANGGAL_OUT}</Text></View>
                                    </View>
                                    <View style={{width:0.8 * Constants.widthDevice, flexDirection:'row', marginBottom:10}}>
                                        <View style={{ width:0.3 * Constants.widthDevice, alignItems:'flex-start', justifyContent:'center'}}><Text style={{fontWeight:'bold'}}>Lokasi Keluar</Text></View>
                                        <View style={{alignItems:'center', justifyContent:'center', width:10}}><Text style={{fontWeight:'bold'}}>:</Text></View>
                                        <View style={{alignItems:'center', justifyContent:'center'}}><TouchableOpacity onPress={()=>{this.openMaps(GEOTAG_OUT)}}><View style={{backgroundColor:'#cf7500', alignItems:'center', justifyContent:'center', padding:5, borderRadius:3}}><Text style={{color:'white'}}>show</Text></View></TouchableOpacity></View>
                                    </View>
                                </View>
                                :null}
                                {/* </ScrollView> */}
                            </View>
                            {/* : */}
                            {/* null} */}
                       </View>
                    </View>
                }
                 <View style={{position:'absolute', bottom:20, width:Constants.widthDevice, alignItems:'center'}}>
                    <Text>Ver. 1.0</Text>
                </View>
            </View>
              
        )
    }
}

const styles = StyleSheet.create({})
