<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use SimpleXMLElement;

use function explode;
use function is_string;
use function property_exists;

/** @psalm-immutable */
final class Option
{
    /**
     * @var bool
     * @readonly
     */
    public $watch;

    /**
     * @var array<string>
     * @readonly
     */
    public $and;

    /**
     * @var array<string>
     * @readonly
     */
    public $or;

    /**
     * @var string
     * @readonly
     */
    public $color;

    /**
     * @param array<string, string|bool> $options
     */
    public function __construct(array $options, ?SimpleXMLElement $filter)
    {
        $this->watch = isset($options['w']) || isset($options['watch']);
        $this->and = $this->parseAndTag($options, $filter);
        $this->or = $this->parseOrTag($options, $filter);
        $this->color = $this->parseColor($options, $filter);
    }

    /**
     * @param array<string, string|bool> $options
     *
     * @return array<string>
     */
    private function parseAndTag(array $options, ?SimpleXMLElement $filter): array
    {
        if (isset($options['and-tag']) && is_string($options['and-tag'])) {
            return explode(',', $options['and-tag']);
        }

        return $filter instanceof SimpleXMLElement && property_exists($filter, 'and') ? (array) $filter->and : [];
    }

    /**
     * @param array<string, string|bool> $options
     *
     * @return array<string>
     */
    private function parseOrTag(array $options, ?SimpleXMLElement $filter): array
    {
        if (isset($options['or-tag']) && is_string($options['or-tag'])) {
            return explode(',', $options['or-tag']);
        }

        return $filter instanceof SimpleXMLElement && property_exists($filter, 'or') ? (array) $filter->or : [];
    }

    /**
     * @param array<string, string|bool> $options
     */
    private function parseColor(array $options, ?SimpleXMLElement $filter): string
    {
        if (isset($options['color']) && is_string($options['color'])) {
            return $options['color'];
        }

        return $filter instanceof SimpleXMLElement && property_exists($filter, 'color') ? (string) $filter->color : '';
    }
}
