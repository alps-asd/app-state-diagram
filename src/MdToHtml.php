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
          margin: 0;
          max-width: none;
          padding: 0 24px; 
        }
    
        @media (max-width: 767px) {
            .markdown-body {
                padding: 0 16px;
            }
        }
        
        /* テーブルレイアウトの改善 */
        .markdown-body table {
            table-layout: fixed;
            width: 100%;
            max-width: 1200px;
        }
        .markdown-body table th:nth-child(1) {
            width: 2%;
        }
        .markdown-body table th:nth-child(2) {
            width: 15%;
        }
        .markdown-body table th:nth-child(3) {
            width: 30%;
        }
        .markdown-body table th:nth-child(4) {
            width: 25%;
        }
        .markdown-body table th:nth-child(5) {
            width: 28%;  /* Extras列をさらに狭く（docが極端に短くなるため） */
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
            font-size: inherit;
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
            /* 既存のスタイルも維持 */
            height: auto;
            display: flex;
            justify-content: flex-start; /* SVGが小さい場合に左寄せ */
            align-items: center;
            overflow-x: auto; /* SVGがコンテナ幅を超える場合に水平スクロールを表示 */

            /* ↓↓↓ ここから追加・変更 ↓↓↓ */
            width: 100vw; /* ビューポート（表示領域）の幅いっぱいに設定 */
            max-width: none; /* 親要素(.markdown-body)のmax-width制限を解除 */
            box-sizing: border-box; /* paddingやborderを幅計算に含める */

            /*
             * .markdown-body の margin: 0 auto による中央揃えを打ち消し、
             * 左端に合わせるためのネガティブマージン。
             * calc(50% - 50vw) は、中央からビューポート幅の半分だけ左にずらす計算。
             */
            margin-left: calc(50% - 50vw);
            margin-right: calc(50% - 50vw); /* 同様に右マージンも設定（厳密には不要な場合も）*/

            /* 必要に応じて左右に少しパディングを追加して、画面端にくっつきすぎないようにする */
            /* padding-left: 15px; */
            /* padding-right: 15px; */
            /* ↑ 必要であればコメント解除してください */
        }

        /* SVG要素自体が大きい場合に正しく表示されるように */
        #svg-container svg {
            max-width: none; /* SVG自体の最大幅制限も解除（必要に応じて） */
            display: block; /* または inline-block */
            margin: 0 auto; /* SVGをコンテナ内で中央に置きたい場合 */
            /* justify-content: flex-start; を使う場合は margin: 0; の方が良いかも */
            margin: 0;
        }        .asd-view-selector {
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
            flex-wrap: wrap; 
            align-items: center;
            gap: 8px 12px;
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
    .meta-container {
      display: flex;
      flex-direction: column;
      gap: 4px; 
    }
    
    .meta-item {
        display: flex;
        align-items: center;
        line-height: 1.0;
    }
    
    .meta-label {
        font-size: 0.85em;
        color: #777;
        width: 45px;
        text-align: right;
        padding-right: 10px;
        flex-shrink: 0;
    }
    
    .meta-values {
      display: inline-flex;
      flex-wrap: wrap;
    }
    
    .meta-tag {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 4px;
        font-size: 0.8em;
        background-color: #f7f7f7;
        border: 1px solid #e0e0e0;
        color: #3b71ca;
        margin: 0 8px 4px 0;
    }

    .def-tag {
      background-color: #EAF5FF; /* 薄いブルー */
      border-color:     #B8DFFF; /* やや濃いめ */
      color:            #0366D6; /* リンク色っぽいブルー */
    }
    
    .rt-tag {
      background-color: #FFF5E6; /* 薄いオレンジ */
      border-color:     #FFE1B3;
      color:            #D97506; /* 濃いオレンジ */
    }
    
    .tag-tag {
      background-color: #E6FFED; /* 薄いグリーン */
      border-color:     #C6EFC7;
      color:            #22863A; /* 濃いグリーン */
    }
    
    .doc-tag {
        background-color: #f7f7f7;
        color: grey;
        border: 1px solid lightgray;
        overflow: visible !important;
    }
    
    /* テーブルセル内でのメタ情報の折り返し */
    .markdown-body table td:nth-child(5) {
        padding-left: 4px !important;
        vertical-align: middle;
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
