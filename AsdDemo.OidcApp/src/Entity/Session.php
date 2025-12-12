<?php

declare(strict_types=1);

namespace AsdDemo\OidcApp\Entity;

class Session
{
    public readonly string $userId;
    public readonly string $sessionToken;
    public readonly string $expiresAt;
    public readonly string $dateCreated;

    public function __construct(
        public readonly string $id,
        string $user_id, // phpcs:ignore
        string $session_token, // phpcs:ignore
        string $expires_at, // phpcs:ignore
        string $date_created, // phpcs:ignore
    ) {
        $this->userId = $user_id; // phpcs:ignore
        $this->sessionToken = $session_token; // phpcs:ignore
        $this->expiresAt = $expires_at; // phpcs:ignore
        $this->dateCreated = $date_created; // phpcs:ignore
    }
}
