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
     * @var string
     */
    private $dir = '';

    /**
     * @var DescriptorScanner
     */
    private $scanner;

    /**
     * @var DescriptorInterface[]
     */
    private $descriptors = [];

    /**
     * @var ToString
     */
    private $toString;

    public function __construct()
    {
        $this->scanner = new DescriptorScanner;
        $this->toString = new ToString;
    }

    public function __invoke(string $alpsFile) : string
    {
        $this->dir = dirname($alpsFile);
        $descriptors = $this->scanAlpsFile($alpsFile);
        $links = new \ArrayObject;
        foreach ($descriptors as $descriptor) {
            $this->scanDescriptor($descriptor, $links);
        }

        return ($this->toString)($links);
    }

    private function scanDescriptor(\stdClass $descriptor, \ArrayObject $links) : void
    {
        if (isset($descriptor->descriptor)) {
            $this->scanTransition(new SemanticDescriptor($descriptor), $descriptor->descriptor, $links);

            return;
        }
        if (isset($descriptor->href)) {
            $this->href($descriptor, $links);
        }
    }

    private function href(\stdClass $descriptor, \ArrayObject $links) : void
    {
        $isExternal = $descriptor->href[0] !== '#';
        if ($isExternal) {
            $this->scanDescriptor($this->getExternDescriptor($descriptor->href), $links);

            return;
        }
    }

    private function scanTransition(SemanticDescriptor $semantic, array $descriptors, \ArrayObject $links) : void
    {
        foreach ($descriptors as $descriptor) {
            $isExternal = isset($descriptor->href) && $descriptor->href[0] !== '#';
            if ($isExternal) {
                $descriptor = $this->getExternDescriptor($descriptor->href);
            }
            $isInternal = isset($descriptor->href) && $descriptor->href[0] === '#';
            if ($isInternal) {
                $this->addInternalLink($semantic, $descriptor->href, $links);

                continue;
            }
            $isTransDescriptor = isset($descriptor->type) && in_array($descriptor->type, ['safe', 'unsafe', 'idempotent'], true);
            if ($isTransDescriptor) {
                $this->addLink(new Link($semantic, new TransDescriptor($descriptor, $semantic)), $links);

                continue;
            }
        }
    }

    private function addInternalLink(SemanticDescriptor $semantic, string $href, \ArrayObject $links) : void
    {
        [,$descriptorId] = explode('#', $href);
        $isTransDescrpitor = isset($this->descriptors[$descriptorId]) && $this->descriptors[$descriptorId] instanceof TransDescriptor;
        if ($isTransDescrpitor) {
            $transSemantic = $this->descriptors[$descriptorId];
            assert($transSemantic instanceof TransDescriptor);
            $this->addLink(new Link($semantic, $transSemantic), $links);
        }
    }

    private function getExternDescriptor(string $href) : \stdClass
    {
        [$file, $descriptorId] = explode('#', $href);
        $descriptors = $this->scanAlpsFile("{$this->dir}/{$file}");

        return $this->getDescriptor($descriptors, $descriptorId, $href);
    }

    private function getDescriptor(array $descriptors, string $descriptorId, string $href) : \stdClass
    {
        foreach ($descriptors as $descriptor) {
            if ($descriptor->id === $descriptorId) {
                return $descriptor;
            }
        }

        throw new DescriptorNotFoundException($href);
    }

    private function addLink(Link $link, \ArrayObject $links) : void
    {
        $fromTo = sprintf('%s->%s', $link->from, $link->to);
        $links[$fromTo] = isset($links[$fromTo]) ? $links[$fromTo] . ', ' . $link->label : $link->label;
    }

    private function scanAlpsFile(string $alpsFile) : array
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
        $this->descriptors = array_merge($this->descriptors, ($this->scanner)($alps->alps->descriptor));

        return $alps->alps->descriptor;
    }
}
