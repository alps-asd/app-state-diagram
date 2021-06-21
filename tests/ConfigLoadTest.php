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

    /**
     * @return array<string, mixed>
     */
    public function testOverwriteConfig(): array
    {
        $options = [
            'watch' => true,
            'and-tag' => 'a,b',
            'or-tag' => 'c,d',
            'color' => 'red',
            'label' => 'title',
            '-c' => __DIR__ . '/Fake/config',
        ];
        $config = ConfigFactory::fromFile(__DIR__ . '/Fake/config', 1, [__DIR__ . '/Fake/alps.json'], $options);
        $this->assertSame(__DIR__ . '/Fake/alps.json', $config->profile);
        $this->assertTrue($config->watch);
        $this->assertTrue($config->hasTag);
        $this->assertSame(['a', 'b'], $config->filter->and);
        $this->assertSame(['c', 'd'], $config->filter->or);
        $this->assertSame('red', $config->filter->color);
        $this->assertSame('title', $config->label);

        return $options;
    }

    /**
     * @param array<string, mixed> $options
     *
     * @depends testOverwriteConfig
     */
    public function testFromCommandLine(array $options): void
    {
        $config = ConfigFactory::fromCommandLine(1, [__DIR__ . '/Fake/alps.json'], $options);
        $this->assertSame(__DIR__ . '/Fake/alps.json', $config->profile);
        $this->assertTrue($config->watch);
        $this->assertTrue($config->hasTag);
        $this->assertSame(['a', 'b'], $config->filter->and);
        $this->assertSame(['c', 'd'], $config->filter->or);
        $this->assertSame('red', $config->filter->color);
        $this->assertSame('title', $config->label);
    }

    public function testMultipleLabelOptions(): void
    {
        $config = ConfigFactory::fromCommandLine(1, [__DIR__ . '/Fake/alps.json'], ['label' => 'both', 'l' => 'title']);
        $this->assertSame('both', $config->label);
    }
}
