import React, {useContext, useEffect} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {AuthContext} from '../contexts/AuthContext';

export default function SplashScreen({navigation}) {
  const {user, loading, configured, bypassed} = useContext(AuthContext);

  useEffect(() => {
    if (loading) return;
    if (bypassed) {
      navigation.replace('Main');
      return;
    }
    const next = user ? 'Main' : 'Welcome';
    navigation.replace(next);
  }, [navigation, user, loading, configured, bypassed]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex:1, alignItems:'center', justifyContent:'center'},
});
