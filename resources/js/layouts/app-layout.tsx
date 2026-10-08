import { Link, usePage } from '@inertiajs/react';
import { useMemo, useState, type ReactNode } from 'react';
import { AppNavigation } from '@/components/application-shell/app-navigation';
import { AppTopbar } from '@/components/application-shell/app-topbar';
import { ChatUiCache } from '@/components/application-shell/chat-ui-cache';
import { ChatListPanel } from '@/components/chats/chat-list-panel';
import { CollaborationClient } from '@/components/collaboration/client';
import {
    CollaborationProvider,
    NotificationControls,
} from '@/components/collaboration/workspace';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import type { BreadcrumbItem, Organization, User } from '@/types';
import type { Chat, ChatDiscovery } from '@/types/chat';
import '../../css/application-shell.css';

type ShellProps = Partial<ChatDiscovery> & {
    auth: { user: User };
    organization: Organization | null;
    chat?: Chat;
};

/** Shared frame; collaboration subscription survives navigation between feature pages. */
export default function AppLayout({
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: ReactNode;
}) {
    const { props } = usePage<ShellProps>();
    const [navigationOpen, setNavigationOpen] = useState(false);
    const accountKey = `${props.auth.user.id}:${props.organization?.id ?? 'none'}`;
    const client = useMemo(() => new CollaborationClient(), [accountKey]);
    const discovery: ChatDiscovery | undefined =
        props.surface && props.filters && props.apps && props.chats
            ? {
                  surface: props.surface,
                  filters: props.filters,
                  apps: props.apps,
                  chats: props.chats,
              }
            : undefined;
    const selected = Boolean(discovery && props.chat);
    const navigation = (
        <>
            {props.organization && (
                <Link
                    href="/messages"
                    className="sw-nav-link"
                    onClick={() => setNavigationOpen(false)}
                >
                    Messages, DMs & mentions
                </Link>
            )}
            <AppNavigation
                discovery={discovery}
                hasOrganization={Boolean(props.organization)}
                onNavigate={() => setNavigationOpen(false)}
            />
        </>
    );
    const shell = (
        <ChatUiCache key={accountKey}>
            <div
                className="sw-shell"
                data-discovery={Boolean(discovery)}
                data-selected={selected}
            >
                <a
                    className="sw-skip"
                    href={
                        discovery && !selected ? '#chat-list' : '#main-content'
                    }
                >
                    Skip to content
                </a>
                <AppTopbar
                    user={props.auth.user}
                    organization={props.organization}
                    onOpenNavigation={() => setNavigationOpen(true)}
                />
                <div className="sw-body">
                    <aside className="sw-sidebar">{navigation}</aside>
                    {discovery && (
                        <ChatListPanel
                            discovery={discovery}
                            selectedId={props.chat?.id}
                        />
                    )}
                    <main
                        id="main-content"
                        tabIndex={-1}
                        className={
                            discovery ? 'sw-main' : 'sw-main sw-page-content'
                        }
                    >
                        {props.organization && <NotificationControls />}
                        {children}
                    </main>
                </div>
                <Sheet open={navigationOpen} onOpenChange={setNavigationOpen}>
                    <SheetContent
                        side="left"
                        className="sw-nav-sheet"
                        onCloseAutoFocus={(event) => {
                            event.preventDefault();
                            document
                                .querySelector<HTMLButtonElement>(
                                    '.sw-menu-toggle',
                                )
                                ?.focus();
                        }}
                    >
                        <SheetHeader>
                            <SheetTitle>SideWire</SheetTitle>
                            <SheetDescription>
                                Navigate your team workspace.
                            </SheetDescription>
                        </SheetHeader>
                        {navigation}
                    </SheetContent>
                </Sheet>
            </div>
        </ChatUiCache>
    );
    return props.organization ? (
        <CollaborationProvider
            key={accountKey}
            client={client}
            userId={props.auth.user.id}
            organizationId={props.organization.id}
        >
            {shell}
        </CollaborationProvider>
    ) : (
        shell
    );
}
