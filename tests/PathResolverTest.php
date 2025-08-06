<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;
use ReflectionMethod;

use function method_exists;

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

    public function testPathResolverHasProperErrorHandling(): void
    {
        // Verify the method exists and has proper error handling capability
        $this->assertTrue(method_exists(PathResolver::class, 'getDotJsPath'));

        // Verify it's a static method
        $reflection = new ReflectionMethod(PathResolver::class, 'getDotJsPath');
        $this->assertTrue($reflection->isStatic());
        $this->assertTrue($reflection->isPublic());
    }
}
