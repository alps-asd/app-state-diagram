<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function count;
use function file_exists;
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

        if ($config->outputMode === DumpDocs::MODE_SVG) {
            $this->drawSvgOnly($config, $profile);

            return;
        }

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

    public function drawSvgOnly(Config $config, Profile $profile): void
    {
        $titleProfile = new Profile($config->profile, new LabelNameTitle());

        // Generate main SVG (with IDs)
        $this->draw('', new LabelName(), $profile);

        // Generate title SVG (with human-readable names)
        $this->draw('.title', new LabelNameTitle(), $titleProfile);

        $svgFile = str_replace(DumpDocs::ALPS_FILE_EXTENSIONS, '.svg', $profile->alpsFile);
        $titleSvgFile = str_replace(DumpDocs::ALPS_FILE_EXTENSIONS, '.title.svg', $profile->alpsFile);

        echo "SVG (ID-based) generated: {$svgFile}" . PHP_EOL;
        echo "SVG (Title-based) generated: {$titleSvgFile}" . PHP_EOL;
        echo sprintf('Descriptors(%s), Links(%s)', count($profile->descriptors), count($profile->links)) . PHP_EOL;
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
        file_put_contents(
            $dotFile,
            $dot
        );

        // @codeCoverageIgnoreStart
        // Try native dot command first if available
        if (PathResolver::isDotCommandAvailable()) {
            $this->convertWithNativeDot($dotFile);

            return;
        }

        $this->convertWithJavaScript($dotFile);

        if (file_exists($dotFile)) {
            unlink($dotFile);
        }
        // @codeCoverageIgnoreEnd
    }

    private function convertWithNativeDot(string $dotFile): void
    {
        // @codeCoverageIgnoreStart
        $svgFile = str_replace('.dot', '.svg', $dotFile);
        $cmd = sprintf('dot -Tsvg %s -o %s', $dotFile, $svgFile);
        passthru($cmd, $status);
        if ($status !== 0) {
            echo 'Warning: Native dot command failed, falling back to JavaScript rendering' . PHP_EOL;
            $this->convertWithJavaScript($dotFile);
        }
        // @codeCoverageIgnoreEnd
    }

    private function convertWithJavaScript(string $dotFile): void
    {
        // @codeCoverageIgnoreStart
        $dotJsPath = PathResolver::getDotJsPath();
        $cmd = sprintf('node %s %s', $dotJsPath, $dotFile);
        passthru($cmd, $status);
        if ($status !== 0) {
            echo 'Warning: JavaScript rendering failed' . PHP_EOL;
        }
        // @codeCoverageIgnoreEnd
    }
}
