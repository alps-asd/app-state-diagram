<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function array_keys;
use function basename;
use function count;
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

/** @psalm-suppress InvalidPropertyFetch */
final class IndexPage
{
    /** @var string */
    public $content;

    /** @var string */
    public $file;

    public function __construct(Config $config)
    {
        $index = $this->getElements($config);
        $indexJsFile = dirname(__DIR__, 1) . '/docs/assets/js/asd@0.1.0.js';
        $indexJs = sprintf('<script>%s</script>', (string) file_get_contents($indexJsFile));
        $header = <<<EOT
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="https://unpkg.com/@hpcc-js/wasm/dist/graphviz.umd.js" type="javascript/worker"></script>
    <script src="https://unpkg.com/d3-graphviz@5.6.0/build/d3-graphviz.min.js"></script>
<script src="https://alps-asd.github.io/app-state-diagram/assets/js/table.js"></script>
{$indexJs}
EOT;
        $legend = $config->outputMode === DumpDocs::MODE_MARKDOWN ? '' : IndexPageElements::LEGEND;
        $tags = $config->outputMode === DumpDocs::MODE_MARKDOWN ? '' : $index->tags;
        $asd = $config->outputMode === DumpDocs::MODE_MARKDOWN ? $this->getMarkdownImage($config->profile) : <<< EOTJS
<div id="svg-container">
    <div id="asd-graph-id" style="text-align: center; "></div>
    <div id="asd-graph-name" style="text-align: center; display: none;"></div>
</div>
<script>
    document.addEventListener('DOMContentLoaded', async function() {
        try {
            await Promise.all([
                    renderGraph("#asd-graph-id", '{{ dotId }}'),
                    renderGraph("#asd-graph-name", '{{ dotName }}')
            ]);
            setupTagTrigger();
            setupModeSwitch('asd-show-id', 'asd-graph-id', 'asd-graph-name');
            setupModeSwitch('asd-show-name', 'asd-graph-name', 'asd-graph-id');
            applySmoothScrollToLinks(document.querySelectorAll('a[href^="#"]'));
            setupTagClick();
            setupDocClick(); 
            {$index->setUpTagEvents}
        } catch (error) {
               console.error("Error in main process:", error);
        }});
</script>
<div class="asd-view-selector">
    <span class="selector-label">View:</span>
    <input type="radio" id="asd-show-id" checked name="asd-view-selector">
    <label for="asd-show-id">id</label>
    <input type="radio" id="asd-show-name" name="asd-view-selector">
    <label for="asd-show-name">title</label>
</div>
EOTJS;

        $md = <<<EOT
# {$index->htmlTitle}

{$index->htmlDoc}

<!-- Container for the ASDs -->

{$asd}
{$tags}
{$legend}

{$index->semanticMd}
{$index->linkRelations}


---

## Profile
<pre><code>{$index->alpsProfile}</code></pre>
EOT;
        $this->file = sprintf('%s/index.%s', dirname($index->profile->alpsFile), $index->ext);
        if ($index->mode === DumpDocs::MODE_MARKDOWN) {
            $this->content = $md;

            return;
        }

        $html = (new MdToHtml())($index->htmlTitle, $md);
        $escapedDotId = str_replace("\n", '', $index->dotId);
        $escapedDotName = str_replace("\n", '', $index->dotName);
        $plusHeaderHtml = str_replace(
            '</head>',
            $header . '</head>',
            $html
        );
        $this->content = str_replace(['{{ dotId }}', '{{ dotName }}', '{{ dotName }}'], [$escapedDotId, $escapedDotName], $plusHeaderHtml);
    }

    private function getMarkdownImage(string $profile): string
    {
        $baseProfile = basename($profile);
        $imageFile = str_replace(['.xml', '.json'], '.svg', $baseProfile);
        $imageTitleFile = str_replace(['.xml', '.json'], '.title.svg', $baseProfile);

        return sprintf(
            '[<img src="%s" alt="application state diagram">](%s)',
            $imageFile,
            $imageTitleFile
        );
    }

    /** @param array<string, list<string>> $tags */
    private function tags(array $tags): string
    {
        if ($tags === []) {
            return '';
        }

        $lines = ['<span class="selector-label">Tags:</span>'];
        $tagKeys = array_keys($tags);
        foreach ($tagKeys as $tag) {
            $lines[] = sprintf('<span class="selector-option"><input type="checkbox" id="tag-%s" class="tag-trigger-checkbox" data-tag="%s" name="tag-%s"><label for="tag-%s"> %s</label></span>', $tag, $tag, $tag, $tag, $tag);
        }

        return sprintf('<div class="selector-container">%s</div>', implode(PHP_EOL, $lines));
    }

    private function linkRelations(LinkRelations $linkRelations): string
    {
        if ((string) $linkRelations === '') {
            return '';
        }

        return '## Links' . PHP_EOL . (string) $linkRelations;
    }

    private function getSetupTagEvents(Config $config): string
    {
        $setUpTagEvents = '';
        $tags = (new Profile($config->profile, new LabelName(), true))->tags;
        $colors = [
            'LightGreen',
            'SkyBlue',
            'LightCoral',
            'LightSalmon',
            'Khaki',
            'Plum',
            'Wheat',
        ];
        $numberOfColors = count($colors);
        $i = 0;
        foreach ($tags as $tag => $ids) {
            $idArr = [];
            foreach ($ids as $id) {
                $idArr[] .= "'{$id}'";
            }

            $setUpTagEvents .= sprintf("setupTagEventListener('%s', [%s], '%s'); ", $tag, implode(', ', $idArr), $colors[$i++ % $numberOfColors]);
        }

        return $setUpTagEvents;
    }

    private function getElements(Config $config): IndexPageElements
    {
        $draw = new DrawDiagram();
        $profile = new Profile($config->profile, new LabelName(), true);
        $titleProfile = new Profile($config->profile, new LabelNameTitle(), true);
        $dotId = $draw($profile, new LabelName());
        $dotName = $draw($titleProfile, new LabelNameTitle());
        $mode = $config->outputMode;
        $alpsProfile = htmlspecialchars(
            (string) file_get_contents($profile->alpsFile),
            ENT_QUOTES,
            'UTF-8'
        );

        $semanticMd = PHP_EOL . (new DumpDocs())->getSemanticDescriptorMarkDown($profile);
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

        return new IndexPageElements(
            $profile,
            $dotId,
            $dotName,
            $mode,
            $alpsProfile,
            $semanticMd,
            $linkRelations,
            $ext,
            $tags,
            $htmlTitle,
            $htmlDoc,
            $setUpTagEvents
        );
    }
}
