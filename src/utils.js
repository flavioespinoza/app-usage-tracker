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

module.exports = { formatCommitMessageForGitHub }

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

module.exports = { getCommitInfo }

