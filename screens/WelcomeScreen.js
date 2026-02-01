import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

export default function WelcomeScreen({navigation}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to ScrapCo</Text>
      <Text style={styles.subtitle}>Request pickups, track status, and view rates.</Text>

      <View style={{marginTop: 24}}>
        <PrimaryButton title="Continue" onPress={() => navigation.navigate('Auth')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex:1, padding:16, justifyContent:'center'},
  title: {fontSize:28, fontWeight:'400', marginBottom:8},
  subtitle: {color:'#64748B', fontWeight:'400'},
});
