import { ArrowDownLeft, ArrowUpRight, AtSign, Bell, CheckCheck, ChevronLeft, ChevronRight, Hash, MessageCircle, MessagesSquare, Plus, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { AttentionPage, Chat, Person } from './client';
import { ConversationView } from './conversation';
import { timeLabel } from './presentation';
import { useCollaboration } from './provider';
import { CollaborationDialog, EmptyState, IconButton, InlineError, PersonAvatar } from './ui';

export type CommunicationView = 'all' | 'chats' | 'direct' | 'activity';
type Selection = { chat: string | null; thread: string | null; message: string | null };
const emptySelection: Selection = { chat: null, thread: null, message: null };

export function CollaborationBoard({ initialChat, initialThread, initialMessage, initialView = 'all', onCreateChat }: { initialChat?: string | null; initialThread?: string | null; initialMessage?: string | null; initialView?: CommunicationView; onCreateChat?: () => void }) {
    const { client, revision, attention } = useCollaboration();
    const [selection, setSelection] = useState<Selection>({ chat: initialChat ?? null, thread: initialThread ?? null, message: initialMessage ?? null });
    const [tab, setTab] = useState<CommunicationView>(initialView);
    const [chats, setChats] = useState<Chat[]>([]);
    const [activity, setActivity] = useState<AttentionPage | null>(null);
    const [query, setQuery] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [nextPage, setNextPage] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [reload, setReload] = useState(0);
    const [newDirect, setNewDirect] = useState(false);
    const [activityFilter, setActivityFilter] = useState<'all' | 'mention' | 'thread' | 'direct'>('all');
    const list = useRef<HTMLElement>(null);
    const isActivity = tab === 'activity';
    useEffect(() => {
        const abort = new AbortController();
        setLoading(true);
        setError('');
        const load = async () => {
            try {
                if (tab === 'activity') {
                    const result = await client.request<AttentionPage>(`/notifications?page=${page}`, { signal: abort.signal });
                    if (abort.signal.aborted) return;
                    setActivity(result);
                    setNextPage(result.next_page);
                } else {
                    const kind = tab === 'all' ? '' : `&kind=${tab === 'direct' ? 'direct' : 'page'}`;
                    const result = await client.request<{ data: Chat[]; next_page: number | null }>(`/chats?page=${page}${kind}`, { signal: abort.signal });
                    if (abort.signal.aborted) return;
                    setChats(result.data);
                    setNextPage(result.next_page);
                }
            } catch (failure) {
                if (!abort.signal.aborted) {
                    // Do not keep stale private list content after a denied/missing read.
                    setChats([]);
                    setActivity(null);
                    setError(failure instanceof Error ? failure.message : 'Could not load conversations.');
                }
            } finally { if (!abort.signal.aborted) setLoading(false); }
        };
        void load();
        return () => abort.abort();
    }, [client, tab, page, revision, attention?.unread_count, reload]);
    function changeTab(next: CommunicationView) {
        setTab(next); setPage(1); setQuery(''); setChats([]); setActivity(null); setLoading(true); setNextPage(null);
        // Filtering never silently switches the open conversation.
    }
    function select(chat: string, thread: string | null = null, message: string | null = null) { setSelection({ chat, thread, message }); }
    function back() {
        setSelection(emptySelection);
        requestAnimationFrame(() => list.current?.focus());
    }
    const filtered = chats.filter((chat) => `${chat.title} ${chat.linked_pages.map((source) => source.host).join(' ')}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
    const attentionItems = activity?.data.filter((item) => (activityFilter === 'all' || item.reason === activityFilter) && `${item.author} ${item.body} ${item.chat_title}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) ?? [];
    return <div className="sw-collaboration sw-board" data-selected={Boolean(selection.chat)}>
        <aside ref={list} tabIndex={-1} className="sw-conversation-list" aria-label={isActivity ? 'Mentions and replies' : 'Conversations'}>
            <header className="sw-directory-heading"><div><span className="sw-section-kicker">YOUR WORKSPACE</span><h1>{isActivity ? 'Activity' : 'Messages'}</h1></div><IconButton icon={Plus} label="New direct message" onClick={() => setNewDirect(true)} /></header>
            <div className="sw-directory-tools">
                <label className="sw-filter-input"><Search aria-hidden="true" /><span className="sw-visually-hidden">Filter conversations on this page</span><input type="search" value={query} maxLength={100} onChange={(event) => setQuery(event.target.value)} placeholder={isActivity ? 'Filter activity on this page' : 'Filter conversations on this page'} />{query && <IconButton icon={X} label="Clear filter" onClick={() => setQuery('')} />}</label>
                {!isActivity ? <nav className="sw-directory-tabs" aria-label="Communication views">{(['all', 'chats', 'direct'] as const).map((value) => <button type="button" key={value} aria-label={value === 'direct' ? 'Direct messages' : undefined} aria-pressed={tab === value} onClick={() => changeTab(value)}>{value === 'all' ? 'All' : value === 'chats' ? 'Chats' : 'Direct'}</button>)}</nav> : <nav className="sw-directory-tabs" aria-label="Activity filters">{(['all', 'mention', 'thread', 'direct'] as const).map((value) => <button type="button" key={value} aria-pressed={activityFilter === value} onClick={() => setActivityFilter(value)}>{value === 'all' ? 'All' : value === 'mention' ? 'Mentions' : value === 'thread' ? 'Threads' : 'DMs'}</button>)}</nav>}
                {client.token && <button type="button" className="sw-activity-shortcut" onClick={() => changeTab(isActivity ? 'all' : 'activity')}><Bell aria-hidden="true" /><span>{isActivity ? 'Back to all messages' : 'Mentions & replies'}</span>{!isActivity && Boolean(attention?.unread_count) && <span className="sw-attention-badge">{attention!.unread_count}</span>}{isActivity && <ArrowUpRight aria-hidden="true" />}</button>}
            </div>
            <div className="sw-directory-scroll" aria-busy={loading}>
                {error && <InlineError retry={() => setReload((value) => value + 1)}>{error}</InlineError>}
                {loading && !chats.length && !activity && <div className="sw-list-skeleton" role="status"><span className="sw-visually-hidden">Loading conversations…</span>{[0, 1, 2, 3].map((item) => <div key={item} aria-hidden="true"><i /><span><b /><b /></span></div>)}</div>}
                {isActivity ? attentionItems.map((item) => <button type="button" key={item.id} className="sw-conversation-row sw-activity-row" aria-current={selection.message === item.message_id ? 'page' : undefined} onClick={() => select(item.chat_id, item.thread_id, item.message_id)}>
                    <span className="sw-activity-symbol">{item.reason === 'mention' ? <AtSign /> : item.reason === 'thread' ? <ArrowDownLeft /> : <MessageCircle />}</span>
                    <span className="sw-directory-row-content"><span className="sw-directory-row-heading"><strong>{item.author}</strong><time dateTime={item.created_at} title={new Date(item.created_at).toLocaleString()}>{timeLabel(item.created_at)}</time></span><span className="sw-activity-reason">{item.reason === 'mention' ? 'Mentioned you' : item.reason === 'thread' ? 'Replied in your thread' : 'Sent a direct message'}</span><span className="sw-directory-preview">{item.body}</span><span className="sw-directory-meta">{item.chat_title}</span></span>
                </button>) : filtered.map((chat) => <button type="button" key={chat.id} className="sw-conversation-row" aria-current={selection.chat === chat.id ? 'page' : undefined} onClick={() => select(chat.id)}>
                    <PersonAvatar name={chat.title} chat={chat.type === 'page'} />
                    <span className="sw-directory-row-content"><span className="sw-directory-row-heading"><strong>{chat.title}</strong>{chat.unread_attention > 0 && <span className="sw-attention-badge" aria-label={`${chat.unread_attention} unread attention items`}>{chat.unread_attention > 99 ? '99+' : chat.unread_attention}</span>}</span><span className="sw-directory-preview">{chat.type === 'direct' ? (chat.can_send ? 'Private conversation' : 'Read-only conversation') : chat.linked_pages.length ? chat.linked_pages.map((source) => source.host).filter((host, index, hosts) => hosts.indexOf(host) === index).join(' · ') : 'Shared team chat'}</span>{chat.type === 'page' && chat.linked_pages.length > 0 && <span className="sw-directory-meta">{chat.linked_pages.length} linked {chat.linked_pages.length === 1 ? 'page' : 'pages'}</span>}</span>
                </button>)}
                {!loading && !error && (isActivity ? !attentionItems.length : !filtered.length) && <EmptyState icon={query ? Search : isActivity ? CheckCheck : MessagesSquare} title={query ? 'No matches on this page' : isActivity ? 'You’re all caught up' : tab === 'direct' ? 'Make it a conversation' : 'A place for every conversation'}>{query ? 'Try another name or browse the next page.' : isActivity ? 'Your mentions, direct messages, and thread replies will appear here.' : 'Start a direct message, or create a shared chat for your team.'}</EmptyState>}
            </div>
            {onCreateChat && <div className="sw-directory-create"><button type="button" className="sw-button-text" onClick={onCreateChat}><Plus aria-hidden="true" />New work chat</button></div>}
            <footer className="sw-directory-footer"><span>{page > 1 || nextPage ? `Page ${page}` : isActivity ? 'Your attention, organized' : 'One team. One conversation.'}</span>{(page > 1 || nextPage) && <div className="sw-actions"><IconButton icon={ChevronLeft} label="Previous page" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)} /><IconButton icon={ChevronRight} label="Next page" disabled={!nextPage || loading} onClick={() => nextPage && setPage(nextPage)} /></div>}</footer>
        </aside>
        <div className="sw-conversation-detail">
            {selection.chat ? <ConversationView key={`${selection.chat}:${selection.thread ?? ''}:${selection.message ?? ''}`} chatId={selection.chat} initialThread={selection.thread} initialMessage={selection.message} onBack={back} /> : <div className="sw-conversation-placeholder"><div className="sw-welcome-mark"><MessagesSquare aria-hidden="true" /></div><span className="sw-section-kicker">LESS SWITCHING. MORE TALKING.</span><h2>Your team.<br />Right where you work.</h2><p>A quick question, a shared decision, a conversation beside the page. Keep it all together.</p><div className="sw-actions"><button type="button" className="sw-button-primary" onClick={() => setNewDirect(true)}><MessageCircle aria-hidden="true" />Start a direct message</button>{onCreateChat ? <button type="button" className="sw-button-secondary" onClick={onCreateChat}><Hash aria-hidden="true" />Create a work chat</button> : <a className="sw-button-secondary" href={`${client.origin}/chats`} target={client.token ? '_blank' : undefined} rel="noreferrer"><Hash aria-hidden="true" />Browse work chats</a>}</div><span className="sw-welcome-footnote">Private DMs. Shared chats. Connected pages.</span></div>}
        </div>
        <NewDirectDialog open={newDirect} onOpenChange={setNewDirect} onSelect={(chat) => { setNewDirect(false); setTab('direct'); setPage(1); setQuery(''); select(chat.id); setReload((value) => value + 1); }} />
    </div>;
}

function NewDirectDialog({ open, onOpenChange, onSelect }: { open: boolean; onOpenChange: (value: boolean) => void; onSelect: (chat: Chat) => void }) {
    const { client } = useCollaboration();
    const [query, setQuery] = useState('');
    const [members, setMembers] = useState<Person[]>([]);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const pending = useRef(false);
    const [reload, setReload] = useState(0);
    const active = useRef(false);
    const generation = useRef(0);
    useEffect(() => { active.current = open; generation.current += 1; return () => { active.current = false; }; }, [open]);
    useEffect(() => {
        if (!open) return;
        const abort = new AbortController();
        setLoading(true); setError(''); setMembers([]);
        const timer = setTimeout(() => {
            void client.request<{ data: Person[] }>(`/members?query=${encodeURIComponent(query)}`, { signal: abort.signal }).then((result) => { if (!abort.signal.aborted) setMembers(result.data); }).catch((failure: unknown) => { if (!abort.signal.aborted) setError(failure instanceof Error ? failure.message : 'Could not load coworkers.'); }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
        }, 180);
        return () => { abort.abort(); clearTimeout(timer); };
    }, [client, query, open, reload]);
    async function start(person: Person) {
        if (pending.current) return;
        pending.current = true; setBusy(true); setError('');
        const requestGeneration = generation.current;
        try { const result = await client.mutate<{ data: Chat }>('/direct', { recipient_id: person.id }); if (active.current && requestGeneration === generation.current) onSelect(result.data); }
        catch (failure) { if (active.current && requestGeneration === generation.current) setError(failure instanceof Error ? failure.message : 'Could not open this conversation.'); }
        finally { pending.current = false; setBusy(false); }
    }
    return <CollaborationDialog open={open} onOpenChange={onOpenChange} title="New direct message" description="A private conversation between you and one coworker.">
        <label className="sw-filter-input"><Search aria-hidden="true" /><span className="sw-visually-hidden">Find a coworker</span><input type="search" maxLength={100} placeholder="Search by name" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        {error && <InlineError retry={() => setReload((value) => value + 1)}>{error}</InlineError>}
        <div className="sw-people-picker" aria-busy={loading || busy}>{loading ? <p role="status">Finding coworkers…</p> : members.map((person) => <button type="button" key={person.id} aria-label={person.name} disabled={busy} onClick={() => { void start(person); }}><PersonAvatar name={person.name} /><span><strong>{person.name}</strong><small>Start or reopen a private conversation</small></span><ArrowUpRight aria-hidden="true" /></button>)}{!loading && !members.length && !error && <EmptyState icon={Search} title="No coworkers found">Try a different name. Only active coworkers in your organization appear here.</EmptyState>}</div>
        <p className="sw-dialog-footnote">Only you and the selected coworker can access this conversation.</p>
    </CollaborationDialog>;
}
