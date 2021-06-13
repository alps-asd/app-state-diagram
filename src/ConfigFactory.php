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
    /** @param array<string> $argv */
    public static function fromFile(string $configFile, int $argc = 1, array $argv = ['']): Config
    {
        $xml = (new XmlConfigLoad('asd.xml'))($configFile, dirname(__DIR__) . '/docs/asd.xsd');
        assert(property_exists($xml, 'alpsFile'));
        assert(property_exists($xml, 'watch'));

        $dir = is_dir($configFile) ? $configFile : dirname($configFile);

        $maybePath = (string) realpath($argv[$argc - 1]);
        $profile = is_file($maybePath) ? $maybePath : sprintf('%s/%s', $dir, (string) $xml->alpsFile);
        /** @var ?SimpleXMLElement $filter */
        $filter = property_exists($xml, 'filter') ?  $xml->filter : null;

        return new Config(
            $profile,
            (string) $xml->watch === 'true',
            $filter
        );
    }

    /** @param array<string> $argv */
    public static function fromCommandLine(int $argc, array $argv): Config
    {
        return new Config(
            (string) realpath($argv[$argc - 1]),
            false,
            null
        );
    }
}
