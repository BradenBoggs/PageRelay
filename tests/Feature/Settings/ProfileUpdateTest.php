<?php

namespace Tests\Feature\Settings;

use App\Domain\Teams\AddMemberToTeam;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Models\OrganizationInvitation;
use App\Models\OrganizationMembership;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->get(route('profile.edit'))->assertOk();
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('profile.edit'));

        $user->refresh();
        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
    }

    public function test_verified_unaffiliated_users_can_review_only_their_pending_invitations_in_profile(): void
    {
        $owner = User::factory()->create();
        $user = $this->unaffiliatedUser();
        $invitation = $this->invitation($owner, $user->email);
        $this->invitation($owner, 'other@example.com');
        $this->invitation($owner, $user->email)->update(['expires_at' => now()->subDay()]);
        $this->actingAs($user)->get(route('profile.edit'))
            ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('settings/profile')
            ->has('pendingInvitations', 1)
            ->where('pendingInvitations.0.code', $invitation->code));
    }

    public function test_unverified_users_do_not_receive_invitation_details_in_profile(): void
    {
        $owner = User::factory()->create();
        $user = $this->unaffiliatedUser();
        $user->email_verified_at = null;
        $user->save();
        $this->invitation($owner, $user->email);
        $this->actingAs($user)->get(route('profile.edit'))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->has('pendingInvitations', 0));
    }

    public function test_accepting_a_profile_invitation_still_joins_the_intended_organization_and_lands_in_messages(): void
    {
        $owner = User::factory()->create();
        $user = $this->unaffiliatedUser();
        $invitation = $this->invitation($owner, $user->email);
        $this->actingAs($user)->post(route('invitations.accept', $invitation))->assertRedirect(route('home'));
        $this->assertSame($invitation->organization_id, $user->fresh()->organization()->sole()->id);
        $this->get(route('home'))->assertRedirect(route('messages.index'));
    }

    public function test_a_removed_member_can_accept_an_invitation_from_another_organization(): void
    {
        $formerOwner = User::factory()->create();
        $owner = User::factory()->create();
        $user = $this->removedMember($formerOwner);
        $invitation = $this->invitation($owner, $user->email);
        $this->actingAs($user)->get(route('profile.edit'))
            ->assertInertia(fn (Assert $page) => $page->has('pendingInvitations', 1));

        $this->actingAs($user)->post(route('invitations.accept', $invitation))->assertRedirect(route('home'));

        $membership = OrganizationMembership::where('user_id', $user->id)->sole();
        $this->assertSame($invitation->organization_id, $membership->organization_id);
        $this->assertSame(OrganizationMembershipStatus::Active, $membership->status);
        $this->assertSame(OrganizationRole::Member, $membership->role);
        $this->assertTrue($membership->is_billable);
        $this->assertNull($membership->removed_at);
        $this->assertNotNull($invitation->fresh()->accepted_at);
        $this->get(route('home'))->assertRedirect(route('messages.index'));
    }

    public function test_a_removed_member_can_rejoin_the_same_organization_without_old_team_memberships(): void
    {
        $owner = User::factory()->create();
        $user = $this->removedMember($owner, withTeam: true);
        $invitation = $this->invitation($owner, $user->email);

        $this->actingAs($user)->post(route('invitations.accept', $invitation))->assertRedirect(route('home'));

        $membership = OrganizationMembership::where('user_id', $user->id)->sole();
        $this->assertSame($owner->organization()->sole()->id, $membership->organization_id);
        $this->assertSame(OrganizationMembershipStatus::Active, $membership->status);
        $this->assertSame(0, $user->teamMemberships()->count());
    }

    public function test_an_active_member_cannot_accept_another_invitation(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create(['email' => 'member@example.com']);
        $invitation = $this->invitation($owner, $member->email);
        $organizationId = $member->organization()->sole()->id;

        $this->actingAs($member)->post(route('invitations.accept', $invitation))->assertStatus(409);

        $this->assertSame($organizationId, $member->fresh()->organization()->sole()->id);
        $this->assertNull($invitation->fresh()->accepted_at);
    }

    public function test_declining_a_profile_invitation_keeps_the_user_on_the_profile_landing(): void
    {
        $owner = User::factory()->create();
        $user = $this->unaffiliatedUser();
        $invitation = $this->invitation($owner, $user->email);
        $this->actingAs($user)->delete(route('invitations.decline', $invitation))->assertRedirect(route('home'));
        $this->get(route('home'))->assertRedirect(route('profile.edit'));
        $this->assertDatabaseMissing('organization_invitations', ['id' => $invitation->id]);
    }

    private function unaffiliatedUser(): User
    {
        $user = new User(['name' => 'Invitee', 'email' => 'invitee@example.com', 'password' => 'password']);
        $user->email_verified_at = now();
        $user->save();

        return $user;
    }

    private function removedMember(User $owner, bool $withTeam = false): User
    {
        $user = $this->unaffiliatedUser();
        $organization = $owner->organization()->sole();
        $membership = OrganizationMembership::create([
            'organization_id' => $organization->id, 'user_id' => $user->id,
            'role' => OrganizationRole::Administrator, 'status' => OrganizationMembershipStatus::Active,
            'is_billable' => true, 'joined_at' => now()->subMonth(),
        ]);
        if ($withTeam) {
            app(AddMemberToTeam::class)->handle(Team::factory()->create(['organization_id' => $organization->id]), $user);
        }
        $membership->update([
            'status' => OrganizationMembershipStatus::Removed,
            'is_billable' => false, 'removed_at' => now()->subWeek(),
        ]);

        return $user;
    }

    private function invitation(User $owner, string $email): OrganizationInvitation
    {
        return OrganizationInvitation::create([
            'organization_id' => $owner->organization()->sole()->id,
            'email' => $email, 'role' => OrganizationRole::Member,
            'invited_by' => $owner->id, 'expires_at' => now()->addDay(),
        ]);
    }
}
