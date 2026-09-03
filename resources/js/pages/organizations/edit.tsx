import { Form, Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
    Organization,
    OrganizationInvitation,
    OrganizationMember,
    OrganizationPermissions,
    RoleOption,
} from '@/types';

type Props = {
    organization: Organization;
    members: OrganizationMember[];
    invitations: OrganizationInvitation[];
    permissions: OrganizationPermissions;
    availableRoles: RoleOption[];
};

export default function OrganizationSettings({
    organization,
    members,
    invitations,
    permissions,
    availableRoles,
}: Props) {
    return (
        <>
            <Head title="Organization settings" />
            <h1 className="sr-only">Organization settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Organization"
                    description="Your company account, membership boundary, and billing owner"
                />

                <Form
                    action="/settings/organization"
                    method="patch"
                    options={{ preserveScroll: true }}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="organization-name">Organization name</Label>
                                <Input
                                    id="organization-name"
                                    name="name"
                                    defaultValue={organization.name}
                                    disabled={!permissions.canUpdateOrganization}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>
                            {permissions.canUpdateOrganization && (
                                <Button disabled={processing}>Save organization</Button>
                            )}
                        </>
                    )}
                </Form>
            </div>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Members"
                    description="Each active organization member consumes one billable seat"
                />

                <div className="divide-y rounded-lg border">
                    {members.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-4">
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{member.name}</p>
                                <p className="truncate text-sm text-muted-foreground">
                                    {member.email} · {member.roleLabel}
                                </p>
                            </div>

                            {member.role !== 'owner' && permissions.canUpdateMember && (
                                <Form
                                    action={`/settings/organization/members/${member.id}`}
                                    method="patch"
                                    options={{ preserveScroll: true }}
                                    className="flex items-center gap-2"
                                >
                                    {({ processing }) => (
                                        <>
                                            <select
                                                name="role"
                                                defaultValue={member.role}
                                                className="h-9 rounded-md border bg-background px-3 text-sm"
                                            >
                                                {availableRoles.map((role) => (
                                                    <option key={role.value} value={role.value}>
                                                        {role.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <Button size="sm" variant="outline" disabled={processing}>
                                                Update
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            )}

                            {member.role !== 'owner' && permissions.canRemoveMember && (
                                <Form
                                    action={`/settings/organization/members/${member.id}`}
                                    method="delete"
                                    options={{ preserveScroll: true }}
                                >
                                    {({ processing }) => (
                                        <Button size="sm" variant="destructive" disabled={processing}>
                                            Remove
                                        </Button>
                                    )}
                                </Form>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {permissions.canCreateInvitation && (
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Invite a member"
                        description="Pending invitations are not billed until the person joins"
                    />

                    <Form
                        action="/settings/organization/invitations"
                        method="post"
                        options={{ preserveScroll: true }}
                        resetOnSuccess
                        className="grid gap-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="invite-email">Email address</Label>
                                    <Input
                                        id="invite-email"
                                        name="email"
                                        type="email"
                                        placeholder="teammate@example.com"
                                        required
                                    />
                                    <InputError message={errors.email} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="invite-role">Organization role</Label>
                                    <select
                                        id="invite-role"
                                        name="role"
                                        defaultValue="member"
                                        className="h-10 rounded-md border bg-background px-3 text-sm"
                                    >
                                        {availableRoles.map((role) => (
                                            <option key={role.value} value={role.value}>
                                                {role.label}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.role} />
                                </div>
                                <Button disabled={processing}>Send invitation</Button>
                            </>
                        )}
                    </Form>
                </div>
            )}

            {invitations.length > 0 && (
                <div className="space-y-4">
                    <Heading
                        variant="small"
                        title="Pending invitations"
                        description="These invitations do not count as seats yet"
                    />
                    <div className="divide-y rounded-lg border">
                        {invitations.map((invitation) => (
                            <div key={invitation.code} className="flex items-center gap-3 p-4">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">{invitation.email}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {invitation.roleLabel}
                                    </p>
                                </div>
                                {permissions.canCancelInvitation && (
                                    <Form
                                        action={`/settings/organization/invitations/${invitation.code}`}
                                        method="delete"
                                        options={{ preserveScroll: true }}
                                    >
                                        {({ processing }) => (
                                            <Button size="sm" variant="outline" disabled={processing}>
                                                Cancel
                                            </Button>
                                        )}
                                    </Form>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

OrganizationSettings.layout = {
    breadcrumbs: [
        { title: 'Organization settings', href: '/settings/organization' },
    ],
};
