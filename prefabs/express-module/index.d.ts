import { Module, ModuleConstructorOptions } from '../../';
import e from 'express';

export interface MiddlewareOptions {
	after: Module | Module[];
	before: Module | Module[];
}
export type MiddlewareType = "use" | "get" | "post" | "put" | "delete" | "options" | "head";
export type Nameable = {name: string} | string;
export class ExpressModuleBase extends Module {
	constructor(expressLib: typeof e, options? :ModuleConstructorOptions);

	setup(): Promise<void>;
	listen(port: number): Promise<void>;
	teardown(): Promise<void>;

	addMiddleware<T extends Module>(caller: T | Nameable, method: MiddlewareType, fn: e.RequestHandler, options?: MiddlewareOptions): void;
	callerName<T extends Module>(caller: T | Nameable): string;

	getApp(): e.Application;
}
