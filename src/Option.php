<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\InvalidLabelOptionException;
use SimpleXMLElement;

use function explode;
use function in_array;
use function is_string;
use function property_exists;

/** @psalm-immutable */
final class Option
{
    private const SUPPORTED_LABELS = [
        'id',
        'title',
        'both',
    ];

    /** @var bool */
    public $watch;

    /** @var array<string> */
    public $and;

    /** @var array<string> */
    public $or;

    /** @var string */
    public $color;

    /** @var string */
    public $label;

    /**
     * @param array<string, string|bool> $options
     */
    public function __construct(array $options, ?SimpleXMLElement $filter, ?string $label)
    {
        $this->watch = isset($options['w']) || isset($options['watch']);
        $this->and = $this->parseAndTag($options, $filter);
        $this->or = $this->parseOrTag($options, $filter);
        $this->color = $this->parseColor($options, $filter);
        $this->label = $this->parseLabel($options, $label);
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

        /** @var array<string> */ // phpcs:ignore SlevomatCodingStandard.Commenting.InlineDocCommentDeclaration.InvalidFormat

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

        /** @var array<string> */ // phpcs:ignore SlevomatCodingStandard.Commenting.InlineDocCommentDeclaration.InvalidFormat

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

    /** @param array<string, string|bool> $options */
    private function parseLabel(array $options, ?string $label): string
    {
        if (! isset($options['label']) && ! isset($options['l'])) {
            return $label ?? 'id';
        }

        $label = (string) ($options['label'] ?? $options['l']);

        if (! in_array($label, self::SUPPORTED_LABELS, true)) {
            throw new InvalidLabelOptionException("{$label} is not supported. Supported values: [id|title|both].");
        }

        return $label;
    }
}
