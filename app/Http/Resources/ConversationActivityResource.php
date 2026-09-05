<?php

namespace App\Http\Resources;

use App\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Conversation */
class ConversationActivityResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $latestMessage = $this->latestMessage;

        return [
            'id' => $this->public_id,
            'title' => $this->title,
            'web_url' => route('chats.show', $this->public_id),
            'message_count' => (int) $this->messages_count,
            'unread_count' => (int) $this->unread_count,
            'linked_pages' => $this->pageContexts->map(fn ($context) => [
                'id' => $context->public_id,
                'title' => $context->title,
                'host' => $context->source_host,
                'url' => $context->source_url,
            ])->values(),
            'latest_message' => $latestMessage ? [
                'id' => $latestMessage->public_id,
                'body' => $latestMessage->body,
                'created_at' => $latestMessage->created_at->toISOString(),
                'author' => [
                    'id' => $latestMessage->author->id,
                    'name' => $latestMessage->author->name,
                ],
                'source' => $latestMessage->sourcePageContext ? [
                    'id' => $latestMessage->sourcePageContext->public_id,
                    'title' => $latestMessage->sourcePageContext->title,
                    'host' => $latestMessage->sourcePageContext->source_host,
                    'url' => $latestMessage->sourcePageContext->source_url,
                ] : null,
            ] : null,
        ];
    }
}
