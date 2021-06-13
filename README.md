# ALPS ASD

Produces a full application state diagram and hyperlinked documentation from [ALPS](http://alps.io/) file. 

The diagram is hypermedia in SVG format with application states and state transitions linked to the respective semantic descriptor document HTML. The semantic descriptor document HTML is also linked to each other to represent the structure of the REST application.

<a href="https://koriym.github.io/app-state-diagram/blog/profile.svg"><img src="https://koriym.github.io/app-state-diagram/blog/profile.svg"></a>


## Demo

See online demo.

 * [blog](https://koriym.github.io/app-state-diagram/blog/)
 * [todomvc](https://koriym.github.io/app-state-diagram/todomvc/)

## Requirement

 * php 7.2+
 * [composer](https://getcomposer.org/)
 * [graphviz](https://graphviz.org/download/)
 * [npm](https://nodejs.org/en/download/)


You can check with the following command.

```
% php -v
PHP 7.4.10 (cli) (built: Sep  3 2020 18:21:42) ( NTS )

% composer -V
Composer version 2.0.7 2020-11-13 17:31:06

% dot -V    
dot - graphviz version 2.44.1 (20200629.0846)

% npm -v
6.14.9
```

## Installation

```
composer global require koriym/app-state-diagram
```

## Update

```
composer global update koriym/app-state-diagram
```

## Usage

```
composer global exec asd [-c asd.xml] [alpsFile]

    -c=asd.xml
        Path to a asd.xml configuration file.
```

* This will generate the semantic descriptor's document HTML and the application state diagram SVG.
* Supports XML and JSON formats.
* If you run it without the arguments,`asd.xml` config file in the same folder is used.

## Config

The format of the config file is as follows.

```xml
<?xml version="1.0"?>
<asd xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:noNamespaceSchemaLocation="https://koriym.github.io/app-state-diagram/asd.xsd">
    <alpsFile>profile.xml</alpsFile>
    <watch>false</watch>
    <filter>
        <and>tag1</and>
        <and>tag2</and>
        <or>tag3</or>
        <color>red</color>
    </filter>
</asd>
```
### alpsFile

ALPS profile file path.

### watch

You can start ASD development server with watch mode.
Each time the profile file changes, the page is reloaded.

### filter

You can extract partial graphs by specific tags, or color specific graphs. For example, in the famous [RESTBucks example](https://www.infoq.com/articles/webber-rest-workflow/), you can extract the state machine graphs of Consumar and Barista, respectively.
Specify the "or" or "and" condition. If you don't specify a color, that graph will be extracted, and if you do, it will be colored.

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
