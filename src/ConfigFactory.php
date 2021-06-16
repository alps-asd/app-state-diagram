<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\DataFile\XmlConfigLoad;
use SimpleXMLElement;

use function assert;
use function dirname;
use function explode;
use function in_array;
use function is_dir;
use function is_file;
use function property_exists;
use function realpath;
use function sprintf;
use function strpos;

final class ConfigFactory
{
    /** @param array<string> $argv */
    public static function fromFile(string $configFile, int $argc = 1, array $argv = ['']): Config
    {
        $xml = (new XmlConfigLoad('asd.xml'))($configFile, dirname(__DIR__) . '/docs/asd.xsd');
        assert(property_exists($xml, 'alpsFile'));
        assert(property_exists($xml, 'watch'));

        $dir = is_dir($configFile) ? $configFile : dirname($configFile);

        $maybePath = (string) realpath($argv[$argc - 1]);
        $profile = is_file($maybePath) ? $maybePath : sprintf('%s/%s', $dir, (string) $xml->alpsFile);
        $watch = in_array('--watch', $argv, true) || (string) $xml->watch === 'true';
        /** @var ?SimpleXMLElement $filter */
        $filter = property_exists($xml, 'filter') ? $xml->filter : null;
        $and = self::parseAndTag($argv, $filter);
        $or = self::parseOrTag($argv, $filter);
        $color = self::parseColor($argv, $filter);

        return new Config(
            $profile,
            $watch,
            new ConfigFilter($and, $or, $color)
        );
    }

    /** @param array<string> $argv */
    public static function fromCommandLine(int $argc, array $argv): Config
    {
        $watch = in_array('--watch', $argv, true);
        $and = self::parseAndTag($argv, null);
        $or = self::parseOrTag($argv, null);
        $color = self::parseColor($argv, null);

        return new Config(
            (string) realpath($argv[$argc - 1]),
            $watch,
            new ConfigFilter($and, $or, $color)
        );
    }

    /**
     * @param array<string> $options
     *
     * @return array<string>
     */
    private static function parseAndTag(array $options, ?SimpleXMLElement $filter): array
    {
        foreach ($options as $option) {
            if (strpos($option, '--and-tag=') === 0) {
                [, $value] = explode('=', $option);

                return explode(',', $value);
            }
        }

        return $filter instanceof SimpleXMLElement && property_exists($filter, 'and') ? (array) $filter->and : [];
    }

    /**
     * @param array<string> $options
     *
     * @return array<string>
     */
    private static function parseOrTag(array $options, ?SimpleXMLElement $filter): array
    {
        foreach ($options as $option) {
            if (strpos($option, '--or-tag=') === 0) {
                [, $value] = explode('=', $option);

                return explode(',', $value);
            }
        }

        return $filter instanceof SimpleXMLElement && property_exists($filter, 'or') ? (array) $filter->or : [];
    }

    /**
     * @param array<string> $options
     */
    private static function parseColor(array $options, ?SimpleXMLElement $filter): string
    {
        foreach ($options as $option) {
            if (strpos($option, '--color=') === 0) {
                [, $value] = explode('=', $option);

                return $value;
            }
        }

        return $filter instanceof SimpleXMLElement && property_exists($filter, 'color') ? (string) $filter->color : '';
    }
}
