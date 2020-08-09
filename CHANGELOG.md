# Changelog

This document provides a log of changes. It is currently maintained by hand.

## (master)

Usability:

- Added index.d.ts declarations.
- Wrote a lot of details into the README.
- Introduced support for multiple calls to SystemState's `bootstrap`, `setup` and `teardown`.
- Introduced a semaphore to SystemState's `bootstrap`, `setup` and `teardown` methods to ensure consistency.
- Secured module registration from overriding already registered modules.


## v0.1

- An initial working Proof-of-Concept