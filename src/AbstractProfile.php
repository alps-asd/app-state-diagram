<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

abstract class AbstractProfile
{
    /** @var array<string, AbstractDescriptor> */
    public array $descriptors = [];

    /** @var array<Link> */
    public array $links = [];

    /** @psalm-suppress PossiblyUnusedProperty */
    public string $schema = '';
    public string $title = '';
    public string $doc = '';
    public string $alpsFile = '';
}
