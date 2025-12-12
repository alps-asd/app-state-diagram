<?php

declare(strict_types=1);

namespace AsdDemo\OidcApp\Hypermedia;

use AsdDemo\OidcApp\Injector;
use BEAR\Resource\ResourceInterface;
use BEAR\Resource\ResourceObject;
use PHPUnit\Framework\TestCase;
use Ray\Di\InjectorInterface;

class WorkflowTest extends TestCase
{
    protected ResourceInterface $resource;
    protected InjectorInterface $injector;

    protected function setUp(): void
    {
        $this->injector = Injector::getInstance('app');
        $this->resource = $this->injector->getInstance(ResourceInterface::class);
    }

    public function testIndex(): ResourceObject
    {
        $index = $this->resource->get('/index');
        $this->assertSame(200, $index->code);

        return $index;
    }

//    /**
//     * @depends testIndex
//     */
//    public function testRelFoo(ResourceObject $response): ResourceObject
//    {
//        $json = (string) $response;
//        $href = json_decode($json)->_links->{'name:foo'}->href;
//        $ro = $this->resource->get($href);
//        $this->assertSame(200, $ro->code);
//
//        return $ro;
//    }
}
