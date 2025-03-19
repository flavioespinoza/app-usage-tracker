const fs = require('fs')
const path = require('path')
const {
	getCommitInfo,
	getSessionDuration,
	generateSessionId,
	formatCommitMessageForGitHub
} = require('./utils')

const REPORTS_DIR = path.join(__dirname, '../reports')
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR)

const SESSIONS_FILE = path.join(__dirname, 'sessions.json')
let sessions = fs.existsSync(SESSIONS_FILE) ? JSON.parse(fs.readFileSync(SESSIONS_FILE)) : []

const exportData = (startDate, endDate, author) => {
	const start = new Date(startDate)
	const end = new Date(endDate)

	const filteredSessions = sessions.filter(({ commitDate, author: sessionAuthor }) => {
		const sessionDate = new Date(commitDate)
		return (
			sessionDate >= start &&
			sessionDate <= end &&
			(!author || sessionAuthor.toLowerCase() === author.toLowerCase())
		)
	})

	if (filteredSessions.length === 0) {
		console.log('⚠️ No data found for the given date range and author.')
		return
	}

	const fileName = `active_usage_${startDate}_to_${endDate}`
	const mdPath = path.join(REPORTS_DIR, `${fileName}.md`)

	const mdContent = formatCommitMessageForGitHub(filteredSessions, startDate, endDate)
	fs.writeFileSync(mdPath, mdContent)

	console.log(`📁 Saved GitHub Markdown: ${mdPath}`)
}

const command = process.argv[2]
if (command === 'export' && process.argv.length >= 5) {
	const startDate = process.argv[3]
	const endDate = process.argv[4]
	const authorArgIndex = process.argv.indexOf('--author')
	const author = authorArgIndex !== -1 ? process.argv[authorArgIndex + 1] : null
	exportData(startDate, endDate, author)
} else {
	console.log('Usage: node src/index.js export YYYY-MM-DD YYYY-MM-DD --author AUTHOR')
}
