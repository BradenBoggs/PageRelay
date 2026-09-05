<?php

namespace App\Domain\Extension;

use App\Enums\ApiTokenAbility;
use App\Models\ExtensionHandoff;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\NewAccessToken;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\GoneHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Exchanges a one-use, PKCE-bound handoff for a scoped extension token.
 *
 * The secret, verifier, authorization, active membership, and consumption
 * state are checked while the handoff row is locked. A retry can never mint
 * a second token from the same browser handoff.
 *
 * @see docs/features/browser-extension.md
 */
class ExchangeExtensionHandoff
{
    public function handle(
        ExtensionHandoff $handoff,
        string $secret,
        string $codeVerifier,
    ): ?NewAccessToken {
        return DB::transaction(function () use ($handoff, $secret, $codeVerifier): ?NewAccessToken {
            $handoff = ExtensionHandoff::query()
                ->whereKey($handoff->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->verifyClient($handoff, $secret, $codeVerifier);

            if ($handoff->isExpired() || $handoff->consumed_at) {
                throw new GoneHttpException('This extension connection request has expired.');
            }

            if (! $handoff->authorized_at || ! $handoff->user_id) {
                return null;
            }

            $user = User::query()->findOrFail($handoff->user_id);

            if (! $user->hasVerifiedEmail() || ! $user->organization()->exists()) {
                throw new AccessDeniedHttpException;
            }

            $token = $user->createToken(
                'Chrome extension',
                [ApiTokenAbility::ExtensionAccess->value],
                now()->addMinutes(config()->integer('sidewire.extension.token_ttl_minutes')),
            );

            $handoff->forceFill(['consumed_at' => now()])->save();

            return $token;
        });
    }

    private function verifyClient(
        ExtensionHandoff $handoff,
        string $secret,
        string $codeVerifier,
    ): void {
        $challenge = rtrim(strtr(
            base64_encode(hash('sha256', $codeVerifier, true)),
            '+/',
            '-_',
        ), '=');

        if (! hash_equals($handoff->secret_hash, hash('sha256', $secret))
            || ! hash_equals($handoff->code_challenge, $challenge)) {
            throw new NotFoundHttpException;
        }
    }
}
