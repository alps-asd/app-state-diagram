<?php

declare(strict_types=1);

use Koriym\SqlQuality\AIQueryAdvisor;
use Koriym\SqlQuality\ExplainAnalyzer;
use Koriym\SqlQuality\SqlFileAnalyzer;

require dirname(__DIR__) . '/vendor/autoload.php';

// Database connection
$dbPath = dirname(__DIR__) . '/var/db/development.sq3.sqlite3';
$dsn = 'sqlite:' . $dbPath;

try {
    $pdo = new PDO($dsn);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Analyzing SQL files in var/sql/\n";
    echo "================================\n\n";

    // SQL directory
    $sqlDir = dirname(__DIR__) . '/var/sql';

    // Output directory
    $outputDir = dirname(__DIR__) . '/var/sql-analysis';
    if (!is_dir($outputDir)) {
        mkdir($outputDir, 0755, true);
    }

    // Prepare sample parameters for each SQL file
    $sampleId = 'fafab1168a5a7ee9a376f945e178ad68';
    $sampleToken = 'b276ab38c12bf529036475149bb6d450e5ad0a34262ec4bf4bff0c53275e5380';

    $sqlParams = [
        // User queries
        'user_list.sql' => [],
        'user_item.sql' => ['id' => $sampleId],
        'user_add.sql' => [
            'id' => $sampleId,
            'username' => 'testuser',
            'email' => 'test@example.com',
            'passwordHash' => '$2y$12$hzjAg5q3zbnfNKwU28ElHeI4nqyyXeZBffk1FsFevlO6hmhcTEd4K',
            'dateCreated' => '2025-12-12 02:39:18',
        ],
        'user_update.sql' => [
            'id' => $sampleId,
            'username' => 'testuser2',
            'email' => 'test2@example.com',
        ],
        'user_delete.sql' => ['id' => $sampleId],

        // Session queries
        'session_list_by_user.sql' => ['userId' => $sampleId],
        'session_item.sql' => ['id' => $sampleId],
        'session_item_by_token.sql' => ['sessionToken' => $sampleToken],
        'session_add.sql' => [
            'id' => $sampleId,
            'userId' => $sampleId,
            'sessionToken' => $sampleToken,
            'expiresAt' => '2025-12-13 02:39:30',
            'dateCreated' => '2025-12-12 02:39:18',
        ],
        'session_delete.sql' => ['id' => $sampleId],
        'session_delete_by_token.sql' => ['sessionToken' => $sampleToken],
        'session_delete_expired.sql' => [],
    ];

    // Create analyzer
    $analyzer = new SqlFileAnalyzer(
        $pdo,
        new ExplainAnalyzer(),
        $sqlDir,
        new AIQueryAdvisor('Provide analysis in Japanese. Focus on SQLite-specific optimizations.')
    );

    // Analyze SQL directory
    $analyzer->analyzeSqlDirectory($sqlParams, $outputDir);

    echo "\nAnalysis complete! Reports saved to: $outputDir\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
