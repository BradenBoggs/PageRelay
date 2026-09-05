<?php

namespace App\Http\Resources;

use App\Models\PageContext;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin PageContext */
class PageContextResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'persisted' => true,
            'id' => $this->public_id,
            'title' => $this->title,
            'host' => $this->source_host,
            'url' => $this->source_url,
            'favicon_url' => $this->favicon_url,
            'association_version' => $this->association_version,
            'chat' => $this->whenLoaded(
                'conversation',
                fn () => $this->conversation ? new ConversationResource($this->conversation) : null,
            ),
        ];
    }
}
