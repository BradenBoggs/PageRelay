import { Link } from '@inertiajs/react';
import { Activity, Globe2, LayoutGrid, MessageSquare } from 'lucide-react';
import { chatDiscoveryUrl } from '@/lib/chat-navigation';
import type { ChatDiscovery } from '@/types/chat';

export function AppNavigation({
    discovery,
    hasOrganization,
    onNavigate,
}: {
    discovery?: ChatDiscovery;
    hasOrganization: boolean;
    onNavigate?: () => void;
}) {
    return (
        <nav className="sw-navigation" aria-label="Main navigation">
            <div className="sw-nav-section">
                <p className="sw-eyebrow">Your team</p>
                {hasOrganization && (
                    <>
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
                            <Activity aria-hidden="true" /> Activity
                        </Link>
                        <Link
                            href="/chats"
                            onClick={onNavigate}
                            className="sw-nav-link"
                            aria-current={
                                discovery?.surface === 'chats' &&
                                !discovery.filters.app
                                    ? 'page'
                                    : undefined
                            }
                        >
                            <MessageSquare aria-hidden="true" /> Chats
                        </Link>
                    </>
                )}
                <Link
                    href="/dashboard"
                    onClick={onNavigate}
                    className="sw-nav-link"
                >
                    <LayoutGrid aria-hidden="true" /> Overview
                </Link>
            </div>
            {hasOrganization && (
                <div className="sw-nav-section">
                    <p className="sw-eyebrow">Apps</p>
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
                            Apps appear here when pages are linked to your
                            chats.
                        </p>
                    )}
                    <Link
                        href="/chats"
                        onClick={onNavigate}
                        className="sw-nav-link sw-muted"
                    >
                        Browse all chats
                    </Link>
                </div>
            )}
            <div className="sw-nav-note">
                One conversation.
                <br />
                Across your team's tools.
            </div>
        </nav>
    );
}
