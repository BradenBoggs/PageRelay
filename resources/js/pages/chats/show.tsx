import { Form, Head, router, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { echo } from '@/echo';
import { useInitials } from '@/hooks/use-initials';

type Chat = {
    id: string;
    title: string;
    linkedPages: Array<{
        id: string;
        title: string;
        host: string;
        url: string;
    }>;
    messages: Array<{
        id: string;
        body: string;
        createdAt: string;
        author: { id: number; name: string };
        source: { title: string; host: string; url: string } | null;
    }>;
};

export default function ShowChat({
    chat,
    idempotencyKey,
    organizationId,
    lastMessageId,
}: {
    chat: Chat;
    idempotencyKey: string;
    organizationId: number;
    lastMessageId: string | null;
}) {
    const markedRead = useRef<string | null>(null);
    const { auth } = usePage().props;
    const getInitials = useInitials();

    useEffect(() => {
        const realtime = echo;
        if (!realtime) return;
        const channelName = `organizations.${organizationId}.conversations.${chat.id}`;
        realtime.private(channelName).listen('.message.created', () => {
            router.reload({ only: ['chat'] });
        });

        return () => {
            realtime.leave(channelName);
        };
    }, [chat.id, organizationId]);

    useEffect(() => {
        if (!lastMessageId) return;

        const markVisibleMessagesRead = () => {
            if (
                document.visibilityState !== 'visible' ||
                markedRead.current === lastMessageId
            ) {
                return;
            }

            markedRead.current = lastMessageId;
            router.post(
                `/chats/${chat.id}/read`,
                { message_id: lastMessageId },
                {
                    preserveScroll: true,
                    preserveState: true,
                    only: [],
                    onError: () => {
                        markedRead.current = null;
                    },
                },
            );
        };

        markVisibleMessagesRead();
        document.addEventListener('visibilitychange', markVisibleMessagesRead);

        return () => {
            document.removeEventListener(
                'visibilitychange',
                markVisibleMessagesRead,
            );
        };
    }, [chat.id, lastMessageId]);

    return (
        <>
            <Head title={chat.title} />
            <div className="mx-auto flex h-full w-full max-w-4xl flex-1 flex-col overflow-hidden p-4 sm:p-6">
                <header className="border-border border-b pb-4">
                    <p className="text-muted-foreground text-sm">Page chat</p>
                    <h1 className="mt-1 text-2xl font-semibold">
                        {chat.title}
                    </h1>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {chat.linkedPages.length === 0 && (
                            <p className="text-muted-foreground text-sm">
                                This historical chat has no currently linked
                                pages.
                            </p>
                        )}
                        {chat.linkedPages.map((page) => (
                            <a
                                key={page.id}
                                className="border-border hover:bg-accent rounded-md border px-3 py-1.5 text-sm"
                                href={page.url}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {page.title} · {page.host}
                            </a>
                        ))}
                    </div>
                </header>

                <section
                    className="min-h-0 flex-1 space-y-6 overflow-y-auto py-6"
                    aria-label="Chat messages"
                    aria-live="polite"
                >
                    {chat.messages.length === 0 && (
                        <div className="py-12 text-center">
                            <h2 className="font-medium">No messages yet</h2>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Start the conversation below.
                            </p>
                        </div>
                    )}
                    {chat.messages.map((message) => {
                        const isOwnMessage = message.author.id === auth.user.id;

                        return (
                            <article
                                id={`message-${message.id}`}
                                key={message.id}
                                className={`flex scroll-mt-6 items-end gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                            >
                                <Avatar
                                    className="size-9 border shadow-xs"
                                    aria-hidden="true"
                                >
                                    <AvatarFallback className="bg-muted text-xs font-medium">
                                        {getInitials(message.author.name)}
                                    </AvatarFallback>
                                </Avatar>

                                <div
                                    className={`flex min-w-0 max-w-[85%] flex-col space-y-1.5 sm:max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'}`}
                                >
                                    <div
                                        className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${isOwnMessage ? 'justify-end' : ''}`}
                                    >
                                        <h2 className="text-sm font-medium">
                                            {isOwnMessage
                                                ? 'You'
                                                : message.author.name}
                                        </h2>
                                        <time
                                            className="text-muted-foreground text-xs"
                                            dateTime={message.createdAt}
                                        >
                                            {new Intl.DateTimeFormat(
                                                undefined,
                                                {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short',
                                                },
                                            ).format(
                                                new Date(message.createdAt),
                                            )}
                                        </time>
                                    </div>
                                    <div
                                        className={`rounded-xl border px-4 py-3 shadow-xs ${isOwnMessage ? 'border-primary bg-primary text-primary-foreground' : 'bg-card'}`}
                                    >
                                        <p className="text-sm leading-6 break-words whitespace-pre-wrap">
                                            {message.body}
                                        </p>
                                    </div>
                                    {message.source && (
                                        <Badge variant="outline" asChild>
                                            <a
                                                href={message.source.url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Sent while viewing{' '}
                                                {message.source.host}
                                            </a>
                                        </Badge>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </section>

                <Form
                    action={`/chats/${chat.id}/messages`}
                    method="post"
                    resetOnSuccess
                    className="border-border space-y-2 border-t pt-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <input
                                type="hidden"
                                name="idempotency_key"
                                value={idempotencyKey}
                            />
                            <label className="sr-only" htmlFor="chat-body">
                                Message this chat
                            </label>
                            <textarea
                                id="chat-body"
                                name="body"
                                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2"
                                maxLength={10000}
                                placeholder="Write a message…"
                                disabled={processing}
                            />
                            <InputError message={errors.body} />
                            <div className="flex justify-end">
                                <Button disabled={processing}>
                                    {processing ? 'Sending…' : 'Send'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

ShowChat.layout = {
    breadcrumbs: [{ title: 'Chats', href: '/chats' }],
};
