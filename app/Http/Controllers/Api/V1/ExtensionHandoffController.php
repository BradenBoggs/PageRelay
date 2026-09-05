<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Extension\ExchangeExtensionHandoff;
use App\Domain\Extension\StartExtensionHandoff;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ExchangeExtensionHandoffRequest;
use App\Http\Requests\Api\StartExtensionHandoffRequest;
use App\Models\ExtensionHandoff;
use Illuminate\Http\JsonResponse;

class ExtensionHandoffController extends Controller
{
    public function store(
        StartExtensionHandoffRequest $request,
        StartExtensionHandoff $start,
    ): JsonResponse {
        $credentials = $start->handle($request->validated('code_challenge'));

        return response()->json([
            'data' => [
                'id' => $credentials->handoff->public_id,
                'secret' => $credentials->secret,
                'authorize_url' => url('/extension/connect/'.$credentials->handoff->public_id),
                'expires_at' => $credentials->handoff->expires_at->toISOString(),
            ],
        ], 201);
    }

    public function update(
        ExchangeExtensionHandoffRequest $request,
        ExtensionHandoff $handoff,
        ExchangeExtensionHandoff $exchange,
    ): JsonResponse {
        $token = $exchange->handle(
            $handoff,
            $request->validated('secret'),
            $request->validated('code_verifier'),
        );

        if (! $token) {
            return response()->json([
                'data' => ['status' => 'pending'],
            ], 202);
        }

        $user = $handoff->user()->firstOrFail();
        $organization = $user->organization()->firstOrFail();

        return response()->json([
            'data' => [
                'status' => 'connected',
                'token' => $token->plainTextToken,
                'token_type' => 'Bearer',
                'expires_at' => $token->accessToken->expires_at?->toISOString(),
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                ],
                'organization' => [
                    'id' => $organization->id,
                    'name' => $organization->name,
                ],
            ],
        ]);
    }
}
