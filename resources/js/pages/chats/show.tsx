import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { useChatUiCache } from '@/components/application-shell/chat-ui-cache';
import { ChatComposer } from '@/components/chats/chat-composer';
import { ChatHeader } from '@/components/chats/chat-header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { echo } from '@/echo';
import { useInitials } from '@/hooks/use-initials';
import { chatDiscoveryUrl } from '@/lib/chat-navigation';
import type { Chat, ChatDiscovery } from '@/types/chat';

type Props = ChatDiscovery & {
    chat: Chat;
    idempotencyKey: string;
    organizationId: number;
    lastMessageId: string | null;
};

function ChatView({
    chat,
    idempotencyKey,
    organizationId,
    lastMessageId,
    ...discovery
}: Props) {
    const cache = useChatUiCache();
    const history = useRef<HTMLDivElement>(null);
    const lastArticle = useRef<HTMLElement>(null);
    const markedRead = useRef<string | null>(null);
    const followLatest = useRef(false);
    const initials = useInitials();
    const { url } = usePage();
    const page = new URL(url, 'https://sidewire.invalid').searchParams.get(
        'page',
    );

    useEffect(() => {
        const realtime = echo;
        if (!realtime) return;
        const channel = `organizations.${organizationId}.conversations.${chat.id}`;
        realtime
            .private(channel)
            .listen('.message.created', () =>
                router.reload({ only: ['chat', 'chats', 'lastMessageId'] }),
            );
        return () => {
            realtime.leave(channel);
        };
    }, [chat.id, organizationId]);

    useEffect(() => {
        const container = history.current;
        if (!container) return;
        // Existing Inertia scroll regions handle history navigation; this cache also
        // restores explicitly reopened chats without changing a draft's destination.
        container.scrollTop = cache.scroll.get(chat.id) ?? 0;
        followLatest.current =
            container.scrollHeight -
                container.scrollTop -
                container.clientHeight <
            64;
    }, [cache, chat.id]);

    useEffect(() => {
        if (followLatest.current && history.current)
            history.current.scrollTop = history.current.scrollHeight;
    }, [lastMessageId]);

    useEffect(() => {
        const hash = url.split('#')[1] || window.location.hash.slice(1);
        if (!hash.startsWith('message-')) return;
        const target = document.getElementById(hash);
        if (target && history.current?.contains(target))
            target.scrollIntoView({ block: 'center' });
    }, [url, chat.id]);

    useEffect(() => {
        const container = history.current;
        const article = lastArticle.current;
        if (!container || !article || !lastMessageId) return;
        let visible = false;
        function markRead() {
            if (
                !visible ||
                document.visibilityState !== 'visible' ||
                markedRead.current === lastMessageId
            )
                return;
            markedRead.current = lastMessageId;
            router.post(
                `/chats/${chat.id}/read`,
                { message_id: lastMessageId },
                {
                    preserveScroll: true,
                    preserveState: true,
                    only: ['chats'],
                    onError: () => {
                        markedRead.current = null;
                    },
                },
            );
        }
        const observer = new IntersectionObserver(
            ([entry]) => {
                visible = entry.isIntersecting;
                markRead();
            },
            { root: container, threshold: 0.1 },
        );
        observer.observe(article);
        document.addEventListener('visibilitychange', markRead);
        return () => {
            observer.disconnect();
            document.removeEventListener('visibilitychange', markRead);
        };
    }, [chat.id, lastMessageId]);

    return (
        <section className="sw-chat-view" aria-label={chat.title}>
            <ChatHeader
                chat={chat}
                backUrl={chatDiscoveryUrl(
                    `/${discovery.surface}`,
                    discovery,
                    page,
                )}
            />
            <div
                className="sw-history"
                ref={history}
                role="region"
                aria-label="Chat messages"
                tabIndex={0}
                {...{ 'scroll-region': '' }}
                onScroll={() => {
                    const container = history.current;
                    if (!container) return;
                    cache.scroll.set(chat.id, container.scrollTop);
                    followLatest.current =
                        container.scrollHeight -
                            container.scrollTop -
                            container.clientHeight <
                        64;
                }}
            >
                {chat.messages.length === 0 && (
                    <div className="sw-message-empty">
                        <h2>No messages yet</h2>
                        <p>Start the conversation below.</p>
                    </div>
                )}
                {chat.messages.map((message, index) => {
                    const date = new Date(message.createdAt);
                    const previous =
                        index > 0
                            ? new Date(chat.messages[index - 1].createdAt)
                            : null;
                    return (
                        <div key={message.id}>
                            {(!previous ||
                                previous.toDateString() !==
                                    date.toDateString()) && (
                                <div className="sw-date-divider">
                                    <span>
                                        {new Intl.DateTimeFormat(undefined, {
                                            dateStyle: 'long',
                                        }).format(date)}
                                    </span>
                                </div>
                            )}
                            <article
                                id={`message-${message.id}`}
                                ref={
                                    message.id === lastMessageId
                                        ? lastArticle
                                        : undefined
                                }
                                className="sw-message"
                            >
                                <Avatar
                                    className="sw-avatar"
                                    aria-hidden="true"
                                >
                                    <AvatarFallback>
                                        {initials(message.author.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="sw-message-content">
                                    <div className="sw-message-meta">
                                        <h2>{message.author.name}</h2>
                                        <time
                                            dateTime={message.createdAt}
                                            title={date.toLocaleString()}
                                        >
                                            {new Intl.DateTimeFormat(
                                                undefined,
                                                { timeStyle: 'short' },
                                            ).format(date)}
                                        </time>
                                        {message.source && (
                                            <a
                                                href={message.source.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title={`Sent while viewing ${message.source.title} (opens in a new tab)`}
                                            >
                                                From {message.source.host}
                                            </a>
                                        )}
                                    </div>
                                    <p>{message.body}</p>
                                </div>
                            </article>
                        </div>
                    );
                })}
            </div>
            <ChatComposer
                key={chat.id}
                chatId={chat.id}
                title={chat.title}
                idempotencyKey={idempotencyKey}
            />
        </section>
    );
}

export default function ShowChat(props: Props) {
    return (
        <>
            <Head title={props.chat.title} />
            <ChatView key={props.chat.id} {...props} />
        </>
    );
}
ShowChat.layout = { breadcrumbs: [{ title: 'Chats', href: '/chats' }] };
