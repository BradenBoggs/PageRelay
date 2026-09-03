<?php

namespace Tests\Feature\WorkspacesAndTeams;

use App\Domain\Teams\AddMemberToTeam;
use App\Domain\Workspaces\EnsureDefaultWorkspace;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Enums\TeamRole;
use App\Models\OrganizationMembership;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkspacesAndTeamsFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_organization_creation_creates_one_default_workspace(): void
    {
        $user = User::factory()->create();
        $organization = $user->organization()->firstOrFail();

        $this->assertCount(1, $organization->workspaces);
        $this->assertTrue($organization->defaultWorkspace()->firstOrFail()->is_default);
        $this->assertSame('main', $organization->defaultWorkspace()->firstOrFail()->slug);
    }

    public function test_default_workspace_reconciliation_is_idempotent(): void
    {
        $user = User::factory()->create();
        $organization = $user->organization()->firstOrFail();
        $service = app(EnsureDefaultWorkspace::class);

        $first = $service->handle($organization);
        $second = $service->handle($organization);

        $this->assertTrue($first->is($second));
        $this->assertSame(1, $organization->workspaces()->count());
    }

    public function test_an_active_organization_member_can_join_a_team(): void
    {
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $member = $this->createUserWithoutOrganization('member@example.com');

        $this->addOrganizationMembership($organization->id, $member->id);
        $team = Team::factory()->create(['organization_id' => $organization->id]);

        $membership = app(AddMemberToTeam::class)->handle(
            $team,
            $member,
            TeamRole::Manager,
        );

        $this->assertSame(TeamRole::Manager, $membership->role);
        $this->assertTrue($member->teams()->whereKey($team->id)->exists());
    }

    public function test_a_user_from_another_organization_cannot_join_the_team(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $team = Team::factory()->create([
            'organization_id' => $owner->organization()->firstOrFail()->id,
        ]);

        $this->expectException(ModelNotFoundException::class);

        app(AddMemberToTeam::class)->handle($team, $outsider);
    }

    public function test_the_database_rejects_cross_organization_team_membership(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $team = Team::factory()->create(['organization_id' => $organization->id]);

        $this->expectException(QueryException::class);

        TeamMembership::create([
            'team_id' => $team->id,
            'organization_id' => $organization->id,
            'user_id' => $outsider->id,
            'role' => TeamRole::Member,
        ]);
    }

    public function test_multiple_team_memberships_do_not_add_billable_seats(): void
    {
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $member = $this->createUserWithoutOrganization('seat@example.com');

        $this->addOrganizationMembership($organization->id, $member->id);

        $firstTeam = Team::factory()->create(['organization_id' => $organization->id]);
        $secondTeam = Team::factory()->create(['organization_id' => $organization->id]);

        app(AddMemberToTeam::class)->handle($firstTeam, $member);
        app(AddMemberToTeam::class)->handle($secondTeam, $member);

        $this->assertSame(2, $organization->billableSeatCount());
        $this->assertSame(2, $member->teamMemberships()->count());
    }

    private function createUserWithoutOrganization(string $email): User
    {
        return User::create([
            'name' => 'Organization Member',
            'email' => $email,
            'email_verified_at' => now(),
            'password' => 'password',
        ]);
    }

    private function addOrganizationMembership(int $organizationId, int $userId): void
    {
        OrganizationMembership::create([
            'organization_id' => $organizationId,
            'user_id' => $userId,
            'role' => OrganizationRole::Member,
            'status' => OrganizationMembershipStatus::Active,
            'is_billable' => true,
            'joined_at' => now(),
        ]);
    }
}
