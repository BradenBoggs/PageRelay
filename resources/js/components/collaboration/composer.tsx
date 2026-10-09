import { AtSign, CornerDownLeft, Link2, LoaderCircle, Send, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { freshDraft, type Draft, type Person, type Source } from './client';
import { mentionAtCaret } from './presentation';
import { useCollaboration } from './provider';
import { IconButton, InlineError, PersonAvatar } from './ui';

export function Composer({ chatId, thread, source, title, onSent }: { chatId: string; thread: string | null; source: Source | null; title: string; onSent: () => void }) {
    const { client } = useCollaboration();
    const draftId = `${chatId}:${thread ?? 'main'}`;
    const [draft, setDraft] = useState<Draft>(() => client.drafts.get(draftId) ?? freshDraft());
    const [suggestions, setSuggestions] = useState<Person[]>([]);
    const [suggestionError, setSuggestionError] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [dismissed, setDismissed] = useState(false);
    const [caret, setCaret] = useState(draft.body.length);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const input = useRef<HTMLTextAreaElement>(null);
    const pending = useRef(false);
    const mounted = useRef(true);
    const suggestionId = useId();
    const hintId = useId();
    const attempted = Boolean(draft.attempted);
    const at = !dismissed && !attempted ? mentionAtCaret(draft.body, caret) : null;
    const mentionQuery = at?.query;
    function update(next: Draft) { client.drafts.set(draftId, next); setDraft(next); }
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    useEffect(() => {
        const element = input.current;
        if (element) { element.style.height = 'auto'; element.style.height = `${Math.min(Math.max(element.scrollHeight, 76), 176)}px`; }
    }, [draft.body]);
    useEffect(() => {
        const abort = new AbortController();
        setSuggestions([]); setSuggestionError(''); setActiveIndex(0);
        if (mentionQuery === undefined || attempted) return;
        const timer = setTimeout(() => {
            void client.request<{ data: Person[] }>(`/members?chat=${chatId}&query=${encodeURIComponent(mentionQuery)}`, { signal: abort.signal }).then((result) => { if (!abort.signal.aborted) setSuggestions(result.data); }).catch(() => { if (!abort.signal.aborted) setSuggestionError('Could not load coworkers. Plain @text will not send a mention.'); });
        }, 180);
        return () => { abort.abort(); clearTimeout(timer); };
    }, [client, chatId, mentionQuery, attempted]);
    useEffect(() => {
        document.getElementById(`${suggestionId}-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
    }, [suggestionId, activeIndex]);
    function edit(body: string, position: number) {
        update({ ...draft, body, source: draft.body ? draft.source : source, mentions: draft.mentions.filter((person) => body.includes(`@${person.name}`)) });
        setCaret(position); setDismissed(false);
    }
    function mention(person: Person) {
        if (!at || busy || attempted) return;
        const before = draft.body.slice(0, at.start);
        const body = `${before}@${person.name} ${draft.body.slice(at.end)}`;
        const position = before.length + person.name.length + 2;
        update({ ...draft, body, source: draft.body ? draft.source : source, mentions: [...draft.mentions.filter((item) => item.id !== person.id), person] });
        setSuggestions([]); setDismissed(true); setCaret(position);
        requestAnimationFrame(() => { input.current?.focus(); input.current?.setSelectionRange(position, position); });
    }
    function insertMention() {
        const element = input.current;
        if (!element || attempted || busy) return;
        const start = element.selectionStart;
        const before = draft.body.slice(0, start);
        const insert = before && !/\s$/u.test(before) ? ' @' : '@';
        const position = start + insert.length;
        edit(`${before}${insert}${draft.body.slice(element.selectionEnd)}`, position);
        requestAnimationFrame(() => { element.focus(); element.setSelectionRange(position, position); });
    }
    async function send() {
        if (pending.current || !draft.body.trim()) return;
        pending.current = true; setBusy(true); setError('');
        const sentDraft = { ...draft, attempted: true };
        update(sentDraft);
        try {
            await client.mutate(`/chats/${chatId}/messages`, { body: sentDraft.body, idempotency_key: sentDraft.key, thread_root_id: thread, mentions: sentDraft.mentions.map((person) => person.id), source_context_id: sentDraft.source?.id ?? null, source_version: sentDraft.source?.version ?? null });
            const empty = freshDraft();
            client.drafts.set(draftId, empty);
            if (mounted.current) { setDraft(empty); setCaret(0); setSuggestions([]); onSent(); requestAnimationFrame(() => input.current?.focus()); }
            client.events.dispatchEvent(new Event('changed'));
        } catch (failure) { if (mounted.current) setError(failure instanceof Error ? failure.message : 'Your message may not have sent. Retry this same draft to avoid a duplicate.'); }
        finally { pending.current = false; if (mounted.current) setBusy(false); }
    }
    return <form className="sw-message-composer" onSubmit={(event) => { event.preventDefault(); void send(); }}>
        <div className="sw-compose-box" data-pending={attempted}>
            <label className="sw-visually-hidden" htmlFor={`${hintId}-input`}>{thread ? 'Reply to this thread' : 'Message'}</label>
            <textarea id={`${hintId}-input`} ref={input} value={draft.body} maxLength={10000} rows={3} readOnly={busy || attempted} placeholder={thread ? 'Reply to this thread…' : `Message ${title}…`} aria-describedby={hintId} aria-controls={suggestions.length ? suggestionId : undefined} aria-activedescendant={suggestions.length ? `${suggestionId}-${activeIndex}` : undefined} onChange={(event) => edit(event.target.value, event.target.selectionStart)} onSelect={(event) => setCaret(event.currentTarget.selectionStart)} onKeyDown={(event) => {
                if (event.nativeEvent.isComposing) return;
                if (suggestions.length && !event.ctrlKey && !event.metaKey) {
                    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => (index + (event.key === 'ArrowDown' ? 1 : -1) + suggestions.length) % suggestions.length); return; }
                    if (event.key === 'Enter') { event.preventDefault(); mention(suggestions[activeIndex]); return; }
                    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setSuggestions([]); setDismissed(true); return; }
                }
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); void send(); }
            }} />
            {suggestions.length > 0 && <div className="sw-mention-menu"><div className="sw-mention-menu-heading"><AtSign aria-hidden="true" />Mention a coworker<span>↑ ↓ to choose · ↵ to select</span></div><div id={suggestionId} role="listbox" aria-label="Mention suggestions">{suggestions.map((person, index) => <button type="button" role="option" aria-selected={activeIndex === index} id={`${suggestionId}-${index}`} key={person.id} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveIndex(index)} onClick={() => mention(person)}><PersonAvatar name={person.name} small /><span>@{person.name}</span></button>)}</div></div>}
            {draft.mentions.length > 0 && <div className="sw-compose-recipients" aria-label="People to notify"><span>Notifying</span>{draft.mentions.map((person) => <button type="button" key={person.id} disabled={busy || attempted} aria-label={`Remove mention notification for ${person.name}`} onClick={() => update({ ...draft, mentions: draft.mentions.filter((item) => item.id !== person.id) })}>@{person.name}<X aria-hidden="true" /></button>)}</div>}
            <div className="sw-compose-toolbar"><IconButton icon={AtSign} label="Mention a coworker" disabled={busy || attempted} onClick={insertMention} /><span id={hintId} className="sw-compose-hint">{attempted ? 'Draft locked for safe retry' : 'Enter for a new line'}</span><button type="submit" className="sw-send-button" disabled={busy || !draft.body.trim()} title="Send with Ctrl or Command + Enter">{busy ? <LoaderCircle className="sw-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}<span>{busy ? 'Sending…' : attempted ? 'Retry same message' : thread ? 'Send reply' : 'Send'}</span></button></div>
        </div>
        {suggestionError && <p className="sw-compose-warning" role="status">{suggestionError}</p>}
        {draft.source && <p className="sw-compose-source"><Link2 aria-hidden="true" /><span>From <strong>{draft.source.host}</strong> · {draft.source.title}. This source stays with your draft.</span></p>}
        {error && <InlineError>{error}</InlineError>}
        {attempted && !busy && <button type="button" className="sw-button-text sw-discard-draft" onClick={() => { if (window.confirm('The previous send may have reached the server. Check this conversation before discarding the pending draft. Discard it?')) { update(freshDraft()); setCaret(0); setError(''); onSent(); } }}>Discard pending draft</button>}
        <p className="sw-compose-footer"><CornerDownLeft aria-hidden="true" /><span>Ctrl / ⌘ + Enter to send</span><span>{thread ? 'Replying in thread' : 'Visible to this conversation'}</span></p>
    </form>;
}
