<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspaces', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('slug', 160);
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['organization_id', 'slug']);
            $table->index(['organization_id', 'is_default']);
        });

        Schema::create('teams', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('slug', 160);
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['organization_id', 'slug']);
            $table->unique(['id', 'organization_id'], 'teams_id_organization_unique');
        });

        Schema::create('team_memberships', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('team_id');
            $table->unsignedBigInteger('organization_id');
            $table->unsignedBigInteger('user_id');
            $table->string('role', 32)->default('member');
            $table->timestamps();

            $table->unique(['team_id', 'user_id']);
            $table->index(['organization_id', 'user_id']);

            $table->foreign(['team_id', 'organization_id'], 'team_memberships_team_org_foreign')
                ->references(['id', 'organization_id'])
                ->on('teams')
                ->cascadeOnDelete();
            $table->foreign(['organization_id', 'user_id'], 'team_memberships_org_user_foreign')
                ->references(['organization_id', 'user_id'])
                ->on('organization_memberships')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_memberships');
        Schema::dropIfExists('teams');
        Schema::dropIfExists('workspaces');
    }
};
