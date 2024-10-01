<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

final class Asd
{
    public function __invoke(string $profile): string
    {
        $index = new IndexPage(
            new Config($profile, false, DumpDocs::MODE_HTML)
        );

        return $index->content;
    }
}
