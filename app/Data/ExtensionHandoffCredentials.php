<?php

namespace App\Data;

use App\Models\ExtensionHandoff;

readonly class ExtensionHandoffCredentials
{
    public function __construct(
        public ExtensionHandoff $handoff,
        public string $secret,
    ) {
        //
    }
}
