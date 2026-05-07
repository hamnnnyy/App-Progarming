import React, { Component } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

function DefaultFallback({ error }: { error: Error | null }) {
    const code = error?.message?.slice(0, 24) ?? 'UNKNOWN';
    return (
        <View style={styles.container}>
            <Text style={styles.title}>문제가 발생했습니다</Text>
            <Text style={styles.code}>{code}</Text>
        </View>
    );
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, info);
        this.props.onError?.(error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback ?? (
                    <DefaultFallback error={this.state.error} />
                )
            );
        }
        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
    code: {
        fontSize: 12,
        color: '#888',
        fontFamily: 'monospace',
    },
});
