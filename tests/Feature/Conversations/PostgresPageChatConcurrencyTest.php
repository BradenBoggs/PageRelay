<?php

namespace Tests\Feature\Conversations;

use App\Domain\Conversations\CreatePageChat;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Facades\Concurrency;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PostgresPageChatConcurrencyTest extends TestCase
{
    public function test_concurrent_explicit_creates_reuse_one_context_and_chat(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('PostgreSQL is required for row-lock concurrency evidence.');
        }

        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $organizationId = $organization->id;
        $ownerId = $owner->id;

        $results = Concurrency::driver('process')->run([
            fn () => self::createFromSeparateProcess(
                $organizationId,
                $ownerId,
            ),
            fn () => self::createFromSeparateProcess(
                $organizationId,
                $ownerId,
            ),
        ]);

        try {
            $this->assertSame($results[0], $results[1]);
            $this->assertSame(1, $organization->conversations()->count());
            $this->assertSame(1, $organization->pageContexts()->count());
            $this->assertDatabaseCount('messages', 0);
        } finally {
            DB::table('activity_log')->delete();
            DB::table('messages')->delete();
            DB::table('page_contexts')->delete();
            DB::table('conversations')->delete();
        }
    }

    private static function createFromSeparateProcess(
        int $organizationId,
        int $ownerId,
    ): int {
        $context = app(CreatePageChat::class)->handle(
            Organization::query()->findOrFail($organizationId),
            User::query()->findOrFail($ownerId),
            'https://example.com/work/concurrent-processes',
            'Concurrent work',
            'Concurrent work',
            null,
        );

        return (int) $context->conversation_id;
    }
}
