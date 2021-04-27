<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\InvalidAlpsException;
use Seld\JsonLint\JsonParser;
use Seld\JsonLint\ParsingException;
use UnexpectedValueException;

use function assert;
use function defined;
use function is_object;
use function json_decode;
use function json_last_error;
use function property_exists;

use const JSON_ERROR_UTF8;

final class JsonDecode
{
    public function __invoke(string $jsonString): object
    {
        $json = json_decode($jsonString, false);
        if (json_last_error()) {
            throw $this->getJsonErrorMsg($jsonString);
        }

        assert(is_object($json));

        if (! property_exists($json, 'alps')) {
            throw new InvalidAlpsException('No apls attribute found');
        }

        return $json;
    }

    /**
     * Better json error message
     *
     * Taken from [how Composer uses this library] in https://github.com/Seldaek/jsonlint
     *
     * @see https://github.com/composer/composer/blob/56edd53046fd697d32b2fd2fbaf45af5d7951671/src/Composer/Json/JsonFile.php#L283-L318
     */
    private function getJsonErrorMsg(string $json): ParsingException
    {
        $result = (new JsonParser())->lint($json);
        if (defined('JSON_ERROR_UTF8') && json_last_error() === JSON_ERROR_UTF8) {
            throw new UnexpectedValueException('"' . $json . '" is not UTF-8, could not parse as JSON');
        }

        assert($result instanceof ParsingException);

        return new ParsingException('"' . $json . '" does not contain valid JSON' . "\n" . $result->getMessage(), $result->getDetails());
    }
}
