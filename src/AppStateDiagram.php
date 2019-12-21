<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

final class AppStateDiagram
{
    /**
     * @var AlpsScanner
     */
    private $alps;

    public function __construct(string $alpsFile)
    {
        $this->alps = new AlpsScanner;
        ($this->alps)($alpsFile);
    }

    public function __invoke() : string
    {
        return (new AsdRenderer)($this->alps->links, $this->alps->descriptors);
    }
}
