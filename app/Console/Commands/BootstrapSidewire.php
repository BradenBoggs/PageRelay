<?php

namespace App\Console\Commands;

use App\Actions\Organizations\CreateOrganization;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Throwable;

class BootstrapSidewire extends Command
{
    protected $signature = 'sidewire:bootstrap {email : Initial owner email}
        {--name= : Initial owner name}
        {--organization= : Organization name}';

    protected $description = 'Create the first verified owner, Organization and default Workspace on an empty installation';

    public function handle(CreateOrganization $createOrganization): int
    {
        if (User::query()->exists() || Organization::query()->exists()) {
            $this->error('Bootstrap refused: users or organizations already exist. No accounts were changed.');

            return self::FAILURE;
        }

        if (! $this->input->isInteractive()) {
            $this->error('Run interactively to enter and confirm the password securely.');

            return self::FAILURE;
        }

        $input = [
            'email' => strtolower(trim((string) $this->argument('email'))),
            'name' => trim((string) ($this->option('name') ?? $this->ask('Owner name'))),
            'organization' => trim((string) ($this->option('organization') ?? $this->ask('Organization name'))),
            'password' => $this->secret('Password', false),
            'password_confirmation' => $this->secret('Confirm password', false),
        ];

        try {
            // Trusted operator bootstrap supports the explicitly chosen initial password.
            // Production web password and recovery policies remain unchanged.
            $validated = Validator::make($input, [
                'email' => ['required', 'string', 'email', 'max:255'],
                'name' => ['required', 'string', 'max:255'],
                'organization' => ['required', 'string', 'max:255'],
                'password' => ['required', 'string', 'min:8', 'confirmed'],
            ])->validate();

            Cache::lock('sidewire:bootstrap', 60)->block(5, function () use ($validated, $createOrganization): void {
                DB::transaction(function () use ($validated, $createOrganization): void {
                    if (User::query()->exists() || Organization::query()->exists()) {
                        throw ValidationException::withMessages([
                            'bootstrap' => 'Bootstrap refused: users or organizations already exist. No accounts were changed.',
                        ]);
                    }

                    $user = new User([
                        'email' => $validated['email'],
                        'name' => $validated['name'],
                        'password' => $validated['password'],
                    ]);
                    $user->email_verified_at = now();
                    $user->save();
                    $createOrganization->handle($user, $validated['organization']);
                });
            });
        } catch (ValidationException $error) {
            foreach ($error->validator->errors()->all() as $message) {
                $this->error($message);
            }

            return self::FAILURE;
        } catch (LockTimeoutException) {
            $this->error('Another bootstrap is running. Retry after it finishes.');

            return self::FAILURE;
        } catch (Throwable) {
            $this->error('Bootstrap could not complete. Inspect the database and queue configuration before retrying.');

            return self::FAILURE;
        }

        $this->info('Initial owner, Organization and default Workspace created. You can now log in.');

        return self::SUCCESS;
    }
}
