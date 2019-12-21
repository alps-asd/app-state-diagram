<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

final class AppStateDiagram
{
    public function __invoke(string $alpsFile) : string
    {
        $alpsScanner = new AlpsScanner;
        $alpsScanner($alpsFile);

        return (new AsdRenderer)($alpsScanner->links, $alpsScanner->descriptors);
    }
}
