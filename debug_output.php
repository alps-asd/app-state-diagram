<?php
require_once 'vendor/autoload.php';

use Koriym\AppStateDiagram\DrawDiagram;
use Koriym\AppStateDiagram\Profile;
use Koriym\AppStateDiagram\LabelName;

$profile = new Profile(__DIR__ . '/alps2dot/tests/fixtures/fake-simple.json', new LabelName());
$drawDiagram = new DrawDiagram();
$dot = $drawDiagram($profile, new LabelName());

echo $dot;