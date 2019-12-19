<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\AlpsFileNotReadableException;
use Koriym\AppStateDiagram\Exception\DescriptorNotFoundException;
use Koriym\AppStateDiagram\Exception\InvalidAlpsException;
use Koriym\AppStateDiagram\Exception\InvalidJsonException;

final class AppStateDiagram
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
     * @var array
     */
    private $links = [];

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
        $this->scan($alpsFile);

        return ($this->toString)($this->links, $this->descriptors);
    }

    private function scan(string $alpsFile) : void
    {
        $descriptors = $this->scanAlpsFile($alpsFile);
        foreach ($descriptors as $descriptor) {
            $this->scanDescriptor($descriptor);
        }
    }

    private function scanDescriptor(\stdClass $descriptor) : void
    {
        if (isset($descriptor->descriptor)) {
            $this->scanTransition(new SemanticDescriptor($descriptor), $descriptor->descriptor);

            return;
        }
        if (isset($descriptor->href)) {
            $this->href($descriptor);
        }
    }

    private function href(\stdClass $descriptor) : void
    {
        $isExternal = $descriptor->href[0] !== '#';
        if ($isExternal) {
            $this->scanDescriptor($this->getExternDescriptor($descriptor->href));

            return;
        }
    }

    private function scanTransition(SemanticDescriptor $semantic, array $descriptors) : void
    {
        foreach ($descriptors as $descriptor) {
            $isExternal = isset($descriptor->href) && $descriptor->href[0] !== '#';
            if ($isExternal) {
                $descriptor = $this->getExternDescriptor($descriptor->href);
            }
            $isInternal = isset($descriptor->href) && $descriptor->href[0] === '#';
            if ($isInternal) {
                $this->addInternalLink($semantic, $descriptor->href);

                continue;
            }
            $isTransDescriptor = isset($descriptor->type) && in_array($descriptor->type, ['safe', 'unsafe', 'idempotent'], true);
            if ($isTransDescriptor) {
                $this->addLink(new Link($semantic, new TransDescriptor($descriptor, $semantic)));

                continue;
            }
        }
    }

    private function addInternalLink(SemanticDescriptor $semantic, string $href) : void
    {
        [,$descriptorId] = explode('#', $href);
        $isTransDescrpitor = isset($this->descriptors[$descriptorId]) && $this->descriptors[$descriptorId] instanceof TransDescriptor;
        if ($isTransDescrpitor) {
            $transSemantic = $this->descriptors[$descriptorId];
            assert($transSemantic instanceof TransDescriptor);
            $this->addLink(new Link($semantic, $transSemantic));
        }
    }

    private function getExternDescriptor(string $href) : \stdClass
    {
        [$file, $descriptorId] = explode('#', $href);
        $file = "{$this->dir}/{$file}";
        $this->scan($file);
        $descriptors = $this->scanAlpsFile($file);

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

    private function addLink(Link $link) : void
    {
        $fromTo = sprintf('%s->%s', $link->from, $link->to);
        $this->links[$fromTo] = isset($this->links[$fromTo]) ? $this->links[$fromTo] . ', ' . $link->label : $link->label;
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
