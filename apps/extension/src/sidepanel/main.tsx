import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '../components/ui/button';
import {
    connect,
    disconnect,
    loadSession,
    type ExtensionSession,
} from '../auth/session';
import '../styles/app.css';

type Status = 'loading' | 'signed-out' | 'connecting' | 'connected' | 'error';

function SidePanel() {
    const [status, setStatus] = useState<Status>('loading');
    const [session, setSession] = useState<ExtensionSession | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const connection = useRef<AbortController | null>(null);

    useEffect(() => {
        let mounted = true;

        void loadSession()
            .then((loadedSession) => {
                if (!mounted) return;

                setSession(loadedSession);
                setStatus(loadedSession ? 'connected' : 'signed-out');
            })
            .catch(() => {
                if (!mounted) return;

                setMessage('SideWire is unavailable. Check the local server.');
                setStatus('error');
            });

        return () => {
            mounted = false;
            connection.current?.abort();
        };
    }, []);

    async function handleConnect() {
        connection.current?.abort();
        connection.current = new AbortController();
        setMessage(null);
        setStatus('connecting');

        try {
            const connectedSession = await connect(connection.current.signal);
            setSession(connectedSession);
            setStatus('connected');
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                setStatus('signed-out');

                return;
            }

            setMessage(
                error instanceof Error
                    ? error.message
                    : 'SideWire could not connect.',
            );
            setStatus('error');
        }
    }

    async function handleDisconnect() {
        setMessage(null);

        try {
            await disconnect();
            setSession(null);
            setStatus('signed-out');
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'SideWire could not disconnect.',
            );
        }
    }

    return (
        <main className="flex min-h-screen flex-col p-5">
            <header className="border-input border-b pb-4">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Chrome side panel
                </p>
                <h1 className="mt-1 text-lg font-semibold">SideWire</h1>
            </header>

            <section
                className="flex flex-1 flex-col justify-center py-8"
                aria-live="polite"
            >
                {status === 'loading' && (
                    <p className="text-muted-foreground text-center text-sm">
                        Checking your session…
                    </p>
                )}

                {status === 'signed-out' && (
                    <div className="space-y-5 text-center">
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold">
                                Connect your SideWire account
                            </h2>
                            <p className="text-muted-foreground text-sm leading-6">
                                Sign in on the SideWire website, confirm your
                                organization, then return here.
                            </p>
                        </div>
                        <Button className="w-full" onClick={handleConnect}>
                            Connect SideWire
                        </Button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-5 text-center">
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold">
                                SideWire is unavailable
                            </h2>
                            <p className="text-sm text-red-600" role="alert">
                                {message}
                            </p>
                        </div>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => window.location.reload()}
                        >
                            Try again
                        </Button>
                    </div>
                )}

                {status === 'connecting' && (
                    <div className="space-y-4 text-center">
                        <h2 className="text-xl font-semibold">
                            Confirm in the new tab
                        </h2>
                        <p className="text-muted-foreground text-sm leading-6">
                            SideWire is waiting for your approval. This request
                            expires automatically.
                        </p>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => connection.current?.abort()}
                        >
                            Cancel
                        </Button>
                    </div>
                )}

                {status === 'connected' && session && (
                    <div className="space-y-5">
                        <div className="space-y-1 text-center">
                            <p className="text-sm font-medium">
                                {session.organization.name}
                            </p>
                            <p className="text-muted-foreground text-sm">
                                Connected as {session.user.name}
                            </p>
                        </div>
                        <div className="border-input rounded-lg border p-4">
                            <p className="text-sm font-medium">
                                SideWire is ready
                            </p>
                            <p className="text-muted-foreground mt-1 text-sm leading-6">
                                Page-aware Chat and Activity arrive in the next
                                implementation plan.
                            </p>
                        </div>
                        {message && (
                            <p
                                className="text-center text-sm text-red-600"
                                role="alert"
                            >
                                {message}
                            </p>
                        )}
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={handleDisconnect}
                        >
                            Disconnect
                        </Button>
                    </div>
                )}
            </section>
        </main>
    );
}

const root = document.getElementById('root');

if (!root) {
    throw new Error('SideWire side-panel root was not found.');
}

createRoot(root).render(
    <StrictMode>
        <SidePanel />
    </StrictMode>,
);
