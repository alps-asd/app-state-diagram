<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\InvalidHrefException;
use Koriym\AppStateDiagram\Exception\MissingHashSignInHrefException;
use stdClass;

use function assert;
use function in_array;
use function is_int;
use function is_iterable;
use function is_string;
use function property_exists;
use function sprintf;
use function strpos;
use function substr;

use const PHP_EOL;

/** @psalm-immutable */
final class DrawDiagram
{
    public function __invoke(AbstractProfile $profile, ?LabelNameInterface $labelName): string
    {
        $transNodes = $this->getTransNodes($profile);
        $labelName ??= new LabelName();
        $descriptors = $profile->descriptors;
        [, $nodes] = $this->getNodes($transNodes, $labelName, $descriptors);
        $edge = new Edge($profile);
        $graph = (string) $edge;
        $appSateWithNoLink = (string) (new AppState($profile->links, $profile->descriptors, $labelName));
        $template = <<<'EOT'
digraph application_state_diagram {
  graph [
    labelloc="t";
    fontname="Helvetica"
    label="%s";
    URL="index.html" target="_parent"
  ];
  node [shape = box, style = "bold,filled" fillcolor="lightgray", margin="0.3,0.1"];

%s
%s
%s
}
EOT;

        return sprintf($template, $profile->title, $nodes, $graph, $appSateWithNoLink);
    }

    /**
     * @param list<string>                      $transNodes
     * @param array<string, AbstractDescriptor> $descriptors
     *
     * @return array{0: list<string>, 1: string}
     */
    public function getNodes(array $transNodes, LabelNameInterface $labelName, array $descriptors): array
    {
        /** @var list<string> $ids */
        $ids = [];
        $dot = '';
        foreach ($descriptors as $descriptor) {
            if (! in_array($descriptor->id, $transNodes)) {
                continue;
            }

            [$id, $deltaDot] = $this->getNode($descriptor, $labelName, $descriptors);
            $dot .= $deltaDot;
            if (is_string($id) && $id !== '') {
                $ids[] = $id;
            }
        }

        return [$ids, $dot];
    }

    /** @return list<string> */
    private function getTransNodes(AbstractProfile $profile): array
    {
        $transNodes = [];
        foreach ($profile->links as $link) {
            if (! in_array($link->from, $transNodes)) {
                $transNodes[] = $link->from;
            }

            if (! in_array($link->to, $transNodes)) {
                $transNodes[] = $link->to;
            }
        }

        return $transNodes;
    }

    /**
     * @param array<string, AbstractDescriptor> $descriptors
     *
     * @return array{0: ?string, 1: string}
     */
    private function getNode(AbstractDescriptor $descriptor, LabelNameInterface $labelName, array $descriptors): array
    {
        $hasDescriptor = $descriptor instanceof SemanticDescriptor && $descriptor->descriptor !== [];
        if (! $hasDescriptor) {
            return [null, ''];
        }

        $props = $this->getNodeProps($descriptor, $labelName, $descriptors);
        if ($props === []) {
            return [null, ''];
        }

        $inlineDescriptors = '';
        foreach ($props as $prop) {
            $inlineDescriptors .= sprintf('(%s)<br />', $prop);
        }

        return [$descriptor->id, $this->template($descriptor, $inlineDescriptors, $labelName)];
    }

    /**
     * @param array<string, AbstractDescriptor> $descriptors
     *
     * @return list<string>
     */
    private function getNodeProps(AbstractDescriptor $descriptor, LabelNameInterface $labelName, array $descriptors): array
    {
        $props = [];
        assert(is_iterable($descriptor->descriptor));
        foreach ($descriptor->descriptor as $item) {
            if ($this->isSemanticHref($item, $descriptors)) {
                assert(is_string($item->href));
                $descriptor =  $this->getHref($item->href, $descriptors);
                assert($descriptor instanceof SemanticDescriptor);
                $props[] = $labelName->getNodeLabel($descriptor);
            }

            $isSemantic = isset($item->type) && $item->type === 'semantic';
            if ($isSemantic) {
                $props[] = (string) $item->id;
            }
        }

        return $props;
    }

    /** @param array<string, AbstractDescriptor> $descriptors */
    private function getHref(string $href, array $descriptors): AbstractDescriptor
    {
        $pos = strpos($href, '#');
        assert(is_int($pos));
        $index = substr($href, $pos + 1);

        return $descriptors[$index];
    }

    /** @param array<string, AbstractDescriptor> $descriptors */
    private function isSemanticHref(stdClass $item, array $descriptors): bool
    {
        if (! property_exists($item, 'href')) {
            return false;
        }

        assert(is_string($item->href));

        $pos = strpos($item->href, '#');
        if ($pos === false) {
            throw new MissingHashSignInHrefException($item->href); // @codeCoverageIgnore
        }

        $id = substr($item->href, $pos + 1);
        if (! isset($descriptors[$id])) {
            throw new InvalidHrefException($item->href); // @codeCoverageIgnore
        }

        $descriptor = $descriptors[$id];

        return $descriptor instanceof SemanticDescriptor;
    }

    private function template(AbstractDescriptor $descriptor, string $props, LabelNameInterface $labelName): string
    {
        $base = <<<'EOT'
    %s [margin=0.02, label=<<table cellspacing="0" cellpadding="5" border="0"><tr><td>%s<br />%s</td></tr></table>>,shape=box URL="%s" target="_parent"
EOT;

        $url = sprintf('#%s', $descriptor->id);
        assert($descriptor instanceof SemanticDescriptor);

        return sprintf($base . ']' . PHP_EOL, $descriptor->id, $labelName->getNodeLabel($descriptor), $props, $url);
    }
}
