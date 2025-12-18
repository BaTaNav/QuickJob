import { useFonts } from 'expo-font';
import { Stack, Link } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { Handshake, RefreshCw, User } from 'lucide-react-native'; // Added User icon for profile
import Colors from '../constants/Colors'; // Assuming this file exists and exports color palette
import { ThemeProvider } from '@/contexts/ThemeContext';


// Catch any errors thrown by the Layout component.
export { ErrorBoundary } from 'expo-router';

// Global settings for Expo Router
export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme(); // Hook to access the current color scheme

  // Placeholder for a refresh action in the native header (e.g., refetch data)
  const handleNativeHeaderRefresh = () => {
    // In a production app, you would use a global state manager (Redux/Context/etc.)
    // to dispatch a 'refresh' action that the current screen (Dashboard) listens to.
    console.log("Header Refresh triggered (Dispatching global refresh event...)");
  };


  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Hide header for Login page (no back arrow) */}
      <Stack.Screen name="Login" options={{ headerShown: false }} />

      {/* Hide headers for signup pages */}
      <Stack.Screen name="Student/Signup" options={{ headerShown: false }} />
      <Stack.Screen name="Client/Signup" options={{ headerShown: false }} />
      <Stack.Screen name="Client/DashboardClient" options={{ headerShown: false }} />
      <Stack.Screen name="Client/Profile" options={{ headerShown: false }} />

      {/* Hide headers for admin pages */}
      <Stack.Screen name="Admin/DashboardAdmin" options={{ headerShown: false }} />
      <Stack.Screen name="Admin/StudentProfileAdmin" options={{ headerShown: false }} />
      <Stack.Screen name="Admin/VerificationAdmin" options={{ headerShown: false }} />
      <Stack.Screen name="Admin/IncidentsAdmin" options={{ headerShown: false }} />

      {/* Explicit screen entry for Student Dashboard */}
      <Stack.Screen
        name="Student/Dashboard"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          
          // Custom header title (QuickJob logo + text)
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Handshake size={28} color="#176B51" strokeWidth={2.5} />
              <Text style={{ fontWeight: '800', marginLeft: 8, fontSize: 18, color: '#176B51' }}>
                QuickJob
              </Text>
            </View>
          ),
          headerTitleStyle: { fontWeight: '600' },
          
          // Hide the automatic back button (as this is a root screen)
          headerLeft: () => null,

          // Custom header right buttons (Refresh and Profile)
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {/* 1. Refresh button */}
              <Pressable
                onPress={handleNativeHeaderRefresh}
                style={{ padding: 6, borderRadius: 999, backgroundColor: '#F7F9FC' }}
              >
                <RefreshCw size={18} color="#64748B" />
              </Pressable>

              {/* 2. Profile button */}
              {/* 'as never' or 'as any' is necessary here for non-standard routes like /Student/Profile */}
              <Link href={'/Student/Profile' as never} asChild> 
                <Pressable style={{ padding: 6 }}>
                  <User size={24} color="#1B1B1B" /> 
                </Pressable>
              </Link>
            </View>
          ),
        }}
      />

      {/* Screen entry for Student Profile */}
      <Stack.Screen
        name="Student/Profile"
        options={{
          title: 'My Profile', // Custom title for the header
          headerShown: true,
        }}
      />

      {/* Generic modal screen */}
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />

      {/* Add the Job Detail screen entry here for correct navigation */}
      <Stack.Screen 
        name="Student/Job/[id]" 
        options={{ 
          title: 'Job Details', 
        }} 
      />

    </Stack>
  );
}