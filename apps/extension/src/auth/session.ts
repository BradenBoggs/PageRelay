const appUrl = (
    import.meta.env.VITE_SIDEWIRE_APP_URL ?? 'http://localhost:8000'
).replace(/\/$/, '');
const storageKey = 'sidewire.extension.session';

export type ExtensionSession = {
    token: string;
    expiresAt: string;
    user: {
        id: number;
        name: string;
    };
    organization: {
        id: number;
        name: string;
    };
};

type Handoff = {
    id: string;
    secret: string;
    authorize_url: string;
    expires_at: string;
};

type HandoffExchange =
    | { status: 'pending' }
    | {
          status: 'connected';
          token: string;
          expires_at: string;
          user: ExtensionSession['user'];
          organization: ExtensionSession['organization'];
      };

export async function loadSession(): Promise<ExtensionSession | null> {
    const stored = await chrome.storage.local.get(storageKey);
    const session = stored[storageKey] as ExtensionSession | undefined;

    if (!session || new Date(session.expiresAt) <= new Date()) {
        await clearSession();

        return null;
    }

    const response = await fetch(`${appUrl}/api/v1/extension/session`, {
        headers: authorizationHeaders(session.token),
    });

    if (response.status === 401 || response.status === 403) {
        await clearSession();

        return null;
    }

    if (!response.ok) {
        throw new Error('SideWire could not verify the saved session.');
    }

    return session;
}

export async function connect(signal?: AbortSignal): Promise<ExtensionSession> {
    const codeVerifier = randomBase64Url(32);
    const codeChallenge = await sha256Base64Url(codeVerifier);
    const handoff = await startHandoff(codeChallenge, signal);

    await chrome.tabs.create({ url: handoff.authorize_url });

    while (new Date(handoff.expires_at) > new Date()) {
        if (signal?.aborted) {
            throw new DOMException('Connection canceled.', 'AbortError');
        }

        const exchange = await exchangeHandoff(handoff, codeVerifier, signal);

        if (exchange.status === 'connected') {
            const session: ExtensionSession = {
                token: exchange.token,
                expiresAt: exchange.expires_at,
                user: exchange.user,
                organization: exchange.organization,
            };

            await chrome.storage.local.set({ [storageKey]: session });

            return session;
        }

        await delay(1_500, signal);
    }

    throw new Error('The connection request expired. Start again.');
}

export async function disconnect(): Promise<void> {
    const stored = await chrome.storage.local.get(storageKey);
    const session = stored[storageKey] as ExtensionSession | undefined;

    if (!session) {
        await clearSession();

        return;
    }

    const response = await fetch(`${appUrl}/api/v1/extension/session`, {
        method: 'DELETE',
        headers: authorizationHeaders(session.token),
    });

    if (!response.ok && response.status !== 401 && response.status !== 403) {
        throw new Error('SideWire could not revoke this session. Try again.');
    }

    await clearSession();
}

async function startHandoff(
    codeChallenge: string,
    signal?: AbortSignal,
): Promise<Handoff> {
    const response = await fetch(`${appUrl}/api/v1/extension/handoffs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code_challenge: codeChallenge }),
        signal,
    });

    if (!response.ok) {
        throw new Error('SideWire could not start the connection request.');
    }

    const payload = (await response.json()) as { data: Handoff };

    return payload.data;
}

async function exchangeHandoff(
    handoff: Handoff,
    codeVerifier: string,
    signal?: AbortSignal,
): Promise<HandoffExchange> {
    const response = await fetch(
        `${appUrl}/api/v1/extension/handoffs/${encodeURIComponent(handoff.id)}`,
        {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: handoff.secret,
                code_verifier: codeVerifier,
            }),
            signal,
        },
    );

    if (response.status !== 200 && response.status !== 202) {
        throw new Error(
            `SideWire could not finish the connection request (HTTP ${response.status}).`,
        );
    }

    const payload = (await response.json()) as { data: HandoffExchange };

    return payload.data;
}

function authorizationHeaders(token: string): HeadersInit {
    return {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
    };
}

async function clearSession(): Promise<void> {
    await chrome.storage.local.remove(storageKey);
}

function randomBase64Url(byteLength: number): string {
    const bytes = crypto.getRandomValues(new Uint8Array(byteLength));

    return encodeBase64Url(bytes);
}

async function sha256Base64Url(value: string): Promise<string> {
    const digest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(value),
    );

    return encodeBase64Url(new Uint8Array(digest));
}

function encodeBase64Url(bytes: Uint8Array): string {
    let binary = '';

    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary)
        .replaceAll('+', '-')
        .replaceAll('/', '_')
        .replaceAll('=', '');
}

function delay(milliseconds: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        const timeout = window.setTimeout(resolve, milliseconds);

        signal?.addEventListener(
            'abort',
            () => {
                window.clearTimeout(timeout);
                reject(new DOMException('Connection canceled.', 'AbortError'));
            },
            { once: true },
        );
    });
}
