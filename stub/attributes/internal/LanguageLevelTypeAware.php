<?php

declare(strict_types=1);

namespace JetBrains\PhpStorm\Internal;

use Attribute;

/**
 * For PhpStorm internal use only
 *
 * @internal
 */
#[Attribute(Attribute::TARGET_FUNCTION | Attribute::TARGET_METHOD | Attribute::TARGET_PARAMETER)]
class LanguageLevelTypeAware
{
    public function __construct(array $languageLevelTypeMap, string $default)
    {
    }
}
