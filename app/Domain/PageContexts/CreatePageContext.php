<?php

namespace App\Domain\PageContexts;

use App\Models\Organization;
use App\Models\PageContext;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Persists a normalized context only for an explicit collaboration command.
 *
 * @see docs/features/page-contexts.md
 */
class CreatePageContext
{
    public function __construct(private ResolvePageContext $resolve)
    {
        //
    }

    public function handle(
        Organization $organization,
        User $actor,
        string $url,
        string $title,
        ?string $faviconUrl,
    ): PageContext {
        $resolved = $this->resolve->handle($organization, $actor, $url, $title, $faviconUrl);

        if ($resolved->context) {
            return $resolved->context;
        }

        $now = now();
        DB::table('page_contexts')->insertOrIgnore([
            'public_id' => (string) Str::uuid(),
            'organization_id' => $organization->id,
            'workspace_id' => $resolved->workspaceId,
            'source_url' => $resolved->url,
            'normalized_url' => $resolved->normalizedUrl,
            'normalized_url_hash' => $resolved->normalizedUrlHash,
            'normalization_version' => $resolved->normalizationVersion,
            'source_host' => $resolved->host,
            'title' => $resolved->title,
            'favicon_url' => $resolved->faviconUrl,
            'created_by' => $actor->id,
            'association_version' => 0,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return PageContext::query()
            ->where('organization_id', $organization->id)
            ->where('workspace_id', $resolved->workspaceId)
            ->where('normalization_version', $resolved->normalizationVersion)
            ->where('normalized_url_hash', $resolved->normalizedUrlHash)
            ->firstOrFail();
    }
}
