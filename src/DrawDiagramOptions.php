<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

final class DrawDiagramOptions
{
    /**
     * @var ?TaggedAlpsProfile
     * @psalm-readonly
     */
    public $taggedProfile;

    /**
     * @var ?string
     * @psalm-readonly
     */
    public $color;

    public function __construct(?TaggedAlpsProfile $taggedProfile = null, ?string $color = null)
    {
        $this->taggedProfile = $taggedProfile;
        $this->color = $color;
    }
}
