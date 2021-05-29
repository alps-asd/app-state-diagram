<?php

declare(strict_types=1);

namespace Koriym\XmlLoader;

use DOMDocument;
use Koriym\XmlLoader\Exception\InvalidXmlException;
use Koriym\XmlLoader\Exception\XmlFileNotFoundException;
use SimpleXMLElement;

use function assert;
use function dirname;
use function file_exists;
use function file_get_contents;
use function getcwd;
use function is_dir;
use function libxml_clear_errors;
use function libxml_get_errors;
use function libxml_use_internal_errors;
use function realpath;
use function simplexml_load_string;
use function sprintf;
use function substr;

use const LIBXML_ERR_ERROR;
use const LIBXML_ERR_FATAL;

final class XmlLoader
{
    public function __invoke(string $xmlPath, string $xsdPath): SimpleXMLElement
    {
        $xmlFullPath = $this->locateConfigFile($xmlPath);
        $contents = (string) file_get_contents($xmlFullPath);
        $this->validate($xmlFullPath, $xsdPath);
        $simpleXml = simplexml_load_string($contents);
        assert($simpleXml instanceof SimpleXMLElement);

        return $simpleXml;
    }

    public function locateConfigFile(string $path): string
    {
        if (file_exists($path)) {
            return $path;
        }

        $maybePath = sprintf('%s/%s', getcwd(), $path);
        if (file_exists($maybePath) && ! is_dir($maybePath)) {
            // @codeCoverageIgnoreStart
            return $maybePath;
        }

        $dirPath = realpath($path) ?: getcwd();
        if ($dirPath === false) {
            goto config_not_found;
        }

        if (! is_dir($dirPath)) { // @phpstan-ignore-line
            $dirPath = dirname($dirPath); // @phpstan-ignore-line
            // @codeCoverageIgnoreEnd
        }

        do {
            $maybePath = sprintf('%s/%s', $dirPath, 'apidoc.xml');
            if (file_exists($maybePath) || file_exists($maybePath .= '.dist')) {
                return $maybePath;
            }

            $dirPath = dirname($dirPath); // @phpstan-ignore-line
        } while (dirname($dirPath) !== $dirPath);

        config_not_found:

        throw new XmlFileNotFoundException($path);
    }

    /**
     * @@codeCoverageIgnore
     */
    private function validate(string $xmlFullPath, string $xsdPath): void
    {
        libxml_use_internal_errors(true);
        $dom = new DOMDocument();
        $dom->load($xmlFullPath);
        if (@$dom->schemaValidate($xsdPath)) {
            return;
        }

        $this->error();
    }

    private function error(): void
    {
        $errors = libxml_get_errors();
        foreach ($errors as $error) {
            if ($error->level === LIBXML_ERR_FATAL || $error->level === LIBXML_ERR_ERROR) {
                libxml_clear_errors();

                $msg = sprintf('%s in %s:%s', substr($error->message, 0, -2), $error->file, $error->line);

                throw new InvalidXmlException($msg);
                // @codeCoverageIgnoreStart
            }
        }
    }

    // @codeCoverageIgnoreEnd
}
