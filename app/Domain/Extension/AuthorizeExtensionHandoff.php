<?php

namespace App\Domain\Extension;

use App\Models\ExtensionHandoff;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\GoneHttpException;

class AuthorizeExtensionHandoff
{
    public function handle(ExtensionHandoff $handoff, User $user): ExtensionHandoff
    {
        return DB::transaction(function () use ($handoff, $user): ExtensionHandoff {
            $handoff = ExtensionHandoff::query()
                ->whereKey($handoff->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($handoff->isExpired() || $handoff->consumed_at) {
                throw new GoneHttpException('This extension connection request has expired.');
            }

            if ($handoff->authorized_at) {
                if ($handoff->user_id !== $user->id) {
                    throw new ConflictHttpException('This extension connection request was already authorized.');
                }

                return $handoff;
            }

            $handoff->forceFill([
                'user_id' => $user->id,
                'authorized_at' => now(),
            ])->save();

            return $handoff->refresh();
        });
    }
}
