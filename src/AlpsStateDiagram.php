<?php

declare(strict_types=1);

namespace Koriym\AlpsStateDiagram;

use Koriym\AlpsStateDiagram\Exception\AlpsFileNotReadable;
use Koriym\AlpsStateDiagram\Exception\InvaliDirPath;

final class AlpsStateDiagram
{
    /**
     * @var array
     */
    private $links = [];

    public function setDir(string $dir) : void
    {
        if (! is_dir($dir)) {
            throw new InvaliDirPath($dir);
        }
        $iterator = $this->getIterator($dir);
        foreach ($iterator as $file) {
            /** @var \SplFileInfo $file */
            $path = $file->getPathname();
            $this->setFile($path);
        }
    }

    public function setFile(string $alps) : void
    {
        if (! file_exists($alps)) {
            throw new AlpsFileNotReadable($alps);
        }
        $alps = json_decode((string) file_get_contents($alps));
        foreach ($alps->alps->descriptor as $descriptor) {
            if (isset($descriptor->descriptor)) {
                $this->scanTransition(new SemanticDescriptor($descriptor), $descriptor->descriptor);
            }
        }
    }

    public function toString() : string
    {
        $graphs = '';
        foreach ($this->links as $link => $label) {
            $graphs .= sprintf('    %s [label = "%s"];', $link, $label) . PHP_EOL;
        }

        return sprintf('digraph application_state_diagram {
    node [shape = box, style = "bold,filled"];
%s
}
', $graphs);
    }

    private function scanTransition(SemanticDescriptor $semantic, array $descriptors) : void
    {
        foreach ($descriptors as $descriptor) {
            $isTransDescriptor = isset($descriptor->type) && in_array($descriptor->type, ['safe', 'unsafe', 'idempotent'], true);
            if ($isTransDescriptor) {
                $this->addLink(new Link($semantic, new TransDescriptor($descriptor, $semantic)));
            }
        }
    }

    private function addLink(Link $link) : void
    {
        $fromTo = sprintf('%s->%s', $link->from, $link->to);
        $this->links[$fromTo] = isset($this->links[$fromTo]) ? $this->links[$fromTo] . ', ' . $link->label : $link->label;
    }

    private function getIterator($dir) : \RegexIterator
    {
        return new \RegexIterator(
            new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator(
                    $dir,
                    \FilesystemIterator::CURRENT_AS_FILEINFO | \FilesystemIterator::KEY_AS_PATHNAME | \FilesystemIterator::SKIP_DOTS
                ),
                \RecursiveIteratorIterator::LEAVES_ONLY
            ),
            '/^.+\.json/',
            \RecursiveRegexIterator::MATCH
        );
    }
}
