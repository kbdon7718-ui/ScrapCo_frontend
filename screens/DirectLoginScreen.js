import React, {useContext} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import AppHeader from '../components/AppHeader';
import Button from '../components/Button';
import Card from '../components/Card';
import Screen from '../components/Screen';
import {AuthContext} from '../contexts/AuthContext';
import {theme} from '../theme';

export default function DirectLoginScreen({navigation}) {
  const {directLogin} = useContext(AuthContext);

  return (
    <Screen>
      <AppHeader title="ScrapCo" subtitle="Quick start (auth can be added later)" />

      <View style={{marginTop: theme.spacing.lg}}>
        <Card>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>Request pickups, track status, and view rates.</Text>

          <View style={{marginTop: theme.spacing.md}}>
            <Button
              label="Continue"
              onPress={() => {
                directLogin();
                navigation.replace('Main');
              }}
              variant="primary"
            />
          </View>

          <View style={{marginTop: theme.spacing.md}}>
            <Button
              label="Admin Portal"
              onPress={() => {
                navigation.navigate('Admin');
              }}
              variant="secondary"
            />
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {fontSize: 18, fontWeight: '400', color: theme.colors.text},
  subtitle: {marginTop: 8, color: theme.colors.textMuted, fontWeight: '400', lineHeight: 18},
});
