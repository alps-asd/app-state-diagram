<?php

declare(strict_types=1);

namespace AsdDemo\OidcApp\Query;

use DateTimeInterface;
use Ray\MediaQuery\Annotation\DbQuery;

interface SessionCommandInterface
{
    #[DbQuery('session_add')]
    public function add(
        string $id,
        string $userId,
        string $sessionToken,
        DateTimeInterface $expiresAt,
        DateTimeInterface|null $dateCreated = null,
    ): void;

    #[DbQuery('session_delete')]
    public function delete(string $id): void;

    #[DbQuery('session_delete_by_token')]
    public function deleteByToken(string $sessionToken): void;

    #[DbQuery('session_delete_expired')]
    public function deleteExpired(DateTimeInterface $now): void;
}
