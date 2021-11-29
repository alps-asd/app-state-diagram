# ALPS ASD
[![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/alps-asd/app-state-diagram/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/alps-asd/app-state-diagram/?branch=master)
[![codecov](https://codecov.io/gh/koriym/app-state-diagram/branch/master/graph/badge.svg?token=FIVDUG18AZ)](https://codecov.io/gh/koriym/app-state-diagram)
[![Type Coverage](https://shepherd.dev/github/alps-asd/app-state-diagram/coverage.svg)](https://shepherd.dev/github/alps-asd/app-state-diagram)
[![Continuous Integration](https://github.com/alps-asd/app-state-diagram/actions/workflows/continuous-integration.yml/badge.svg)](https://github.com/alps-asd/app-state-diagram/actions/workflows/continuous-integration.yml)
[![Coding Standards](https://github.com/alps-asd/app-state-diagram/actions/workflows/coding-standards.yml/badge.svg)](https://github.com/alps-asd/app-state-diagram/actions/workflows/coding-standards.yml)
[![Static Analysis](https://github.com/alps-asd/app-state-diagram/actions/workflows/static-analysis.yml/badge.svg)](https://github.com/alps-asd/app-state-diagram/actions/workflows/static-analysis.yml)

[![Release (app-state-diagram)](https://github.com/alps-asd/app-state-diagram/actions/workflows/release-app-state-diagram.yml/badge.svg)](https://github.com/alps-asd/app-state-diagram/actions/workflows/release-app-state-diagram.yml)
[![Release (asd-action)](https://github.com/alps-asd/app-state-diagram/actions/workflows/release-asd-action.yml/badge.svg)](https://github.com/alps-asd/app-state-diagram/actions/workflows/release-asd-action.yml) 


Produces a full application state diagram and hyperlinked documentation from [ALPS](http://alps.io/) file.

The diagram is hypermedia in SVG format with application states and state transitions linked to the respective semantic descriptor document HTML. The semantic descriptor document HTML is also linked to each other to represent the structure of the REST application.

<a href="https://alps-asd.github.io/app-state-diagram/blog/profile.svg"><img src="https://alps-asd.github.io/app-state-diagram/blog/profile.svg"></a>

## About ALPS

* [ALPS Quick Start (English)](https://hackmd.io/@koriym/quick-start-en)
* [https://alps-asd.github.io/ (Japanese)](https://alps-asd.github.io/manuals/1.0/ja/index.html)

## Output Demo

See online demo.

* [blog](https://alps-asd.github.io/app-state-diagram/blog/)
* [todomvc](https://alps-asd.github.io/app-state-diagram/todomvc/)

## Run

There are three ways to run it: [Run locally](#run-locally),  [Run with docker](#docker), and [Git Hub Action](https://github.com/alps-asd/asd-action).

## Run with GitHub action

You can try ASD in a minute without installing any tools.

1. Click **Use this template** in [alps-skeleton](https://github.com/alps-asd/alps-skeleton) site to create ALPS skeleton. Please make the repository public for GitHub Pages. 
2. [Configuring a publishing source for your GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site). Choose `gh-pages` and `/(root)` for the source.
3. Each time you commit, ASD diagram and hyper linked document will be generated in `https://{user}.github.io/{repository}/`.

## <a name="docker">Run with Docker</a>

This is the most standard way.

Pull the docker image and install ASD utility.

```bash
docker pull ghcr.io/alps-asd/app-state-diagram:latest
```

```bash
curl -L https://alps-asd.github.io/app-state-diagram/asd.sh > ./asd && chmod +x ./asd && sudo mv ./asd /usr/local/bin
```

### Run demo

Perform the following steps and open [http://localhost:3000](http://localhost:3000)


```
mkdir work
curl -L curl https://alps-asd.github.io/app-state-diagram/blog/profile.json > work/profile.json
asd --watch ./work/profile.json
```

ASD documen appeared? Congratulations! Press the star in this repository to celebrate. 🌟

### Usage

```
asd [options] [alpsFile]

    -c, --config=asd.xml
        Path to a asd.xml configuration file

    -w, --watch
        Watch mode

    --and-tag={tag1, tag2} --or-tag={tag3} [--color=red]
        Filter graph

    -l, --label={id|title|both}
        Displayed words

    -m, --mode={markdown|html}
        Output format
```

* Supports XML and JSON formats.
* If you run it without the arguments,`asd.xml` config file in the same folder is used.


## [Run locally](#run-locally)

This method is currently mainly for developers.
It is tedious and time consuming.

### Requirement

* [php](https://www.php.net/manual/en/install.php)
* [composer](https://getcomposer.org/)
* [graphviz](https://graphviz.org/download/)
* [npm](https://nodejs.org/en/download/)


You can check with the following command.

```
% php -v
PHP 8.0.6 (cli) (built: May  8 2021 01:58:51) ( NTS )

% composer -V
Composer version 2.0.13 2021-04-27 13:11:08

% dot -V    
dot - graphviz version 2.47.1 (20210417.1919)

% npm -v
7.17.0
```

### Installation

```
composer global require koriym/app-state-diagram
```

### Update

```
composer global update koriym/app-state-diagram
```

### Usage

```
composer global exec asd -- [options] [alpsFile]
```

The options are the same as for the Docker version.

## Configuration

ASD uses an XML config file (by default, asd.xml). A barebones example looks like this:

```xml
<?xml version="1.0"?>
<asd xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:noNamespaceSchemaLocation="https://alps-asd.github.io/app-state-diagram/asd.xsd">
    <alpsFile>profile.xml</alpsFile>
</asd>
```

### Optional <asd /> attributes

### watch

```xml
<asd>
  <watch>[bool]</watch>
</asd>
```

You can start ASD development server with watch mode.
Each time the profile file changes, the page is reloaded.

### filter

```xml
<asd>
  <filter>
    <and>[string]</and>
    <and>[string]</and>
    <or>[string]</or>
    <color>[string]</color>
  </filter>
</asd>
```

You can extract partial graphs by specific tags, or color specific graphs.

Specify a tag name in the "or" or "and" field to specify the condition. If you specify "color", the graph for that condition will be colored, but if you don't, only the graph for that condition will be extracted and drawn.

### label

```xml
<asd>
  <label>[string]</label>
</asd>
```

### markdown format

If your repository is private and your account is not a GHE or GHE Cloud account, you cannot make GitHub Pqges private. In such a case, you can output the document as Markdown and make the document private.

Unfortunately there is no way to host linked SVGs (diagrams) in Markdown, the dialog will lose the link when in Markdown.

This is an option if public HTML is not possible.

```xml
<asd>
  <mode>markdown</mode>
</asd>
```
