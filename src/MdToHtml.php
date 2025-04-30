<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Michelf\MarkdownExtra;

final class MdToHtml
{
    public const STYLE = '<style>
        body {
            background-color: white;
        }
        .markdown-body {
            box-sizing: border-box;
            min-width: 200px;
            max-width: 1100px;
            margin: 0 auto;
            padding: 25px;
        }
    
        @media (max-width: 767px) {
            .markdown-body {
                padding: 15px;
            }
        }
        
        /* テーブルレイアウトの改善 */
        .markdown-body table {
            table-layout: fixed;
            width: 100%;
            max-width: 1100px;
        }
        .markdown-body table th:nth-child(1) {
            width: 5%;
        }
        .markdown-body table th:nth-child(2) {
            width: 15%;
        }
        .markdown-body table th:nth-child(3) {
            width: 50%;
        }
        .markdown-body table th:nth-child(4) {
            width: 15%;
        }
        .markdown-body table th:nth-child(5) {
            width: 15%;  /* Extras列をさらに狭く（docが極端に短くなるため） */
        }
        .markdown-body table td {
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        /* docツールチップのスタイル - データ表示のための実装 */
        .doc-tooltip {
            text-decoration: none;
            border-bottom: 1px dotted #666;
            cursor: pointer;
            position: relative;
            display: inline-block;
        }
        .doc-tooltip .tooltip-text {
            visibility: hidden;
            width: 300px;
            background-color: #f8f8f8;
            color: #333;
            text-align: left;
            border-radius: 3px;
            padding: 8px 12px;
            position: absolute;
            z-index: 1;
            bottom: 125%;
            left: 50%;
            margin-left: -150px;
            opacity: 0;
            transition: opacity 0.3s;
            border: 1px solid #ddd;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            font-size: inherit; /* 通常のテキストサイズを維持 */
            line-height: 1.5;
            white-space: normal;
            word-wrap: break-word;
        }
        .doc-tooltip:hover .tooltip-text {
            visibility: visible;
            opacity: 1;
        }
        
        /* 互換性のためのスタイル */
        .markdown-body abbr {
            text-decoration: none;
            border-bottom: 1px dotted #666;
            cursor: help;
            position: relative;
        }
        #svg-container {
            width: 100%;
            height: auto;
            display: flex;
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
        
        /* Sematic Descriptor List */
        .descriptor-list {
            max-width: 100%;
            margin: 0;
            padding: 20px;
        }
        .descriptor-list ul {
            list-style-type: none;
            padding: 0;
            margin: 0;
            width: 100%;
        }
        .descriptor-list li {
            margin-bottom: 5px;
            display: flex;
            align-items: center;
        }
        .descriptor-list .indicator {
            width: 16px;
            height: 16px;
            display: inline-block;
            margin-right: 8px;
            border: 1px solid #000;
        }
        .descriptor-list .semantic { 
            background-color: #FFFFFF; 
        }
        .descriptor-list .safe { 
            background-color: #00A86B;
            background-image: linear-gradient(45deg, #008000 25%, transparent 25%, transparent 75%, #008000 75%, #008000), 
                              linear-gradient(45deg, #008000 25%, transparent 25%, transparent 75%, #008000 75%, #008000);
            background-size: 8px 8px;
            background-position: 0 0, 4px 4px;
        }
        .descriptor-list .unsafe { 
            background-color: #FF4136;
            background-image: repeating-linear-gradient(45deg, #FF4136, #FF4136 4px, #FF725C 4px, #FF725C 8px);
        }
        
        .descriptor-list .idempotent { 
            background-color: #FFDC00;
            background-image: radial-gradient(#FFB700 20%, transparent 20%),
                              radial-gradient(#FFB700 20%, transparent 20%);
            background-size: 8px 8px;
            background-position: 0 0, 4px 4px;
        }
        .descriptor-list .item-name {
            color: #000;
            text-decoration: none;
        }
        
        .legend {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 10px;
            display: inline-flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 20px;
        }        
        table .legend {
            background-color: transparent;
            padding: 0;
            margin: 0;
            display: inline-flex;
            align-items: center;
        }
        .legend-item {
            display: flex;
            align-items: center;
            font-size: 14px;
            color: #333;
        }
        .legend-icon {
            width: 16px;
            height: 16px;
            border: 1px solid #000;
            margin-right: 8px;
        }
        .legend .semantic { background-color: #FFFFFF; }
        .legend .safe { 
            background-color: #00A86B;
            background-image: linear-gradient(45deg, #008000 25%, transparent 25%, transparent 75%, #008000 75%, #008000), 
                              linear-gradient(45deg, #008000 25%, transparent 25%, transparent 75%, #008000 75%, #008000);
            background-size: 8px 8px;
            background-position: 0 0, 4px 4px;
        }
        .legend .unsafe { 
            background-color: #FF4136;
            background-image: repeating-linear-gradient(45deg, #FF4136, #FF4136 4px, #FF725C 4px, #FF725C 8px);
        }
        .legend .idempotent { 
            background-color: #FFDC00;
            background-image: radial-gradient(#FFB700 20%, transparent 20%),
                              radial-gradient(#FFB700 20%, transparent 20%);
            background-size: 8px 8px;
            background-position: 0 0, 4px 4px;
        }
        /* 小さいサイズのタイプインジケーター */
        .type-indicator-small {
            display: inline-block;
            width: 10px;
            height: 10px;
            margin-right: 4px;
            border: 1px solid #000;
            vertical-align: middle;
        }
        
        .type-indicator-small.semantic {
            background-color: #FFFFFF;
        }
        
        .type-indicator-small.safe {
            background-color: #00A86B;
            background-image: linear-gradient(45deg, #008000 25%, transparent 25%, transparent 75%, #008000 75%, #008000),
                               linear-gradient(45deg, #008000 25%, transparent 25%, transparent 75%, #008000 75%, #008000);
            background-size: 6px 6px;
            background-position: 0 0, 3px 3px;
        }
        
        .type-indicator-small.unsafe {
            background-color: #FF4136;
            background-image: repeating-linear-gradient(45deg, #FF4136, #FF4136 3px, #FF725C 3px, #FF725C 6px);
        }
        
        .type-indicator-small.idempotent {
            background-color: #FFDC00;
            background-image: radial-gradient(#FFB700 20%, transparent 20%),
                              radial-gradient(#FFB700 20%, transparent 20%);
            background-size: 6px 6px;
            background-position: 0 0, 3px 3px;
        }
    </style>';

    public function __invoke(string $title, string $markdown): string
    {
        $style = self::STYLE;
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
