<?php

namespace App\Data;

use App\Models\PageContext;

final readonly class ResolvedPageContext
{
    public function __construct(
        public ?PageContext $context,
        public int $workspaceId,
        public string $url,
        public string $normalizedUrl,
        public string $normalizedUrlHash,
        public int $normalizationVersion,
        public string $host,
        public string $title,
        public ?string $faviconUrl,
    ) {
        //
    }
}
