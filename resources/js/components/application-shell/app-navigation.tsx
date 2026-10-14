import { Link } from '@inertiajs/react';
import {
    Activity,
    ListTodo,
    Bell,
    Globe2,
    Hash,
    MessagesSquare,
} from 'lucide-react';
import { useCollaboration } from '@/components/collaboration/provider';
import { chatDiscoveryUrl } from '@/lib/chat-navigation';
import type { ChatDiscovery } from '@/types/chat';

export function AppNavigation({
    discovery,
    hasOrganization,
    currentUrl = '',
    onNavigate,
    variant = 'sidebar',
}: {
    discovery?: ChatDiscovery;
    hasOrganization: boolean;
    currentUrl?: string;
    onNavigate?: () => void;
    variant?: 'sidebar' | 'bottom';
}) {
    const bottom = variant === 'bottom';
    const path = currentUrl.split('?')[0];
    const view = new URLSearchParams(currentUrl.split('?')[1] ?? '').get(
        'view',
    );
    return (
        <nav
            className={`sw-navigation${bottom ? ' sw-mobile-navigation' : ''}`}
            aria-label={bottom ? 'Mobile navigation' : 'Main navigation'}
        >
            <div className="sw-nav-section">
                {!bottom && <p className="sw-eyebrow">Your team</p>}
                {hasOrganization && (
                    <>
                        <Link
                            href="/messages"
                            onClick={onNavigate}
                            className="sw-nav-link"
                            aria-current={
                                path === '/messages' && view !== 'activity'
                                    ? 'page'
                                    : undefined
                            }
                            title="Messages"
                        >
                            <MessagesSquare aria-hidden="true" />
                            <span>Messages</span>
                            <UnseenBadge kind="direct" />
                        </Link>
                        <Link
                            href="/chats"
                            onClick={onNavigate}
                            className="sw-nav-link"
                            aria-current={
                                discovery?.surface === 'chats' &&
                                (bottom || !discovery.filters.app)
                                    ? 'page'
                                    : undefined
                            }
                            title="Browse and create work chats"
                        >
                            <Hash aria-hidden="true" />
                            <span>Work chats</span>
                            <UnseenBadge kind="work" />
                        </Link>
                        <Link
                            href="/messages?view=activity"
                            onClick={onNavigate}
                            className="sw-nav-link"
                            aria-current={
                                path === '/messages' && view === 'activity'
                                    ? 'page'
                                    : undefined
                            }
                            title="Mentions and replies"
                        >
                            <Bell aria-hidden="true" />
                            <span>Activity</span>
                        </Link>
                        <Link
                            href="/todos"
                            onClick={onNavigate}
                            className="sw-nav-link"
                            aria-current={
                                path === '/todos' ? 'page' : undefined
                            }
                            title="Todos"
                        >
                            <ListTodo aria-hidden="true" />
                            <span>Todos</span>
                        </Link>
                    </>
                )}
            </div>
            {hasOrganization && !bottom && (
                <div className="sw-nav-section sw-apps-section">
                    <p className="sw-eyebrow">Linked work</p>
                    <Link
                        href="/activity"
                        onClick={onNavigate}
                        className="sw-nav-link"
                        aria-current={
                            discovery?.surface === 'activity'
                                ? 'page'
                                : undefined
                        }
                    >
                        <Activity aria-hidden="true" />
                        <span>Work-chat activity</span>
                    </Link>
                    {discovery?.apps.map((app) => (
                        <Link
                            key={app.id}
                            href={chatDiscoveryUrl(`/${discovery.surface}`, {
                                ...discovery,
                                filters: { ...discovery.filters, app: app.id },
                            })}
                            onClick={onNavigate}
                            className="sw-nav-link"
                            aria-current={
                                discovery.filters.app === app.id
                                    ? 'page'
                                    : undefined
                            }
                            title={app.label}
                        >
                            <Globe2 aria-hidden="true" />
                            <span className="sw-truncate">{app.label}</span>
                        </Link>
                    ))}
                    {!discovery?.apps.length && (
                        <p className="sw-nav-hint">
                            Browse work chats to find conversations linked to
                            your tools.
                        </p>
                    )}
                </div>
            )}
            {!bottom && (
                <div className="sw-nav-note">
                    Your conversations.
                    <br />
                    Alongside your work.
                </div>
            )}
        </nav>
    );
}

function UnseenBadge({ kind }: { kind: 'direct' | 'work' }) {
    const { unreadTotals } = useCollaboration();
    const count = unreadTotals?.[kind] ?? 0;
    if (count <= 0) return null;
    return (
        <span
            className="sw-nav-unseen-badge"
            role="img"
            aria-label={`${count} unseen messages`}
            title={`${count} unseen messages`}
        >
            {count > 99 ? '99+' : count}
        </span>
    );
}
