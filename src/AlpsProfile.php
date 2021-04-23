<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\AlpsFileNotReadableException;
use Koriym\AppStateDiagram\Exception\DescriptorNotFoundException;
use Koriym\AppStateDiagram\Exception\InvalidAlpsException;
use Koriym\AppStateDiagram\Exception\InvalidJsonException;
use Koriym\AppStateDiagram\Exception\RtDescriptorMissingException;
use Koriym\AppStateDiagram\Exception\SharpMissingInHrefException;
use stdClass;
use Throwable;

use function array_keys;
use function array_merge;
use function dirname;
use function explode;
use function file_exists;
use function file_get_contents;
use function in_array;
use function is_array;
use function json_last_error;
use function json_last_error_msg;
use function ksort;
use function parse_url;
use function sprintf;
use function strpos;
use function strrpos;
use function substr;

use const PHP_URL_SCHEME;

final class AlpsProfile extends AbstractProfile
{
    /** @var string */
    public $alpsFile;

    /** @var DescriptorScanner */
    private $scanner;

    /** @var string */
    private $dir = '';

    /** @var array<string, list<string>> */
    public $tags = [];

    /** @var Href */
    private $href;

    public function __construct(string $alpsFile)
    {
        $this->alpsFile = $alpsFile;
        $this->scanner = new DescriptorScanner();
        $this->dir = $this->getDirname($alpsFile);
        $this->href = new Href();
        $this->scan($alpsFile);
        $this->validateRtNotMissing();
        $this->scanTags();
    }

    public function getDirname(string $alpsFile): string
    {
        if (file_exists($alpsFile)) {
            return dirname($alpsFile);
        }

        $pos = strrpos($alpsFile, '/');
        if ($pos === false) {
            throw new AlpsFileNotReadableException($alpsFile);
        }

        return substr($alpsFile, 0, (int) strrpos($alpsFile, '/') + 1);
    }

    private function scan(string $alpsFile): void
    {
        $rawDescriptors = $this->scanAlpsFile($alpsFile);
        foreach ($rawDescriptors as $rawDescriptor) {
            $this->scanRawDescriptor($rawDescriptor);
        }
    }

    private function scanRawDescriptor(stdClass $raw): void
    {
        if (isset($raw->descriptor)) {
            $this->scanTransition(new SemanticDescriptor($raw), $raw->descriptor);

            return;
        }

        if (isset($raw->href)) {
            $this->href($raw);
        }

        if (isset($raw->rt) && strpos($raw->rt, '#')) {
            $this->scanRawDescriptor($this->getExternalDescriptor($raw->rt));
        }
    }

    private function href(stdClass $descriptor): void
    {
        $isExternal = $descriptor->href[0] !== '#';
        if (! $isExternal) {
            return;
        }

        $this->scanRawDescriptor($this->getExternalDescriptor($descriptor->href));
    }

    /**
     * @param list<stdClass> $descriptors
     */
    private function scanTransition(SemanticDescriptor $semantic, array $descriptors): void
    {
        foreach ($descriptors as $descriptor) {
            $isExternal = isset($descriptor->href) && $descriptor->href[0] !== '#';
            if ($isExternal) {
                $descriptor = $this->getExternalDescriptor($descriptor->href);
            }

            $isInternal = isset($descriptor->href) && $descriptor->href[0] === '#';
            if ($isInternal) {
                $this->addInternalLink($semantic, $descriptor->href);

                continue;
            }

            $isTransDescriptor = isset($descriptor->type) && in_array($descriptor->type, ['safe', 'unsafe', 'idempotent'], true);
            if ($isTransDescriptor) {
                $this->addLink(new Link($semantic, new TransDescriptor($descriptor, $semantic)));
                $this->descriptors[$descriptor->id] = new TransDescriptor($descriptor, $semantic);

                continue;
            }
        }
    }

    private function addInternalLink(SemanticDescriptor $semantic, string $href): void
    {
        [, $descriptorId] = explode('#', $href);
        $isTransDescriptor = isset($this->descriptors[$descriptorId]) && $this->descriptors[$descriptorId] instanceof TransDescriptor;
        if ($isTransDescriptor) {
            $transSemantic = $this->descriptors[$descriptorId];
            $this->addLink(new Link($semantic, $transSemantic));  // @phpstan-ignore-line
        }
    }

    private function getExternalDescriptor(string $href): stdClass
    {
//        $fullPathHref = (new Fullpath())($this->alpsFile, $href);
//        [$descriptor, $dependencies] = ($this->href)($fullPathHref);
//        $this->scanDescriptor($descriptor->source);
//        foreach ($dependencies as $dependency) {
//            $this->scanDescriptor($dependency->source);
//        }

//        return $descriptor->source;

        if (strpos($href, '#') === false) {
            throw new SharpMissingInHrefException($href);
        }

        [$file, $descriptorId] = explode('#', $href);
        $scheme = parse_url($file, PHP_URL_SCHEME);
        if ($scheme === null) {
            $file = "{$this->dir}/{$file}";
        }

        $this->scan($file);
        $descriptors = $this->scanAlpsFile($file);

        return $this->getDescriptor($descriptors, $descriptorId, $href);
    }

    /**
     * @param list<stdClass> $descriptors
     */
    private function getDescriptor(array $descriptors, string $descriptorId, string $href): stdClass
    {
        foreach ($descriptors as $descriptor) {
            if ($descriptor->id === $descriptorId) {
                return $descriptor;
            }
        }

        throw new DescriptorNotFoundException($href);
    }

    private function addLink(Link $link): void
    {
        $edgeId = sprintf('%s->%s:%s', $link->from, $link->to, $link->transDescriptor->id);
        $this->links[$edgeId] = $link;
    }

    /**
     * @return  list<stdClass>
     */
    private function scanAlpsFile(string $alpsFile): array
    {
        try {
            $file = file_get_contents($alpsFile);
        } catch (Throwable $e) {
            throw new AlpsFileNotReadableException($alpsFile);
        }

        $profile = (new JsonDecode())((string) $file);
        if (json_last_error()) {
            throw new InvalidJsonException(json_last_error_msg());
        }

        if (! isset($profile->alps->descriptor) || ! is_array($profile->alps->descriptor)) { // @phpstan-ignore-line
            throw new InvalidAlpsException($alpsFile);
        }

        $this->setMetadata($profile);
        $this->setDescriptors($profile->alps->descriptor);

        return $profile->alps->descriptor;
    }

    private function validateRtNotMissing(): void
    {
        foreach ($this->descriptors as $descriptor) {
            $descriptorKeys = array_keys($this->descriptors);
            if ($descriptor->type !== 'semantic') {
                if (isset($descriptor->rt) && ! in_array($descriptor->rt, $descriptorKeys)) {
                    throw new RtDescriptorMissingException($descriptor->rt);
                }
            }
        }
    }

    private function scanTags(): void
    {
        foreach ($this->descriptors as $descriptor) {
            foreach ($descriptor->tags as $tag) {
                $this->tags[$tag][] = $descriptor->id;
            }
        }

        ksort($this->tags);
    }

    private function setMetadata(object $profile): void
    {
        if (isset($profile->{'$schema'})) {
            $this->schema = $profile->{'$schema'};
        }

        $this->title = $profile->alps->title ?? ''; // @phpstan-ignore-line
        $this->doc = $profile->alps->doc->value ?? ''; // @phpstan-ignore-line
    }

    /**
     * @param list<stdClass> $descriptor
     */
    private function setDescriptors(array $descriptor): void
    {
        $this->descriptors = array_merge($this->descriptors, ($this->scanner)($descriptor));
    }
}
