<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

class DumpDocsTest extends TestCase
{
    public function testInvoke(): void
    {
        $alpsFile = __DIR__ . '/Fake/alps.json';
        $profile = new AlpsProfile($alpsFile);
        (new DumpDocs())($profile->descriptors, $alpsFile, $profile->schema);
        $this->assertFileExists(__DIR__ . '/Fake/descriptor/semantic.Index.json');
        $this->assertFileExists(__DIR__ . '/Fake/descriptor/safe.about.json');
    }
}
