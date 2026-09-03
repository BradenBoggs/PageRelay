import type { Auth } from '@/types/auth';
import type { Organization } from '@/types/organizations';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            organization: Organization | null;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
