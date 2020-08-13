import { Module, SystemState } from '../..';
import { MongooseModuleBase } from '../../prefabs/mongoose-module';
import { Mongoose } from 'mongoose';

class OtherMod extends Module {};

class SomeMod extends Module {
	public a;
	public b;
	public c;
	public d;

	constructor(){
		super({
			inject: (request, requestOptional) => {
				this.b = request(OtherMod);
				this.c = request('abc');
				this.d = requestOptional(OtherMod);
			}
		});
	}

	setup(){

	}
}

class MyMongoose extends MongooseModuleBase {
	constructor(){
		super(new Mongoose(), 'abc', {useNewUrlParser: true}, { exclusive: true });
	}
}

class NotAMod {}

const sys = new SystemState();
sys.addModuleClass(SomeMod);
sys.addModuleClass(MyMongoose);

const x = sys.constructModule(SomeMod);
x.a;
const y = sys.constructModule('abc') as SomeMod;
const z = sys.constructModule<SomeMod>('abc');

const [mod] = sys.bootstrap([SomeMod]);
const state = sys.bootstrap({ myMod: SomeMod });

mod.c;
state.myMod.a;

sys.setup().then(() => sys.teardown());
