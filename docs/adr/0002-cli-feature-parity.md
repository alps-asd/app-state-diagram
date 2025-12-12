# ADR 0002: CLI Feature Parity with PHP Version

## Status

Accepted

## Context

TypeScript版CLI (`@alps-asd/cli`) をPHP版 (`bin/asd`) と互換性を持たせる必要がある。

## Decision

### 実装済み機能 (v0.20.0)

| オプション | 説明 | 状態 |
|-----------|------|------|
| `-e, --echo` | 標準出力に出力 | ✓ 実装済み |
| `-m, --mode <mode>` | 出力形式 (html/svg/dot) | ✓ 実装済み |
| `-o, --output <file>` | 出力ファイル指定 | ✓ 実装済み |
| `--label <mode>` | ラベルモード (id/title) | ✓ 実装済み |
| `--validate` | ALPSプロファイル検証 | ✓ 実装済み |
| `-v, --version` | バージョン表示 | ✓ 実装済み |
| `-h, --help` | ヘルプ表示 | ✓ 実装済み |

### 後回し機能

| オプション | 説明 | 理由 |
|-----------|------|------|
| `-w, --watch` | ライブリロード付きウォッチモード | ファイル監視とHTTPサーバーが必要 |

### 別リポジトリで維持（PHP版）

| オプション | 説明 | 理由 |
|-----------|------|------|
| `--mcp` | Claude Desktop統合用MCPサーバー | PHP版で動作確認済み。MCPはJSON-RPC over stdioで言語非依存。書き直しリスクを避け、動作しているコードを維持。 |

### 不要と判断した機能

| オプション | 説明 | 理由 |
|-----------|------|------|
| `-c, --config` | カスタム設定ファイル | TS版では不要 |

### メッセージ互換性

PHP版と同じメッセージ形式を採用:

```
# ヘルプ
usage: asd [options] alps_file

# 成功
ASD generated. /path/to/output.html

# エラー
Profile file not found: filename
```

## Consequences

- PHP版ユーザーが違和感なくTS版に移行できる
- watchモードとMCPは将来のバージョンで追加予定
- 設定ファイル機能は省略（シンプルさを優先）
