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
// Simplified example, see below for usage
const { Module, SystemState } = require('node-modularity');

// Wrap your dependencies in modules
class DatabaseConnection extends Module {
  async setup(){
    this.db = await connectToMyDb();
  }
}

class WebServer extends Module {
  async setup(){
    this.app = express();
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
  }

  // Magically this will be called after the dependencies are ready!
  // No more lifecycle management!
  async setup(){
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

// Setup will resolve your dependency graph in the right order
await system.setup();
modules.myRestEndpoints.webserver.app.listen(80);
// ...
// You can also define teardown methods and close the system in the proper order!
await system.teardown();
```

## Features and remarks

- Modules will be reused by default, so if you declare 5 modules that depend on another module then 6 modules will be constructed in total.
  - Modules can optionally be _exclusive_ meaning that a new instance is constructed for each injection. These exclusive modules can later depend on non-exclusive modules. Such a case will properly be handled creating a sort of a diamond dependency shape. A practical example would be when a module wants two different caches, and those caches depend on a single Redis connection.
- Modules can be referenced by an alias. Got a logger module that prints to console and another one that prints nothing, both with different classnames? Just register one with an alias! You can also use aliases when requesting modules for injection.
- Currently the dependency graph cannot have cycles (A->B->C->A). In the future this will be handled by being able to declare one of the dependencies as _optional during setup_.
- Currently the modules can only be created using a no-argument _new_ call. In the future it will be possible to define a default factory function and to require exclusive modules with custom arguments per injection.
- It is possible to avoid `addModuleClass` calls at all. An option might be added to enable _registering-during-injection_ if a class is provided.
- I might provide some extra modules that wrap some popular libraries such as Express or Mongo. This would enable instant prototyping of some simple web apps with this framework.
- Interaction with transpilers (Babel, TypeScript) and bundlers (Browserify, Webpack) is not tested at this moment. They are known to modify class names and might break some internal mechanisms of this library.
- SystemState methods are secured with a semaphore. If your module somehow tries to call a setup while being in a setup phase then an error will be thrown. This is to ensure consistent operation.
- SystemState is a Module itself! You can take advantage of this and define very complex multi-domain applications that are separated from each other while you keep the ability to scale the project further easily.

## Usage

Beware this project is still in development. There may be serious bugs or performance issues over time.

Documentation is available [here](https://walasek.github.io/node-modularity/).

In general - you will define classes that will extend the `Module` class provided by this library. Those classes will then have their `setup` called in the right order by using a `SystemState` instance. It is also possible to `teardown` modules in the reverse order allowing a safe application closure.

Instead of providing a list of dependencies - you'll provide a function that will request other modules in an interactive matter.

```javascript
class MyModule extends Module {
  constructor(){
    super({
      inject: request => {
        // This is how you define dependencies
        this.otherModule = request(OtherModule);
        // You can also use an alias
        this.otherModule = request('OtherModule');
      },
      // This will cause a unique instance to be constructed
      // for each request(MyModule)
      exclusive: true,
    })
  }
}
```

To be able to bootstrap a bunch of modules together you'll need a `SystemState` instance which will hold information on the _system_ created.

```javascript
const system = new SystemState();

// Add known modules to allow automatic construction
// This also registers an alias using the class's name
system.addModuleClass(OtherModule);

// To be sure your classes work properly when transpiling
// make sure to declare an alias.
system.addModuleClass(MyModule, 'MyModule');

// This will create the module instances and inject references
const state = system.bootstrap({ myModule: MyModule });
state.myModule; // MyModule instance
// An array form is also available
// const [ myModule ] = system.bootstrap([ MyModule ]);
// Aliases can also be used
// Throws if any issues occur

// This will call all module's setup() in the right order
await system.setup();
// Throws if any issues occur

// ... perform post-setup things here

// This will call teardowns in the right order (reverse)
await system.teardown();
// Throws if any issues occur
```

### Graceful teardown

With this library you won't have to think about proper teardown procedure. Chances are you don't even handle app closure at all. This solution will scale all the way with your app.

```javascript
// SIGHUP, SIGINT, SIGTERM
[1, 2, 15].forEach(id => {
  process.on(id, async () => {
    try {
      await system.teardown();
      process.exit(0);
    } catch(err) {
      console.err(err);
      process.exit(1);
    }
  });
});
```

### Microservices

When your project is modular you can start thinking about microservices. With _Modularity_ you're one step away from being able to control your modules easily. Just bootstrap what you need in separate containers - the library will take care of dependencies. If your module doesn't need a database connection or a distributed cache - it won't try to set it up.

The problem of communicating separated microservices is left to you to solve. Will it be a module which will handle a Message Queue, or some RPC abstraction? Wrap your transport layer in a Module and inject it - only where needed!

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
