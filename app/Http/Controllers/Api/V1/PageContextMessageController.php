<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Conversations\SendPageMessage;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\SendPageMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Organization;
use App\Models\PageContext;
use Illuminate\Http\JsonResponse;

class PageContextMessageController extends Controller
{
    public function store(
        SendPageMessageRequest $request,
        string $pageContext,
        SendPageMessage $send,
    ): JsonResponse {
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');
        $context = PageContext::query()
            ->where('organization_id', $organization->id)
            ->where('public_id', $pageContext)
            ->firstOrFail();
        $this->authorize('view', $context);

        $result = $send->fromContext(
            $organization,
            $request->user(),
            $context,
            $request->validated('body'),
            $request->validated('idempotency_key'),
            $request->integer('expected_association_version'),
        );

        return (new MessageResource($result->message))
            ->response()
            ->setStatusCode($result->created ? 201 : 200);
    }
}
