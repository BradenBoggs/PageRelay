<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Message> */
class MessageFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $conversation = Conversation::factory()->create();

        return [
            'organization_id' => $conversation->organization_id,
            'workspace_id' => $conversation->workspace_id,
            'conversation_id' => $conversation->id,
            'author_id' => $conversation->created_by,
            'idempotency_key' => (string) Str::uuid(),
            'body' => fake()->sentence(),
        ];
    }
}
