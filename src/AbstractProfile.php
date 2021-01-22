<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

class AbstractProfile
{
    /** @var string */
    public $alpsFile;

    /** @var AbstractDescriptor[] */
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
