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
		this.schemas[name] = schema;
	}

	getModel(name) {
		if (!this.schemas[name]) {
			throw Error(`Schema ${name} does not exist`);
		}
		return this.schemas[name];
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
