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
        $tags = $this->tags($profile->tags, $ext);
        $htmlTitle = htmlspecialchars($profile->title ?: 'ALPS');
        $htmlDoc = nl2br(htmlspecialchars($profile->doc));
        $md = <<<EOT
# {$htmlTitle}

{$htmlDoc}

<!-- Container for the ASD -->
<div id="graphId" style="text-align: center; "></div>
<div id="graphName" style="text-align: center; display: none;"></div>
<script>
    function renderGraph(graphId, dotString) {
        var graphviz = d3.select(graphId).graphviz();
        graphviz.renderDot(dotString).on('end', function() {
            applySmoothScrollToLinks(document.querySelectorAll('svg a[*|href^="#"]'));
        });
    }

    renderGraph("#graphId", '{{ dotId }}');
    renderGraph("#graphName", '{{ dotName }}');
</script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    const showIdElement = document.getElementById('show_id');
    const showNameElement = document.getElementById('show_name');
    const graphIdElement = document.getElementById('graphId');
    const graphNameElement = document.getElementById('graphName');

    showIdElement.addEventListener('click', function() {
        graphIdElement.style.display = 'block';
        graphNameElement.style.display = 'none';
        showIdElement.classList.add('active');
        showNameElement.classList.remove('active');
    });

    showNameElement.addEventListener('click', function() {
        graphNameElement.style.display = 'block';
        graphIdElement.style.display = 'none';
        showNameElement.classList.add('active');
        showIdElement.classList.remove('active');
    });
});
</script>

<div id="selector">
    <button id="show_id" class="active">ID</button>
    <button id="show_name">Name</button>
</div>

<style>
#selector {
    display: flex;
    justify-content: center;
    gap: 20px;
}

#selector button {
    padding: 10px 20px;
    border: 2px solid #ddd;
    background-color: white;
    font-family: 'Roboto', sans-serif;
    cursor: pointer;
    transition: all 0.3s ease;
}

#selector button:hover {
    background-color: #f0f0f0;
    border-color: #bbb;
}

#selector button.active {
    background-color: lightblue;
    border-color: #888;
}
</style>
---

## Semantic Descriptors

 {$semanticMd}

---

## Links

{$linkRelations}

---

## Tags

{$tags}

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
        $easeHtml = str_replace(
            '</head>',
            file_get_contents(__DIR__ . '/js/ease.js')
            . '</head>',
            $html
        );
        $this->content = str_replace(['{{ dotId }}', '{{ dotName }}'], [$escapedDotId, $escapedDotName], $easeHtml);
    }

    /** @param array<string, list<string>> $tags */
    private function tags(array $tags, string $ext): string
    {
        if ($tags === []) {
            return '';
        }

        $lines = [];
        $tagKeys = array_keys($tags);
        foreach ($tagKeys as $tag) {
            $href = "docs/tag.{$tag}.{$ext}";
            $lines[] = "   * [{$tag}]({$href})";
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
}
