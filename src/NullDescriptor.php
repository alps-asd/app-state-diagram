<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

/** @SuppressWarnings(PHPMD.UnusedLocalVariable) */
final class NullDescriptor extends AbstractDescriptor
{
    public function __construct()
    {
        parent::__construct(new class {
            public string $id = '';
            public string $type = 'semantic';
        }, null);
    }
}
