# app-state-diagram

Produces a full application state diagram and hyperlinked documentation from [ALPS](http://alps.io/) file. 

The diagram is hypermedia in SVG format with application states and state transitions linked to the respective semantic descriptor document HTML. The semantic descriptor document HTML is also linked to each other to represent the structure of the REST application.

<a href="https://koriym.github.io/app-state-diagram/blog/profile.svg"><img src="https://koriym.github.io/app-state-diagram/blog/profile.svg"></a>

This version only supports JSON format ALPS. Use [ALPS cli](https://github.com/filip26/alps) to convert the XML file.

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
composer global exec asd {$alpsFile}
```

This will generate the semantic descriptor's document HTML and the application state diagram SVG.


## Filter

You can extract partial graphs by specific tags, or color specific graphs. For example, in the famous [RESTBucks example](https://www.infoq.com/articles/webber-rest-workflow/), you can extract the state machine graphs of Consumar and Barista, respectively.
Specify the "or" or "and" condition. If you don't specify a color, that graph will be extracted, and if you do, it will be colored.

```
composer global exec asd -- --and-tag={tag1, tag2} --or-tag={tag3} [--color=red] {$alpsFile}
```

## Watch mode

You can start ASD development server with watch mode. 
Each time the profile file changes, the page is reloaded.

```
composer global exec asd -- --watch {$alpsFile}
```

### Run demo

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
