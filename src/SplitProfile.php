<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\AlpsFileNotReadableException;
use Koriym\AppStateDiagram\Exception\InvalidAlpsException;
use Koriym\AppStateDiagram\Exception\InvalidXmlException;
use Seld\JsonLint\ParsingException;
use SplFileInfo;
use stdClass;
use Throwable;

use function assert;
use function file_get_contents;
use function is_array;
use function is_object;
use function is_string;
use function json_encode;
use function property_exists;
use function simplexml_load_string;
use function sprintf;
use function xmlToArray;

use const JSON_PRETTY_PRINT;

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
            $fileContent = (string) file_get_contents($alpsFile);
        } catch (Throwable $e) {
            throw new AlpsFileNotReadableException(sprintf('%s: %s', $e->getMessage(), $alpsFile));
        }

        $profile = $this->getJson($fileContent, $alpsFile);
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

    private function getJson(string $fileContent, string $alpsFile): object
    {
        return (new JsonDecode())($this->getJsonString($fileContent, $alpsFile));
    }

    private function getJsonString(string $fileContent, string $alpsFile): string
    {
        $isXml = (new SplFileInfo($alpsFile))->getExtension() === 'xml';
        if (! $isXml) {
            return $fileContent;
        }

        $simpleXml = simplexml_load_string($fileContent);
        if (! $simpleXml) {
            throw new InvalidXmlException($fileContent);
        }

        $array = xmlToArray($simpleXml, ['attributePrefix' => '', 'textContent' => 'value']);
        if (isset($array['alps']['doc']) && is_string($array['alps']['doc'])) {
            $array['alps']['doc'] = ['value' => $array['alps']['doc']];
        }

        return (string) json_encode($array, JSON_PRETTY_PRINT);
    }
}
