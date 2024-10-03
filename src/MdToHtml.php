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
        #svg-container {
            width: 100%;
            height: auto;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .asd-view-selector {
            display: flex;
            align-items: center;
            margin-top: 40px;
            margin-bottom: 10px;
        }
        .asd-view-selector label {
            margin-right: 10px;
        }
        .asd-view-selector input[type="radio"] {
            margin-right: 5px;
        }
        .selector-container {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        .selector-label {
            min-width: 40px;
            margin-right: 10px;
        }
        .selector-options {
            display: flex;
        }
        .selector-option {
            margin-right: 15px;
        }
        input[type="radio"],
        input[type="checkbox"] {
            margin-right: 2px;
            vertical-align: middle;
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
