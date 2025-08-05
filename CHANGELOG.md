# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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