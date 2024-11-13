const fs = require('fs');
const path = require('path');

// Path to the statistics file
const statisticsFilePath = path.join(__dirname, 'function_stats.csv');

function trackFunctionCalls() {
    // Get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split('T')[0];
    let callCount = 1; // Initialize call count

    // Check if the statistics file exists
    if (!fs.existsSync(statisticsFilePath)) {
        // Create the file with a header if it doesn't exist
        fs.writeFileSync(statisticsFilePath, 'Date,Call Count\n', { flag: 'w' });
    } else {
        // Read the file and check if today's date already exists
        const fileData = fs.readFileSync(statisticsFilePath, 'utf8');
        const lines = fileData.trim().split('\n');
        const header = lines[0];
        let dateFound = false;

        // Look for the current date in the file
        for (let i = 1; i < lines.length; i++) {
            const [date, count] = lines[i].split(',');
            if (date === currentDate) {
                // Update call count for the current date
                callCount = parseInt(count) + 1;
                lines[i] = `${currentDate},${callCount}`;
                dateFound = true;
                break;
            }
        }

        // If the date wasn't found, add a new line for today
        if (!dateFound) {
            lines.push(`${currentDate},${callCount}`);
        }

        // Write the updated data back to the file
        fs.writeFileSync(statisticsFilePath, lines.join('\n'), { flag: 'w' });
    }

    // console.log(`Function has been called ${callCount} time(s) today. Data logged to function_stats.csv.`);

    logCsvFile()
}

function logCsvFile() {
    // Check if the file exists
    if (!fs.existsSync(statisticsFilePath)) {
        console.log("Statistics file does not exist.");
        return;
    }

    // Read the file contents
    const fileData = fs.readFileSync(statisticsFilePath, 'utf8');

    // Log the content to the console
    console.log("Contents of function_stats.csv:\n");
    console.log(fileData);
}


module.exports = trackFunctionCalls
