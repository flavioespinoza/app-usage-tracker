const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { format, parse } = require('date-fns')
const { getGitCommits, formatCommitMessageForGitHub } = require('./utils')

const REPORTS_DIR = path.join(__dirname, '../reports')
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR)

function getAppUsageLog(startDate, endDate) {
	try {
		console.log(`Fetching logs from ${startDate} to ${endDate} (Mountain Time)...`)

		function convertToUTC(dateString) {
			const date = parse(dateString, 'MM/dd/yyyy', new Date())
			return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0))
		}

		const startUTC = convertToUTC(startDate)
		const endUTC = convertToUTC(endDate)
		endUTC.setUTCHours(23, 59, 59)

		const startLog = format(startUTC, 'yyyy-MM-dd HH:mm:ss')
		const endLog = format(endUTC, 'yyyy-MM-dd HH:mm:ss')

		const result = execSync(
			`log show --predicate '(eventMessage contains "frontmost") && (eventMessage contains "com.microsoft.VSCode")' --info --start "${startLog}" --end "${endLog}"`,
			{ encoding: 'utf-8' }
		)
		console.log('Log fetch completed!')
		return result
	} catch (error) {
		console.error('Error retrieving app usage logs:', error)
		return ''
	}
}

function calculateActiveUsage(startDate, endDate, author) {
	const logOutput = getAppUsageLog(startDate, endDate)
	if (!logOutput) {
		console.log('No log data found.')
		return
	}

	const logs = logOutput
		.split('\n')
		.filter((line) => line.includes('frontmost'))
		.map((line) => {
			const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+)/)
			if (!match) return null
			return new Date(match[1])
		})
		.filter(Boolean)
		.sort((a, b) => a - b)

	if (logs.length < 2) {
		console.log('Not enough activity logs to track active time.')
		return
	}

	const activeSessions = []
	for (let i = 0; i < logs.length - 1; i++) {
		const sessionStart = logs[i]
		const sessionEnd = logs[i + 1]
		const sessionDuration = (sessionEnd - sessionStart) / (1000 * 60 * 60) 

		if (sessionDuration < 4) {
			activeSessions.push({
				sessionStart: sessionStart.toISOString(),
				sessionEnd: sessionEnd.toISOString(),
				durationHours: sessionDuration.toFixed(2)
			})
		}
	}

	console.log(`Total Active Time: ${activeSessions.length} sessions`)

	// Fetch Git commits
	const commits = getGitCommits(startDate, endDate, author)

	// Merge VS Code sessions with commit history
	const mergedSessions = mergeSessionsWithCommits(activeSessions, commits)

	// Save JSON, CSV, Markdown
	const fileName = `active_usage_${startDate.replace(/\//g, '-')}_to_${endDate.replace(/\//g, '-')}`
	const jsonPath = path.join(REPORTS_DIR, `${fileName}.json`)
	const csvPath = path.join(REPORTS_DIR, `${fileName}.csv`)
	const mdPath = path.join(REPORTS_DIR, `${fileName}.md`)

	fs.writeFileSync(jsonPath, JSON.stringify(mergedSessions, null, 2))

	const csvData = [
		'id,commit,sessionStart,sessionEnd,durationHours,repo,task,author',
		...mergedSessions.map(
			({ id, commit, sessionStart, sessionEnd, durationHours, repo, task, author }) =>
				`${id},${commit},${sessionStart},${sessionEnd},${durationHours},${repo},"${task}",${author}`
		)
	].join('\n')

	fs.writeFileSync(csvPath, csvData)

	const mdContent = formatCommitMessageForGitHub(mergedSessions, startDate, endDate)
	fs.writeFileSync(mdPath, mdContent)

	console.log(`📁 Saved JSON: ${jsonPath}`)
	console.log(`📁 Saved CSV: ${csvPath}`)
	console.log(`📁 Saved Markdown: ${mdPath}`)
}

function mergeSessionsWithCommits(activeSessions, commits) {
	return activeSessions.map((session, index) => {
		const commit = commits[index] || {}
		return {
			id: index + 1,
			commit: commit.commit || 'N/A',
			sessionStart: session.sessionStart,
			sessionEnd: session.sessionEnd,
			durationHours: session.durationHours,
			repo: commit.repo || 'N/A',
			task: commit.message || 'No task description',
			author: commit.commitAuthor || 'N/A'
		}
	})
}

// CLI Arguments
const args = process.argv.slice(2)

if (args.length < 3) {
	console.error('Usage: yarn track MM/DD/YYYY MM/DD/YYYY --author AUTHOR1 --author AUTHOR2 ...')
	process.exit(1)
}

const startDate = args[0]
const endDate = args[1]

// Extract all author names from CLI args
const authorIndices = args.map((arg, index) => (arg === '--author' ? index : -1)).filter((i) => i !== -1)
const authors = authorIndices.map((i) => args[i + 1]).filter(Boolean)

if (authors.length === 0) {
	console.error('❌ Error: At least one author must be specified using --author AUTHOR_NAME')
	process.exit(1)
}

console.log(`🔍 Tracking commits for authors: ${authors.join(', ')}`)
calculateActiveUsage(startDate, endDate, authors)
