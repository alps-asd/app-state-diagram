#!/bin/bash

# Demo Comparison Script for PHP vs TypeScript alps2dot
# このスクリプトは各demoファイルでPHP版とTypeScript版の出力を比較します

set -e

echo "🚀 alps2dot Demo Comparison Script"
echo "=================================="

# TypeScript版のビルド確認
if [ ! -f "alps2dot/dist/cli.js" ]; then
    echo "📦 Building TypeScript version..."
    cd alps2dot && npm run build && cd ..
fi

# デモファイルのリスト
demos=(
    "docs/bookstore/alps.xml"
    "docs/bookstore/ja/alps.xml"
    "docs/amazon/alps.json"
    "docs/lms/alps.xml"
    "docs/lms/ja/alps.xml"
)

# 出力ディレクトリ作成
mkdir -p comparison_output

echo ""
echo "🔄 Comparing outputs for each demo file..."
echo ""

for demo in "${demos[@]}"; do
    if [ ! -f "$demo" ]; then
        echo "⚠️  File not found: $demo"
        continue
    fi
    
    filename=$(basename "$demo" .xml)
    dirname=$(dirname "$demo" | sed 's/docs\///g' | tr '/' '_')
    prefix="${dirname}_${filename}"
    
    echo "📁 Processing: $demo"
    
    # PHP版で生成
    echo "   🐘 PHP version..."
    php -r "
    require_once 'vendor/autoload.php';
    use Koriym\AppStateDiagram\DrawDiagram;
    use Koriym\AppStateDiagram\Profile;
    use Koriym\AppStateDiagram\LabelName;
    
    try {
        \$profile = new Profile('$demo', new LabelName());
        \$drawDiagram = new DrawDiagram();
        \$dot = \$drawDiagram(\$profile, new LabelName());
        file_put_contents('comparison_output/${prefix}_php.dot', \$dot);
        echo '     ✅ Generated comparison_output/${prefix}_php.dot\n';
    } catch (Exception \$e) {
        echo '     ❌ Error: ' . \$e->getMessage() . '\n';
    }
    "
    
    # TypeScript版で生成
    echo "   🟦 TypeScript version..."
    if node alps2dot/dist/cli.js "$demo" -o "comparison_output/${prefix}_ts.dot" 2>/dev/null; then
        echo "     ✅ Generated comparison_output/${prefix}_ts.dot"
    else
        echo "     ❌ Error generating TypeScript version"
        continue
    fi
    
    # 比較
    echo "   🔍 Comparing outputs..."
    if diff -u "comparison_output/${prefix}_php.dot" "comparison_output/${prefix}_ts.dot" > "comparison_output/${prefix}_diff.txt" 2>/dev/null; then
        echo "     🎉 IDENTICAL! No differences found."
        rm "comparison_output/${prefix}_diff.txt"
    else
        echo "     📝 Differences found. Saved to comparison_output/${prefix}_diff.txt"
        echo "        Lines different: $(wc -l < comparison_output/${prefix}_diff.txt)"
    fi
    
    echo ""
done

echo "📊 Summary"
echo "=========="
echo "Generated files in comparison_output/:"
ls -la comparison_output/ | grep -E '\.(dot|txt)$' | wc -l | xargs echo "Total files:"

echo ""
echo "🎯 Quick visual comparison (first few lines):"
echo "=============================================="
for demo in "${demos[@]}"; do
    if [ ! -f "$demo" ]; then
        continue
    fi
    
    filename=$(basename "$demo" .xml)
    dirname=$(dirname "$demo" | sed 's/docs\///g' | tr '/' '_')
    prefix="${dirname}_${prefix}"
    
    if [ -f "comparison_output/${prefix}_php.dot" ] && [ -f "comparison_output/${prefix}_ts.dot" ]; then
        echo ""
        echo "📄 $demo"
        echo "   PHP (first 5 lines):"
        head -5 "comparison_output/${prefix}_php.dot" | sed 's/^/     /'
        echo "   TypeScript (first 5 lines):"
        head -5 "comparison_output/${prefix}_ts.dot" | sed 's/^/     /'
    fi
done

echo ""
echo "✅ Demo comparison completed!"
echo "💡 Check comparison_output/ directory for detailed results."