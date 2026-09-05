<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

/**
 * Changes internal operator access for an existing account only.
 *
 * The command never creates a predictable administrator or changes the
 * account's organization role.
 */
class SetSidewireAdmin extends Command
{
    protected $signature = 'sidewire:admin {email : Existing user email} {--revoke : Remove operator access}';

    protected $description = 'Grant or revoke access to SideWire internal administration';

    public function handle(): int
    {
        $user = User::query()
            ->where('email', $this->argument('email'))
            ->first();

        if (! $user) {
            $this->error('No existing user has that email address.');

            return self::FAILURE;
        }

        $grant = ! $this->option('revoke');

        $user->forceFill(['is_sidewire_admin' => $grant])->save();

        $this->info($grant
            ? 'SideWire administrator access granted.'
            : 'SideWire administrator access revoked.');

        return self::SUCCESS;
    }
}
