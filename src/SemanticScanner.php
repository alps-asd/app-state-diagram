<?php

declare(strict_types=1);

namespace Koriym\AlpsStateDiagram;

final class SemanticScanner
{
    public function __invoke(array $descriptors) : array
    {
        $semantics = [];
        foreach ($descriptors as $descriptor) {
            assert($descriptor instanceof \stdClass);
            if (isset($descriptor->type) && $descriptor->type === 'semantic') {
                assert(isset($descriptor->id));
                $semantics[$descriptor->id] = new SemanticDescriptor($descriptor);
            }
            $isTransDescriptor = isset($descriptor->type) && in_array($descriptor->type, ['safe', 'unsafe', 'idempotent'], true);
            if ($isTransDescriptor) {
                $nullParentSemantic = new class {
                    /** @var string */ public $id = '';
                    /** @var string */ public $type = 'semantic';
                };
                $semantics[$descriptor->id] = new TransDescriptor($descriptor, new SemanticDescriptor($nullParentSemantic));
            }
            if (isset($descriptor->descriptor)) {
                $semantics = $this->sacnInlineDescriptor($descriptor, $semantics);
            }
        }

        return $semantics;
    }

    private function sacnInlineDescriptor(\stdClass $descriptor, array $semantics) : array
    {
        $inLineSemantics = $this->__invoke($descriptor->descriptor);
        if ($inLineSemantics !== []) {
            $semantics = $this->addInlineSemantics($semantics, $inLineSemantics);
        }

        return $semantics;
    }

    private function addInlineSemantics(array $semantics, array $inLineSemantics) : array
    {
        foreach ($inLineSemantics as $inLineSemantic) {
            if ($inLineSemantic instanceof SemanticDescriptor) {
                $semantics[$inLineSemantic->id] = $inLineSemantic;
            }
        }

        return $semantics;
    }
}
