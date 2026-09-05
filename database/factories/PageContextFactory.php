<?php

namespace Database\Factories;

use App\Models\PageContext;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<PageContext> */
class PageContextFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $user = User::factory()->create();
        $organization = $user->organization()->firstOrFail();
        $workspace = $organization->defaultWorkspace()->firstOrFail();
        $url = fake()->unique()->url();

        return [
            'organization_id' => $organization->id,
            'workspace_id' => $workspace->id,
            'source_url' => $url,
            'normalized_url' => $url,
            'normalized_url_hash' => hash('sha256', $url),
            'normalization_version' => 1,
            'source_host' => parse_url($url, PHP_URL_HOST),
            'title' => fake()->sentence(4),
            'created_by' => $user->id,
        ];
    }
}
