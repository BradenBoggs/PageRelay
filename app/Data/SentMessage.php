<?php

namespace App\Data;

use App\Models\Message;

readonly class SentMessage
{
    public function __construct(
        public Message $message,
        public bool $created,
    ) {
        //
    }
}
