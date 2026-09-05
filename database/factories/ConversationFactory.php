<?php

namespace Database\Factories;

use App\Enums\ConversationType;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Conversation> */
class ConversationFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $user = User::factory()->create();
        $organization = $user->organization()->firstOrFail();
        $workspace = $organization->defaultWorkspace()->firstOrFail();

        return [
            'organization_id' => $organization->id,
            'workspace_id' => $workspace->id,
            'type' => ConversationType::Page,
            'title' => fake()->sentence(4),
            'created_by' => $user->id,
        ];
    }
}
