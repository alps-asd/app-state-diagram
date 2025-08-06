<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\AlpsFileNotReadableException;
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
        $this->assertSame(DumpDocs::MODE_MARKDOWN, $config->outputMode);
        $this->assertSame(3000, $config->port);
    }

    /** @return array<string, mixed> */
    public function testOverwriteConfig(): array
    {
        $options = [
            'watch' => true,
            'and-tag' => 'a,b',
            'or-tag' => 'c,d',
            'color' => 'red',
            'label' => 'title',
            '-c' => __DIR__ . '/Fake/config',
            'port' => '3001',
        ];
        $config = ConfigFactory::fromFile(__DIR__ . '/Fake/config', 1, [__DIR__ . '/Fake/alps.json'], $options);
        $this->assertSame(__DIR__ . '/Fake/alps.json', $config->profile);
        $this->assertTrue($config->watch);
        $this->assertSame(3001, $config->port);

        return $options;
    }

    /**
     * @param  array<string, bool|string> $options
     *
     * @depends testOverwriteConfig
     */
    public function testFromCommandLine(array $options): void
    {
        $config = ConfigFactory::fromCommandLine(1, [__DIR__ . '/Fake/alps.json'], $options);
        $this->assertSame(__DIR__ . '/Fake/alps.json', $config->profile);
        $this->assertTrue($config->watch);
        $this->assertSame(3001, $config->port);
    }

    public function testInvalidPortValue(): void
    {
        $options = [
            'port' => '999', // Below min_range 1024
        ];
        $config = ConfigFactory::fromCommandLine(1, [__DIR__ . '/Fake/alps.json'], $options);
        $this->assertSame(3000, $config->port); // Should default to 3000
    }

    public function testInvalidPortValueHigh(): void
    {
        $options = [
            'port' => '99999', // Above max_range 49151
        ];
        $config = ConfigFactory::fromCommandLine(1, [__DIR__ . '/Fake/alps.json'], $options);
        $this->assertSame(3000, $config->port); // Should default to 3000
    }

    public function testModeMarkdown(): void
    {
        $options = [
            'mode' => DumpDocs::MODE_MARKDOWN,
        ];
        $config = ConfigFactory::fromCommandLine(1, [__DIR__ . '/Fake/alps.json'], $options);
        $this->assertSame(DumpDocs::MODE_MARKDOWN, $config->outputMode);
    }

    public function testModeSvg(): void
    {
        $options = [
            'mode' => DumpDocs::MODE_SVG,
        ];
        $config = ConfigFactory::fromCommandLine(1, [__DIR__ . '/Fake/alps.json'], $options);
        $this->assertSame(DumpDocs::MODE_SVG, $config->outputMode);
    }

    public function testInvalidProfile(): void
    {
        $this->expectException(AlpsFileNotReadableException::class);
        ConfigFactory::fromCommandLine(1, ['invalidProfile'], []);
    }
}
