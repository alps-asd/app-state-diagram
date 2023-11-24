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

    public function __construct(Profile $profile, string $dot, string $mode = DumpDocs::MODE_HTML)
    {
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
<div id="graph" style="text-align: center;"></div>
<script>
    var graphviz = d3.select("#graph").graphviz();
    var dotString = '{{ dot }}';
    graphviz.renderDot(dotString).on('end', function() {
      applySmoothScrollToLinks(document.querySelectorAll('svg a[*|href^="#"]'));
    });
</script>

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
        $escapedDot = str_replace("\n", '', $dot);
        $easeHtml = str_replace(
            '</head>',
            file_get_contents(__DIR__ . '/js/ease.js')
            . '</head>',
            $html
        );
        $this->content = str_replace('{{ dot }}', $escapedDot, $easeHtml);
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
