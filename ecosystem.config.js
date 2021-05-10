module.exports = {
	apps: [
		{
			name: 'Borsa Bot',
			script: './dist/index.js',
			env: {
				TOKEN: '<YOUR TOKEN HERE>',
			},
		}
	]
}