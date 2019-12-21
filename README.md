# app-state-diagram

Generates an application state diagram image and vocabulary (semantic descriptors) file from [ALPS](http://alps.io/) document.

## Usage

```
composer require koriym/app-state-diagram

./vendor/bin/asd demo/profile.json 
dot -Tpng demo/profile.dot -o demo/profile.png 
```

## Output

* Application State Diagram

<img src="demo/profile.png">

* Vocabulary

 [profile.md](demo/profile.example.md)

## Requirement

 * php 7.2+
 * [composer](https://getcomposer.org/)
 * graphviz
 
Converting `.dot` into `.png` file requires a working `graphviz` installation.

On Debian or Ubuntu, one may do:

```
sudo apt install graphviz
```

On OSX, one may do after installing Homebrew:

```
sudo brew install graphviz
```

