import type { ComponentProps } from 'react';
import ChatsIndex from '@/pages/chats/index';

export default function ActivityIndex(
    props: ComponentProps<typeof ChatsIndex>,
) {
    return <ChatsIndex {...props} />;
}

ActivityIndex.layout = {
    breadcrumbs: [{ title: 'Activity', href: '/activity' }],
};
