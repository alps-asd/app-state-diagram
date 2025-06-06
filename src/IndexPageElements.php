<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

final class IndexPageElements
{
    public const LEGEND = '<div class="legend">
    <div class="legend-item" title="A state element (e.g.  HTML.SPAN, HTML.INPUT, etc.).">
        <span class="legend-icon semantic"></span>
        Semantic
    </div>
    <div class="legend-item" title="A hypermedia control that triggers a safe, idempotent state
      transition (e.g.  HTTP.GET or HTTP.HEAD).">
        <span class="legend-icon safe"></span>
        Safe
    </div>
    <div class="legend-item" title="A hypermedia control that triggers an unsafe, non-
      idempotent state transition (e.g.  HTTP.POST).">
        <span class="legend-icon unsafe"></span>
        Unsafe
    </div>
    <div class="legend-item" title="A hypermedia control that triggers an unsafe,
      idempotent state transition (e.g.  HTTP.PUT or HTTP.DELETE).">
        <span class="legend-icon idempotent"></span>
        Idempotent
    </div>
</div>
';

    /** @SuppressWarnings(PHPMD.ExcessiveParameterList) */
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
        public readonly string $setUpTagEvents,
    ) {
    }
}
