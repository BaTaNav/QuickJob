import Login from '../../components/Login';
import { SafeAreaView, Alert } from 'react-native';
export default function TabOneScreen() {
  const handleLogin = (email: string, password: string) => {
    Alert.alert('Login Info', `Email: ${email}\nPassword: ${password}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
      <Login onSubmit={handleLogin} title="Student Login" />
    </SafeAreaView>
  );
}
