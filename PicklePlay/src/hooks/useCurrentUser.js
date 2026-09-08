import { useStore } from '../store';

export function useCurrentUser() {
  return useStore((s) => (s.currentUserId ? s.users.find((u) => u.id === s.currentUserId) : null));
}

export function useCurrentRating() {
  const userId = useStore((s) => s.currentUserId);
  return useStore((s) => s.ratings.find((r) => r.userId === userId));
}

export function useCurrentPerformance() {
  const userId = useStore((s) => s.currentUserId);
  return useStore((s) => s.performance.find((p) => p.userId === userId));
}
