# app-state-diagram

Generates an application state diagram image and vocabulary file from [ALPS](http://alps.io/) document.

<img src="https://koriym.github.io/app-state-diagram/profile.example.svg">

## Requirement

 * php 7.2+
 * [composer](https://getcomposer.org/)
 * [graphviz](https://graphviz.org/download/)

```
% php -v
PHP 7.4.10 (cli) (built: Sep  3 2020 18:21:42) ( NTS )

% dot -V    
dot - graphviz version 2.44.1 (20200629.0846)
```

## Installation

 1. [Install composer](https://getcomposer.org/)
 2. `% php composer.phar global require koriym/app-state-diagram`

## Usage

```
composer global exec asd {$alpsFile}
```

## Try demo output

See [https://koriym.github.io/app-state-diagram/](https://koriym.github.io/app-state-diagram/)

### Run demo

```
% git clone git@github.com:koriym/app-state-diagram.git
% cp ./app-state-diagram/docs/profile.example.json .
% composer global exec asd ./profile.example.json 
Changed current directory to /Users/akihito/.composer
ASD generated. ./index.html
```

Open `index.html` with browser.

```
open ./index.html
```
