<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

final class IndexPageElements
{
    public function __construct(
        public readonly Profile $profile,
        public readonly string $dotId,
        public readonly string $dotName,
        public readonly string $mode,
        public readonly string $alpsProfile,
        public readonly string $semanticMd,
        public readonly string $linkRelations,
        public readonly string $ext,
        public readonly string $tags,
        public readonly string $htmlTitle,
        public readonly string $htmlDoc,
        public readonly string $setUpTagEvents
    ) {
    }
}
