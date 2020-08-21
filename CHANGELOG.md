# Changelog

This document provides a log of changes. It is currently maintained by hand.

## (master)

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