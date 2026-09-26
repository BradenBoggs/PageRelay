import { createContext, useContext, useState, type ReactNode } from 'react';

type Draft = { body: string; idempotency_key: string };
type Cache = { drafts: Map<string, Draft>; scroll: Map<string, number> };
const ChatUiContext = createContext<Cache | null>(null);

// Session-only UI state. The layout keys this provider by member and organization;
// drafts never cross that boundary or get written to localStorage.
export function ChatUiCache({ children }: { children: ReactNode }) {
    const [cache] = useState<Cache>(() => ({
        drafts: new Map(),
        scroll: new Map(),
    }));
    return (
        <ChatUiContext.Provider value={cache}>
            {children}
        </ChatUiContext.Provider>
    );
}

export function useChatUiCache(): Cache {
    const cache = useContext(ChatUiContext);
    if (!cache) throw new Error('Chat UI requires the application shell.');
    return cache;
}
