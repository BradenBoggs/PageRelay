import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    invitation: string | null;
    email: string;
    organizationName: string | null;
};

export default function Register({
    invitation,
    email,
    organizationName,
}: Props) {
    return (
        <>
            <Head title="Create your account" />
            {invitation && (
                <p className="text-center text-sm">
                    You’re invited to join <strong>{organizationName}</strong>.
                    Create your account to accept the invitation.
                </p>
            )}
            <Form
                action="/register"
                method="post"
                transform={(data) =>
                    invitation ? { ...data, invitation, email } : data
                }
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        <InputError message={errors.invitation} />
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                autoComplete="name"
                                required
                                autoFocus
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                defaultValue={email}
                                readOnly={Boolean(invitation)}
                                required
                                autoComplete="email"
                            />
                            <InputError message={errors.email} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                required
                                autoComplete="new-password"
                            />
                            <InputError message={errors.password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                Confirm password
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                required
                                autoComplete="new-password"
                            />
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>
                        <Button type="submit" disabled={processing}>
                            {processing && <Spinner />}Create account
                        </Button>
                        <p className="text-center text-sm">
                            Already have an account?{' '}
                            <TextLink href="/login">Log in</TextLink>
                        </p>
                    </div>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Create your account',
    description: 'Get started on SideWire',
};
