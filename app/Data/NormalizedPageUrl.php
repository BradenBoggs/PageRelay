<?php

namespace App\Data;

readonly class NormalizedPageUrl
{
    public function __construct(
        public string $sourceUrl,
        public string $normalizedUrl,
        public string $hash,
        public string $host,
        public int $version,
    ) {
        //
    }
}
