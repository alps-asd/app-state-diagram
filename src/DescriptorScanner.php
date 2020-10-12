<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\InvalidDescriptorException;
use stdClass;

use function assert;
use function in_array;
use function is_string;
use function json_encode;

final class DescriptorScanner
{
    /**
     * @param list<stdClass> $descriptorsArray
     *
     * @return array<string, AbstractDescriptor>
     */
    public function __invoke(array $descriptorsArray): array
    {
        $descriptors = [];
        foreach ($descriptorsArray as $descriptor) {
            $descriptors = $this->scan($descriptor, $descriptors);
        }

        return $descriptors;
    }

    /**
     * @param array<string, AbstractDescriptor> $descriptors
     *
     * @return array<AbstractDescriptor>
     */
    private function scan(stdClass $descriptor, array $descriptors): array
    {
        $hasNoId = ! isset($descriptor->href) && ! isset($descriptor->id);
        $hasNoType = ! isset($descriptor->href) && ! isset($descriptor->type);
        if ($hasNoId || $hasNoType) {
            throw new InvalidDescriptorException((string) json_encode($descriptor));
        }

        if (isset($descriptor->type) && $descriptor->type === 'semantic') {
            assert(isset($descriptor->id));
            $descriptors[$descriptor->id] = new SemanticDescriptor($descriptor);
        }

        $isTransDescriptor = isset($descriptor->type) && in_array($descriptor->type, ['safe', 'unsafe', 'idempotent'], true);
        if ($isTransDescriptor) {
            $nullParentSemantic = new class {
                /** @var string */
                public $id = '';

                /** @var string */
                public $type = 'semantic';
            };
            assert(is_string($descriptor->id));
            $descriptors[$descriptor->id] = new TransDescriptor($descriptor, new SemanticDescriptor($nullParentSemantic));
        }

        if (isset($descriptor->descriptor)) {
            $descriptors = $this->scanInlineDescriptor($descriptor, $descriptors);
        }

        return $descriptors;
    }

    /**
     * @param array<AbstractDescriptor> $descriptors
     *
     * @return array<string, AbstractDescriptor>
     */
    private function scanInlineDescriptor(stdClass $descriptor, array $descriptors): array
    {
        $inLineSemantics = $this->__invoke($descriptor->descriptor);
        if ($inLineSemantics !== []) {
            $descriptors = $this->addInlineSemantics($descriptors, $inLineSemantics);
        }

        return $descriptors;
    }

    /**
     * @param array<string, AbstractDescriptor> $descriptors
     * @param array<string, AbstractDescriptor> $inLineSemantics
     *
     * @return array<string, AbstractDescriptor>
     */
    private function addInlineSemantics(array $descriptors, array $inLineSemantics): array
    {
        foreach ($inLineSemantics as $inLineSemantic) {
            if ($inLineSemantic instanceof SemanticDescriptor) {
                $descriptors[$inLineSemantic->id] = $inLineSemantic;
            }
        }

        return $descriptors;
    }
}
