<?php

declare(strict_types=1);

namespace AsdDemo\OidcApp\Resource\Page;

use AsdDemo\OidcApp\Injector;
use BEAR\Resource\ResourceInterface;
use PHPUnit\Framework\TestCase;

use function assert;

class IndexTest extends TestCase
{
    private ResourceInterface $resource;

    protected function setUp(): void
    {
        $injector = Injector::getInstance('app');
        $this->resource = $injector->getInstance(ResourceInterface::class);
    }

    public function testOnGet(): void
    {
        $ro = $this->resource->get('page://self/index', ['name' => 'BEAR.Sunday']);
        assert($ro instanceof Index);
        $this->assertSame(200, $ro->code);
        $this->assertSame('Hello BEAR.Sunday', $ro->body['greeting']);
    }
}
