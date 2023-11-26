<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function count;
use function file_put_contents;
use function sprintf;

use const PHP_EOL;

final class PutDiagram
{
    public function __invoke(Config $config): void
    {
        $profile = new Profile($config->profile, new LabelName());
        $index = new IndexPage($config);
        file_put_contents($index->file, $index->content);
        echo "ASD generated. {$index->file}" . PHP_EOL;
        echo sprintf('Descriptors(%s), Links(%s)', count($profile->descriptors), count($profile->links)) . PHP_EOL;
    }
}
