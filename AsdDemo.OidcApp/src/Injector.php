<?php

declare(strict_types=1);

namespace AsdDemo\OidcApp;

use BEAR\Package\Injector as PackageInjector;
use Ray\Di\AbstractModule;
use Ray\Di\InjectorInterface;

use function dirname;

/** @SuppressWarnings("PHPMD.StaticAccess") */
final class Injector
{
    /** @codeCoverageIgnore */
    private function __construct()
    {
    }

    /** @param non-empty-string $context */
    public static function getInstance(string $context): InjectorInterface
    {
        return PackageInjector::getInstance(__NAMESPACE__, $context, dirname(__DIR__));
    }

    /** @param non-empty-string $context */
    public static function getOverrideInstance(string $context, AbstractModule $overrideModule): InjectorInterface
    {
        return PackageInjector::getOverrideInstance(__NAMESPACE__, $context, dirname(__DIR__), $overrideModule);
    }
}
