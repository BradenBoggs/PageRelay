<?php

namespace Tests\Feature\PageContexts;

use App\Domain\PageContexts\SavePageLink;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UrlMatchingScopeEditTest extends TestCase
{
    use RefreshDatabase;

    public function test_exact_reset_cannot_silently_select_another_view(): void
    {
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $original = 'https://crm.example/records/123/view?tab=notes';
        $context = app(SavePageLink::class)->handle(
            $organization, $owner, $original, 'Record',
            ['mode' => 'prefix', 'path_depth' => 2, 'query_keys' => []], chatName: 'Record',
        );
        $payload = [
            'url' => 'https://crm.example/records/123/view?tab=files',
            'title' => 'Record',
            'matching' => ['mode' => 'exact'],
            'conversation_id' => $context->conversation->public_id,
            'expected_context_id' => $context->public_id,
            'expected_association_version' => $context->association_version,
        ];
        $this->actingAs($owner)->postJson('/page-links', $payload)
            ->assertConflict()->assertJsonPath('reason', 'representative_outside_scope');
        $this->assertNotNull($context->refresh()->url_match);
        $this->assertSame($original, $context->source_url);
        $payload['url'] = $original;
        $this->actingAs($owner)->postJson('/page-links', $payload)->assertSuccessful();
        $this->assertNull($context->refresh()->url_match);
        $this->assertSame($original, $context->source_url);
        $this->assertDatabaseCount('page_contexts', 1);
        $this->assertDatabaseCount('conversations', 1);
    }
}
