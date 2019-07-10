/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Component } from 'react';
import { Platform, StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, AnimatedRegion } from 'react-native-maps';
import RNGooglePlaces from 'react-native-google-places';
import Icon from 'react-native-vector-icons/MaterialIcons'
import Searchbar from './Searchbar'
import axios from 'axios'

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

import { PermissionsAndroid } from 'react-native';

async function requestCameraPermission() {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Cool Photo App Camera Permission',
        message:
          'Cool Photo App needs access to your camera ' +
          'so you can take awesome pictures.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('You can use the camera');
    } else {
      console.log('Camera permission denied');
    }
  } catch (err) {
    console.warn(err);
  }
}

const API_KEY = "AIzaSyDcSM_KHr25YYbxWtLlkWhXoqfaBvqh1uA"

export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      region: {
        latitude: 13.2811, longitude: 100.9263, latitudeDelta: 0.0922, longitudeDelta: 0.0421
      },
      marker: {
        latitude: 42.882004, longitude: 74.582748,
      },
      margin: 0,
      padding: 0,
      nearLocation: [],
      tracksViewChanges: true,
      locationName: 'Search',
      marked: null,
      currentLocated: true
    }
    this.onRegionChangeComplete = this.onRegionChangeComplete.bind(this)
    this.onPressMarker = this.onPressMarker.bind(this)
    this.openSearchModal = this.openSearchModal.bind(this)
    this.onPressPOI = this.onPressPOI.bind(this)
    this.onSelectCurrentLocation = this.onSelectCurrentLocation.bind(this)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props !== nextProps) {
      this.setState({
        tracksViewChanges: true,
      });
    }
  }

  componentDidUpdate() {
    if (this.state.tracksViewChanges) {
      this.setState({
        tracksViewChanges: false
      });
    }
  }

  componentWillUnmount() {
    clearTimeout(this.callout);
  }


  componentDidMount() {
    requestCameraPermission();
  }

  getNearBySearch = async ({ latitude, longitude }) => {
    let res = await axios.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${API_KEY}&language=th&location=${latitude},${longitude}&radius=500`);
    console.log(res.data.results)
    this.setState({ nearLocation: res.data.results })
  }

  getByPlaceId = async (id) => {
    let res = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json?placeid=${id}&key=${API_KEY}&language=th`);
    return res.data.result.name;
  }

  setCureentLocation = () => {
    navigator.geolocation.getCurrentPosition(({ coords: { latitude, longitude } }) => {
      this.mapView.animateToRegion({ ...this.state.region, longitude, latitude }, 500)
    })
  }

  onRegionChangeComplete(region) {
    this.getNearBySearch(region);
    this.setState({ region, currentLocated: false });
  }


  onPressMarker(event) {
    console.log(event.nativeEvent)
    const { nativeEvent: { coordinate: { latitude, longitude } } } = event
    const { nativeEvent: { coordinate } } = event
    console.log(longitude, latitude, coordinate)
    this.mapView.animateToRegion({ ...this.state.region, longitude, latitude }, 500)
    this.markerMap.animateMarkerToCoordinate(coordinate, 500)
    this.setState({ locationName: 'ไม่มีชื่อสถานที่', descriptMarker: 'ไม่มีชื่อสถานที่'})
    this.renderCallout();
  }

  _onMapReady = () => this.setState({ margin: 5, padding: 5 })

  stopRendering = () => {
    this.setState({ tracksViewChanges: false });
  }

  openSearchModal() {
    RNGooglePlaces.openAutocompleteModal()
      .then((place) => {
        console.log(place);
        const { location: { latitude, longitude } } = place;
        const coordinate = place.location;
        this.mapView.animateToRegion({ ...this.state.region, longitude, latitude }, 500)
        this.markerMap.animateMarkerToCoordinate(coordinate, 500)
        this.setState({ locationName: place.name, descriptMarker: place.name })
        this.renderCallout()
      })
      .catch(error => console.log(error.message));  // error is a Javascript Error object
  }

  onPressPOI = async (event) => {
    const { nativeEvent: { coordinate: { latitude, longitude }, placeId } } = event
    const { nativeEvent: { coordinate } } = event
    const name = await this.getByPlaceId(placeId)
    this.mapView.animateToRegion({ ...this.state.region, longitude, latitude }, 500)
    this.markerMap.animateMarkerToCoordinate(coordinate, 500)
    this.renderCallout()
    this.setState({ locationName: name, descriptMarker: name })
  }

  onSelectedMarker = ({ nativeEvent: { coordinate } }) => {
    const { geometry: { location: { lat, lng } }, name, id } = this.findLocationDescription(coordinate)
    this.markerMap.animateMarkerToCoordinate({ latitude: lat, longitude: lng }, 500)
    this.renderCallout()
    this.setState({ locationName: name, region: { ...this.state.region, latitude: lat, longitude: lng }, descriptMarker: name })
  }

  onCalloutPress = ({ nativeEvent: { coordinate } }) => {
    this.findLocationDescription(coordinate)
  }

  onSelectCurrentLocation() {
    this.setCureentLocation();
    this.setState({ currentLocated: true })
  }

  findLocationDescription = ({ latitude, longitude }) => {
    return this.state.nearLocation.find(({ geometry: { location: { lat, lng } } }) => lat == latitude && lng == longitude)
  }

  renderCallout() {
    this.callout = setTimeout(() => {
      this.markerMap.showCallout();
    }, 0);
  }

  render() {
    console.log(this.state)
    return (
      <View style={{ flex: 1 }}>
        <MapView
          style={{ flex: 1, marginTop: this.state.margin, marginBottom: this.state.margin, paddingTop: this.state.padding, paddingBottom: this.state.padding }}
          // region={this.state.region}
          onRegionChangeComplete={this.onRegionChangeComplete}
          showsMyLocationButton={true}
          showsUserLocation={true}
          onPress={this.onPressMarker}
          onMapReady={this._onMapReady}
          // provider={PROVIDER_GOOGLE}
          ref={(ref) => this.mapView = ref}
          onPoiClick={this.onPressPOI}
          initialRegion={{
            latitude: 13.2811, longitude: 100.9263, latitudeDelta: 0.0922, longitudeDelta: 0.0421
          }}
        >
          <Marker
            ref={(ref) => this.markerMap = ref}
            coordinate={this.state.marker}
            title={this.state.descriptMarker}
            tracksViewChanges={this.state.tracksViewChanges}
            description={this.state.descriptMarker}
            onCalloutPress={test => console.log(test)}
          />

          {this.state.nearLocation.map(location => (
            <Marker
              coordinate={{ latitude: location.geometry.location.lat, longitude: location.geometry.location.lng }}
              key={location.id}
              tracksViewChanges={this.state.tracksViewChanges}
              onPressMarker={test => console.log(test)}
              onPress={this.onSelectedMarker}
              onCalloutPress={this.onCalloutPress}
            >
              <Image source={{ uri: location.icon }} style={{ height: 20, width: 20 }} onLoad={this.stopRendering} />
            </Marker>))
          }

        </MapView>
        <Searchbar onPress={this.openSearchModal} location={this.state.locationName} />
        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 50,
            right: 10,
            backgroundColor: "white",
            width: 50,
            height: 50,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 50
          }}
          onPress={this.onSelectCurrentLocation}
        >
          {this.state.currentLocated ? <Icon name='gps-fixed' size={30} color="#4285f4" /> : <Icon name='gps-fixed' size={30} color="#000" />}
        </TouchableOpacity>
      </View>

    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});