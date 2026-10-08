<?php

use App\Enums\ApiTokenAbility;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Models\OrganizationMembership;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (! $app->environment('testing') || config('database.default') !== 'sqlite'
    || config('database.connections.sqlite.database') !== '/tmp/sidewire-pilot-browser.sqlite') {
    throw new RuntimeException('This fixture runs only against the isolated pilot-browser test database.');
}

$owner = User::factory()->create(['name' => 'Review Owner', 'email' => 'owner@example.test']);
$organization = $owner->organization()->firstOrFail();
$organization->update(['name' => 'Pilot review team']);
$people = [];
foreach (['member' => OrganizationRole::Member, 'admin' => OrganizationRole::Administrator] as $name => $role) {
    $user = User::query()->create(['name' => 'Review '.ucfirst($name), 'email' => $name.'@example.test', 'password' => 'password']);
    $user->forceFill(['email_verified_at' => now()])->save();
    OrganizationMembership::query()->create([
        'organization_id' => $organization->id, 'user_id' => $user->id,
        'role' => $role, 'status' => OrganizationMembershipStatus::Active,
        'is_billable' => true, 'joined_at' => now(),
    ]);
    $people[$name] = $user;
}
$member = $people['member'];
$token = $member->createToken('Chrome extension', [ApiTokenAbility::ExtensionAccess->value], now()->addHour());
file_put_contents('/tmp/sidewire-pilot-identity.json', json_encode([
    'token' => $token->plainTextToken,
    'expiresAt' => now()->addHour()->toISOString(),
    'user' => ['id' => $member->id, 'name' => $member->name],
    'organization' => ['id' => $organization->id, 'name' => $organization->name, 'role' => 'member', 'canManagePageLinks' => false],
], JSON_THROW_ON_ERROR));
chmod('/tmp/sidewire-pilot-identity.json', 0600);
