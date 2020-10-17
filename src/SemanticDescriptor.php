<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use stdClass;

final class SemanticDescriptor extends AbstractDescriptor
{
    /** @var string */
    public $doc;

    public function __construct(object $descriptor, ?stdClass $parentDescriptor = null)
    {
        parent::__construct($descriptor, $parentDescriptor);
    }
}
