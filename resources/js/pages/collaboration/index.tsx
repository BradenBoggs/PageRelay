import { Head, usePage } from '@inertiajs/react';
import { CollaborationBoard } from '@/components/collaboration/workspace';

export default function Communication() {
    const { url } = usePage();
    const query = new URLSearchParams(url.split('?')[1] ?? '');
    const view = query.get('view');
    const initialView = view === 'activity' ? 'activity' : 'direct';
    return (
        <>
            <Head title="Messages" />
            <CollaborationBoard
                key={`${initialView}:${query.get('chat') ?? ''}:${query.get('thread') ?? ''}:${query.get('message') ?? ''}`}
                initialView={initialView}
                directOnly={initialView === 'direct'}
                initialChat={query.get('chat')}
                initialThread={query.get('thread')}
                initialMessage={query.get('message')}
            />
        </>
    );
}
