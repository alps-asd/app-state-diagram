<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use stdClass;

use function array_filter;
use function array_map;
use function assert;
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
use function strpos;
use function substr;
use function ucfirst;
use function usort;

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

    private function getDescriptorPropValue(string $key, AbstractDescriptor $descriptor): string
    {
        if (! property_exists($descriptor, $key) || ! $descriptor->{$key}) {
            return '';
        }

        $value = (string) $descriptor->{$key};

        switch ($key) {
            case 'def':
                if ($this->isUrl($value)) {
                    return $this->createMetaItem('def', $value, 'def-tag', $value);
                }

                return $this->createMetaItem('def', $value, 'def-tag');

            case 'rel':
                return $this->createMetaItem('rel', $value, 'rel-tag');

            case 'rt':
                return $this->createMetaItem('rt', $value, 'rt-tag', "#$value");

            case 'doc':
                $maxLength = 140;
                if (mb_strlen($value) > $maxLength) {
                    return $this->createMetaItem('doc', $value, 'doc-tag clickable', '', $value); // 表示も data-full も full text
                }

                return $this->createMetaItem('doc', $value, 'doc-tag');

            case 'linkRelations':
                $links = $descriptor->linkRelations->getLinksInExtras();
                if ($links) {
                    return $this->createMetaItem('link', $links, 'link-tag');
                }

                return '';

            default:
                return $this->createMetaItem($key, $value);
        }
    }

    private function createMetaItem(string $label, string $value, string $cssClass = '', string $url = '', string $title = ''): string
    {
        $valueHtml = htmlspecialchars($value);
        $attrs = [];

        if ($url !== '') {
            $displayValue = $value;
            $targetBlank = '';

            if ($this->isUrl($url)) {
                $displayValue = (string) preg_replace('#^https?://#', '', $displayValue);
                $targetBlank = ' target="_blank"';
            }

            if (mb_strlen($displayValue) > 30) {
                $displayValue = mb_substr($displayValue, 0, 27) . '...';
            }

            $valueHtml = sprintf('<a href="%s"%s>%s</a>', $url, $targetBlank, htmlspecialchars($displayValue));
        }

        if (mb_strlen($value) > 140) {
            $attrs[] = sprintf('data-full="%s"', htmlspecialchars($value));
        }

        if ($title !== '') {
            $attrs[] = sprintf('title="%s"', htmlspecialchars($title));
        }

        $attrString = $attrs ? ' ' . implode(' ', $attrs) : '';

        return sprintf(
            '<span class="meta-item"><span class="meta-label">%s:</span><span class="meta-tag %s"%s>%s</span></span>',
            $label,
            $cssClass,
            $attrString,
            $valueHtml
        );
    }

    private function isUrl(string $text): bool
    {
        return filter_var($text, FILTER_VALIDATE_URL) !== false;
    }

    private function getContainedDescriptorsMarkdown(AbstractDescriptor $descriptor): string
    {
        if ($descriptor->descriptor === []) {
            return '';
        }

        assert(is_array($descriptor->descriptor));
        $inlineDescriptors = $this->getInlineDescriptors($descriptor->descriptor);

        // If no valid inline descriptors are found, return empty string
        if (empty($inlineDescriptors)) {
            return '';
        }

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
        }, $inlineDescriptors); // Corrected variable name here

        return implode('<br>', $links);
    }

    /**
     * @param non-empty-list<stdClass> $inlineDescriptors
     *
     * @return AbstractDescriptor[]
     * @psalm-return list<AbstractDescriptor>
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
            return sprintf(
                '<span class="meta-tag tag-tag"><a href="#tag-%s">%s</a></span>',
                $tag,
                $tag
            );
        }, $tags);

        return sprintf(
            '<span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values">%s</span></span>',
            implode(' ', $tagLinks)
        );
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

        // 空の要素を削除
        $filteredExtras = array_filter($extras);

        if (empty($filteredExtras)) {
            return '';
        }

        return '<span class="meta-container">' . implode('', $filteredExtras) . '</span>';
    }

    private function buildMarkdownTableRow(AbstractDescriptor $descriptor): string
    {
        $id = sprintf('<a id="%s"></a>[%s](#%s)', $descriptor->id, $descriptor->id, $descriptor->id);
        $title = $descriptor->title;
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

    public function getSemanticDescriptorMarkDown(Profile $profile): string
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
}
