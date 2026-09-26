export type LinkedPage = {
    id: string;
    title: string;
    host: string;
    url: string;
};

export type ChatSummary = {
    id: string;
    title: string;
    web_url: string;
    message_count: number;
    unread_count: number;
    linked_pages: LinkedPage[];
    latest_message: {
        id: string;
        body: string;
        created_at: string;
        author: { id: number; name: string };
        source: LinkedPage | null;
    } | null;
};

export type ChatDiscovery = {
    surface: 'activity' | 'chats';
    filters: { view: 'all' | 'unread'; query: string; app: string };
    apps: Array<{ id: string; label: string }>;
    chats: {
        items: ChatSummary[];
        total: number;
        previousPageUrl: string | null;
        nextPageUrl: string | null;
    };
};

export type Chat = {
    id: string;
    title: string;
    linkedPages: LinkedPage[];
    messages: Array<{
        id: string;
        body: string;
        createdAt: string;
        author: { id: number; name: string };
        source: Omit<LinkedPage, 'id'> | null;
    }>;
};
