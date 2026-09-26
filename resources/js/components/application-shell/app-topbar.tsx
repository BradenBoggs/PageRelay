import { Link, router } from '@inertiajs/react';
import { Building2, Menu, Search, Unplug } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import type { Organization, User } from '@/types';

export function AppTopbar({
    user,
    organization,
    onOpenNavigation,
}: {
    user: User;
    organization: Organization | null;
    onOpenNavigation: () => void;
}) {
    const [query, setQuery] = useState('');
    const input = useRef<HTMLInputElement>(null);
    const initials = useInitials();
    useEffect(() => {
        function shortcut(event: KeyboardEvent) {
            if (
                (event.metaKey || event.ctrlKey) &&
                event.key.toLowerCase() === 'k' &&
                !event.altKey &&
                organization
            ) {
                event.preventDefault();
                input.current?.focus();
            }
        }
        document.addEventListener('keydown', shortcut);
        return () => document.removeEventListener('keydown', shortcut);
    }, [organization]);
    function search(event: FormEvent) {
        event.preventDefault();
        router.get('/chats', query.trim() ? { query: query.trim() } : {});
    }
    return (
        <header className="sw-topbar">
            <Button
                variant="ghost"
                size="icon"
                className="sw-menu-toggle"
                aria-label="Open navigation"
                onClick={onOpenNavigation}
            >
                <Menu />
            </Button>
            <Link
                href={organization ? '/chats' : '/dashboard'}
                className="sw-brand"
            >
                <Unplug aria-hidden="true" />
                <span>SideWire</span>
            </Link>
            {organization && (
                <span className="sw-organization" title={organization.name}>
                    <Building2 aria-hidden="true" />
                    <span className="sw-truncate">{organization.name}</span>
                </span>
            )}
            {organization && (
                <form
                    className="sw-global-search"
                    onSubmit={search}
                    role="search"
                >
                    <Search aria-hidden="true" />
                    <label className="sr-only" htmlFor="shell-search">
                        Search SideWire chats
                    </label>
                    <input
                        id="shell-search"
                        ref={input}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        maxLength={100}
                        placeholder="Search chats and linked pages"
                    />
                    <button
                        type="submit"
                        aria-label="Search chats"
                        title="Search chats (Ctrl or Command + K to focus)"
                    >
                        <Search aria-hidden="true" />
                    </button>
                </form>
            )}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="sw-account"
                        aria-label={`Account menu for ${user.name}`}
                    >
                        <Avatar className="sw-avatar">
                            <AvatarFallback>
                                {initials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="sw-account-name">{user.name}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <UserMenuContent user={user} />
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
