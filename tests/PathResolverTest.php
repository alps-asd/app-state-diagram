<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;
use ReflectionMethod;

final class PathResolverTest extends TestCase
{
    public function testGetDotJsPathInDevelopmentMode(): void
    {
        // In development (non-PHAR), should find the local asd-sync/dot.js
        $dotJsPath = PathResolver::getDotJsPath();

        // Should be a valid path ending with dot.js
        $this->assertStringEndsWith('/asd-sync/dot.js', $dotJsPath);
        $this->assertFileExists($dotJsPath);
    }

    public function testPathResolverMethodSignature(): void
    {
        // Verify it's a static public method
        $reflection = new ReflectionMethod(PathResolver::class, 'getDotJsPath');
        $this->assertTrue($reflection->isStatic());
        $this->assertTrue($reflection->isPublic());
    }
}
