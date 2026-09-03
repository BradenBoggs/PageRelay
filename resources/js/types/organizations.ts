export type OrganizationRole = 'owner' | 'admin' | 'member';

export type Organization = {
    id: number;
    name: string;
    slug: string;
    role?: OrganizationRole;
    roleLabel?: string;
};

export type OrganizationMember = {
    id: number;
    name: string;
    email: string;
    role: OrganizationRole;
    roleLabel: string;
};

export type OrganizationInvitation = {
    code: string;
    email: string;
    role: OrganizationRole;
    roleLabel: string;
    createdAt: string;
};

export type OrganizationInvitationContext = {
    code: string;
    organizationName: string;
};

export type DashboardInvitation = {
    code: string;
    inviterName: string;
    organizationName: string;
};

export type OrganizationPermissions = {
    canUpdateOrganization: boolean;
    canDeleteOrganization: boolean;
    canManageBilling: boolean;
    canAddMember: boolean;
    canUpdateMember: boolean;
    canRemoveMember: boolean;
    canCreateInvitation: boolean;
    canCancelInvitation: boolean;
};

export type RoleOption = {
    value: Exclude<OrganizationRole, 'owner'>;
    label: string;
};
