<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function array_keys;
use function dirname;
use function htmlspecialchars;
use function implode;
use function nl2br;
use function pathinfo;
use function sprintf;
use function strtoupper;
use function uasort;

use const PATHINFO_BASENAME;
use const PHP_EOL;

final class IndexPage
{
    /** @var string */
    public $content;

    /** @var string */
    public $file;

    public function __construct(Profile $profile, string $mode = DumpDocs::MODE_HTML)
    {
        $profilePath = pathinfo($profile->alpsFile, PATHINFO_BASENAME);
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
        $semantics = $this->semantics($descriptors, $ext);
        $tags = $this->tags($profile->tags, $ext);
        $htmlTitle = htmlspecialchars($profile->title ?: 'ALPS');
        $htmlDoc = nl2br(htmlspecialchars($profile->doc));
        $profileImage = $mode === DumpDocs::MODE_HTML ? 'docs/asd.html' : 'docs/asd.md';
        $md = <<<EOT
# {$htmlTitle}

{$htmlDoc}

 * [ALPS]({$profilePath})
 * [Application State Diagram]($profileImage)
 * [Semantic Descriptors](docs/descriptors.{$ext}){$tags}{$linkRelations}
EOT;
        $this->file = sprintf('%s/index.%s', dirname($profile->alpsFile), $ext);
        $this->content = $mode === DumpDocs::MODE_MARKDOWN ? $md : (new MdToHtml())($htmlTitle, $md);
    }

    /** @param array<string, AbstractDescriptor> $semantics */
    private function semantics(array $semantics, string $ext): string
    {
        $lines = [];
        foreach ($semantics as $semantic) {
            $href = sprintf('docs/descriptors.%s#%s', $ext, $semantic->id);
            $lines[] = sprintf('   * [%s](%s)', $semantic->id, $href);
        }

        return implode(PHP_EOL, $lines);
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

        return PHP_EOL . ' * Tags' . PHP_EOL . implode(PHP_EOL, $lines);
    }

    private function linkRelations(LinkRelations $linkRelations): string
    {
        if ((string) $linkRelations === '') {
            return '';
        }

        return PHP_EOL . ' * Links' . PHP_EOL . $linkRelations;
    }
}
