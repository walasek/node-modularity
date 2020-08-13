import { Module, ModuleConstructorOptions } from '../../';
import { Mongoose, ConnectionOptions } from 'mongoose';

/// <reference types="mongoose" />

export class MongooseModuleBase extends Module {
	constructor(mongoose: Mongoose, url: string, mongoOptions?: ConnectionOptions, moduleOptions?: ModuleConstructorOptions);

	setup(): Promise<void>;
	teardown(): Promise<void>;
}
