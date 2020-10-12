<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

final class SemanticDescriptor extends AbstractDescriptor
{
    /** @var string */
    public $doc;

    public function __construct(object $descriptor)
    {
        parent::__construct($descriptor);
    }
}
