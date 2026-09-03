import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import type { DashboardInvitation } from '@/types';

export default function Dashboard({
    pendingInvitations = [],
}: {
    pendingInvitations?: DashboardInvitation[];
}) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div>
                    <h1 className="text-2xl font-semibold">SideWire</h1>
                    <p className="text-muted-foreground mt-1">
                        The Laravel and organization foundation is ready for the
                        page-aware collaboration workflow.
                    </p>
                </div>

                {pendingInvitations.map((invitation) => (
                    <div
                        key={invitation.code}
                        className="rounded-xl border p-4"
                    >
                        <p className="font-medium">
                            {invitation.inviterName} invited you to{' '}
                            {invitation.organizationName}
                        </p>
                        <div className="mt-4 flex gap-2">
                            <Form
                                action={`/invitations/${invitation.code}/accept`}
                                method="post"
                            >
                                {({ processing }) => (
                                    <Button disabled={processing}>
                                        Accept
                                    </Button>
                                )}
                            </Form>
                            <Form
                                action={`/invitations/${invitation.code}`}
                                method="delete"
                            >
                                {({ processing }) => (
                                    <Button
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        Decline
                                    </Button>
                                )}
                            </Form>
                        </div>
                    </div>
                ))}

                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="bg-muted/30 aspect-video rounded-xl border" />
                    <div className="bg-muted/30 aspect-video rounded-xl border" />
                    <div className="bg-muted/30 aspect-video rounded-xl border" />
                </div>
                <div className="bg-muted/20 min-h-[60vh] flex-1 rounded-xl border" />
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: '/dashboard' }],
};
