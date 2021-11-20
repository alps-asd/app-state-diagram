<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

use function assert;
use function count;
use function dirname;
use function property_exists;

class SplitProfileTest extends TestCase
{
    public function testXml(): void
    {
        [$xmlProfile, $xmlDescriptors] = (new SplitProfile())(dirname(__DIR__) . '/docs/blog/profile.xml');
        [$jsonProfile, $jsonDescriptors] = (new SplitProfile())(dirname(__DIR__) . '/docs/blog/profile.json');
        $this->assertSame(count($xmlDescriptors), count($jsonDescriptors));
        assert(property_exists($xmlProfile, 'alps'));
        assert(property_exists($jsonProfile, 'alps'));
        $this->assertSame($xmlProfile->alps->title, $jsonProfile->alps->title);
        $this->assertSame($xmlProfile->alps->doc->value, $jsonProfile->alps->doc->value);
        $this->assertSame($xmlProfile->alps->link->rel, $jsonProfile->alps->link->rel);
        $this->assertSame($xmlProfile->alps->link->href, $jsonProfile->alps->link->href);
    }

    public function testNoDescriptorXml(): void
    {
        [$xmlProfile, $xmlDescriptors] = (new SplitProfile())(dirname(__DIR__) . '/tests/Fake/no_descriptor_profile.xml');
        [$jsonProfile, $jsonDescriptors] = (new SplitProfile())(dirname(__DIR__) . '/tests/Fake/empty_descriptor_profile.json');
        $this->assertSame(count($xmlDescriptors), count($jsonDescriptors));
    }

    public function testEmptyDescriptorXml(): void
    {
        [$xmlProfile, $xmlDescriptors] = (new SplitProfile())(dirname(__DIR__) . '/tests/Fake/empty_descriptor_profile.xml');
        [$jsonProfile, $jsonDescriptors] = (new SplitProfile())(dirname(__DIR__) . '/tests/Fake/empty_descriptor_profile.json');
        $this->assertSame(count($xmlDescriptors), count($jsonDescriptors));
    }
}
