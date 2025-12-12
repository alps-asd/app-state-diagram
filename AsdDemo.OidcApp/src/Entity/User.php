<?php

declare(strict_types=1);

namespace AsdDemo\OidcApp\Entity;

class User
{
    public readonly string $dateCreated;

    public function __construct(
        public readonly string $id,
        public readonly string $username,
        public readonly string $email,
        public readonly string $passwordHash,
        string $date_created, // phpcs:ignore
    ) {
        $this->dateCreated = $date_created; // phpcs:ignore
    }
}
