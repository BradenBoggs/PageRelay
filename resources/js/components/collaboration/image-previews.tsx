import { useEffect, useRef, useState } from 'react';
import { useCollaboration } from './provider';
import type { Message } from './client';

export function ImagePreviews({
    chatId,
    message,
}: {
    chatId: string;
    message: Message;
}) {
    const [hidden, setHidden] = useState(false);
    const candidates = message.image_previews ?? [];
    if (!candidates.length) return null;
    return (
        <div className="sw-message-images">
            <button
                type="button"
                className="sw-image-preview-toggle"
                onClick={() => setHidden((value) => !value)}
            >
                {hidden ? 'Show images' : 'Hide images'}
            </button>
            {!hidden && (
                <div className="sw-image-preview-grid">
                    {candidates.map((candidate) => (
                        <ImageThumbnail
                            key={candidate.key}
                            chatId={chatId}
                            messageId={message.id}
                            candidate={candidate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function ImageThumbnail({
    chatId,
    messageId,
    candidate,
}: {
    chatId: string;
    messageId: string;
    candidate: { key: string; url: string };
}) {
    const { client } = useCollaboration();
    const tile = useRef<HTMLAnchorElement>(null);
    const [visible, setVisible] = useState(false);
    const [src, setSrc] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                setVisible(true);
                observer.disconnect();
            }
        });
        if (tile.current) observer.observe(tile.current);
        return () => observer.disconnect();
    }, []);
    useEffect(() => {
        if (!visible) return;
        const abort = new AbortController();
        let objectUrl: string | null = null;
        setFailed(false);
        setSrc(null);
        const load = async () => {
            try {
                const headers = new Headers({ Accept: 'image/*' });
                if (client.token)
                    headers.set('Authorization', `Bearer ${client.token}`);
                const response = await fetch(
                    `${client.origin}${client.base}/chats/${chatId}/messages/${messageId}/images/${candidate.key}`,
                    {
                        headers,
                        credentials: client.token ? 'omit' : 'same-origin',
                        cache: 'no-store',
                        referrerPolicy: 'no-referrer',
                        signal: abort.signal,
                    },
                );
                if (!response.ok) {
                    if ([401, 403, 419].includes(response.status))
                        client.onAuthLost();
                    throw new Error('Image unavailable');
                }
                const blob = await response.blob();
                if (abort.signal.aborted) return;
                objectUrl = URL.createObjectURL(blob);
                setSrc(objectUrl);
            } catch {
                if (!abort.signal.aborted) setFailed(true);
            }
        };
        void load();
        return () => {
            abort.abort();
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [client, chatId, messageId, candidate.key, visible]);
    const host = new URL(candidate.url).hostname;
    return (
        <a
            ref={tile}
            className="sw-image-thumbnail"
            href={candidate.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open image from ${host}`}
        >
            {src && !failed ? (
                <img
                    src={src}
                    alt={`Image from ${host}`}
                    width={160}
                    height={120}
                    onError={() => setFailed(true)}
                />
            ) : (
                <span role={failed ? undefined : 'status'}>
                    {failed
                        ? 'Image unavailable · Open link'
                        : 'Loading image…'}
                </span>
            )}
        </a>
    );
}
