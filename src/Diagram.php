<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function count;
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
            $this->drawSvgOnly($config, $profile);

            // Return IndexPage for API consistency (not used for SVG-only output)
            return $index;
        }

        return $index;

//        file_put_contents($index->file, $index->content);
//        echo "ASD generated. {$index->file}" . PHP_EOL;
//        echo sprintf('Descriptors(%s), Links(%s)', count($profile->descriptors), count($profile->links)) . PHP_EOL;
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

    public function drawSvgOnly(Config $config, Profile $profile): void
    {
        $titleProfile = new Profile($config->profile, new LabelNameTitle());

        // Generate main SVG (with IDs)
        $this->draw('', new LabelName(), $profile);

        // Generate title SVG (with human-readable names)
        $this->draw('.title', new LabelNameTitle(), $titleProfile);

        $svgFile = str_replace(['.xml', '.json'], '.svg', $profile->alpsFile);
        $titleSvgFile = str_replace(['.xml', '.json'], '.title.svg', $profile->alpsFile);

        echo "SVG (ID-based) generated: {$svgFile}" . PHP_EOL;
        echo "SVG (Title-based) generated: {$titleSvgFile}" . PHP_EOL;
        echo sprintf('Descriptors(%s), Links(%s)', count($profile->descriptors), count($profile->links)) . PHP_EOL;
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
        $dotJsPath = PathResolver::getDotJsPath();
        $cmd = sprintf('node %s %s', $dotJsPath, $dotFile);
        passthru($cmd, $status);
        if ($status !== 0) {
            echo 'Warning: Graphviz error' . PHP_EOL; // @codeCoverageIgnore
        }

        @unlink($dotFile);
    }
}
