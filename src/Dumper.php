<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Michelf\MarkdownExtra;
use stdClass;

use function assert;
use function dirname;
use function file_put_contents;
use function filter_var;
use function is_dir;
use function json_encode;
use function ksort;
use function mkdir;
use function parse_url;
use function preg_replace;
use function property_exists;
use function sprintf;
use function strpos;
use function substr;
use function usort;

use const FILTER_VALIDATE_URL;
use const JSON_PRETTY_PRINT;
use const JSON_UNESCAPED_SLASHES;
use const PHP_EOL;

final class Dumper
{
    /** @var array<string, AbstractDescriptor> */
    private $descriptors = [];

    /**
     * @param array<string, AbstractDescriptor> $descriptors
     */
    public function __invoke(array $descriptors, string $alpsFile, string $schema): void
    {
        ksort($descriptors);
        $this->descriptors = $descriptors;
        $descriptorDir = $this->mkDir(dirname($alpsFile), 'descriptor');
        $docsDir = $this->mkDir(dirname($alpsFile), 'docs');
        foreach ($descriptors as $descriptor) {
            $this->dumpSemantic($descriptor, $descriptorDir, $schema);
            $markDown = $descriptor->type === 'semantic' ? $this->getSemanticDoc($descriptor, $docsDir, $schema) : $this->getSemanticDoc($descriptor, $docsDir, $schema);
            $path = sprintf('%s/%s.%s.html', $docsDir, $descriptor->type, $descriptor->id);
            $html = $this->convertHtml($descriptor, $markDown);
            file_put_contents($path, $html);
        }
    }

    private function convertHtml(AbstractDescriptor $descriptor, string $markdown): string
    {
        $htmlDiv = MarkdownExtra::defaultTransform($markdown);

        return /** @lang HTML */<<<EOT
<html lang="en">
<head>
    <title>{$descriptor->id} ($descriptor->type)</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/3.0.1/github-markdown.min.css">
    <style>
        .markdown-body {
            box-sizing: border-box;
            min-width: 200px;
            max-width: 980px;
            margin: 0 auto;
            padding: 25px;
        }
    
        @media (max-width: 767px) {
            .markdown-body {
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="markdown-body">
        {$htmlDiv}
    </div>
</body>
</html>
EOT;
    }

    private function dumpSemantic(AbstractDescriptor $descriptor, string $dir, string $schema): void
    {
        $normarlizedDescriptor = $descriptor->normalize($schema);
        $this->save($dir, $descriptor->type, $descriptor->id, $normarlizedDescriptor);
    }

    private function save(string $dir, string $type, string $id, stdClass $class): void
    {
        $file = sprintf('%s/%s.%s.json', $dir, $type, $id);
        $jsonTabSpace4 = (string) json_encode($class, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        $json =  $this->convertTabSpaceTwo($jsonTabSpace4);
        file_put_contents($file, $json);
    }

    private function mkDir(string $baseDir, string $dirName): string
    {
        $dir = sprintf('%s/%s', $baseDir, $dirName);
        if (! is_dir($dir)) {
            mkdir($dir, 0777, true);
        }

        return $dir;
    }

    private function convertTabSpaceTwo(string $json): string
    {
        return (string) preg_replace('/^(  +?)\\1(?=[^ ])/m', '$1', $json);
    }

    private function getSemanticDoc(AbstractDescriptor $descriptor, string $dir, string $schema): string
    {
        $descriptorSemantic = $this->getDescriptorInDescriptor($descriptor);
        $rt = $this->getRt($descriptor);
        $description = '';
        $description .= $this->getDescriptorProp('type', $descriptor);
        $description .= $this->getDescriptorKeyValue('doc', $descriptor->doc->value ?? '');
        $description .= $this->getDescriptorProp('ref', $descriptor);
        $description .= $this->getDescriptorProp('def', $descriptor);
        $description .= $this->getDescriptorProp('ref', $descriptor);
        $description .= $this->getDescriptorProp('src', $descriptor);
        $description .= $this->getDescriptorProp('rel', $descriptor);

        return <<<EOT
# {$descriptor->id}
{$description}{$rt}
{$descriptorSemantic}
---

source: {$descriptor->jsonLink()}
EOT;
    }

    private function getDescriptorProp(string $key, AbstractDescriptor $descriptor): string
    {
        if (! property_exists($descriptor, $key) || ! $descriptor->{$key}) {
            return '';
        }

        $parsed = parse_url($descriptor->{$key});
        if ($this->isUrl($descriptor->{$key})) {
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

        return sprintf(' * rt: [%s](semantic.%s.html)', $descriptor->rt, $descriptor->rt);
    }

    private function getDescriptorInDescriptor(AbstractDescriptor $descriptor): string
    {
        if ($descriptor->descriptor === []) {
            return '';
        }

        $descriptors = $this->getInlineDescritors($descriptor->descriptor);
        if ($descriptors === []) {
            return '';
        }

        $table = ' * descriptor' . PHP_EOL . '| id | type |' . PHP_EOL . '|---|---|' . PHP_EOL;
        foreach ($descriptors as $descriptor) {
            $table .= sprintf('| %s | %s |', $descriptor->htmlLink(), $descriptor->type) . PHP_EOL;
        }

        return $table;
    }

    /**
     * @param list<stdClass> $inlineDescriptors
     *
     * @return list<AbstractDescriptor>
     */
    private function getInlineDescritors(array $inlineDescriptors): array
    {
        $descriptors = [];
        foreach ($inlineDescriptors as $descriptor) {
            if (isset($descriptor->id)) {
                $descriptors[] = $this->descriptors[$descriptor->id];
                continue;
            }

            $id = substr($descriptor->href, (int) strpos($descriptor->href, '#') + 1);
            $descriptors[] = $this->descriptors[$id];
        }

        usort($descriptors, static function (AbstractDescriptor $a, AbstractDescriptor $b): int {
            $order = ['semantic' => 0, 'safe' => 1, 'unsafe' => 2, 'idempotent' => 3];

            return $order[$a->type] <=> $order[$b->type];
        });

        return $descriptors;
    }
}
