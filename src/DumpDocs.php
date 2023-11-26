<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use stdClass;

use function assert;
use function explode;
use function filter_var;
use function implode;
use function is_string;
use function ksort;
use function property_exists;
use function sprintf;
use function strpos;
use function substr;
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

    /** @var "html"|"md" */
    private $ext = 'md';

    private function getSemanticDoc(AbstractDescriptor $descriptor): string
    {
        $descriptorSemantic = $this->getDescriptorInDescriptor($descriptor);
        $rt = $this->getRt($descriptor);
        $description = '';
        $description .= $this->getDescriptorProp('type', $descriptor);
        $description .= $this->getDescriptorProp('title', $descriptor);
        $description .= $this->getDescriptorProp('href', $descriptor);
        $description .= $this->getDescriptorKeyValue('doc', (string) ($descriptor->doc->value ?? ''));
        $description .= $this->getDescriptorProp('def', $descriptor);
        $description .= $this->getDescriptorProp('rel', $descriptor);
        $description .= $this->getTag($descriptor->tags);
        $linkRelations = $this->getLinkRelations($descriptor->linkRelations);

        return <<<EOT
### <a name="{$descriptor->id}">{$descriptor->id}</a>
{$description}{$rt}{$linkRelations}{$descriptorSemantic}

EOT;
    }

    private function getDescriptorProp(string $key, AbstractDescriptor $descriptor): string
    {
        if (! property_exists($descriptor, $key) || ! $descriptor->{$key}) {
            return '';
        }

        $value = (string) $descriptor->{$key};
        if ($this->isUrl($value)) {
            return " * {$key}: [{$value}]({$value})" . PHP_EOL;
        }

        if ($this->isFragment($value)) {
            [, $id] = explode('#', $value);

            return " * {$key}: [{$id}](semantic.{$id}.{$this->ext})" . PHP_EOL;
        }

        return " * {$key}: {$value}" . PHP_EOL;
    }

    private function isUrl(string $text): bool
    {
        return filter_var($text, FILTER_VALIDATE_URL) !== false;
    }

    private function isFragment(string $text): bool
    {
        return $text[0] === '#';
    }

    private function getDescriptorKeyValue(string $key, string $value): string
    {
        if (! $value) {
            return '';
        }

        return " * {$key}: {$value}" . PHP_EOL;
    }

    private function getRt(AbstractDescriptor $descriptor): string
    {
        if ($descriptor instanceof SemanticDescriptor) {
            return '';
        }

        assert($descriptor instanceof TransDescriptor);

        return sprintf(' * rt: [%s](#%s)', $descriptor->rt, $descriptor->rt) . PHP_EOL;
    }

    private function getDescriptorInDescriptor(AbstractDescriptor $descriptor): string
    {
        if ($descriptor->descriptor === []) {
            return '';
        }

        $descriptors = $this->getInlineDescriptors($descriptor->descriptor);

        $table = sprintf(' * descriptor%s%s| id | type | title |%s|---|---|---|%s', PHP_EOL, PHP_EOL, PHP_EOL, PHP_EOL);
        foreach ($descriptors as $descriptor) {
            $table .= sprintf('| %s | %s | %s |', $descriptor->htmlLink(), $descriptor->type, $descriptor->title) . PHP_EOL;
        }

        return $table;
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
                $descriptors[] = $this->descriptors[$descriptor->id];
                continue;
            }

            assert(is_string($descriptor->href));
            $id = substr($descriptor->href, (int) strpos($descriptor->href, '#') + 1);
            assert(isset($this->descriptors[$id]));

            $original = clone $this->descriptors[$id];
            $descriptors[] = $original;
        }

        usort($descriptors, static function (AbstractDescriptor $a, AbstractDescriptor $b): int {
            $order = ['semantic' => 0, 'safe' => 1, 'unsafe' => 2, 'idempotent' => 3];

            return $order[$a->type] <=> $order[$b->type];
        });

        assert($descriptors !== []);

        return $descriptors;
    }

    /** @param list<string> $tags */
    private function getTag(array $tags): string
    {
        if ($tags === []) {
            return '';
        }

        return " * tag: {$this->getTagString($tags)}";
    }

    /** @param list<string> $tags */
    private function getTagString(array $tags): string
    {
        $string = [];
        foreach ($tags as $tag) {
            $string[] = "[{$tag}](#tag-{$tag})";
        }

        return implode(', ', $string) . PHP_EOL;
    }

    public function getSemanticDescriptorMarkDown(Profile $profile, string $asdFile): string
    {
        unset($asdFile);
        $descriptors = $this->descriptors = $profile->descriptors;
        $markDown = '';
        ksort($descriptors, SORT_FLAG_CASE | SORT_STRING);
        foreach ($descriptors as $descriptor) {
            $markDown .= $this->getSemanticDoc($descriptor);
        }

        return $markDown;
    }

    private function getLinkRelations(LinkRelations $linkRelations): string
    {
        if ((string) $linkRelations === '') {
            return '';
        }

        return $linkRelations . PHP_EOL;
    }
}
