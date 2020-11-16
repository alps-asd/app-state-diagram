<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\DescriptorIsNotArrayException;
use Koriym\AppStateDiagram\Exception\InvalidDescriptorException;
use Koriym\AppStateDiagram\Exception\InvalidJsonException;
use Koriym\AppStateDiagram\Exception\RtDescriptorMissingException;
use Koriym\AppStateDiagram\Exception\RtMissingException;
use PHPUnit\Framework\TestCase;

class ErrorTest extends TestCase
{
    public function testInvalidJson(): void
    {
        $this->expectException(InvalidJsonException::class);
        $this->expectErrorMessage('Syntax error');
        new AlpsProfile(__DIR__ . '/Fake/invalid.json');
    }

    public function testInvalidDescriptorException(): void
    {
        $this->expectException(InvalidDescriptorException::class);
        new AlpsProfile(__DIR__ . '/Fake/invalid_missing_id.json');
    }

    public function testInvalidDescriptorInDescriptor(): void
    {
        $this->expectException(DescriptorIsNotArrayException::class);
        new AlpsProfile(__DIR__ . '/Fake/invalid_descriptor_array.json');
    }

    public function testMissingRt(): void
    {
        $this->expectException(RtMissingException::class);
        (new DrawDiagram())(new AlpsProfile(__DIR__ . '/Fake/invalid_missing_rt.json'));
    }

    public function testMissingSharpInRt(): void
    {
        $this->expectException(RtMissingException::class);
        (new DrawDiagram())(new AlpsProfile(__DIR__ . '/Fake/invalid_missing_missing_sharp_in_rt.json'));
    }

    public function testRtDescriptorMissingException(): void
    {
        $this->expectException(RtDescriptorMissingException::class);
        (new DrawDiagram())(new AlpsProfile(__DIR__ . '/Fake/invalid_missing_rt_descriptor.json'));
    }
}
