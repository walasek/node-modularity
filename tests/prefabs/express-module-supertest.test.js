const { quickstrap } = require('../..');
const { ExpressModuleBase } = require('../../prefabs/express-module');
const supertest = require('supertest');
const express = require('express');

class MyWebServer extends ExpressModuleBase {
	constructor() {
		super(express);
	}
}

module.exports = async test => {
	await test('Middlewares are properly called', async t => {
		const {
			state: { web },
		} = await quickstrap({ web: MyWebServer }, [MyWebServer]);
		const app = supertest(web.getApp());

		const { status, text } = await app.get('/');

		t.equal(status, 404);
		t.ok(text.includes('Error'));
	});
};
