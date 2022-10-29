import { Module, ModuleConstructorOptions } from '../../';
import { Mongoose, ConnectOptions } from 'mongoose';

/// <reference types="mongoose" />

export class MongooseModuleBase extends Module {
	constructor(mongoose: Mongoose, url: string, mongoOptions?: ConnectOptions, moduleOptions?: ModuleConstructorOptions);

	setup(): Promise<void>;
	teardown(): Promise<void>;
}
