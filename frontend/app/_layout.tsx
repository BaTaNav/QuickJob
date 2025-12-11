
import { useFonts } from 'expo-font';
import { Stack, Link } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Pressable, Text, View } from 'react-native';
import { Handshake, RefreshCw } from 'lucide-react-native';



export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

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

  return <RootLayoutNav />;
}

function RootLayoutNav() {

  return (

      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Explicit screen entry so we can control the native header for Student/Dashboard */}
        <Stack.Screen
          name="Student/Dashboard"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: '#fff' },
            // Render a custom title component (icon + app name) similar to the Client dashboard header
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Handshake size={28} color="#176B51" strokeWidth={2.5} />
                <Text style={{ fontWeight: '800', marginLeft: 8, fontSize: 18, color: Colors[colorScheme ?? 'light'].text }}>QuickJob</Text>
              </View>
            ),
            headerTitleStyle: { fontWeight: '600' },
            // Hide the automatic back button on the Dashboard itself (we want a clean root screen).
            headerLeft: () => null,
            headerRight: () => (
              <>
                {/* Refresh button */}
                <Pressable
                  onPress={() => {
                    try {
                      if (typeof window !== 'undefined' && window.location) {
                        window.location.reload();
                      }
                    } catch (e) {
                      // no-op on native for now
                    }
                  }}
                  style={{ marginRight: 12, padding: 6, borderRadius: 999, backgroundColor: '#F7F9FC' }}
                >
                  <RefreshCw size={18} color="#64748B" />
                </Pressable>

                {/* Profile button (left of logout) */}
                <Link href={'/Student/Profile' as unknown as any} asChild>
                  <Pressable>
        
                  </Pressable>
                </Link>
              </>
            ),
          }}
        />

        <Stack.Screen
          name="Student/Profile"
          options={{
            title: 'Profile',
            headerShown: true,
            
          }}
        />

        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
  );
}
