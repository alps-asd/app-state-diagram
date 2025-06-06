<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Michelf\MarkdownExtra;

use function dirname;
use function file_exists;
use function file_get_contents;
use function sprintf;

final class MdToHtml
{
    public const STYLE = '<style>
     </style>';

    public function __invoke(string $title, string $markdown): string
    {
        $inclineCss = dirname(__DIR__) . '/docs/assets/css/main.css';
        $isDevelop = file_exists($inclineCss) && file_exists(dirname(__DIR__) . '/.develop');
        $style = $isDevelop
            ? sprintf('<style>%s</style>', (string) file_get_contents($inclineCss))
            : '<link rel="stylesheet" href="https://www.app-state-diagram.com/app-state-diagram/assets/css/main.css">'; // @codeCoverageIgnore
        $htmlDiv = MarkdownExtra::defaultTransform($markdown);

        return /** @lang HTML */<<<EOT
<html lang="en">
<head>
    <title>{$title}</title>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/3.0.1/github-markdown.min.css">
    {$style}
</head>
<body>
    <div class="markdown-body">
        {$htmlDiv}
    </div>
</body>
</html>
EOT;
    }
}
