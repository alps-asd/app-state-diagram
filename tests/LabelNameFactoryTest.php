<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

final class LabelNameFactoryTest extends TestCase
{
    public function testGetInstanceOfLabelName(): void
    {
        $actual = LabelNameFactory::getInstance('');

        $this->assertInstanceOf(LabelName::class, $actual);
    }

    public function testGetInstanceOfLabelNameTitle(): void
    {
        $actual = LabelNameFactory::getInstance('title');

        $this->assertInstanceOf(LabelNameTitle::class, $actual);
    }
}
