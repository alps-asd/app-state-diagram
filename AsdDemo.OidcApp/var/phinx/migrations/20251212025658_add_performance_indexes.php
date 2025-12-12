<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddPerformanceIndexes extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * https://book.cakephp.org/phinx/0/en/migrations.html#the-change-method
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change(): void
    {
        // Add index on user.date_created for efficient ORDER BY in user_list queries
        $this->table('user')
            ->addIndex(['date_created'], ['name' => 'user_date_created_index'])
            ->update();

        // Add composite index on session(user_id, expires_at) for efficient filtering
        // This optimizes queries that filter by both user_id and expires_at
        $this->table('session')
            ->addIndex(['user_id', 'expires_at'], ['name' => 'session_user_expires_index'])
            ->update();
    }
}
