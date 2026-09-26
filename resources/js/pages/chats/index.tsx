import { Head } from '@inertiajs/react';
import { MessagesSquare } from 'lucide-react';

export default function ChatsIndex({ surface }: { surface: 'activity' | 'chats' }) {
    return (
        <>
            <Head title={surface === 'activity' ? 'Activity' : 'Chats'} />
            <section className="sw-selection-empty">
                <MessagesSquare aria-hidden="true" />
                <h1>Your work, in conversation.</h1>
                <p>Select a chat to catch up, or create a new one for your team.</p>
                <span>Same history. Every linked page.</span>
            </section>
        </>
    );
}

ChatsIndex.layout = { breadcrumbs: [{ title: 'Chats', href: '/chats' }] };
