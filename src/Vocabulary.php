<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function implode;
use const PHP_EOL;
use function sprintf;

final class Vocabulary
{
    /**
     * @var string
     */
    public $index;

    /**
     * @param AbstractDescriptor[] $descriptors
     */
    public function __construct(array $descriptors)
    {
        ksort($descriptors);
        $semantics = $links = [];
        foreach ($descriptors as $id => $descriptor) {
            if ($descriptor instanceof SemanticDescriptor) {
                $semantics[$id] = $descriptor;
            }
            if ($descriptor instanceof TransDescriptor) {
                $links[$id] = $descriptor;
            }
        }
        $semantics = $this->semantics($semantics);
        $links = $this->semantics($links);

        $this->index = <<<EOT
# Vocabulary

## Semantic

{$semantics}

## Links

{$links}
EOT;
    }

    private function semantics(array $semantics) : string
    {
        $lines = [];
        foreach ($semantics as $semantic) {
            if ($semantic->def) {
                $doc = isset($semantic->doc->value) ? $semantic->doc->value : '';
                $lines[] = sprintf(' * `%s`: [%s](%s) %s', $semantic->id, $semantic->def, $semantic->def, $doc) . PHP_EOL;

                continue;
            }
            $name = $this->getName($semantic);
            $lines[] = sprintf(' * `%s`: %s', $semantic->id, $name) . PHP_EOL;
        }

        return implode($lines);
    }

    private function getName(AbstractDescriptor $semantic) : string
    {
        $desc = [];
        if (isset($semantic->doc->value)) {
            $desc[] = $semantic->doc->value;
        }

        return implode(', ', $desc);
    }
}
