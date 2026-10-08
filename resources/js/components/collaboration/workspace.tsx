import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import {
    CollaborationClient,
    freshDraft,
    messagePath,
    type AttentionPage,
    type Chat,
    type Draft,
    type Message,
    type MessagePage,
    type Notice,
    type Person,
    type Source,
} from './client';
import './workspace.css';

type WorkspaceState = {
    client: CollaborationClient;
    revision: number;
    refresh: () => void;
    attention: AttentionPage | null;
    status: string;
};
const Context = createContext<WorkspaceState | null>(null);
export function useCollaboration(): WorkspaceState {
    const value = useContext(Context);
    if (!value) throw new Error('Collaboration provider is missing.');
    return value;
}

export function CollaborationProvider({
    client,
    userId,
    organizationId,
    children,
    backgroundCheck,
}: {
    client: CollaborationClient;
    userId: number;
    organizationId: number;
    children: ReactNode;
    backgroundCheck?: () => void;
}) {
    const [revision, setRevision] = useState(0);
    const [attention, setAttention] = useState<AttentionPage | null>(null);
    const [status, setStatus] = useState('Connecting');
    const [expired, setExpired] = useState(false);
    const refresh = () => setRevision((value) => value + 1);
    useEffect(() => {
        if (expired) return;
        client.onAuthLost = () => {
            setAttention(null);
            setExpired(true);
        };
        let active = true;
        let busy = false;
        let timer: ReturnType<typeof setTimeout>;
        const check = async () => {
            if (busy || !active) return;
            busy = true;
            try {
                const result =
                    await client.request<AttentionPage>('/notifications');
                if (!active) return;
                setAttention(result);
                if (backgroundCheck) backgroundCheck();
                else if (
                    result.enabled &&
                    'Notification' in window &&
                    Notification.permission === 'granted'
                ) {
                    for (const id of result.desktop_candidates) {
                        if (!active) break;
                        const claimed = await client.mutate<{
                            data: Notice | null;
                        }>(`/notifications/${id}/claim`, {});
                        if (!claimed.data || !active) continue;
                        const notice = claimed.data;
                        // Generic previews never expose customer names, page URLs or message text.
                        const toast = new Notification(notice.title, {
                            body: notice.body,
                            tag: `sidewire-${notice.id}`,
                        });
                        toast.onclick = () => {
                            window.focus();
                            window.location.assign(notice.path);
                            toast.close();
                        };
                        await client.mutate(`/notifications/${id}/delivered`, {
                            claim: notice.claim,
                        });
                    }
                }
            } catch {
                if (active) setStatus('Connection interrupted · retrying');
            } finally {
                busy = false;
            }
        };
        const changed = () => {
            if (!active) return;
            refresh();
            clearTimeout(timer);
            timer = setTimeout(() => {
                void check();
            }, 900);
        };
        const disconnect = client.connect(
            userId,
            organizationId,
            changed,
            setStatus,
        );
        const interval = setInterval(changed, 30000);
        const focused = () => {
            if (document.visibilityState === 'visible') changed();
        };
        client.events.addEventListener('changed', changed);
        document.addEventListener('visibilitychange', focused);
        window.addEventListener('online', changed);
        window.addEventListener('focus', focused);
        void check();
        return () => {
            active = false;
            clearInterval(interval);
            clearTimeout(timer);
            disconnect();
            client.events.removeEventListener('changed', changed);
            document.removeEventListener('visibilitychange', focused);
            window.removeEventListener('online', changed);
            window.removeEventListener('focus', focused);
            client.onAuthLost = () => {};
        };
    }, [client, userId, organizationId, backgroundCheck, expired]);
    if (expired)
        return (
            <section className="sw-collaboration">
                <h2>Your session has ended</h2>
                <p>
                    Private content has been cleared. Sign in or reconnect the
                    extension to continue.
                </p>
                <a
                    href={`${client.origin}/login`}
                    target={client.token ? '_blank' : undefined}
                    rel="noreferrer"
                >
                    Sign in to SideWire
                </a>
            </section>
        );
    return (
        <Context.Provider
            value={{ client, revision, refresh, attention, status }}
        >
            {children}
        </Context.Provider>
    );
}

export function NotificationControls({
    enableExtension,
    testExtension,
}: {
    enableExtension?: () => Promise<boolean>;
    testExtension?: () => Promise<void>;
}) {
    const { client, attention, refresh, status } = useCollaboration();
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    async function enable() {
        setBusy(true);
        setMessage('');
        try {
            const allowed = enableExtension
                ? await enableExtension()
                : 'Notification' in window &&
                  window.isSecureContext &&
                  (await Notification.requestPermission()) === 'granted';
            if (!allowed) {
                setMessage(
                    'Notifications are blocked or unsupported. Allow them in browser settings; web notifications require HTTPS.',
                );
                return;
            }
            await client.mutate(
                '/notifications/settings',
                { enabled: true },
                'PUT',
            );
            client.events.dispatchEvent(new Event('changed'));
            refresh();
            setMessage(
                'Enabled. Browser and operating-system notification settings still apply.',
            );
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'Could not enable notifications.',
            );
        } finally {
            setBusy(false);
        }
    }
    async function pause() {
        setBusy(true);
        try {
            await client.mutate(
                '/notifications/settings',
                { enabled: false },
                'PUT',
            );
            client.events.dispatchEvent(new Event('changed'));
            setMessage('Desktop alerts paused. Activity is still available.');
        } catch {
            setMessage('Could not pause notifications. Retry when connected.');
        } finally {
            setBusy(false);
        }
    }
    async function test() {
        try {
            if (testExtension) await testExtension();
            else if (
                'Notification' in window &&
                Notification.permission === 'granted'
            )
                new Notification('SideWire test', {
                    body: 'Desktop notifications are enabled on this browser.',
                });
            else throw new Error('Enable browser notifications first.');
            setMessage(
                'Test requested. Check your system notification center and Do Not Disturb settings if nothing appeared.',
            );
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'Test notification failed.',
            );
        }
    }
    return (
        <div className="sw-collaboration sw-notification-controls">
            <details>
                <summary>
                    Notifications{' '}
                    {attention?.unread_count
                        ? `(${attention.unread_count} unread)`
                        : ''}
                </summary>
                <p>{status}</p>
                <p>
                    {client.token
                        ? 'With extension alerts enabled, Chrome checks for new mentions, DMs and thread replies even when this panel is closed. Background checks run about once a minute.'
                        : 'Keep a SideWire tab open for web alerts. For alerts with the tab and panel closed, enable them in the Chrome extension.'}
                </p>
                <div className="sw-actions">
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                            void enable();
                        }}
                    >
                        Enable on this browser
                    </button>
                    <button
                        type="button"
                        disabled={busy || !attention?.enabled}
                        onClick={() => {
                            void pause();
                        }}
                    >
                        Pause desktop alerts
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            void test();
                        }}
                    >
                        Send test notification
                    </button>
                </div>
                {message && <p role="status">{message}</p>}
            </details>
        </div>
    );
}

export function CollaborationBoard({
    initialChat,
    initialThread,
    initialMessage,
}: {
    initialChat?: string | null;
    initialThread?: string | null;
    initialMessage?: string | null;
}) {
    const { client, revision, attention } = useCollaboration();
    const [selection, setSelection] = useState({
        chat: initialChat ?? null,
        thread: initialThread ?? null,
        message: initialMessage ?? null,
    });
    const [tab, setTab] = useState<'chats' | 'direct' | 'activity'>('chats');
    const [chats, setChats] = useState<Chat[]>([]);
    const [query, setQuery] = useState('');
    const [members, setMembers] = useState<Person[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [nextPage, setNextPage] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [activity, setActivity] = useState<AttentionPage | null>(null);
    const [dmBusy, setDmBusy] = useState(false);
    useEffect(() => {
        const abort = new AbortController();
        setLoading(true);
        setError('');
        const load = async () => {
            try {
                if (tab === 'activity') {
                    const result = await client.request<AttentionPage>(
                        `/notifications?page=${page}`,
                        { signal: abort.signal },
                    );
                    setActivity(result);
                    setNextPage(result.next_page);
                } else {
                    const result = await client.request<{
                        data: Chat[];
                        next_page: number | null;
                    }>(
                        `/chats?kind=${tab === 'direct' ? 'direct' : 'page'}&page=${page}`,
                        { signal: abort.signal },
                    );
                    setChats(result.data);
                    setNextPage(result.next_page);
                }
            } catch (failure) {
                if (!abort.signal.aborted)
                    setError(
                        failure instanceof Error
                            ? failure.message
                            : 'Could not load conversations.',
                    );
            } finally {
                if (!abort.signal.aborted) setLoading(false);
            }
        };
        void load();
        return () => abort.abort();
    }, [client, tab, page, revision, attention?.unread_count]);
    useEffect(() => {
        const abort = new AbortController();
        if (tab !== 'direct') return;
        const timer = setTimeout(() => {
            void client
                .request<{ data: Person[] }>(
                    `/members?query=${encodeURIComponent(query)}`,
                    { signal: abort.signal },
                )
                .then((result) => setMembers(result.data))
                .catch(() => {});
        }, 200);
        return () => {
            abort.abort();
            clearTimeout(timer);
        };
    }, [client, query, tab]);
    function select(
        chat: string,
        thread: string | null = null,
        message: string | null = null,
    ) {
        setSelection({ chat, thread, message });
    }
    async function start(person: Person) {
        setDmBusy(true);
        setError('');
        try {
            const result = await client.mutate<{ data: Chat }>('/direct', {
                recipient_id: person.id,
            });
            select(result.data.id);
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : 'Could not open this DM.',
            );
        } finally {
            setDmBusy(false);
        }
    }
    return (
        <div
            className="sw-collaboration sw-board"
            data-selected={Boolean(selection.chat)}
        >
            <aside className="sw-conversation-list">
                <nav className="sw-actions" aria-label="Communication views">
                    {(['chats', 'direct', 'activity'] as const).map((value) => (
                        <button
                            type="button"
                            key={value}
                            aria-pressed={tab === value}
                            onClick={() => {
                                setTab(value);
                                setPage(1);
                                setSelection({
                                    chat: null,
                                    thread: null,
                                    message: null,
                                });
                            }}
                        >
                            {value === 'direct'
                                ? 'Direct messages'
                                : value === 'activity'
                                  ? `Activity${attention?.unread_count ? ` (${attention.unread_count})` : ''}`
                                  : 'Chats'}
                        </button>
                    ))}
                </nav>
                {tab === 'direct' && (
                    <details>
                        <summary>New direct message</summary>
                        <label>
                            Find a coworker
                            <input
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                                placeholder="Search by name"
                            />
                        </label>
                        <div className="sw-person-options">
                            {members.map((person) => (
                                <button
                                    key={person.id}
                                    type="button"
                                    disabled={dmBusy}
                                    onClick={() => {
                                        void start(person);
                                    }}
                                >
                                    {person.name}
                                </button>
                            ))}
                        </div>
                    </details>
                )}
                {error && <p role="alert">{error}</p>}
                {loading && <p role="status">Loading…</p>}
                {tab === 'activity' ? (
                    <div>
                        {activity?.data.map((item) => (
                            <button
                                className="sw-conversation-row"
                                key={item.id}
                                type="button"
                                onClick={() =>
                                    select(
                                        item.chat_id,
                                        item.thread_id,
                                        item.message_id,
                                    )
                                }
                            >
                                <strong>{item.author}</strong>
                                <span>
                                    {item.reason === 'mention'
                                        ? 'Mentioned you'
                                        : item.reason === 'thread'
                                          ? 'Replied in your thread'
                                          : 'Direct message'}
                                </span>
                                <span>{item.body}</span>
                            </button>
                        ))}
                        {!loading && !activity?.data.length && (
                            <p>You’re caught up.</p>
                        )}
                    </div>
                ) : (
                    <div>
                        {chats.map((chat) => (
                            <button
                                className="sw-conversation-row"
                                key={chat.id}
                                type="button"
                                aria-current={
                                    selection.chat === chat.id
                                        ? 'page'
                                        : undefined
                                }
                                onClick={() => select(chat.id)}
                            >
                                <strong>{chat.title}</strong>
                                {chat.unread_attention > 0 && (
                                    <span>
                                        {chat.unread_attention} unread mentions
                                        or replies
                                    </span>
                                )}
                            </button>
                        ))}
                        {!loading && !chats.length && (
                            <p>
                                {tab === 'direct'
                                    ? 'Choose a coworker to start a private conversation.'
                                    : 'Create a work chat from Chats or link a page in the extension.'}
                            </p>
                        )}
                    </div>
                )}
                <div className="sw-actions">
                    {page > 1 && (
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => setPage(page - 1)}
                        >
                            Previous
                        </button>
                    )}
                    {nextPage && (
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => setPage(nextPage)}
                        >
                            Next
                        </button>
                    )}
                </div>
            </aside>
            <div className="sw-conversation-detail">
                {selection.chat ? (
                    <>
                        <button
                            className="sw-back-list"
                            type="button"
                            onClick={() =>
                                setSelection({
                                    chat: null,
                                    thread: null,
                                    message: null,
                                })
                            }
                        >
                            Back to conversations
                        </button>
                        <ConversationView
                            key={`${selection.chat}:${selection.thread ?? ''}:${selection.message ?? ''}`}
                            chatId={selection.chat}
                            initialThread={selection.thread}
                            initialMessage={selection.message}
                        />
                    </>
                ) : (
                    <div className="sw-conversation-placeholder">
                        <h2>Your team, in one conversation</h2>
                        <p>
                            Open a chat, start a direct message, or catch up on
                            mentions and replies.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export function ConversationView({
    chatId,
    source,
    initialThread,
    initialMessage,
}: {
    chatId: string;
    source?: Source | null;
    initialThread?: string | null;
    initialMessage?: string | null;
}) {
    const { client, revision } = useCollaboration();
    const [thread, setThread] = useState<string | null>(initialThread ?? null);
    const [target, setTarget] = useState<string | null>(initialMessage ?? null);
    const [data, setData] = useState<MessagePage | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [newActivity, setNewActivity] = useState(false);
    const [reload, setReload] = useState(0);
    const history = useRef<HTMLDivElement>(null);
    const loadedRevision = useRef(-1);
    const readIds = useRef(new Set<string>());
    const historyRequest = useRef<AbortController | null>(null);
    useEffect(() => () => historyRequest.current?.abort(), []);
    useEffect(() => {
        const abort = new AbortController();
        const container = history.current;
        if (
            loadedRevision.current >= 0 &&
            container &&
            !target &&
            container.scrollHeight -
                container.scrollTop -
                container.clientHeight >
                150
        ) {
            setNewActivity(true);
            return;
        }
        setLoading(true);
        setError('');
        const query = new URLSearchParams();
        if (thread) query.set('thread', thread);
        if (target) query.set('around', target);
        void client
            .request<MessagePage>(`/chats/${chatId}/messages?${query}`, {
                signal: abort.signal,
            })
            .then((result) => {
                if (abort.signal.aborted) return;
                setData(result);
                setNewActivity(false);
                loadedRevision.current = revision;
                requestAnimationFrame(() => {
                    if (target)
                        history.current
                            ?.querySelector<HTMLElement>(
                                `[data-message-id="${target}"]`,
                            )
                            ?.scrollIntoView({ block: 'center' });
                    else if (history.current)
                        history.current.scrollTop =
                            history.current.scrollHeight;
                });
            })
            .catch((failure: unknown) => {
                if (!abort.signal.aborted) {
                    setData(null);
                    setError(
                        failure instanceof Error
                            ? failure.message
                            : 'Could not load messages.',
                    );
                }
            })
            .finally(() => {
                if (!abort.signal.aborted) setLoading(false);
            });
        return () => abort.abort();
    }, [client, chatId, thread, target, revision, reload]);
    useEffect(() => {
        const container = history.current;
        if (!container || !data) return;
        let busy = false;
        let active = true;
        const visible = new Set<string>();
        const flush = async () => {
            if (
                !active ||
                busy ||
                document.visibilityState !== 'visible' ||
                !document.hasFocus()
            )
                return;
            const ids = [...visible]
                .filter((id) => !readIds.current.has(id))
                .slice(0, 100);
            if (!ids.length) return;
            busy = true;
            try {
                await client.mutate(`/chats/${chatId}/read`, { messages: ids });
                ids.forEach((id) => readIds.current.add(id));
                client.events.dispatchEvent(new Event('changed'));
            } catch {
                /* Remain unread and retry while actually visible. */
            } finally {
                busy = false;
            }
        };
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const id = (entry.target as HTMLElement).dataset.messageId;
                    if (id) {
                        if (entry.isIntersecting) visible.add(id);
                        else visible.delete(id);
                    }
                }
            },
            { root: container, threshold: 0.25 },
        );
        container
            .querySelectorAll('[data-message-id]')
            .forEach((item) => observer.observe(item));
        const interval = setInterval(() => {
            void flush();
        }, 800);
        return () => {
            active = false;
            clearInterval(interval);
            observer.disconnect();
        };
    }, [data, client, chatId]);
    function openThread(id: string | null) {
        historyRequest.current?.abort();
        loadedRevision.current = -1;
        setData(null);
        setThread(id);
        setTarget(null);
    }
    async function older() {
        if (!data?.older_cursor || loading) return;
        setLoading(true);
        setError('');
        const query = new URLSearchParams({ before: data.older_cursor });
        if (thread) query.set('thread', thread);
        historyRequest.current?.abort();
        const abort = new AbortController();
        historyRequest.current = abort;
        const previousHeight = history.current?.scrollHeight ?? 0;
        try {
            const result = await client.request<MessagePage>(
                `/chats/${chatId}/messages?${query}`,
                { signal: abort.signal },
            );
            if (abort.signal.aborted) return;
            setData((current) =>
                current
                    ? {
                          ...current,
                          data: [
                              ...result.data,
                              ...current.data.filter(
                                  (item) =>
                                      !result.data.some(
                                          (olderItem) =>
                                              olderItem.id === item.id,
                                      ),
                              ),
                          ],
                          older_cursor: result.older_cursor,
                      }
                    : result,
            );
            requestAnimationFrame(() => {
                if (history.current)
                    history.current.scrollTop +=
                        history.current.scrollHeight - previousHeight;
            });
        } catch (failure) {
            if (abort.signal.aborted) return;
            setError(
                failure instanceof Error
                    ? failure.message
                    : 'Could not load earlier messages.',
            );
        } finally {
            if (!abort.signal.aborted) setLoading(false);
        }
    }
    function latest() {
        historyRequest.current?.abort();
        loadedRevision.current = -1;
        setTarget(null);
        setReload((value) => value + 1);
    }
    function renderMessage(item: Message, isRoot = false) {
        return (
            <article
                key={item.id}
                data-message-id={item.id}
                className={`sw-collaboration-message${target === item.id ? ' sw-message-target' : ''}`}
            >
                <header>
                    <strong>{item.author.name}</strong>
                    <time dateTime={item.created_at}>
                        {new Date(item.created_at).toLocaleString()}
                    </time>
                </header>
                <p>{item.body}</p>
                {item.mentions.length > 0 && (
                    <div className="sw-mentions">
                        {item.mentions.map((person) => (
                            <span key={person.id}>@{person.name}</span>
                        ))}
                    </div>
                )}
                {item.source && (
                    <a
                        href={item.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        From {item.source.host}
                    </a>
                )}
                <footer>
                    {!thread && !isRoot && (
                        <button
                            type="button"
                            onClick={() => openThread(item.id)}
                        >
                            {item.reply_count
                                ? `${item.reply_count} replies`
                                : 'Reply in thread'}
                        </button>
                    )}
                    <a
                        href={`${client.origin}${messagePath(chatId, item.thread_root_id, item.id)}`}
                        target={client.token ? '_blank' : undefined}
                        rel="noreferrer"
                    >
                        Message link
                    </a>
                </footer>
            </article>
        );
    }
    return (
        <section className="sw-collaboration sw-conversation">
            <header className="sw-conversation-heading">
                <div>
                    <h2>
                        {thread
                            ? 'Thread'
                            : (data?.chat.title ?? 'Conversation')}
                    </h2>
                    <p>
                        {data?.chat.type === 'direct'
                            ? 'Private · two participants'
                            : 'Shared with your organization'}
                    </p>
                </div>
                <div className="sw-actions">
                    {thread && (
                        <button type="button" onClick={() => openThread(null)}>
                            Back to chat
                        </button>
                    )}
                    <button type="button" disabled={loading} onClick={latest}>
                        Refresh
                    </button>
                </div>
            </header>
            {newActivity && (
                <button type="button" onClick={latest}>
                    New activity — show latest messages
                </button>
            )}
            {target && (
                <button type="button" onClick={latest}>
                    Jump to latest
                </button>
            )}
            {error && <p role="alert">{error}</p>}
            <div
                className="sw-collaboration-history"
                ref={history}
                tabIndex={0}
                role="region"
                aria-label={thread ? 'Thread replies' : 'Conversation messages'}
            >
                {data?.root && renderMessage(data.root, true)}
                {data?.older_cursor && (
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => {
                            void older();
                        }}
                    >
                        Load earlier {thread ? 'replies' : 'messages'}
                    </button>
                )}
                {loading && <p role="status">Loading…</p>}
                {data?.data.map((item) => renderMessage(item))}
                {data && !data.data.length && (
                    <p>
                        {thread
                            ? 'No replies yet.'
                            : 'No messages yet. Start the conversation.'}
                    </p>
                )}
            </div>
            {data?.chat.can_send ? (
                <Composer
                    key={`${chatId}:${thread ?? ''}`}
                    chatId={chatId}
                    thread={thread}
                    source={source ?? null}
                    onSent={latest}
                />
            ) : (
                data && (
                    <p>
                        This conversation is read-only. A participant may no
                        longer be active.
                    </p>
                )
            )}
        </section>
    );
}

function Composer({
    chatId,
    thread,
    source,
    onSent,
}: {
    chatId: string;
    thread: string | null;
    source: Source | null;
    onSent: () => void;
}) {
    const { client } = useCollaboration();
    const draftId = `${chatId}:${thread ?? 'main'}`;
    const [draft, setDraft] = useState<Draft>(
        () => client.drafts.get(draftId) ?? freshDraft(),
    );
    const [suggestions, setSuggestions] = useState<Person[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [attempted, setAttempted] = useState(Boolean(draft.attempted));
    const input = useRef<HTMLTextAreaElement>(null);
    const mentionQuery = draft.body.match(/(?:^|\s)@([^@\n]{0,60})$/)?.[1];
    function update(next: Draft) {
        client.drafts.set(draftId, next);
        setDraft(next);
    }
    useEffect(() => {
        const abort = new AbortController();
        if (mentionQuery === undefined || attempted) {
            setSuggestions([]);
            return;
        }
        const timer = setTimeout(() => {
            void client
                .request<{ data: Person[] }>(
                    `/members?chat=${chatId}&query=${encodeURIComponent(mentionQuery)}`,
                    { signal: abort.signal },
                )
                .then((result) => setSuggestions(result.data))
                .catch(() => setSuggestions([]));
        }, 180);
        return () => {
            abort.abort();
            clearTimeout(timer);
        };
    }, [client, chatId, mentionQuery, attempted]);
    function mention(person: Person) {
        const body = draft.body.replace(/@[^@\n]*$/, `@${person.name} `);
        update({
            ...draft,
            body,
            mentions: [
                ...draft.mentions.filter((item) => item.id !== person.id),
                person,
            ],
        });
        setSuggestions([]);
        input.current?.focus();
    }
    async function send() {
        if (busy || !draft.body.trim()) return;
        setBusy(true);
        update({ ...draft, attempted: true });
        setAttempted(true);
        setError('');
        try {
            await client.mutate(`/chats/${chatId}/messages`, {
                body: draft.body,
                idempotency_key: draft.key,
                thread_root_id: thread,
                mentions: draft.mentions.map((person) => person.id),
                source_context_id: draft.source?.id ?? null,
                source_version: draft.source?.version ?? null,
            });
            update(freshDraft());
            setAttempted(false);
            onSent();
            client.events.dispatchEvent(new Event('changed'));
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : 'Message could not be sent. Retry the same draft.',
            );
        } finally {
            setBusy(false);
        }
    }
    return (
        <form
            className="sw-composer"
            onSubmit={(event) => {
                event.preventDefault();
                void send();
            }}
        >
            <label>
                {thread ? 'Reply to this thread' : 'Message'}
                <textarea
                    ref={input}
                    value={draft.body}
                    maxLength={10000}
                    rows={3}
                    disabled={busy || attempted}
                    placeholder="Write a message. Type @ to mention a coworker."
                    onChange={(event) => {
                        const body = event.target.value;
                        update({
                            ...draft,
                            body,
                            source: draft.body ? draft.source : source,
                            mentions: draft.mentions.filter((person) =>
                                body.includes(`@${person.name}`),
                            ),
                        });
                    }}
                    onKeyDown={(event) => {
                        if (
                            (event.ctrlKey || event.metaKey) &&
                            event.key === 'Enter' &&
                            !event.nativeEvent.isComposing
                        ) {
                            event.preventDefault();
                            void send();
                        }
                    }}
                />
            </label>
            {suggestions.length > 0 && (
                <div
                    className="sw-person-options"
                    aria-label="Mention suggestions"
                >
                    {suggestions.map((person) => (
                        <button
                            type="button"
                            key={person.id}
                            onClick={() => mention(person)}
                        >
                            @{person.name}
                        </button>
                    ))}
                </div>
            )}
            {draft.mentions.length > 0 && (
                <div className="sw-mentions" aria-label="People to notify">
                    {draft.mentions.map((person) => (
                        <button
                            key={person.id}
                            type="button"
                            disabled={busy || attempted}
                            onClick={() =>
                                update({
                                    ...draft,
                                    mentions: draft.mentions.filter(
                                        (item) => item.id !== person.id,
                                    ),
                                })
                            }
                        >
                            @{person.name} · remove
                        </button>
                    ))}
                </div>
            )}
            {draft.source && (
                <p>
                    Sending from {draft.source.title} ({draft.source.host}).
                    This source stays with your draft.
                </p>
            )}
            {error && <p role="alert">{error}</p>}
            <div className="sw-actions">
                <button type="submit" disabled={busy || !draft.body.trim()}>
                    {busy
                        ? 'Sending…'
                        : attempted
                          ? 'Retry same message'
                          : thread
                            ? 'Send reply'
                            : 'Send'}
                </button>
                {attempted && !busy && (
                    <button
                        type="button"
                        onClick={() => {
                            if (
                                window.confirm(
                                    'The previous send may have reached the server. Check the conversation before starting a new message. Discard this pending draft?',
                                )
                            ) {
                                update(freshDraft());
                                setAttempted(false);
                                setError('');
                                onSent();
                            }
                        }}
                    >
                        Discard pending draft
                    </button>
                )}
                <small>Ctrl/⌘ + Enter to send</small>
            </div>
        </form>
    );
}
