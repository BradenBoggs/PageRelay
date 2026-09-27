<?php

namespace Tests\Feature\PageContexts;

use App\Domain\PageContexts\SavePageLink;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\User;
use Illuminate\Support\Facades\Concurrency;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class PostgresUrlMatchingConcurrencyTest extends TestCase
{
    public function test_two_actors_creating_different_views_converge_on_one_scope(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('PostgreSQL required for independent-process row locks.');
        }
        $owner = User::factory()->create();
        $org = $owner->organization()->firstOrFail();
        $member = User::create(['name' => 'Concurrent member', 'email' => Str::uuid().'@example.test', 'password' => 'password', 'email_verified_at' => now()]);
        OrganizationMembership::create(['organization_id' => $org->id, 'user_id' => $member->id, 'role' => OrganizationRole::Member,
            'status' => OrganizationMembershipStatus::Active, 'is_billable' => true, 'joined_at' => now()]);
        $orgId = $org->id;
        $ownerId = $owner->id;
        $memberId = $member->id;
        $results = Concurrency::driver('process')->run([
            fn () => self::createScope($orgId, $ownerId, 'notes'),
            fn () => self::createScope($orgId, $memberId, 'files'),
        ]);
        $this->assertSame($results[0], $results[1]);
        $this->assertSame(1, $org->pageContexts()->count());
        $this->assertSame(1, $org->conversations()->count());
    }

    private static function createScope(int $orgId, int $userId, string $tab): int
    {
        return app(SavePageLink::class)->handle(Organization::findOrFail($orgId), User::findOrFail($userId),
            'https://crm.example/records/concurrent/view?tab='.$tab, 'Record',
            ['mode' => 'prefix', 'path_depth' => 2, 'query_keys' => []], chatName: 'Concurrent')->id;
    }
}
