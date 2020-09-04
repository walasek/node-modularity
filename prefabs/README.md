# Prefabs

Prefab modules are example implementations of wrappers around popular libraries. You can use them to your advantage for quick prototyping. Make sure to examine the module code before using them for a more serious project.

Note that prefabs may not be fully tested. They do not count towards the total library coverage (which we aim to be 100%). It is not recommended to use the prefabs for production projects - prefabs are bundled with the library, so any version update might either mess up some Modules or used prefabs.

| name | library | notes |
| --- | --- | --- |
| [mongoose-module](./mongoose-module) | [mongoose](https://www.npmjs.com/package/mongoose) | Prototype |
| [express-module](./express-module) | [express](https://www.npmjs.com/package/express) | Prototype |
| [cluster-module](./cluster-module) | [cluster](https://nodejs.org/api/cluster.html) | Prototype, experimental |
