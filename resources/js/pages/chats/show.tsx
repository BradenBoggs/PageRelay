import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { ChatHeader } from '@/components/chats/chat-header';
import { ConversationView } from '@/components/collaboration/workspace';
import { chatDiscoveryUrl } from '@/lib/chat-navigation';
import type { Chat, ChatDiscovery } from '@/types/chat';

type Props = ChatDiscovery & {
    chat: Chat;
    idempotencyKey: string;
    organizationId: number;
    lastMessageId: string | null;
};
export default function ShowChat({ chat, ...discovery }: Props) {
    const [title, setTitle] = useState(chat.title);
    return (
        <>
            <Head title={title} />
            <ChatHeader
                chat={{ ...chat, title }}
                backUrl={chatDiscoveryUrl(
                    `/${discovery.surface}`,
                    discovery,
                    null,
                )}
            />
            <ConversationView
                key={chat.id}
                chatId={chat.id}
                onRenamed={setTitle}
            />
        </>
    );
}
ShowChat.layout = { breadcrumbs: [{ title: 'Chats', href: '/chats' }] };
