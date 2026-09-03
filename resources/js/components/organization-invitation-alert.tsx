import type { OrganizationInvitationContext } from '@/types';

type Props = {
    invitation: OrganizationInvitationContext;
    action: 'Log in' | 'Register';
};

export default function OrganizationInvitationAlert({ invitation, action }: Props) {
    return (
        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            <p className="font-medium">Invitation to {invitation.organizationName}</p>
            <p className="mt-1 text-muted-foreground">
                {action} with the invited email address to join this SideWire organization.
            </p>
        </div>
    );
}
