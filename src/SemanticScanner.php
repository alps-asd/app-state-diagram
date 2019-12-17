<?php

declare(strict_types=1);

namespace Koriym\AlpsStateDiagram;

final class SemanticScanner
{
    /**
     * @var IsSemantic
     */
    private $isSemantic;

    public function __construct()
    {
        $this->isSemantic = new IsSemantic;
    }

    public function __invoke(array $descriptors) : array
    {
        $semantics = [];
        foreach ($descriptors as $descriptor) {
            if (isset($descriptor->type) && $descriptor->type === 'semantic') {
                assert(isset($descriptor->id));
                $semantics[$descriptor->id] = new SemanticDescriptor($descriptor);
            }
            if (isset($descriptor->descriptor)) {
                $semantics = $this->sacnInlineDescriptor($descriptor, $semantics);
            }
        }

        return $semantics;
    }

    private function sacnInlineDescriptor($descriptor, array $semantics) : array
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
