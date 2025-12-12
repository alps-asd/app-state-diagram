<?php

declare(strict_types=1);

namespace AsdDemo\OidcApp\Query;

use DateTimeInterface;
use Ray\MediaQuery\Annotation\DbQuery;

interface UserCommandInterface
{
    #[DbQuery('user_add')]
    public function add(
        string $id,
        string $username,
        string $email,
        string $passwordHash,
        DateTimeInterface|null $dateCreated = null,
    ): void;

    #[DbQuery('user_update')]
    public function update(
        string $id,
        string $username,
        string $email,
    ): void;

    #[DbQuery('user_delete')]
    public function delete(string $id): void;
}
