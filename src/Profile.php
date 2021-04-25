<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\DescriptorIsNotArrayException;
use Koriym\AppStateDiagram\Exception\DescriptorNotFoundException;
use Koriym\AppStateDiagram\Exception\InvalidDescriptorException;
use stdClass;

use function assert;
use function is_array;
use function is_string;
use function json_encode;
use function ksort;
use function property_exists;
use function substr;

final class Profile extends AbstractProfile
{
    /** @var string */
    public $schema;

    /** @var string */
    public $title;

    /** @var string */
    public $doc;

    /** @var string  */
    public $alpsFile;

    /** @var HyperReference */
    private $hyperReference;

    /**
     * Descriptor instances (not reference)
     *
     * @var array<string, stdClass>
     */
    private $instances = [];

    /** @var array<string, list<string>> */
    public $tags = [];

    /**
£     * @throws \Seld\JsonLint\ParsingException
     */
    public function __construct(string $alpsFile, ?HyperReference $hyperReference = null, bool $doFinalize = true)
    {
        $this->hyperReference = $hyperReference ?: new HyperReference($alpsFile);
        $this->alpsFile = $alpsFile;
        [$profile, $descriptors] = (new SplitProfile())($alpsFile);
        /** @psalm-suppress all */
        [$this->schema, $this->title, $this->doc] = [$profile->{'$schema'} ?? '', $profile->alps->title ?? '', $profile->alps->doc->value ??  '']; // @phpstan-ignore-line
        $instances = new Instances();
        $this->storeDescriptors($descriptors, $instances);
        $this->instances = $instances->get();
        if ($doFinalize) {
            $this->finalize();
        }
    }

    /**
     * Return instances of raw descriptor
     *
     * @return array<string, stdClass>
     */
    public function export(string $id, string $alpsFile): array
    {
        if (! isset($this->instances[$id])) {
            throw new DescriptorNotFoundException($id);
        }

        $instance = $this->instances[$id];
        $instances = new Instances();
        if (property_exists($instance, 'rt')) {
            assert(is_string($instance->rt));
            $this->rt($instance->rt, $instances, $alpsFile);
        }

        if (! property_exists($instance, 'descriptor')) {
            assert(is_string($instance->id));

            return [$instance->id => $instance];
        }

        /** @var list<stdClass> $stdClasses */
        $stdClasses = $instance->descriptor;
        $this->storeDescriptors($stdClasses, $instances);

        return $instances->get() + [(string) $instance->id => $instance];
    }

    private function rt(string $rt, Instances $instances, string $alpsFile): void
    {
        $rtKey = substr($rt, 1);
        if (isset($this->instances[$rtKey])) {
            $this->hyperReference->add($alpsFile, $rt);
        }
    }

    private function finalize(): void
    {
        /** @var list<stdClass> $instances */
        $instances = $this->hyperReference->getInstances($this->instances);
        ksort($instances);
        $this->descriptors = (new CreateDescriptor())($instances);
        $this->links = (new CreateLinks())($this->descriptors, $instances);
        $this->scanTags();
    }

    /**
     * Set the raw descriptor on selection (instance or reference)
     *
     * @param list<stdClass> $rawDescriptors
     */
    private function storeDescriptors(array $rawDescriptors, Instances $instances): void
    {
        foreach ($rawDescriptors as $rawDescriptor) {
            if (property_exists($rawDescriptor, 'id')) {
                $this->storeRawDescriptor($rawDescriptor, $instances);
                continue;
            }

            if (property_exists($rawDescriptor, 'rt') && is_string($rawDescriptor->rt)) {
                $this->hyperReference->add($this->alpsFile, $rawDescriptor->rt);
                continue;
            }

            if (property_exists($rawDescriptor, 'href') && is_string($rawDescriptor->href)) {
                $this->hyperReference->add($this->alpsFile, $rawDescriptor->href);
                continue;
            }

            throw new InvalidDescriptorException((string) json_encode($rawDescriptor));
        }
    }

    private function storeRawDescriptor(stdClass $rawDescriptor, Instances $instances): void
    {
        assert(is_string($rawDescriptor->id));
        $instances->add($rawDescriptor);
        if (property_exists($rawDescriptor, 'descriptor')) {
            $descriptors = $rawDescriptor->descriptor;
            if (! is_array($descriptors)) {
                throw new DescriptorIsNotArrayException($rawDescriptor->id);
            }

            /** @var list<stdClass> $descriptors */

            $this->storeDescriptors($descriptors, $instances);
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
