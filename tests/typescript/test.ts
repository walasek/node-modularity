import { Module, SystemState } from '../..';

class OtherMod extends Module {};

class SomeMod extends Module {
	public a;
	public b;
	public c;

	constructor(){
		super({
			inject: (request) => {
				this.b = request(OtherMod);
				this.c = request('abc');
			}
		});
	}

	setup(){

	}
}

class NotAMod {}

const sys = new SystemState();
sys.addModuleClass(SomeMod);

const x = sys.constructModule(SomeMod);
x.a;
const y = sys.constructModule('abc') as SomeMod;
const z = sys.constructModule<SomeMod>('abc');

const [mod] = sys.bootstrap([SomeMod]);
const state = sys.bootstrap({ myMod: SomeMod });

mod.c;
state.myMod.a;

sys.setup().then(() => sys.teardown());
