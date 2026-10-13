import type { Message, Person } from './client';

/** Display-only helpers. They never decide recipients, access, or read state. */
export function initials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map((word) => Array.from(word)[0]).join('').toLocaleUpperCase() || '?';
}

export function avatarTone(name: string): number {
    return Array.from(name).reduce((hash, letter) => (hash * 31 + (letter.codePointAt(0) ?? 0)) >>> 0, 0) % 5;
}

export function dayLabel(value: string, now = new Date()): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Date unavailable';
    if (date.toDateString() === now.toDateString()) return 'Today';
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) });
}

export function timeLabel(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function sameMessageGroup(previous: Message | undefined, current: Message): boolean {
    if (!previous) return false;
    const gap = new Date(current.created_at).getTime() - new Date(previous.created_at).getTime();
    return previous.author.id === current.author.id && previous.source?.id === current.source?.id && previous.thread_root_id === current.thread_root_id && gap >= 0 && gap < 5 * 60 * 1000 && new Date(previous.created_at).toDateString() === new Date(current.created_at).toDateString();
}

export function mergeMessages(older: Message[], incoming: Message[]): Message[] {
    const updates = new Map(incoming.map((item) => [item.id, item]));
    const result = older.map((item) => updates.get(item.id) ?? item);
    const known = new Set(older.map((item) => item.id));
    return [...result, ...incoming.filter((item) => !known.has(item.id))];
}

export function mentionAtCaret(body: string, caret: number): { start: number; end: number; query: string } | null {
    const before = body.slice(0, caret);
    const match = before.match(/(?:^|\s)@([^@\n]{0,60})$/u);
    return match ? { start: before.length - match[1].length - 1, end: caret, query: match[1] } : null;
}

/** Highlight only recipients already resolved by the server; plain @text stays plain. */
export function mentionParts(body: string, people: Person[]): { text: string; mentioned: boolean }[] {
    const names = [...new Set(people.map((person) => `@${person.name}`))].sort((a, b) => b.length - a.length);
    if (!names.length) return [{ text: body, mentioned: false }];
    const escaped = names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const expression = new RegExp(`(${escaped.join('|')})(?=$|[\\s.,!?;:()])`, 'gu');
    const parts: { text: string; mentioned: boolean }[] = [];
    let cursor = 0;
    for (const match of body.matchAll(expression)) {
        const index = match.index ?? 0;
        if (index > 0 && !/[\s([{:]/u.test(body[index - 1])) continue;
        if (index > cursor) parts.push({ text: body.slice(cursor, index), mentioned: false });
        parts.push({ text: match[0], mentioned: true });
        cursor = index + match[0].length;
    }
    if (cursor < body.length) parts.push({ text: body.slice(cursor), mentioned: false });
    return parts.length ? parts : [{ text: body, mentioned: false }];
}

export type WorkReferencePart = {
    text: string;
    mentioned: boolean;
    reference?: { label: string; description: string };
};

/** Formatting only: preserve original text and never infer a business record or recipient. */
export function workReferenceParts(body: string, people: Person[]): WorkReferencePart[] {
    return mentionParts(body, people).flatMap((part): WorkReferencePart[] => {
        if (part.mentioned) return [part];
        const parts: WorkReferencePart[] = [];
        let cursor = 0;
        let start = -1;
        let depth = 0;
        for (let index = 0; index < part.text.length; index += 1) {
            if (part.text[index] === '[') {
                if (depth === 0) start = index;
                depth += 1;
            } else if (part.text[index] === ']' && depth > 0) {
                depth -= 1;
                if (depth > 0) continue;
                const end = index + 1;
                const label = part.text.slice(start + 1, index).trim();
                if (!label) continue;
                if (start > cursor) parts.push({ text: part.text.slice(cursor, start), mentioned: false });
                parts.push({ text: part.text.slice(start, end), mentioned: false, reference: { label, description: `Reference: ${label}` } });
                cursor = end;
            }
        }
        if (cursor < part.text.length) parts.push({ text: part.text.slice(cursor), mentioned: false });
        return parts.length ? parts : [part];
    });
}

export type MessagePart = WorkReferencePart & { href?: string };

/** HTTP links are navigation only; never fetch previews or infer access from a URL. */
export function messageParts(body: string, people: Person[]): MessagePart[] {
    return workReferenceParts(body, people).flatMap((part): MessagePart[] => {
        if (part.mentioned || part.reference) return [part];
        const parts: MessagePart[] = [];
        let cursor = 0;
        for (const match of part.text.matchAll(/(?:https?:\/\/|www\.)[^\s<>"'`]+/giu)) {
            const index = match.index;
            if (index > 0 && /[\p{L}\p{N}_@/:]/u.test(part.text[index - 1])) continue;
            let text = match[0].replace(/[.,!?;:]+$/u, '');
            while (text.endsWith(')') && text.split(')').length > text.split('(').length) text = text.slice(0, -1);
            while (text.endsWith('}') && text.split('}').length > text.split('{').length) text = text.slice(0, -1);
            try {
                const url = new URL(/^www\./iu.test(text) ? `https://${text}` : text);
                if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username || url.password) continue;
                if (index > cursor) parts.push({ text: part.text.slice(cursor, index), mentioned: false });
                parts.push({ text, mentioned: false, href: url.href });
                cursor = index + text.length;
            } catch { /* Malformed URL-like text remains plain. */ }
        }
        if (cursor < part.text.length) parts.push({ text: part.text.slice(cursor), mentioned: false });
        return parts.length ? parts : [part];
    });
}
