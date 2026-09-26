import { Link, router, useForm, usePage } from '@inertiajs/react';
import { MessageSquarePlus, Plus, X } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { chatDiscoveryUrl } from '@/lib/chat-navigation';
import type { ChatDiscovery } from '@/types/chat';

function CreateChat() {
    const [open, setOpen] = useState(false);
    const [key] = useState(() => crypto.randomUUID());
    const form = useForm({ title: '', idempotency_key: key });
    const busy = useRef(false);
    function submit(event: FormEvent) {
        event.preventDefault();
        if (busy.current || !form.data.title.trim()) return;
        busy.current = true;
        form.post('/chats', {
            onSuccess: () => {
                setOpen(false);
                form.setData({
                    title: '',
                    idempotency_key: crypto.randomUUID(),
                });
            },
            onFinish: () => {
                busy.current = false;
            },
        });
    }
    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                if (!form.processing) setOpen(value);
            }}
        >
            <DialogTrigger asChild>
                <Button
                    size="icon"
                    className="sw-primary"
                    aria-label="Create chat"
                    title="Create chat"
                >
                    <Plus />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create chat</DialogTitle>
                    <DialogDescription>
                        Start a shared team discussion. You can link work pages
                        later.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="sw-create-form">
                    <label htmlFor="new-chat-title">Chat name</label>
                    <Input
                        id="new-chat-title"
                        value={form.data.title}
                        onChange={(event) =>
                            form.setData('title', event.target.value)
                        }
                        maxLength={255}
                        required
                        disabled={form.processing}
                        aria-invalid={Boolean(form.errors.title)}
                    />
                    <InputError
                        message={
                            form.errors.title || form.errors.idempotency_key
                        }
                    />
                    <Button
                        type="submit"
                        className="sw-primary"
                        disabled={form.processing || !form.data.title.trim()}
                    >
                        {form.processing ? 'Creating…' : 'Create chat'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function ChatListPanel({
    discovery,
    selectedId,
}: {
    discovery: ChatDiscovery;
    selectedId?: string;
}) {
    const { url } = usePage();
    const { surface, filters, chats } = discovery;
    const title = surface === 'activity' ? 'Activity' : 'Chats';
    const page = new URL(url, 'https://sidewire.invalid').searchParams.get(
        'page',
    );
    const currentPath = selectedId ? `/chats/${selectedId}` : `/${surface}`;
    function filter(next: Partial<ChatDiscovery['filters']>) {
        router.visit(
            chatDiscoveryUrl(currentPath, {
                ...discovery,
                filters: { ...filters, ...next },
            }),
            { preserveScroll: true, preserveState: true },
        );
    }
    return (
        <section
            id="chat-list"
            tabIndex={-1}
            className="sw-chat-list"
            aria-label={`${title} list`}
        >
            <header className="sw-list-header">
                <div className="sw-list-heading">
                    <h2>{title}</h2>
                    <span className="sw-count">{chats.total}</span>
                    <CreateChat />
                </div>
                <div
                    className="sw-segments"
                    role="group"
                    aria-label="Read filter"
                >
                    <button
                        type="button"
                        aria-pressed={filters.view === 'all'}
                        onClick={() => filter({ view: 'all' })}
                    >
                        All
                    </button>
                    <button
                        type="button"
                        aria-pressed={filters.view === 'unread'}
                        onClick={() => filter({ view: 'unread' })}
                    >
                        Unread
                    </button>
                </div>
                {(filters.query || filters.app) && (
                    <div className="sw-active-filter">
                        <span>
                            {filters.query
                                ? `Search: ${filters.query}`
                                : filters.app}
                        </span>
                        <button
                            type="button"
                            onClick={() => filter({ query: '', app: '' })}
                            aria-label="Clear search and app filters"
                        >
                            <X />
                        </button>
                    </div>
                )}
            </header>
            <div className="sw-list-scroll" {...{ 'scroll-region': '' }}>
                {chats.items.length === 0 && (
                    <div className="sw-list-empty">
                        <MessageSquarePlus aria-hidden="true" />
                        <h3>
                            {filters.view === 'unread'
                                ? 'Nothing unread'
                                : filters.query || filters.app
                                  ? 'No matching chats'
                                  : surface === 'activity'
                                    ? 'No activity yet'
                                    : 'No chats yet'}
                        </h3>
                        <p>
                            {surface === 'activity'
                                ? 'Updates from chats you open or participate in appear here.'
                                : 'Create a chat to start a discussion with your team.'}
                        </p>
                    </div>
                )}
                <ul>
                    {chats.items.map((chat) => {
                        const destination = chatDiscoveryUrl(
                            `/chats/${chat.id}`,
                            discovery,
                            page,
                        );
                        const hash =
                            surface === 'activity' && chat.latest_message
                                ? `#message-${chat.latest_message.id}`
                                : '';
                        return (
                            <li key={chat.id}>
                                <Link
                                    className="sw-chat-row"
                                    href={`${destination}${hash}`}
                                    aria-current={
                                        selectedId === chat.id
                                            ? 'page'
                                            : undefined
                                    }
                                    preserveScroll
                                >
                                    <div className="sw-row-heading">
                                        <h3>{chat.title}</h3>
                                        {chat.latest_message && (
                                            <time
                                                dateTime={
                                                    chat.latest_message
                                                        .created_at
                                                }
                                            >
                                                {new Intl.DateTimeFormat(
                                                    undefined,
                                                    {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    },
                                                ).format(
                                                    new Date(
                                                        chat.latest_message
                                                            .created_at,
                                                    ),
                                                )}
                                            </time>
                                        )}
                                    </div>
                                    <p className="sw-preview">
                                        {chat.latest_message && (
                                            <strong>
                                                {
                                                    chat.latest_message.author
                                                        .name
                                                }
                                                :{' '}
                                            </strong>
                                        )}
                                        {chat.latest_message?.body ??
                                            'No messages yet'}
                                    </p>
                                    <div className="sw-row-meta">
                                        <span>
                                            {[
                                                ...new Set(
                                                    chat.linked_pages.map(
                                                        (linked) => linked.host,
                                                    ),
                                                ),
                                            ].join(' · ') || 'No linked pages'}
                                        </span>
                                        {chat.unread_count > 0 && (
                                            <span className="sw-unread">
                                                {chat.unread_count} unread
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <footer className="sw-list-footer">
                <span>
                    {chats.items.length} of {chats.total}
                </span>
                <nav aria-label={`${title} pagination`}>
                    {chats.previousPageUrl && (
                        <Link href={chats.previousPageUrl}>Previous</Link>
                    )}
                    {chats.nextPageUrl && (
                        <Link href={chats.nextPageUrl}>Next</Link>
                    )}
                </nav>
            </footer>
        </section>
    );
}
