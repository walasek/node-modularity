import { ClassOf } from './../../index.d';
import { ExpressModuleBase } from '../express-module/index.d';
import { Module, ModuleConstructorOptions } from '../../';

export class VisualizeExpressModuleBase<T extends ExpressModuleBase> extends Module {
	constructor(moduleDef: ClassOf<T>, path: string, options?: ModuleConstructorOptions);
}
