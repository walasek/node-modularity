# express-module prefab

This is a prefab of a module which handles [express](https://www.npmjs.com/package/express) - the most popular http server framework for Node.js

## Features and traits

- No dependencies (express library is injected)
- Exposes additional logs with `DEBUG=modularity:express`
- Handles middleware registration and controls ordering by `before` and `after` constraints
- Registers middlewares in the `postSetup` step

## Usage

The prefab provided should be extended.

```javascript
const express = require('express');
const { ExpressModuleBase } = require('node-modularity/prefabs/express-module');

class MyWebServer extends ExpressModuleBase {
    constructor() {
        super(
            // Pass the express library
            express
        );
    }

    async postSetup() {
        // listen must be called somewhere
        // can also be done by exposing this module in system state
        await this.listen(80);

        // Direct access to the express instance
        // Allows use of testing frameworks such as `supertest`
        const app = this.getApp();
    }
}
```

The class can immediately setup middlewares in it's `setup` method, but for readability we'll make a separate module.

Example usage of the extended class from another module:

```javascript
class MyHelloPage extends Module {
    constructor(){
        super({
            inject: request => {
                this.web = request(MyWebServer);
            }
        });
    }

    async setup(){
        super.setup();

        // Regular http method
        // Can use get, post, put, delete, options, head
        this.web.get(this, (req, res) => res.json({ message: 'hi!' }));

        // Regular middleware
        this.web.use(this, (req, res, next) => next());

        // Make sure the middleware is called before another module's middlewares
        // Using `before` with the express-module itself is a good place
        //    for middlewares called before each http method
        this.web.use(this, (req, res, next) => next(), { before: this.web });

        // Make sure the middleware is called after another module's middlewares
        // Using `after` with the express-module itself is a good place
        //    for http methods
        this.web.use(this, (req, res) => res.json({ message: 'hi!' }), { after: this.web });

        // Can also use an array of modules
        // { before: [ this.web, this.session_module, ... ] }
    }
}
```
