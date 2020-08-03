export type ModuleClass = ClassOf<Module>;
export type ClassOf<T> = new () => T;
export type ClassOrName<T> = ClassOf<T> | string;
export type ModuleRequestFunction = <T extends Module>(classOrName: ClassOrName<T>) => T;
export type ModuleInjectionHandler = (request: ModuleRequestFunction) => void;

export interface ModuleConstructorOptions {
	exclusive?: boolean;
	inject?: ModuleInjectionHandler
}

export class Module {
	constructor(options?: ModuleConstructorOptions);

	setup(): void;
	teardown(): void;
	moduleIsExclusive(): boolean;
	moduleWasSetUp(): boolean;
	modulePerformInjection(requestFn: ModuleInjectionHandler): void;
	hintModuleDependencies(list: Module[]): void;
	assertDependenciesSetup(): void;
}

export type ClassOfMembers<T> = { [P in keyof T]: ClassOf<T[P]> };

export class SystemState extends Module {
	addModuleClass(someClass: ModuleClass, overrideName?: string): void;
	bootstrap<K>(requirements: ClassOfMembers<K>): K;

	constructModule(name: string): Module;
	constructModule<T>(name: string): T;
	constructModule<T extends Module>(someClass: ClassOf<T>): T;

	resolveClass(name: string): Module;
	resolveClass<T>(name: string): T;
	resolveClass<T extends Module>(someClass: ClassOf<T>): T;

	setup(): Promise<void>;
	teardown(): Promise<void>;
	invertSetupModulesList(): void;
}