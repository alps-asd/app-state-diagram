<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use stdClass;

use function array_filter;
use function array_map;
use function assert;
use function explode;
use function filter_var;
use function htmlspecialchars;
use function implode;
use function is_array;
use function is_string;
use function ksort;
use function mb_strlen;
use function mb_substr;
use function preg_replace;
use function property_exists;
use function sprintf;
use function strlen;
use function strpos;
use function substr;
use function usort;

use const ENT_QUOTES;
use const FILTER_VALIDATE_URL;
use const PHP_EOL;
use const SORT_FLAG_CASE;
use const SORT_STRING;

/** @psalm-suppress MissingConstructor */
final class DumpDocs
{
    public const MODE_HTML = 'html';
    public const MODE_MARKDOWN = 'markdown';

    /** @var array<string, AbstractDescriptor> */
    private $descriptors = [];

    // getSemanticDoc は不要になるため削除

    /**
     * 長い文字列を切り詰めて返す
     */
    private function truncateText(string $text, int $maxLength = 100): string
    {
        if (mb_strlen($text) <= $maxLength) {
            return $text;
        }

        return mb_substr($text, 0, $maxLength - 3) . '...';
    }

    private function getDescriptorPropValue(string $key, AbstractDescriptor $descriptor): string
    {
        if (! property_exists($descriptor, $key) || ! $descriptor->{$key}) {
            return '';
        }

        $value = (string) $descriptor->{$key};
        if ($key === 'def' && $this->isUrl($value)) {
            // URLのプロトコル部分を削除してコンパクトに表示
            $displayValue = preg_replace('#^https?://#', '', $value);
            // 長いURLは省略表示する（30文字以上の場合）
            if (strlen($displayValue) > 30) {
                $displayValue = substr($displayValue, 0, 27) . '...';
            }

            return sprintf('%s: [%s](%s)', $key, $displayValue, $value);
        }

        if ($key === 'href' && $this->isFragment($value)) {
            [, $id] = explode('#', $value);

            return sprintf('%s: [%s](%s)', $key, $id, $this->getSemanticLink($id));
        }

        // 'rel' やその他の単純なプロパティ
        if ($key === 'rel') {
            return sprintf('%s: %s', $key, $value);
        }

        if ($key === 'rt') {
            return sprintf('%s: [%s](#%s)', $key, $value, $value);
        }

        // docプロパティの処理を追加（極端に短くしてカスタムツールチップ表示）
        if ($key === 'doc') {
            // 極端に短く（8文字程度に制限）
            $truncatedValue = $this->truncateText($value, 8);

            if (mb_strlen($value) > 8) {
                // カスタムツールチップを実装（プロパティ名をハードコード）
                return sprintf(
                    '<span class="doc-tooltip">doc: %s…<span class="tooltip-text">%s</span></span>',
                    htmlspecialchars($truncatedValue),
                    htmlspecialchars($value, ENT_QUOTES)
                );
            }

            return sprintf('doc: %s', htmlspecialchars($value));
        }

        if ($key === 'linkRelations') {
            return $descriptor->linkRelations->getLinksInExtras();
        }

        // title は別の列で表示するのでここでは返さない
        // type も別の列
        // href も基本的には使わない想定だが、念のため残す場合は上記のisFragmentで処理

        return ''; // Extras列に含めないものは空文字を返す
    }

    private function isUrl(string $text): bool
    {
        return filter_var($text, FILTER_VALIDATE_URL) !== false;
    }

    private function isFragment(string $text): bool
    {
        // Check if the string starts with '#' and has content after it.
        return isset($text[0]) && $text[0] === '#' && isset($text[1]);
    }

    // getDescriptorKeyValue は Extras の整形に含めるため直接は使わない

    private function getRt(AbstractDescriptor $descriptor): string
    {
        if ($descriptor instanceof SemanticDescriptor || ! $descriptor->rt) {
            return '';
        }

        // $descriptor instanceof TransDescriptor は上記でカバーされる

        return sprintf('[#%s](#%s)', $descriptor->rt, $descriptor->rt);
    }

    private function getContainedDescriptorsMarkdown(AbstractDescriptor $descriptor): string
    {
        if ($descriptor->descriptor === []) {
            return '';
        }

        assert(is_array($descriptor->descriptor));
        $descriptors = $this->getInlineDescriptors($descriptor->descriptor);
        $links = array_map(static function (AbstractDescriptor $desc): string {
            $displayText = $desc->id;
            $typeClass = $desc->type; // semantic, safe, unsafe, idempotentのいずれか

            // タイプインジケーターを追加
            $typeIndicator = sprintf(
                '<span class="type-indicator-small %s" title="%s"></span>',
                $typeClass,
                ucfirst($typeClass)
            );

            return sprintf('%s<a href="#%s">%s</a>', $typeIndicator, $desc->id, $displayText);
        }, $descriptors);

        return implode('<br>', $links);
    }
    /**
     * @param non-empty-list<stdClass> $inlineDescriptors
     *
     * @return non-empty-list<AbstractDescriptor>
     */
    private function getInlineDescriptors(array $inlineDescriptors): array
    {
        $descriptors = [];
        foreach ($inlineDescriptors as $descriptor) {
            if (isset($descriptor->id)) {
                assert(is_string($descriptor->id));
                // Add check if descriptor ID exists to prevent errors
                if (isset($this->descriptors[$descriptor->id])) {
                    $descriptors[] = $this->descriptors[$descriptor->id];
                }

                continue;
            }

            if (isset($descriptor->href)) {
                assert(is_string($descriptor->href));
                $fragmentPos = strpos($descriptor->href, '#');
                if ($fragmentPos !== false) {
                    $id = substr($descriptor->href, $fragmentPos + 1);
                    if (isset($this->descriptors[$id])) {
                        $original = clone $this->descriptors[$id];
                        $descriptors[] = $original;
                    }
                }
            }
            // If neither id nor href#id is present, skip this descriptor.
        }

        // Return empty array if no valid descriptors found
        if (empty($descriptors)) {
            return [];
        }

        usort($descriptors, static function (AbstractDescriptor $a, AbstractDescriptor $b): int {
            $order = ['semantic' => 0, 'safe' => 1, 'unsafe' => 2, 'idempotent' => 3];

            // Add checks for potentially undefined types
            $orderA = $order[$a->type] ?? 99;
            $orderB = $order[$b->type] ?? 99;

            return $orderA <=> $orderB;
        });

        // The assertion below might fail if $descriptors was initially empty and remained empty.
        // Ensure $descriptors is not empty before assertion or remove assertion if empty is valid.
        // assert($descriptors !== []); // This assertion might fail

        return $descriptors; // Can be empty if input was problematic
    }

    /** @param list<string> $tags */
    private function getTagString(array $tags): string
    {
        if ($tags === []) {
            return '';
        }

        $tagLinks = array_map(static function (string $tag): string {
            return sprintf('[%s](#tag-%s)', $tag, $tag);
        }, $tags);

        return 'tag: ' . implode(', ', $tagLinks); // 末尾の改行を削除し、"tag: " プレフィックスを追加
    }

    private function getExtrasMarkdown(AbstractDescriptor $descriptor): string
    {
        $extras = [];
        $extras[] = $this->getDescriptorPropValue('def', $descriptor);
        $extras[] = $this->getTagString($descriptor->tags);
        $extras[] = $this->getDescriptorPropValue('rel', $descriptor);
        $extras[] = $this->getDescriptorPropValue('rt', $descriptor);
        $extras[] = $this->getDescriptorPropValue('doc', $descriptor);
        $extras[] = $this->getDescriptorPropValue('linkRelations', $descriptor);
        // 必要に応じて他のプロパティも追加
        // $extras[] = $this->getDescriptorPropValue('href', $descriptor); // 必要であれば

        $filteredExtras = array_filter($extras); // 空の要素を削除

        return implode(', ', $filteredExtras);
    }

    private function buildMarkdownTableRow(AbstractDescriptor $descriptor): string
    {
        $id = sprintf('<a id="%s"></a>[%s](#%s)', $descriptor->id, $descriptor->id, $descriptor->id);
        $title = $descriptor->title ?? '';
        $legendType = sprintf('<span class="legend"><span class="legend-icon %s"></span></span>', $descriptor->type);
        $contained = $this->getContainedDescriptorsMarkdown($descriptor);
        $extras = $this->getExtrasMarkdown($descriptor);

        // HTMLの折り返しを防止するためにno-wrapクラスを追加
        return sprintf(
            '| %s | %s | <span style="white-space: normal;">%s</span> | %s | <span style="white-space: normal;">%s</span> |',
            $legendType,
            $id,
            $title,
            $contained,
            $extras
        );
    }

    public function getSemanticDescriptorMarkDown(Profile $profile): string // $asdFile 引数は不要なので削除
    {
        $this->descriptors = $profile->descriptors; // Initialize descriptors for internal use
        $descriptors = $profile->descriptors;
        ksort($descriptors, SORT_FLAG_CASE | SORT_STRING);

        // テーブルヘッダー
        $markdown = '## Semantic Descriptors' . PHP_EOL . PHP_EOL;
        // テーブル幅の調整（列順序も変更）
        $markdown .= '| Type | ID | Title | Contained | Extra Info |' . PHP_EOL;
        // 列のアラインメントを調整（ハイフンの数は視覚的な目安のみ）
        $markdown .= '| :--: | :-- | :---- | :-- | :-- |' . PHP_EOL;

        // テーブルボディ
        foreach ($descriptors as $descriptor) {
            $markdown .= $this->buildMarkdownTableRow($descriptor) . PHP_EOL;
        }

        return $markdown;
    }

    // getSemanticDescriptorList はそのまま残す（HTML用で使用されている可能性があるため）
    public function getSemanticDescriptorList(Profile $profile): string
    {
        $descriptors = $profile->descriptors;
        ksort($descriptors, SORT_FLAG_CASE | SORT_STRING);
        $items = [];
        foreach ($descriptors as $descriptor) {
            $items[] = sprintf(' * <span class="indicator %s" data-tooltip="%s"> </span> [%s](#%s)', $descriptor->type, $descriptor->type, $descriptor->id, $descriptor->id);
        }

        return implode(PHP_EOL, $items);
    }

    // getLinkRelations は Extras の整形に含めるため直接は使わない
    // private function getLinkRelations(LinkRelations $linkRelations): string ...

    // Helper for semantic links if needed elsewhere, or incorporate into getDescriptorPropValue
    private function getSemanticLink(string $id): string
    {
        // Assuming markdown output, adjust extension if needed based on mode
        // $ext = ($this->mode === self::MODE_HTML) ? 'html' : 'md';
        // return sprintf('semantic.%s.%s', $id, $ext);
        return sprintf('#%s', $id); // Changed to link within the same markdown page
    }
}
