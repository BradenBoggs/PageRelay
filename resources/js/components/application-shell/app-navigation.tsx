import { Link } from '@inertiajs/react';
import { Activity, Bell, Globe2, Hash, LayoutGrid, MessageCircle, MessagesSquare } from 'lucide-react';
import { chatDiscoveryUrl } from '@/lib/chat-navigation';
import type { ChatDiscovery } from '@/types/chat';

export function AppNavigation({ discovery, hasOrganization, currentUrl = '', onNavigate }: { discovery?: ChatDiscovery; hasOrganization: boolean; currentUrl?: string; onNavigate?: () => void }) {
    const path = currentUrl.split('?')[0];
    const view = new URLSearchParams(currentUrl.split('?')[1] ?? '').get('view');
    return <nav className="sw-navigation" aria-label="Main navigation">
        <div className="sw-nav-section"><p className="sw-eyebrow">Your team</p>
            {hasOrganization && <>
                <Link href="/messages" onClick={onNavigate} className="sw-nav-link" aria-current={path === '/messages' && view !== 'direct' && view !== 'activity' ? 'page' : undefined} title="Messages"><MessagesSquare aria-hidden="true" /><span>Messages</span></Link>
                <Link href="/messages?view=direct" onClick={onNavigate} className="sw-nav-link" aria-current={path === '/messages' && view === 'direct' ? 'page' : undefined} title="Direct messages"><MessageCircle aria-hidden="true" /><span>Direct</span></Link>
                <Link href="/messages?view=activity" onClick={onNavigate} className="sw-nav-link" aria-current={path === '/messages' && view === 'activity' ? 'page' : undefined} title="Mentions and replies"><Bell aria-hidden="true" /><span>Activity</span></Link>
                <Link href="/chats" onClick={onNavigate} className="sw-nav-link" aria-current={discovery?.surface === 'chats' && !discovery.filters.app ? 'page' : undefined} title="Browse and create work chats"><Hash aria-hidden="true" /><span>Work chats</span></Link>
            </>}
            <Link href="/dashboard" onClick={onNavigate} className="sw-nav-link" aria-current={path === '/dashboard' ? 'page' : undefined} title="Workspace overview"><LayoutGrid aria-hidden="true" /><span>Overview</span></Link>
        </div>
        {hasOrganization && <div className="sw-nav-section sw-apps-section"><p className="sw-eyebrow">Linked work</p>
            <Link href="/activity" onClick={onNavigate} className="sw-nav-link" aria-current={discovery?.surface === 'activity' ? 'page' : undefined}><Activity aria-hidden="true" /><span>Work-chat activity</span></Link>
            {discovery?.apps.map((app) => <Link key={app.id} href={chatDiscoveryUrl(`/${discovery.surface}`, { ...discovery, filters: { ...discovery.filters, app: app.id } })} onClick={onNavigate} className="sw-nav-link" aria-current={discovery.filters.app === app.id ? 'page' : undefined} title={app.label}><Globe2 aria-hidden="true" /><span className="sw-truncate">{app.label}</span></Link>)}
            {!discovery?.apps.length && <p className="sw-nav-hint">Browse work chats to find conversations linked to your tools.</p>}
        </div>}
        <div className="sw-nav-note">Your conversations.<br />Alongside your work.</div>
    </nav>;
}
