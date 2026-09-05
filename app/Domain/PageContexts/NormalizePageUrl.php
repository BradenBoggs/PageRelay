<?php

namespace App\Domain\PageContexts;

use App\Data\NormalizedPageUrl;
use Illuminate\Validation\ValidationException;

/**
 * Validates and normalizes an untrusted browser URL without weakening safety.
 *
 * @see docs/features/page-contexts.md
 */
class NormalizePageUrl
{
    public const VERSION = 1;

    /** @var list<string> */
    private const TRACKING_PARAMETERS = [
        'dclid', 'fbclid', 'gclid', 'gbraid', 'mc_cid', 'mc_eid', 'msclkid', 'wbraid',
    ];

    /** @var list<string> */
    private const SENSITIVE_PARAMETERS = [
        'access_token', 'auth_token', 'code', 'credential', 'expires', 'signature', 'sig',
        'token', 'x-amz-credential', 'x-amz-expires', 'x-amz-security-token', 'x-amz-signature',
    ];

    public function handle(string $url): NormalizedPageUrl
    {
        $url = trim($url);

        if (preg_match('/[\x00-\x20\x7F]/', $url) === 1) {
            $this->reject();
        }

        $parts = parse_url($url);

        if ($parts === false
            || ! isset($parts['scheme'], $parts['host'])
            || ! in_array(strtolower($parts['scheme']), ['http', 'https'], true)
            || isset($parts['user'])
            || isset($parts['pass'])) {
            $this->reject();
        }

        $scheme = strtolower($parts['scheme']);
        $host = strtolower(rtrim($parts['host'], '.'));

        if ($host === '' || filter_var($host, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME) === false) {
            $this->reject();
        }

        $fragment = $parts['fragment'] ?? null;

        if ($fragment !== null && preg_match('/^(?:!|\/)|[?=&]/', $fragment) === 1) {
            throw ValidationException::withMessages([
                'url' => 'SideWire cannot safely identify fragment-routed pages.',
            ]);
        }

        $path = $parts['path'] ?? '/';

        if ($path === '') {
            $path = '/';
        }

        if (preg_match('~/(?:signing|sign)(?:/|$)~i', $path) === 1) {
            throw ValidationException::withMessages([
                'url' => 'Temporary signing pages cannot be saved in SideWire.',
            ]);
        }

        $query = $this->normalizeQuery($parts['query'] ?? '');
        $port = $parts['port'] ?? null;
        $authority = $host;

        if ($port !== null && ! (($scheme === 'http' && $port === 80) || ($scheme === 'https' && $port === 443))) {
            $authority .= ':'.$port;
        }

        $normalized = $scheme.'://'.$authority.$path.($query === '' ? '' : '?'.$query);

        return new NormalizedPageUrl(
            sourceUrl: $normalized,
            normalizedUrl: $normalized,
            hash: hash('sha256', $normalized),
            host: $host,
            version: self::VERSION,
        );
    }

    private function normalizeQuery(string $query): string
    {
        if ($query === '') {
            return '';
        }

        $pairs = [];

        foreach (explode('&', $query) as $pair) {
            [$rawKey] = array_pad(explode('=', $pair, 2), 2, '');
            $key = strtolower(urldecode($rawKey));

            if (in_array($key, self::SENSITIVE_PARAMETERS, true)) {
                throw ValidationException::withMessages([
                    'url' => 'URLs containing temporary credentials cannot be saved in SideWire.',
                ]);
            }

            if (str_starts_with($key, 'utm_') || in_array($key, self::TRACKING_PARAMETERS, true)) {
                continue;
            }

            $pairs[] = $pair;
        }

        sort($pairs, SORT_STRING);

        return implode('&', $pairs);
    }

    private function reject(): never
    {
        throw ValidationException::withMessages([
            'url' => 'Enter a supported HTTP or HTTPS page URL without embedded credentials.',
        ]);
    }
}
