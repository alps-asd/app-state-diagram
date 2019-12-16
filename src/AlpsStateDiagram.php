<?php

declare(strict_types=1);

namespace Koriym\AlpsStateDiagram;

use Koriym\AlpsStateDiagram\Exception\AlpsFileNotReadableException;
use Koriym\AlpsStateDiagram\Exception\DescriptorNotFoundException;
use Koriym\AlpsStateDiagram\Exception\InvalidAlpsException;
use Koriym\AlpsStateDiagram\Exception\InvalidJsonException;

final class AlpsStateDiagram
{
    /**
     * @var array
     */
    private $links = [];

    /**
     * @var string
     */
    private $dir = '';

    public function __invoke(string $alpsFile) : string
    {
        $this->dir = dirname($alpsFile);
        $descriptors = $this->getAlpsDescriptors($alpsFile);
        foreach ($descriptors as $descriptor) {
            $this->scanDescriptor($descriptor);
        }

        return $this->toString();
    }

    private function scanDescriptor(\stdClass $descriptor) : void
    {
        if (isset($descriptor->descriptor)) {
            $this->scanTransition(new SemanticDescriptor($descriptor), $descriptor->descriptor);

            return;
        }
        $isExternal = isset($descriptor->href) && $descriptor->href[0] !== '#';
        if ($isExternal) {
            $this->scanDescriptor($this->getExternDescriptor($descriptor->href));
        }
    }

    private function scanTransition(SemanticDescriptor $semantic, array $descriptors) : void
    {
        foreach ($descriptors as $descriptor) {
            $isExternal = isset($descriptor->href) && $descriptor->href[0] !== '#';
            if ($isExternal) {
                $descriptor = $this->getExternDescriptor($descriptor->href);
            }
            $isTransDescriptor = isset($descriptor->type) && in_array($descriptor->type, ['safe', 'unsafe', 'idempotent'], true);
            if ($isTransDescriptor) {
                $this->addLink(new Link($semantic, new TransDescriptor($descriptor, $semantic)));

                continue;
            }
        }
    }

    private function getExternDescriptor(string $href) : \stdClass
    {
        [$file, $descriptorId] = explode('#', $href);
        $descriptors = $this->getAlpsDescriptors("{$this->dir}/{$file}");
        $descriptor = $this->getDescriptor($descriptors, $descriptorId);
        if (! $descriptor) {
            throw new DescriptorNotFoundException($href);
        }

        return $descriptor;
    }

    private function getDescriptor(array $descriptors, string $descriptorId)
    {
        foreach ($descriptors as $descriptor) {
            if ($descriptor->id === $descriptorId) {
                return $descriptor;
            }
        }

        return false;
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

    private function getAlpsDescriptors(string $alpsFile) : array
    {
        if (! file_exists($alpsFile)) {
            throw new AlpsFileNotReadableException($alpsFile);
        }
        $alps = json_decode((string) file_get_contents($alpsFile));
        $jsonError = json_last_error();
        if ($jsonError) {
            throw new InvalidJsonException($alpsFile);
        }
        if (! isset($alps->alps->descriptor)) {
            throw new InvalidAlpsException($alpsFile);
        }

        return $alps->alps->descriptor;
    }
}
