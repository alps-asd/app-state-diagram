<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

abstract class AbstractProfile
{
    /** @var array<AbstractDescriptor> */
    public $descriptors = [];

    /** @var Link[] */
    public $links = [];

    /** @var string */
    public $schema = '';

    /** @var string */
    public $title = '';

    /** @var string */
    public $doc = '';
}
