import { Head, Link, router } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Surface = 'activity' | 'chats';

type ChatSummary = {
    id: string;
    title: string;
    web_url: string;
    message_count: number;
    unread_count: number;
    linked_pages: Array<{
        id: string;
        title: string;
        host: string;
        url: string;
    }>;
    latest_message: {
        id: string;
        body: string;
        created_at: string;
        author: { id: number; name: string };
        source: {
            id: string;
            title: string;
            host: string;
            url: string;
        } | null;
    } | null;
};

type ChatsPage = {
    items: ChatSummary[];
    previousPageUrl: string | null;
    nextPageUrl: string | null;
};

type Filters = {
    view: 'all' | 'unread';
    query: string;
    app: string;
};

export default function ChatsIndex({
    surface,
    filters,
    apps,
    chats,
}: {
    surface: Surface;
    filters: Filters;
    apps: Array<{ id: string; label: string }>;
    chats: ChatsPage;
}) {
    const [query, setQuery] = useState(filters.query);
    const path = surface === 'activity' ? '/activity' : '/chats';
    const title = surface === 'activity' ? 'Activity' : 'Chats';

    function visit(next: Partial<Filters>) {
        const values = { ...filters, ...next };
        router.get(
            path,
            {
                ...(values.view === 'unread' ? { view: 'unread' } : {}),
                ...(values.query ? { query: values.query } : {}),
                ...(values.app ? { app: values.app } : {}),
            },
            { preserveState: true, replace: true },
        );
    }

    function search(event: FormEvent) {
        event.preventDefault();
        visit({ query: query.trim() });
    }

    return (
        <>
            <Head title={title} />
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 sm:p-6">
                <header>
                    <h1 className="text-2xl font-semibold">{title}</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {surface === 'activity'
                            ? 'Catch up on discussions you have opened or participated in.'
                            : 'Find discussions from work pages across your organization.'}
                    </p>
                </header>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <form
                        className="flex min-w-0 flex-1 gap-2"
                        onSubmit={search}
                    >
                        <label className="sr-only" htmlFor="chat-query">
                            Search {title.toLowerCase()}
                        </label>
                        <Input
                            id="chat-query"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            maxLength={100}
                            placeholder="Search chats"
                        />
                        <Button variant="outline">Search</Button>
                    </form>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            size="sm"
                            variant={
                                filters.view === 'all' ? 'secondary' : 'ghost'
                            }
                            aria-pressed={filters.view === 'all'}
                            onClick={() => visit({ view: 'all' })}
                        >
                            All
                        </Button>
                        <Button
                            size="sm"
                            variant={
                                filters.view === 'unread'
                                    ? 'secondary'
                                    : 'ghost'
                            }
                            aria-pressed={filters.view === 'unread'}
                            onClick={() => visit({ view: 'unread' })}
                        >
                            Unread
                        </Button>
                        <label className="sr-only" id="app-filter-label">
                            Filter by App
                        </label>
                        <Select
                            value={filters.app || 'all'}
                            onValueChange={(value) =>
                                visit({ app: value === 'all' ? '' : value })
                            }
                        >
                            <SelectTrigger
                                className="max-w-56"
                                size="sm"
                                aria-labelledby="app-filter-label"
                            >
                                <SelectValue placeholder="All Apps" />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="all">All Apps</SelectItem>
                                {apps.map((app) => (
                                    <SelectItem key={app.id} value={app.id}>
                                        {app.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {chats.items.length === 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {filters.view === 'unread'
                                    ? 'Nothing unread'
                                    : filters.query || filters.app
                                      ? 'No matching chats'
                                      : surface === 'activity'
                                        ? 'No activity yet'
                                        : 'No chats yet'}
                            </CardTitle>
                            <CardDescription>
                                {surface === 'activity'
                                    ? 'Open or join a page chat and new activity will appear here.'
                                    : 'Start a discussion from the SideWire panel on a work page.'}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    <Card className="gap-0 py-0">
                        <CardContent className="px-0">
                            <ul className="divide-border divide-y">
                                {chats.items.map((chat) => {
                                    const destination =
                                        surface === 'activity' &&
                                        chat.latest_message
                                            ? `${chat.web_url}#message-${chat.latest_message.id}`
                                            : chat.web_url;

                                    return (
                                        <li key={chat.id}>
                                            <Link
                                                href={destination}
                                                className="focus-visible:ring-ring/50 hover:bg-accent/50 block rounded-xl px-5 py-4 outline-none focus-visible:ring-2 sm:px-6"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h2 className="truncate font-medium">
                                                                {chat.title}
                                                            </h2>
                                                            {chat.unread_count >
                                                                0 && (
                                                                <Badge>
                                                                    {
                                                                        chat.unread_count
                                                                    }{' '}
                                                                    unread
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm break-words">
                                                            {chat.latest_message
                                                                ?.body ??
                                                                'No message preview available.'}
                                                        </p>
                                                    </div>
                                                    {chat.latest_message && (
                                                        <time
                                                            className="text-muted-foreground shrink-0 text-xs"
                                                            dateTime={
                                                                chat
                                                                    .latest_message
                                                                    .created_at
                                                            }
                                                        >
                                                            {new Intl.DateTimeFormat(
                                                                undefined,
                                                                {
                                                                    dateStyle:
                                                                        'medium',
                                                                },
                                                            ).format(
                                                                new Date(
                                                                    chat
                                                                        .latest_message
                                                                        .created_at,
                                                                ),
                                                            )}
                                                        </time>
                                                    )}
                                                </div>

                                                <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                                                    <span>
                                                        {chat.message_count}{' '}
                                                        {chat.message_count ===
                                                        1
                                                            ? 'message'
                                                            : 'messages'}
                                                    </span>
                                                    {chat.latest_message && (
                                                        <span>
                                                            Latest by{' '}
                                                            {
                                                                chat
                                                                    .latest_message
                                                                    .author.name
                                                            }
                                                        </span>
                                                    )}
                                                    {chat.latest_message
                                                        ?.source && (
                                                        <span>
                                                            Sent while viewing{' '}
                                                            {
                                                                chat
                                                                    .latest_message
                                                                    .source.host
                                                            }
                                                        </span>
                                                    )}
                                                    {chat.linked_pages.length >
                                                    0 ? (
                                                        <span className="truncate">
                                                            {chat.linked_pages
                                                                .map(
                                                                    (page) =>
                                                                        page.host,
                                                                )
                                                                .join(' · ')}
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            No currently linked
                                                            pages
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {(chats.previousPageUrl || chats.nextPageUrl) && (
                    <nav
                        className="flex items-center justify-between"
                        aria-label={`${title} pagination`}
                    >
                        {chats.previousPageUrl ? (
                            <Button variant="outline" asChild>
                                <Link href={chats.previousPageUrl}>
                                    Previous
                                </Link>
                            </Button>
                        ) : (
                            <span />
                        )}
                        {chats.nextPageUrl ? (
                            <Button variant="outline" asChild>
                                <Link href={chats.nextPageUrl}>Next</Link>
                            </Button>
                        ) : (
                            <span />
                        )}
                    </nav>
                )}
            </div>
        </>
    );
}

ChatsIndex.layout = {
    breadcrumbs: [{ title: 'Chats', href: '/chats' }],
};
