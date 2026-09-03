<?php

namespace App\Concerns;

use App\Models\Organization;
use Illuminate\Support\Str;

trait GeneratesUniqueOrganizationSlugs
{
    public static function generateUniqueOrganizationSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'organization';
        $slug = $base;
        $counter = 2;

        while (Organization::withTrashed()
            ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
            ->where('slug', $slug)
            ->exists()) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }
}
