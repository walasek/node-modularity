# visualize-express-module prefab

This is a prefab that exposes the module visualization through the express prefab.

## Features and traits

- No dependencies (module visualization is built in to the main library)
- This particular prefab attaches to a module that extends the [express-module](../express-module) prefab
- The module will overwrite the injector function from additional module options!

## Usage

The prefab provided should be extended.

```javascript
const { VisualizeExpressModuleBase } = require('node-modularity/prefabs/visualize-express-module');

class MyWebServer extends VisualizeExpressModuleBase {
    constructor() {
        super(
            // Pass the module which extends the ExpressBaseModule prefab
            MyWebServerModule,
            // Determine the path at which the visualization should be accessible
            '/debug',
            // Additional module options (optional)
            {
                // Note: inject will be overwritten!
            }
        );
    }
}
```
