<?php

declare(strict_types=1);

require dirname(__DIR__) . '/autoload.php';
$bootstrap = dirname(__DIR__) . '/vendor/bear/swoole/bootstrap.php';
if (! file_exists($bootstrap)) {
    throw new LogicException('"bear/swoole" is not installed. See http://bearsunday.github.io/manuals/1.0/en/swoole.html');
}

exit((require $bootstrap)(
    'prod-app',
    'AsdDemo\OidcApp',
    '127.0.0.1',
    8080
));
