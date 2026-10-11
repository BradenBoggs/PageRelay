<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_old_dashboard_links_redirect_to_home(): void
    {
        $this->get(route('dashboard'))->assertRedirect(route('home'));
    }

    public function test_old_dashboard_links_no_longer_render_a_page(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('home'));
    }
}
