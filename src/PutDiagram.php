<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use RuntimeException;

use function count;
use function file_put_contents;
use function passthru;
use function sprintf;
use function str_replace;
use function unlink;

use const PHP_EOL;

final class PutDiagram
{
    /** @var DrawDiagram */
    private $draw;

    public function __construct()
    {
        $this->draw = new DrawDiagram();
    }

    public function __invoke(Config $config): void
    {
        $profile = new Profile($config->profile, new LabelName());
        $index = new IndexPage($config);
        if ($config->outputMode === DumpDocs::MODE_MARKDOWN) {
            $this->drawMarkdown($config, $profile);
        }

        file_put_contents($index->file, $index->content);
        echo "ASD generated. {$index->file}" . PHP_EOL;
        echo sprintf('Descriptors(%s), Links(%s)', count($profile->descriptors), count($profile->links)) . PHP_EOL;
    }

    public function drawMarkdown(Config $config, Profile $profile): void
    {
        $titleProfile = new Profile($config->profile, new LabelNameTitle());
        $this->draw('', new LabelName(), $profile);
        $this->draw('.title', new LabelNameTitle(), $titleProfile);
        $indexConfig = clone $config;
        $indexConfig->outputMode = DumpDocs::MODE_HTML;
        $htmlIndex = new IndexPage($indexConfig);
        file_put_contents($htmlIndex->file, $htmlIndex->content);
        echo "ASD generated. {$htmlIndex->file}" . PHP_EOL;
    }

    private function draw(string $fileId, LabelNameInterface $labelName, AbstractProfile $profile): void
    {
        $dot = ($this->draw)($profile, $labelName);
        $extention = $fileId . '.dot';
        $dotFile = str_replace(['.xml', '.json'], $extention, $profile->alpsFile);
        $this->convert($dotFile, $dot);
    }

    private function convert(string $dotFile, string $dot): void
    {
        file_put_contents($dotFile, $dot);
        try {
            $dotJsPath = PathResolver::getDotJsPath();
            $cmd = sprintf('node %s %s', $dotJsPath, $dotFile);
            passthru($cmd, $status);
            if ($status !== 0) {
                echo 'Warning: Graphviz error' . PHP_EOL; // @codeCoverageIgnore
            }
        } catch (RuntimeException $e) {
            echo 'Error: ' . $e->getMessage() . PHP_EOL; // @codeCoverageIgnore
        }

        @unlink($dotFile);
    }
}
