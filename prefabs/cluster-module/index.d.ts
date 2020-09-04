import { QuickstrapKnownModules } from './../../index.d';
import { Module, SystemState, ModuleConstructorOptions } from '../../';

export interface ClusterModuleOptions {
	serializeFn: (object: any) => string;
	unserializeFn: (serialized: string) => any;
	nofork: boolean;
	signals: boolean;
	teardownWaitMaxAge: number;
	workerRespawnTime: number;
}

export class ClusterModuleBase<T> extends Module {
	constructor(options?: ClusterModuleOptions, moduleOptions?: ModuleConstructorOptions);

	addJobType<P extends keyof T>(name: T, executor: T[P]): void;
	sendJobToWorker(id: string): void;
	spawnWorker(): void;

	static shouldTakeover(): boolean;
	static takeover(system: SystemState, moduleLib: QuickstrapKnownModules): Promise<void>;
}