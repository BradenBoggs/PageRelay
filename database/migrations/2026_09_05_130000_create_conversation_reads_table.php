<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Query\Builder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->ensureIndex('messages', 'messages_id_organization_workspace_conversation_unique',
            ['id', 'organization_id', 'workspace_id', 'conversation_id'], true);

        // MySQL may retain the table after a later index or foreign-key statement fails.
        if (! Schema::hasTable('conversation_reads')) {
            Schema::create('conversation_reads', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('organization_id');
                $table->unsignedBigInteger('workspace_id');
                $table->unsignedBigInteger('conversation_id');
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('last_read_message_id');
                $table->timestamps();
            });
        }

        if (! Schema::hasColumns('conversation_reads', [
            'id', 'organization_id', 'workspace_id', 'conversation_id', 'user_id',
            'last_read_message_id', 'created_at', 'updated_at',
        ])) {
            throw new RuntimeException('Existing conversation_reads table has missing columns; inspect it before retrying.');
        }

        $this->ensureIndex('conversation_reads', 'conversation_reads_member_conversation_unique',
            ['organization_id', 'user_id', 'conversation_id'], true);
        // The original generated name is 69 characters; MySQL permits only 64.
        $this->ensureIndex('conversation_reads', 'conversation_reads_user_conversation_message_index',
            ['user_id', 'conversation_id', 'last_read_message_id'], false);

        $this->ensureForeignKey('conversation_reads_organization_id_foreign',
            ['organization_id'], 'organizations', ['id'], 'cascade');
        $this->ensureForeignKey('conversation_reads_user_id_foreign',
            ['user_id'], 'users', ['id'], 'cascade');
        $this->ensureForeignKey('conversation_reads_conversation_scope_foreign',
            ['conversation_id', 'organization_id', 'workspace_id'], 'conversations',
            ['id', 'organization_id', 'workspace_id'], 'cascade');
        $this->ensureForeignKey('conversation_reads_message_scope_foreign',
            ['last_read_message_id', 'organization_id', 'workspace_id', 'conversation_id'], 'messages',
            ['id', 'organization_id', 'workspace_id', 'conversation_id'], 'restrict');
    }

    /** @param list<string> $columns */
    private function ensureIndex(string $table, string $name, array $columns, bool $unique): void
    {
        foreach (Schema::getIndexes($table) as $index) {
            if ($index['name'] === $name || $index['columns'] === $columns) {
                if ($index['columns'] !== $columns || $index['unique'] !== $unique) {
                    throw new RuntimeException("Existing index [{$index['name']}] on [{$table}] has an incompatible definition.");
                }

                return;
            }
        }

        Schema::table($table, function (Blueprint $blueprint) use ($columns, $name, $unique): void {
            if ($unique) {
                $blueprint->unique($columns, $name);
            } else {
                $blueprint->index($columns, $name);
            }
        });
    }

    /**
     * @param  list<string>  $columns
     * @param  list<string>  $references
     */
    private function ensureForeignKey(string $name, array $columns, string $target, array $references, string $onDelete): void
    {
        foreach (Schema::getForeignKeys('conversation_reads') as $foreign) {
            if ($foreign['name'] === $name || $foreign['columns'] === $columns) {
                // SQLite reports RESTRICT and NO ACTION distinctly; both prevent deletion here.
                $actualDelete = strtolower($foreign['on_delete']);
                if ($foreign['columns'] !== $columns || $foreign['foreign_table'] !== $target
                    || $foreign['foreign_columns'] !== $references
                    || ($actualDelete !== $onDelete && ! ($onDelete === 'restrict' && $actualDelete === 'no action'))) {
                    throw new RuntimeException("Existing foreign key [{$foreign['name']}] has an incompatible definition.");
                }

                return;
            }
        }

        // Rebuilding an SQLite table may not validate retained rows while foreign keys are disabled.
        $invalidRows = DB::table('conversation_reads')->whereNotExists(function (Builder $query) use ($columns, $target, $references): void {
            $query->selectRaw('1')->from($target);
            foreach ($columns as $offset => $column) {
                $query->whereColumn($target.'.'.$references[$offset], 'conversation_reads.'.$column);
            }
        })->exists();
        if ($invalidRows) {
            throw new RuntimeException("Existing conversation_reads rows violate [{$name}]; inspect them before retrying.");
        }

        Schema::table('conversation_reads', function (Blueprint $table) use ($name, $columns, $target, $references, $onDelete): void {
            $table->foreign($columns, $name)->references($references)->on($target)->onDelete($onDelete);
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('conversation_reads') && DB::table('conversation_reads')->exists()) {
            throw new RuntimeException(
                'Conversation read positions contain member data; recover by rolling forward instead of dropping them.',
            );
        }

        Schema::dropIfExists('conversation_reads');

        if (Schema::hasIndex('messages', 'messages_id_organization_workspace_conversation_unique')) {
            Schema::table('messages', function (Blueprint $table): void {
                $table->dropUnique('messages_id_organization_workspace_conversation_unique');
            });
        }
    }
};
