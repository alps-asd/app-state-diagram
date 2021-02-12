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

use function array_keys;
use function array_merge;
use function dirname;
use function explode;
use function file_exists;
use function file_get_contents;
use function in_array;
use function is_array;
use function is_readable;
use function json_last_error;
use function json_last_error_msg;
use function sprintf;
use function strpos;

final class AlpsProfile extends AbstractProfile
{
    /** @var string */
    public $alpsFile;

    /** @var DescriptorScanner */
    private $scanner;

    /** @var string */
    private $dir = '';

    public function __construct(string $alpsFile)
    {
        if (! is_readable($alpsFile)) {
            throw new AlpsFileNotReadableException($alpsFile);
        }

        $this->alpsFile = $alpsFile;
        $this->scanner = new DescriptorScanner();
        $this->dir = dirname($alpsFile);
        $this->scan($alpsFile);
        $this->validateRtNotMissing();
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
        $file = "{$this->dir}/{$file}";
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
        if (! file_exists($alpsFile)) {
            throw new AlpsFileNotReadableException($alpsFile);
        }

        $profile = (new JsonDecode())((string) file_get_contents($alpsFile));
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
}
