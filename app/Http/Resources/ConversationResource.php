<?php

namespace App\Http\Resources;

use App\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Conversation */
class ConversationResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->public_id,
            'title' => $this->title,
            'type' => $this->type->value,
            'web_url' => route('chats.show', $this->public_id),
            'linked_pages' => $this->whenLoaded('pageContexts', fn () => $this->pageContexts
                ->map(fn ($context) => [
                    'id' => $context->public_id,
                    'title' => $context->title,
                    'host' => $context->source_host,
                    'url' => $context->source_url,
                ])->values()),
            'messages' => $this->whenLoaded('messages', fn () => MessageResource::collection(
                $this->messages->sortBy('id')->values(),
            )),
            'message_page' => $this->whenLoaded('messages', fn () => [
                'has_more' => (bool) ($this->messages_has_more ?? false),
                'next_before' => $this->messages_next_before ?? null,
            ]),
        ];
    }
}
