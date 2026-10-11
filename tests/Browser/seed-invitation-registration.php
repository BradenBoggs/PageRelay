<?php

require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

if (! app()->environment('testing') || config('database.default') !== 'sqlite'
    || ! str_contains((string) config('database.connections.sqlite.database'), 'sidewire-invitation')) {
    throw new RuntimeException('Use a disposable sidewire-invitation SQLite database in the testing environment.');
}

$owner = App\Models\User::factory()->create(['email' => 'invite-owner@example.test']);
$organization = $owner->organization()->firstOrFail();
$codes = [];
foreach (['desktop', 'mobile', 'existing'] as $kind) {
    $invitation = App\Models\OrganizationInvitation::create([
        'organization_id' => $organization->id, 'email' => $kind.'@example.test',
        'role' => App\Enums\OrganizationRole::Member, 'invited_by' => $owner->id,
        'expires_at' => now()->addDay(),
    ]);
    $codes[$kind] = $invitation->code;
}
App\Models\User::create([
    'name' => 'Existing recipient', 'email' => 'existing@example.test', 'password' => 'password',
])->forceFill(['email_verified_at' => now()])->save();

file_put_contents(getenv('INVITATION_TEST_FIXTURES') ?: '/private/tmp/sidewire-invitation-fixtures.json', json_encode($codes, JSON_THROW_ON_ERROR));
