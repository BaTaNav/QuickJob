// components/Login.tsx
import React from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';

type Props = {
  onSubmit: (email: string, password: string) => void;
  title?: string;
};

export default function Login({ onSubmit, title = 'Login' }: Props) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = () => {
    onSubmit(email.trim(), password);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{title}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Wachtwoord"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button title="Login" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    gap: 12,
  },
  header: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
  },
});
