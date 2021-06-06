<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\RtMissingException;
use stdClass;

use function assert;
use function is_string;
use function strpos;
use function substr;

final class TransDescriptor extends AbstractDescriptor
{
    /** @var string */
    public $type;

    /** @var string */
    public $rt;

    /** @inheritdoc */
    public $parent;

    public function __construct(stdClass $descriptor, SemanticDescriptor $parent)
    {
        parent::__construct($descriptor);
        assert(is_string($descriptor->type));
        $this->type = $descriptor->type;
        if (! isset($descriptor->rt) || ! is_string($descriptor->rt)) {
            assert(is_string($descriptor->id));

            throw new RtMissingException($descriptor->id);
        }

        assert(is_string($descriptor->id));

        $pos = strpos($descriptor->rt, '#');
        if ($pos === false) {
            throw new RtMissingException($descriptor->id);
        }

        $this->rt = substr($descriptor->rt, $pos + 1);
        $this->parent = $parent;
    }
}
