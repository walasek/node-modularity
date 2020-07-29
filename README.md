# [node-modularity](https://github.com/walasek/node-modularity) [![Package Version](https://img.shields.io/npm/v/node-modularity.svg?style=flat-square)](https://www.npmjs.com/package/node-modularity) ![License](https://img.shields.io/npm/l/node-modularity.svg?style=flat-square) [![Dependencies](https://david-dm.org/walasek/node-modularity.svg)](https://david-dm.org/walasek/node-modularity)  [![codecov](https://codecov.io/gh/walasek/node-modularity/branch/master/graph/badge.svg)](https://codecov.io/gh/walasek/node-modularity)

An easy dependency injection framework for any JavaScript application.

[Documentation available here](https://walasek.github.io/node-modularity/).

---

## Goal

I've seen way too many JavaScript applications which don't properly handle their system state. Are you also tired of database connections held in global variables and singletons with unknown lifecycle? This framework is for you!

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
