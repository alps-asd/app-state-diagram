<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\InvalidTypeException;
use PHPUnit\Framework\TestCase;
use stdClass;

class CreateDescriptorTest extends TestCase
{
    public function testInvalidType(): void
    {
        $this->expectException(InvalidTypeException::class);
        $stdClass = new stdClass();
        $stdClass->id = 'About';
        $stdClass->type = '_invalid_';
        $instances = ['About' => $stdClass];
        (new CreateDescriptor())($instances);
    }
}
