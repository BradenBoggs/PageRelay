<?php

namespace Tests\Feature\PageContexts;

use App\Domain\Conversations\CreatePageChat;
use App\Domain\Conversations\CreateWorkChat;
use App\Domain\Conversations\SendPageMessage;
use App\Domain\Conversations\UnlinkPageContext;
use App\Domain\PageContexts\PageUrlMatch;
use App\Domain\PageContexts\ResolvePageContext;
use App\Domain\PageContexts\SavePageLink;
use App\Enums\ApiTokenAbility;
use App\Enums\ConversationType;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Exceptions\PageChatConflict;
use App\Models\Conversation;
use App\Models\OrganizationMembership;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class UrlMatchingTest extends TestCase
{
    use RefreshDatabase;

    private const URL = 'https://app.supermove.co/projects/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/view?block=STOPS&jobUuid=bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

    private const PREFIX = ['mode' => 'prefix', 'path_depth' => 2, 'query_keys' => []];

    public function test_supermove_scope_is_segment_bounded_and_origin_specific(): void
    {
        $match = app(PageUrlMatch::class);
        $definition = $match->build(self::URL, self::PREFIX);
        foreach ([
            preg_replace('/\?.*/', '', self::URL),
            str_replace('block=STOPS', 'block=CLIENTS', self::URL),
            'https://app.supermove.co/projects/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            'https://app.supermove.co/projects/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/other?jobUuid=another',
        ] as $url) {
            $this->assertTrue($match->matches($definition, self::URL, $url));
        }
        foreach ([
            str_replace('aaaaaaaa', 'cccccccc', self::URL),
            str_replace('aaaa/view', 'aaaa0/view', self::URL),
            str_replace('app.supermove.co', 'other.supermove.co', self::URL),
            str_replace('https:', 'http:', self::URL),
            str_replace('.co/', '.co:8443/', self::URL),
            str_replace('/projects/', '/Projects/', self::URL),
        ] as $url) {
            $this->assertFalse($match->matches($definition, self::URL, $url));
        }
    }

    public function test_query_ids_preserve_values_duplicates_and_case_not_parameter_order(): void
    {
        $match = app(PageUrlMatch::class);
        $url = 'https://crm.example/record?tab=notes&id=a%26b&id=2';
        $definition = $match->build($url, ['mode' => 'prefix', 'path_depth' => 1, 'query_keys' => ['id']]);
        $this->assertTrue($match->matches($definition, $url, 'https://crm.example/record?id=2&tab=files&id=a%26b'));
        foreach (['?id=2', '?ID=2&ID=a%26b', '?id=2&id=2&id=a%26b', '?id=3&id=a%26b', '?tab=notes'] as $query) {
            $this->assertFalse($match->matches($definition, $url, 'https://crm.example/record'.$query));
        }
        $encodedPath = $match->build('https://crm.example/records/a%2Fb/view', self::PREFIX);
        $this->assertFalse($match->matches($encodedPath, '', 'https://crm.example/records/a/b/view'));
    }

    public function test_broad_scope_and_missing_query_keys_require_deliberate_valid_input(): void
    {
        foreach ([['mode' => 'prefix', 'path_depth' => 0], ['mode' => 'prefix', 'path_depth' => 1],
            ['mode' => 'prefix', 'path_depth' => 20], ['mode' => 'prefix', 'path_depth' => 2, 'query_keys' => ['missing']]] as $selection) {
            try {
                app(PageUrlMatch::class)->build(self::URL, $selection);
                $this->fail('Invalid scope accepted.');
            } catch (ValidationException) {
                $this->assertTrue(true);
            }
        }
        $broad = app(PageUrlMatch::class)->build(self::URL, ['mode' => 'prefix', 'path_depth' => 0, 'confirm_broad' => true]);
        $this->assertSame('/', $broad['path']);
    }

    public function test_ignored_parameters_cannot_bypass_full_url_safety(): void
    {
        foreach ([self::URL.'&access_token=secret', 'https://crm.example/a/%2e%2e/record',
            'https://crm.example/#/records/42', 'https://crm.example/records/%zz',
            'https://user:password@crm.example/records/42', 'https://crm.example/records/42?name=%0Asecret',
            'https://crm.example/signing/session', 'https://crm.example/a\\b'] as $url) {
            try {
                app(PageUrlMatch::class)->build($url, self::PREFIX);
                $this->fail('Unsafe URL accepted.');
            } catch (ValidationException) {
                $this->assertTrue(true);
            }
        }
        $this->assertDatabaseCount('page_contexts', 0);
    }

    public function test_lookup_and_preview_do_not_persist_and_variants_reuse_one_context(): void
    {
        $owner = User::factory()->create();
        $org = $owner->organization()->firstOrFail();
        $this->actingAs($owner)->postJson('/page-links/preview', ['url' => self::URL])->assertOk()->assertJsonPath('data.id', null);
        $this->assertDatabaseCount('page_contexts', 0);
        $this->assertDatabaseCount('conversations', 0);
        $saved = app(SavePageLink::class)->handle($org, $owner, self::URL, 'Project', self::PREFIX, chatName: 'Shared project');
        $variant = str_replace('block=STOPS', 'block=CLIENTS', self::URL);
        $found = app(ResolvePageContext::class)->handle($org, $owner, $variant, 'New title', null);
        $this->assertSame($saved->id, $found->context->id);
        $this->assertSame($variant, $found->url);
        $this->actingAs($owner)->postJson('/page-links/preview', ['url' => $variant])->assertOk()
            ->assertJsonPath('data.id', $saved->public_id)->assertJsonPath('data.view_url', $variant)->assertJsonPath('data.url', self::URL);
        $again = app(SavePageLink::class)->handle($org, $owner, $variant, 'Retry', self::PREFIX, chatName: 'Retry');
        $this->assertSame($saved->association_version, $again->association_version);
        $this->assertDatabaseCount('page_contexts', 1);
        $this->assertDatabaseCount('conversations', 1);
        $this->assertDatabaseCount('messages', 0);
        $outsider = User::factory()->create();
        $this->assertNull(app(ResolvePageContext::class)->handle($outsider->organization()->firstOrFail(), $outsider, $variant, '', null)->context);
    }

    public function test_legacy_exact_matching_remains_conservative(): void
    {
        $owner = User::factory()->create();
        $org = $owner->organization()->firstOrFail();
        $old = app(CreatePageChat::class)->handle($org, $owner, self::URL, 'Page', 'Chat', null);
        $found = app(ResolvePageContext::class)->handle($org, $owner, str_replace('STOPS', 'CLIENTS', self::URL), '', null);
        $this->assertNull($found->context);
        $this->assertNull($old->url_match);
    }

    public function test_broadening_rejects_existing_contexts_without_merging_even_same_chat(): void
    {
        $owner = User::factory()->create();
        $org = $owner->organization()->firstOrFail();
        $first = app(CreatePageChat::class)->handle($org, $owner, self::URL, 'First', 'First', null);
        app(CreatePageChat::class)->handle($org, $owner, str_replace('STOPS', 'CLIENTS', self::URL), 'Second', 'Second', null);
        $this->actingAs($owner)->postJson('/page-links', [
            'url' => self::URL, 'title' => 'Project', 'conversation_id' => $first->conversation->public_id,
            'matching' => self::PREFIX, 'expected_context_id' => $first->public_id,
            'expected_association_version' => $first->association_version,
        ])->assertConflict()->assertJsonPath('reason', 'overlapping_scope');
        $this->assertNull($first->refresh()->url_match);
        $this->assertDatabaseCount('page_contexts', 2);
        $this->assertDatabaseCount('conversations', 2);
    }

    public function test_overlapping_prefixes_are_rejected_even_when_example_urls_differ(): void
    {
        $match = app(PageUrlMatch::class);
        $a = $match->build('https://crm.example/record?id=1&tab=a', ['mode' => 'prefix', 'path_depth' => 1, 'query_keys' => ['id']]);
        $b = $match->build('https://crm.example/record?id=2&tab=b', ['mode' => 'prefix', 'path_depth' => 1, 'query_keys' => ['tab']]);
        $this->assertTrue($match->overlaps($a, '', $b, ''));
        $c = $match->build('https://crm.example/record?id=2', ['mode' => 'prefix', 'path_depth' => 1, 'query_keys' => ['id']]);
        $this->assertFalse($match->overlaps($a, '', $c, ''));
    }

    public function test_web_link_and_matching_edit_are_versioned_and_idempotent(): void
    {
        $owner = User::factory()->create();
        $org = $owner->organization()->firstOrFail();
        $chat = app(CreateWorkChat::class)->handle($org, $owner, 'Existing chat', (string) Str::uuid());
        $payload = ['url' => self::URL, 'title' => 'Project', 'conversation_id' => $chat->public_id, 'matching' => self::PREFIX];
        $first = $this->actingAs($owner)->postJson('/page-links', $payload)->assertSuccessful();
        $this->postJson('/page-links', $payload)->assertSuccessful()->assertJsonPath('data.id', $first->json('data.id'))
            ->assertJsonPath('data.association_version', $first->json('data.association_version'));
        $payload['matching'] = ['mode' => 'exact'];
        $payload['expected_context_id'] = $first->json('data.id');
        $payload['expected_association_version'] = 0;
        $this->postJson('/page-links', $payload)->assertConflict()->assertJsonPath('reason', 'stale_mapping');
        $payload['expected_association_version'] = $first->json('data.association_version');
        $this->postJson('/page-links', $payload)->assertSuccessful()->assertJsonPath('data.url_match', null);
        $this->assertDatabaseCount('page_contexts', 1);
        $this->assertDatabaseCount('conversations', 1);
    }

    public function test_members_can_create_but_cannot_link_or_change_an_existing_scope(): void
    {
        $owner = User::factory()->create();
        $org = $owner->organization()->firstOrFail();
        $member = User::forceCreate(['name' => 'Member', 'email' => 'member@example.test', 'password' => 'password', 'email_verified_at' => now()]);
        OrganizationMembership::create(['organization_id' => $org->id, 'user_id' => $member->id, 'role' => OrganizationRole::Member,
            'status' => OrganizationMembershipStatus::Active, 'is_billable' => true, 'joined_at' => now()]);
        $token = $member->createToken('Chrome', [ApiTokenAbility::ExtensionAccess->value], now()->addDay());
        $payload = ['url' => self::URL, 'title' => 'Page', 'chat_name' => 'Created', 'matching' => self::PREFIX];
        $first = $this->withToken($token->plainTextToken)->postJson('/api/v1/extension/page-links', $payload)->assertSuccessful();
        $payload['matching'] = ['mode' => 'exact'];
        $payload['expected_context_id'] = $first->json('data.id');
        $payload['expected_association_version'] = $first->json('data.association_version');
        $this->postJson('/api/v1/extension/page-links', $payload)->assertForbidden();
        $payload['conversation_id'] = $first->json('data.chat.id');
        $this->postJson('/api/v1/extension/page-links', $payload)->assertForbidden();
    }

    public function test_cross_tenant_workspace_and_non_work_destinations_are_rejected(): void
    {
        $owner = User::factory()->create();
        $org = $owner->organization()->firstOrFail();
        $other = User::factory()->create();
        $foreign = app(CreateWorkChat::class)->handle($other->organization()->firstOrFail(), $other, 'Private', (string) Str::uuid());
        $workspace = Workspace::factory()->create(['organization_id' => $org->id]);
        $destinations = [$foreign];
        foreach ([ConversationType::Page, ConversationType::Direct, ConversationType::Organization] as $type) {
            $destinations[] = Conversation::create(['organization_id' => $org->id,
                'workspace_id' => $type === ConversationType::Page ? $workspace->id : $org->defaultWorkspace()->firstOrFail()->id,
                'type' => $type, 'title' => 'Ineligible', 'created_by' => $owner->id]);
        }
        foreach ($destinations as $destination) {
            $this->actingAs($owner)->postJson('/page-links', ['url' => self::URL, 'title' => 'Page', 'matching' => self::PREFIX,
                'conversation_id' => $destination->public_id])->assertNotFound();
        }
        $this->assertDatabaseCount('page_contexts', 0);
    }

    public function test_nonempty_history_cannot_be_reassigned_through_selector(): void
    {
        $owner = User::factory()->create();
        $org = $owner->organization()->firstOrFail();
        $context = app(SavePageLink::class)->handle($org, $owner, self::URL, 'Project', self::PREFIX, chatName: 'First');
        app(SendPageMessage::class)->fromContext($org, $owner, $context, 'Keep me', (string) Str::uuid(), $context->association_version);
        $other = app(CreateWorkChat::class)->handle($org, $owner, 'Second', (string) Str::uuid());
        $this->actingAs($owner)->postJson('/page-links', ['url' => self::URL, 'title' => 'Page', 'matching' => self::PREFIX,
            'conversation_id' => $other->public_id, 'expected_context_id' => $context->public_id,
            'expected_association_version' => $context->association_version])->assertConflict()->assertJsonPath('reason', 'source_chat_not_empty');
        $this->assertSame($context->conversation_id, $context->refresh()->conversation_id);
        $this->assertDatabaseCount('messages', 1);
    }

    public function test_safe_view_source_is_immutable_on_retry_and_unlink(): void
    {
        $owner = User::factory()->create();
        $org = $owner->organization()->firstOrFail();
        $context = app(SavePageLink::class)->handle($org, $owner, self::URL, 'Project', self::PREFIX, chatName: 'Project');
        $view = str_replace('STOPS', 'CLIENTS', self::URL);
        $key = (string) Str::uuid();
        $sent = app(SendPageMessage::class)->fromContext($org, $owner, $context, 'Original', $key, $context->association_version, $view);
        $this->assertSame($view, $sent->message->source_url);
        app(UnlinkPageContext::class)->handle($org, $owner, $context, $context->association_version);
        $retry = app(SendPageMessage::class)->fromContext($org, $owner, $context->refresh(), 'Retry', $key, 0, self::URL);
        $this->assertSame($sent->message->id, $retry->message->id);
        $this->assertSame($view, $retry->message->source_url);
        $this->assertDatabaseCount('messages', 1);
    }

    public function test_source_must_match_scope_and_can_be_explicitly_omitted(): void
    {
        $owner = User::factory()->create();
        $org = $owner->organization()->firstOrFail();
        $context = app(SavePageLink::class)->handle($org, $owner, self::URL, 'Project', self::PREFIX, chatName: 'Project');
        try {
            app(SendPageMessage::class)->fromContext($org, $owner, $context, 'Wrong source', (string) Str::uuid(), $context->association_version, 'https://other.example/');
            $this->fail('Mismatched source accepted.');
        } catch (PageChatConflict $error) {
            $this->assertSame('stale_source', $error->reason);
        }
        $without = app(SendPageMessage::class)->fromContext($org, $owner, $context, 'No source', (string) Str::uuid(), $context->association_version, null, false);
        $this->assertNull($without->message->source_page_context_id);
        $this->assertNull($without->message->source_url);
        $this->assertDatabaseCount('messages', 1);
    }
}
