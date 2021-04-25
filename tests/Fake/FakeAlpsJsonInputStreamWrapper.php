<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

final class FakeAlpsJsonInputStreamWrapper
{
    /** @var string */
    private $alpsFile;

    /** @var int */
    private $position;

    public function __construct()
    {
        $this->alpsFile = (string) file_get_contents(__DIR__ . '/remote_link.json');
        $this->position = 0;
    }

    public function stream_open(string $path): bool
    {
        return true;
    }

    public function stream_read(int $count): string
    {
        $ret = substr($this->alpsFile, $this->position, $count);
        $this->position += strlen($ret);
        return $ret;
    }

    /**
     * @return array<int|string, mixed>;
     */
    public function stream_stat(): array
    {
        return [];
    }

    public function stream_eof(): bool
    {
        return $this->position >= strlen($this->alpsFile);
    }

    /**
     * @return array<int|string, mixed>;
     */
    public function url_stat(): array
    {
        return [];
    }
}
