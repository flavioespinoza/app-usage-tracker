const fs = require('fs')
const path = require('path')
const { getCommitInfo, formatCommitMessageForGitHub } = require('./utils')

const REPORTS_DIR = path.join(__dirname, '../reports')
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR)

const exportData = (startDate, endDate, author) => {
	console.log(`🔍 Fetching commits for ${author} from ${startDate} to ${endDate}...`)

	const commits = getCommitInfo(startDate, endDate, author)

	if (commits.length === 0) {
		console.log('⚠️ No commits found for the given date range and author.')
		return
	}

	const sessions = commits.map((commit, index) => ({
		id: index + 1,
		commit: commit.commit,
		commitDate: commit.commitDate,
		message: commit.message,
		sessionStart: commit.commitDate,
		sessionEnd: commit.commitDate,
		durationHours: '0.5',
		repo: commit.repo,
		author: commit.commitAuthor
	}))

	const fileName = `active_usage_${startDate}_to_${endDate}`
	const jsonPath = path.join(REPORTS_DIR, `${fileName}.json`)
	const csvPath = path.join(REPORTS_DIR, `${fileName}.csv`)
	const mdPath = path.join(REPORTS_DIR, `${fileName}.md`)

	// Save JSON
	fs.writeFileSync(jsonPath, JSON.stringify(sessions, null, 2))

	// Save CSV
	const csvData = [
		'id,commit,commitDate,message,sessionStart,sessionEnd,durationHours,repo,author',
		...sessions.map(
			({
				id,
				commit,
				commitDate,
				message,
				sessionStart,
				sessionEnd,
				durationHours,
				repo,
				author
			}) =>
				`${id},${commit},${commitDate},"${message}",${sessionStart},${sessionEnd},${durationHours},${repo},${author}`
		)
	].join('\n')

	fs.writeFileSync(csvPath, csvData)

	// Save Markdown
	const mdContent = formatCommitMessageForGitHub(sessions, startDate, endDate)
	fs.writeFileSync(mdPath, mdContent)

	console.log(`📁 Saved JSON: ${jsonPath}`)
	console.log(`📁 Saved CSV: ${csvPath}`)
	console.log(`📁 Saved Markdown: ${mdPath}`)
}

// CLI Command Handling
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
