<?php

namespace App\Exceptions;

use RuntimeException;

class PageChatConflict extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly string $reason,
    ) {
        parent::__construct($message);
    }
}
