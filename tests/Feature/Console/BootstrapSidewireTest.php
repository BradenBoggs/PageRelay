<?php

namespace Tests\Feature\Console;

use App\Actions\Organizations\CreateOrganization;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Queue;
use RuntimeException;
use Tests\TestCase;

class BootstrapSidewireTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();
    }

    /** @return array<string, string> */
    private function arguments(): array
    {
        return ['email' => 'BOOTSTRAP@example.com', '--name' => 'Initial Owner', '--organization' => 'Initial Company'];
    }

    public function test_bootstrap_creates_a_verified_owner_and_default_workspace_who_can_log_in(): void
    {
        $this->artisan('sidewire:bootstrap', $this->arguments())
            ->expectsQuestion('Password', 'password')
            ->expectsQuestion('Confirm password', 'password')
            ->assertSuccessful();

        $user = User::query()->sole();
        $organization = Organization::query()->sole();
        $membership = $user->organizationMembership()->sole();
        $this->assertSame('bootstrap@example.com', $user->email);
        $this->assertTrue(Hash::check('password', $user->password));
        $this->assertNotSame('password', $user->password);
        $this->assertTrue($user->hasVerifiedEmail());
        $this->assertFalse($user->is_sidewire_admin);
        $this->assertSame('Initial Company', $organization->name);
        $this->assertSame(OrganizationRole::Owner, $membership->role);
        $this->assertSame(OrganizationMembershipStatus::Active, $membership->status);
        $this->assertTrue($membership->is_billable);
        $this->assertSame($organization->id, $membership->organization_id);
        $this->assertSame(1, $organization->workspaces()->count());
        $this->assertTrue($organization->workspaces()->sole()->is_default);

        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect(route('dashboard'));
        $this->assertAuthenticatedAs($user);
    }

    public function test_repeated_bootstrap_refuses_to_change_existing_credentials_or_membership(): void
    {
        $user = User::factory()->create(['email' => 'bootstrap@example.com']);
        $passwordHash = $user->password;
        $membership = $user->organizationMembership()->sole();
        $this->artisan('sidewire:bootstrap', $this->arguments())->assertFailed();
        $this->assertSame($passwordHash, $user->fresh()->password);
        $this->assertSame($membership->id, $user->fresh()->organizationMembership()->sole()->id);
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('organizations', 1);
    }

    public function test_an_existing_organization_without_a_user_blocks_bootstrap(): void
    {
        Organization::factory()->create();
        $this->artisan('sidewire:bootstrap', $this->arguments())->assertFailed();
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('organizations', 1);
    }

    public function test_password_confirmation_failure_creates_nothing(): void
    {
        $this->artisan('sidewire:bootstrap', $this->arguments())
            ->expectsQuestion('Password', 'password')
            ->expectsQuestion('Confirm password', 'different')
            ->assertFailed();
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('organizations', 0);
    }

    public function test_invalid_email_creates_nothing(): void
    {
        $arguments = $this->arguments();
        $arguments['email'] = 'invalid';
        $this->artisan('sidewire:bootstrap', $arguments)
            ->expectsQuestion('Password', 'password')
            ->expectsQuestion('Confirm password', 'password')
            ->assertFailed();
        $this->assertDatabaseCount('users', 0);
    }

    public function test_organization_creation_failure_rolls_back_the_user(): void
    {
        $this->mock(CreateOrganization::class, fn ($mock) => $mock->shouldReceive('handle')->once()->andThrow(new RuntimeException('Fixture failure')));
        $this->artisan('sidewire:bootstrap', $this->arguments())
            ->expectsQuestion('Password', 'password')
            ->expectsQuestion('Confirm password', 'password')
            ->assertFailed();
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('organization_memberships', 0);
        $this->assertDatabaseCount('organizations', 0);
        $this->assertDatabaseCount('workspaces', 0);
    }

    public function test_lock_contention_creates_nothing(): void
    {
        $lock = Cache::lock('sidewire:bootstrap', 60);
        $this->assertTrue($lock->get());
        try {
            $this->artisan('sidewire:bootstrap', $this->arguments())
                ->expectsQuestion('Password', 'password')
                ->expectsQuestion('Confirm password', 'password')
                ->assertFailed();
            $this->assertDatabaseCount('users', 0);
        } finally {
            $lock->release();
        }
    }

    public function test_noninteractive_bootstrap_refuses_an_unprompted_password(): void
    {
        $arguments = $this->arguments();
        $arguments['--no-interaction'] = true;
        $this->artisan('sidewire:bootstrap', $arguments)->assertFailed();
        $this->assertDatabaseCount('users', 0);
    }

    public function test_explicit_bootstrap_password_does_not_depend_on_web_production_password_policy(): void
    {
        $this->app->instance('env', 'production');
        $this->artisan('sidewire:bootstrap', $this->arguments())
            ->expectsQuestion('Password', 'password')
            ->expectsQuestion('Confirm password', 'password')
            ->assertSuccessful();
        $this->assertTrue(Hash::check('password', User::query()->sole()->password));
    }
}
