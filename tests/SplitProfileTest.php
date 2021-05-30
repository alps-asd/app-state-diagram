<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

use function count;
use function dirname;

class SplitProfileTest extends TestCase
{
    public function testXml(): void
    {
        [$xmlProfile, $xmlDescriptors] = (new SplitProfile())(dirname(__DIR__) . '/docs/blog/profile.xml');
        [$jsonProfile, $jsonDescriptors] = (new SplitProfile())(dirname(__DIR__) . '/docs/blog/profile.json');
        $this->assertSame(count($xmlDescriptors), count($jsonDescriptors));
        $this->assertSame($xmlProfile->alps->title, $jsonProfile->alps->title); // @phpstan-ignore-line
        $this->assertSame($xmlProfile->alps->doc->value, $jsonProfile->alps->doc->value); // @phpstan-ignore-line
        $this->assertSame($xmlProfile->alps->link->rel, $jsonProfile->alps->link->rel); // @phpstan-ignore-line
        $this->assertSame($xmlProfile->alps->link->href, $jsonProfile->alps->link->href); // @phpstan-ignore-line
    }
}
