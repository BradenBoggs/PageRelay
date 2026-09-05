import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
    }
}

const key = import.meta.env.VITE_REVERB_APP_KEY;
const isBrowser = typeof window !== 'undefined';

if (isBrowser) {
    window.Pusher = Pusher;
}

export const echo =
    isBrowser && key
        ? new Echo({
              broadcaster: 'reverb',
              key,
              wsHost: import.meta.env.VITE_REVERB_HOST,
              wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 80),
              wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
              forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
              enabledTransports: ['ws', 'wss'],
          })
        : null;
