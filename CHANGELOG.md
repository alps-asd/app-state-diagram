# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **`asd --validate` option** for ALPS profile validation ([#224](https://github.com/alps-asd/app-state-diagram/pull/224))
  - Validates ALPS profiles (JSON/XML) and outputs structured JSON result
  - Unified validation interface under single `asd` command
- **XML character validation (E010)** - Detect invalid XML characters (`&`, `<`, `>`, `"`, `'`) in descriptor titles
  - Prevents SVG generation errors from unescaped XML special characters
  - Implemented in both PHP and TypeScript validators
- **Claude Code integration** ([#224](https://github.com/alps-asd/app-state-diagram/pull/224))
  - Added `.claude/skills/alps/SKILL.md` for natural language ALPS generation
  - Added `docs/llms-alps-skill.txt` for non-Claude Code AI tools
  - README updated with AI integration guide (Skill, MCP Server, LLM Guide)
- **PHP 8.5 support** - Added to CI test matrix
- **Complete TypeScript alps2dot implementation** ([#222](https://github.com/alps-asd/app-state-diagram/pull/222))
  - Full TypeScript rewrite of ALPS to DOT conversion with PHP-compatible output
  - **Production-ready implementation** with comprehensive security features and testing
  - **~3x performance improvement** over PHP version (48ms vs 145ms for amazon/alps.json)
  - **62 comprehensive tests** covering all functionality with 100% compatibility verification
  - **Multi-version CI/CD pipeline** with Node.js 16, 18, 20 testing and PHP compatibility checks
  - **CLI with multiple output modes**: ID-based, title-based, and dual output generation
  - **Enhanced validation**: Duplicate ID detection, circular reference prevention, robust error handling
  - **Security hardened**: Input validation, ID collision prevention, defensive programming
  - **Composer integration**: `composer alps2dot` and `composer alps2dot-demo` commands for seamless usage
  - **npm package ready**: Complete package.json configuration for potential npm publishing
  - **Interactive demo scripts**: `tests/bin/demo_compare.sh`, `bin/quick_demo.sh`, `bin/alps2dot.sh` for easy testing

### Changed
- Claude code review workflow now triggers only on PR creation and manual dispatch (not every push)

### Security
- **Fixed multiple security vulnerabilities** in TypeScript implementation
  - Edge grouping collision prevention with delimiter-separated keys
  - Unique ID generation system preventing descriptor conflicts
  - Circular reference detection with Set-based cycle tracking
  - Input validation with type filtering against malformed data
  - All vulnerabilities verified and approved by automated code review (Sourcery AI, CodeRabbit AI)

### Fixed
- PHPStan error in PathResolverTest (assertIsBool always true)
- TypeScript regex duplication in alps-parser.ts
- **Data quality issue**: Resolved duplicate ID 'Order' in docs/amazon/alps.json (renamed to 'OrderDetails')
- **Test suite robustness**: Flexible error message matching prevents brittle test failures
- **CI/CD reliability**: Comprehensive workflow with automated compatibility and performance testing

## [0.15.0] - 2025-08-10

### Added
- Native dot command rendering for improved Japanese font metrics (fixes [#207](https://github.com/alps-asd/app-state-diagram/issues/207))
- Automatic detection with JavaScript fallback
- Rendering comparison workflow for testing

### Fixed
- Japanese label overflow from nodes
- Error message consistency
- Command injection in GitHub Actions

## [0.14.2] - 2025-08-08

### Fixed
- Fixed Homebrew path resolution for cross-platform compatibility
- Replace hardcoded `/opt/homebrew` paths with dynamic `brew --prefix` detection
- Support both ARM (`/opt/homebrew`) and Intel (`/usr/local`) Mac architectures
- Add fallback path resolution in PathResolver.php for libexec directory structure
- Remove asdw command references as path fix makes it obsolete

## [0.14.1] - 2025-08-07

### Fixed
- Fixed `--mode=svg` option not working properly in Diagram class
- Fixed PHAR path resolution for Node.js dot.js processing in SVG mode
- SVG mode now correctly generates SVG files without HTML output

## [0.14.0] - 2025-08-06

### Added
- **SVG-only mode** with `--mode=svg` option ([#217](https://github.com/alps-asd/app-state-diagram/pull/217))
  - Generates standalone SVG diagrams without HTML documentation
  - Creates both ID-based (`profile.svg`) and title-based (`profile.title.svg`) versions
  - Perfect for embedding in external documentation, presentations, and web pages
  - Maintains 100% test coverage with comprehensive test suite
- **Automated Homebrew formula update workflow** for streamlined release process
  - Automatic updates on GitHub releases
  - Manual workflow dispatch option available

### Improved
- Enhanced README documentation with clear SVG mode usage examples
- Improved CLI option descriptions for better user experience
- Added detailed design rationale for dual SVG output approach
- **Enhanced SVG output messages** to distinguish between ID-based and title-based diagrams

### Changed
- Updated code style to use single-line format for single-element arrays
- Improved test coverage to achieve 100% line and method coverage (90 tests, 156 assertions)

## [0.13.4] - 2025-08-05

### Fixed
- Fixed `asd -w` watch mode for Homebrew installation ([#214](https://github.com/alps-asd/app-state-diagram/pull/214))
- Resolved "No such file or directory" error when using watch mode in PHAR installations
- Added fallback to version-independent `/opt/homebrew/opt/asd/libexec/asd-sync` path
- Improved error messages with expected path information for better debugging

## [0.13.3] - 2025-08-05

### Changed
- Refactored IndexPage constructor to improve maintainability ([#212](https://github.com/alps-asd/app-state-diagram/pull/212))
- Externalized zoom JavaScript to separate file for better code organization
- Applied CS-fix formatting to IndexPage for code style consistency
- Improved code comments and changed to English

### Added
- Claude Code Review workflow for automated code review ([#213](https://github.com/alps-asd/app-state-diagram/pull/213))
- Claude PR Assistant workflow for pull request assistance
- GitHub Actions workflow for manual PHAR release dispatch
- Enhanced development tooling with Claude AI integration
- CLAUDE.md with comprehensive development guidance and architecture documentation
- CHANGELOG.md following Keep a Changelog format

### Fixed
- Code style issues and formatting inconsistencies

## [0.13.2] - 2025-06-11

### Fixed
- SVG and Graphviz library issues
- Graph zoom setup optimization
- File path references in box.json

### Changed
- Updated Graphviz JS library to version 2.21.0
- Improved graph rendering and zoom functionality

## [0.13.1] - Previous Release

[Full changelog available on GitHub](https://github.com/alps-asd/app-state-diagram/releases)

## [0.13.0] - Previous Release

[Full changelog available on GitHub](https://github.com/alps-asd/app-state-diagram/releases)

---

For older releases, please see the [GitHub Releases page](https://github.com/alps-asd/app-state-diagram/releases).