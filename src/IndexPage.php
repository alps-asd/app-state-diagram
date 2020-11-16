<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function htmlspecialchars;
use function implode;
use function nl2br;
use function sprintf;
use function str_replace;
use function strtoupper;
use function usort;

use const PHP_EOL;

final class IndexPage
{
    /** @var string */
    public $index;

    /**
     * @param AbstractDescriptor[] $descriptors
     */
    public function __construct(array $descriptors, string $alpsFile, AlpsProfile $profile)
    {
        usort($descriptors, static function (AbstractDescriptor $a, AbstractDescriptor $b): int {
            $comparaId = strtoupper($a->id) <=> strtoupper($b->id);
            if ($comparaId !== 0) {
                return $comparaId;
            }

            $order = ['semantic' => 0, 'safe' => 1, 'unsafe' => 2, 'idempotent' => 3];

            return $order[$a->type] <=> $order[$b->type];
        });
        $semantics = $this->semantics($descriptors);
        $svgFile = str_replace(['json', 'xml'], 'svg', $alpsFile);
        $htmlTitle = htmlspecialchars($profile->title);
        $htmlDoc = nl2br(htmlspecialchars($profile->doc));
        $md = <<<EOT
# {$htmlTitle}

{$htmlDoc}

 * [ALPS]({$alpsFile})
 * [Application State Diagram]({$svgFile})
 * Semantic Descriptors
{$semantics}
EOT;
        $this->index = (new MdToHtml())('ALPS', $md);
    }

    /**
     * @param list<AbstractDescriptor> $semantics
     */
    private function semantics(array $semantics): string
    {
        $lines = [];
        foreach ($semantics as $semantic) {
            $href = sprintf('docs/%s.%s.html', $semantic->type, $semantic->id);
            $lines[] = sprintf('   * [%s](%s) (%s)', $semantic->id, $href, $semantic->type) . PHP_EOL;
        }

        return implode($lines);
    }
}
