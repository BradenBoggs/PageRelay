<?php

namespace App\Events;

use App\Enums\ConversationType;
use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class MessageCreated implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Message $message) {}

    /** @return list<PrivateChannel> */
    public function broadcastOn(): array
    {
        $channels = [new PrivateChannel('organizations.'.$this->message->organization_id.'.conversations.'.$this->message->conversation->public_id)];
        if ($this->message->conversation->type === ConversationType::Page) {
            $channels[] = new PrivateChannel('organizations.'.$this->message->organization_id);
        } else {
            foreach (DB::table('conversation_participants')->where('conversation_id', $this->message->conversation_id)->pluck('user_id') as $id) {
                $channels[] = new PrivateChannel('App.Models.User.'.$id);
            }
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'message.created';
    }

    /** @return array<string, bool> */
    public function broadcastWith(): array
    {
        // Sockets can outlive membership/token revocation. Never broadcast message
        // text, source URLs, mention identities or DM metadata; refetch with authorization.
        return ['changed' => true];
    }
}
