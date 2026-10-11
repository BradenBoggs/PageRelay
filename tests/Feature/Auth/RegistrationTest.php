<?php

namespace Tests\Feature\Auth;

use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Models\OrganizationInvitation;
use App\Models\User;
use App\Notifications\Organizations\OrganizationInvitationNotification;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Env;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Fortify\Features;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_registration_remains_closed(): void
    {
        $this->assertFalse(Features::enabled(Features::registration()));
        $this->get('/register')->assertNotFound();
        $this->postJson('/register', $this->payload())->assertUnprocessable()->assertJsonValidationErrors('invitation');
        $this->assertGuest();
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('organizations', 0);
    }

    public function test_valid_invitation_displays_signup_and_old_login_links_redirect_to_it(): void
    {
        $invitation = $this->invitation();
        $this->get(route('register', ['invitation' => $invitation->code]))->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertInertia(fn (Assert $page) => $page->component('auth/register')
                ->where('invitation', $invitation->code)->where('email', $invitation->email)
                ->where('organizationName', $invitation->organization->name));
        $this->get(route('login', ['invitation' => $invitation->code]))
            ->assertRedirect(route('register', ['invitation' => $invitation->code]));
    }

    public function test_invited_signup_joins_only_the_inviting_organization_and_requires_verification(): void
    {
        Notification::fake();
        $invitation = $this->invitation();
        $this->post('/register', $this->payload($invitation))->assertRedirect('/');
        $user = User::where('email', $invitation->email)->firstOrFail();
        $this->assertAuthenticatedAs($user);
        $this->assertTrue(Hash::check('password', $user->password));
        $this->assertNull($user->email_verified_at);
        Notification::assertSentTo($user, VerifyEmail::class);
        $this->assertDatabaseCount('organizations', 1);
        $this->assertDatabaseCount('users', 2);
        $this->assertDatabaseHas('organization_memberships', [
            'user_id' => $user->id, 'organization_id' => $invitation->organization_id,
            'role' => OrganizationRole::Member->value, 'status' => OrganizationMembershipStatus::Active->value,
            'is_billable' => true,
        ]);
        $this->assertNotNull($invitation->fresh()->accepted_at);
        $this->get('/messages')->assertRedirect(route('verification.notice'));
        $user->markEmailAsVerified();
        $this->actingAs($user->fresh())->get('/')->assertRedirect(route('messages.index'));
    }

    public static function unavailableInvitations(): array
    {
        return array_merge(...array_map(fn (string $state) => [[$state, false], [$state, true]], ['expired', 'accepted', 'revoked', 'organization-deleted', 'forged']));
    }

    #[DataProvider('unavailableInvitations')]
    public function test_unavailable_invitations_cannot_display_signup_or_create_users(string $state, bool $publicRegistration): void
    {
        config(['fortify.registration_enabled' => $publicRegistration]);
        $invitation = $this->invitation();
        $code = $invitation->code;
        match ($state) {
            'expired' => $invitation->update(['expires_at' => now()->subSecond()]),
            'accepted' => $invitation->update(['accepted_at' => now()]),
            'revoked' => $invitation->delete(),
            'organization-deleted' => $invitation->organization->delete(),
            'forged' => $code = str_repeat('x', 64),
        };
        $this->get(route('register', ['invitation' => $code]))->assertNotFound();
        $this->postJson('/register', [...$this->payload($invitation), 'invitation' => $code])
            ->assertUnprocessable();
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('organization_memberships', 1);
        $this->assertGuest();
    }

    public function test_wrong_email_and_invalid_password_do_not_consume_the_invitation(): void
    {
        $invitation = $this->invitation();
        $this->postJson('/register', [...$this->payload($invitation), 'email' => 'other@example.com'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->postJson('/register', [...$this->payload($invitation), 'password_confirmation' => 'different'])
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->assertDatabaseCount('users', 1);
        $this->assertNull($invitation->fresh()->accepted_at);
    }

    public function test_existing_accounts_are_sent_to_login_and_are_not_overwritten(): void
    {
        $invitation = $this->invitation();
        $user = User::create(['name' => 'Existing', 'email' => $invitation->email, 'password' => 'original']);
        $this->get(route('register', ['invitation' => $invitation->code]))
            ->assertRedirect(route('login', ['invitation' => $invitation->code]));
        $this->get(route('login', ['invitation' => $invitation->code]))->assertOk();
        $this->postJson('/register', $this->payload($invitation))->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertTrue(Hash::check('original', $user->fresh()->password));
        $this->assertNull($invitation->fresh()->accepted_at);
        $this->assertDatabaseCount('organizations', 1);
    }

    public function test_invitation_cannot_be_reused_after_signup(): void
    {
        Notification::fake();
        $invitation = $this->invitation();
        $this->postJson('/register', $this->payload($invitation))->assertCreated();
        auth()->logout();
        $this->postJson('/register', [...$this->payload($invitation), 'email' => 'another@example.com'])->assertUnprocessable();
        $this->assertDatabaseCount('users', 2);
        $this->assertDatabaseCount('organizations', 1);
        $this->assertDatabaseCount('organization_memberships', 2);
    }

    public function test_invitation_email_links_to_invitation_only_signup(): void
    {
        $invitation = $this->invitation();
        $mail = (new OrganizationInvitationNotification($invitation))->toMail(new \stdClass);
        $this->assertSame(route('register', ['invitation' => $invitation->code]), $mail->actionUrl);
        $this->assertSame('Join organization', $mail->actionText);
    }

    public static function registrationFlags(): array
    {
        return [[null, false], ['false', false], ['true', true]];
    }

    #[DataProvider('registrationFlags')]
    public function test_registration_flag_reads_the_environment_and_defaults_to_false(?string $value, bool $expected): void
    {
        $environment = Env::getRepository();
        $original = $environment->get('REGISTRATION_ENABLED');
        try {
            $value === null ? $environment->clear('REGISTRATION_ENABLED') : $environment->set('REGISTRATION_ENABLED', $value);
            $configuration = require base_path('config/fortify.php');
            $this->assertSame($expected, $configuration['registration_enabled']);
        } finally {
            $original === null ? $environment->clear('REGISTRATION_ENABLED') : $environment->set('REGISTRATION_ENABLED', $original);
        }
    }

    public function test_public_signup_link_and_page_follow_the_configured_flag(): void
    {
        config(['fortify.registration_enabled' => false]);
        $this->get(route('login'))->assertInertia(fn (Assert $page) => $page->where('canRegister', false));
        $this->get('/register')->assertNotFound();
        config(['fortify.registration_enabled' => true]);
        $this->get(route('login'))->assertInertia(fn (Assert $page) => $page->where('canRegister', true));
        $this->get('/register')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('auth/register')->where('invitation', null)->where('email', '')->where('organizationName', null));
    }

    public function test_enabled_public_signup_creates_an_unverified_owner_with_default_workspace(): void
    {
        Notification::fake();
        config(['fortify.registration_enabled' => true]);
        $this->post('/register', $this->payload())->assertRedirect('/');
        $user = User::where('email', 'uninvited@example.com')->sole();
        $this->assertAuthenticatedAs($user);
        $this->assertTrue(Hash::check('password', $user->password));
        $this->assertNull($user->email_verified_at);
        $this->assertFalse($user->is_sidewire_admin);
        Notification::assertSentTo($user, VerifyEmail::class);
        $membership = $user->organizationMembership()->sole();
        $this->assertSame(OrganizationRole::Owner, $membership->role);
        $this->assertTrue($membership->is_billable);
        $this->assertSame('Invited User Company', $user->organization()->sole()->name);
        $this->assertTrue($user->organization()->sole()->workspaces()->sole()->is_default);
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('organizations', 1);
        $this->get('/messages')->assertRedirect(route('verification.notice'));
    }

    public function test_enabling_public_signup_preserves_invitation_membership_and_rejects_invalid_invitation_fallback(): void
    {
        Notification::fake();
        config(['fortify.registration_enabled' => true]);
        $invitation = $this->invitation();
        $this->postJson('/register', [...$this->payload($invitation), 'invitation' => str_repeat('x', 64)])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->postJson('/register', [...$this->payload($invitation), 'invitation' => ''])
            ->assertUnprocessable()->assertJsonValidationErrors('invitation');
        $this->postJson('/register', [...$this->payload($invitation), 'email' => 'wrong@example.com'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('organizations', 1);
        $this->assertNull($invitation->fresh()->accepted_at);
        $this->postJson('/register', $this->payload($invitation))->assertCreated();
        $user = User::where('email', $invitation->email)->sole();
        $this->assertSame($invitation->organization_id, $user->organization()->sole()->id);
        $this->assertSame(OrganizationRole::Member, $user->organizationRole());
        $this->assertDatabaseCount('organizations', 1);
    }

    private function payload(?OrganizationInvitation $invitation = null): array
    {
        return [
            'name' => 'Invited User', 'email' => $invitation?->email ?? 'uninvited@example.com',
            'password' => 'password', 'password_confirmation' => 'password',
            ...($invitation ? ['invitation' => $invitation->code] : []),
        ];
    }

    private function invitation(): OrganizationInvitation
    {
        $owner = User::factory()->create();

        return OrganizationInvitation::create([
            'organization_id' => $owner->organization()->firstOrFail()->id,
            'email' => 'invited@example.com', 'role' => OrganizationRole::Member,
            'invited_by' => $owner->id, 'expires_at' => now()->addDays(3),
        ]);
    }
}
