<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function array_keys;
use function dirname;
use function file_get_contents;
use function htmlspecialchars;
use function implode;
use function nl2br;
use function sprintf;
use function str_replace;
use function strtoupper;
use function uasort;

use const ENT_QUOTES;
use const PHP_EOL;

final class IndexPage
{
    /** @var string */
    public $content;

    /** @var string */
    public $file;

    public function __construct(Config $config)
    {
        [$profile, $dotId, $dotName, $mode, $alpsProfile, $semanticMd, $linkRelations, $ext, $tags, $htmlTitle, $htmlDoc, $setUpTagEvents] = $this->getDataFromConfig($config);
        $indexJsFile = dirname(__DIR__, 1) . '/docs/assets/js/index.js';
        $indexJs = sprintf('<script>%s</script>', file_get_contents($indexJsFile));
        $header = <<<EOT
<script src="https://d3js.org/d3.v5.min.js"></script>
<script src="https://unpkg.com/viz.js@1.8.1/viz.js" type="javascript/worker"></script>
<script src="https://unpkg.com/d3-graphviz@2.1.0/build/d3-graphviz.min.js"></script>
{$indexJs}
EOT;
        $md = <<<EOT
# {$htmlTitle}

{$htmlDoc}

<!-- Container for the ASDs -->
<div id="graphId" style="text-align: center; "></div>
<div id="graphName" style="text-align: center; display: none;"></div>
<script>
    document.addEventListener('DOMContentLoaded', function() {
        renderGraph("#graphId", '{{ dotId }}');
        renderGraph("#graphName", '{{ dotName }}');
        setupTagTrigger();
        setupModeSwitch()
        applySmoothScrollToLinks(document.querySelectorAll('a[href^="#"]'));
        {$setUpTagEvents}
    });
</script>
<div id="selector" style="">
    <input type="radio" id="show_id" name="graph_selector" checked>
    <label for="show_id">id<ID/label>
    <input type="radio" id="show_name" name="graph_selector">
    <label for="show_name">name</label>
</div>
---

{$tags}

## Semantic Descriptors

 {$semanticMd}

---

## Links

{$linkRelations}

---

## Profile
<pre><code>{$alpsProfile}</code></pre>
EOT;
        $this->file = sprintf('%s/index.%s', dirname($profile->alpsFile), $ext);
        if ($mode === DumpDocs::MODE_MARKDOWN) {
            $this->content = $md;

            return;
        }

        $html = (new MdToHtml())($htmlTitle, $md);
        $escapedDotId = str_replace("\n", '', $dotId);
        $escapedDotName = str_replace("\n", '', $dotName);
        $plusHeaderHtml = str_replace(
            '</head>',
            $header . '</head>',
            $html
        );
        $this->content = str_replace(['{{ dotId }}', '{{ dotName }}', '{{ dotName }}'], [$escapedDotId, $escapedDotName], $plusHeaderHtml);
    }

    /** @param array<string, list<string>> $tags */
    private function tags(array $tags): string
    {
        if ($tags === []) {
            return '';
        }

        $lines = ['## Tags'];
        $tagKeys = array_keys($tags);
        foreach ($tagKeys as $tag) {
            $lines[] = sprintf('* <input type="checkbox" id="tag-%s" class="tag-trigger-checkbox" data-tag="%s"><label for="tag-%s"> %s</label>', $tag, $tag, $tag, $tag);
        }

        return PHP_EOL . implode(PHP_EOL, $lines);
    }

    private function linkRelations(LinkRelations $linkRelations): string
    {
        if ((string) $linkRelations === '') {
            return '';
        }

        return PHP_EOL . $linkRelations;
    }

    private function getSetupTagEvents(Config $config): string
    {
        $setUpTagEvents = '';
        $tags = (new Profile($config->profile, new LabelName()))->tags;
        foreach ($tags as $tag => $ids) {
            $idArr = [];
            foreach ($ids as $id) {
                $idArr[] .= "'{$id}'";
            }

            $setUpTagEvents .= sprintf("setupTagEventListener('%s', [%s], '%s'); ", $tag, implode(', ', $idArr), 'lightgreen');
        }

        return $setUpTagEvents;
    }

    /** @return list<mixed> */
    public function getDataFromConfig(Config $config): array
    {
        $draw = new DrawDiagram();
        $profile = new Profile($config->profile, new LabelName());
        $titleProfile = new Profile($config->profile, new LabelNameTitle());
        $dotId = $draw($profile, new LabelName());
        $dotName = $draw($titleProfile, new LabelNameTitle());
        $mode = $config->outputMode;
        $alpsProfile = htmlspecialchars(
            (string) file_get_contents($profile->alpsFile),
            ENT_QUOTES,
            'UTF-8'
        );

        $semanticMd = PHP_EOL . (new DumpDocs())->getSemanticDescriptorMarkDown($profile, $profile->alpsFile);
        $descriptors = $profile->descriptors;
        uasort($descriptors, static function (AbstractDescriptor $a, AbstractDescriptor $b): int {
            $compareId = strtoupper($a->id) <=> strtoupper($b->id);
            if ($compareId !== 0) {
                return $compareId;
            }

            $order = ['semantic' => 0, 'safe' => 1, 'unsafe' => 2, 'idempotent' => 3];

            return $order[$a->type] <=> $order[$b->type];
        });
        $linkRelations = $this->linkRelations($profile->linkRelations);
        $ext = $mode === DumpDocs::MODE_MARKDOWN ? 'md' : DumpDocs::MODE_HTML;
        $tags = $this->tags($profile->tags);
        $htmlTitle = htmlspecialchars($profile->title ?: 'ALPS');
        $htmlDoc = nl2br(htmlspecialchars($profile->doc));
        $setUpTagEvents = $this->getSetupTagEvents($config);

        return [$profile, $dotId, $dotName, $mode, $alpsProfile, $semanticMd, $linkRelations, $ext, $tags, $htmlTitle, $htmlDoc, $setUpTagEvents];
    }
}
