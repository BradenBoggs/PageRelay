import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, Link2 } from 'lucide-react';
import { LinkPageDialog } from './link-page-dialog';
import type { Organization } from '@/types';
import type { Chat } from '@/types/chat';

export function ChatHeader({ chat, backUrl }: { chat: Chat; backUrl: string }) {
    const { organization } = usePage<{ organization: Organization | null }>()
        .props;
    const manager =
        organization?.role === 'owner' || organization?.role === 'admin';
    return (
        <>
            <header className="sw-chat-header">
                <Link
                    className="sw-back"
                    href={backUrl}
                    aria-label="Back to chat list"
                >
                    <ArrowLeft />
                </Link>
                <div className="sw-chat-heading">
                    <h1>{chat.title}</h1>
                    <p>Shared team chat</p>
                </div>
                <span className="sw-chat-scope">
                    Visible to your organization
                </span>
                {manager && (
                    <LinkPageDialog chatId={chat.id} chatTitle={chat.title} />
                )}
            </header>
            <nav className="sw-linked-pages" aria-label="Linked pages">
                <span className="sw-linked-label">
                    <Link2 aria-hidden="true" />
                    Linked pages
                </span>
                {chat.linkedPages.length === 0 ? (
                    <span className="sw-muted">
                        No pages linked. This chat still belongs to your team.
                    </span>
                ) : (
                    chat.linkedPages.map((page) => (
                        <span
                            key={page.id}
                            className="flex shrink-0 items-center gap-1"
                        >
                            <a
                                href={page.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`${page.title} — ${page.host} (opens in a new tab)`}
                            >
                                <span>{page.title}</span>
                                <span className="sw-source-host">
                                    {page.host}
                                </span>
                                <ExternalLink aria-hidden="true" />
                                <span className="sr-only">
                                    {' '}
                                    (opens in a new tab)
                                </span>
                            </a>
                            {manager && (
                                <LinkPageDialog
                                    chatId={chat.id}
                                    chatTitle={chat.title}
                                    initialUrl={page.url}
                                />
                            )}
                        </span>
                    ))
                )}
            </nav>
        </>
    );
}
