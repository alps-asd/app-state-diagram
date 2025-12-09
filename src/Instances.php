<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\InvalidXmlCharException;
use stdClass;

use function assert;
use function implode;
use function is_string;
use function ksort;
use function preg_match_all;
use function property_exists;
use function sprintf;

/**
 * Descriptor instance (raw object) container
 */
final class Instances
{
    private const INVALID_XML_CHARS = '/[&<>"\']/';

    /** @var array<string, stdClass> */
    private $instances = [];

    public function add(stdClass $instance): void
    {
        assert(property_exists($instance, 'id'));
        assert(is_string($instance->id));
        $this->validateTitle($instance);
        $this->instances[$instance->id] = $instance;
        ksort($this->instances);
    }

    /** @return array<string, stdClass> */
    public function get(): array
    {
        return $this->instances;
    }

    private function validateTitle(stdClass $instance): void
    {
        if (! property_exists($instance, 'title') || ! is_string($instance->title)) {
            return;
        }

        $result = preg_match_all(self::INVALID_XML_CHARS, $instance->title, $matches);
        if ($result > 0) {
            $chars = implode(', ', $matches[0]);

            throw new InvalidXmlCharException(
                sprintf(
                    "Descriptor '%s' title contains invalid XML characters: %s. These will cause SVG generation errors.",
                    $instance->id,
                    $chars
                )
            );
        }
    }
}
