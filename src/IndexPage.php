<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

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
    public $index;

    public function __construct(Profile $profile)
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
        $semantics = $this->semantics($descriptors);
        $tags = $this->tags($profile->tags);
        $htmlTitle = htmlspecialchars($profile->title);
        $htmlDoc = nl2br(htmlspecialchars($profile->doc));
        $md = <<<EOT
# {$htmlTitle}

{$htmlDoc}

 * [ALPS]({$profilePath})
 * [Application State Diagram](docs/asd.html)
 * Semantic Descriptors
{$semantics}{$tags}{$linkRelations}
EOT;
        $this->index = (new MdToHtml())('ALPS', $md);
    }

    /**
     * @param array<string, AbstractDescriptor> $semantics
     */
    private function semantics(array $semantics): string
    {
        $lines = [];
        foreach ($semantics as $semantic) {
            $href = sprintf('docs/%s.%s.html', $semantic->type, $semantic->id);
            $title = $semantic->title ? sprintf(', %s', $semantic->title) : '';
            $lines[] = sprintf('   * [%s](%s) (%s)%s', $semantic->id, $href, $semantic->type, $title);
        }

        return implode(PHP_EOL, $lines);
    }

    /**
     * @param array<string, list<string>> $tags
     */
    private function tags(array $tags): string
    {
        if ($tags === []) {
            return '';
        }

        $lines = [];
        foreach ($tags as $tag => $item) {
            $href = "docs/tag.{$tag}.html";
            $lines[] = "   * [{$tag}]({$href})";
        }

        return PHP_EOL . ' * Tags' . PHP_EOL . implode(PHP_EOL, $lines);
    }

    private function linkRelations(?LinkRelations $linkRelations): string
    {
        if ($linkRelations === null) {
            return '';
        }

        if ((string) $linkRelations === '') {
            return '';
        }

        return PHP_EOL . ' * Links' . PHP_EOL . $linkRelations;
    }
}
