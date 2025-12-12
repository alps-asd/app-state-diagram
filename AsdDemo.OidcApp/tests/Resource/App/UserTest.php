<?php

declare(strict_types=1);

namespace AsdDemo\OidcApp\Resource\App;

use AsdDemo\OidcApp\Injector;
use Aura\Sql\ExtendedPdoInterface;
use BEAR\Resource\ResourceInterface;
use PHPUnit\Framework\TestCase;

use function assert;

class UserTest extends TestCase
{
    private ResourceInterface $resource;

    protected function setUp(): void
    {
        $injector = Injector::getInstance('app');
        $resource = $injector->getInstance(ResourceInterface::class);
        assert($resource instanceof ResourceInterface);
        $this->resource = $resource;

        // Clean up database before each test
        $pdo = $injector->getInstance(ExtendedPdoInterface::class);
        $pdo->exec('DELETE FROM session');
        $pdo->exec('DELETE FROM user');
    }

    public function testOnPost(): void
    {
        $response = $this->resource->post('app://self/user', [
            'username' => 'testuser',
            'email' => 'test@example.com',
            'password' => 'securepassword123',
        ]);

        $this->assertSame(201, $response->code);
        $this->assertArrayHasKey('Location', $response->headers);
        $this->assertArrayHasKey('id', $response->body);
    }

    public function testOnGetNotFound(): void
    {
        $response = $this->resource->get('app://self/user', ['id' => 'non-existent-id']);
        $this->assertSame(404, $response->code);
    }

    public function testOnPutNotFound(): void
    {
        $response = $this->resource->put('app://self/user', [
            'id' => 'non-existent-id',
            'username' => 'updated',
            'email' => 'updated@example.com',
        ]);

        $this->assertSame(404, $response->code);
    }

    public function testOnDeleteNotFound(): void
    {
        $response = $this->resource->delete('app://self/user', ['id' => 'non-existent-id']);
        $this->assertSame(404, $response->code);
    }
}
