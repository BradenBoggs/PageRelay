import {
    CheckCheck,
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    ListTodo,
    Search,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { messagePath, type Person, type Todo } from './client';
import { useCollaboration } from './provider';
import { CollaborationDialog, EmptyState, IconButton, InlineError } from './ui';

export function TodoDialog({
    open,
    onOpenChange,
    chatId,
    messageId,
    messageBody,
    todo,
    onSaved,
    inline = false,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    chatId: string;
    messageId: string;
    messageBody: string;
    todo?: Todo | null;
    onSaved?: (todo: Todo) => void;
    inline?: boolean;
}) {
    const { client } = useCollaboration();
    const [title, setTitle] = useState('');
    const [assignee, setAssignee] = useState('');
    const [people, setPeople] = useState<Person[]>([]);
    const [query, setQuery] = useState('');
    const [error, setError] = useState('');
    const [peopleError, setPeopleError] = useState('');
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [snapshot, setSnapshot] = useState<Todo | null>(null);
    const pending = useRef(false);
    const wasOpen = useRef(false);
    useEffect(() => {
        if (open && !wasOpen.current) {
            setTitle(
                todo?.title ?? messageBody.replace(/\s+/g, ' ').slice(0, 200),
            );
            setAssignee(todo?.assignee ? String(todo.assignee.id) : '');
            setSnapshot(todo ?? null);
            setError('');
            setQuery('');
        }
        wasOpen.current = open;
    }, [open, todo, messageBody]);
    useEffect(() => {
        if (!open) return;
        const abort = new AbortController();
        setLoading(true);
        setPeopleError('');
        void client
            .request<{ data: Person[] }>(
                `/members?chat=${chatId}&query=${encodeURIComponent(query)}`,
                { signal: abort.signal },
            )
            .then((result) => {
                if (!abort.signal.aborted) setPeople(result.data);
            })
            .catch((failure: unknown) => {
                if (!abort.signal.aborted) {
                    setPeople([]);
                    setPeopleError(
                        failure instanceof Error
                            ? failure.message
                            : 'Could not load coworkers.',
                    );
                }
            })
            .finally(() => {
                if (!abort.signal.aborted) setLoading(false);
            });
        return () => abort.abort();
    }, [client, open, chatId, query]);
    async function save() {
        if (pending.current || !title.trim()) return;
        pending.current = true;
        setBusy(true);
        setError('');
        try {
            const result = await client.mutate<{ data: Todo }>(
                snapshot
                    ? `/todos/${snapshot.id}`
                    : `/chats/${chatId}/messages/${messageId}/todo`,
                {
                    title: title.trim(),
                    assignee_id: assignee ? Number(assignee) : null,
                    ...(snapshot
                        ? {
                              completed: snapshot.completed,
                              version: snapshot.version,
                          }
                        : {}),
                },
                snapshot ? 'PATCH' : 'POST',
            );
            onSaved?.(result.data);
            onOpenChange(false);
            client.events.dispatchEvent(new Event('changed'));
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : 'Could not save this todo.',
            );
        } finally {
            pending.current = false;
            setBusy(false);
        }
    }
    const selected = people.find((person) => String(person.id) === assignee);
    const form = (
        <div className="sw-todo-form">
            <label>
                Todo title
                <input
                    autoFocus
                    type="text"
                    value={title}
                    maxLength={200}
                    disabled={busy}
                    onChange={(event) => setTitle(event.target.value)}
                />
            </label>
            <label>
                Find assignee
                <input
                    type="search"
                    value={query}
                    disabled={busy}
                    maxLength={100}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search coworkers in this chat"
                />
            </label>
            <label>
                Assign to
                <select
                    value={assignee}
                    disabled={busy || loading}
                    onChange={(event) => setAssignee(event.target.value)}
                >
                    <option value="">Unassigned</option>
                    {assignee && !selected && (
                        <option value={assignee}>
                            {snapshot?.assignee?.name ?? 'Selected coworker'}
                        </option>
                    )}
                    {people.map((person) => (
                        <option key={person.id} value={person.id}>
                            {person.name}
                        </option>
                    ))}
                </select>
            </label>
            {loading && <p role="status">Loading eligible coworkers…</p>}
            {peopleError && <InlineError>{peopleError}</InlineError>}
            <div className="sw-todo-original">
                <span>Original message</span>
                <p>{messageBody}</p>
            </div>
            {error && <InlineError>{error}</InlineError>}
            <div className="sw-dialog-actions">
                <button
                    type="button"
                    className="sw-button-secondary"
                    disabled={busy}
                    onClick={() => onOpenChange(false)}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className="sw-button-primary"
                    disabled={busy || !title.trim()}
                    onClick={() => {
                        void save();
                    }}
                >
                    {busy ? 'Saving…' : todo ? 'Save todo' : 'Create todo'}
                </button>
            </div>
        </div>
    );
    if (inline) return form;
    return (
        <CollaborationDialog
            open={open}
            onOpenChange={(value) => {
                if (!busy) onOpenChange(value);
            }}
            title={todo ? 'Edit todo' : 'Convert to todo'}
            description="This todo is shared with people who can access the original chat. Assigning it does not change that audience."
        >
            {form}
        </CollaborationDialog>
    );
}

export function TodoStatus({
    todo,
    onEdit,
    inMessage = false,
    onSelect,
}: {
    todo: Todo;
    onEdit?: () => void;
    onSelect?: () => void;
    inMessage?: boolean;
}) {
    const { client } = useCollaboration();
    const [current, setCurrent] = useState(todo);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const pending = useRef(false);
    useEffect(() => setCurrent(todo), [todo]);
    async function toggle() {
        if (pending.current) return;
        pending.current = true;
        setBusy(true);
        setError('');
        try {
            const result = await client.mutate<{ data: Todo }>(
                `/todos/${current.id}`,
                {
                    title: current.title,
                    assignee_id: current.assignee?.id ?? null,
                    completed: !current.completed,
                    version: current.version,
                },
                'PATCH',
            );
            setCurrent(result.data);
            client.events.dispatchEvent(new Event('changed'));
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : 'Could not update this todo.',
            );
        } finally {
            pending.current = false;
            setBusy(false);
        }
    }
    const checkbox = (
        <input
            type="checkbox"
            checked={current.completed}
            disabled={busy || !current.can_manage}
            onChange={() => {
                void toggle();
            }}
            aria-label={`${current.completed ? 'Reopen' : 'Complete'} todo: ${current.title}`}
        />
    );
    if (inMessage || onSelect)
        return (
            <div className="sw-todo-inline" data-completed={current.completed}>
                {checkbox}
                {onSelect ? (
                    <button
                        type="button"
                        className="sw-todo-title-link"
                        onClick={onSelect}
                    >
                        {current.title}
                    </button>
                ) : (
                    <a
                        className="sw-todo-title-link"
                        href={`${client.origin}/todos?todo=${current.id}`}
                        target={client.token ? '_blank' : undefined}
                        rel="noreferrer"
                    >
                        {current.title}
                        <ArrowUpRight aria-hidden="true" />
                    </a>
                )}
                {error && <InlineError>{error}</InlineError>}
            </div>
        );
    return (
        <div className="sw-todo-status">
            <label className="sw-todo-check">
                {checkbox}
                <span>{current.completed ? 'Completed' : 'Open'}</span>
            </label>
            {error && <InlineError>{error}</InlineError>}
        </div>
    );
}

function TodoDetails({ id }: { id: string }) {
    const { client, revision } = useCollaboration();
    const [todo, setTodo] = useState<Todo | null>(null);
    const [error, setError] = useState('');
    const [reset, setReset] = useState(0);
    useEffect(() => {
        const abort = new AbortController();
        setError('');
        void client
            .request<{ data: Todo }>(`/todos/${id}`, { signal: abort.signal })
            .then((result) => {
                if (!abort.signal.aborted) setTodo(result.data);
            })
            .catch((failure: unknown) => {
                if (!abort.signal.aborted) {
                    setTodo(null);
                    setError(
                        failure instanceof Error
                            ? failure.message
                            : 'Could not load this todo.',
                    );
                }
            });
        return () => abort.abort();
    }, [client, id, revision]);
    return (
        <section className="sw-todo-details" aria-label="Todo details">
            {error && <InlineError>{error}</InlineError>}
            {!todo && !error && <p role="status">Loading todo details…</p>}
            {todo && (
                <>
                    <header>
                        <h2>{todo.title}</h2>
                        <TodoStatus todo={todo} />
                    </header>
                    {todo.needs_reassignment && (
                        <p className="sw-todo-assignee">
                            {todo.assignee?.name} · Needs reassignment
                        </p>
                    )}
                    {todo.can_manage ? (
                        <TodoDialog
                            key={`${id}:${reset}`}
                            inline
                            open
                            todo={todo}
                            chatId={todo.message.chat_id}
                            messageId={todo.message.id}
                            messageBody={todo.message.body}
                            onOpenChange={() => setReset((value) => value + 1)}
                            onSaved={setTodo}
                        />
                    ) : (
                        <p>
                            Assigned to {todo.assignee?.name ?? 'nobody'}. This
                            chat is read-only.
                        </p>
                    )}
                    <a
                        className="sw-todo-reference"
                        href={`${client.origin}${messagePath(todo.message.chat_id, todo.message.thread_id, todo.message.id)}`}
                        target={client.token ? '_blank' : undefined}
                        rel="noreferrer"
                    >
                        Open message · {todo.message.chat_title}
                        <ArrowUpRight aria-hidden="true" />
                    </a>
                    {todo.completed_at && (
                        <small>
                            Completed{' '}
                            {new Date(todo.completed_at).toLocaleString()}
                            {todo.completed_by
                                ? ` by ${todo.completed_by.name}`
                                : ''}
                        </small>
                    )}
                </>
            )}
        </section>
    );
}

export function TodoList() {
    const { client, revision } = useCollaboration();
    const [todos, setTodos] = useState<Todo[]>([]);
    const [status, setStatus] = useState<'open' | 'completed' | 'all'>('open');
    const [mine, setMine] = useState(false);
    const [page, setPage] = useState(1);
    const [next, setNext] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reload, setReload] = useState(0);
    const [selectedId, setSelectedId] = useState<string | null>(() =>
        new URLSearchParams(window.location.search).get('todo'),
    );
    useEffect(() => {
        const abort = new AbortController();
        setLoading(true);
        setError('');
        void client
            .request<{ data: Todo[]; next_page: number | null }>(
                `/todos?status=${status}&mine=${mine ? 1 : 0}&page=${page}`,
                { signal: abort.signal },
            )
            .then((result) => {
                if (!abort.signal.aborted) {
                    setTodos(result.data);
                    setNext(result.next_page);
                }
            })
            .catch((failure: unknown) => {
                if (!abort.signal.aborted) {
                    setTodos([]);
                    setNext(null);
                    setError(
                        failure instanceof Error
                            ? failure.message
                            : 'Could not load todos.',
                    );
                }
            })
            .finally(() => {
                if (!abort.signal.aborted) setLoading(false);
            });
        return () => abort.abort();
    }, [client, revision, status, mine, page, reload]);
    function filter(
        nextStatus: 'open' | 'completed' | 'all',
        nextMine: boolean,
    ) {
        setStatus(nextStatus);
        setMine(nextMine);
        setPage(1);
        setTodos([]);
        setNext(null);
    }
    return (
        <section className="sw-collaboration sw-todos" aria-label="Todo list">
            <header className="sw-todos-heading">
                <span className="sw-section-kicker">
                    FROM CONVERSATION TO ACTION
                </span>
                <h1>
                    <ListTodo aria-hidden="true" />
                    Todos
                </h1>
                <p>Shared actions, with the conversation close at hand.</p>
            </header>
            <div className="sw-todo-filters">
                <nav className="sw-directory-tabs" aria-label="Todo ownership">
                    <button
                        type="button"
                        aria-pressed={!mine}
                        onClick={() => filter(status, false)}
                    >
                        All todos
                    </button>
                    <button
                        type="button"
                        aria-pressed={mine}
                        onClick={() => filter(status, true)}
                    >
                        Assigned to me
                    </button>
                </nav>
                <nav className="sw-directory-tabs" aria-label="Todo status">
                    {(['open', 'completed', 'all'] as const).map((value) => (
                        <button
                            type="button"
                            key={value}
                            aria-pressed={status === value}
                            onClick={() => filter(value, mine)}
                        >
                            {value === 'open'
                                ? 'Open'
                                : value === 'completed'
                                  ? 'Completed'
                                  : 'All statuses'}
                        </button>
                    ))}
                </nav>
            </div>
            {error && (
                <InlineError retry={() => setReload((value) => value + 1)}>
                    {error}
                </InlineError>
            )}
            <div className="sw-todo-list" aria-busy={loading}>
                {loading && !todos.length && (
                    <p role="status">Loading todos…</p>
                )}
                {todos.map((todo) => (
                    <article
                        className={`sw-todo-row${selectedId === todo.id ? ' sw-todo-selected' : ''}`}
                        key={todo.id}
                        data-todo-id={todo.id}
                    >
                        <TodoStatus
                            todo={todo}
                            onSelect={() => setSelectedId(todo.id)}
                        />
                        <span className="sw-todo-row-assignee">
                            {todo.assignee?.name ?? 'Unassigned'}
                            {todo.needs_reassignment
                                ? ' · Needs reassignment'
                                : ''}
                        </span>
                        <span className="sw-todo-row-status">
                            {todo.completed ? 'Completed' : 'Open'}
                        </span>
                    </article>
                ))}
                {!loading && !error && !todos.length && (
                    <EmptyState
                        icon={status === 'completed' ? CheckCheck : Search}
                        title="No todos here"
                    >
                        Convert a message to a todo using its message actions.
                        Try another filter to find completed or assigned work.
                    </EmptyState>
                )}
            </div>
            {(page > 1 || next) && (
                <footer className="sw-todo-pagination">
                    <span>Page {page}</span>
                    <IconButton
                        icon={ChevronLeft}
                        label="Previous todo page"
                        disabled={page <= 1 || loading}
                        onClick={() => setPage(page - 1)}
                    />
                    <IconButton
                        icon={ChevronRight}
                        label="Next todo page"
                        disabled={!next || loading}
                        onClick={() => next && setPage(next)}
                    />
                </footer>
            )}
            {selectedId && <TodoDetails key={selectedId} id={selectedId} />}
        </section>
    );
}
