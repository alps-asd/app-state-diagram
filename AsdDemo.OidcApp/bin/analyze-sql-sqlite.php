<?php

declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

// Database connection
$dbPath = dirname(__DIR__) . '/var/db/development.sq3.sqlite3';
$dsn = 'sqlite:' . $dbPath;

$pdo = new PDO($dsn);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "SQL Performance Analysis for SQLite\n";
echo "====================================\n\n";

// SQL directory
$sqlDir = dirname(__DIR__) . '/var/sql';

// Output file
$outputFile = dirname(__DIR__) . '/var/sql-analysis/sqlite-analysis.md';
$outputDir = dirname($outputFile);
if (!is_dir($outputDir)) {
    mkdir($outputDir, 0755, true);
}

$output = "# SQL Performance Analysis (SQLite)\n\n";
$output .= "Generated: " . date('Y-m-d H:i:s') . "\n\n";
$output .= "## Index Usage Analysis\n\n";

// Sample parameters
$sampleId = 'fafab1168a5a7ee9a376f945e178ad68';
$sampleToken = 'b276ab38c12bf529036475149bb6d450e5ad0a34262ec4bf4bff0c53275e5380';

$sqlFiles = [
    'user_list.sql' => [],
    'user_item.sql' => ['id' => $sampleId],
    'session_item_by_token.sql' => ['sessionToken' => $sampleToken],
    'session_list_by_user.sql' => ['userId' => $sampleId],
];

foreach ($sqlFiles as $filename => $params) {
    $filepath = $sqlDir . '/' . $filename;
    if (!file_exists($filepath)) {
        continue;
    }

    $sql = file_get_contents($filepath);

    // Remove comments
    $sql = preg_replace('/\/\*.*?\*\//s', '', $sql);
    $sql = trim($sql);

    if (empty($sql)) {
        continue;
    }

    $output .= "### $filename\n\n";
    $output .= "```sql\n$sql\n```\n\n";

    // Bind parameters
    $boundSql = $sql;
    foreach ($params as $key => $value) {
        $boundSql = str_replace(':' . $key, "'" . $value . "'", $boundSql);
    }

    // Execute EXPLAIN QUERY PLAN
    try {
        $explainSql = "EXPLAIN QUERY PLAN " . $boundSql;
        $stmt = $pdo->query($explainSql);
        $plan = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $output .= "**Query Plan:**\n\n";
        $output .= "| id | parent | notused | detail |\n";
        $output .= "|----|--------|---------|--------|\n";

        foreach ($plan as $row) {
            $output .= sprintf(
                "| %s | %s | %s | %s |\n",
                $row['id'],
                $row['parent'],
                $row['notused'],
                $row['detail']
            );
        }

        $output .= "\n";

        // Analyze the plan
        $issues = [];
        $recommendations = [];

        foreach ($plan as $row) {
            $detail = $row['detail'];

            // Check for table scans
            if (stripos($detail, 'SCAN TABLE') !== false) {
                $issues[] = "⚠️ Full table scan detected";
                $recommendations[] = "Consider adding an index on the columns used in WHERE clause";
            }

            // Check for index usage
            if (stripos($detail, 'USING INDEX') !== false) {
                $recommendations[] = "✅ Index is being used effectively";
            }

            // Check for covering index
            if (stripos($detail, 'USING COVERING INDEX') !== false) {
                $recommendations[] = "✅ Covering index is being used (optimal)";
            }
        }

        if (!empty($issues)) {
            $output .= "**Issues:**\n\n";
            foreach ($issues as $issue) {
                $output .= "- $issue\n";
            }
            $output .= "\n";
        }

        if (!empty($recommendations)) {
            $output .= "**Analysis:**\n\n";
            foreach ($recommendations as $rec) {
                $output .= "- $rec\n";
            }
            $output .= "\n";
        }

    } catch (PDOException $e) {
        $output .= "**Error:** " . $e->getMessage() . "\n\n";
    }

    $output .= "---\n\n";
}

// Check existing indexes
$output .= "## Existing Indexes\n\n";

$tables = ['user', 'session'];

foreach ($tables as $table) {
    $output .= "### Table: $table\n\n";

    // Get index list
    $stmt = $pdo->query("PRAGMA index_list($table)");
    $indexes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($indexes)) {
        $output .= "No indexes found.\n\n";
        continue;
    }

    foreach ($indexes as $index) {
        $indexName = $index['name'];
        $unique = $index['unique'] ? 'UNIQUE' : 'NON-UNIQUE';

        $output .= "**Index:** `$indexName` ($unique)\n";

        // Get index columns
        $stmt = $pdo->query("PRAGMA index_info($indexName)");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $output .= "- Columns: ";
        $columnNames = array_map(fn($c) => $c['name'], $columns);
        $output .= implode(', ', $columnNames) . "\n\n";
    }
}

// Recommendations
$output .= "## Optimization Recommendations\n\n";
$output .= "### Current Status\n\n";
$output .= "✅ **Good practices:**\n";
$output .= "- Primary keys are defined on all tables\n";
$output .= "- Unique constraints on `user.username` and `user.email`\n";
$output .= "- Unique constraint on `session.session_token`\n";
$output .= "- Foreign key with CASCADE DELETE on `session.user_id`\n";
$output .= "- Index on `session.expires_at` for cleanup queries\n\n";

$output .= "### Potential Improvements\n\n";
$output .= "1. **Consider Composite Indexes:**\n";
$output .= "   - If you frequently query sessions by both `user_id` and `expires_at`, consider:\n";
$output .= "     ```sql\n";
$output .= "     CREATE INDEX idx_session_user_expires ON session(user_id, expires_at);\n";
$output .= "     ```\n\n";

$output .= "2. **Query Optimization:**\n";
$output .= "   - Use `datetime('now')` instead of `NOW()` for SQLite compatibility ✅ (already done)\n";
$output .= "   - Ensure all queries use indexed columns in WHERE clauses\n\n";

$output .= "3. **Performance Monitoring:**\n";
$output .= "   - Run `ANALYZE` periodically to update statistics:\n";
$output .= "     ```sql\n";
$output .= "     ANALYZE;\n";
$output .= "     ```\n\n";

$output .= "4. **For Production:**\n";
$output .= "   - Consider migrating to MySQL/PostgreSQL for better performance at scale\n";
$output .= "   - SQLite is excellent for development and small-scale deployments\n\n";

file_put_contents($outputFile, $output);

echo "Analysis complete!\n";
echo "Report saved to: $outputFile\n\n";

// Display the report
echo $output;
