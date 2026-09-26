import type { ChatDiscovery } from '@/types/chat';

// Only carry discovery filters, never a source-page identity or tenant ID.
export function chatDiscoveryUrl(
    path: string,
    discovery: Pick<ChatDiscovery, 'surface' | 'filters'>,
    page?: string | null,
): string {
    const params = new URLSearchParams();
    if (path.startsWith('/chats/')) params.set('surface', discovery.surface);
    if (discovery.filters.view === 'unread') params.set('view', 'unread');
    if (discovery.filters.query) params.set('query', discovery.filters.query);
    if (discovery.filters.app) params.set('app', discovery.filters.app);
    if (page && /^[1-9]\d*$/.test(page)) params.set('page', page);
    const query = params.toString();
    return query ? `${path}?${query}` : path;
}
