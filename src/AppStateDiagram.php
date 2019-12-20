<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\AlpsFileNotReadableException;
use Koriym\AppStateDiagram\Exception\DescriptorNotFoundException;
use Koriym\AppStateDiagram\Exception\InvalidAlpsException;
use Koriym\AppStateDiagram\Exception\InvalidJsonException;
use stdClass;

final class AppStateDiagram
{
    public function __invoke(string $alpsFile) : string
    {
        $alpsScanner = new AlpsScanner;
        $alpsScanner($alpsFile);

        return (new ToString)($alpsScanner->links, $alpsScanner->descriptors);
    }
}
