<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

final class DrawDiagramOptions
{
    /**
     * @var bool
     * @psalm-readonly
     */
    public $titleIsTop;

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

    public function __construct(bool $titleIsTop = false, ?TaggedAlpsProfile $taggedProfile = null, ?string $color = null)
    {
        $this->titleIsTop = $titleIsTop;
        $this->taggedProfile = $taggedProfile;
        $this->color = $color;
    }
}
