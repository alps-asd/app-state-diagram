<?php

declare(strict_types=1);

namespace AsdDemo\OidcApp\Query;

use AsdDemo\OidcApp\Entity\User;
use Ray\MediaQuery\Annotation\DbQuery;

interface UserQueryInterface
{
    #[DbQuery('user_item')]
    public function item(string $id): User|null;

    /** @return array<User> */
    #[DbQuery('user_list')]
    public function list(): array;
}
