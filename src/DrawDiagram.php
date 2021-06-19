<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\InvalidHrefException;
use Koriym\AppStateDiagram\Exception\SharpMissingInHrefException;
use stdClass;

use function assert;
use function in_array;
use function is_int;
use function is_string;
use function property_exists;
use function sprintf;
use function strpos;
use function substr;

use const PHP_EOL;

final class DrawDiagram
{
    /** @var  LabelNameInterface */
    private $labelName;

    public function __construct(LabelNameInterface $labelName)
    {
        $this->labelName = $labelName;
    }

    /** @var AbstractDescriptor[] */
    private $descriptors = [];

    /** @var ?TaggedProfile */
    private $taggedProfile;

    /** @var ?string */
    private $color;

    public function __invoke(AbstractProfile $profile, ?TaggedProfile $taggedProfile = null, ?string $color = null): string
    {
        $transNodes = $this->getTransNodes($profile);
        $appSate = new AppState($profile->links, $profile->descriptors, $this->labelName, $taggedProfile, $color);
        $this->descriptors = $profile->descriptors;
        $this->taggedProfile = $taggedProfile;
        $this->color = $color;
        $nodes = $this->getNodes($appSate, $transNodes);
        $edge = new Edge($profile, $taggedProfile, $color);
        $graph = (string) $edge;
        $appSateWithNoLink = (string) $appSate;
        $template = <<<'EOT'
digraph application_state_diagram {
  graph [
    labelloc="t";
    fontname="Helvetica"
    label="%s";
    URL="index.html" target="_parent"
  ];
  node [shape = box, style = "bold,filled" fillcolor="lightgray"];

%s
%s
%s
}
EOT;

        return sprintf($template, $profile->title, $nodes, $graph, $appSateWithNoLink);
    }

    /**
     * @param list<string> $transNodes
     */
    public function getNodes(AppState $appSate, array $transNodes): string
    {
        $dot = '';
        foreach ($this->descriptors as $descriptor) {
            if (! in_array($descriptor->id, $transNodes)) {
                continue;
            }

            $dot .= $this->getNode($descriptor, $appSate);
        }

        return $dot;
    }

    /**
     * @return list<string>
     */
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

    private function getNode(AbstractDescriptor $descriptor, AppState $appSate): string
    {
        $hasDescriptor = $descriptor instanceof SemanticDescriptor && isset($descriptor->descriptor);
        if (! $hasDescriptor) {
            return '';
        }

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
     * @param list<string> $props
     *
     * @return list<string>
     */
    private function getNodeProps(SemanticDescriptor $descriptor, array $props): array
    {
        foreach ($descriptor->descriptor as $item) {
            if ($this->isSemanticHref($item)) {
                assert(is_string($item->href));
                $descriptor =  $this->getHref($item->href);
                assert($descriptor instanceof SemanticDescriptor);
                $props[] = $this->labelName->getNodeLabel($descriptor);
            }

            $isSemantic = isset($item->type) && $item->type === 'semantic';
            if ($isSemantic) {
                $props[] = (string) $item->id;
            }
        }

        return $props;
    }

    private function getHref(string $href): AbstractDescriptor
    {
        $pos = strpos($href, '#');
        assert(is_int($pos));
        $index = substr($href, $pos + 1);

        return $this->descriptors[$index];
    }

    private function isSemanticHref(stdClass $item): bool
    {
        if (! property_exists($item, 'href')) {
            return false;
        }

        assert(is_string($item->href));

        $pos = strpos($item->href, '#');
        if ($pos === false) {
            throw new SharpMissingInHrefException($item->href);
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
        $base = <<<'EOT'
    %s [margin=0.02, label=<<table cellspacing="0" cellpadding="5" border="0"><tr><td>%s<br />%s</td></tr></table>>,shape=box URL="%s" target="_parent"
EOT;

        $url = sprintf('docs/%s.%s.html', $descriptor->type, $descriptor->id);
        assert($descriptor instanceof SemanticDescriptor);

        if (isset($this->color, $this->taggedProfile) && in_array($descriptor, $this->taggedProfile->descriptors)) {
            return sprintf($base . ' color="%s"]' . PHP_EOL, $descriptor->id, $this->labelName->getNodeLabel($descriptor), $props, $url, $this->color);
        }

        return sprintf($base . ']' . PHP_EOL, $descriptor->id, $this->labelName->getNodeLabel($descriptor), $props, $url);
    }
}
