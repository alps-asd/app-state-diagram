---
name: release
description: Release npm packages and create git tags. Handles @alps-asd/app-state-diagram, @alps-asd/mcp, and Homebrew formula updates.
---

# Release Skill

Release npm packages for app-state-diagram monorepo.

## Packages

| Package | npm Name | Description |
|---------|----------|-------------|
| packages/app-state-diagram | @alps-asd/app-state-diagram | Core library and CLI |
| packages/mcp | @alps-asd/mcp | MCP Server for AI integration |
| packages/crawler | (private) | Not published |

## Release Process

### 1. Update Versions

Update version in all package.json files:

```bash
# Root
package.json

# Packages
packages/app-state-diagram/package.json
packages/mcp/package.json
```

For alpha releases, use format: `2.0.0-alpha.1`

### 2. Update Workspace Dependencies

In `packages/mcp/package.json`, use workspace reference:

```json
{
  "dependencies": {
    "@alps-asd/app-state-diagram": "workspace:*"
  }
}
```

### 3. Build All Packages

```bash
pnpm build
```

### 4. Run Tests

```bash
pnpm test
```

### 5. Create and Push Git Tag

```bash
git tag -a v2.0.0-alpha.1 -m "v2.0.0-alpha.1: Description"
git push upstream v2.0.0-alpha.1
```

### 6. Publish to npm

Publish in dependency order:

```bash
# Core package first
cd packages/app-state-diagram
pnpm publish --access public --no-git-checks --tag alpha

# Then dependent packages
cd ../mcp
pnpm publish --access public --no-git-checks --tag alpha
```

For stable releases, omit `--tag alpha`:

```bash
pnpm publish --access public --no-git-checks
```

### 7. Verify Publication

```bash
npm view @alps-asd/app-state-diagram@2.0.0-alpha.1 version
npm view @alps-asd/mcp@2.0.0-alpha.1 version
```

## Homebrew Formula

Location: `/Users/akihito/git/homebrew-asd`

### Formula File

`Formula/asd.rb` for v2 (Node.js/TypeScript):

```ruby
class Asd < Formula
  desc "Generates state diagrams and documentation from ALPS profiles"
  homepage "https://alps-asd.github.io/"
  url "https://github.com/alps-asd/app-state-diagram.git", branch: "2.x"
  version "2.0.0-alpha.1"
  license "MIT"

  depends_on "node@20"
  depends_on "pnpm"
  depends_on "graphviz" => :optional

  def install
    ENV.prepend_path "PATH", Formula["pnpm"].opt_bin
    inreplace "package.json", /,?\s*"packageManager":\s*"[^"]*"/, ""
    system "pnpm", "install", "--package-import-method", "copy"
    system "pnpm", "run", "build"
    libexec.install Dir["*"]
    (bin/"asd").write <<~EOS
      #!/bin/bash
      exec "#{Formula["node@20"].opt_bin}/node" "#{libexec}/packages/app-state-diagram/dist/asd.js" "$@"
    EOS
  end

  test do
    system "#{bin}/asd", "--version"
  end
end
```

### Update Homebrew Formula

```bash
cd /Users/akihito/git/homebrew-asd
# Edit Formula/asd.rb with new version
git add Formula/asd.rb
git commit -m "Update to version 2.0.0-alpha.1"
git push origin v2-node
git push upstream v2-node
```

## Release Checklist

- [ ] All tests pass (`pnpm test`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Version updated in all package.json files
- [ ] Git tag created and pushed
- [ ] @alps-asd/app-state-diagram published to npm
- [ ] @alps-asd/mcp published to npm
- [ ] Homebrew formula updated (if applicable)
- [ ] Verify npm packages: `npm view @alps-asd/app-state-diagram`

## Branches

| Branch | Purpose |
|--------|---------|
| 2.x | TypeScript v2 (main development) |
| 1.x | PHP v1 (legacy, maintenance only) |

## npm Tags

| Tag | Purpose |
|-----|---------|
| latest | Stable releases |
| alpha | Pre-release versions |