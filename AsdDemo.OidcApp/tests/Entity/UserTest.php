<?php

declare(strict_types=1);

namespace AsdDemo\OidcApp\Entity;

use PHPUnit\Framework\TestCase;

class UserTest extends TestCase
{
    public function testConstruct(): void
    {
        $user = new User(
            '123',
            'testuser',
            'test@example.com',
            'hashed_password',
            '2025-12-12 11:30:00',
        );

        $this->assertSame('123', $user->id);
        $this->assertSame('testuser', $user->username);
        $this->assertSame('test@example.com', $user->email);
        $this->assertSame('hashed_password', $user->passwordHash);
        $this->assertSame('2025-12-12 11:30:00', $user->dateCreated);
    }
}
