import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { UrlMatchSelector } from '../../../../packages/page-contexts/url-match-selector';
import {
    canSaveSelection,
    selectionFor,
    type UrlMatchDefinition,
    type UrlSelection,
} from '../../../../packages/page-contexts/url-selection';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type Preview = {
    id: string | null;
    title: string;
    url: string;
    association_version: number | null;
    url_match: UrlMatchDefinition | null;
    chat: { id: string; title: string } | null;
};

async function pageRequest<T>(path: string, body: object): Promise<T> {
    const xsrf = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
        ?.slice(11);
    const response = await fetch(path, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(xsrf ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrf) } : {}),
        },
        body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const errors = payload.errors as Record<string, string[]> | undefined;
        throw new Error(
            errors
                ? Object.values(errors).flat().join(' ')
                : (payload.message ??
                      'The link could not be saved. Refresh and try again.'),
        );
    }
    return payload.data as T;
}

export function LinkPageDialog({
    chatId,
    chatTitle,
    initialUrl = '',
}: {
    chatId: string;
    chatTitle: string;
    initialUrl?: string;
}) {
    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState(initialUrl);
    const [title, setTitle] = useState('');
    const [preview, setPreview] = useState<Preview | null>(null);
    const [selection, setSelection] = useState<UrlSelection>({ mode: 'exact' });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const lock = useRef(false);
    async function review() {
        if (lock.current) return;
        lock.current = true;
        setBusy(true);
        setError('');
        try {
            const result = await pageRequest<Preview>('/page-links/preview', {
                url,
                title,
            });
            setPreview(result);
            setTitle(result.title);
            setSelection(selectionFor(result.url_match));
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : 'Unable to review this URL.',
            );
        } finally {
            lock.current = false;
            setBusy(false);
        }
    }
    async function save() {
        if (!preview || lock.current) return;
        lock.current = true;
        setBusy(true);
        setError('');
        try {
            await pageRequest('/page-links', {
                url,
                title,
                conversation_id: chatId,
                matching: selection,
                expected_context_id: preview.id,
                expected_association_version: preview.association_version,
            });
            setOpen(false);
            setPreview(null);
            setUrl(initialUrl);
            setTitle('');
            router.reload({ only: ['chat', 'chats', 'apps'] });
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : 'Unable to save the link.',
            );
        } finally {
            lock.current = false;
            setBusy(false);
        }
    }
    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!lock.current) {
                    setOpen(next);
                    setError('');
                }
            }}
        >
            <DialogTrigger asChild>
                <Button
                    type="button"
                    size="sm"
                    variant={initialUrl ? 'ghost' : 'default'}
                    className={initialUrl ? '' : 'sw-primary'}
                >
                    {initialUrl ? 'Matching' : 'Link Page'}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90dvh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Link a page to this chat</DialogTitle>
                    <DialogDescription>
                        Messages posted from this page will appear in “
                        {chatTitle}”. This does not import data from the
                        website.
                    </DialogDescription>
                </DialogHeader>
                <form
                    className="grid min-w-0 gap-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (preview) void save();
                        else void review();
                    }}
                >
                    <label className="grid gap-2 text-sm">
                        Page URL
                        <Input
                            type="url"
                            value={url}
                            required
                            maxLength={4096}
                            disabled={busy}
                            onChange={(event) => {
                                setUrl(event.target.value);
                                setPreview(null);
                                setSelection({ mode: 'exact' });
                            }}
                        />
                    </label>
                    {preview && (
                        <>
                            <label className="grid gap-2 text-sm">
                                Page label
                                <Input
                                    value={title}
                                    required
                                    maxLength={255}
                                    disabled={busy || preview.id !== null}
                                    onChange={(event) =>
                                        setTitle(event.target.value)
                                    }
                                />
                            </label>
                            {preview.chat && (
                                <p className="text-sm">
                                    Currently linked to:{' '}
                                    <strong>{preview.chat.title}</strong>. An
                                    existing chat with messages cannot be moved
                                    into another chat.
                                </p>
                            )}
                            <UrlMatchSelector
                                key={url}
                                url={url}
                                value={selection}
                                onChange={setSelection}
                                disabled={busy}
                            />
                        </>
                    )}
                    {error && (
                        <p className="text-destructive text-sm" role="alert">
                            {error}
                        </p>
                    )}
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={busy}
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        {preview && (
                            <Button
                                type="button"
                                variant="outline"
                                disabled={busy}
                                onClick={review}
                            >
                                Review again
                            </Button>
                        )}
                        <Button
                            type="submit"
                            className="sw-primary"
                            disabled={
                                busy ||
                                !url.trim() ||
                                (preview !== null &&
                                    (!title.trim() ||
                                        !canSaveSelection(url, selection)))
                            }
                        >
                            {busy
                                ? 'Working…'
                                : preview
                                  ? 'Link to chat'
                                  : 'Review URL'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
