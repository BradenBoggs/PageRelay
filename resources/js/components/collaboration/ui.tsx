import * as Dialog from '@radix-ui/react-dialog';
import { AlertCircle, Hash, X, type LucideIcon } from 'lucide-react';
import { useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { avatarTone, initials } from './presentation';

export function PersonAvatar({ name, chat = false, small = false }: { name: string; chat?: boolean; small?: boolean }) {
    return <span className={`sw-person-avatar${small ? ' sw-person-avatar-small' : ''}${chat ? ' sw-chat-avatar' : ''}`} data-tone={avatarTone(name)} aria-hidden="true">{chat ? <Hash /> : initials(name)}</span>;
}

export function IconButton({ icon: Icon, label, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string }) {
    return <button {...props} type="button" className={`sw-icon-button ${className}`} aria-label={label} title={label}><Icon aria-hidden="true" /></button>;
}

/** Same Radix dialog primitive as the web UI; independent of web-only aliases/Tailwind. */
export function CollaborationDialog({ open, onOpenChange, title, description, children, trigger }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; children: ReactNode; trigger?: ReactNode }) {
    const returnFocus = useRef<HTMLElement | null>(null);
    return <Dialog.Root open={open} onOpenChange={onOpenChange}>
        {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
        <Dialog.Portal>
            <Dialog.Overlay className="sw-dialog-overlay" />
            <Dialog.Content className="sw-collaboration sw-dialog-content" onOpenAutoFocus={() => {
                if (!trigger) returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            }} onCloseAutoFocus={(event) => {
                if (!trigger && returnFocus.current?.isConnected) { event.preventDefault(); returnFocus.current.focus(); }
            }}>
                <header className="sw-dialog-heading"><div><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{description}</Dialog.Description></div><Dialog.Close asChild><IconButton icon={X} label="Close dialog" /></Dialog.Close></header>
                {children}
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>;
}

export function InlineError({ children, retry }: { children: ReactNode; retry?: () => void }) {
    return <div className="sw-inline-error" role="alert"><AlertCircle aria-hidden="true" /><span>{children}</span>{retry && <button type="button" onClick={retry}>Try again</button>}</div>;
}

export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children: ReactNode; action?: ReactNode }) {
    return <div className="sw-empty-state"><span className="sw-empty-icon"><Icon aria-hidden="true" /></span><h3>{title}</h3><p>{children}</p>{action}</div>;
}

export function MessageSkeleton() {
    return <div className="sw-message-skeleton" role="status"><span className="sw-visually-hidden">Loading messages…</span>{[1, 2, 3].map((id) => <div key={id} aria-hidden="true"><i /><span><b /><b /></span></div>)}</div>;
}
