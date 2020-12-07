# app-state-diagram

Produces a full application state diagram and hyperlinked documentation from [ALPS](http://alps.io/) file. See [demo output](https://koriym.github.io/app-state-diagram/).

The diagram is hypermedia in SVG format with application states and state transitions linked to the respective semantic descriptor document HTML. The semantic descriptor document HTML is also linked to each other to represent the structure of the REST application.

<a href="https://koriym.github.io/app-state-diagram/profile.example.svg"><img src="https://koriym.github.io/app-state-diagram/profile.example.svg"></a>

This version only supports JSON format ALPS. Use [ALPS cli](https://github.com/filip26/alps) to convert the XML file.

## Requirement

 * php 7.2+
 * [composer](https://getcomposer.org/)
 * [graphviz](https://graphviz.org/download/)
 * [npm](https://nodejs.org/en/download/)

```
% php -v
PHP 7.4.10 (cli) (built: Sep  3 2020 18:21:42) ( NTS )

% dot -V    
dot - graphviz version 2.44.1 (20200629.0846)

% npm -v
6.14.9
```

## Installation

 1. [Install composer](https://getcomposer.org/doc/00-intro.md)
 2. Insall `asd` utility with following command.

```
composer global require koriym/app-state-diagram
```

## Update

```
composer global update koriym/app-state-diagram
```

## Usage

```
composer global exec asd {$alpsFile}
```

This will generate the semantic descriptor's document HTML and the application state diagram SVG.


## Watch mode

You can start ASD development server with watch mode.
It detects profile file change and reloaded for updated diagram and hyper documents. 

```
composer global exec asd -- --watch {$alpsFile}
```

### Run demo

Download [profile.example.json](https://koriym.github.io/app-state-diagram/profile.example.json)
```
% composer global exec asd ./profile.example.json 
Changed current directory to /Users/akihito/.composer
ASD generated. ./index.html
```

Open `index.html` with browser.

```
open ./index.html
```
