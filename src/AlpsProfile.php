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
use function file_get_contents;
use function in_array;
use function is_array;
use function json_last_error;
use function json_last_error_msg;
use function ksort;
use function parse_url;
use function sprintf;
use function strpos;

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

    public function __construct(string $alpsFile)
    {
        $this->alpsFile = $alpsFile;
        $this->scanner = new DescriptorScanner();
        $this->dir = dirname($alpsFile);
        $this->scan($alpsFile);
        $this->validateRtNotMissing();
        $this->scanTags();
    }

    private function scan(string $alpsFile): void
    {
        $descriptors = $this->scanAlpsFile($alpsFile);
        foreach ($descriptors as $descriptor) {
            $this->scanDescriptor($descriptor);
        }
    }

    private function scanDescriptor(stdClass $descriptor): void
    {
        if (isset($descriptor->descriptor)) {
            $this->scanTransition(new SemanticDescriptor($descriptor), $descriptor->descriptor);

            return;
        }

        if (isset($descriptor->href)) {
            $this->href($descriptor);
        }

        if (isset($descriptor->rt) && strpos($descriptor->rt, '#')) {
            $this->scanDescriptor($this->getExternalDescriptor($descriptor->rt));
        }
    }

    private function href(stdClass $descriptor): void
    {
        $isExternal = $descriptor->href[0] !== '#';
        if (! $isExternal) {
            return;
        }

        $this->scanDescriptor($this->getExternalDescriptor($descriptor->href));
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
        if (strpos($href, '#') === false) {
            throw new SharpMissingInHrefException($href);
        }

        [$file, $descriptorId] = explode('#', $href);
        $scheme = parse_url($file, PHP_URL_SCHEME);
        if ($scheme === null) {
            $file = "{$this->dir}/{$file}";
        }
        $alpsProfile = new self($file);
        $descriptor = $alpsProfile->descriptors[$descriptorId];
        $this->descriptors[$descriptorId] = $descriptor;
        $stdClass = new stdClass();
        foreach($descriptor as $prop => $value) {
            $stdClass->$prop = $value;
        }

        return $stdClass;

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

        if (isset($profile->{'$schema'})) {
            $this->schema = $profile->{'$schema'};
        }

        $this->title = $profile->alps->title ?? ''; // @phpstan-ignore-line
        $this->doc = $profile->alps->doc->value ?? ''; // @phpstan-ignore-line

        if (! isset($profile->alps->descriptor) || ! is_array($profile->alps->descriptor)) { // @phpstan-ignore-line
            throw new InvalidAlpsException($alpsFile);
        }

        $this->descriptors = array_merge($this->descriptors, ($this->scanner)($profile->alps->descriptor));

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
}
