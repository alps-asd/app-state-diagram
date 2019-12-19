#!/usr/bin/env php
<?php

declare(strict_types=1);

use Koriym\AlpsStateDiagram\AlpsStateDiagram;

foreach ([__DIR__ . '/../../../autoload.php', __DIR__ . '/../vendor/autoload.php'] as $file) {
    if (file_exists($file)) {
        require $file;

        break;
    }
}

if ($argc !== 2) {
    echo 'usage: asd <alps>' . PHP_EOL;
    exit(1);
}
[, $profile] = $argv;
$dot = (new AlpsStateDiagram)($profile);
var_dump($dot);

$outputfile = $profile . '.dot';
file_put_contents($outputfile, $dot);
