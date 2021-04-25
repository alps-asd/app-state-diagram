<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\DescriptorIsNotArrayException;
use Koriym\AppStateDiagram\Exception\InvalidDescriptorException;
use Koriym\AppStateDiagram\Exception\RtMissingException;
use PHPUnit\Framework\TestCase;
use Seld\JsonLint\ParsingException;

class ErrorTest extends TestCase
{
    public function testInvalidJson(): void
    {
        $this->expectException(ParsingException::class);
        $this->expectErrorMessage('" does not contain valid JSON');
        new Profile(__DIR__ . '/Fake/invalid.json');
    }

    public function testInvalidDescriptorException(): void
    {
        $this->expectException(InvalidDescriptorException::class);
        new Profile(__DIR__ . '/Fake/invalid_missing_id.json');
    }

    public function testInvalidDescriptorInDescriptor(): void
    {
        $this->expectException(DescriptorIsNotArrayException::class);
        new Profile(__DIR__ . '/Fake/invalid_descriptor_array.json');
    }

    public function testMissingRt(): void
    {
        $this->expectException(RtMissingException::class);
        (new DrawDiagram())(new Profile(__DIR__ . '/Fake/invalid_missing_rt.json'));
    }

    public function testMissingSharpInRt(): void
    {
        $this->expectException(RtMissingException::class);
        (new DrawDiagram())(new Profile(__DIR__ . '/Fake/invalid_missing_missing_sharp_in_rt.json'));
    }

    public function testNullJsonException(): void
    {
        $this->expectException(InvalidDescriptorException::class);
        (new DrawDiagram())(new Profile(__DIR__ . '/Fake/invalid_null.json'));
    }
}
