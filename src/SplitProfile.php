<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\AlpsFileNotReadableException;
use Koriym\AppStateDiagram\Exception\InvalidAlpsException;
use Koriym\AppStateDiagram\Exception\InvalidJsonException;
use Seld\JsonLint\ParsingException;
use stdClass;
use Throwable;

use function assert;
use function file_get_contents;
use function is_array;
use function is_object;
use function json_last_error;
use function json_last_error_msg;
use function property_exists;
use function sprintf;

final class SplitProfile
{
    /** @var array<string, array{0: object, 1: list<stdClass>}> */
    private static $instance;

    /**
     * @return array{0: object, 1: list<stdClass>}
     *
     * @throws ParsingException
     */
    public function __invoke(string $alpsFile): array
    {
        if (isset(self::$instance[$alpsFile])) {
            return self::$instance[$alpsFile];
        }

        try {
            $file = file_get_contents($alpsFile);
        } catch (Throwable $e) {
            throw new AlpsFileNotReadableException(sprintf('%s: %s', $e->getMessage(), $alpsFile));
        }

        $profile = (new JsonDecode())((string) $file);
        if (json_last_error()) {
            throw new InvalidJsonException(json_last_error_msg());
        }

        if (! property_exists($profile, 'alps') || ! is_object($profile->alps)) {
            throw new InvalidAlpsException($alpsFile);
        }

        if (! property_exists($profile->alps, 'descriptor') || ! is_array($profile->alps->descriptor)) {
            throw new InvalidAlpsException($alpsFile);
        }

        $descriptors = $profile->alps->descriptor;
        foreach ($descriptors as $descriptor) {
            assert($descriptor instanceof stdClass);
        }

        /** @var list<stdClass> $descriptors */
        self::$instance[$alpsFile] = [$profile, $descriptors];

        return self::$instance[$alpsFile];
    }
}
