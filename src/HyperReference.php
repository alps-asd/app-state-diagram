<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Generator;
use Koriym\AppStateDiagram\Exception\SharpMissingInHrefException;
use stdClass;

use function array_shift;
use function dirname;
use function explode;
use function in_array;
use function is_int;
use function strpos;

class HyperReference
{
    /** @var string */
    private $dir;

    /** @var array<string, string> */
    private $hrefs = [];

    /** @var FullPath  */
    private $fullPath;

    /** @var string */
    private $alpsFile;

    /** @var list<string> */
    private $done = [];

    /** @var LabelNameInterface */
    private $labelName;

    public function __construct(string $alpsFile, LabelNameInterface $labelName)
    {
        $this->alpsFile = $alpsFile;
        $this->dir = dirname($alpsFile);
        $this->fullPath = new FullPath();
        $this->labelName = $labelName;
    }

    public function add(string $alpsFile, string $href): void
    {
        $fullPath = ($this->fullPath)($alpsFile, $href);
        if (! is_int(strpos($fullPath, '#'))) {
            throw new SharpMissingInHrefException($fullPath);
        }

        [, $id] = explode('#', $fullPath);
        if (in_array($id, $this->done)) {
            return;
        }

        $this->hrefs[$id] = $fullPath;
        $this->done[] = $id;
    }

    /**
     * @param array<string, stdClass> $instances
     *
     * @return array<string, stdClass>
     */
    public function getInstances(array $instances): array
    {
        $hrefs = $this->hrefGenerator();
        foreach ($hrefs as $href) {
            [$file, $id] = explode('#', $href);
            if (! $file) {
                continue;
            }

            if (isset($instances[$id])) {
                continue;
            }

            $alps = new Profile($file, $this->labelName, false);
            [$importInstances, $hyperReference] = $alps->export($id, $file);
            /** @var array<string, stdClass> $importInstances */
            $this->merge($hyperReference);
            $instances += $importInstances;
        }

        return $instances;
    }

    /**
     * @return Generator<string>
     */
    public function hrefGenerator(): Generator
    {
        while ($this->hrefs) {
            yield array_shift($this->hrefs);
        }

        return [];
    }

    public function merge(HyperReference $hyperReference): void
    {
        $this->hrefs += $hyperReference->hrefs;
    }

    /**
     * @return array<string, string>
     */
    public function getHref(): array
    {
        return $this->hrefs;
    }
}
