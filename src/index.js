const fs = require('fs');
const path = require('path');
const {   } = require('./utils');

const REPORTS_DIR = path.join(__dirname, '../reports');
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR);

const exportData = (startDate, endDate, author) => {
    console.log(`🔍 Fetching commits for ${author} from ${startDate} to ${endDate}...`);

    // Fetch commit data from Git
    const commits = getCommitInfo(startDate, endDate, author);

    if (commits.length === 0) {
        console.log('⚠️ No commits found for the given date range and author.');
        return;
    }

    // Transform commit data into session format
    const sessions = commits.map((commit, index) => ({
        id: index + 1,
        commit: commit.commit,
        commitDate: commit.commitDate,
        message: commit.message,
        sessionStart: commit.commitDate, // Placeholder: Adjust if session data is available
        sessionEnd: commit.commitDate,   // Placeholder: Adjust if session data is available
        durationHours: "0.5",  // Placeholder: Need real duration logic
        repo: commit.repo,
        author: commit.commitAuthor
    }));

    // Generate file names
    const fileName = `active_usage_${startDate}_to_${endDate}`;
    const jsonPath = path.join(REPORTS_DIR, `${fileName}.json`);
    const csvPath = path.join(REPORTS_DIR, `${fileName}.csv`);

    // Save JSON
    fs.writeFileSync(jsonPath, JSON.stringify(sessions, null, 2));

    // Save CSV
    const csvData = [
        'id,commit,commitDate,message,sessionStart,sessionEnd,durationHours,repo,author',
        ...sessions.map(({ id, commit, commitDate, message, sessionStart, sessionEnd, durationHours, repo, author }) =>
            `${id},${commit},${commitDate},"${message}",${sessionStart},${sessionEnd},${durationHours},${repo},${author}`
        )
    ].join('\n');

    fs.writeFileSync(csvPath, csvData);

    console.log(`📁 Saved JSON: ${jsonPath}`);
    console.log(`📁 Saved CSV: ${csvPath}`);
};

// CLI Command Handling
const command = process.argv[2];
if (command === 'export' && process.argv.length >= 5) {
    const startDate = process.argv[3];
    const endDate = process.argv[4];
    const authorArgIndex = process.argv.indexOf('--author');
    const author = authorArgIndex !== -1 ? process.argv[authorArgIndex + 1] : null;
    exportData(startDate, endDate, author);
} else {
    console.log('Usage: node src/index.js export YYYY-MM-DD YYYY-MM-DD --author AUTHOR');
}
