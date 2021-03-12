<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\InvalidHrefException;
use Koriym\AppStateDiagram\Exception\SharpMissingInHrefException;
use stdClass;

use function in_array;
use function sprintf;
use function strpos;
use function substr;

use const PHP_EOL;

final class DrawDiagram
{
    /** @var AbstractDescriptor[] */
    private $descriptors = [];

    /** @var ?TaggedAlpsProfile */
    private $taggedProfile;

    /** @var ?string */
    private $color;

    public function __invoke(AbstractProfile $profile, ?TaggedAlpsProfile $taggedProfile = null, ?string $color = null): string
    {
        $transNodes = $this->getTransNodes($profile);
        $appSate = new AppState($profile->links, $profile->descriptors, $taggedProfile, $color);
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
        $props = $this->getNodeProps($descriptor, $props); // @phpstan-ignore-line
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

        if (isset($this->color, $this->taggedProfile) && in_array($descriptor, $this->taggedProfile->descriptors)) {
            return sprintf($base . ' color="%s"]' . PHP_EOL, $descriptor->id, $descriptor->id, $props, $url, $this->color);
        }

        return sprintf($base . ']' . PHP_EOL, $descriptor->id, $descriptor->id, $props, $url);
    }
}
