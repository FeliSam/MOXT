import * as Sentry from '@sentry/react-native';
import { Component, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { reportError } from '@/services/monitoring';

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class SentryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportError(error, {
      componentStack: info.componentStack || 'unknown',
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Une erreur est survenue</Text>
          <Text style={styles.message}>{this.state.error?.message || 'Erreur inconnue'}</Text>
          <Pressable style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Réessayer</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#f8fafc' },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  button: { backgroundColor: '#1d4ed8', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
