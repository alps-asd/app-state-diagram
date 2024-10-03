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
    <style>
        body {
            background-color: white;
        }
        .markdown-body {
            box-sizing: border-box;
            min-width: 200px;
            max-width: 980px;
            margin: 0 auto;
            padding: 25px;
        }
    
        @media (max-width: 767px) {
            .markdown-body {
                padding: 15px;
            }
        }
        .asd-view-selector {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
        }
        #svg-container {
            width: 100%;
            height: 80vh; /* ビューポートの高さの80%を使用 */
            display: flex;
            justify-content: center;
            align-items: center;
        }
        #asd-graph-id {
            width: 100%;
            height: 100%;
        }
        #asd-graph-id svg {
            width: 100%;
            height: auto;
        }
    </style>
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
