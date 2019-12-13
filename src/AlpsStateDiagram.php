<?php

declare(strict_types=1);

namespace Koriym\AlpsStateDiagram;

use Koriym\AlpsStateDiagram\Exception\AlpsFileNotReadableException;
use Koriym\AlpsStateDiagram\Exception\InvalidJsonException;

final class AlpsStateDiagram
{
    /**
     * @var array
     */
    private $links = [];

    public function __invoke(string $alpsFile) : string
    {
        if (! file_exists($alpsFile)) {
            throw new AlpsFileNotReadableException($alpsFile);
        }
        $alps = json_decode((string) file_get_contents($alpsFile));
        $jsonError = json_last_error();
        if ($jsonError) {
            throw new InvalidJsonException($alpsFile);
        }
        foreach ($alps->alps->descriptor as $descriptor) {
            if (isset($descriptor->descriptor)) {
                $this->scanTransition(new SemanticDescriptor($descriptor), $descriptor->descriptor);
            }
        }

        return $this->toString();
    }

    private function scanTransition(SemanticDescriptor $semantic, array $descriptors) : void
    {
        foreach ($descriptors as $descriptor) {
            $isTransDescriptor = isset($descriptor->type) && in_array($descriptor->type, ['safe', 'unsafe', 'idempotent'], true);
            if ($isTransDescriptor) {
                $this->addLink(new Link($semantic, new TransDescriptor($descriptor, $semantic)));
            }
        }
    }

    private function addLink(Link $link) : void
    {
        $fromTo = sprintf('%s->%s', $link->from, $link->to);
        $this->links[$fromTo] = isset($this->links[$fromTo]) ? $this->links[$fromTo] . ', ' . $link->label : $link->label;
    }

    private function toString() : string
    {
        $graphs = '';
        foreach ($this->links as $link => $label) {
            $graphs .= sprintf('    %s [label = "%s"];', $link, $label) . PHP_EOL;
        }

        return sprintf('digraph application_state_diagram {
    node [shape = box, style = "bold,filled"];
%s
}
', $graphs);
    }
}
