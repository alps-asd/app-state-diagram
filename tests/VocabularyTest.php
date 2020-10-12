<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

use function file_put_contents;

class VocabularyTest extends TestCase
{
    public function testInvoke(): void
    {
        $scanner = new AlpsProfile(__DIR__ . '/Fake/alps.json');
        $md = (new Vocabulary($scanner->descriptors))->index;
        file_put_contents(__DIR__ . '/vocabulary.md', $md);
        $this->assertStringContainsString('* `Index`: Index Page', $md);
        $this->assertStringContainsString('* `articleBody`: [https://schema.org/articleBody](https://schema.org/articleBody) ', $md);
        $this->assertStringContainsString('`blogPosting`: [https://schema.org/BlogPosting](https://schema.org/BlogPosting) ブログ個別ページへ', $md);
    }
}
