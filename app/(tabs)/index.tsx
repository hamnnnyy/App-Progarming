import { useFeedStore } from '@/store/feed-store';
import ContentContainer from '@components/container';
import { FeedList } from '@components/feed/FeedList';
import NavigationTop from '@components/navigation/NavigationTop';
import { ThemedView } from '@components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function HomeScreen() {
    const { posts, loading, fetchFeed: _fetchFeed, loadMore } = useFeedStore();

    // TODO: (4.5차) 화면이 처음 마운트될 때 fetchFeed()를 호출한다
    useEffect(() => {
        _fetchFeed();
    }, [_fetchFeed]);

    return (
        <ThemedView style={{ flex: 1 }}>
            <ContentContainer isTopElement={true}>
                <NavigationTop
                    title='MyFeed'
                    icon={'layers'}
                    rightButtons={
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 15,
                            }}
                        >
                            <Ionicons
                                name='add-outline'
                                size={24}
                                color='#262626'
                            />
                        </View>
                    }
                />
            </ContentContainer>

            {loading && posts.length === 0 ? (
                <ActivityIndicator style={{ flex: 1 }} />
            ) : (
                <FeedList posts={posts} onEndReached={loadMore} />
            )}
        </ThemedView>
    );
}
