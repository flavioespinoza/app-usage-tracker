// /Users/flavio/bless/app-usage-tracker-js/src/index.js
const fs = require('fs')
const { execSync } = require('child_process')
const { format, parse } = require('date-fns')
const path = require('path')

function getAppUsageLog(startDate, endDate) {
	try {
		console.log(`Fetching logs from ${startDate} to ${endDate} (Mountain Time)...`)

		// Convert Mountain Time to UTC manually
		function convertToUTC(dateString) {
			const date = parse(dateString, 'MM/dd/yyyy', new Date())
			return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0))
		}

		const startUTC = convertToUTC(startDate)
		const endUTC = convertToUTC(endDate)
		endUTC.setUTCHours(23, 59, 59) // Set end time to 11:59 PM UTC

		// Format as YYYY-MM-DD HH:MM:SS for `log show`
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

// Ensure "reports" directory exists
const reportsDir = path.join(__dirname, 'reports')
if (!fs.existsSync(reportsDir)) {
	fs.mkdirSync(reportsDir)
}

function saveAsJson(filename, data) {
	const filePath = path.join(reportsDir, filename)
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
	console.log(`Saved JSON to ${filePath}`)
}

function saveAsCsv(filename, data) {
	const filePath = path.join(reportsDir, filename)
	const csvContent =
		'sessionStart,sessionEnd,durationHours\n' +
		data.map((c) => `${c.sessionStart},${c.sessionEnd},${c.durationHours}`).join('\n')
	fs.writeFileSync(filePath, csvContent, 'utf-8')
	console.log(`Saved CSV to ${filePath}`)
}

function calculateActiveUsage(startDate, endDate) {
	const logOutput = getAppUsageLog(startDate, endDate)
	if (!logOutput) {
		console.log('No log data found.')
		return
	}

	// Extract timestamps when VS Code became frontmost (active)
	const logs = logOutput
		.split('\n')
		.filter((line) => line.includes('frontmost'))
		.map((line) => {
			const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+)/)
			if (!match) return null
			return new Date(match[1])
		})
		.filter(Boolean)
		.sort((a, b) => a - b) // Sort timestamps chronologically

	if (logs.length < 2) {
		console.log('Not enough activity logs to track active time.')
		return
	}

	// Calculate active session durations
	const activeSessions = []
	for (let i = 0; i < logs.length - 1; i++) {
		const sessionStart = logs[i]
		const sessionEnd = logs[i + 1]

		// Ensure no massive gaps (e.g., breaks)
		const sessionDuration = (sessionEnd - sessionStart) / (1000 * 60 * 60) // Convert to hours
		if (sessionDuration < 4) {
			// Ignore if a break longer than 4 hours occurs
			activeSessions.push({
				sessionStart: sessionStart.toISOString(),
				sessionEnd: sessionEnd.toISOString(),
				durationHours: sessionDuration.toFixed(2)
			})
		}
	}

	// Summarize total active time
	const totalActiveHours = activeSessions.reduce(
		(sum, session) => sum + parseFloat(session.durationHours),
		0
	)

	console.log(`Total Active Time: ${totalActiveHours.toFixed(2)} hours`)
	saveAsJson(
		`active_usage_${startDate.replace(/\//g, '-')}_to_${endDate.replace(/\//g, '-')}.json`,
		activeSessions
	)
	saveAsCsv(
		`active_usage_${startDate.replace(/\//g, '-')}_to_${endDate.replace(/\//g, '-')}.csv`,
		activeSessions
	)
	console.log('Saved active session data to JSON and CSV files.')
}

// Parse CLI arguments
const args = process.argv.slice(2)
if (args.length !== 2) {
	console.error('Usage: yarn track MM/DD/YYYY MM/DD/YYYY')
	process.exit(1)
}

const [startDate, endDate] = args
calculateActiveUsage(startDate, endDate)


