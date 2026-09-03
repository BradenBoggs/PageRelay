<?php

namespace Tests\Feature\Teams;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TeamFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_factory_creates_one_owned_team_without_tenant_switching_state(): void
    {
        $user = User::factory()->create();

        $this->assertCount(1, $user->teams);
        $this->assertTrue($user->ownsTeam($user->teams->first()));
        $this->assertFalse(Schema::hasColumn('users', 'current_'.'team_id'));
        $this->assertFalse(Schema::hasColumn('teams', 'is_'.'personal'));
    }
}
