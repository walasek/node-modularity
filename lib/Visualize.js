const template = (nodes, edges) => `
<html>
	<head>
		<title>Visualization</title>
		<script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
		<style type="text/css">
			body {
				margin: 0;
			}
			#mynetwork {
				width: 98vw;
				height: 98vh;
				border: 1px solid lightgray;
			}
		</style>
	</head>
	<body>
		<div id="mynetwork"></div>
		<script type="text/javascript">
			var nodes = new vis.DataSet(${JSON.stringify(nodes)});
			var edges = new vis.DataSet(${JSON.stringify(edges)});
			var container = document.getElementById('mynetwork');
			var data = {nodes: nodes, edges: edges};
			var options = {physics:{solver: 'forceAtlas2Based'}};
			var network = new vis.Network(container, data, options);
		</script>
	</body>
</html>
`;

module.exports = function visualize(system) {
	const modules = system.getModulesList();
	const edges = [];

	modules.forEach((mod, k) => {
		const rdeps = mod.getRequiredDependencies();
		const odeps = mod.getOptionalDependencies();

		[
			[rdeps, {}],
			[odeps, { dashes: true }],
		].forEach(([dataset, options]) => {
			dataset.forEach(dep =>
				edges.push({
					...options,
					from: k,
					to: modules.findIndex(e => e == dep),
					arrows: { from: { enabled: true, type: 'arrow' } },
					color: { color: 'rgb(43,124,233)' },
				})
			);
		});
	});

	const result = template(
		modules.map((v, k) => ({
			id: k,
			label: v.constructor.name,
			...(v.moduleIsExclusive() ? { color: 'silver', shape: 'box' } : {}),
		})),
		edges
	);

	return result;
};
