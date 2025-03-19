const fs = require('fs')
const path = require('path')

const OUTPUT_FILE = 'project-code.md'
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build', 'out']
const EXCLUDE_FILES = ['collect-code.js']
const VALID_FILES = []
const VALID_EXTENSIONS = ['.js', '.ts','.sh']

const getFiles = (dir) => {
	const files = fs.readdirSync(dir)
	let result = []

	files.forEach((file) => {
		const filePath = path.join(dir, file)
		const stat = fs.statSync(filePath)

		if (stat.isDirectory() && !EXCLUDE_DIRS.includes(file)) {
			result = result.concat(getFiles(filePath))
		} else if (
			stat.isFile() &&
			(VALID_EXTENSIONS.includes(path.extname(file)) || VALID_FILES.includes(file)) &&
			!EXCLUDE_FILES.includes(file)
		) {
			result.push(filePath)
		}
	})

	return result
}

const collectCode = () => {
	const allFiles = getFiles(process.cwd())
	let output = ''

	allFiles.forEach((file) => {
		const code = fs.readFileSync(file, 'utf8')
		output += `// ${file}\n${code}\n\n`
	})

	fs.writeFileSync(OUTPUT_FILE, output, 'utf8')
	console.log(`✅ Code collected and saved in ${OUTPUT_FILE}`)
}

collectCode()
