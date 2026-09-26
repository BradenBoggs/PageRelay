import { useForm } from '@inertiajs/react';
import { Send } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useChatUiCache } from '@/components/application-shell/chat-ui-cache';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';

export function ChatComposer({
    chatId,
    title,
    idempotencyKey,
}: {
    chatId: string;
    title: string;
    idempotencyKey: string;
}) {
    const cache = useChatUiCache();
    const [initial] = useState(
        () =>
            cache.drafts.get(chatId) ?? {
                body: '',
                idempotency_key: idempotencyKey,
            },
    );
    const form = useForm(initial);
    const busy = useRef(false);
    const element = useRef<HTMLFormElement>(null);
    useEffect(() => {
        cache.drafts.set(chatId, form.data);
    }, [cache, chatId, form.data]);
    function send(event: FormEvent) {
        event.preventDefault();
        if (busy.current || !form.data.body.trim()) return;
        busy.current = true;
        form.post(`/chats/${chatId}/messages`, {
            preserveScroll: true,
            onSuccess: () => {
                const empty = {
                    body: '',
                    idempotency_key: crypto.randomUUID(),
                };
                cache.drafts.set(chatId, empty);
                form.setData(empty);
            },
            onFinish: () => {
                busy.current = false;
            },
        });
    }
    return (
        <form className="sw-composer" ref={element} onSubmit={send}>
            <div className="sw-composer-context">
                <span>
                    Message to <strong>{title}</strong>
                </span>
                <span>Ctrl / ⌘ + Enter to send</span>
            </div>
            <label className="sr-only" htmlFor="chat-body">
                Message {title}
            </label>
            <div className="sw-composer-box">
                <textarea
                    id="chat-body"
                    name="body"
                    rows={3}
                    value={form.data.body}
                    onChange={(event) =>
                        form.setData('body', event.target.value)
                    }
                    maxLength={10000}
                    placeholder="Write a message to your team…"
                    disabled={form.processing}
                    aria-invalid={Boolean(form.errors.body)}
                    aria-describedby="chat-send-status"
                    onKeyDown={(event) => {
                        if (
                            (event.ctrlKey || event.metaKey) &&
                            event.key === 'Enter' &&
                            !event.nativeEvent.isComposing
                        ) {
                            event.preventDefault();
                            element.current?.requestSubmit();
                        }
                    }}
                />
                <div className="sw-composer-actions">
                    <span className="sw-muted">
                        Sent from SideWire · no page source
                    </span>
                    <Button
                        type="submit"
                        className="sw-primary"
                        disabled={form.processing || !form.data.body.trim()}
                    >
                        {form.processing ? 'Sending…' : 'Send'}
                        <Send aria-hidden="true" />
                    </Button>
                </div>
            </div>
            <div id="chat-send-status" role="status">
                <InputError
                    message={form.errors.body || form.errors.idempotency_key}
                />
                {form.recentlySuccessful && (
                    <span className="sw-muted">Message sent.</span>
                )}
            </div>
        </form>
    );
}
