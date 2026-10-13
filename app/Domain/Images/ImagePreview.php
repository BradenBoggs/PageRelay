<?php

namespace App\Domain\Images;

use App\Domain\PageContexts\NormalizePageUrl;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Throwable;

/** A bounded, unauthenticated public fetch; caller must authorize the message first. */
class ImagePreview
{
    public const MAX_BYTES = 2097152;

    /** @return list<array{key: string, url: string}> */
    public function candidates(string $body): array
    {
        // Bracket labels remain inert and do not cause external requests.
        $plain = $body;
        $depth = 0;
        $start = 0;
        for ($index = 0; $index < strlen($body); $index++) {
            if ($body[$index] === '[') {
                if ($depth === 0) {
                    $start = $index;
                }
                $depth++;
            } elseif ($body[$index] === ']' && $depth > 0) {
                $depth--;
                if ($depth === 0) {
                    $length = $index - $start + 1;
                    $plain = substr_replace($plain, str_repeat(' ', $length), $start, $length);
                }
            }
        }
        preg_match_all('~(?:https?://|www\.)[^\s<>"\x27`]+~iu', $plain, $matches, PREG_OFFSET_CAPTURE);
        $candidates = [];
        foreach ($matches[0] as [$raw, $offset]) {
            if ($offset > 0 && preg_match('~[\pL\pN_@/:]~u', $plain[$offset - 1]) === 1) {
                continue;
            }
            $url = rtrim($raw, '.,!?;:)}');
            $url = preg_match('/^www\./i', $url) ? 'https://'.$url : $url;
            if (! preg_match('/\.(?:png|jpe?g|gif|webp|avif|bmp)$/i', parse_url($url, PHP_URL_PATH) ?: '')) {
                continue;
            }
            try {
                app(NormalizePageUrl::class)->handle($url);
            } catch (ValidationException) {
                continue;
            }
            $key = hash('sha256', $url);
            $candidates[$key] = ['key' => $key, 'url' => $url];
            if (count($candidates) === 4) {
                break;
            }
        }

        return array_values($candidates);
    }

    /** @return list<string> */
    public function resolve(string $host): array
    {
        if (filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return [$host];
        }

        return gethostbynamel($host) ?: [];
    }

    /** @return array{body: string, mime: string} */
    public function fetch(string $url): array
    {
        app(NormalizePageUrl::class)->handle($url);
        abort_unless(extension_loaded('curl'), 422, 'Image preview unavailable.');
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        $port = parse_url($url, PHP_URL_PORT) ?: (str_starts_with(strtolower($url), 'https:') ? 443 : 80);
        abort_unless(in_array($port, [80, 443], true), 422, 'Image preview unavailable.');
        $addresses = $this->resolve($host);
        abort_if($addresses === [], 422, 'Image preview unavailable.');
        foreach ($addresses as $address) {
            abort_unless(filter_var($address, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_GLOBAL_RANGE) !== false, 422, 'Image preview unavailable.');
        }
        try {
            $response = Http::connectTimeout(3)->timeout(8)->withHeaders(['Accept' => 'image/*'])
                ->withOptions(['stream' => false, 'decode_content' => false, 'allow_redirects' => false, 'proxy' => '', 'verify' => true,
                    'cookies' => false, 'progress' => static function (float $total, float $received, float $uploadTotal, float $uploaded): void {
                        if ($received > self::MAX_BYTES) {
                            throw new \RuntimeException('Image preview exceeds size limit.');
                        }
                    }, 'curl' => [CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4, CURLOPT_RESOLVE => [$host.':'.$port.':'.$addresses[0]]]])->get($url);
        } catch (Throwable) {
            abort(422, 'Image preview unavailable.');
        }
        $stream = $response->toPsrResponse()->getBody();
        try {
            abort_unless($response->successful(), 422, 'Image preview unavailable.');
            abort_if((int) $response->header('Content-Length') > self::MAX_BYTES, 422, 'Image preview unavailable.');
            $body = '';
            while (! $stream->eof()) {
                $body .= $stream->read(8192);
                abort_if(strlen($body) > self::MAX_BYTES, 422, 'Image preview unavailable.');
            }
        } finally {
            $stream->close();
        }
        $image = @getimagesizefromstring($body);
        abort_unless($image && $image[0] > 0 && $image[1] > 0 && $image[0] * $image[1] <= 12000000
            && in_array($image['mime'], ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif', 'image/bmp'], true), 422, 'Image preview unavailable.');

        return ['body' => $body, 'mime' => $image['mime']];
    }
}
