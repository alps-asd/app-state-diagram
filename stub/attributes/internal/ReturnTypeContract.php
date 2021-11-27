<?php

declare(strict_types=1);

namespace JetBrains\PhpStorm\Internal;

use Attribute;

/**
 * For PhpStorm internal use only
 *
 * @internal
 */
#[Attribute(Attribute::TARGET_PARAMETER)]
class ReturnTypeContract
{
    public function __construct(
        string $true = '',
        string $false = '',
        string $exists = '',
        string $notExists = ''
    ) {
    }
}
