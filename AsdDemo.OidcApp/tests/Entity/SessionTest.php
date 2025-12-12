<?php

declare(strict_types=1);

namespace AsdDemo\OidcApp\Entity;

use PHPUnit\Framework\TestCase;

class SessionTest extends TestCase
{
    public function testConstruct(): void
    {
        $session = new Session(
            'session123',
            'user456',
            'token789',
            '2025-12-13 11:30:00',
            '2025-12-12 11:30:00',
        );

        $this->assertSame('session123', $session->id);
        $this->assertSame('user456', $session->userId);
        $this->assertSame('token789', $session->sessionToken);
        $this->assertSame('2025-12-13 11:30:00', $session->expiresAt);
        $this->assertSame('2025-12-12 11:30:00', $session->dateCreated);
    }
}
