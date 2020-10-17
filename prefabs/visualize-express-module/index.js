const { Module } = require('../../');
const visualize = require('../../lib/Visualize');
const { ExpressModuleBase } = require('../express-module');

class VisualizeExpressModuleBase extends Module {
	constructor(ExpressModuleImplementor, targetPath, options = {}) {
		if (ExpressModuleImplementor instanceof ExpressModuleBase) {
			throw Error('The module used by VisualizeExpressModuleBase must inherit from ExpressModuleBase');
		}

		super({
			...options, // Note that the inject will be overwritten!
			inject: request => {
				this.mod = request(ExpressModuleImplementor);
			},
		});
		this.path = targetPath;
	}

	async setup() {
		this.mod.get(this, this.path, (_, res) => {
			res.send(visualize(this.getSystemStateReference()));
		});
	}
}

module.exports = { VisualizeExpressModuleBase };
