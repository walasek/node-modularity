# Changelog

This document provides a log of changes. It is currently maintained by hand.

## v0.6

- Added Node 16 to Travis CI
- Updated all dependencies
- Updated docs
- [prefab][express-module] Fixed README not mentioning `super.postSetup`
- [prefab][visualize-express-module] Fixed `setup` method

## v0.5

- Added methods to extract dependencies from SystemState and Module (for debugging purposes for example)
- Added the ability to reference the SystemState from a Module
- Added a system visualization function
- Updated all dependencies
- [prefab][express-module] Fixed middleware option TS definitions requiring both `before` and `after` properties
- [prefab][express-module] Fixed missing middleware options for `use`
- [prefab][express-module] Added `supertest` tests
- [prefab][visualize-express-module] Introduced a prefab to expose system visualization through express-module

## v0.4

- [prefab][mongoose-module] Fixed `getModel` returning the schema instead of the model (yikes!)
- [prefab][mongoose-module] Added setup guards to `registerModel` and `getModel`
- [prefab][express-module] Fixed http request type proxy methods not accepting a path (yikes!)
- [prefab][cluster-module] Introduced a prototype prefab for multithreading with typings

## v0.3

- Fixed index.d.ts declarations missing from the published package...
- Introduced the `quickstrap` function
- Introduced `postSetup` module method
- Improved alias support, fixed some cases where aliases would be ignored
- Added notes on testing and mocking modules
- Module teardown now requires `super.teardown`
- [prefab][mongoose-module] Introduced a prototype prefab for mongoose with typings
- [prefab][express-module] Introduced a prototype prefab for express with typings

## v0.2

- Added index.d.ts declarations.
- Introduced support for circular dependency graphs through optional dependencies.
- Introduced support for multiple calls to SystemState's `bootstrap`, `setup` and `teardown`.
- Introduced a semaphore to SystemState's `bootstrap`, `setup` and `teardown` methods to ensure consistency.
- Secured module registration from overriding already registered modules.
- Removed `SystemState.hintModuleDependencies`
- Wrote a lot of details into the README.

## v0.1

- An initial working Proof-of-Concept
