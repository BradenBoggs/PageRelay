<?php

namespace Tests\Feature\Auth;

use App\Enums\OrganizationRole;
use App\Models\OrganizationInvitation;
use App\Models\User;
use App\Notifications\Organizations\OrganizationInvitationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_routes_are_disabled(): void
    {
        $this->assertFalse(Features::enabled(Features::registration()));
        $this->assertFalse(Route::has('register'));
        $this->assertFalse(Route::has('register.store'));
        $this->get('/register')->assertNotFound();
    }

    public function test_posting_registration_cannot_create_an_account(): void
    {
        $this->post('/register', [
            'name' => 'Uninvited User', 'email' => 'uninvited@example.com',
            'password' => 'password', 'password_confirmation' => 'password',
        ])->assertNotFound();
        $this->assertGuest();
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('organizations', 0);
    }

    public function test_an_invitation_does_not_reenable_registration(): void
    {
        $invitation = $this->invitation();
        $this->get('/register?invitation='.$invitation->code)->assertNotFound();
        $this->post('/register', [
            'name' => 'Invited User', 'email' => $invitation->email,
            'password' => 'password', 'password_confirmation' => 'password',
            'invitation' => $invitation->code,
        ])->assertNotFound();
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('organizations', 1);
        $this->assertNull($invitation->fresh()->accepted_at);
    }

    public function test_invitation_email_links_to_login_without_a_registration_route(): void
    {
        $invitation = $this->invitation();
        $mail = (new OrganizationInvitationNotification($invitation))->toMail(new \stdClass);
        $this->assertSame(route('login', ['invitation' => $invitation->code]), $mail->actionUrl);
        $this->assertSame('Log in to SideWire', $mail->actionText);
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
