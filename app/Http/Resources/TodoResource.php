<?php

namespace App\Http\Resources;

use App\Domain\Todos\ManageTodo;
use App\Models\Todo;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Todo */
class TodoResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $message = $this->message;
        $manage = app(ManageTodo::class);

        return [
            'id' => $this->public_id, 'title' => $this->title, 'description' => $this->description, 'version' => $this->version,
            'completed' => $this->completed_at !== null, 'completed_at' => $this->completed_at?->toISOString(),
            'completed_by' => $this->completer ? ['id' => $this->completer->id, 'name' => $this->completer->name] : null,
            'assignee' => $this->assignee ? ['id' => $this->assignee->id, 'name' => $this->assignee->name] : null,
            'needs_reassignment' => $this->assignee !== null && ! $manage->eligible($this->assignee, $message),
            'can_manage' => $manage->canManage($request->user(), $message),
            'message' => ['id' => $message->public_id, 'body' => $message->deleted_at ? 'Message deleted' : $message->body,
                'chat_id' => $message->conversation->public_id, 'chat_title' => $message->conversation->title,
                'thread_id' => $message->threadRoot?->public_id],
        ];
    }
}
