<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

use function count;
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

    /**
     * @return list<string>
     */
    public function testOverwriteConfig(): array
    {
        $argv = [
            '--watch',
            '--and-tag=a,b',
            '--or-tag=c,d',
            '--color=red',
            '-c',
            __DIR__ . '/Fake/config',
            __DIR__ . '/Fake/alps.json',
        ];
        $config = ConfigFactory::fromFile(__DIR__ . '/Fake/config', count($argv), $argv);
        $this->assertSame(__DIR__ . '/Fake/alps.json', $config->profile);
        $this->assertTrue($config->watch);
        $this->assertTrue($config->hasTag);
        $this->assertSame(['a', 'b'], $config->filter->and);
        $this->assertSame(['c', 'd'], $config->filter->or);
        $this->assertSame('red', $config->filter->color);

        return $argv;
    }

    /**
     * @param list<string> $argv
     *
     * @depends testOverwriteConfig
     */
    public function testFromCommandLine(array $argv): void
    {
        $config = ConfigFactory::fromCommandLine(count($argv), $argv);
        $this->assertSame(__DIR__ . '/Fake/alps.json', $config->profile);
        $this->assertTrue($config->watch);
        $this->assertTrue($config->hasTag);
        $this->assertSame(['a', 'b'], $config->filter->and);
        $this->assertSame(['c', 'd'], $config->filter->or);
        $this->assertSame('red', $config->filter->color);
    }
}
