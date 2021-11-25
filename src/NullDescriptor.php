<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

/**
 * @SuppressWarnings(PHPMD.UnusedLocalVariable)
 */
class NullDescriptor extends AbstractDescriptor
{
    public function __construct()
    {
        parent::__construct(new class {
            /** @var string */
            public $id = '';

            /** @var string */
            public $type = 'semantic';
        }, null);
    }
}
