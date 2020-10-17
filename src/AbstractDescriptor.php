<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\InvalidSemanticsException;
use stdClass;

use function json_encode;

abstract class AbstractDescriptor
{
    /** @var string */
    public $id;

    /** @var string|null */
    public $def;

    /** @var stdClass|null */
    public $doc;

    /** @var list<stdClass> */
    public $descriptor;

    /** @var string */
    public $type = 'semantic';

    public function __construct(object $descriptor)
    {
        if (! isset($descriptor->type, $descriptor->id)) {
            throw new InvalidSemanticsException((string) json_encode($descriptor));
        }

        $this->id = $descriptor->id;
        $this->def = $descriptor->def ?? $descriptor->ref ?? $descriptor->src ?? null; // @phpstan-ignore-line
        $this->doc = $descriptor->doc ?? null; // @phpstan-ignore-line
        $this->descriptor = $descriptor->descriptor ?? []; // @phpstan-ignore-line
    }

    /**
     * @return array<string, string|array>
     */
    public function normalize(string $schema): stdClass
    {
        $alps = new stdClass();
        if ($this->doc) {
            $alps->doc = $this->doc;
        }

        $descriptor = new stdClass();
        $descriptor->id = $this->id;
        if ($this->def) {
            $descriptor->ref = $this->def;
        }

        $descriptor->type = $this->type;
        $alps->descriptor = [$descriptor];
        $alpsDoc = new stdClass();
        $alpsDoc->{'$schema'} = $schema;
        $alpsDoc->alps = $alps;

        return $alpsDoc;
    }
}
