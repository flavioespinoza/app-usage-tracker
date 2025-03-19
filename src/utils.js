const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const BLESS_DIR = path.resolve(__dirname, '../bless')

const getGitCommits = (startDate, endDate, authors) => {
	try {
		const repos = fs
			.readdirSync(BLESS_DIR)
			.filter((dir) => fs.existsSync(path.join(BLESS_DIR, dir, '.git')))

		let commits = []

		repos.forEach((repo) => {
			const repoPath = path.join(BLESS_DIR, repo)
			
			// Build OR condition for multiple authors
			const authorConditions = authors.map((a) => `--author="${a}"`).join(' ')
			const logCommand = `git -C ${repoPath} log ${authorConditions} --since="${startDate}" --until="${endDate}" --pretty=format:"%H|%s|%ad|%an|${repo}" --date=iso`
			
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

const formatCommitMessageForGitHub = (sessions, startDate, endDate) => {
	let mdContent = `# GitHub Activity Report (${startDate} - ${endDate})\n\n`
	mdContent += '| ID | Commit | Session Start | Session End | Hours | Repo | Task | Author |\n'
	mdContent += '|----|--------|--------------|------------|-------|------|------|--------|\n'

	sessions.forEach(({ id, commit, sessionStart, sessionEnd, durationHours, repo, task, author }) => {
		mdContent += `| ${id} | ${commit} | ${sessionStart} | ${sessionEnd} | ${durationHours} | ${repo} | ${task} | ${author} |\n`
	})

	return mdContent
}

module.exports = { getGitCommits, formatCommitMessageForGitHub }
