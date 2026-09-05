import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
    connect,
    disconnect,
    loadSession,
    type ExtensionSession,
} from '../auth/session';
import { Button } from '../components/ui/button';
import {
    createPageChat,
    linkPage,
    listDiscovery,
    listPageChats,
    markChatRead,
    PageChatApiError,
    refreshPage,
    resolvePage,
    sendPageMessage,
    unlinkPage,
    type PageChat,
    type PageContext,
    type DiscoveryItem,
    type CreatePageChatInput,
} from '../page-chat/api';
import '../styles/app.css';

type Status =
    | 'loading'
    | 'signed-out'
    | 'connecting'
    | 'resolving'
    | 'unsupported'
    | 'ready'
    | 'error';
type Draft = { body: string; idempotencyKey: string };
type PanelView = 'page' | 'activity' | 'chats';
type CreateForm = CreatePageChatInput;

function SidePanel() {
    const [status, setStatus] = useState<Status>('loading');
    const [view, setView] = useState<PanelView>('page');
    const [session, setSession] = useState<ExtensionSession | null>(null);
    const [context, setContext] = useState<PageContext | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState<CreateForm | null>(null);
    const [drafts, setDrafts] = useState<Record<string, Draft>>({});
    const [linking, setLinking] = useState(false);
    const [unlinking, setUnlinking] = useState(false);
    const [candidates, setCandidates] = useState<PageChat[]>([]);
    const [selectedChat, setSelectedChat] = useState('');
    const [linkQuery, setLinkQuery] = useState('');
    const [linkBusy, setLinkBusy] = useState(false);
    const [discoveryItems, setDiscoveryItems] = useState<DiscoveryItem[]>([]);
    const [discoveryApps, setDiscoveryApps] = useState<
        Array<{ id: string; label: string }>
    >([]);
    const [discoveryView, setDiscoveryView] = useState<'all' | 'unread'>('all');
    const [discoveryApp, setDiscoveryApp] = useState('');
    const [discoveryQuery, setDiscoveryQuery] = useState('');
    const [appliedDiscoveryQuery, setAppliedDiscoveryQuery] = useState('');
    const [discoveryLoading, setDiscoveryLoading] = useState(false);
    const [discoveryMessage, setDiscoveryMessage] = useState<string | null>(
        null,
    );
    const [discoveryWebUrl, setDiscoveryWebUrl] = useState<string | null>(null);
    const [discoveryReload, setDiscoveryReload] = useState(0);
    const connection = useRef<AbortController | null>(null);
    const activeTabKey = useRef<string | null>(null);
    const panelWindowId = useRef<number | null>(null);
    const resolveSequence = useRef(0);
    const linkDialog = useRef<HTMLDialogElement | null>(null);
    const unlinkDialog = useRef<HTMLDialogElement | null>(null);
    const viewedMessage = useRef<string | null>(null);

    useEffect(() => {
        let mounted = true;

        void loadSession()
            .then(async (loadedSession) => {
                if (!mounted) return;
                setSession(loadedSession);
                if (!loadedSession) {
                    setStatus('signed-out');
                    return;
                }
                await resolveActiveTab(loadedSession, mounted);
            })
            .catch(() => {
                if (!mounted) return;
                setMessage('SideWire is unavailable. Check the local server.');
                setStatus('error');
            });

        return () => {
            mounted = false;
            connection.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (!session) return;
        const handleTabActivated = (
            activeInfo: chrome.tabs.OnActivatedInfo,
        ) => {
            if (
                panelWindowId.current !== null &&
                activeInfo.windowId !== panelWindowId.current
            ) {
                return;
            }

            void resolveActiveTab(session);
        };
        const handleTabUpdated = (
            _tabId: number,
            changeInfo: chrome.tabs.OnUpdatedInfo,
            tab: chrome.tabs.Tab,
        ) => {
            if (
                !changeInfo.url ||
                !tab.active ||
                panelWindowId.current === null ||
                tab.windowId !== panelWindowId.current
            ) {
                return;
            }

            void resolveActiveTab(session);
        };
        chrome.tabs.onActivated.addListener(handleTabActivated);
        chrome.tabs.onUpdated.addListener(handleTabUpdated);

        return () => {
            chrome.tabs.onActivated.removeListener(handleTabActivated);
            chrome.tabs.onUpdated.removeListener(handleTabUpdated);
        };
    }, [session]);

    useEffect(() => {
        if (!session || view === 'page') return;
        let active = true;

        const load = async () => {
            setDiscoveryLoading(true);
            setDiscoveryMessage(null);
            try {
                const result = await listDiscovery(session, {
                    surface: view,
                    view: discoveryView,
                    query: appliedDiscoveryQuery,
                    app: discoveryApp,
                });
                if (!active) return;
                setDiscoveryItems(result.items);
                setDiscoveryApps(result.apps);
                setDiscoveryWebUrl(result.webUrl);
            } catch (error) {
                if (!active) return;
                setDiscoveryMessage(errorMessage(error));
            } finally {
                if (active) setDiscoveryLoading(false);
            }
        };

        void load();
        return () => {
            active = false;
        };
    }, [
        session,
        view,
        discoveryView,
        discoveryApp,
        appliedDiscoveryQuery,
        discoveryReload,
    ]);

    useEffect(() => {
        const latestMessage = context?.chat?.messages?.at(-1);
        if (
            !session ||
            view !== 'page' ||
            status !== 'ready' ||
            !context?.chat ||
            !latestMessage
        ) {
            return;
        }

        const marker = `${context.chat.id}:${latestMessage.id}`;
        const markVisibleMessagesRead = () => {
            if (
                document.visibilityState !== 'visible' ||
                viewedMessage.current === marker
            ) {
                return;
            }

            viewedMessage.current = marker;
            void markChatRead(
                session,
                context.chat!.id,
                latestMessage.id,
            ).catch(() => {
                viewedMessage.current = null;
            });
        };

        markVisibleMessagesRead();
        document.addEventListener('visibilitychange', markVisibleMessagesRead);

        return () => {
            document.removeEventListener(
                'visibilitychange',
                markVisibleMessagesRead,
            );
        };
    }, [session, view, status, context]);

    useEffect(() => {
        if (linking && !linkDialog.current?.open)
            linkDialog.current?.showModal();
        if (!linking && linkDialog.current?.open) linkDialog.current.close();
    }, [linking]);

    useEffect(() => {
        if (unlinking && !unlinkDialog.current?.open)
            unlinkDialog.current?.showModal();
        if (!unlinking && unlinkDialog.current?.open)
            unlinkDialog.current.close();
    }, [unlinking]);

    async function resolveActiveTab(
        connectedSession: ExtensionSession,
        mounted = true,
        force = false,
    ) {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        panelWindowId.current = tab?.windowId ?? null;

        if (!tab?.url) {
            if (mounted) {
                resolveSequence.current += 1;
                activeTabKey.current = null;
                setContext(null);
                setCreateForm(null);
                setMessage(
                    "SideWire cannot read this tab's URL. Reload the extension and approve tab access, then try again.",
                );
                setStatus('unsupported');
            }
            return;
        }

        const tabKey = `${tab.id ?? 'unknown'}:${tab.url}`;
        if (!force && activeTabKey.current === tabKey) {
            return;
        }
        const sequence = ++resolveSequence.current;
        activeTabKey.current = tabKey;
        setStatus('resolving');
        setMessage(null);

        if (!/^https?:\/\//i.test(tab.url)) {
            if (mounted && sequence === resolveSequence.current) {
                setContext(null);
                setStatus('unsupported');
            }
            return;
        }

        try {
            const resolved = await resolvePage(connectedSession, {
                url: tab.url,
                title: tab.title || new URL(tab.url).hostname,
                faviconUrl: tab.favIconUrl,
            });
            if (!mounted || sequence !== resolveSequence.current) return;
            setContext(resolved);
            setCreateForm(
                resolved.chat
                    ? null
                    : {
                          pageUrl: resolved.url,
                          pageTitle: resolved.title,
                          chatName: resolved.title,
                          faviconUrl: resolved.favicon_url,
                      },
            );
            setStatus('ready');
        } catch (error) {
            if (!mounted || sequence !== resolveSequence.current) return;
            setContext(null);
            setMessage(errorMessage(error));
            setStatus(
                error instanceof PageChatApiError && error.status === 422
                    ? 'unsupported'
                    : 'error',
            );
        }
    }

    async function handleConnect() {
        connection.current?.abort();
        connection.current = new AbortController();
        setMessage(null);
        setStatus('connecting');
        try {
            const connectedSession = await connect(connection.current.signal);
            setSession(connectedSession);
            await resolveActiveTab(connectedSession);
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                setStatus('signed-out');
                return;
            }
            setMessage(errorMessage(error));
            setStatus('error');
        }
    }

    async function handleDisconnect() {
        setMessage(null);
        try {
            await disconnect();
            setSession(null);
            setContext(null);
            setCreateForm(null);
            activeTabKey.current = null;
            setStatus('signed-out');
        } catch (error) {
            setMessage(errorMessage(error));
        }
    }

    async function handleSend(event: React.FormEvent) {
        event.preventDefault();
        if (
            !session ||
            !context?.id ||
            context.association_version === null ||
            !context.chat
        ) {
            return;
        }
        const contextId = context.id;
        const draft = drafts[contextId];
        if (!draft?.body.trim() || sending) return;
        setSending(true);
        setMessage(null);
        try {
            await sendPageMessage(
                session,
                context,
                draft.body,
                draft.idempotencyKey,
            );
            setContext(await refreshPage(session, contextId));
            setDrafts((current) => {
                const next = { ...current };
                delete next[contextId];
                return next;
            });
        } catch (error) {
            setMessage(errorMessage(error));
        } finally {
            setSending(false);
        }
    }

    function updateDraft(body: string) {
        if (!context?.id || !context.chat) return;
        const contextId = context.id;
        setDrafts((current) => ({
            ...current,
            [contextId]: {
                body,
                idempotencyKey:
                    current[contextId]?.idempotencyKey ?? crypto.randomUUID(),
            },
        }));
    }

    async function handleCreateChat(event: React.FormEvent) {
        event.preventDefault();
        if (!session || !context || !createForm || creating) return;
        setCreating(true);
        setMessage(null);

        try {
            const created = await createPageChat(session, createForm);
            setContext(created);
            setCreateForm(null);
        } catch (error) {
            setMessage(errorMessage(error));
        } finally {
            setCreating(false);
        }
    }

    async function openLinking() {
        if (!session) return;
        setLinking(true);
        setLinkBusy(true);
        setMessage(null);
        try {
            setCandidates(await listPageChats(session));
        } catch (error) {
            setMessage(errorMessage(error));
        } finally {
            setLinkBusy(false);
        }
    }

    async function searchCandidates(event: React.FormEvent) {
        event.preventDefault();
        if (!session) return;
        setLinkBusy(true);
        try {
            setCandidates(await listPageChats(session, linkQuery));
        } catch (error) {
            setMessage(errorMessage(error));
        } finally {
            setLinkBusy(false);
        }
    }

    async function confirmLink() {
        if (!session || !context || !selectedChat) return;
        setLinkBusy(true);
        setMessage(null);
        try {
            const linked = await linkPage(
                session,
                context,
                selectedChat,
                createForm ?? undefined,
            );
            setContext(linked);
            setCreateForm(null);
            setLinking(false);
            setSelectedChat('');
        } catch (error) {
            setMessage(errorMessage(error));
        } finally {
            setLinkBusy(false);
        }
    }

    async function confirmUnlink() {
        if (!session || !context?.id) return;
        setLinkBusy(true);
        setMessage(null);
        try {
            const unlinked = await unlinkPage(session, context);
            setContext(unlinked);
            setCreateForm({
                pageUrl: unlinked.url,
                pageTitle: unlinked.title,
                chatName: unlinked.title,
                faviconUrl: unlinked.favicon_url,
            });
            setUnlinking(false);
        } catch (error) {
            setMessage(errorMessage(error));
        } finally {
            setLinkBusy(false);
        }
    }

    function searchDiscovery(event: React.FormEvent) {
        event.preventDefault();
        setAppliedDiscoveryQuery(discoveryQuery.trim());
    }

    const currentDraft = context?.id ? (drafts[context.id]?.body ?? '') : '';

    return (
        <main className="flex h-screen min-h-96 flex-col">
            <header className="border-input flex items-center justify-between border-b px-4 py-3">
                <div className="min-w-0">
                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                        {session
                            ? `${view === 'page' ? 'This Page' : view === 'activity' ? 'Activity' : 'Chats'} · ${session.organization.name}`
                            : 'Chrome side panel'}
                    </p>
                    <h1 className="truncate text-base font-semibold">
                        SideWire
                    </h1>
                </div>
                {session && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDisconnect}
                    >
                        Disconnect
                    </Button>
                )}
            </header>

            {session && (
                <nav
                    className="border-input flex gap-1 border-b px-3 py-2"
                    aria-label="SideWire views"
                >
                    <Button
                        className="flex-1"
                        size="sm"
                        variant={view === 'page' ? 'default' : 'outline'}
                        aria-pressed={view === 'page'}
                        onClick={() => setView('page')}
                    >
                        This Page
                    </Button>
                    <Button
                        className="flex-1"
                        size="sm"
                        variant={view === 'activity' ? 'default' : 'outline'}
                        aria-pressed={view === 'activity'}
                        onClick={() => setView('activity')}
                    >
                        Activity
                    </Button>
                    <Button
                        className="flex-1"
                        size="sm"
                        variant={view === 'chats' ? 'default' : 'outline'}
                        aria-pressed={view === 'chats'}
                        onClick={() => setView('chats')}
                    >
                        Chats
                    </Button>
                </nav>
            )}

            {view === 'page' &&
                (status === 'loading' || status === 'resolving') && (
                    <section
                        className="flex flex-1 flex-col justify-center space-y-2 p-5 text-center"
                        aria-live="polite"
                    >
                        Loading this page…
                    </section>
                )}
            {status === 'signed-out' && (
                <section
                    className="flex flex-1 flex-col justify-center space-y-2 p-5 text-center"
                    aria-live="polite"
                >
                    <h2 className="text-xl font-semibold">
                        Connect your SideWire account
                    </h2>
                    <p className="text-muted-foreground text-sm leading-6">
                        Sign in on the SideWire website, confirm your
                        organization, then return here.
                    </p>
                    {message && (
                        <p className="text-sm text-red-600" role="alert">
                            {message}
                        </p>
                    )}
                    <Button className="mt-4 w-full" onClick={handleConnect}>
                        Connect SideWire
                    </Button>
                </section>
            )}
            {status === 'connecting' && (
                <section
                    className="flex flex-1 flex-col justify-center space-y-2 p-5 text-center"
                    aria-live="polite"
                >
                    <h2 className="text-xl font-semibold">
                        Confirm in the new tab
                    </h2>
                    <p className="text-muted-foreground text-sm leading-6">
                        SideWire is waiting for your approval. This request
                        expires automatically.
                    </p>
                    <Button
                        className="mt-4 w-full"
                        variant="outline"
                        onClick={() => connection.current?.abort()}
                    >
                        Cancel
                    </Button>
                </section>
            )}
            {view === 'page' && status === 'unsupported' && (
                <section
                    className="flex flex-1 flex-col justify-center space-y-2 p-5 text-center"
                    aria-live="polite"
                >
                    <h2 className="text-lg font-semibold">
                        This page is not supported
                    </h2>
                    <p className="text-muted-foreground text-sm leading-6">
                        {message ??
                            'Open a standard HTTP or HTTPS work page, then try again.'}
                    </p>
                    {session && (
                        <Button
                            className="mt-4"
                            variant="outline"
                            onClick={() =>
                                resolveActiveTab(session, true, true)
                            }
                        >
                            Try again
                        </Button>
                    )}
                </section>
            )}
            {view === 'page' && status === 'error' && (
                <section
                    className="flex flex-1 flex-col justify-center space-y-2 p-5 text-center"
                    aria-live="polite"
                >
                    <h2 className="text-lg font-semibold">
                        SideWire is unavailable
                    </h2>
                    <p className="text-sm text-red-600" role="alert">
                        {message}
                    </p>
                    <Button
                        className="mt-4"
                        variant="outline"
                        onClick={() => window.location.reload()}
                    >
                        Try again
                    </Button>
                </section>
            )}

            {session && view !== 'page' && (
                <section className="flex min-h-0 flex-1 flex-col">
                    <div className="border-input space-y-2 border-b p-3">
                        <form className="flex gap-2" onSubmit={searchDiscovery}>
                            <label
                                className="sr-only"
                                htmlFor="discovery-query"
                            >
                                Search {view}
                            </label>
                            <input
                                id="discovery-query"
                                className="border-input min-w-0 flex-1 rounded-md border px-3 text-sm"
                                value={discoveryQuery}
                                onChange={(event) =>
                                    setDiscoveryQuery(event.target.value)
                                }
                                maxLength={100}
                                placeholder="Search chats"
                            />
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={discoveryLoading}
                            >
                                Search
                            </Button>
                        </form>
                        <div className="flex items-center gap-1">
                            <Button
                                size="sm"
                                variant={
                                    discoveryView === 'all'
                                        ? 'default'
                                        : 'outline'
                                }
                                aria-pressed={discoveryView === 'all'}
                                onClick={() => setDiscoveryView('all')}
                            >
                                All
                            </Button>
                            <Button
                                size="sm"
                                variant={
                                    discoveryView === 'unread'
                                        ? 'default'
                                        : 'outline'
                                }
                                aria-pressed={discoveryView === 'unread'}
                                onClick={() => setDiscoveryView('unread')}
                            >
                                Unread
                            </Button>
                            <label className="sr-only" htmlFor="discovery-app">
                                Filter by App
                            </label>
                            <select
                                id="discovery-app"
                                className="border-input ml-auto min-w-0 rounded-md border bg-white px-2 py-1.5 text-xs"
                                value={discoveryApp}
                                onChange={(event) =>
                                    setDiscoveryApp(event.target.value)
                                }
                            >
                                <option value="">All Apps</option>
                                {discoveryApps.map((app) => (
                                    <option key={app.id} value={app.id}>
                                        {app.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div
                        className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3"
                        aria-live="polite"
                    >
                        {discoveryMessage && (
                            <p className="text-sm text-red-600" role="alert">
                                {discoveryMessage}
                            </p>
                        )}
                        {discoveryLoading && discoveryItems.length === 0 && (
                            <p className="text-muted-foreground py-8 text-center text-sm">
                                Loading {view}…
                            </p>
                        )}
                        {!discoveryLoading &&
                            !discoveryMessage &&
                            discoveryItems.length === 0 && (
                                <div className="py-8 text-center">
                                    <h2 className="text-sm font-medium">
                                        {discoveryView === 'unread'
                                            ? 'Nothing unread'
                                            : `No ${view} yet`}
                                    </h2>
                                    <p className="text-muted-foreground mt-1 text-sm leading-5">
                                        {view === 'activity'
                                            ? 'Open or join a page chat to see updates here.'
                                            : 'Start a discussion beside a work page.'}
                                    </p>
                                </div>
                            )}
                        {discoveryItems.map((item) => (
                            <a
                                key={item.id}
                                className="border-input hover:bg-accent block rounded-md border p-3"
                                href={
                                    view === 'activity' && item.latest_message
                                        ? `${item.web_url}#message-${item.latest_message.id}`
                                        : item.web_url
                                }
                                target="_blank"
                                rel="noreferrer"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <h2 className="min-w-0 truncate text-sm font-medium">
                                        {item.title}
                                    </h2>
                                    {item.unread_count > 0 && (
                                        <span className="bg-primary text-primary-foreground shrink-0 rounded-md px-2 py-0.5 text-xs font-medium">
                                            {item.unread_count} unread
                                        </span>
                                    )}
                                </div>
                                <p className="text-muted-foreground mt-1 line-clamp-2 text-sm break-words">
                                    {item.latest_message?.body ??
                                        'No message preview available.'}
                                </p>
                                <p className="text-muted-foreground mt-2 truncate text-xs">
                                    {item.latest_message
                                        ? `Latest by ${item.latest_message.author.name}`
                                        : `${item.message_count} messages`}
                                    {item.latest_message?.source
                                        ? ` · ${item.latest_message.source.host}`
                                        : ''}
                                </p>
                            </a>
                        ))}
                    </div>

                    {discoveryWebUrl && (
                        <footer className="border-input flex items-center justify-between gap-3 border-t p-3">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={discoveryLoading}
                                onClick={() =>
                                    setDiscoveryReload((current) => current + 1)
                                }
                            >
                                {discoveryLoading ? 'Refreshing…' : 'Refresh'}
                            </Button>
                            <a
                                className="text-muted-foreground text-sm underline-offset-4 hover:underline"
                                href={discoveryWebUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Open {view} on the web
                            </a>
                        </footer>
                    )}
                </section>
            )}

            {view === 'page' && status === 'ready' && session && context && (
                <>
                    <section className="border-input space-y-2 border-b px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h2 className="truncate text-sm font-semibold">
                                    {context.title}
                                </h2>
                                <a
                                    className="text-muted-foreground block truncate text-xs underline-offset-4 hover:underline"
                                    href={context.url}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {context.host}
                                </a>
                            </div>
                            <div className="flex shrink-0 gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        resolveActiveTab(session, true, true)
                                    }
                                >
                                    Refresh
                                </Button>
                                {session.organization.canManagePageLinks &&
                                    (!context.chat ||
                                        context.chat.messages?.length ===
                                            0) && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={openLinking}
                                        >
                                            Link
                                        </Button>
                                    )}
                            </div>
                        </div>
                        {context.chat && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="min-w-0 truncate text-xs">
                                        <span className="text-muted-foreground">
                                            Chat:
                                        </span>{' '}
                                        {context.chat.title}
                                    </p>
                                    <div className="flex shrink-0 gap-2">
                                        <a
                                            className="text-muted-foreground text-xs underline-offset-4 hover:underline"
                                            href={context.chat.web_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Open
                                        </a>
                                        {session.organization
                                            .canManagePageLinks && (
                                            <button
                                                className="text-muted-foreground text-xs underline-offset-4 hover:underline"
                                                type="button"
                                                onClick={() =>
                                                    setUnlinking(true)
                                                }
                                            >
                                                Unlink
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {context.chat.linked_pages.map((page) => (
                                        <a
                                            key={page.id}
                                            className="border-input shrink-0 rounded-md border px-2 py-1 text-xs"
                                            href={page.url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {page.host}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    <section
                        className="flex min-h-0 flex-1 flex-col"
                        aria-label="Page chat"
                    >
                        <div
                            className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
                            aria-live="polite"
                        >
                            {!context.chat && createForm && (
                                <form
                                    className="space-y-4"
                                    onSubmit={handleCreateChat}
                                >
                                    <div>
                                        <h3 className="text-base font-semibold">
                                            Create chat for this page
                                        </h3>
                                        <p className="text-muted-foreground mt-1 text-sm leading-5">
                                            These details were detected from the
                                            active tab. Review or edit them
                                            before saving them to your
                                            organization.
                                        </p>
                                    </div>

                                    {message && (
                                        <p
                                            className="text-sm text-red-600"
                                            role="alert"
                                        >
                                            {message}
                                        </p>
                                    )}

                                    <div className="space-y-1.5">
                                        <label
                                            className="text-sm font-medium"
                                            htmlFor="create-page-title"
                                        >
                                            Page title
                                        </label>
                                        <input
                                            id="create-page-title"
                                            className="border-input focus:border-ring focus:ring-ring/30 h-9 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 disabled:opacity-50"
                                            value={createForm.pageTitle}
                                            onChange={(event) =>
                                                setCreateForm((current) =>
                                                    current
                                                        ? {
                                                              ...current,
                                                              pageTitle:
                                                                  event.target
                                                                      .value,
                                                          }
                                                        : current,
                                                )
                                            }
                                            required
                                            maxLength={255}
                                            disabled={creating}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label
                                            className="text-sm font-medium"
                                            htmlFor="create-page-url"
                                        >
                                            Page URL
                                        </label>
                                        <input
                                            id="create-page-url"
                                            type="url"
                                            className="border-input focus:border-ring focus:ring-ring/30 h-9 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 disabled:opacity-50"
                                            value={createForm.pageUrl}
                                            onChange={(event) =>
                                                setCreateForm((current) =>
                                                    current
                                                        ? {
                                                              ...current,
                                                              pageUrl:
                                                                  event.target
                                                                      .value,
                                                          }
                                                        : current,
                                                )
                                            }
                                            required
                                            maxLength={4096}
                                            disabled={creating}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label
                                            className="text-sm font-medium"
                                            htmlFor="create-chat-name"
                                        >
                                            Chat name
                                        </label>
                                        <input
                                            id="create-chat-name"
                                            className="border-input focus:border-ring focus:ring-ring/30 h-9 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 disabled:opacity-50"
                                            value={createForm.chatName}
                                            onChange={(event) =>
                                                setCreateForm((current) =>
                                                    current
                                                        ? {
                                                              ...current,
                                                              chatName:
                                                                  event.target
                                                                      .value,
                                                          }
                                                        : current,
                                                )
                                            }
                                            required
                                            maxLength={255}
                                            disabled={creating}
                                        />
                                    </div>

                                    <Button
                                        className="w-full"
                                        disabled={
                                            creating ||
                                            !createForm.pageTitle.trim() ||
                                            !createForm.pageUrl.trim() ||
                                            !createForm.chatName.trim()
                                        }
                                    >
                                        {creating ? 'Creating…' : 'Create chat'}
                                    </Button>
                                </form>
                            )}
                            {context.chat &&
                                context.chat.messages?.length === 0 && (
                                    <div className="py-8 text-center">
                                        <h3 className="text-sm font-medium">
                                            No messages yet
                                        </h3>
                                        <p className="text-muted-foreground mt-1 text-sm leading-5">
                                            Start the shared conversation beside
                                            this page.
                                        </p>
                                    </div>
                                )}
                            {context.chat?.messages?.map((chatMessage) => {
                                const isOwnMessage =
                                    chatMessage.author.id === session.user.id;

                                return (
                                    <article
                                        key={chatMessage.id}
                                        className={`flex items-end gap-2.5 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div
                                            className="border-input bg-accent text-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium shadow-xs"
                                            aria-hidden="true"
                                        >
                                            {initials(chatMessage.author.name)}
                                        </div>
                                        <div
                                            className={`flex min-w-0 max-w-[82%] flex-col space-y-1 ${isOwnMessage ? 'items-end' : 'items-start'}`}
                                        >
                                            <div
                                                className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${isOwnMessage ? 'justify-end' : ''}`}
                                            >
                                                <h3 className="truncate text-xs font-medium">
                                                    {isOwnMessage
                                                        ? 'You'
                                                        : chatMessage.author
                                                              .name}
                                                </h3>
                                                <time
                                                    className="text-muted-foreground text-xs"
                                                    dateTime={
                                                        chatMessage.created_at
                                                    }
                                                >
                                                    {formatTime(
                                                        chatMessage.created_at,
                                                    )}
                                                </time>
                                            </div>
                                            <div
                                                className={`rounded-xl border px-3 py-2 shadow-xs ${isOwnMessage ? 'border-primary bg-primary text-primary-foreground' : 'bg-background border-input'}`}
                                            >
                                                <p className="text-sm leading-5 break-words whitespace-pre-wrap">
                                                    {chatMessage.body}
                                                </p>
                                            </div>
                                            {chatMessage.source && (
                                                <a
                                                    className="border-input text-muted-foreground hover:bg-accent block w-fit max-w-full truncate rounded-md border px-2 py-0.5 text-xs font-medium underline-offset-4 hover:underline"
                                                    href={
                                                        chatMessage.source.url
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Sent while viewing{' '}
                                                    {chatMessage.source.host}
                                                </a>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>

                        {context.chat && (
                            <form
                                className="border-input space-y-2 border-t p-3"
                                onSubmit={handleSend}
                            >
                                {message && (
                                    <div className="flex items-center justify-between gap-2">
                                        <p
                                            className="text-sm text-red-600"
                                            role="alert"
                                        >
                                            {message}
                                        </p>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                resolveActiveTab(
                                                    session,
                                                    true,
                                                    true,
                                                )
                                            }
                                        >
                                            Reload
                                        </Button>
                                    </div>
                                )}
                                <label
                                    className="sr-only"
                                    htmlFor="message-body"
                                >
                                    Message this page chat
                                </label>
                                <textarea
                                    id="message-body"
                                    className="border-input focus:border-ring focus:ring-ring/30 min-h-20 w-full resize-y rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 disabled:opacity-50"
                                    value={currentDraft}
                                    onChange={(event) =>
                                        updateDraft(event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                        if (
                                            (event.metaKey || event.ctrlKey) &&
                                            event.key === 'Enter'
                                        )
                                            event.currentTarget.form?.requestSubmit();
                                    }}
                                    disabled={sending}
                                    maxLength={10000}
                                    placeholder="Write a message…"
                                />
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-muted-foreground text-xs">
                                        Ctrl/⌘ + Enter to send
                                    </p>
                                    <Button
                                        size="sm"
                                        disabled={
                                            sending || !currentDraft.trim()
                                        }
                                    >
                                        {sending ? 'Sending…' : 'Send'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </section>

                    {linking && (
                        <dialog
                            ref={linkDialog}
                            className="inset-x-3 top-auto bottom-3 m-0 max-h-[85vh] w-auto max-w-none overflow-y-auto rounded-lg bg-white p-4 text-inherit shadow-lg backdrop:bg-black/50"
                            aria-labelledby="link-title"
                            onCancel={(event) => {
                                event.preventDefault();
                                setLinking(false);
                            }}
                        >
                            <h2
                                id="link-title"
                                className="text-base font-semibold"
                            >
                                Link to existing chat
                            </h2>
                            <p className="text-muted-foreground mt-1 text-sm leading-5">
                                Messages posted from either page will appear in
                                this shared chat.
                            </p>
                            {message && (
                                <p
                                    className="mt-2 text-sm text-red-600"
                                    role="alert"
                                >
                                    {message}
                                </p>
                            )}
                            <form
                                className="mt-4 flex gap-2"
                                onSubmit={searchCandidates}
                            >
                                <label
                                    className="sr-only"
                                    htmlFor="chat-search"
                                >
                                    Search page chats
                                </label>
                                <input
                                    autoFocus
                                    id="chat-search"
                                    className="border-input min-w-0 flex-1 rounded-md border px-3 text-sm"
                                    value={linkQuery}
                                    onChange={(event) =>
                                        setLinkQuery(event.target.value)
                                    }
                                    placeholder="Search chats"
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={linkBusy}
                                >
                                    Search
                                </Button>
                            </form>
                            <div className="mt-3 space-y-2">
                                {candidates.length === 0 && (
                                    <p className="text-muted-foreground py-4 text-center text-sm">
                                        {linkBusy
                                            ? 'Loading chats…'
                                            : 'No eligible chats found.'}
                                    </p>
                                )}
                                {candidates.map((candidate) => (
                                    <label
                                        key={candidate.id}
                                        className="border-input flex cursor-pointer gap-3 rounded-md border p-3"
                                    >
                                        <input
                                            type="radio"
                                            name="destination-chat"
                                            value={candidate.id}
                                            checked={
                                                selectedChat === candidate.id
                                            }
                                            onChange={() =>
                                                setSelectedChat(candidate.id)
                                            }
                                        />
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-medium">
                                                {candidate.title}
                                            </span>
                                            <span className="text-muted-foreground block truncate text-xs">
                                                {candidate.linked_pages
                                                    .map((page) => page.host)
                                                    .join(', ')}
                                            </span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setLinking(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    disabled={!selectedChat || linkBusy}
                                    onClick={confirmLink}
                                >
                                    {linkBusy ? 'Linking…' : 'Link page'}
                                </Button>
                            </div>
                        </dialog>
                    )}
                    {unlinking && (
                        <dialog
                            ref={unlinkDialog}
                            className="inset-x-3 top-auto bottom-3 m-0 w-auto max-w-none rounded-lg bg-white p-4 text-inherit shadow-lg backdrop:bg-black/50"
                            aria-labelledby="unlink-title"
                            onCancel={(event) => {
                                event.preventDefault();
                                setUnlinking(false);
                            }}
                        >
                            <h2
                                id="unlink-title"
                                className="text-base font-semibold"
                            >
                                Unlink this page?
                            </h2>
                            <p className="text-muted-foreground mt-1 text-sm leading-5">
                                Existing messages remain in the shared chat.
                                This page will show no current chat.
                            </p>
                            {message && (
                                <p
                                    className="mt-2 text-sm text-red-600"
                                    role="alert"
                                >
                                    {message}
                                </p>
                            )}
                            <div className="mt-4 flex justify-end gap-2">
                                <Button
                                    autoFocus
                                    variant="outline"
                                    onClick={() => setUnlinking(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    disabled={linkBusy}
                                    onClick={confirmUnlink}
                                >
                                    {linkBusy ? 'Unlinking…' : 'Unlink page'}
                                </Button>
                            </div>
                        </dialog>
                    )}
                </>
            )}
        </main>
    );
}

function errorMessage(error: unknown): string {
    return error instanceof Error
        ? error.message
        : 'SideWire could not complete that request.';
}

function formatTime(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
}

function initials(name: string): string {
    const names = name.trim().split(/\s+/u).filter(Boolean);
    const first = Array.from(names[0] ?? '')[0] ?? '';
    const last = Array.from(names.at(-1) ?? '')[0] ?? '';

    return `${first}${names.length > 1 ? last : ''}`.toUpperCase();
}

const root = document.getElementById('root');
if (!root) throw new Error('SideWire side-panel root was not found.');
createRoot(root).render(
    <StrictMode>
        <SidePanel />
    </StrictMode>,
);
