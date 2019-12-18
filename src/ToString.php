<?php

declare(strict_types=1);

namespace Koriym\AlpsStateDiagram;

use Koriym\AlpsStateDiagram\Exception\InvalidHrefException;

final class ToString
{
    /**
     * @var DescriptorInterface[]
     */
    private $descriptors = [];

    public function __invoke(iterable $links, array $descriptors) : string
    {
        $this->descriptors = $descriptors;
        $dot = $this->getNodes();
        foreach ($links as $link => $label) {
            $dot .= sprintf('    %s [label = "%s"];', $link, $label) . PHP_EOL;
        }

        return sprintf('digraph application_state_diagram {
    node [shape = box, style = "bold,filled"];
%s
}
', $dot);
    }

    public function getNodes() : string
    {
        $dot = '';
        foreach ($this->descriptors as $descriptor) {
            $dot .= $this->getNode($descriptor);
        }

        return $dot;
    }

    private function getNode(DescriptorInterface $descriptor) : string
    {
        $hasDesciptor = $descriptor instanceof SemanticDescriptor && isset($descriptor->descriptor);
        if (! $hasDesciptor) {
            return '';
        }
        assert($descriptor instanceof SemanticDescriptor);
        $props = [];
        $props = $this->getNodeProps($descriptor, $props);
        if ($props === []) {
            return '';
        }
        $inlineDescriptors = '';
        foreach ($props as $prop) {
            $inlineDescriptors .= sprintf('(%s)<br />', $prop);
        }

        return $this->tempalte($descriptor->id, $inlineDescriptors);
    }

    private function getNodeProps(SemanticDescriptor $descriptor, array $props) : array
    {
        assert(isset($descriptor->descriptor));
        assert(is_iterable($descriptor->descriptor));
        foreach ($descriptor->descriptor as $item) {
            if ($this->isSemanticHref($item)) {
                $props[] = $item->href;
            }
            $isSemantic = isset($item->type) && $item->type === 'semantic';
            if ($isSemantic) {
                $props[] = $item->id;
            }
        }

        return $props;
    }

    private function isSemanticHref(\stdClass $item) : bool
    {
        if (! isset($item->href)) {
            return false;
        }
        $pos = strpos($item->href, '#');
        if ($pos === false) {
            throw new InvalidHrefException($item->href);
        }
        $id = substr($item->href, $pos + 1);
        if (! isset($this->descriptors[$id])) {
            throw new InvalidHrefException($id);
        }
        $descriptor = $this->descriptors[$id];

        return $descriptor instanceof SemanticDescriptor;
    }

    private function tempalte(string $stateName, string $props) : string
    {
        $template = <<<'EOT'
%s [style=solid, margin=0.02, label=<<table cellspacing="0" cellpadding="5" cellborder="1" border="0"><tr>
    <td bgcolor="#dddddd">%s<br />%s</td>
    </tr></table>>,shape=box
]

EOT;

        return sprintf($template, $stateName, $stateName, $props);
    }
}
