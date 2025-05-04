<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Generator;
use Koriym\AppStateDiagram\Exception\MissingHashSignInHrefException;
use stdClass;

use function array_shift;
use function explode;
use function in_array;
use function is_int;
use function strpos;

final class HyperReference
{
    /** @var array<string, string> */
    private $hrefs = [];

    /** @var FullPath  */
    private $fullPath;

    /** @var list<string> */
    private $done = [];

    public function __construct(
        private readonly LabelNameInterface $labelName
    ) {
        $this->fullPath = new FullPath();
    }

    public function add(string $alpsFile, string $href): void
    {
        $fullPath = ($this->fullPath)($alpsFile, $href);
        if (! is_int(strpos($fullPath, '#'))) {
            throw new MissingHashSignInHrefException($href);
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
                continue; // @codeCoverageIgnore
            }

            if (isset($instances[$id])) {
                continue;
            }

            $alps = new Profile($file, $this->labelName, false);
            [$importInstances, $hyperReference] = $alps->export($id, $file);
            $this->merge($hyperReference);
            $instances += $importInstances;
        }

        return $instances;
    }

    /** @return Generator<string> */
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
}
