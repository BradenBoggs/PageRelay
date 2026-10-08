<?php

namespace App\Http\Controllers;

use App\Domain\Conversations\ConversationAccess;
use App\Models\MessageNotification;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Desktop delivery is opt-in; a lease prevents simultaneous web/panel alert duplication. */
class MessageNotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $input = $request->validate(['page' => ['nullable', 'integer', 'min:1']]);
        $query = $this->visible($request)->whereNull('read_at');
        $page = (clone $query)->with(['message.author', 'message.threadRoot', 'conversation'])->latest('id')->paginate(30);
        $preference = $this->preference($request)->first();
        $desktop = $preference?->enabled_at ? (clone $query)->whereNull('delivered_at')
            ->where('created_at', '>=', $preference->enabled_at)
            ->where('created_at', '>=', now()->subDay())
            ->where(fn ($q) => $q->whereNull('claim_expires_at')->orWhere('claim_expires_at', '<', now()))
            ->latest('id')->limit(5)->pluck('public_id')->all() : [];

        return response()->json([
            'data' => $page->getCollection()->map(fn (MessageNotification $item): array => $this->describe($item)),
            'unread_count' => $page->total(), 'enabled' => $preference?->enabled_at !== null,
            'desktop_candidates' => $desktop,
            'next_page' => $page->hasMorePages() ? $page->currentPage() + 1 : null,
        ])->header('Cache-Control', 'no-store, private');
    }

    public function settings(Request $request): JsonResponse
    {
        $input = $request->validate(['enabled' => ['required', 'boolean']]);
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');
        DB::transaction(function () use ($request, $input, $organization): void {
            DB::table('notification_preferences')->insertOrIgnore([
                'organization_id' => $organization->id, 'user_id' => $request->user()->id, 'enabled_at' => null,
            ]);
            $existing = $this->preference($request)->lockForUpdate()->first();
            $this->preference($request)->update([
                'enabled_at' => $input['enabled'] ? ($existing?->enabled_at ?? now()) : null,
            ]);
        });

        return response()->json(['ok' => true, 'enabled' => $input['enabled']]);
    }

    public function claim(Request $request, string $notification): JsonResponse
    {
        return DB::transaction(function () use ($request, $notification): JsonResponse {
            $item = $this->visible($request)->where('public_id', $notification)->lockForUpdate()->firstOrFail();
            $preference = $this->preference($request)->first();
            if (! $preference?->enabled_at || $item->read_at || $item->delivered_at
                || $item->created_at->lt($preference->enabled_at) || $item->created_at->lt(now()->subDay())
                || ($item->claim_expires_at && $item->claim_expires_at->isFuture())) {
                return response()->json(['data' => null]);
            }
            $claim = (string) Str::uuid();
            $item->forceFill(['desktop_claim' => $claim, 'claim_expires_at' => now()->addSeconds(45)])->save();

            return response()->json(['data' => [
                'id' => $item->public_id, 'claim' => $claim,
                'title' => 'SideWire', 'body' => 'You have a new '.$this->reason($item->reason).'. Open SideWire to view it.',
                'path' => '/messages?'.http_build_query([
                    'chat' => $item->conversation->public_id,
                    'thread' => $item->message->threadRoot?->public_id,
                    'message' => $item->message->public_id,
                ]),
            ]])->header('Cache-Control', 'no-store, private');
        });
    }

    public function delivered(Request $request, string $notification): JsonResponse
    {
        $input = $request->validate(['claim' => ['required', 'uuid']]);
        $item = $this->visible($request)->where('public_id', $notification)->firstOrFail();
        abort_unless($item->desktop_claim === $input['claim'], 409);
        $item->forceFill(['delivered_at' => now(), 'claim_expires_at' => null])->save();

        return response()->json(['ok' => true]);
    }

    /** @return Builder<MessageNotification> */
    private function visible(Request $request): Builder
    {
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');

        return MessageNotification::query()->where('organization_id', $organization->id)
            ->where('user_id', $request->user()->id)
            ->whereIn('conversation_id', ConversationAccess::query($request->user())->select('id'));
    }

    private function preference(Request $request): \Illuminate\Database\Query\Builder
    {
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');

        return DB::table('notification_preferences')->where('organization_id', $organization->id)->where('user_id', $request->user()->id);
    }

    /** @return array<string, mixed> */
    private function describe(MessageNotification $item): array
    {
        return [
            'id' => $item->public_id, 'reason' => $item->reason,
            'chat_id' => $item->conversation->public_id, 'chat_title' => $item->conversation->title,
            'message_id' => $item->message->public_id, 'thread_id' => $item->message->threadRoot?->public_id,
            'author' => $item->message->author->name, 'body' => $item->message->body,
            'created_at' => $item->created_at->toISOString(),
        ];
    }

    private function reason(string $reason): string
    {
        return match ($reason) { 'mention' => 'mention', 'thread' => 'thread reply', default => 'direct message' };
    }
}
