<?php

namespace App\Actions\Fortify;

use App\Actions\Organizations\CreateOrganization;
use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Enums\OrganizationMembershipStatus;
use App\Models\OrganizationInvitation;
use App\Models\OrganizationMembership;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    public function __construct(private CreateOrganization $createOrganization)
    {
        //
    }

    /** @param array<string, string> $input */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
            'invitation' => ['nullable', 'string', 'size:64'],
        ])->validate();

        return DB::transaction(function () use ($input) {
            $invitation = $this->pendingInvitation($input);

            $user = User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
            ]);

            if ($invitation) {
                OrganizationMembership::create([
                    'organization_id' => $invitation->organization_id,
                    'user_id' => $user->id,
                    'role' => $invitation->role,
                    'status' => OrganizationMembershipStatus::Active,
                    'is_billable' => true,
                    'joined_at' => now(),
                ]);

                $invitation->update(['accepted_at' => now()]);
            } else {
                $this->createOrganization->handle($user, $user->name.' Company');
            }

            return $user;
        });
    }

    /** @param array<string, string> $input */
    private function pendingInvitation(array $input): ?OrganizationInvitation
    {
        $code = $input['invitation'] ?? null;

        if (! is_string($code) || $code === '') {
            return null;
        }

        $invitation = OrganizationInvitation::query()
            ->where('code', $code)
            ->whereNull('accepted_at')
            ->where(fn ($query) => $query
                ->whereNull('expires_at')
                ->orWhere('expires_at', '>=', now()))
            ->lockForUpdate()
            ->first();

        if (! $invitation || strcasecmp($invitation->email, $input['email']) !== 0) {
            throw ValidationException::withMessages([
                'email' => __('This invitation is invalid, expired, or belongs to another email address.'),
            ]);
        }

        return $invitation;
    }
}
