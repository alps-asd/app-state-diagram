<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\InvalidSemanticsException;
use stdClass;

abstract class AbstractDescriptor
{
    /**
     * @var string
     */
    public $id;

    /**
     * @var null|stdClass
     */
    public $def;

    /**
     * @var null|stdClass
     */
    public $doc;

    /**
     * @var null|stdClass
     */
    public $descriptor;

    public function __construct(object $descriptor)
    {
        if (! isset($descriptor->type, $descriptor->id)) {
            throw new InvalidSemanticsException((string) json_encode($descriptor));
        }
        $this->id = $descriptor->id;
        $this->def = isset($descriptor->def) ? $descriptor->def : null;
        $this->doc = isset($descriptor->doc) ? $descriptor->doc : null;
        $this->descriptor = isset($descriptor->descriptor) ? $descriptor->descriptor : null;
    }
}
