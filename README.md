# [node-modularity](https://github.com/walasek/node-modularity)

[![Build Status](https://img.shields.io/travis/walasek/node-modularity.svg?style=flat-square)](https://travis-ci.org/walasek/node-modularity) [![Package Version](https://img.shields.io/npm/v/node-modularity.svg?style=flat-square)](https://www.npmjs.com/package/node-modularity) ![License](https://img.shields.io/npm/l/node-modularity.svg?style=flat-square) [![Dependencies](https://david-dm.org/walasek/node-modularity.svg)](https://david-dm.org/walasek/node-modularity)  [![codecov](https://codecov.io/gh/walasek/node-modularity/branch/master/graph/badge.svg)](https://codecov.io/gh/walasek/node-modularity) [![Known Vulnerabilities](https://snyk.io/test/github/walasek/node-modularity/badge.svg?targetFile=package.json)](https://snyk.io/test/github/walasek/node-modularity?targetFile=package.json)

An easy dependency injection framework for any JavaScript application.

[Documentation available here](https://walasek.github.io/node-modularity/).

```bash
npm install --save node-modularity
```

---

## Goal

I've seen way too many JavaScript applications which don't properly handle their system state. Are you also tired of database connections held in global variables and singletons with unknown lifecycle? This framework is for you!

```javascript
const { Module, SystemState } = require('node-modularity');

// Wrap your dependencies in modules
class DatabaseConnection extends Module {
  async setup(){
    super.setup(); // Make sure to pass the call into Module
    this.db = await connectToMyDb();
    // ...
  }
}

class WebServer extends Module {
  async setup(){
    super.setup();
    this.app = express();
    // ...
  }
}

// Define your own logic as modules too
class RESTEndpoints extends Module {
  constructor(){
    super({
      // Declare your dependencies
      inject: request => {
        this.database = request(DatabaseConnection),
        this.webserver = request(WebServer)
      }
    });
    // Dependencies are NOT available in the constructor
    this.database; // undefined
  }

  // Magically this will be called after the dependencies are ready!
  // No more lifecycle management!
  async setup(){
    super.setup();
    this.webserver.app.get('/', (req, res) =>
      res.json(`Hello mr ${this.database.getUserData()}`)
    );
  }
}

// The system object will hold our state, no globals!
const system = new SystemState();
// Register known modules to be able to construct and inject them
system.addModuleClass(WebServer);
system.addModuleClass(DatabaseConnection);
system.addModuleClass(RESTEndpoints);
system.addModuleClass(SomeUnrelatedModule);

// Bootstrap will only construct these modules and their dependencies
// SomeUnrelatedModule will not be constructed even if it's registered
const modules = system.bootstrap({
  myRestEndpoints: RESTEndpoints
});
// const [myRestEndpoints] = system.bootstrap([RESTEndpoints]); would work too

// Setup will resolve your dependency graph in the right order
await system.setup();
modules.myRestEndpoints.webserver.app.listen(80);
// ...
// You can also define teardown methods and close the system in the proper order!
await system.teardown();
```

Features and remarks:

- Modules will be reused by default, so if you declare 5 modules that depend on another module then 6 modules will be constructed in total.
  - Modules can optionally be _exclusive_ meaning that a new instance is constructed for each injection. These exclusive modules can later depend on non-exclusive modules. Such a case will properly be handled creating a sort of a diamond dependency shape. A practical example would be when a module wants two different caches, and those caches depend on a single Redis connection.
- Modules can be referenced by an alias. Got a logger module that prints to console and another one that prints nothing, both with different classnames? Just register one with an alias! You can also use aliases when requesting modules for injection.
- Currently the dependency graph cannot have cycles (A->B->C->A). In the future this will be handled by being able to declare one of the dependencies as _optional during setup_.
- Currently the modules can only be created using a no-argument _new_ call. In the future it will be possible to define a default factory function and to require exclusive modules with custom arguments per injection.
- It is possible to avoid `addModuleClass` calls at all. An option might be added to enable _registering-during-injection_ if a class is provided.
- I might provide some extra modules that wrap some popular libraries such as Express or Mongo. This would enable instant prototyping of some simple web apps with this framework.
- Interaction with transpilers (Babel, TypeScript) and bundlers (Browserify, Webpack) is not tested at this moment. They are known to modify class names and might break some internal mechanisms of this library.

## Installation

Node `>=8` is required.

```bash
npm install --save node-modularity
```

## Usage

Beware this project is still in development. There may be serious bugs or performance issues over time.

Documentation is available [here](https://walasek.github.io/node-modularity/).

## Contributing

The source is documented with JSDoc. To generate the documentation use:

```bash
npm run docs
```

Extra debugging information is printed using the `debug` module:

```bash
DEBUG=modularity:* npm t
```

The documentation will be put in the new `docs` directory.

To introduce an improvement please fork this project, commit changes in a new branch to your fork and add a pull request on this repository pointing at your fork. Please follow these style recommendations when working on the code:

* Use `async`/`await` and/or `Promise` where possible.
* Features must be properly tested.
* New methods must be properly documented with `jscode` style comments.
* Lint the project before committing
