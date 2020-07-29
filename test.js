const glob = require('glob');
const path = require('path');
const { test } = require('zora');

async function runTestFile(file) {
	await test('Testing file ' + file, async t => {
		// eslint-disable-next-line security/detect-non-literal-require
		await require(path.resolve(file))(t.test);
	});
}

if (process.argv[2]) {
	return runTestFile(process.argv[2]);
}

async function run() {
	glob.sync('./tests/**/*.test.js').forEach(async file => {
		await runTestFile(file);
	});
}
run();
