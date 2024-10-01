<?php

use Koriym\AppStateDiagram\Asd;

require dirname(__DIR__) . '/vendor/autoload.php';

// リクエストの Content-Type ヘッダーを取得
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

// 一時ファイルのディレクトリを設定（適切な権限があることを確認してください）
$tempDir = sys_get_temp_dir();

// Content-Type に基づいて処理を分岐
if (strpos($contentType, 'application/xml') !== false) {
    // XMLの場合の処理
    $data = file_get_contents('php://input');
    $fileExtension = '.xml';
    $contentDescription = 'XML';
} elseif (strpos($contentType, 'application/json') !== false) {
    // JSONの場合の処理
    $data = file_get_contents('php://input');
    $fileExtension = '.json';
    $contentDescription = 'JSON';
} else {
    // XMLとJSON以外のContent-Typeの場合は400 Bad Requestを返す
    http_response_code(400);
    echo "エラー: 未対応のContent-Type。XMLまたはJSONのみ受け付けます。";
    exit;
}

// 一時ファイルを作成
$tempFile = tempnam($tempDir, 'data_');
$tempFileWithExtension = $tempFile . $fileExtension;
rename($tempFile, $tempFileWithExtension);

// データを一時ファイルに書き込む
if (file_put_contents($tempFileWithExtension, $data) === false) {
    http_response_code(500);
    echo "エラー: 一時ファイルの作成に失敗しました。";
    exit;
}

http_response_code(200);
echo (new Asd())($tempFileWithExtension);
