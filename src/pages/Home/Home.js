import React, { Component } from 'react';
import { Text, StyleSheet, View, TouchableOpacity, Alert, ActivityIndicator, Image , ScrollView , Linking, PermissionsAndroid, Platform, TouchableWithoutFeedback, Keyboard} from 'react-native';
import { getUniqueId, getVersion } from 'react-native-device-info';
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

            CURRENT_GEOTAG_LAT:'',
            CURRENT_GEOTAG_LONG:'',

            OFFICE_GEOTAG_LAT:'',
            OFFICE_GEOTAG_LONG:'',
            OFFICE_LOCATIONS:[],

            appVer: getVersion()
        }
    }


    async componentDidMount(){
        await this.locationInit();

        const uniqueID = getUniqueId();
        this.setState({uniqueID},()=>{
            this.checkUID(uniqueID);
        });

    }

    async locationInit(){
        await RNLocation.configure({
            distanceFilter: 0,
            maxWaitTime: 1000,
            desiredAccuracy: {
                ios: "best", //bestForNavigation // testing
                android: "highAccuracy"
            },
            interval: 1000, // Milliseconds
            fastestInterval: 2000,
        })

        await RNLocation.requestPermission({
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
        }).then(granted => {
            if (granted) {
                this.setState({
                    getLocPermission: 1
                })
            }
        });
    }
    

    async _startUpdatingLocation() {
       const unsubscribe = await  RNLocation.subscribeToLocationUpdates(
         async locations => {
                var maxTime = await Math.max.apply(Math,locations.map(function(o){return o.timestamp;}))
                
                let idx =  await locations.findIndex(function (item, i) {
                    return item.timestamp == maxTime 
                });
                let latitude =  locations[idx].latitude;
                let longitude =  locations[idx].longitude;
                let loc =  latitude + ',' + longitude;
                await this.setState({ location: loc, CURRENT_GEOTAG_LAT: latitude, CURRENT_GEOTAG_LONG:longitude });
                console.log('lokasi2'+loc)

                if(unsubscribe){
                     unsubscribe();
                }
             }
        );
    };

    checkUID(uidVal){
        fetch(Config.CheckAPI.CheckUID + '?uid_hp=' +uidVal)
            .then((response) => response.json())
            .then((responseJson) => {
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
                  Keyboard.dismiss();
              }

              this.setState({isLoading:false})
            }).catch((err)=>{
                this.setState({isLoading:false});
                console.log(err);
            })
    }
    
    checkNIK = async () => {
        try {
          let response = await fetch(
            Config.CheckAPI.CheckNIK + '?nik=' +this.state.NIK
          );
            let responseJson = await response.json();
            let error = responseJson[0].error;
            let message = responseJson[0].message;
            let NAMA = responseJson[0].NAME;
            let OFFICE_LOCATIONS = responseJson[0].LOCATION;
            await this.setState({ NAMA, OFFICE_LOCATIONS });
            console.log('nik2');

        } catch (error) {
          console.log(error);
        }
    };
    

    async submitIn(){
        await this.setState({locations:null, CURRENT_GEOTAG_LAT:'', CURRENT_GEOTAG_LONG:'', isLoading: true });

        await RNLocation.checkPermission({
            ios: 'whenInUse', // or 'always'
            android: {
              detail: 'fine' // or 'fine'
            }
          }).then((permission)=>{
            if(!permission){
                RNLocation.requestPermission({
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
                }).then(granted => {
                    if (granted) {
                        this.setState({
                            getLocPermission: 1
                        })
                    }
                });
            }
          })

        if(this.state.NIK != '' && this.state.NIK != null){
           await this.checkNIK();

        }

        if(this.state.getLocPermission!= 0){
            await this._startUpdatingLocation();
        }

        var timerLoc = setInterval(() => {
            console.log('timer')
           if(this.state.CURRENT_GEOTAG_LAT!='' && this.state.CURRENT_GEOTAG_LAT != null && this.state.CURRENT_GEOTAG_LONG!='' && this.state.CURRENT_GEOTAG_LONG != null){
                clearInterval(timerLoc);
                this.postData('I');
           }
        }, 100);


      
    }

    async postData(val){
        console.log('submitdata');
        
        if(this.state.NIK == '' || this.state.NIK == null){
            Alert.alert('','Mohon untuk mengisi NIK anda.');
        }else if(this.state.getLocPermission == 0){
            Alert.alert('','Pastikan anda memberikan akses aplikasi terhadap lokasi anda agar aplikasi dapat digunakan.');
        }else if(this.state.location == null){
            Alert.alert('','Lokasi tidak dapat ditentukan silahkan coba beberapa saat lagi.');
        }
        else{
            if(this.state.OFFICE_LOCATIONS.length < 1){
                Alert.alert('','Lokasi kantor tidak dapat ditentukan silahkan coba beberapa saat lagi.');
            }else{
                let passed = false;
                let office_lat_tmp = '';
                let office_long_tmp = '';
                let distance = '';
                for(let i = 0; i < this.state.OFFICE_LOCATIONS.length; i ++){
                    office_lat_tmp = this.state.OFFICE_LOCATIONS[i].OFFICE_GEOTAG_LAT;
                    office_long_tmp = this.state.OFFICE_LOCATIONS[i].OFFICE_GEOTAG_LONG;
                 
                    distance = await this.getDistance(this.state.CURRENT_GEOTAG_LAT, this.state.CURRENT_GEOTAG_LONG, office_lat_tmp, office_long_tmp);
                 
                    if(distance <= 0.5){
                        passed = true;
                    }
                }

                if(passed === false){
                    Alert.alert('','Pastikan jarak anda dengan kantor tidak lebih dari 500 m.');
                }else{
                    fetch(Config.AttendanceAPI.Entry+ '?nik='+this.state.NIK+'&uid_hp='+this.state.uniqueID+'&absen_typ='+ val +'&geo_tag='+this.state.location)
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
                            Alert.alert('',err);
                        })
                }
            }
        }

        this.setState({isLoading : false});
        this.logging(val);
    }

    dialogOut(){
        Alert.alert(
            '',
            'Apakah anda yakin untuk absen pulang?',
            [
                {
                    text: 'Cancel',
                    onPress: () => console.log('Cancel Pressed'),
                    style: 'cancel',
                },
                {
                    text: 'Yes', onPress: () => {
                       this.submitOut();
                    }
                },
            ],
            { cancelable: false },
        );
    }

    async submitOut(){
        await this.setState({locations:null, CURRENT_GEOTAG_LAT:'', CURRENT_GEOTAG_LONG:'', isLoading: true });
        await RNLocation.checkPermission({
            ios: 'whenInUse', // or 'always'
            android: {
              detail: 'fine' // or 'fine'
            }
          }).then((permission)=>{
            if(!permission){
                RNLocation.requestPermission({
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
                }).then(granted => {
                    if (granted) {
                        this.setState({
                            getLocPermission: 1
                        })
                    }
                });
            }
          })

        if(this.state.NIK != '' && this.state.NIK != null){
            await this.checkNIK();
        }
        
        if(this.state.getLocPermission!= 0){
            await this._startUpdatingLocation();
        }

        var timerLoc = setInterval(() => {
            if(this.state.CURRENT_GEOTAG_LAT!='' && this.state.CURRENT_GEOTAG_LAT != null && this.state.CURRENT_GEOTAG_LONG!='' && this.state.CURRENT_GEOTAG_LONG != null){
                 clearInterval(timerLoc);
                 this.postData('O');
            }
         }, 100);
    }

    logging(type){
        fetch(Config.LoggingAPI.Logger+ '?nik='+this.state.NIK+'&geo_tag='+this.state.location+'&absen_typ='+type+'&app_ver='+this.state.appVer);
    }

    handleNIKchange = (text)=>{
        this.setState({ NIK : text },()=>{
            if(text.length == 6){
                this.checkNIK();
            }
            else{
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


    getDistance(lat1, lon1, lat2, lon2) 
    {
      var R = 6371; // km
      var dLat = this.toRad(lat2-lat1);
      var dLon = this.toRad(lon2-lon1);
      var lat1 = this.toRad(lat1);
      var lat2 = this.toRad(lat2);

      var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c;
      return d;
    }

    // Converts numeric degrees to radians
    toRad(Value) 
    {
        return Value * Math.PI / 180;
    }

    
    render() {
        const { NIK, TANGGAL_IN, GEOTAG_IN, TANGGAL_OUT, GEOTAG_OUT, NAMA, isLoading } = this.state;
        return (
            <TouchableWithoutFeedback onPress={()=>{Keyboard.dismiss()}}>
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
                                <View style={{backgroundColor:'#7ea04d', width:120, height:40, alignItems:'center', justifyContent:'center', borderRadius:8}}>
                                    <Text style={{fontWeight:'bold', color:'white'}}>
                                        MASUK (IN)
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            <View style={{marginHorizontal:10}}/>
                            <TouchableOpacity onPress={()=>{this.dialogOut()}}>
                                <View  style={{backgroundColor:'#7ea04d', width:120, height:40, alignItems:'center', justifyContent:'center', borderRadius:8}}>
                                    <Text style={{fontWeight:'bold', color:'white'}}>
                                        KELUAR (OUT)
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
                    <Text>{'Ver. '+this.state.appVer}</Text>
                </View>
            </View>
        </TouchableWithoutFeedback>
        )
    }
}

const styles = StyleSheet.create({})
