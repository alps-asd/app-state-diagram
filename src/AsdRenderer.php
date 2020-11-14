<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\InvalidHrefException;
use stdClass;

use function assert;
use function explode;
use function sprintf;
use function strpos;
use function substr;

use const PHP_EOL;

final class AsdRenderer
{
    /** @var AbstractDescriptor[] */
    private $descriptors = [];

    /**
     * @param array<string, Link>       $links
     * @param array<AbstractDescriptor> $descriptors
     */
    public function __invoke(array $links, array $descriptors, string $title = ''): string
    {
        $appSate = new AppState($links, $descriptors);
        $this->descriptors = $descriptors;
        $nodes = $this->getNodes($appSate);
        $graph = '';
        foreach ($links as $arrowId => $label) {
            [$arrow] = explode(':', $arrowId);
            $url = sprintf('docs/%s.%s.html', $label->transDescriptor->type, $label->transDescriptor->id);
            $graph .= sprintf('    %s [label = "%s" URL="%s"];', $arrow, (string) $label, $url) . PHP_EOL;
        }

        $appSateWithNoLink = (string) $appSate;
        $template = <<<'EOT'
digraph application_state_diagram {
  graph [
    labelloc="b";
    fontname="Helvetica"
    label="%s";
    URL="index.html"
  ];
  node [shape = box, style = "bold,filled"];

%s
%s
%s
}
EOT;

        return sprintf($template, $title, $nodes, $graph, $appSateWithNoLink);
    }

    public function getNodes(AppState $appSate): string
    {
        $dot = '';
        foreach ($this->descriptors as $descriptor) {
            $dot .= $this->getNode($descriptor, $appSate);
        }

        return $dot;
    }

    private function getNode(AbstractDescriptor $descriptor, AppState $appSate): string
    {
        $hasDescriptor = $descriptor instanceof SemanticDescriptor && isset($descriptor->descriptor);
        if (! $hasDescriptor) {
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

        $appSate->remove($descriptor->id);

        return $this->template($descriptor, $inlineDescriptors);
    }

    /**
     * @param list<stdClass> $props
     *
     * @return list<string>
     */
    private function getNodeProps(SemanticDescriptor $descriptor, array $props): array
    {
        assert(isset($descriptor->descriptor));
        foreach ($descriptor->descriptor as $item) {
            if ($this->isSemanticHref($item)) {
                $props[] = substr($item->href, (int) strpos($item->href, '#') + 1);
            }

            $isSemantic = isset($item->type) && $item->type === 'semantic';
            if ($isSemantic) {
                $props[] = $item->id;
            }
        }

        return $props;
    }

    private function isSemanticHref(stdClass $item): bool
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
            throw new InvalidHrefException($item->href);
        }

        $descriptor = $this->descriptors[$id];

        return $descriptor instanceof SemanticDescriptor;
    }

    private function template(AbstractDescriptor $descriptor, string $props): string
    {
        $template = <<<'EOT'
    %s [style=solid, margin=0.02, label=<<table cellspacing="0" cellpadding="5" cellborder="1" border="0"><tr><td bgcolor="#dddddd">%s<br />%s</td></tr></table>>,shape=box URL="%s"]

EOT;

        $url = sprintf('docs/%s.%s.html', $descriptor->type, $descriptor->id);

        return sprintf($template, $descriptor->id, $descriptor->id, $props, $url);
    }
}
