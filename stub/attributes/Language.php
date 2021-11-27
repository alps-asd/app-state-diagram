<?php

declare(strict_types=1);

namespace JetBrains\PhpStorm;

use Attribute;

/**
 * Specifies that the parameter is a string that represents source code in a different language.
 * An IDE will automatically inject the specified language into the passed string literals.
 */
#[Attribute(Attribute::TARGET_PARAMETER)]
class Language
{
    /**
     * @param string $languageName Language name like "PHP", "SQL", "RegExp", etc...
     */
    public function __construct(string $languageName)
    {
    }
}
