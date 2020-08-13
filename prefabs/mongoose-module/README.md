# mongoose-module prefab

This is a prefab of a module which handles [mongoose](https://www.npmjs.com/package/mongoose) - a wrapper around MongoDB.

## Features and traits

- No dependencies (mongoose library is injected)
- Enables use of multiple connections (parallel integration tests, yay!)

## Usage

The prefab provided should be extended.

```javascript
const mongoose = require('mongoose');
const { MongooseModuleBase } = require('node-modularity/prefabs/mongoose-module');

// These should be in a separate file
const userSchema = new mongoose.Schema({
    email: {type: String},
    nickname: {type: String},
    // ...
});

class MongooseModule extends MongooseModuleBase {
    constructor(){
        super(
            // First pass the mongoose library
            mongoose,
            // Then the MongoDB URL
            'mongodb://localhost:8080/my-db',
            // (optional) Mongoose/MongoDB options
            {
                useNewUrlParser: true,
            },
            // (optional) Module options/dependencies
            {
                inject: request => {
                    this.otherDependencies = request('SomeOtherDep');
                }
            }
        );

        this.registerModel('User', UserSchema);
    }
}
```

Example usage of the extended class:

```javascript
// This module will create an initial admin user if no users exist
const { Module } = require('node-modularity');

class DatabaseSeedingModule extends Module {
    constructor(){
        super({
            inject: request => {
                this.db = request(MongooseModule);
            }
        })
    }

    async setup(){
        // getModel() works only during and after setup
        const User = this.db.getModel('User');
        const userCount = await User.countDocuments();

        if(userCount == 0) {
            const initialUser = new User({
                email: 'admin@example.com',
                nickname: 'admin'
            });

            await initialUser.save();
        }
    }
}
```
