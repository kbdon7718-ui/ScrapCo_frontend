/**
 * frontend/App.js
 *
 * This is the MAIN app UI entry for our customer frontend.
 *
 * Responsibilities:
 * - Set up React Navigation (so we can move between screens)
 * - Register our screens (HomeScreen, PickupRequestScreen)
 * - Keep the UI “frontend-only” (no backend, no database)
 */

import React, {useContext, useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import { UiStatusProvider } from './contexts/UiStatusContext';
import {PreferencesProvider, PreferencesContext} from './contexts/PreferencesContext';
import ToastHost from './components/ToastHost';
import LoadingOverlay from './components/LoadingOverlay';
import { AuthContext } from './contexts/AuthContext';
import { UiStatusContext } from './contexts/UiStatusContext';
import {getAppColors} from './theme/appColors';

// Screens
import SplashScreen from './screens/SplashScreen';
import SupabaseSetupScreen from './screens/SupabaseSetupScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import AuthScreen from './screens/AuthScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import HomeScreen from './screens/HomeScreenV2';
import PickupRequestScreen from './screens/PickupRequestScreen';
import PickupDetailsScreen from './screens/PickupDetailsScreen';
import PickupStatusScreen from './screens/PickupStatusScreen';
import MyPickupsScreen from './screens/MyPickupsScreen';
import ProfileScreen from './screens/ProfileScreen';
import PreferencesScreen from './screens/PreferencesScreen';
import HelpSupportScreen from './screens/HelpSupportScreen';
import LegalScreen from './screens/LegalScreen';
import RatesScreen from './screens/RatesScreen';
import LogoIcon from './components/LogoIcon';

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = createNativeStackNavigator();
const HistoryStack = createNativeStackNavigator();
const RatesStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function AuthStackScreen() {
  return (
    <AuthStack.Navigator screenOptions={{headerShown:false}}>
      <AuthStack.Screen name="AuthHome" component={AuthScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{headerShown: false}}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="SchedulePickup" component={PickupRequestScreen} />
      <HomeStack.Screen name="Pickup Status" component={PickupStatusScreen} />
      <HomeStack.Screen name="Pickup Details" component={PickupDetailsScreen} />
    </HomeStack.Navigator>
  );
}

function HistoryStackScreen() {
  return (
    <HistoryStack.Navigator screenOptions={{headerShown: false}}>
      <HistoryStack.Screen name="History" component={MyPickupsScreen} />
      <HistoryStack.Screen name="Pickup Details" component={PickupDetailsScreen} />
    </HistoryStack.Navigator>
  );
}

function RatesStackScreen() {
  return (
    <RatesStack.Navigator screenOptions={{headerShown: false}}>
      <RatesStack.Screen name="Rates" component={RatesScreen} />
    </RatesStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{headerShown: false}}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="Preferences" component={PreferencesScreen} />
      <ProfileStack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <ProfileStack.Screen name="Legal" component={LegalScreen} />
    </ProfileStack.Navigator>
  );
}

function MainTabs() {
  const prefs = useContext(PreferencesContext);
  const colors = useMemo(() => getAppColors(prefs?.resolvedTheme || 'light'), [prefs?.resolvedTheme]);
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar,
          {backgroundColor: colors.card, shadowColor: colors.shadow, bottom: 14 + (insets?.bottom || 0)},
        ],
        tabBarIcon: ({focused, color, size}) => {
          return (
            <View style={[styles.tabPill, focused && styles.tabPillActive]}>
              <LogoIcon name={route.name} size={22} focused={focused} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackScreen} />
      <Tab.Screen name="History" component={HistoryStackScreen} />
      <Tab.Screen name="Rates" component={RatesStackScreen} />
      <Tab.Screen name="Profile" component={ProfileStackScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
    height: 66,
    borderRadius: 22,
    borderTopWidth: 0,
    elevation: 10,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 8},
    paddingTop: 10,
    paddingBottom: 12,
  },
  tabPill: {
    minWidth: 54,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.16)',
  },
});

function AppChrome({children}) {
  const auth = useContext(AuthContext);
  const ui = useContext(UiStatusContext);
  const isLoading = Boolean(auth?.loading || ui?.loading);

  return (
    <>
      {children}
      <LoadingOverlay visible={isLoading} message="Loading..." />
      <ToastHost />
    </>
  );
}

function AppNavigation() {
  const prefs = useContext(PreferencesContext);
  const colors = useMemo(() => getAppColors(prefs?.resolvedTheme || 'light'), [prefs?.resolvedTheme]);

  const navTheme = useMemo(
    () => ({
      dark: (prefs?.resolvedTheme || 'light') === 'dark',
      colors: {
        primary: colors.primary,
        background: colors.bg,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        notification: colors.accent,
      },
    }),
    [prefs?.resolvedTheme, colors]
  );

  return (
    <NavigationContainer theme={navTheme}>
      <RootStack.Navigator screenOptions={{headerShown:false}}>
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="SupabaseSetup" component={SupabaseSetupScreen} />
        <RootStack.Screen name="Welcome" component={WelcomeScreen} />
        <RootStack.Screen name="Auth" component={AuthStackScreen} />
        <RootStack.Screen name="Main" component={MainTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UiStatusProvider>
          <PreferencesProvider>
            <AppChrome>
              <AppNavigation />
            </AppChrome>
          </PreferencesProvider>
        </UiStatusProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
