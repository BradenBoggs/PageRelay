<?php

namespace Tests\Unit\Database;

use Illuminate\Database\Capsule\Manager;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\QueryException;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Facade;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\TestCase;
use RuntimeException;

class ConversationReadsMigrationTest extends TestCase
{
    private Manager $database;

    protected function setUp(): void
    {
        parent::setUp();
        $this->database = new Manager;
        $port = getenv('SIDEWIRE_MIGRATION_MYSQL_PORT');
        $this->database->addConnection($port ? [
            'driver' => 'mysql',
            'host' => '127.0.0.1',
            'port' => $port,
            'database' => 'sidewire_migration_recovery_test',
            'username' => 'root',
            'password' => 'disposable-test-only',
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ] : ['driver' => 'sqlite', 'database' => ':memory:', 'foreign_key_constraints' => true]);
        $container = $this->database->getContainer();
        $container->instance('db', $this->database->getDatabaseManager());
        $container->bind('db.schema', fn () => $this->database->getConnection()->getSchemaBuilder());
        Facade::clearResolvedInstances();
        Facade::setFacadeApplication($container);
        $this->clearTables();

        foreach (['organizations', 'users'] as $name) {
            Schema::create($name, fn (Blueprint $table) => $table->id());
            $this->database->getConnection()->table($name)->insert(['id' => 1]);
        }
        foreach (['conversations', 'messages'] as $name) {
            Schema::create($name, function (Blueprint $table) use ($name): void {
                $table->id();
                $table->unsignedBigInteger('organization_id');
                $table->unsignedBigInteger('workspace_id');
                if ($name === 'messages') {
                    $table->unsignedBigInteger('conversation_id');
                } else {
                    $table->unique(['id', 'organization_id', 'workspace_id'], 'conversation_scope_unique');
                }
            });
            $row = ['id' => 1, 'organization_id' => 1, 'workspace_id' => 1];
            if ($name === 'messages') {
                $row['conversation_id'] = 1;
            }
            $this->database->getConnection()->table($name)->insert($row);
        }
    }

    protected function tearDown(): void
    {
        $this->clearTables();
        $this->database->getConnection()->disconnect();
        Facade::clearResolvedInstances();
        Facade::setFacadeApplication(null);
        parent::tearDown();
    }

    private function clearTables(): void
    {
        foreach (['conversation_reads', 'messages', 'conversations', 'users', 'organizations'] as $name) {
            Schema::dropIfExists($name);
        }
    }

    private function migration(): Migration
    {
        return require __DIR__.'/../../../database/migrations/2026_09_05_130000_create_conversation_reads_table.php';
    }

    private function partialTable(): void
    {
        Schema::create('conversation_reads', function (Blueprint $table): void {
            $table->id();
            foreach (['organization_id', 'workspace_id', 'conversation_id', 'user_id', 'last_read_message_id'] as $column) {
                $table->unsignedBigInteger($column);
            }
            $table->timestamps();
        });
        $this->database->getConnection()->table('conversation_reads')->insert([
            'id' => 7, 'organization_id' => 1, 'workspace_id' => 1,
            'conversation_id' => 1, 'user_id' => 1, 'last_read_message_id' => 1,
        ]);
    }

    private function assertComplete(): void
    {
        $this->assertTrue(Schema::hasIndex('messages', ['id', 'organization_id', 'workspace_id', 'conversation_id'], 'unique'));
        $this->assertTrue(Schema::hasIndex('conversation_reads', ['organization_id', 'user_id', 'conversation_id'], 'unique'));
        $this->assertTrue(Schema::hasIndex('conversation_reads', ['user_id', 'conversation_id', 'last_read_message_id']));
        $this->assertCount(4, Schema::getForeignKeys('conversation_reads'));
        foreach (Schema::getIndexes('conversation_reads') as $index) {
            $this->assertLessThanOrEqual(64, strlen($index['name']));
        }
    }

    public function test_fresh_install_and_repeated_up_are_safe(): void
    {
        $migration = $this->migration();
        $migration->up();
        $migration->up();
        $this->assertComplete();
        $this->assertSame(0, $this->database->getConnection()->table('conversation_reads')->count());
    }

    public function test_retry_with_only_the_messages_index_present(): void
    {
        Schema::table('messages', fn (Blueprint $table) => $table->unique(
            ['id', 'organization_id', 'workspace_id', 'conversation_id'],
            'messages_id_organization_workspace_conversation_unique',
        ));
        $this->migration()->up();
        $this->assertComplete();
    }

    public function test_retry_repairs_a_bare_table_and_preserves_read_positions(): void
    {
        $this->partialTable();
        $this->migration()->up();
        $this->migration()->up();
        $this->assertComplete();
        $this->assertSame(1, $this->database->getConnection()->table('conversation_reads')->where('id', 7)->value('last_read_message_id'));
    }

    public function test_retry_repairs_a_table_with_some_constraints_already_present(): void
    {
        $this->partialTable();
        Schema::table('conversation_reads', function (Blueprint $table): void {
            $table->unique(['organization_id', 'user_id', 'conversation_id'], 'conversation_reads_member_conversation_unique');
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
        });
        $this->migration()->up();
        $this->assertComplete();
        $this->assertSame(1, $this->database->getConnection()->table('conversation_reads')->count());
    }

    public function test_incompatible_existing_index_is_rejected_without_deleting_rows(): void
    {
        $this->partialTable();
        Schema::table('conversation_reads', fn (Blueprint $table) => $table->index('user_id', 'conversation_reads_member_conversation_unique'));
        try {
            $this->migration()->up();
            $this->fail('An incompatible index must not be accepted.');
        } catch (RuntimeException $error) {
            $this->assertStringContainsString('incompatible definition', $error->getMessage());
            $this->assertSame(1, $this->database->getConnection()->table('conversation_reads')->count());
        }
    }

    public function test_incompatible_existing_foreign_key_is_rejected_without_deleting_rows(): void
    {
        $this->partialTable();
        Schema::table('conversation_reads', fn (Blueprint $table) => $table->foreign('organization_id')
            ->references('id')->on('organizations')->restrictOnDelete());
        try {
            $this->migration()->up();
            $this->fail('An incompatible foreign key must not be accepted.');
        } catch (RuntimeException $error) {
            $this->assertStringContainsString('incompatible definition', $error->getMessage());
            $this->assertSame(1, $this->database->getConnection()->table('conversation_reads')->count());
        }
    }

    public function test_missing_columns_stop_recovery_without_dropping_the_table(): void
    {
        Schema::create('conversation_reads', fn (Blueprint $table) => $table->id());
        $this->database->getConnection()->table('conversation_reads')->insert(['id' => 7]);
        try {
            $this->migration()->up();
            $this->fail('Missing columns must not be accepted.');
        } catch (RuntimeException $error) {
            $this->assertStringContainsString('missing columns', $error->getMessage());
            $this->assertSame(1, $this->database->getConnection()->table('conversation_reads')->count());
        }
    }

    public function test_invalid_retained_scope_stops_recovery_and_can_be_retried_after_repair(): void
    {
        $this->partialTable();
        $this->database->getConnection()->table('conversation_reads')->where('id', 7)->update(['workspace_id' => 2]);
        try {
            $this->migration()->up();
            $this->fail('Invalid retained read positions must not be accepted.');
        } catch (RuntimeException $error) {
            $this->assertStringContainsString('rows violate', $error->getMessage());
            $this->assertSame(1, $this->database->getConnection()->table('conversation_reads')->count());
        }
        $this->database->getConnection()->table('conversation_reads')->where('id', 7)->update(['workspace_id' => 1]);
        $this->migration()->up();
        $this->assertComplete();
    }

    public function test_recovered_table_still_rejects_a_message_from_another_scope(): void
    {
        $this->partialTable();
        $this->migration()->up();
        $this->database->getConnection()->table('messages')->insert([
            'id' => 2, 'organization_id' => 1, 'workspace_id' => 2, 'conversation_id' => 1,
        ]);
        $this->expectException(QueryException::class);
        $this->database->getConnection()->table('conversation_reads')->where('id', 7)->update(['last_read_message_id' => 2]);
    }
}
