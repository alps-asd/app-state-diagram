<?php

declare(strict_types=1);

namespace Koriym\AlpsStateDiagram;

final class ToString
{
    public function __invoke(iterable $links) : string
    {
        $dot = '';
        foreach ($links as $link => $label) {
            $dot .= sprintf('    %s [label = "%s"];', $link, $label) . PHP_EOL;
        }

        return sprintf('digraph application_state_diagram {
    node [shape = box, style = "bold,filled"];
%s
}
', $dot);
    }
}
