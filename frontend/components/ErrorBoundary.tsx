import React, { ReactNode, ReactElement } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const THEME_GREEN = '#176B51';
const THEME_GREEN_DARK = '#135742';
const THEME_GREEN_LIGHT = '#e8f5e9';
const TEXT_PRIMARY = '#1a1a1a';
const TEXT_SECONDARY = '#666666';
const TEXT_TERTIARY = '#999999';
const BG_LIGHT = '#f5f5f5';
const ERROR_COLOR = '#d32f2f';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
  },
  contentBox: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME_GREEN_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: TEXT_SECONDARY,
    marginBottom: 32,
    lineHeight: 24,
    textAlign: 'center',
  },
  errorDetailsContainer: {
    width: '100%',
    marginBottom: 24,
    padding: 16,
    backgroundColor: BG_LIGHT,
    borderRadius: 8,
  },
  errorDetailsLabel: {
    color: TEXT_SECONDARY,
    fontWeight: '500',
    marginBottom: 8,
    fontSize: 14,
  },
  errorDetailsText: {
    fontSize: 12,
    color: ERROR_COLOR,
    fontFamily: 'monospace',
  },
  retryButton: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: THEME_GREEN,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonPressed: {
    backgroundColor: THEME_GREEN_DARK,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  helpText: {
    fontSize: 14,
    color: TEXT_TERTIARY,
    marginTop: 20,
    textAlign: 'center',
  },
});

/**
 * ErrorBoundary Component
 * Catches errors in child components and displays a clean error UI
 * Features green theme (#176B51) matching the app design
 * React Native implementation for mobile and cross-platform support
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Error Info:', errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactElement {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <View style={styles.container}>
          <View style={styles.contentBox}>
            {/* Error Icon Container */}
            <View style={styles.iconContainer}>
              <Text style={{ fontSize: 44, color: THEME_GREEN }}>⚠️</Text>
            </View>

            {/* Error Title */}
            <Text style={styles.title}>Something went wrong</Text>

            {/* Error Description */}
            <Text style={styles.description}>
              We encountered an unexpected error. Please try again or contact support if the problem persists.
            </Text>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <View style={styles.errorDetailsContainer}>
                <Text style={styles.errorDetailsLabel}>Error Details</Text>
                <Text style={styles.errorDetailsText} numberOfLines={10}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}

            {/* Retry Button */}
            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleRetry}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>

            {/* Help Text */}
            <Text style={styles.helpText}>
              If this continues, please reach out to our support team.
            </Text>
          </View>
        </View>
      );
    }

    return <>{this.props.children}</>;
  }
}

export default ErrorBoundary;
