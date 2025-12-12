<?php

declare(strict_types=1);

namespace AsdDemo\OidcApp\Resource\App;

use AsdDemo\OidcApp\Injector;
use Aura\Sql\ExtendedPdoInterface;
use BEAR\Resource\ResourceInterface;
use PHPUnit\Framework\TestCase;

use function assert;

class SessionTest extends TestCase
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

    public function testOnPostInvalidCredentials(): void
    {
        $response = $this->resource->post('app://self/session', [
            'username' => 'nonexistent',
            'password' => 'wrongpassword',
        ]);

        $this->assertSame(401, $response->code);
        $this->assertArrayHasKey('error', $response->body);
    }

    public function testOnGetNotFound(): void
    {
        $response = $this->resource->get('app://self/session', ['sessionToken' => 'invalid-token']);

        $this->assertSame(404, $response->code);
    }

    public function testOnDeleteNotFound(): void
    {
        $response = $this->resource->delete('app://self/session', ['sessionToken' => 'invalid-token']);

        $this->assertSame(404, $response->code);
    }
}
