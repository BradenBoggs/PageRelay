<?php

use App\Domain\Conversations\CreateDirectChat;
use App\Domain\Conversations\SendCollaborationMessage;
use App\Enums\ConversationType;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\OrganizationMembership;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (! $app->environment('testing') || config('database.default') !== 'sqlite'
    || config('database.connections.sqlite.database') !== '/private/tmp/sidewire-desktop-browser/data.sqlite') {
    throw new RuntimeException('Only the disposable desktop-browser SQLite database is supported.');
}

$fixtures = [];
foreach ([1440, 390] as $width) {
    foreach (['mention', 'direct', 'thread'] as $kind) {
        $owner = User::factory()->create(['name' => 'Review Sender']);
        $organization = $owner->organization()->firstOrFail();
        $member = User::query()->create(['name' => 'Review Recipient', 'email' => 'desktop-'.$width.'-'.$kind.'@example.test', 'password' => 'password']);
        $member->forceFill(['email_verified_at' => now()])->save();
        OrganizationMembership::query()->create([
            'organization_id' => $organization->id, 'user_id' => $member->id,
            'role' => OrganizationRole::Member, 'status' => OrganizationMembershipStatus::Active,
            'is_billable' => true, 'joined_at' => now(),
        ]);
        DB::table('notification_preferences')->insert([
            'organization_id' => $organization->id, 'user_id' => $member->id, 'enabled_at' => now()->subMinute(),
        ]);
        $work = Conversation::query()->create([
            'organization_id' => $organization->id, 'workspace_id' => $organization->defaultWorkspace()->firstOrFail()->id,
            'type' => ConversationType::Page, 'title' => 'Dispatch review', 'created_by' => $owner->id,
        ]);
        $direct = $app->make(CreateDirectChat::class)->handle($organization, $owner, $member->id);
        $send = $app->make(SendCollaborationMessage::class);
        $chat = $kind === 'direct' ? $direct : $work;
        $root = $kind === 'thread' ? $send->handle($organization, $member, $work, 'Dispatch question', (string) Str::uuid())->message : null;
        $body = match ($kind) {
            'mention' => "Please\nreview dispatch 482 https://example.test/quote?token=secret.",
            'direct' => 'Can you confirm the pickup time?',
            default => 'The truck arrives at 9 AM.',
        };
        $target = $send->handle($organization, $owner, $chat, $body, (string) Str::uuid(), $root?->public_id, $kind === 'mention' ? [$member->id] : [])->message;
        // Put the target outside the latest main/thread history window.
        for ($index = 0; $index < 65; $index++) {
            Message::query()->create([
                'organization_id' => $organization->id, 'workspace_id' => $work->workspace_id,
                'conversation_id' => $chat->id, 'author_id' => $owner->id,
                'thread_root_id' => $root?->id, 'body' => 'Later message '.$index,
                'idempotency_key' => (string) Str::uuid(),
            ]);
        }
        $fixtures[] = ['width' => $width, 'kind' => $kind, 'email' => $member->email, 'target' => [
            'chat' => $chat->public_id, 'message' => $target->public_id, 'thread' => $root?->public_id,
            'title' => match ($kind) {
                'mention' => 'Review Sender mentioned you in Dispatch review',
                'direct' => 'Direct Message from Review Sender',
                default => 'Review Sender replied to your message',
            },
            'body' => $kind === 'mention' ? 'Please review dispatch 482 [link]' : $body,
        ]];
    }
}
file_put_contents('/private/tmp/sidewire-desktop-browser/fixtures.json', json_encode($fixtures, JSON_THROW_ON_ERROR));
