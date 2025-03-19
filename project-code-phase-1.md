// /Users/flavio/bless/app-usage-tracker-js/src/index.js
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



	const calculateDurationHours = (sessionStart, sessionEnd) => {
		const start = new Date(sessionStart)
		const end = new Date(sessionEnd)
	
		// Ensure we don't get negative durations
		if (end <= start) return 0
	
		return ((end - start) / (1000 * 60 * 60)).toFixed(2) // Convert milliseconds to hours
	}
	
	const sessions = commits.map((commit, index, arr) => {
		let sessionEnd = commit.commitDate // Default to itself
	
		// If there is a next commit, set sessionEnd to the next commit's timestamp
		if (index < arr.length - 1) {
			sessionEnd = arr[index + 1].commitDate
		}
	
		return {
			id: index + 1,
			commit: commit.commit,
			commitDate: commit.commitDate,
			message: commit.message,
			sessionStart: commit.commitDate,
			sessionEnd: sessionEnd,
			durationHours: calculateDurationHours(commit.commitDate, sessionEnd),
			repo: commit.repo,
			author: commit.commitAuthor
		}
	})
	



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


// /Users/flavio/bless/app-usage-tracker-js/src/utils.js
const formatCommitMessageForGitHub = (sessions, startDate, endDate) => {
	let totalHours = 0
	const repoHours = {}

	sessions.forEach(({ repo, durationHours }) => {
		totalHours += parseFloat(durationHours)
		if (!repoHours[repo]) repoHours[repo] = 0
		repoHours[repo] += parseFloat(durationHours)
	})

	let mdContent = `# Flavio Espinoza\n\n`
	mdContent += `## Monthly Hours\n\n`
	mdContent += `**Date:** ${startDate} to ${endDate}\n\n`
	mdContent += `**Total Commits:** ${sessions.length}\n`
	mdContent += `**Total Hours:** ${totalHours.toFixed(2)}\n\n`
	mdContent += `---\n\n`

	Object.keys(repoHours).forEach((repo) => {
		mdContent += `## ${repo.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Hours: ${repoHours[repo].toFixed(2)}\n\n`

		const repoSessions = sessions.filter((s) => s.repo === repo)
		const commits = {}

		repoSessions.forEach((session) => {
			if (!commits[session.commit]) {
				commits[session.commit] = {
					commitDate: session.commitDate,
					message: session.message,
					sessions: []
				}
			}
			commits[session.commit].sessions.push({
				id: session.id,
				sessionStart: session.sessionStart,
				sessionEnd: session.sessionEnd,
				durationHours: session.durationHours
			})
		})

		Object.keys(commits).forEach((commit) => {
			const { commitDate, message, sessions } = commits[commit]
			const totalCommitHours = sessions.reduce((sum, s) => sum + parseFloat(s.durationHours), 0)

			mdContent += `### Date: ${commitDate}\n`
			mdContent += `**Commit:** \`${commit}\`\n`
			mdContent += `**Sessions Count:** ${sessions.length}\n`
			mdContent += `**Total Hours:** \`${totalCommitHours.toFixed(2)}\`\n`
			mdContent += `**Commit Message:**\n\n\`\`\`\n${message}\n\`\`\`\n\n`

			sessions.forEach(({ id, sessionStart, sessionEnd, durationHours }) => {
				mdContent += `- **Id:** ${id}\n`
				mdContent += `- **Session Start:** ${sessionStart}\n`
				mdContent += `- **Session End:** ${sessionEnd}\n`
				mdContent += `- **Session Hours:** \`${durationHours}\`\n\n`
			})
			mdContent += `---\n`
		})
	})

	return mdContent
}

const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const BLESS_DIR = path.join(process.env.HOME, 'bless')

const getCommitInfo = (startDate, endDate, author) => {
	try {
		const repos = fs
			.readdirSync(BLESS_DIR)
			.filter((dir) => fs.existsSync(path.join(BLESS_DIR, dir, '.git')))

		let commits = []

		repos.forEach((repo) => {
			const repoPath = path.join(BLESS_DIR, repo)
			const logCommand = `git -C ${repoPath} log --author="${author}" --since="${startDate}" --until="${endDate}" --pretty=format:"%H|%s|%ad|%an|${repo}" --date=iso`
			const output = execSync(logCommand).toString().trim()

			if (output) {
				output.split('\n').forEach((line) => {
					const [commit, message, commitDate, commitAuthor, repoName] = line.split('|')
					commits.push({ commit, message, commitDate, commitAuthor, repo: repoName })
				})
			}
		})

		return commits
	} catch (error) {
		console.error('❌ Error fetching commits:', error.message)
		return []
	}
}

module.exports = {
	formatCommitMessageForGitHub,
	getCommitInfo
}


