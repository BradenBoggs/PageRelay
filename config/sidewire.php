<?php

return [
    'extension' => [
        'handoff_ttl_minutes' => (int) env('SIDEWIRE_EXTENSION_HANDOFF_TTL', 10),
        'token_ttl_minutes' => (int) env('SIDEWIRE_EXTENSION_TOKEN_TTL', 43_200),
    ],
];
