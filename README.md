# ALPS ASD

Produces a full application state diagram and hyperlinked documentation from [ALPS](http://alps.io/) file.

The diagram is hypermedia in SVG format with application states and state transitions linked to the respective semantic descriptor document HTML. The semantic descriptor document HTML is also linked to each other to represent the structure of the REST application.

<a href="https://koriym.github.io/app-state-diagram/blog/profile.svg"><img src="https://koriym.github.io/app-state-diagram/blog/profile.svg"></a>


## Demo

See online demo.

* [blog](https://koriym.github.io/app-state-diagram/blog/)
* [todomvc](https://koriym.github.io/app-state-diagram/todomvc/)

## Requirement

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

## Installation

```
composer global require koriym/app-state-diagram
```

## Usage

```
composer global exec asd -- [options] [alpsFile]

    -c, --config=asd.xml
        Path to a asd.xml configuration file

    -w, --watch
        Watch mode

    --and-tag={tag1, tag2} --or-tag={tag3} [--color=red]
        Filter graph

    -l, --label={id|title|both}
        Displayed words
```

* Supports XML and JSON formats.
* If you run it without the arguments,`asd.xml` config file in the same folder is used.

## Configuration

ASD uses an XML config file (by default, asd.xml). A barebones example looks like this:

```xml
<?xml version="1.0"?>
<asd xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:noNamespaceSchemaLocation="https://koriym.github.io/app-state-diagram/asd.xsd">
    <alpsFile>profile.xml</alpsFile>
</asd>
```

## Optional <asd /> attributes

### watch

```xml
<asd
  <watch>[bool]</watch>
</asd>
```

You can start ASD development server with watch mode.
Each time the profile file changes, the page is reloaded.

### filter

```xml
<asd
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
<asd
  <label>[string]</label>
</asd>
```

Choose the word to display in the diagram from id, title, both.

## Update

```
composer global update koriym/app-state-diagram
```

## Run demo

Download [profile.example.json](https://koriym.github.io/app-state-diagram/blog/profile.json)
```
% composer global exec asd ./profile.example.json 
Changed current directory to /Users/akihito/.composer
ASD generated. ./index.html
```

Open `index.html` with browser.

```
open ./index.html
```
