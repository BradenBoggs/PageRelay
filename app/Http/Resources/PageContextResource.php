<?php

namespace App\Http\Resources;

use App\Models\PageContext;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin PageContext */
class PageContextResource extends JsonResource
{
    public function __construct(PageContext $resource, private ?string $viewUrl = null)
    {
        parent::__construct($resource);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'persisted' => true,
            'id' => $this->public_id,
            'title' => $this->title,
            'host' => $this->source_host,
            'url' => $this->source_url,
            'view_url' => $this->viewUrl ?? $this->source_url,
            'url_match' => $this->url_match,
            'favicon_url' => $this->favicon_url,
            'association_version' => $this->association_version,
            'chat' => $this->whenLoaded(
                'conversation',
                fn () => $this->conversation ? new ConversationResource($this->conversation) : null,
            ),
        ];
    }
}
