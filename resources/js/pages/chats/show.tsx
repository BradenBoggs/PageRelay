import { Head } from '@inertiajs/react';
import { ChatHeader } from '@/components/chats/chat-header';
import { ConversationView } from '@/components/collaboration/workspace';
import { chatDiscoveryUrl } from '@/lib/chat-navigation';
import type { Chat, ChatDiscovery } from '@/types/chat';

type Props = ChatDiscovery & { chat: Chat; idempotencyKey: string; organizationId: number; lastMessageId: string | null };
export default function ShowChat({ chat, ...discovery }: Props) {
    return <><Head title={chat.title} /><ChatHeader chat={chat} backUrl={chatDiscoveryUrl(`/${discovery.surface}`, discovery, null)} /><ConversationView key={chat.id} chatId={chat.id} /></>;
}
ShowChat.layout = { breadcrumbs: [{ title: 'Chats', href: '/chats' }] };
