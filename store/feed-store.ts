import { getFeed, likePost, unlikePost } from '@/api/content';
import { Post } from '@type/Post';
import { create } from 'zustand';

interface FeedState {
    posts: Post[];
    page: number;
    hasNext: boolean;
    loading: boolean;
    error: string | null;

    fetchFeed: () => Promise<void>;
    loadMore: () => Promise<void>;
    toggleLike: (postId: string) => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
    posts: [],
    page: 1,
    hasNext: false,
    loading: false,
    error: null,

    fetchFeed: async () => {
        // TODO: (4차) set()으로 loading을 켜고, getFeed(1)를 호출해 posts/pagination을 저장한다
        // 힌트: try/catch로 감싸고 실패 시 error 메시지도 저장한다
        set({ loading: true, error: null });
        try {
            const { data, pagination } = await getFeed(1);
            set({
                posts: data,
                page: pagination.page,
                hasNext: pagination.hasNext,
                loading: false,
            });
        } catch (error) {
            set({
                loading: false,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    },

    loadMore: async () => {
        const { loading, hasNext, page, posts } = get();
        if (loading || !hasNext) return;

        set({ loading: true });
        try {
            const nextPage = page + 1;
            const { data, pagination } = await getFeed(nextPage);
            set({
                posts: [...posts, ...data],
                page: nextPage,
                hasNext: pagination.hasNext,
                loading: false,
            });
        } catch {
            set({ loading: false });
        }
    },

    // 낙관적 업데이트: UI를 먼저 바꾸고 API 호출 → 실패 시 원상복구
    toggleLike: async (postId: string) => {
        const { posts } = get();
        const target = posts.find(p => p.id === postId);
        if (!target) return;

        // TODO: (5차) 낙관적 업데이트를 구현한다
        // 순서: ① UI 즉시 반영 → ② API 호출 → ③ 서버 응답으로 동기화 → ④ 실패 시 롤백
        // 힌트: 롤백할 때 posts 대신 get().posts를 써야 하는 이유를 생각해보자
        const optimisticPosts = posts.map(p =>
            p.id === postId
                ? {
                      ...p,
                      liked: !p.liked,
                      likes: p.liked ? p.likes - 1 : p.likes + 1,
                  }
                : p,
        );
        set({ posts: optimisticPosts });
        try {
            const apiFn = target.liked ? unlikePost : likePost;
            const { likes, liked } = await apiFn(postId);
            set({
                posts: posts.map(p =>
                    p.id === postId ? { ...p, likes, liked } : p,
                ),
            });
        } catch {
            set({ posts });
        }
    },
}));
