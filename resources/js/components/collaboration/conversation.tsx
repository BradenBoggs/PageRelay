import {
    ArrowDown,
    ArrowLeft,
    ArrowUpRight,
    Check,
    Copy,
    ExternalLink,
    Globe2,
    Link2,
    LockKeyhole,
    MessageCircle,
    MessagesSquare,
    RefreshCw,
    Trash2,
    Pencil,
    MoreHorizontal,
    ListTodo,
    X,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
    Root as DropdownMenu,
    Trigger as DropdownMenuTrigger,
    Content as DropdownMenuContent,
    Item as DropdownMenuItem,
    Portal as DropdownMenuPortal,
} from '@radix-ui/react-dropdown-menu';
import {
    messagePath,
    type Message,
    type MessagePage,
    type Source,
} from './client';
import { Composer } from './composer';
import { ImagePreviews } from './image-previews';
import { TodoDialog, TodoStatus } from './todos';
import {
    dayLabel,
    messageParts,
    mergeMessages,
    sameMessageGroup,
    timeLabel,
} from './presentation';
import { useCollaboration } from './provider';
import {
    CollaborationDialog,
    EmptyState,
    IconButton,
    InlineError,
    MessageSkeleton,
    PersonAvatar,
} from './ui';

export function ConversationView({
    chatId,
    source,
    initialThread,
    initialMessage,
    onBack,
    onRenamed,
}: {
    chatId: string;
    source?: Source | null;
    initialThread?: string | null;
    initialMessage?: string | null;
    onBack?: () => void;
    onRenamed?: (title: string) => void;
}) {
    const [thread, setThread] = useState<string | null>(initialThread ?? null);
    const [wide, setWide] = useState(false);
    const stage = useRef<HTMLDivElement>(null);
    const returnFocus = useRef<HTMLElement | null>(null);
    useEffect(() => {
        const element = stage.current;
        if (!element) return;
        const observer = new ResizeObserver(([entry]) =>
            setWide(entry.contentRect.width >= 760),
        );
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    function openThread(id: string) {
        returnFocus.current =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
        setThread(id);
    }
    function closeThread() {
        setThread(null);
        requestAnimationFrame(() => {
            if (returnFocus.current?.isConnected) returnFocus.current.focus();
            else
                stage.current
                    ?.querySelector<HTMLElement>('.sw-conversation-heading h2')
                    ?.focus();
        });
    }
    return (
        <div
            ref={stage}
            className="sw-conversation-stage"
            data-thread={Boolean(thread)}
            data-split={wide}
        >
            <MessageStream
                chatId={chatId}
                thread={null}
                source={source ?? null}
                initialMessage={initialThread ?? initialMessage}
                active={!thread || wide}
                activeThread={wide ? thread : null}
                onThread={openThread}
                onBack={onBack}
                onRenamed={onRenamed}
            />
            {thread && (
                <MessageStream
                    key={thread}
                    chatId={chatId}
                    thread={thread}
                    source={source ?? null}
                    initialMessage={
                        thread === initialThread ? initialMessage : null
                    }
                    active
                    onClose={closeThread}
                />
            )}
        </div>
    );
}

function MessageStream({
    chatId,
    thread,
    source,
    initialMessage,
    active,
    activeThread,
    onThread,
    onBack,
    onClose,
    onRenamed,
}: {
    chatId: string;
    thread: string | null;
    source: Source | null;
    initialMessage?: string | null;
    active: boolean;
    activeThread?: string | null;
    onThread?: (id: string) => void;
    onBack?: () => void;
    onRenamed?: (title: string) => void;
    onClose?: () => void;
}) {
    const { client, revision } = useCollaboration();
    const [target, setTarget] = useState<string | null>(initialMessage ?? null);
    const [data, setData] = useState<MessagePage | null>(null);
    const dataRef = useRef<MessagePage | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [newActivity, setNewActivity] = useState(false);
    const [reload, setReload] = useState(0);
    const [pagesOpen, setPagesOpen] = useState(false);
    const [renameOpen, setRenameOpen] = useState(false);
    const [chatName, setChatName] = useState('');
    const [renameError, setRenameError] = useState('');
    const [renaming, setRenaming] = useState(false);
    const renameBusy = useRef(false);
    async function renameChat(event: React.FormEvent) {
        event.preventDefault();
        if (renameBusy.current || !chatName.trim()) return;
        renameBusy.current = true;
        setRenaming(true);
        setRenameError('');
        try {
            const result = await client.mutate<{ data: { title: string } }>(
                `/chats/${chatId}`,
                { title: chatName },
                'PATCH',
            );
            onRenamed?.(result.data.title);
            setRenameOpen(false);
            client.events.dispatchEvent(new Event('changed'));
            setReload((value) => value + 1);
        } catch (failure) {
            setRenameError(
                failure instanceof Error
                    ? failure.message
                    : 'Could not save the chat name.',
            );
        } finally {
            renameBusy.current = false;
            setRenaming(false);
        }
    }
    const history = useRef<HTMLDivElement>(null);
    const heading = useRef<HTMLHeadingElement>(null);
    const readIds = useRef(new Set<string>());
    const requestVersion = useRef(0);
    const olderRequest = useRef<AbortController | null>(null);
    const forceLatest = useRef(false);
    const pendingScroll = useRef<{
        target: string | null;
        follow: boolean;
        position: number;
    } | null>(null);
    useLayoutEffect(() => {
        const node = history.current;
        const intent = pendingScroll.current;
        if (!active || !node || !intent || !data) return;
        pendingScroll.current = null;
        if (intent.target) {
            const match = node.querySelector<HTMLElement>(
                `[data-message-id="${intent.target}"]`,
            );
            if (match)
                node.scrollTop =
                    match.offsetTop - node.offsetTop - node.clientHeight / 3;
        } else {
            node.scrollTop = intent.follow
                ? node.scrollHeight
                : intent.position;
        }
    }, [data, active]);
    function store(next: MessagePage | null) {
        dataRef.current = next;
        setData(next);
    }
    useEffect(() => {
        if (thread) requestAnimationFrame(() => heading.current?.focus());
        return () => olderRequest.current?.abort();
    }, [thread]);
    useEffect(() => {
        const abort = new AbortController();
        olderRequest.current?.abort();
        const version = ++requestVersion.current;
        setLoading(true);
        setError('');
        const query = new URLSearchParams();
        if (thread) query.set('thread', thread);
        if (target) query.set('around', target);
        const firstLoaded = dataRef.current?.data[0]?.id;
        if (firstLoaded) query.set('loaded_since', firstLoaded);
        void client
            .request<MessagePage>(`/chats/${chatId}/messages?${query}`, {
                signal: abort.signal,
            })
            .then((result) => {
                if (abort.signal.aborted || version !== requestVersion.current)
                    return;
                const previous = dataRef.current;
                const container = history.current;
                const follow =
                    forceLatest.current ||
                    !previous ||
                    Boolean(
                        container &&
                        container.scrollHeight -
                            container.scrollTop -
                            container.clientHeight <
                            120,
                    );
                const reset =
                    forceLatest.current || Boolean(target) || !previous;
                const position = container?.scrollTop ?? 0;
                const incoming =
                    previous &&
                    result.data.at(-1)?.id !== previous.data.at(-1)?.id;
                const next =
                    !reset && previous
                        ? {
                              ...result,
                              data: mergeMessages(previous.data, result.data),
                              older_cursor: previous.older_cursor,
                          }
                        : result;
                const edited = new Map(
                    result.updated_messages.map((item) => [item.id, item]),
                );
                next.data = next.data.map(
                    (item) => edited.get(item.id) ?? item,
                );
                const deletedIds = new Set(result.deleted_ids);
                next.data = next.data.map((item) =>
                    deletedIds.has(item.id)
                        ? {
                              ...item,
                              body: 'Message deleted',
                              deleted: true,
                              can_delete: false,
                              can_edit: false,
                              mentions: [],
                          }
                        : item,
                );
                forceLatest.current = false;
                pendingScroll.current = { target, follow, position };
                store(next);
                setNewActivity(Boolean(incoming && !follow && !target));
            })
            .catch((failure: unknown) => {
                if (abort.signal.aborted || version !== requestVersion.current)
                    return;
                store(null);
                setError(
                    failure instanceof Error
                        ? failure.message
                        : 'Could not load this conversation.',
                );
            })
            .finally(() => {
                if (!abort.signal.aborted && version === requestVersion.current)
                    setLoading(false);
            });
        return () => abort.abort();
    }, [client, chatId, thread, target, revision, reload]);
    useEffect(() => {
        const container = history.current;
        if (!active || !container || !data) return;
        let disposed = false;
        let busy = false;
        const visible = new Set<string>();
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const id = (entry.target as HTMLElement).dataset.messageId;
                    if (!id) continue;
                    if (entry.isIntersecting) visible.add(id);
                    else visible.delete(id);
                }
            },
            { root: container, threshold: 0.25 },
        );
        container
            .querySelectorAll('[data-message-id]')
            .forEach((item) => observer.observe(item));
        async function flush() {
            if (
                disposed ||
                busy ||
                !container?.getClientRects().length ||
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
                if (!disposed)
                    client.events.dispatchEvent(new Event('changed'));
            } catch {
                /* Keep unread when the authorized read acknowledgement fails. */
            } finally {
                busy = false;
            }
        }
        const timer = setInterval(() => {
            void flush();
        }, 800);
        return () => {
            disposed = true;
            clearInterval(timer);
            observer.disconnect();
        };
    }, [active, data, client, chatId]);
    function latest() {
        forceLatest.current = true;
        olderRequest.current?.abort();
        setTarget(null);
        setReload((value) => value + 1);
    }
    async function older() {
        const previous = dataRef.current;
        if (!previous?.older_cursor || loading) return;
        const abort = new AbortController();
        olderRequest.current?.abort();
        olderRequest.current = abort;
        const version = ++requestVersion.current;
        const height = history.current?.scrollHeight ?? 0;
        const position = history.current?.scrollTop ?? 0;
        setLoading(true);
        setError('');
        const query = new URLSearchParams({ before: previous.older_cursor });
        if (thread) query.set('thread', thread);
        try {
            const result = await client.request<MessagePage>(
                `/chats/${chatId}/messages?${query}`,
                { signal: abort.signal },
            );
            if (abort.signal.aborted || version !== requestVersion.current)
                return;
            const current = dataRef.current;
            if (current)
                store({
                    ...current,
                    data: mergeMessages(result.data, current.data),
                    older_cursor: result.older_cursor,
                });
            requestAnimationFrame(() => {
                if (history.current)
                    history.current.scrollTop =
                        position + history.current.scrollHeight - height;
            });
        } catch (failure) {
            if (!abort.signal.aborted)
                setError(
                    failure instanceof Error
                        ? failure.message
                        : 'Could not load earlier messages.',
                );
        } finally {
            if (!abort.signal.aborted && version === requestVersion.current)
                setLoading(false);
        }
    }
    const title = data?.chat.title ?? 'Conversation';
    return (
        <section
            className={`sw-collaboration sw-conversation${thread ? ' sw-thread-pane' : ' sw-main-stream'}`}
            hidden={!active}
            aria-label={thread ? 'Thread' : 'Open conversation'}
            onKeyDown={(event) => {
                if (
                    thread &&
                    event.key === 'Escape' &&
                    !event.defaultPrevented
                ) {
                    event.preventDefault();
                    onClose?.();
                }
            }}
        >
            <header className="sw-conversation-heading">
                {!thread && onBack && (
                    <IconButton
                        className="sw-back-list"
                        icon={ArrowLeft}
                        label="Back to conversations"
                        onClick={onBack}
                    />
                )}
                {!thread && data && (
                    <PersonAvatar
                        name={title}
                        chat={data.chat.type === 'page'}
                    />
                )}
                {thread && (
                    <span className="sw-thread-heading-icon">
                        <MessagesSquare aria-hidden="true" />
                    </span>
                )}
                <div className="sw-conversation-title">
                    <h2 ref={heading} tabIndex={-1}>
                        {thread ? 'Thread' : title}
                    </h2>
                    <p>
                        {thread ? (
                            title
                        ) : data?.chat.type === 'direct' ? (
                            <>
                                <LockKeyhole aria-hidden="true" />
                                Private · two participants
                            </>
                        ) : (
                            'Shared with your organization'
                        )}
                    </p>
                </div>
                <div className="sw-heading-actions">
                    {!thread && data?.chat.can_edit && (
                        <IconButton
                            icon={Pencil}
                            label="Edit work chat"
                            onClick={() => {
                                setChatName(data.chat.title);
                                setRenameError('');
                                setRenameOpen(true);
                            }}
                        />
                    )}
                    {!thread && Boolean(data?.chat.linked_pages.length) && (
                        <button
                            type="button"
                            className="sw-page-count"
                            onClick={() => setPagesOpen(true)}
                            title="View linked pages"
                        >
                            <Globe2 aria-hidden="true" />
                            <span>
                                {data!.chat.linked_pages.length} linked{' '}
                                {data!.chat.linked_pages.length === 1
                                    ? 'page'
                                    : 'pages'}
                            </span>
                        </button>
                    )}
                    <IconButton
                        icon={RefreshCw}
                        label="Refresh conversation"
                        disabled={loading}
                        onClick={latest}
                    />
                    {thread && (
                        <IconButton
                            icon={X}
                            label="Back to chat"
                            onClick={onClose}
                        />
                    )}
                </div>
            </header>
            {source && !thread && (
                <div className="sw-source-strip">
                    <Link2 aria-hidden="true" />
                    <span>
                        Beside{' '}
                        <a href={source.url} target="_blank" rel="noreferrer">
                            {source.host}
                        </a>
                    </span>
                    <span className="sw-source-strip-title">
                        {source.title}
                    </span>
                </div>
            )}
            {(newActivity || target) && (
                <button
                    type="button"
                    className="sw-jump-latest"
                    onClick={latest}
                >
                    <ArrowDown aria-hidden="true" />
                    {newActivity
                        ? 'New messages · jump to latest'
                        : 'Viewing a linked message · jump to latest'}
                </button>
            )}
            {error && <InlineError retry={latest}>{error}</InlineError>}
            <div
                className="sw-collaboration-history"
                ref={history}
                tabIndex={0}
                role="region"
                aria-label={thread ? 'Thread replies' : 'Conversation messages'}
                aria-busy={loading && !data}
            >
                {data?.root && (
                    <div className="sw-thread-root">
                        <MessageRow
                            item={data.root}
                            chatId={chatId}
                            targeted={target === data.root.id}
                        />
                        <div className="sw-thread-reply-label">
                            <MessagesSquare aria-hidden="true" />
                            Replies
                        </div>
                    </div>
                )}
                {data?.older_cursor && (
                    <button
                        type="button"
                        className="sw-history-previous"
                        disabled={loading}
                        onClick={() => {
                            void older();
                        }}
                    >
                        Load earlier {thread ? 'replies' : 'messages'}
                    </button>
                )}
                {loading && !data && <MessageSkeleton />}
                {data?.data.map((item, index) => (
                    <div key={item.id}>
                        {(index === 0 ||
                            new Date(item.created_at).toDateString() !==
                                new Date(
                                    data.data[index - 1].created_at,
                                ).toDateString()) && (
                            <div className="sw-message-date">
                                <span>{dayLabel(item.created_at)}</span>
                            </div>
                        )}
                        <MessageRow
                            item={item}
                            chatId={chatId}
                            grouped={
                                !item.deleted &&
                                !data.data[index - 1]?.deleted &&
                                sameMessageGroup(data.data[index - 1], item)
                            }
                            targeted={target === item.id}
                            threadActive={activeThread === item.id}
                            onThread={thread ? undefined : onThread}
                        />
                    </div>
                ))}
                {data && !data.data.length && (
                    <EmptyState
                        icon={thread ? MessagesSquare : MessageCircle}
                        title={
                            thread
                                ? 'Keep the conversation going'
                                : 'This is the start of your conversation'
                        }
                    >
                        {thread
                            ? 'Reply here to keep the details out of the main chat.'
                            : 'Ask a question, share an update, or @mention a coworker.'}
                    </EmptyState>
                )}
            </div>
            {data?.chat.can_send ? (
                <Composer
                    key={`${chatId}:${thread ?? 'main'}`}
                    chatId={chatId}
                    thread={thread}
                    source={source}
                    title={title}
                    onSent={latest}
                />
            ) : (
                data && (
                    <div className="sw-readonly-note">
                        <LockKeyhole aria-hidden="true" />
                        <span>
                            This conversation is read-only. A participant may no
                            longer be active.
                        </span>
                    </div>
                )
            )}
            <CollaborationDialog
                open={renameOpen}
                onOpenChange={(open) => {
                    if (!renaming) setRenameOpen(open);
                }}
                title="Edit work chat"
                description="Change the chat name. Linked pages and message history stay with this chat."
            >
                <form className="sw-extension-create" onSubmit={renameChat}>
                    <label>
                        Chat name
                        <input
                            required
                            maxLength={255}
                            value={chatName}
                            disabled={renaming}
                            onChange={(event) =>
                                setChatName(event.target.value)
                            }
                        />
                    </label>
                    {renameError && <InlineError>{renameError}</InlineError>}
                    <button
                        type="submit"
                        className="sw-button-primary"
                        disabled={renaming || !chatName.trim()}
                    >
                        {renaming ? 'Saving…' : 'Save changes'}
                    </button>
                    <button
                        type="button"
                        className="sw-button-text"
                        disabled={renaming}
                        onClick={() => setRenameOpen(false)}
                    >
                        Cancel
                    </button>
                </form>
            </CollaborationDialog>
            <CollaborationDialog
                open={pagesOpen}
                onOpenChange={setPagesOpen}
                title="Linked pages"
                description="One conversation, available beside each of these pages."
            >
                <div className="sw-linked-page-picker">
                    {data?.chat.linked_pages.map((page) => (
                        <a
                            key={page.id}
                            href={page.url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Globe2 aria-hidden="true" />
                            <span>
                                <strong>{page.title}</strong>
                                <small>{page.host}</small>
                            </span>
                            <ExternalLink aria-hidden="true" />
                        </a>
                    ))}
                </div>
                <p className="sw-dialog-footnote">
                    These links do not grant access to the websites themselves.
                </p>
            </CollaborationDialog>
        </section>
    );
}

function MessageRow({
    item,
    chatId,
    grouped = false,
    targeted = false,
    threadActive = false,
    onThread,
}: {
    item: Message;
    chatId: string;
    grouped?: boolean;
    targeted?: boolean;
    threadActive?: boolean;
    onThread?: (id: string) => void;
}) {
    const { client } = useCollaboration();
    const [copied, setCopied] = useState(false);
    const article = useRef<HTMLElement>(null);
    const [todoOpen, setTodoOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editBody, setEditBody] = useState('');
    const [editVersion, setEditVersion] = useState(0);
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState('');
    function startEdit() {
        setEditBody(item.body);
        setEditVersion(item.edit_version);
        setEditError('');
        setEditOpen(true);
    }
    async function saveEdit() {
        if (saving || !editBody.trim()) return;
        setSaving(true);
        setEditError('');
        try {
            await client.mutate(
                `/chats/${chatId}/messages/${item.id}`,
                { body: editBody, edit_version: editVersion },
                'PATCH',
            );
            setEditOpen(false);
            client.events.dispatchEvent(new Event('changed'));
            requestAnimationFrame(() => article.current?.focus());
        } catch (failure) {
            setEditError(
                failure instanceof Error
                    ? failure.message
                    : 'Could not edit this message.',
            );
        } finally {
            setSaving(false);
        }
    }
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [deleted, setDeleted] = useState(false);
    const isDeleted = item.deleted || deleted;
    async function remove() {
        if (deleting) return;
        setDeleting(true);
        setDeleteError('');
        try {
            await client.mutate(
                `/chats/${chatId}/messages/${item.id}`,
                {},
                'DELETE',
            );
            setDeleted(true);
            setDeleteOpen(false);
            client.events.dispatchEvent(new Event('changed'));
            requestAnimationFrame(() => article.current?.focus());
        } catch (failure) {
            setDeleteError(
                failure instanceof Error
                    ? failure.message
                    : 'Could not delete this message.',
            );
        } finally {
            setDeleting(false);
        }
    }
    const [copyError, setCopyError] = useState('');
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(
        () => () => {
            if (timer.current) clearTimeout(timer.current);
        },
        [],
    );
    const path = `${client.origin}${messagePath(chatId, item.thread_root_id, item.id)}`;
    async function copy() {
        setCopyError('');
        try {
            await navigator.clipboard.writeText(
                new URL(path, window.location.href).href,
            );
            setCopied(true);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopyError('Could not copy. Use the message link instead.');
        }
    }
    if (isDeleted) {
        return (
            <article
                ref={article}
                tabIndex={-1}
                data-message-id={item.id}
                className={`sw-collaboration-message sw-deleted-message${threadActive ? ' sw-thread-active' : ''}`}
                aria-current={threadActive ? true : undefined}
            >
                {onThread && item.reply_count > 0 ? (
                    <button
                        type="button"
                        onClick={() => onThread(item.id)}
                        title="Open replies"
                    >
                        Message deleted
                    </button>
                ) : (
                    <p>Message deleted</p>
                )}
            </article>
        );
    }
    return (
        <article
            ref={article}
            tabIndex={-1}
            data-message-id={item.id}
            className={`sw-collaboration-message${grouped ? ' sw-grouped-message' : ''}${targeted ? ' sw-message-target' : ''}${threadActive ? ' sw-thread-active' : ''}`}
            aria-current={threadActive ? true : undefined}
        >
            <div className="sw-message-avatar">
                {!grouped ? (
                    <PersonAvatar name={item.author.name} />
                ) : (
                    <time
                        className="sw-grouped-time"
                        dateTime={item.created_at}
                    >
                        {timeLabel(item.created_at)}
                    </time>
                )}
            </div>
            <div className="sw-message-body">
                <header className={grouped ? 'sw-visually-hidden' : undefined}>
                    <strong>{item.author.name}</strong>
                    <time
                        dateTime={item.created_at}
                        title={new Date(item.created_at).toLocaleString()}
                    >
                        {timeLabel(item.created_at)}
                    </time>
                </header>
                <p>
                    {messageParts(
                        isDeleted ? 'Message deleted' : item.body,
                        isDeleted ? [] : item.mentions,
                    ).map((part, index) =>
                        part.reference ? (
                            <span
                                className="sw-work-reference"
                                title={part.reference.description}
                                aria-label={part.reference.description}
                                key={index}
                            >
                                {part.reference.label}
                            </span>
                        ) : part.href ? (
                            <a
                                className="sw-message-url"
                                href={part.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                key={index}
                            >
                                {part.text}
                            </a>
                        ) : part.mentioned ? (
                            <mark className="sw-inline-mention" key={index}>
                                {part.text}
                            </mark>
                        ) : (
                            <span key={index}>{part.text}</span>
                        ),
                    )}
                </p>
                <ImagePreviews chatId={chatId} message={item} />
                {item.todo && <TodoStatus todo={item.todo} inMessage />}
                {item.edited_at && (
                    <span className="sw-edited-marker">Edited</span>
                )}
                {item.source && (
                    <a
                        className="sw-message-source"
                        href={item.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Link2 aria-hidden="true" />
                        {item.source.host}
                        <ArrowUpRight aria-hidden="true" />
                    </a>
                )}
                {onThread && item.reply_count > 0 && (
                    <button
                        type="button"
                        className="sw-thread-reply-button"
                        onClick={() => onThread(item.id)}
                    >
                        <MessagesSquare aria-hidden="true" />
                        {item.reply_count}{' '}
                        {item.reply_count === 1 ? 'reply' : 'replies'}
                        <ArrowUpRight aria-hidden="true" />
                    </button>
                )}
                {copyError && (
                    <p className="sw-copy-feedback" role="status">
                        {copyError}{' '}
                        <a
                            href={path}
                            target={client.token ? '_blank' : undefined}
                            rel="noreferrer"
                        >
                            Message link
                        </a>
                    </p>
                )}
                <span className="sw-visually-hidden" role="status">
                    {copied ? 'Message link copied' : ''}
                </span>
            </div>
            <CollaborationDialog
                open={deleteOpen}
                onOpenChange={(open) => {
                    if (!deleting) {
                        setDeleteOpen(open);
                        setDeleteError('');
                    }
                }}
                title="Delete message?"
                description="The message text will be removed for everyone. Replies and a deleted-message placeholder will remain."
            >
                {deleteError && <InlineError>{deleteError}</InlineError>}
                <div className="sw-dialog-actions">
                    <button
                        className="sw-button-secondary"
                        type="button"
                        disabled={deleting}
                        onClick={() => setDeleteOpen(false)}
                    >
                        Cancel
                    </button>
                    <button
                        className="sw-button-primary"
                        type="button"
                        disabled={deleting}
                        onClick={() => {
                            void remove();
                        }}
                    >
                        {deleting ? 'Deleting…' : 'Delete message'}
                    </button>
                </div>
            </CollaborationDialog>
            <CollaborationDialog
                open={editOpen}
                onOpenChange={(open) => {
                    if (!saving) setEditOpen(open);
                }}
                title="Edit message"
                description="Update your message text. Its original source and replies stay attached."
            >
                <label htmlFor={`edit-${item.id}`}>Message</label>
                <textarea
                    id={`edit-${item.id}`}
                    className="sw-edit-message-input"
                    value={editBody}
                    maxLength={10000}
                    disabled={saving}
                    onChange={(event) => setEditBody(event.target.value)}
                    onKeyDown={(event) => {
                        if (
                            !event.nativeEvent.isComposing &&
                            (event.ctrlKey || event.metaKey) &&
                            event.key === 'Enter'
                        ) {
                            event.preventDefault();
                            void saveEdit();
                        }
                    }}
                />
                {editError && <InlineError>{editError}</InlineError>}
                <div className="sw-dialog-actions">
                    <button
                        type="button"
                        className="sw-button-secondary"
                        disabled={saving}
                        onClick={() => setEditOpen(false)}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="sw-button-primary"
                        disabled={saving || !editBody.trim()}
                        onClick={() => {
                            void saveEdit();
                        }}
                    >
                        {saving ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </CollaborationDialog>
            <TodoDialog
                open={todoOpen}
                onOpenChange={setTodoOpen}
                chatId={chatId}
                messageId={item.id}
                messageBody={item.body}
                todo={item.todo}
            />
            <div className="sw-message-mobile-actions">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="sw-icon-button"
                            aria-label="Message actions"
                            title="Message actions"
                        >
                            <MoreHorizontal aria-hidden="true" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuContent
                            align="end"
                            sideOffset={4}
                            className="sw-message-action-menu"
                        >
                            {item.can_create_todo && (
                                <DropdownMenuItem
                                    onSelect={() => setTodoOpen(true)}
                                >
                                    <ListTodo />
                                    Convert to todo
                                </DropdownMenuItem>
                            )}
                            {item.can_edit && (
                                <DropdownMenuItem onSelect={startEdit}>
                                    <Pencil />
                                    Edit message
                                </DropdownMenuItem>
                            )}
                            {item.can_delete && (
                                <DropdownMenuItem
                                    onSelect={() => setDeleteOpen(true)}
                                >
                                    <Trash2 />
                                    Delete message
                                </DropdownMenuItem>
                            )}
                            {onThread && (
                                <DropdownMenuItem
                                    onSelect={() => onThread(item.id)}
                                >
                                    <MessagesSquare />
                                    Reply in thread
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onSelect={() => {
                                    void copy();
                                }}
                            >
                                <Copy />
                                Copy message link
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a
                                    href={path}
                                    target={client.token ? '_blank' : undefined}
                                    rel="noreferrer"
                                >
                                    <ExternalLink />
                                    Open message link
                                </a>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenuPortal>
                </DropdownMenu>
            </div>
            <div className="sw-message-actions">
                {item.can_create_todo && (
                    <IconButton
                        icon={ListTodo}
                        label="Convert to todo"
                        onClick={() => setTodoOpen(true)}
                    />
                )}
                {item.can_edit && (
                    <IconButton
                        icon={Pencil}
                        label="Edit message"
                        onClick={startEdit}
                    />
                )}
                {item.can_delete && !isDeleted && (
                    <IconButton
                        icon={Trash2}
                        label="Delete message"
                        onClick={() => setDeleteOpen(true)}
                    />
                )}
                {onThread && (
                    <IconButton
                        icon={MessagesSquare}
                        label="Reply in thread"
                        onClick={() => onThread(item.id)}
                    />
                )}
                <IconButton
                    icon={copied ? Check : Copy}
                    label={copied ? 'Message link copied' : 'Copy message link'}
                    onClick={() => {
                        void copy();
                    }}
                />
                <a
                    href={path}
                    target={client.token ? '_blank' : undefined}
                    rel="noreferrer"
                    className="sw-icon-button"
                    aria-label="Message link"
                    title="Open message link"
                >
                    <ExternalLink aria-hidden="true" />
                </a>
            </div>
        </article>
    );
}
