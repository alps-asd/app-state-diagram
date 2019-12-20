# app-state-diagram

An Application State Diagram Generator

Generates an application state diagram dot file from [ALPS](http://alps.io/) document.

## Usage

```
composer require koriym/app-state-diagram

./vendor/bin/asd demo/profile.json 
dot -Tpng demo/profile.dot -o demo/profile.png 
```

### Output

Application State Diagram

<img src="demo/profile.png">
