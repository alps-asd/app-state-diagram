<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\DataFile\XmlConfigLoad;
use SimpleXMLElement;

use function assert;
use function dirname;
use function is_dir;
use function is_file;
use function property_exists;
use function realpath;
use function sprintf;

final class ConfigFactory
{
    /**
     * @param array<string>              $argv
     * @param array<string, string|bool> $options
     */
    public static function fromFile(string $configFile, int $argc = 1, array $argv = [''], array $options = []): Config
    {
        $xml = (new XmlConfigLoad('asd.xml'))($configFile, dirname(__DIR__) . '/docs/asd.xsd');
        assert(property_exists($xml, 'watch'));
        $dir = is_dir($configFile) ? $configFile : dirname($configFile);

        $maybePath = (string) realpath($argv[$argc - 1]);
        $profile = is_file($maybePath) && $configFile !== $maybePath ? $maybePath : sprintf('%s/%s', $dir, (string) $xml->alpsFile);
        /** @var ?SimpleXMLElement $filter */
        $filter = property_exists($xml, 'filter') ? $xml->filter : null;
        $option = new Option($options, $filter, property_exists($xml, 'label') ? (string) $xml->label : null);

        return new Config(
            $profile,
            $option->watch,
            $option->label,
            new ConfigFilter($option->and, $option->or, $option->color)
        );
    }

    /**
     * @param array<string>              $argv
     * @param array<string, string|bool> $options
     */
    public static function fromCommandLine(int $argc, array $argv, array $options): Config
    {
        $option = new Option($options, null, null);

        return new Config(
            (string) realpath($argv[$argc - 1]),
            $option->watch,
            $option->label,
            new ConfigFilter($option->and, $option->or, $option->color)
        );
    }
}
