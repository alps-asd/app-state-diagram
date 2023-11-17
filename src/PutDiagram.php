<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function basename;
use function count;
use function dirname;
use function file_put_contents;
use function passthru;
use function sprintf;
use function str_replace;

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
        $titleProfile = new Profile($config->profile, new LabelNameTitle());
        $dot = $this->draw('', new LabelName(), $profile, null, null);
        $this->draw('.title', new LabelNameTitle(), $titleProfile, null, null);

        (new DumpDocs())($profile, $config->profile, $config->outputMode);
        $index = new IndexPage($profile, $dot, $config->outputMode);
        file_put_contents($index->file, $index->content);
        echo "ASD generated. {$index->file}" . PHP_EOL;
        echo sprintf('Descriptors(%s), Links(%s)', count($profile->descriptors), count($profile->links)) . PHP_EOL;
        if ($config->hasTag) {
            $taggedSvg = $this->drawTag($profile, $config, new LabelName());
            echo "Tagged ASD generated. {$taggedSvg}" . PHP_EOL;
        }
    }

    private function draw(string $fileId, LabelNameInterface $labelName, AbstractProfile $profile, ?TaggedProfile $taggedProfile, ?string $color): string
    {
        $dot = ($this->draw)($profile, $labelName, $taggedProfile, $color);
        $extention = $fileId . '.dot';
        $dotFile = str_replace(['.xml', '.json'], $extention, $profile->alpsFile);
        $this->convert($dotFile, $dot);

        return $dot;
    }

    private function drawTag(Profile $profile, Config $config, LabelName $labelName): string
    {
        $filteredProfile = new TaggedProfile($profile, $config->filter->or, $config->filter->and);
        $tagDot = $config->filter->color ? (new DrawDiagram())($profile, $labelName, $filteredProfile, $config->filter->color) : (new DrawDiagram())($profile, $labelName, $filteredProfile);
        $file = str_replace(['.xml', '.json'], '.dot', $config->profile);
        $svgFile = str_replace(['.xml', '.json'], '.svg', $config->profile);
        $tagFile = dirname($file) . '/tag_' . basename($file);
        file_put_contents($tagFile, $tagDot);
        $filteredSvg = dirname($svgFile) . '/tag_' . basename($svgFile);
        $this->convert($filteredSvg, $tagDot);

        return $filteredSvg;
    }

    private function convert(string $dotFile, string $dot): void
    {
        file_put_contents($dotFile, $dot);
        $svgFile = str_replace('dot', 'svg', $dotFile);
        $cmd = "dot -Tsvg {$dotFile} -o {$svgFile}";
        passthru($cmd, $status);
        if ($status !== 0) {
            echo 'Warning: Graphviz error. https://graphviz.org/download/' . PHP_EOL; // @codeCoverageIgnore
        }
    }
}
