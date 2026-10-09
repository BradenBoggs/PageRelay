import { ExternalLink, Globe2, LogOut, MessagesSquare, Plus, RefreshCw, Unplug } from 'lucide-react';
import { StrictMode, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
    CollaborationClient,
    type Source,
} from '../../../../resources/js/components/collaboration/client';
import {
    CollaborationBoard,
    CollaborationProvider,
    ConversationView,
    NotificationControls,
} from '../../../../resources/js/components/collaboration/workspace';
import { CollaborationDialog, EmptyState, IconButton, InlineError, PersonAvatar } from '../../../../resources/js/components/collaboration/ui';
import {
    connect,
    disconnect,
    loadSession,
    type ExtensionSession,
} from '../auth/session';
import {
    createPageChat,
    createWorkChat,
    linkPage,
    listPageChats,
    resolvePage,
    unlinkPage,
    type PageChat,
    type PageContext,
} from '../page-chat/api';
import '../styles/app.css';

const appUrl = (
    import.meta.env.VITE_SIDEWIRE_APP_URL ?? 'http://localhost:8000'
).replace(/\/$/, '');
const notifyCheck = () => {
    void chrome.runtime
        .sendMessage({ type: 'sidewire.check-notifications' })
        .catch(() => {});
};
async function enableAlerts(): Promise<boolean> {
    const granted = await chrome.permissions.request({
        permissions: ['notifications'],
    });
    if (granted)
        await chrome.storage.local.set({ 'sidewire.desktop.enabled': true });
    return granted;
}
async function testAlerts(): Promise<void> {
    const result = (await chrome.runtime.sendMessage({
        type: 'sidewire.test-notification',
    })) as { ok?: boolean; error?: string };
    if (!result?.ok)
        throw new Error(
            result?.error ?? 'Enable extension notifications first.',
        );
}

function SidePanel() {
    const [session, setSession] = useState<ExtensionSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [view, setView] = useState<'page' | 'messages'>('page');
    const [selectedChat, setSelectedChat] = useState<string | null>(null);
    const [page, setPage] = useState<PageContext | null>(null);
    const [resolving, setResolving] = useState(false);
    const [pageError, setPageError] = useState('');
    const [refresh, setRefresh] = useState(0);
    const [chatName, setChatName] = useState('');
    const [creating, setCreating] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [creationKey, setCreationKey] = useState(crypto.randomUUID());
    const connection = useRef<AbortController | null>(null);
    const client = useMemo(
        () => new CollaborationClient(appUrl, session?.token),
        [session?.token],
    );

    useEffect(() => {
        let active = true;
        void loadSession()
            .then((value) => {
                if (active) setSession(value);
            })
            .catch(() => {
                if (active)
                    setError(
                        'SideWire could not connect. Check your connection and the configured server.',
                    );
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
            connection.current?.abort();
        };
    }, []);
    useEffect(() => {
        if (!session) return;
        let active = true;
        let sequence = 0;
        let windowId: number | undefined;
        let lastKey = '';
        let lookup = 0;
        const resolve = async () => {
            const lookupId = ++lookup;
            let version = sequence;
            try {
                if (windowId === undefined)
                    windowId = (await chrome.windows.getCurrent()).id;
                const [tab] = await chrome.tabs.query({
                    active: true,
                    windowId,
                });
                if (!active || lookupId !== lookup) return;
                const key = `${tab?.id}:${tab?.url}`;
                if (key === lastKey) return;
                lastKey = key;
                version = ++sequence;
                setResolving(true);
                setPage(null);
                setPageError('');
                if (!tab?.url || !/^https?:\/\//.test(tab.url)) {
                    setPageError(
                        'SideWire cannot link this browser page. Your messages and DMs are still available.',
                    );
                    return;
                }
                const result = await resolvePage(session, {
                    url: tab.url,
                    title: tab.title ?? tab.url,
                    faviconUrl: tab.favIconUrl,
                });
                if (active && version === sequence) setPage(result);
            } catch (failure) {
                if (active && version === sequence) {
                    lastKey = '';
                    setPageError(
                        failure instanceof Error
                            ? failure.message
                            : 'Could not resolve this page.',
                    );
                }
            } finally {
                if (active && version === sequence) setResolving(false);
            }
        };
        const activated = (info: chrome.tabs.OnActivatedInfo) => {
            if (info.windowId === windowId) void resolve();
        };
        const updated = (
            _id: number,
            change: chrome.tabs.OnUpdatedInfo,
            tab: chrome.tabs.Tab,
        ) => {
            if (change.url && tab.active && tab.windowId === windowId)
                void resolve();
        };
        chrome.tabs.onActivated.addListener(activated);
        chrome.tabs.onUpdated.addListener(updated);
        void resolve();
        return () => {
            active = false;
            sequence++;
            chrome.tabs.onActivated.removeListener(activated);
            chrome.tabs.onUpdated.removeListener(updated);
        };
    }, [session, refresh]);

    async function signIn() {
        setLoading(true);
        setError('');
        connection.current = new AbortController();
        try {
            setSession(await connect(connection.current.signal));
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : 'Could not connect.',
            );
        } finally {
            setLoading(false);
        }
    }
    async function signOut() {
        setError('');
        try {
            await disconnect();
        } catch {
            setError(
                'Local session cleared. Server revocation could not be confirmed while disconnected.',
            );
        } finally {
            await chrome.storage.local.remove([
                'sidewire.extension.session',
                'sidewire.desktop.enabled',
            ]);
            client.drafts.clear();
            setSession(null);
            setPage(null);
        }
    }
    async function createChat() {
        if (!session || creating || !chatName.trim()) return;
        setCreating(true);
        setError('');
        try {
            const chat = await createWorkChat(session, {
                title: chatName,
                idempotencyKey: creationKey,
            });
            setChatName('');
            setCreateOpen(false);
            setCreationKey(crypto.randomUUID());
            setSelectedChat(chat.id);
            setView('messages');
            client.events.dispatchEvent(new Event('changed'));
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : 'Could not create this chat.',
            );
        } finally {
            setCreating(false);
        }
    }
    if (!session)
        return (
            <main className="sw-collaboration sw-extension-shell sw-extension-welcome">
                <div className="sw-extension-brand"><span className="sw-extension-mark"><Unplug aria-hidden="true" /></span><strong>SideWire</strong></div>
                <div className="sw-extension-signin"><span className="sw-section-kicker">RIGHT WHERE YOU WORK</span><h1>Your team.<br />Beside every page.</h1><p>Connect your workspace to bring chats, mentions, and private messages alongside your tools.</p>
                    {error && <InlineError>{error}</InlineError>}
                    <button type="button" className="sw-button-primary" disabled={loading} onClick={() => { void signIn(); }}>{loading ? 'Connecting…' : 'Connect to SideWire'}<ExternalLink aria-hidden="true" /></button>
                    {loading && <button type="button" className="sw-button-text" onClick={() => connection.current?.abort()}>Cancel</button>}
                    <small>Sign in securely in the web app. Your browser page stays untouched.</small>
                </div>
            </main>
        );
    const source: Source | null =
        page?.id && page.association_version !== null
            ? {
                  id: page.id,
                  title: page.title,
                  url: page.url,
                  host: page.host,
                  version: page.association_version,
              }
            : null;
    return (
        <CollaborationProvider
            client={client}
            userId={session.user.id}
            organizationId={session.organization.id}
            backgroundCheck={notifyCheck}
        >
            <main className="sw-collaboration sw-extension-shell">
                <header className="sw-extension-topbar">
                    <div className="sw-extension-brand"><span className="sw-extension-mark"><Unplug aria-hidden="true" /></span><div><strong>SideWire</strong><span title={session.organization.name}>{session.organization.name}</span></div></div>
                    <NotificationControls enableExtension={enableAlerts} testExtension={testAlerts} />
                    <a className="sw-icon-button" href={`${appUrl}/messages`} target="_blank" rel="noreferrer" aria-label="Open web app" title="Open web app"><ExternalLink aria-hidden="true" /></a>
                    <details className="sw-extension-account"><summary aria-label="Account and connection" title="Account and connection"><PersonAvatar name={session.user.name} small /></summary><div><strong>{session.user.name}</strong><span>{session.organization.name}</span><button type="button" onClick={() => { void signOut(); }}><LogOut aria-hidden="true" />Disconnect</button></div></details>
                </header>
                <nav className="sw-extension-tabs" aria-label="Side panel"><button type="button" aria-pressed={view === 'page'} onClick={() => { setView('page'); setRefresh((value) => value + 1); }}><Globe2 aria-hidden="true" />This Page</button><button type="button" aria-pressed={view === 'messages'} onClick={() => { setSelectedChat(null); setView('messages'); }}><MessagesSquare aria-hidden="true" />Messages & DMs</button></nav>
                {error && !createOpen && <InlineError>{error}</InlineError>}
                {view === 'messages' ? <CollaborationBoard key={selectedChat ?? 'board'} initialChat={selectedChat} onCreateChat={() => setCreateOpen(true)} /> : <div className="sw-page-home">
                    {resolving && <p className="sw-page-loading" role="status">Finding this page’s conversation…</p>}
                    {pageError && <EmptyState icon={Globe2} title="Your messages are still here">{pageError}</EmptyState>}
                    {page && <>
                        <header className="sw-current-page"><span className="sw-current-page-icon"><Globe2 aria-hidden="true" /></span><div><a href={page.url} target="_blank" rel="noreferrer">{page.host}<ExternalLink aria-hidden="true" /></a><strong title={page.title}>{page.title}</strong></div><IconButton icon={RefreshCw} label="Refresh this page" onClick={() => setRefresh((value) => value + 1)} /></header>
                        <div className={`sw-page-actions-container${page.chat ? ' sw-page-actions-linked' : ''}`}><PageActions key={`${page.url}:${page.association_version}`} session={session} page={page} changed={() => setRefresh((value) => value + 1)} /></div>
                        {page.chat && <ConversationView key={page.chat.id} chatId={page.chat.id} source={source} />}
                    </>}
                    {!page && !resolving && <button type="button" className="sw-button-secondary sw-page-retry" onClick={() => setRefresh((value) => value + 1)}><RefreshCw aria-hidden="true" />Retry page lookup</button>}
                </div>}
                <CollaborationDialog open={createOpen} onOpenChange={setCreateOpen} title="New work chat" description="A shared conversation for your team. A page link is optional."><form className="sw-extension-create" onSubmit={(event) => { event.preventDefault(); void createChat(); }}><label>Chat name<input required maxLength={255} value={chatName} disabled={creating} placeholder="e.g. Quote reviews" onChange={(event) => setChatName(event.target.value)} /></label><p>Everyone in your organization can access this chat. Use a direct message for a private discussion.</p>{error && <InlineError>{error}</InlineError>}<button type="submit" className="sw-button-primary" disabled={creating || !chatName.trim()}><Plus aria-hidden="true" />{creating ? 'Creating…' : 'Create chat'}</button></form></CollaborationDialog>
            </main>
        </CollaborationProvider>
    );
}

function PageActions({
    session,
    page,
    changed,
}: {
    session: ExtensionSession;
    page: PageContext;
    changed: () => void;
}) {
    const [url, setUrl] = useState(page.url);
    const [title, setTitle] = useState(page.title);
    const [name, setName] = useState(page.title);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [candidates, setCandidates] = useState<PageChat[]>([]);
    const [selected, setSelected] = useState('');
    async function action(kind: 'create' | 'link' | 'unlink') {
        if (busy) return;
        if (
            kind === 'unlink' &&
            !window.confirm(
                'Unlink this page? Existing messages remain in the shared chat.',
            )
        )
            return;
        setBusy(true);
        setError('');
        try {
            if (kind === 'create')
                await createPageChat(session, {
                    pageUrl: url,
                    pageTitle: title,
                    chatName: name,
                });
            else if (kind === 'link')
                await linkPage(session, page, selected, {
                    pageUrl: url,
                    pageTitle: title,
                    chatName: name,
                });
            else await unlinkPage(session, page);
            changed();
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : 'The page could not be updated.',
            );
        } finally {
            setBusy(false);
        }
    }
    async function search() {
        setBusy(true);
        setError('');
        try {
            setCandidates(await listPageChats(session, query));
            setSelected('');
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : 'Could not search chats.',
            );
        } finally {
            setBusy(false);
        }
    }
    return (
        <div className="sw-page-actions">
            {error && <InlineError>{error}</InlineError>}
            {!page.chat && (
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void action('create');
                    }}
                >
                    <h2>Start a conversation here</h2>
                    <p>Create a shared chat for this page, or link one your team already uses.</p>
                    <label>
                        Chat name
                        <input
                            required
                            value={name}
                            disabled={busy}
                            onChange={(event) => setName(event.target.value)}
                        />
                    </label>
                    <details className="sw-page-metadata"><summary>Review detected page details</summary>
                    <label>
                        Page title
                        <input
                            required
                            value={title}
                            disabled={busy}
                            onChange={(event) => setTitle(event.target.value)}
                        />
                    </label>
                    <label>
                        Page URL
                        <input
                            required
                            type="url"
                            value={url}
                            disabled={busy}
                            onChange={(event) => setUrl(event.target.value)}
                        />
                    </label>
                    </details>
                    <button type="submit" className="sw-button-primary" disabled={busy}>
                        Create chat
                    </button>
                </form>
            )}
            {session.organization.canManagePageLinks && (
                <details>
                    <summary><Globe2 aria-hidden="true" />Page linking</summary>
                    <p>
                        Link this page to a shared chat, not a private DM.
                        Separate nonempty histories cannot be merged.
                    </p>
                    <label>
                        Find a chat
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                        />
                    </label>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                            void search();
                        }}
                    >
                        Search chats
                    </button>
                    <label>
                        Destination chat
                        <select
                            value={selected}
                            onChange={(event) =>
                                setSelected(event.target.value)
                            }
                        >
                            <option value="">Select a chat</option>
                            {candidates.map((chat) => (
                                <option value={chat.id} key={chat.id}>
                                    {chat.title}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button
                        type="button"
                        disabled={busy || !selected}
                        onClick={() => {
                            void action('link');
                        }}
                    >
                        Link page
                    </button>
                    {page.chat && (
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                                void action('unlink');
                            }}
                        >
                            Unlink page
                        </button>
                    )}
                </details>
            )}
        </div>
    );
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <SidePanel />
    </StrictMode>,
);
