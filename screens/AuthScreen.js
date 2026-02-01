import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

export default function AuthScreen({navigation}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in or create an account</Text>

      <View style={{marginTop: 24}}>
        <PrimaryButton title="Login" onPress={() => navigation.navigate('Login')} />
      </View>

      <View style={{marginTop: 12}}>
        <PrimaryButton title="Sign Up" onPress={() => navigation.navigate('Signup')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex:1, padding:16, justifyContent:'center'},
  title: {fontSize:20, fontWeight:'400'},
});
