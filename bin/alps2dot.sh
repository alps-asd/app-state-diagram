#!/bin/bash

# alps2dot Composer Command Script
# Usage: composer alps2dot <file> [options]

if [ $# -eq 0 ]; then
    echo "🟦 TypeScript alps2dot - ALPS to DOT Converter"
    echo "=============================================="
    echo ""
    echo "📖 Usage:"
    echo "  composer alps2dot <file>                    # Convert ALPS to DOT"
    echo "  composer alps2dot <file> --title           # Use title labels"
    echo "  composer alps2dot <file> --both            # Generate both versions"
    echo "  composer alps2dot-demo                     # Run demo comparisons"
    echo ""
    echo "📁 Examples:"
    echo "  composer alps2dot docs/bookstore/alps.xml"
    echo "  composer alps2dot docs/amazon/alps.json --title"
    echo "  composer alps2dot docs/lms/alps.xml --both"
    echo ""
    echo "🚀 Available demo files:"
    find docs -name "alps.*" -type f | head -5 | sed 's/^/  /'
    echo ""
    exit 0
fi

# TypeScript版のビルド確認
if [ ! -f "alps2dot/dist/cli.js" ]; then
    echo "📦 Building TypeScript version..."
    cd alps2dot && npm install && npm run build && cd ..
fi

input_file="$1"
shift  # 最初の引数（ファイル名）を削除

if [ ! -f "$input_file" ]; then
    echo "❌ Error: File not found: $input_file"
    exit 1
fi

# オプションの解析
label_strategy="id"
output_both=false

while [ $# -gt 0 ]; do
    case $1 in
        --title)
            label_strategy="title"
            shift
            ;;
        --both)
            output_both=true
            shift
            ;;
        *)
            echo "❌ Unknown option: $1"
            echo "💡 Supported options: --title, --both"
            exit 1
            ;;
    esac
done

echo "🟦 Converting with TypeScript alps2dot..."
echo "   Input: $input_file"
echo "   Label strategy: $label_strategy"

base_name=$(basename "$input_file" | sed 's/\.[^.]*$//')
output_dir=$(dirname "$input_file")

if [ "$output_both" = true ]; then
    echo "   Output: Both ID and title versions"
    echo ""
    
    # ID version
    id_output="${output_dir}/${base_name}.dot"
    node alps2dot/dist/cli.js "$input_file" -l id -o "$id_output"
    echo "✅ Generated: $id_output"
    
    # Title version  
    title_output="${output_dir}/${base_name}.title.dot"
    node alps2dot/dist/cli.js "$input_file" -l title -o "$title_output"
    echo "✅ Generated: $title_output"
    
    echo ""
    echo "📊 Quick comparison:"
    echo "   ID version (first 3 lines):"
    head -3 "$id_output" | sed 's/^/     /'
    echo "   Title version (first 3 lines):"
    head -3 "$title_output" | sed 's/^/     /'
    
else
    # 単一バージョン
    output_file="${output_dir}/${base_name}.dot"
    if [ "$label_strategy" = "title" ]; then
        output_file="${output_dir}/${base_name}.title.dot"
    fi
    
    echo "   Output: $output_file"
    echo ""
    
    node alps2dot/dist/cli.js "$input_file" -l "$label_strategy" -o "$output_file"
    echo "✅ Generated: $output_file"
    
    echo ""
    echo "📄 Preview (first 5 lines):"
    head -5 "$output_file" | sed 's/^/   /'
fi

echo ""
echo "🎯 Success! You can now use the DOT file with Graphviz:"
echo "   dot -Tsvg $output_file -o ${output_file%.*}.svg"