#!/bin/bash

# Quick Demo Script for alps2dot comparison

echo "🚀 Quick Demo: PHP vs TypeScript alps2dot"
echo "=========================================="

# テストファイル
test_file="docs/bookstore/alps.xml"

echo ""
echo "📁 Testing with: $test_file"
echo ""

# PHP版で生成
echo "🐘 PHP version:"
php -r "
require_once 'vendor/autoload.php';
use Koriym\AppStateDiagram\DrawDiagram;
use Koriym\AppStateDiagram\Profile;
use Koriym\AppStateDiagram\LabelName;

\$profile = new Profile('$test_file', new LabelName());
\$drawDiagram = new DrawDiagram();
\$dot = \$drawDiagram(\$profile, new LabelName());
file_put_contents('php_demo.dot', \$dot);
echo 'Generated: php_demo.dot\n';
"

# TypeScript版で生成
echo "🟦 TypeScript version:"
node alps2dot/dist/cli.js "$test_file" -o ts_demo.dot
echo "Generated: ts_demo.dot"

echo ""
echo "🔍 Comparing outputs..."
if diff php_demo.dot ts_demo.dot > /dev/null 2>&1; then
    echo "🎉 IDENTICAL! Perfect match!"
else
    echo "📝 Checking differences..."
    echo "Lines different: $(diff php_demo.dot ts_demo.dot | wc -l)"
    echo ""
    echo "First few differences:"
    diff php_demo.dot ts_demo.dot | head -10
fi

echo ""
echo "📊 File sizes:"
echo "PHP:        $(wc -l < php_demo.dot) lines, $(wc -c < php_demo.dot) bytes"
echo "TypeScript: $(wc -l < ts_demo.dot) lines, $(wc -c < ts_demo.dot) bytes"

echo ""
echo "✅ Demo completed! Check php_demo.dot and ts_demo.dot for detailed comparison."