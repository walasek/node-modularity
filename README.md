# [node-modularity](https://github.com/walasek/node-modularity) [![Build Status](https://img.shields.io/travis/walasek/node-modularity.svg?style=flat-square)](https://travis-ci.org/walasek/node-modularity) [![Package Version](https://img.shields.io/npm/v/node-modularity.svg?style=flat-square)](https://www.npmjs.com/package/node-modularity) ![License](https://img.shields.io/npm/l/node-modularity.svg?style=flat-square) [![Dependencies](https://david-dm.org/walasek/node-modularity.svg)](https://david-dm.org/walasek/node-modularity)  [![codecov](https://codecov.io/gh/walasek/node-modularity/branch/master/graph/badge.svg)](https://codecov.io/gh/walasek/node-modularity) [![Known Vulnerabilities](https://snyk.io/test/github/walasek/node-modularity/badge.svg?targetFile=package.json)](https://snyk.io/test/github/walasek/node-modularity?targetFile=package.json)

An easy dependency injection framework for any JavaScript application.

[Documentation available here](https://walasek.github.io/node-modularity/).

---

## Goal

I've seen way too many JavaScript applications which don't properly handle their system state. Are you also tired of database connections held in global variables and singletons with unknown lifecycle? This framework is for you!

```javascript
// Wrap your dependencies in modules
class DatabaseConnection extends Module {
  async setup(){
    this.db = await connectToMyDb();
    // ...
  }
}

class WebServer extends Module {
  async setup(){
    this.app = express();
    // ...
  }
}

// Define your own implementation as modules
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
    this.webserver.app.get('/', (req, res) => res.send('Hello world!'));
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
const state = system.bootstrap({
  myRestEndpoints: RESTEndpoints
});

// Setup will resolve your dependency graph in the right order
await system.setup();
state.myRestEndpoints.webserver.app.listen(80);
// ...
// You can also define teardown methods to close the system in the proper order!
await system.teardown();
```

## Installation

Node `>=8` is required.

```bash
npm install --save node-modularity
```

To perform tests use:

```bash
cd node_modules/node-modularity
npm i
npm t
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
