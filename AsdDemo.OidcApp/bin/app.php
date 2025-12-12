<?php

declare(strict_types=1);

use AsdDemo\OidcApp\Bootstrap;

require dirname(__DIR__) . '/autoload.php';
exit((new Bootstrap())(PHP_SAPI === 'cli' ? 'cli-hal-api-app' : 'hal-api-app', $GLOBALS, $_SERVER));
