<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateSessionTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('session', ['id' => false, 'primary_key' => ['id']]);
        $table->addColumn('id', 'string', ['limit' => 64])
              ->addColumn('user_id', 'string', ['limit' => 64])
              ->addColumn('session_token', 'string', ['limit' => 255])
              ->addColumn('expires_at', 'datetime')
              ->addColumn('date_created', 'datetime', ['default' => 'CURRENT_TIMESTAMP'])
              ->addIndex(['user_id'])
              ->addIndex(['session_token'], ['unique' => true])
              ->addIndex(['expires_at'])
              ->addForeignKey('user_id', 'user', 'id', ['delete' => 'CASCADE', 'update' => 'NO_ACTION'])
              ->create();
    }
}
