<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

final class AppStateDiagram
{
    /** @var AlpsProfile */
    private $alps;

    public function __construct(string $alpsFile)
    {
        $this->alps = new AlpsProfile($alpsFile);
    }

    public function getDot(): string
    {
        return (new AsdRenderer())($this->alps->links, $this->alps->descriptors);
    }

    public function getVocabulary(): Vocabulary
    {
        return new Vocabulary($this->alps->descriptors);
    }
}
