<?php

declare(strict_types=1);

namespace AsdDemo\OidcApp\Query;

use AsdDemo\OidcApp\Entity\Session;
use Ray\MediaQuery\Annotation\DbQuery;

interface SessionQueryInterface
{
    #[DbQuery('session_item')]
    public function item(string $id): Session|null;

    #[DbQuery('session_item_by_token')]
    public function itemByToken(string $sessionToken): Session|null;

    /** @return array<Session> */
    #[DbQuery('session_list_by_user')]
    public function listByUser(string $userId): array;
}
