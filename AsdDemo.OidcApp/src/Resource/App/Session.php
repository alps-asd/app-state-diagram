<?php

declare(strict_types=1);

namespace AsdDemo\OidcApp\Resource\App;

use AsdDemo\OidcApp\Query\SessionCommandInterface;
use AsdDemo\OidcApp\Query\SessionQueryInterface;
use AsdDemo\OidcApp\Query\UserQueryInterface;
use BEAR\Resource\Annotation\JsonSchema;
use BEAR\Resource\ResourceObject;
use DateTime;

use function bin2hex;
use function password_verify;
use function random_bytes;

class Session extends ResourceObject
{
    public function __construct(
        private readonly SessionQueryInterface $query,
        private readonly SessionCommandInterface $command,
        private readonly UserQueryInterface $userQuery,
    ) {
    }

    #[JsonSchema(schema: 'session.json')]
    public function onGet(string $sessionToken): static
    {
        $item = $this->query->itemByToken($sessionToken);
        if ($item === null) {
            $this->code = 404;

            return $this;
        }

        $this->body = [
            'id' => $item->id,
            'userId' => $item->userId,
            'sessionToken' => $item->sessionToken,
            'expiresAt' => $item->expiresAt,
            'dateCreated' => $item->dateCreated,
        ];

        return $this;
    }

    #[JsonSchema(schema: 'session-post.json')]
    public function onPost(string $username, string $password): static
    {
        // Find user by username
        $users = $this->userQuery->list();
        $user = null;
        foreach ($users as $u) {
            if ($u->username === $username) {
                $user = $u;
                break;
            }
        }

        if ($user === null || ! password_verify($password, $user->passwordHash)) {
            $this->code = 401;
            $this->body = ['error' => 'Invalid username or password'];

            return $this;
        }

        // Create session
        $id = $this->generateId();
        $sessionToken = $this->generateToken();
        $expiresAt = new DateTime('+1 day');

        $this->command->add($id, $user->id, $sessionToken, $expiresAt);

        $this->code = 201;
        $this->body = [
            'sessionToken' => $sessionToken,
            'expiresAt' => $expiresAt->format('Y-m-d H:i:s'),
        ];

        return $this;
    }

    public function onDelete(string $sessionToken): static
    {
        $item = $this->query->itemByToken($sessionToken);
        if ($item === null) {
            $this->code = 404;

            return $this;
        }

        $this->command->deleteByToken($sessionToken);
        $this->code = 204;

        return $this;
    }

    private function generateId(): string
    {
        return bin2hex(random_bytes(16));
    }

    private function generateToken(): string
    {
        return bin2hex(random_bytes(32));
    }
}
