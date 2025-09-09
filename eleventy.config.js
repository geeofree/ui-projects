import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function(eleventyConfig) {
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
