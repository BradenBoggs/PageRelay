<?php

namespace App\Domain\PageContexts;

use Illuminate\Validation\ValidationException;

/**
 * Matches explicit literal URL scopes, never guesses CRM record semantics.
 * Safety checks apply to the entire URL, including ignored parameters.
 *
 * @phpstan-type Selection array{mode: string, path_depth?: int, query_keys?: list<string>, confirm_broad?: bool}
 * @phpstan-type Definition array{version: int, origin: string, path: string, path_depth: int, query: list<array{key: string, values: list<string>}>}
 *
 * @see docs/features/page-contexts.md
 */
class PageUrlMatch
{
    public function __construct(private NormalizePageUrl $normalizer) {}

    /** @param Selection $selection
     * @return Definition|null
     */
    public function build(string $url, array $selection): ?array
    {
        $safe = $this->normalizer->handle($url)->normalizedUrl;
        if ($selection['mode'] === 'exact') {
            return null;
        }
        $parts = $this->parts($safe);
        $depth = $selection['path_depth'] ?? -1;
        $segments = $parts['path'] === '/' ? [] : explode('/', substr(rtrim($parts['path'], '/'), 1));
        if ($selection['mode'] !== 'prefix' || $depth < 0 || $depth > count($segments)) {
            $this->reject('Select a valid last path section.');
        }
        $keys = $selection['query_keys'] ?? [];
        if (count($keys) !== count(array_unique($keys))) {
            $this->reject('Select each query parameter only once.');
        }
        $query = [];
        foreach ($keys as $key) {
            $values = $parts['query']['k:'.$key] ?? null;
            if ($values === null) {
                $this->reject('A selected query parameter is missing or not eligible for matching.');
            }
            $query[] = ['key' => $key, 'values' => $values];
        }
        usort($query, fn (array $a, array $b): int => strcmp($a['key'], $b['key']));
        if ($depth < 2 && $query === [] && ! ($selection['confirm_broad'] ?? false)) {
            $this->reject('Confirm this broad scope, or include the section that identifies the record.');
        }

        return [
            'version' => 1,
            'origin' => $parts['origin'],
            'path' => $depth === 0 ? '/' : '/'.implode('/', array_slice($segments, 0, $depth)),
            'path_depth' => $depth,
            'query' => $query,
        ];
    }

    /** @param Definition|null $definition */
    public function matches(?array $definition, string $representative, string $candidate): bool
    {
        $safe = $this->normalizer->handle($candidate)->normalizedUrl;
        if ($definition === null) {
            return hash_equals($representative, $safe);
        }
        $parts = $this->parts($safe);
        if ($definition['version'] !== 1 || $definition['origin'] !== $parts['origin']
            || ! $this->containsPath($definition['path'], $parts['path'])) {
            return false;
        }
        foreach ($definition['query'] as $entry) {
            if (($parts['query']['k:'.$entry['key']] ?? null) !== $entry['values']) {
                return false;
            }
        }

        return true;
    }

    /** @param Definition|null $a
     * @param  Definition|null  $b
     */
    public function overlaps(?array $a, string $aUrl, ?array $b, string $bUrl): bool
    {
        if ($a === null) {
            return $this->matches($b, $bUrl, $aUrl);
        }
        if ($b === null) {
            return $this->matches($a, $aUrl, $bUrl);
        }
        if ($a['origin'] !== $b['origin'] || (! $this->containsPath($a['path'], $b['path'])
            && ! $this->containsPath($b['path'], $a['path']))) {
            return false;
        }
        foreach ($a['query'] as $left) {
            foreach ($b['query'] as $right) {
                if ($left['key'] === $right['key'] && $left['values'] !== $right['values']) {
                    return false;
                }
            }
        }

        return true;
    }

    private function containsPath(string $prefix, string $path): bool
    {
        return $prefix === '/' || $path === $prefix || str_starts_with($path, $prefix.'/');
    }

    /** @return array{origin: string, path: string, query: array<string, list<string>>} */
    private function parts(string $safe): array
    {
        $parts = parse_url($safe);
        if ($parts === false || ! isset($parts['scheme'], $parts['host'])) {
            $this->reject('Enter a valid page URL.');
        }
        $query = [];
        foreach (explode('&', $parts['query'] ?? '') as $pair) {
            if ($pair === '') {
                continue;
            }
            [$key, $value] = array_pad(explode('=', $pair, 2), 2, '');
            $query['k:'.urldecode($key)][] = urldecode($value);
        }
        foreach ($query as &$values) {
            sort($values, SORT_STRING);
        }
        unset($values);

        return [
            'origin' => $parts['scheme'].'://'.$parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : ''),
            'path' => $parts['path'] ?? '/',
            'query' => $query,
        ];
    }

    private function reject(string $message): never
    {
        throw ValidationException::withMessages(['matching' => $message]);
    }
}
