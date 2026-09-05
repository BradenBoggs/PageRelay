<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExtensionSessionController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $organization = $request->attributes->get('organization');

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'organization' => [
                    'id' => $organization->id,
                    'name' => $organization->name,
                ],
            ],
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();
        $token->delete();

        return response()->json(status: 204);
    }
}
