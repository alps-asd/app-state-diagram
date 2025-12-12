<?php

declare(strict_types=1);

namespace AsdDemo\OidcApp\Resource\App;

use AsdDemo\OidcApp\Query\UserCommandInterface;
use AsdDemo\OidcApp\Query\UserQueryInterface;
use BEAR\Resource\Annotation\JsonSchema;
use BEAR\Resource\ResourceObject;

use function array_map;
use function bin2hex;
use function password_hash;
use function random_bytes;

use const PASSWORD_BCRYPT;

class User extends ResourceObject
{
    public function __construct(
        private readonly UserQueryInterface $query,
        private readonly UserCommandInterface $command,
    ) {
    }

    #[JsonSchema(schema: 'user.json')]
    public function onGet(string $id = ''): static
    {
        if ($id === '') {
            // List all users
            $users = $this->query->list();
            $this->body = [
                'users' => array_map(static fn ($user) => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'dateCreated' => $user->dateCreated,
                ], $users),
            ];

            return $this;
        }

        // Get single user
        $item = $this->query->item($id);
        if ($item === null) {
            $this->code = 404;

            return $this;
        }

        $this->body = [
            'id' => $item->id,
            'username' => $item->username,
            'email' => $item->email,
            'dateCreated' => $item->dateCreated,
        ];

        return $this;
    }

    #[JsonSchema(schema: 'user-post.json')]
    public function onPost(string $username, string $email, string $password): static
    {
        $id = $this->generateId();
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        $this->command->add($id, $username, $email, $passwordHash);

        $this->code = 201;
        $this->headers['Location'] = "/user?id={$id}";
        $this->body = ['id' => $id];

        return $this;
    }

    #[JsonSchema(schema: 'user-put.json')]
    public function onPut(string $id, string $username, string $email): static
    {
        $item = $this->query->item($id);
        if ($item === null) {
            $this->code = 404;

            return $this;
        }

        $this->command->update($id, $username, $email);
        $this->code = 200;
        $this->body = ['id' => $id];

        return $this;
    }

    public function onDelete(string $id): static
    {
        $item = $this->query->item($id);
        if ($item === null) {
            $this->code = 404;

            return $this;
        }

        $this->command->delete($id);
        $this->code = 204;

        return $this;
    }

    private function generateId(): string
    {
        return bin2hex(random_bytes(16));
    }
}
