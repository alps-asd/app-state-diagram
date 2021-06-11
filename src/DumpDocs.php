<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use stdClass;

use function assert;
use function basename;
use function dirname;
use function file_put_contents;
use function filter_var;
use function implode;
use function is_dir;
use function is_string;
use function json_encode;
use function mkdir;
use function preg_replace;
use function property_exists;
use function sprintf;
use function str_replace;
use function strpos;
use function substr;
use function usort;

use const FILTER_VALIDATE_URL;
use const JSON_PRETTY_PRINT;
use const JSON_UNESCAPED_SLASHES;
use const PHP_EOL;

final class DumpDocs
{
    /** @var array<string, AbstractDescriptor> */
    private $descriptors = [];

    public function __invoke(Profile $profile, string $alpsFile): void
    {
        $descriptors = $this->descriptors = $profile->descriptors;
        $descriptorDir = $this->mkDir(dirname($alpsFile), 'descriptor');
        $docsDir = $this->mkDir(dirname($alpsFile), 'docs');
        $asdFile = sprintf('../%s', basename(str_replace(['xml', 'json'], 'svg', $alpsFile)));
        foreach ($descriptors as $descriptor) {
            $markDown = $this->getSemanticDoc($descriptor, $asdFile, $profile->title);
            $path = sprintf('%s/%s.%s.html', $docsDir, $descriptor->type, $descriptor->id);
            $html = $this->convertHtml("{$descriptor->id} ({$descriptor->type})", $markDown) . PHP_EOL;
            file_put_contents($path, $html);
        }

        foreach ($profile->tags as $tag => $descriptorIds) {
            $markDown = $this->getTagDoc($tag, $descriptorIds, $profile->title, $asdFile);
            $path = sprintf('%s/tag.%s.html', $docsDir, $tag);
            $html = $this->convertHtml($tag, $markDown);
            file_put_contents($path, $html);
        }

        $imgSrc = str_replace(['json', 'xml'], 'svg', basename($alpsFile));
        $this->dumpImageHtml($profile->title, $docsDir, $imgSrc);
    }

    private function dumpImageHtml(string $title, string $docsDir, string $imgSrc): void
    {
        $html = <<<EOT
<html lang="en">
<head>
    <title>{$title}</title>
    <meta charset="UTF-8">
</head>
<body>
    <iframe src="../{$imgSrc}" style="border:0; width:100%; height:95%" allow="fullscreen"></iframe>
</body>
</html>

EOT;
        file_put_contents($docsDir . '/asd.html', $html);
    }

    private function convertHtml(string $title, string $markdown): string
    {
        return (new MdToHtml())($title, $markdown);
    }

    private function save(string $dir, string $type, string $id, stdClass $class): void
    {
        $file = sprintf('%s/%s.%s.json', $dir, $type, $id);
        $jsonTabSpace4 = (string) json_encode($class, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        $json =  $this->convertTabSpaceTwo($jsonTabSpace4) . PHP_EOL;
        file_put_contents($file, $json);
    }

    private function mkDir(string $baseDir, string $dirName): string
    {
        $dir = sprintf('%s/%s', $baseDir, $dirName);
        if (! is_dir($dir)) {
            mkdir($dir, 0777, true); // @codeCoverageIgnore
        }

        return $dir;
    }

    private function convertTabSpaceTwo(string $json): string
    {
        return (string) preg_replace('/^(  +?)\\1(?=[^ ])/m', '$1', $json);
    }

    private function getSemanticDoc(AbstractDescriptor $descriptor, string $asd, string $title): string
    {
        $descriptorSemantic = $this->getDescriptorInDescriptor($descriptor);
        $rt = $this->getRt($descriptor);
        $description = '';
        $description .= $this->getDescriptorProp('type', $descriptor);
        $description .= $this->getDescriptorProp('title', $descriptor);
        /** @psalm-suppress all */
        $description .= $this->getDescriptorKeyValue('doc', $descriptor->doc->value ?? '');
        $description .= $this->getDescriptorProp('ref', $descriptor);
        $description .= $this->getDescriptorProp('def', $descriptor);
        $description .= $this->getDescriptorProp('ref', $descriptor);
        $description .= $this->getDescriptorProp('src', $descriptor);
        $description .= $this->getDescriptorProp('rel', $descriptor);
        $description .= $this->getTag($descriptor->tags);
        $linkRelations = $this->getLinkRelations($descriptor->linkRelations);
        $titleHeader = $title ? sprintf('%s: Semantic Descriptor', $title) : 'Semantic Descriptor';

        return <<<EOT
{$titleHeader}
# {$descriptor->id}
{$description}{$rt}{$linkRelations}{$descriptorSemantic}
---

[home](../index.html) | [asd]($asd)
EOT;
    }

    private function getDescriptorProp(string $key, AbstractDescriptor $descriptor): string
    {
        if (! property_exists($descriptor, $key) || ! $descriptor->{$key}) {
            return '';
        }

        if ($this->isUrl((string) $descriptor->{$key})) {
            return " * {$key}: [{$descriptor->$key}]({$descriptor->$key})" . PHP_EOL;
        }

        return " * {$key}: {$descriptor->$key}" . PHP_EOL;
    }

    private function isUrl(string $text): bool
    {
        return filter_var($text, FILTER_VALIDATE_URL) !== false;
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

        return sprintf(' * rt: [%s](semantic.%s.html)', $descriptor->rt, $descriptor->rt) . PHP_EOL;
    }

    private function getDescriptorInDescriptor(AbstractDescriptor $descriptor): string
    {
        if ($descriptor->descriptor === []) {
            return '';
        }

        $descriptors = $this->getInlineDescriptors($descriptor->descriptor);
        if ($descriptors === []) {
            return '';
        }

        $table = ' * descriptor' . PHP_EOL . '| id | type | title |' . PHP_EOL . '|---|---|---|' . PHP_EOL;
        foreach ($descriptors as $descriptor) {
            $table .= sprintf('| %s | %s | %s |', $descriptor->htmlLink(), $descriptor->type, $descriptor->title) . PHP_EOL;
        }

        return $table;
    }

    /**
     * @param list<stdClass> $inlineDescriptors
     *
     * @return list<AbstractDescriptor>
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
            if (isset($descriptor->title)) {
                $original->title = (string) $descriptor->title;
            }

            $descriptors[] = $original;
        }

        usort($descriptors, static function (AbstractDescriptor $a, AbstractDescriptor $b): int {
            $order = ['semantic' => 0, 'safe' => 1, 'unsafe' => 2, 'idempotent' => 3];

            return $order[$a->type] <=> $order[$b->type];
        });

        return $descriptors;
    }

    /**
     * @param list<string> $tags
     */
    private function getTag(array $tags): string
    {
        if ($tags === []) {
            return '';
        }

        return " * tag: {$this->getTagString($tags)}";
    }

    /**
     * @param list<string> $tags
     */
    private function getTagString(array $tags): string
    {
        $string = [];
        foreach ($tags as $tag) {
            $string[] = "[{$tag}](tag.{$tag}.html)";
        }

        return implode(', ', $string) . PHP_EOL;
    }

    /**
     * @param list<string> $descriptorIds
     */
    private function getTagDoc(string $tag, array $descriptorIds, string $title, string $asd): string
    {
        $list = '';
        foreach ($descriptorIds as $descriptorId) {
            $descriptor = $this->descriptors[$descriptorId];
            $list .= " * {$descriptor->htmlLink()}" . PHP_EOL;
        }

        $titleHeader = $title ? sprintf('%s: Tag', $title) : 'Tag';

        return <<<EOT
{$titleHeader}
# {$tag}
{$list}
---

[home](../index.html) | [asd]({$asd}) | {$tag} 
EOT;
    }

    private function getLinkRelations(LinkRelations $linkRelations): string
    {
        if ((string) $linkRelations === '') {
            return '';
        }

        return ' * links' . PHP_EOL . $linkRelations;
    }
}
