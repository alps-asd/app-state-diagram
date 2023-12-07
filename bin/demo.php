<?php

use Koriym\AppStateDiagram\ConfigFactory;
use Koriym\AppStateDiagram\PutDiagram;

require dirname(__DIR__) . '/vendor/autoload.php';

$config = ConfigFactory::fromFile(dirname(__DIR__) . '/docs/blog/asd.xml');
(new PutDiagram())($config);
