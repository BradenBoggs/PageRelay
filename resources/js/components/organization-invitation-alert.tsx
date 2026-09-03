import type { OrganizationInvitationContext } from '@/types';

type Props = {
    invitation: OrganizationInvitationContext;
    action: 'Log in' | 'Register';
};

export default function OrganizationInvitationAlert({
    invitation,
    action,
}: Props) {
    return (
        <div className="bg-muted/40 rounded-lg border p-4 text-sm">
            <p className="font-medium">
                Invitation to {invitation.organizationName}
            </p>
            <p className="text-muted-foreground mt-1">
                {action} with the invited email address to join this SideWire
                organization.
            </p>
        </div>
    );
}
