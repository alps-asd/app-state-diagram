# app-state-diagram

[![codecov](https://codecov.io/gh/alps-asd/app-state-diagram/branch/master/graph/badge.svg?token=FIVDUG18AZ)](https://codecov.io/gh/koriym/app-state-diagram)
[![Type Coverage](https://shepherd.dev/github/alps-asd/app-state-diagram/coverage.svg)](https://shepherd.dev/github/alps-asd/app-state-diagram)
[![Continuous Integration](https://github.com/alps-asd/app-state-diagram/actions/workflows/continuous-integration.yml/badge.svg)](https://github.com/alps-asd/app-state-diagram/actions/workflows/continuous-integration.yml)

[![Release (app-state-diagram)](https://github.com/alps-asd/app-state-diagram/actions/workflows/release-app-state-diagram.yml/badge.svg)](https://github.com/alps-asd/app-state-diagram/actions/workflows/release-app-state-diagram.yml)
[![Release (asd-action)](https://github.com/alps-asd/app-state-diagram/actions/workflows/release-asd-action.yml/badge.svg)](https://github.com/alps-asd/app-state-diagram/actions/workflows/release-asd-action.yml)

<img src="https://www.app-state-diagram.com/images/logo.png" width="120px" alt="logo">

**app-state-diagram** is a tool that visualizes state transitions and information structures of RESTful applications. It generates interactive state diagrams and hyperlinked documentation from ALPS (Application-Level Profile Semantics) profiles written in XML or JSON.

[![App State Diagram for Mini Commerce Application](https://www.app-state-diagram.com/app-state-diagram/mini-commerce/alps.svg)](https://www.app-state-diagram.com/app-state-diagram/mini-commerce/index.html)

## Key Benefits

- **Application Overview**: Visually grasp complex RESTful applications and understand the big picture
- **Clear Information Semantics**: See how data flows and what each element means
- **Enhanced Team Communication**: Both technical and business teams can discuss using the same visual representation
- **Design Consistency**: Represent application structures uniformly and discover design issues early

## Information Architecture Perspective

app-state-diagram embodies the three key aspects of Information Architecture (IA):

- **Ontology**: Defines the semantic meaning of application elements and their relationships
- **Taxonomy**: Organizes information into structured hierarchies and classifications
- **Choreography**: Describes interaction patterns and rules for state transitions

By focusing on these IA principles, app-state-diagram helps create a shared understanding of application semantics across organizational boundaries, independent of specific implementation technologies.

## Quick Start

### Online Editor (No Installation)
* [https://editor.app-state-diagram.com/](https://editor.app-state-diagram.com/)

### Install with Homebrew
```bash
brew install alps-asd/asd/asd
```

After installation, run:
```bash
asd --watch path/to/your/profile.json
```

## Examples

See these live demos:

- [Mini-Commerce](https://www.app-state-diagram.com/app-state-diagram/mini-commerce/)
- [LMS](https://www.app-state-diagram.com/app-state-diagram/lms/)

## Documentation

For more details, please refer to:
- [Quick Start Guide](https://www.app-state-diagram.com/manuals/1.0/en/quick-start.html)
- [Official Documentation](https://www.app-state-diagram.com/manuals/1.0/en/index.html)
