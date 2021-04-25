<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

class DumpDocsTest extends TestCase
{
    public function testInvoke(): void
    {
        $alpsFile = __DIR__ . '/Fake/alps.json';
        $profile = new Profile($alpsFile);
        (new DumpDocs())($profile->descriptors, $alpsFile, $profile->schema, $profile->tags);
        $this->assertFileExists(__DIR__ . '/Fake/descriptor/semantic.Index.json');
        $this->assertFileExists(__DIR__ . '/Fake/descriptor/safe.about.json');
    }

    public function testTagDoc(): void
    {
        $alpsFile = __DIR__ . '/Fake/alps_tag.json';
        $profile = new Profile($alpsFile);
        (new DumpDocs())($profile->descriptors, $alpsFile, $profile->schema, $profile->tags);

        $this->assertFileExists(__DIR__ . '/Fake/docs/tag.a.html');
        $this->assertFileExists(__DIR__ . '/Fake/docs/tag.b.html');
    }
}
