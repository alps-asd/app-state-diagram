<?php

declare(strict_types=1);

namespace Koriym\AlpsStateDiagram;

use Koriym\AlpsStateDiagram\Exception\AlpsFileNotReadable;

final class AlpsStateDiagram
{
    public function __invoke(string $alps) : string
    {
        if (! file_exists($alps)) {
            throw new AlpsFileNotReadable($alps);
        }

        return '';
    }
}
