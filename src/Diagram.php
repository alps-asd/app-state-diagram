<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function file_put_contents;
use function passthru;
use function sprintf;
use function str_replace;
use function unlink;

use const PHP_EOL;

/** @codeCoverageIgnore  */
final class Diagram
{
    /** @var DrawDiagram */
    private $draw;

    public function __construct()
    {
        $this->draw = new DrawDiagram();
    }

    public function __invoke(Config $config): IndexPage
    {
        $profile = new Profile($config->profile, new LabelName());
        $index = new IndexPage($config);
        if ($config->outputMode === DumpDocs::MODE_MARKDOWN) {
            return $this->drawMarkdown($config, $profile);
        }

        if ($config->outputMode === DumpDocs::MODE_SVG) {
            (new PutDiagram())->drawSvgOnly($config, $profile);

            // Return IndexPage for API consistency (not used for SVG-only output)
            return $index;
        }

        return $index;
    }

    public function drawMarkdown(Config $config, Profile $profile): IndexPage
    {
        $titleProfile = new Profile($config->profile, new LabelNameTitle());
        $this->draw('', new LabelName(), $profile);
        $this->draw('.title', new LabelNameTitle(), $titleProfile);
        $indexConfig = clone $config;
        $indexConfig->outputMode = DumpDocs::MODE_MARKDOWN;

        return new IndexPage($indexConfig);
    }


    private function draw(string $fileId, LabelNameInterface $labelName, AbstractProfile $profile): void
    {
        $dot = ($this->draw)($profile, $labelName);
        $extention = $fileId . '.dot';
        $dotFile = str_replace(DumpDocs::ALPS_FILE_EXTENSIONS, $extention, $profile->alpsFile);
        $this->convert($dotFile, $dot);
    }

    private function convert(string $dotFile, string $dot): void
    {
        file_put_contents($dotFile, $dot);
        $dotJsPath = PathResolver::getDotJsPath();
        $cmd = sprintf('node %s %s', $dotJsPath, $dotFile);
        passthru($cmd, $status);
        if ($status !== 0) {
            echo 'Warning: Graphviz error' . PHP_EOL; // @codeCoverageIgnore
        }

        if (file_exists($dotFile)) {
            unlink($dotFile);
        }
    }
}
