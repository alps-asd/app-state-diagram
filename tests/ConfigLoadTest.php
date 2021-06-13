<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

use function file_exists;

class ConfigLoadTest extends TestCase
{
    public function testConfigLoad(): void
    {
        $config = ConfigFactory::fromFile(__DIR__ . '/Fake/config');
        $this->assertInstanceOf(Config::class, $config);
        $this->assertTrue(file_exists($config->profile));
        $this->assertFalse($config->watch);
        $this->assertSame(['tag1', 'tag2'], $config->filter->and);
        $this->assertSame(['tag3'], $config->filter->or);
    }
}
