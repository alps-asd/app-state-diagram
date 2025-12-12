<?php

declare(strict_types=1);

namespace AsdDemo\OidcApp\Module;

use BEAR\Package\AbstractAppModule;
use BEAR\Package\PackageModule;
use Koriym\EnvJson\EnvJson;
use Ray\AuraSqlModule\AuraSqlModule;
use Ray\MediaQuery\MediaQuerySqlModule;

use function dirname;

final class AppModule extends AbstractAppModule
{
    protected function configure(): void
    {
        (new EnvJson())->load(dirname(__DIR__, 2));

        // Install database module
        $dbConfig = str_contains($this->appMeta->name, 'prod') ?
            'sqlite:' . dirname(__DIR__, 2) . '/var/db/production.sq3.sqlite3' :
            'sqlite:' . dirname(__DIR__, 2) . '/var/db/development.sq3.sqlite3';

        $this->install(
            new AuraSqlModule(
                $dbConfig,
                '', // user
                '', // password
                '', // slave
                [],  // options
            ),
        );

        // Install MediaQuery module
        $interfaceDir = dirname(__DIR__) . '/Query';
        $sqlDir = dirname(__DIR__, 2) . '/var/sql';
        $this->install(new MediaQuerySqlModule($interfaceDir, $sqlDir));

        $this->install(new PackageModule());
    }
}
