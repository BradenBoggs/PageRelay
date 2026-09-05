<?php

namespace App\Domain\Extension;

use App\Data\ExtensionHandoffCredentials;
use App\Models\ExtensionHandoff;
use Illuminate\Support\Str;

class StartExtensionHandoff
{
    public function handle(string $codeChallenge): ExtensionHandoffCredentials
    {
        $secret = $this->base64UrlEncode(random_bytes(32));

        $handoff = ExtensionHandoff::create([
            'public_id' => (string) Str::uuid(),
            'secret_hash' => hash('sha256', $secret),
            'code_challenge' => $codeChallenge,
            'expires_at' => now()->addMinutes(
                config()->integer('sidewire.extension.handoff_ttl_minutes'),
            ),
        ]);

        return new ExtensionHandoffCredentials($handoff, $secret);
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
