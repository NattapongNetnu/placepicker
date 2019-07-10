import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'


export default class SearchBar extends React.Component {
    render() {
        return (
            <View style={{
                position: 'absolute',
                height: '10%',
                backgroundColor: 'white',
                width: '100%',
                justifyContent: "center",
                alignItems: "center"
            }}
            >
                <TouchableOpacity onPress={() => this.props.onPress()}>
                    <Text style={{ fontSize: 20 }}>{this.props.location}</Text>
                </TouchableOpacity>
            </View>
        )
    }
}