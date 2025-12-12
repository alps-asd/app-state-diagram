<?php

declare(strict_types=1);

return [
    'paths' => [
        'migrations' => '%%PHINX_CONFIG_DIR%%/var/phinx/migrations',
        'seeds' => '%%PHINX_CONFIG_DIR%%/var/phinx/seeds'
    ],
    'environments' => [
        'default_migration_table' => 'phinxlog',
        'default_environment' => 'development',
        'development' => [
            'adapter' => 'sqlite',
            'name' => '%%PHINX_CONFIG_DIR%%/var/db/development.sq3',
        ],
        'testing' => [
            'adapter' => 'sqlite',
            'name' => '%%PHINX_CONFIG_DIR%%/var/db/test.sq3',
        ],
        'production' => [
            'adapter' => 'mysql',
            'host' => 'localhost',
            'name' => 'production_db',
            'user' => 'root',
            'pass' => '',
            'port' => '3306',
            'charset' => 'utf8mb4',
        ]
    ],
    'version_order' => 'creation'
];
