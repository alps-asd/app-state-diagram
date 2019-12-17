<?php

declare(strict_types=1);

namespace Koriym\AlpsStateDiagram;

final class DescriptorScanner
{
    public function __invoke(array $descriptorsArray) : array
    {
        $descriptors = [];
        foreach ($descriptorsArray as $descriptor) {
            $descriptors = $this->scan($descriptor, $descriptors);
        }

        return $descriptors;
    }

    private function scan($descriptor, array $descriptors) : array
    {
        assert($descriptor instanceof \stdClass);
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
            $descriptors[$descriptor->id] = new TransDescriptor($descriptor, new SemanticDescriptor($nullParentSemantic));
        }
        if (isset($descriptor->descriptor)) {
            $descriptors = $this->sacnInlineDescriptor($descriptor, $descriptors);
        }

        return $descriptors;
    }

    private function sacnInlineDescriptor(\stdClass $descriptor, array $descriptors) : array
    {
        $inLineSemantics = $this->__invoke($descriptor->descriptor);
        if ($inLineSemantics !== []) {
            $descriptors = $this->addInlineSemantics($descriptors, $inLineSemantics);
        }

        return $descriptors;
    }

    private function addInlineSemantics(array $descriptors, array $inLineSemantics) : array
    {
        foreach ($inLineSemantics as $inLineSemantic) {
            if ($inLineSemantic instanceof SemanticDescriptor) {
                $descriptors[$inLineSemantic->id] = $inLineSemantic;
            }
        }

        return $descriptors;
    }
}
