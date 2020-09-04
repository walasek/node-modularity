# cluster-module prefab

This is a prefab of a module that handles [cluster](https://nodejs.org/api/cluster.html) - the native library that handles multithreading.

## Features and traits

- No dependencies (`cluster` is a native library)
- Requires additional code in entrypoints
- Spawns one fork per instance (exclusive mode will create a fork for each injection)
- Allows request-response (master-worker) communication pattern only (workers cannot _generate_ requests to the master)
- Optional `nofork` mode which will enable running jobs on the same thread (for testing purposes for example)
- Exposes additional logs with `DEBUG=modularity:cluster`
- Waits for pending jobs on teardown (does not work with nofork mode)
- Potentially problematic TS declarations - TS does not like classes with generic method names

## Usage

The prefab provided has to be extended.

```javascript
const { ClusterModuleBase } = require('node-modularity/prefabs/cluster-module');

class MyClusterModule extends ClusterModuleBase {
    constructor(){
        // Optional super call for additional options
        super({
            // These are the defaults
            serializeFn: JSON.stringify,
            deserializeFn: JSON.parse,
            nofork: false, // Don't fork, execute in current thread (useful in tests)
            signals: true, // Handle exit signals
            teardownWaitMaxAge: 10000, // During teardown will wait for jobs that are running for no longer than this number of milliseconds
            workerRespawnTime: 1000, // If a worker crashes then respawn it after this delay of milliseconds
        },
        // Optional additional module options
        {
            // Clustered modules can also require modules themselves
            inject: request => {
                this.db = request(DatabaseModule)
            },
            exclusive: true // Spawn a fork for each injection
        })
    }

    async setup() {
        this.addJobType('jobName', async (a,b,c) => {
            // Process job here
            console.log('Job received!');
            return 'result';
        });

        // The super must be last!
        super.setup();
    }
}
```

The cluster module can be injected normally.

```javascript
class SomeModule extends Module {
    constructor(){
        super({
            inject: request => {
                this.clustered = request(MyClusterModule);
            }
        })
    }

    async postSetup() {
        // Direct access to jobs as methods
        // Note that these methods are NOT available in the forked process
        await this.clustered.jobName('arg1', 2, 'arg3');
    }
}
```

The system initialization is different and requires additional steps in the entrypoint.

```javascript
// These are static methods
if(MyClusterModule.shouldTakeover()){
    // Bootstrap only the cluster module
    // The promise will never resolve nor reject if shouldTakeover() (the await is optional)
    // The promise will immediately resolve if !shouldTakeover() (the if statement is optional)
    // Must provide all module classes required by the clustered module (and itself)
    // The takeover procedure includes SIGINT/SIGHUP/SIGTERM handling
    await MyClusterModule.takeover(system, [ SomeModule, DatabaseModule, MyClusterModule ]);
}else{
    // Bootstrap the system normally
    // Make sure this is in an `else` statement, otherwise you might enter an infinite forking loop!
    await quickstrap({ myMod: SomeModule }, [ SomeModule, DatabaseModule, MyClusterModule ]);
    // Will print `Job received!`
}
```

Note on TS types. The types do not provide a way to use generics to describe jobs.
Use a workaround similar to the following:

```javascript
interface MyClusterJobs {
    jobName: (a: number, b: number, c: string) => string;
}

class MyClusterModule extends ClusterModuleBase<MyClusterJobs> {
    async setup() {
        this.addJobType('jobName', async (a: number, b: number, c:number) => 'result');
        super.setup();
    }
}

// mod is an instance of MyClusterModule
// `as unknown` might not be needed, depends on your tsconfig and version
await (mod as unknown as MyClusterJobs).jobName(1,2,'3');
```
