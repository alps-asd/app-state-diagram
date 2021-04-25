<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Generator;
use stdClass;

use function array_shift;
use function dirname;
use function explode;
use function in_array;

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

    public function __construct(string $alpsFile)
    {
        $this->alpsFile = $alpsFile;
        $this->dir = dirname($alpsFile);
        $this->fullPath = new FullPath();
    }

    public function add(string $alpsFile, string $href): void
    {
        $fullPath = ($this->fullPath)($alpsFile, $href);
        [, $id] = explode('#', $fullPath);
        if (in_array($id, $this->done)) {
//            return;
        }

        $this->hrefs[$id] = $fullPath;
        $this->done[] = $id;
    }

    /**
     * @param array<string, stdClass> $instances
     *
     * @return array<stdClass>
     */
    public function getInstances(array $instances): array
    {
        $hrefs = $this->getHrefs();
        foreach ($hrefs as $href) {
            [$file, $id] = explode('#', $href);
            if (! $file) {
                continue;
            }

            if (isset($instances[$id])) {
                continue;
            }

            $alps = new Profile($file, $this, false);
            $importInstances = $alps->export($id, $file);
            $instances += $importInstances;
        }

        return $instances;
    }

    /**
     * @return Generator<string>
     */
    public function getHrefs(): Generator
    {
        while ($this->hrefs) {
            yield array_shift($this->hrefs);
        }
    }
}
