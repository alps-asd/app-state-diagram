<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use stdClass;

use function assert;
use function dirname;
use function file_put_contents;
use function is_dir;
use function json_encode;
use function ksort;
use function mkdir;
use function preg_replace;
use function sprintf;

use const JSON_PRETTY_PRINT;
use const JSON_UNESCAPED_SLASHES;
use const PHP_EOL;

final class Dumper
{
    /** @var DescriptorScanner */
    private $scanner;

    public function __construct()
    {
        $this->scanner = new DescriptorScanner();
    }

    /**
     * @param array<string, AbstractDescriptor> $descriptors
     */
    public function __invoke(array $descriptors, string $alpsFile, string $schema): void
    {
        ksort($descriptors);
        $descriptorDir = $this->mkDir(dirname($alpsFile), 'descriptor');
        $docsDir = $this->mkDir(dirname($alpsFile), 'docs');
        foreach ($descriptors as $descriptor) {
            $this->dumpSemantic($descriptor, $descriptorDir, $schema);
            $markDown = $descriptor->type === 'semantic' ? $this->getSemanticDoc($descriptor, $docsDir, $schema) : $this->getSemanticDoc($descriptor, $docsDir, $schema);
            $path = sprintf('%s/%s.%s.md', $docsDir, $descriptor->type, $descriptor->id);
            file_put_contents($path, $markDown);
        }
    }

    private function dumpSemantic(AbstractDescriptor $descriptor, string $dir, string $schema)
    {
        $type = $descriptor->type ?? 'semantic';
        $normarlizedDescriptor = $descriptor->normalize($schema);
        $this->save($dir, $type, $descriptor->id, $normarlizedDescriptor);
    }

    private function save(string $dir, string $type, string $id, stdClass $class): void
    {
        $file = sprintf('%s/%s.%s.json', $dir, $type, $id);
        $jsonTabSpace4 = json_encode($class, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
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
        return preg_replace('/^(  +?)\\1(?=[^ ])/m', '$1', $json);
    }

    private function getSemanticDoc(AbstractDescriptor $descriptor, string $dir, string $schema): string
    {
        $doc = $descriptor->doc->value ?? '';
        $descriptorSemantic = $this->getDescriptorInDescriptor($descriptor);
        $rt = $this->getRt($descriptor);

        return <<<EOT
## {$descriptor->id}

Type: {$descriptor->type}

doc: {$doc}

ref: {$descriptor->def}
{$rt}

{$descriptorSemantic}

---

source: [{$descriptor->type}.{$descriptor->id}.json](../descriptor/{$descriptor->type}.{$descriptor->id}.json)
EOT;
    }

    private function getDescriptorInDescriptor(AbstractDescriptor $descriptor): string
    {
        if ($descriptor->descriptor === []) {
            return '';
        }

        $descriptors = ($this->scanner)($descriptor->descriptor);
        if ($descriptors === []) {
            return '';
        }

        $table = '## Descriptor' . PHP_EOL . '| id | type |' . PHP_EOL . '|---|---|' . PHP_EOL;
        foreach ($descriptors as $descriptor) {
            $id = sprintf('[%s](%s.%s.md)', $descriptor->id, $descriptor->type, $descriptor->id);
            $table .= sprintf('%s | %s', $id, $descriptor->type) . PHP_EOL;
        }

        return $table;
    }

    private function getRt(AbstractDescriptor $descriptor): string
    {
        if ($descriptor instanceof SemanticDescriptor) {
            return '';
        }

        assert($descriptor instanceof TransDescriptor);

        return <<<EOT

rt: [$descriptor->rt](semantic.{$descriptor->rt}.md)      
EOT;
    }
}
