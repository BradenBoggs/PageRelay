import { Form, Head } from '@inertiajs/react';
import { CheckCircle2, Clock3, ShieldCheck } from 'lucide-react';
import ExtensionConnectionController from '@/actions/App/Http/Controllers/ExtensionConnectionController';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    handoff: {
        id: string;
        expiresAt: string;
        status: 'ready' | 'connected' | 'expired';
    };
    organization: {
        name: string;
    };
};

export default function ConnectExtension({ handoff, organization }: Props) {
    return (
        <>
            <Head title="Connect Chrome extension" />

            {handoff.status === 'expired' && (
                <Card role="status">
                    <CardHeader>
                        <Clock3 className="text-muted-foreground size-5" />
                        <CardTitle>Connection request expired</CardTitle>
                        <CardDescription>
                            Return to the SideWire panel and start a new
                            request.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => window.close()}
                        >
                            Close this tab
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {handoff.status === 'connected' && (
                <Card role="status">
                    <CardHeader>
                        <CheckCircle2 className="size-5 text-green-600" />
                        <CardTitle>SideWire is connected</CardTitle>
                        <CardDescription>
                            The extension is connected to {organization.name}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-sm leading-6">
                            Return to the Chrome side panel. You can safely
                            close this tab.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            onClick={() => window.close()}
                        >
                            Close this tab
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {handoff.status === 'ready' && (
                <Card>
                    <CardHeader>
                        <ShieldCheck className="text-muted-foreground size-5" />
                        <CardDescription>Organization</CardDescription>
                        <CardTitle>{organization.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-sm leading-6">
                            This gives the SideWire extension access to your
                            SideWire account. It does not give SideWire access
                            to the contents of other websites.
                        </p>
                    </CardContent>
                    <CardFooter className="flex-col gap-2">
                        <Form
                            {...ExtensionConnectionController.store.form(
                                handoff.id,
                            )}
                            className="w-full"
                        >
                            {({ processing }) => (
                                <Button
                                    className="w-full"
                                    disabled={processing}
                                    type="submit"
                                >
                                    {processing && <Spinner />}
                                    Connect extension
                                </Button>
                            )}
                        </Form>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => window.close()}
                        >
                            Cancel
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </>
    );
}

ConnectExtension.layout = {
    title: 'Connect SideWire',
    description:
        'Confirm the account and organization for this Chrome extension.',
};
