const path = require("path");

module.exports = function(eleventyConfig) {
	eleventyConfig.addPassthroughCopy({ 'src/images': 'images' })
	eleventyConfig.addPassthroughCopy({ 'src/projects/**/*.js': 'js' })

  return {
		dir: {
			input: path.resolve(__dirname, 'src'),
			output: path.resolve(__dirname, 'dist'),
			includes: 'templates',
		},
  }
}
