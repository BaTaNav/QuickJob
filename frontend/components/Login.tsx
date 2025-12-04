import React from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';

type Props = {
  onSubmit: (email: string, password: string) => void;
  title?: string;
};

export default function Login({ onSubmit, title = 'Login' }: Props) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{title}</Text>
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
});