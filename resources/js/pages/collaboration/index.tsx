import { Head } from '@inertiajs/react';
import { CollaborationBoard } from '@/components/collaboration/workspace';

export default function Communication() {
    const query = new URLSearchParams(
        typeof window === 'undefined' ? '' : window.location.search,
    );
    return (
        <>
            <Head title="Messages" />
            <CollaborationBoard
                initialChat={query.get('chat')}
                initialThread={query.get('thread')}
                initialMessage={query.get('message')}
            />
        </>
    );
}
