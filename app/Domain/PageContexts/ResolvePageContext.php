<?php

namespace App\Domain\PageContexts;

use App\Data\ResolvedPageContext;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\PageContext;
use App\Models\User;
use Illuminate\Validation\ValidationException;

/**
 * Performs an organization-scoped page lookup without persisting browsing data.
 *
 * @see docs/features/page-contexts.md
 */
class ResolvePageContext
{
    public function __construct(private NormalizePageUrl $normalizer)
    {
        //
    }

    public function handle(
        Organization $organization,
        User $actor,
        string $url,
        string $title,
        ?string $faviconUrl,
    ): ResolvedPageContext {
        OrganizationMembership::query()
            ->active()
            ->where('organization_id', $organization->id)
            ->where('user_id', $actor->id)
            ->firstOrFail();

        $identity = $this->normalizer->handle($url);
        $workspace = $organization->defaultWorkspace()->firstOrFail();
        $context = PageContext::query()
            ->where('organization_id', $organization->id)
            ->where('workspace_id', $workspace->id)
            ->where('normalization_version', $identity->version)
            ->where('normalized_url_hash', $identity->hash)
            ->first();

        if ($context && ! hash_equals($context->normalized_url, $identity->normalizedUrl)) {
            throw ValidationException::withMessages([
                'url' => 'SideWire could not safely resolve this page identity.',
            ]);
        }

        return new ResolvedPageContext(
            context: $context,
            workspaceId: $workspace->id,
            url: $identity->sourceUrl,
            normalizedUrl: $identity->normalizedUrl,
            normalizedUrlHash: $identity->hash,
            normalizationVersion: $identity->version,
            host: $identity->host,
            title: $this->cleanTitle($title, $identity->host),
            faviconUrl: $this->safeFaviconUrl($faviconUrl),
        );
    }

    private function safeFaviconUrl(?string $faviconUrl): ?string
    {
        if ($faviconUrl === null || trim($faviconUrl) === '') {
            return null;
        }

        try {
            return $this->normalizer->handle($faviconUrl)->sourceUrl;
        } catch (ValidationException) {
            return null;
        }
    }

    private function cleanTitle(string $title, string $fallback): string
    {
        $title = preg_replace('/[\x00-\x1F\x7F]/u', '', trim($title)) ?? '';

        return mb_substr($title === '' ? $fallback : $title, 0, 255);
    }
}
