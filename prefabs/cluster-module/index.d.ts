import { QuickstrapKnownModules } from './../../index.d';
import { Module, SystemState, ModuleConstructorOptions } from '../../';

export type ClusterJobExecutor<T> = (...args: any) => T;
export type MethodMapper<T> = {
	[P in keyof T]: (...args: any) => Promise<T[P]>;
};

export interface ClusterModuleOptions {
	serializeFn: (object: any) => string;
	unserializeFn: (serialized: string) => any;
	nofork: boolean;
	signals: boolean;
	teardownWaitMaxAge: number;
	workerRespawnTime: number;
}

export type ClusterModuleJobs<T> = MethodMapper<T>;

export class ClusterModuleBase<T> extends Module {
	constructor(options?: ClusterModuleOptions, moduleOptions?: ModuleConstructorOptions);

	addJobType<P extends keyof T>(name: T, executor: T[P]): void;
	sendJobToWorker(id: string): void;
	spawnWorker(): void;

	static shouldTakeover(): boolean;
	static takeover(system: SystemState, moduleLib: QuickstrapKnownModules): Promise<void>;
}