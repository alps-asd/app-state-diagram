<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\DescriptorIsNotArrayException;
use Koriym\AppStateDiagram\Exception\DescriptorNotFoundException;
use Koriym\AppStateDiagram\Exception\InvalidDescriptorException;
use Koriym\AppStateDiagram\Exception\InvalidLabelOptionException;
use Koriym\AppStateDiagram\Exception\InvalidSemanticsException;
use Koriym\AppStateDiagram\Exception\MissingRtException;
use PHPUnit\Framework\TestCase;
use Seld\JsonLint\ParsingException;

class ErrorTest extends TestCase
{
    public function testInvalidJson(): void
    {
        $this->expectException(ParsingException::class);
        $this->expectErrorMessage('Expected one of:');
        new Profile(__DIR__ . '/Fake/invalid.json', new LabelName());
    }

    public function testInvalidDescriptorException(): void
    {
        $this->expectException(InvalidDescriptorException::class);
        new Profile(__DIR__ . '/Fake/invalid_missing_id.json', new LabelName());
    }

    public function testInvalidDescriptorInDescriptor(): void
    {
        $this->expectException(DescriptorIsNotArrayException::class);
        new Profile(__DIR__ . '/Fake/invalid_descriptor_array.json', new LabelName());
    }

    public function testMissingRt(): void
    {
        $this->expectException(MissingRtException::class);
        (new DrawDiagram())(new Profile(__DIR__ . '/Fake/invalid_missing_rt.json', new LabelName()), new LabelName());
    }

    public function testMissingRtDescriptor(): void
    {
        $this->expectException(DescriptorNotFoundException::class);
        (new DrawDiagram())(new Profile(__DIR__ . '/Fake/invalid_missing_missing_sharp_in_rt.json', new LabelName()), new LabelName());
    }

    public function testNullJsonException(): void
    {
        $this->expectException(InvalidDescriptorException::class);
        (new DrawDiagram())(new Profile(__DIR__ . '/Fake/invalid_null.json', new LabelName()), new LabelName());
    }

    public function testInvalidLabelOptionException(): void
    {
        $this->expectException(InvalidLabelOptionException::class);
        new Option(['label' => '1', 'l' => '2'], null, null);
    }

    public function testInvalidDescriptor(): void
    {
        $this->expectException(InvalidSemanticsException::class);
        new SemanticDescriptor(new class {
        });
    }

    public function testRtMissing(): void
    {
        $this->expectException(MissingRtException::class);
        $invalidTrans = (object) ['id' => 'id', 'type' => 'safe', 'rt' => ''];
        $semantic = new SemanticDescriptor(new class {
            /** @var string */
            public $id = 'id';
        });

        new TransDescriptor($invalidTrans, $semantic);
    }
}
