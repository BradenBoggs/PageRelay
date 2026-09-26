import { Link } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, Link2 } from 'lucide-react';
import type { Chat } from '@/types/chat';

export function ChatHeader({ chat, backUrl }: { chat: Chat; backUrl: string }) {
    return (
        <>
            <header className="sw-chat-header">
                <Link className="sw-back" href={backUrl} aria-label="Back to chat list"><ArrowLeft /></Link>
                <div className="sw-chat-heading"><h1>{chat.title}</h1><p>Shared team chat</p></div>
                <span className="sw-chat-scope">Visible to your organization</span>
            </header>
            <nav className="sw-linked-pages" aria-label="Linked pages">
                <span className="sw-linked-label"><Link2 aria-hidden="true" />Linked pages</span>
                {chat.linkedPages.length === 0 ? <span className="sw-muted">No pages linked. This chat still belongs to your team.</span> : chat.linkedPages.map((page) => (
                    <a key={page.id} href={page.url} target="_blank" rel="noopener noreferrer" title={`${page.title} — ${page.host} (opens in a new tab)`}><span>{page.title}</span><span className="sw-source-host">{page.host}</span><ExternalLink aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
                ))}
            </nav>
        </>
    );
}
