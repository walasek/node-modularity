const { Module } = require('../../');

class MongooseModuleBase extends Module {
	constructor(mongoose, url, options = {}, moduleOptions = {}) {
		super(moduleOptions);
		if (!url) {
			throw Error(`MongoDB connection URL must be provided`);
		}
		this.mongoose = mongoose;
		this.url = url;
		this.options = { ...options };
		this.schemas = {};
		this.models = {};
	}

	registerModel(name, schema) {
		if (this.schemas[name]) {
			throw Error(`Schema ${name} is already registered`);
		}
		if (this.moduleWasSetUp()) {
			throw Error(
				`Cannot register model ${name}, database already set up.` +
					`Move model registration to the injection function.`
			);
		}
		this.schemas[name] = schema;
	}

	getModel(name) {
		if (!this.models[name]) {
			throw Error(`Model ${name} does not exist`);
		}
		if (!this.moduleWasSetUp()) {
			throw Error(`Cannot access model ${name}. Database is not set up.`);
		}
		return this.models[name];
	}

	async setup() {
		super.setup();

		this.connection = await this.mongoose.createConnection(this.url, {
			...this.options,
		});

		Object.entries(this.models, ([name, schema]) => {
			this.models[name] = this.connection.model(name, schema);
		});
	}

	getDb() {
		return this.connection.db;
	}

	getConnection() {
		return this.connection;
	}

	async teardown() {
		super.teardown();

		await this.connection.close();
	}
}

module.exports = { MongooseModuleBase };
