# [node-modularity](https://github.com/walasek/node-modularity)

[![Build Status](https://img.shields.io/travis/walasek/node-modularity.svg?style=flat-square)](https://travis-ci.org/walasek/node-modularity) [![Package Version](https://img.shields.io/npm/v/node-modularity.svg?style=flat-square)](https://www.npmjs.com/package/node-modularity) ![License](https://img.shields.io/npm/l/node-modularity.svg?style=flat-square) [![Dependencies](https://david-dm.org/walasek/node-modularity.svg)](https://david-dm.org/walasek/node-modularity)  [![codecov](https://codecov.io/gh/walasek/node-modularity/branch/master/graph/badge.svg)](https://codecov.io/gh/walasek/node-modularity) [![Known Vulnerabilities](https://snyk.io/test/github/walasek/node-modularity/badge.svg?targetFile=package.json)](https://snyk.io/test/github/walasek/node-modularity?targetFile=package.json)

An easy dependency injection framework for any JavaScript application.

[Documentation available here](https://walasek.github.io/node-modularity/).

Check out some of existing wrappers around popular libraries (prefabs) [here](./prefabs)!

```bash
npm install --save node-modularity
```

- [Goal](#goal)
- [Features and remarks](#features-and-remarks)
- [Usage](#usage)
  - [Graceful teardown](#graceful-teardown)
  - [Testing](#testing)
  - [Microservices](#microservices)
- [Design tips](#design-tips)
- [Contributing](#contributing)

---

## Goal

I've seen way too many JavaScript applications which don't properly handle their system state. Are you also tired of database connections held in global variables and singletons with unknown lifecycle? This framework is for you!

Imagine a system that can be extended by simply writing your new features as modules:

```javascript
// See 'Usage' for all available options such as teardown, postSetup and more!
const { Module } = require('node-modularity');

// Wrap your logic in modules
class MyWebhookHandler extends Module {
  constructor() {
    super({
      inject: request => {
        // This is how you define dependencies
        this.security = request(MySecurityModule);
        this.webserver = request(MyWebServerModule);
        this.database = request(MyDatabaseModule);
      }
    });
  }

  async setup() {
    super.setup();

    // Logic that entangles dependenceis
    // See express-module-prefab for more details
    this.webserver.get(this, '/webhook', (req, res) => {
      this.database.saveIncomingData(req.body);
      res.send('ok');
    }, { after: this.security });
  }

  debug() {
    console.log('Print some data here');
  }
}
```

Running your system can be as simple as follows:

```javascript
const { quickstrap } = require('node-modularity');

const { state: { webhooks } } = await quickstrap(
  { webhooks: MyWebhookHandler },
  [ MySecurityModule, MyWebServerModule, MyDatabaseModule ]
);

// Access created instances
webhooks.debug();
```

The library will take care of constructing and initializing your modules in the proper order (by resolving dependencies as a graph). It also enables proper teardown by reversing the order of module initialization.

## Features and remarks

- Modules will be reused by default, so if you declare 5 modules that depend on another module then 6 modules will be constructed in total.
  - Modules can optionally be _exclusive_ meaning that a new instance is constructed for each injection. These exclusive modules can later depend on non-exclusive modules. Such a case will properly be handled creating a sort of a diamond dependency shape. A practical example would be when a module wants two different caches, and those caches depend on a single Redis connection.
- Modules can be referenced by an alias. Got a logger module that prints to console and another one that prints nothing, both with different classnames? Just register one with an alias! You can also use aliases when requesting modules for injection.
- Cyclic dependency graphs (A->B->C->A) are supported as long as one of the dependencies is marked as _optional_. In transpiled code you might have to use string aliases, otherwise you'll encounter undefined imports.
- Currently the modules can only be created using a no-argument _new_ call. In the future it will be possible to define a default factory function and to require exclusive modules with custom arguments per injection.
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
      inject: (request, requestOptional) => {
        // This is how you define dependencies
        this.otherModule = request(OtherModule);
        // You can also use an alias
        this.otherModule = request('OtherModule');
        // Optional dependencies are not guaranteed to be ready during this module's setup()
        // This allows building cyclic dependency graphs.
        // Note that cycles might hint a possible error in design.
        this.otherModule = requestOptional(OtherModule);
      },
      // This will cause a unique instance to be constructed
      // for each request(MyModule)
      exclusive: true,
    })
  }

  async setup() {
    super.setup(); // Always call super.setup(), otherwise will throw during setup

    // For optional dependencies use this to make sure the module is ready
    // Note that this is not needed for regular dependencies injected with `request`
    if(this.otherModule.moduleWasSetUp()) {
      // ... safely use this.otherModule
    }
  }

  async postSetup() {
    // Additional operations to be performed after all modules are set up.
    // These may be called in a random order.
  }

  async teardown() {
    super.teardown(); // Make sure the internal state knows about this

    // Cleanup connections, handles or other resources
    // Dependencies injected with `request` are guaranteed NOT to be torn down
    // Optional dependencies might have been torn down
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

A `quickstrap` function has been added to make this quick. This will make testing easy!
It allows easy registering of modules, calls bootstrap and setup in one call.

```javascript
const { quickstrap } = require('node-modularity');

// First object is passed to system.bootstrap
// The second object is a map or an array of modules which are possible dependencies (system.addModuleClass)
// If a map is used then the keys are considered aliases for modules
const { state: { myModule }, system } = await quickstrap({ myModule: 'someAlias' }, { someAlias: MyModule });
myModule; // MyModule instance

// Simplified syntax without aliases:
await quickstrap({ myModule: MyModule }, [ MyModule, SomeOtherModule ]);

await system.teardown();
```

### Graceful teardown

With this library you won't have to think about proper teardown procedure. Chances are you don't even handle app closure at all. This solution will scale all the way with your app.

```javascript
['SIGHUP', 'SIGINT', 'SIGTERM'].forEach(id => {
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

### Testing

This library enables easy dependency injection in your unit and integration tests. You can take advantage of the `quickstrap` to easily set up your system state.

```javascript
class SomeModule extends Module {} // The original module
class SomeModuleMock extends Module {} // The mock
class MyModule extends Module { // The module to test
  constructor() {
    super({
      inject: request => {
        this.mod = request(SomeModule); // We reference the original module
      }
    })
  }
}

const { state: { myTestableModule }, system } = await quickstrap(
  { myTestableModule: MyModule }, // Bootstrap the tested module
  { SomeModule: SomeModuleMock }, // Register the mock with an alias equal to the original module name
);

// Make sure to teardown your system, otherwise you might end up with dangling connections and handlers
// mocha/jest:
describe('My mocked module', () => {
  let system;

  beforeEach(async () => {
    // .. quickstrap here
  });

  afterEach(async () => {
    await system.teardown();
  });

  // tests ...
});

// tap/ava/other low-level framewroks
test('My mocked module', () => {
  // quickstrap here
  try {
    // tests ...
  } finally {
    await system.teardown();
  }
})
```

### Microservices

When your project is modular you can start thinking about microservices. With _Modularity_ you're one step away from being able to control your modules easily. Just bootstrap what you need in separate containers - the library will take care of dependencies. If your module doesn't need a database connection or a distributed cache - it won't try to set it up.

The problem of communicating separated microservices is left to you to solve. Will it be a module which will handle a Message Queue, or some RPC abstraction? Wrap your transport layer in a Module and inject it - only where needed!

## Design tips

When building a project using this library consider following these guidelines:

- Consider structuring your project with the following directories:
  - `entrypoints` are scripts which can be run with the `node` command, they should contain System construction and `bootstrap` calls with proper modules
    - An example of an entrypoint could be a `main.js` file which would start all major modules
    - Another example would be a `stats.js` file which would load modules related to data storage to only print some usage statistics
    - Another example would be a `microservice.js` file which would only load some modules specified as command arguments
  - `modules` should contain module definitions in a per-feature fashion (if possible). It is recommended to avoid shallow and wide structures, instead try to subdivide modules into functional groups.
    - It is recommended to add tests directly next to implementation files.
    - If the module is complex then create a `tests` directory and store test files there.

- Always use named exports. This allows consistent class names across the project.
  - DON'T `module.exports = MyClass` or `export default MyClass` because `const MyDifferentName = require('...')` and `import MyDifferentName from ....`
  - DO `module.exports = { MyClass }` or `export MyClass`

- Name your module classes with `*Module` suffix.

- Avoid building shallow system structures. Instead try to design your modules in a tree-like family by creating a module that only has a responsibility of containing references to other modules.
  - DON'T `quickstrap({ UsersEndpoints, UserModel, ExpressServer, ExpressSessions, Database, ... })` because you'll end up with a long list of modules which will most likely be duplicated in some of your tests and entrypoints
  - DO `quickstrap({ AllEndpoints, AllModels, Database, ... })` because you'll be able to easily build new entrypoints and tests with just a few module references

- Consider creating a module for environment variable access. Do not limit yourself to `process.env`, there can be other sources of configuration (`.env`, Redis, 3rd party services). Take advantage of this module to catch situations where a variable might not have been set - throw errors or assign defaults.

- Consider creating a module for logging. While I do not recommend managing logs in your application - such a module might be useful to properly format your logs before processing with another tool (assign a date, print in a desired format etc.). It will also enable an easy switch to libraries such as `winston`.

- When working with message queues or databases - consider defining a `teardown` procedure which would wait for all current operations to be finished before closing connections.

- Consider adding `SIGINT/SIGHUP/SIGTERM` handlers to perform graceful teardown of modules.

- This library takes advantage of the [debug](https://www.npmjs.com/package/debug) package. Make sure to check it out and consider using it in your project.

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

- Use `async`/`await` and/or `Promise` where possible.
- Features must be properly tested (aim for 100% line coverage, but make sure to test all edge cases).
- New methods must be properly documented with `jscode` style comments.
- Interface updates must be reflected in `d.ts` files.
- Lint the project before committing.
