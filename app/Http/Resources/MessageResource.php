<?php

namespace App\Http\Resources;

use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Message */
class MessageResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->public_id,
            'body' => $this->body,
            'created_at' => $this->created_at->toISOString(),
            'author' => [
                'id' => $this->author->id,
                'name' => $this->author->name,
            ],
            'source' => $this->sourcePageContext ? [
                'id' => $this->sourcePageContext->public_id,
                'title' => $this->sourcePageContext->title,
                'host' => $this->sourcePageContext->source_host,
                'url' => $this->sourcePageContext->source_url,
            ] : null,
        ];
    }
}
