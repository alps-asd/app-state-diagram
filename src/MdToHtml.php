<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Michelf\MarkdownExtra;

final class MdToHtml
{
    public function __invoke(string $title, string $markdown): string
    {
        $htmlDiv = MarkdownExtra::defaultTransform($markdown);

        return /** @lang HTML */<<<EOT
<html lang="en">
<head>
    <title>{$title}</title>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/3.0.1/github-markdown.min.css">
    <link rel="stylesheet" href="https://alps-asd.github.io/app-state-diagram/assets/css/main.css">
    <script type="text/javascript" src="https://alps-asd.github.io/app-state-diagram/assets/js/table.js"></script>
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
