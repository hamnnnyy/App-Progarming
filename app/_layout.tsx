import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@components/themed-text';
import { StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/auth-store';
import { usePushRegistration } from '@/hooks/use-push-registration';
import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import { ErrorBoundary } from '@components/ErrorBoundary';

Sentry.init({
    dsn: 'https://b93272c23b3e6915ce023b344638e985@o4511346854854656.ingest.us.sentry.io/4511346855116800',

    // Adds more context data to events (IP address, cookies, user, etc.)
    // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
    sendDefaultPii: true,

    // Enable Logs
    enableLogs: true,

    // Configure Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [
        Sentry.mobileReplayIntegration(),
        Sentry.feedbackIntegration(),
    ],

    // uncomment the line below to enable Spotlight (https://spotlightjs.com)
    // spotlight: __DEV__,
});

// TODO 실습 5-1
// setNotificationHandler로 Foreground 배너를 활성화하세요
// shouldShowAlert, shouldPlaySound 옵션 값을 채워보세요
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: false, // TODO: 배너 표시 여부
        shouldPlaySound: false, // TODO: 소리 재생 여부
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: false,
    }),
});

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
    anchor: '(tabs)',
};

const AUTH_ROUTES = new Set(['login', 'signup']);

function AuthGuard() {
    const { status } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    usePushRegistration();

    useEffect(() => {
        // TODO 실습 7-1
        // addNotificationReceivedListener로 Foreground 수신 이벤트 구독
        // TODO 실습 7-2
        // addNotificationResponseReceivedListener로 알림 탭 이벤트 구독
        // TODO 실습 7-3
        // getLastNotificationResponseAsync로 Killed 상태 진입 데이터 확인
        // TODO 실습 7-4 (return)
        // 리스너 클린업 — sub.remove() 호출
    }, []);

    useEffect(() => {
        if (status === 'checking') return;

        const currentRoute = segments[0] as string | undefined;
        const inAuthRoute = AUTH_ROUTES.has(currentRoute ?? '');

        if (status === 'guest' && !inAuthRoute) {
            router.replace('/login' as never);
        } else if (status === 'authenticated' && inAuthRoute) {
            router.replace('/(tabs)');
        }
    }, [status, segments]);

    return null;
}

export default Sentry.wrap(function RootLayout() {
    const colorScheme = useColorScheme();
    const { restoreSession } = useAuthStore();
    const [loaded] = useFonts({
        'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.otf'),
        'Pretendard-Medium': require('../assets/fonts/Pretendard-Medium.otf'),
        'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.otf'),
        'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.otf'),
        'Pretendard-ExtraBold': require('../assets/fonts/Pretendard-ExtraBold.otf'),
    });

    useEffect(() => {
        restoreSession();
    }, []);

    useEffect(() => {
        if (loaded) SplashScreen.hideAsync();
    }, [loaded]);

    if (!loaded) return null;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider
                value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
            >
                <ErrorBoundary
                    onError={err =>
                        console.error('[GlobalBoundary]', err.message)
                    }
                >
                    <AuthGuard />
                    <Stack>
                        <Stack.Screen
                            name='(tabs)'
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name='create'
                            options={{
                                headerShown: false,
                                animation: 'slide_from_right',
                            }}
                        />
                        <Stack.Screen
                            name='signup'
                            options={{
                                headerShown: true,
                                headerTitle: () => (
                                    <ThemedText style={styles.default}>
                                        회원가입
                                    </ThemedText>
                                ),
                                headerBackTitle: '뒤로',
                            }}
                        />
                        <Stack.Screen
                            name='login'
                            options={{
                                headerShown: true,
                                headerTitle: () => (
                                    <ThemedText style={styles.default}>
                                        로그인
                                    </ThemedText>
                                ),
                                headerBackTitle: '뒤로',
                            }}
                        />
                        <Stack.Screen
                            name='profile/[id]'
                            options={{
                                headerShown: true,
                                headerTitle: () => (
                                    <ThemedText style={styles.default}>
                                        사용자 프로필
                                    </ThemedText>
                                ),
                                headerBackTitle: '홈으로',
                            }}
                        />
                    </Stack>
                </ErrorBoundary>
                <StatusBar style='auto' />
            </ThemeProvider>
        </GestureHandlerRootView>
    );
});

const styles = StyleSheet.create({
    default: {
        fontSize: 19,
        fontFamily: 'Pretendard-Bold',
    },
});
