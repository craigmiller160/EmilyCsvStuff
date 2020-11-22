const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

console.time('timer');

const X_COL_NAME = 'Center Long';
const Y_COL_NAME = 'Center Lat';
const Z_COL_NAME = 'Overall Probability';

const NL = '\n';
const CR = '\r\n';

const IN_DIRECTORY = path.resolve(process.cwd(), 'in');
const OUT_DIRECTORY = path.resolve(process.cwd(), 'out');

const getPlatformSeparator = () => {
	if (process.platform === 'win32') {
		return CR;
	}
	return NL;
}

const parseCsv = (csvText) => {
	const rows = csvText.trim().split(getPlatformSeparator());
	const headerFields = rows[0].split(',');
	return rows.slice(1)
		.map((row) => {
			const rowFields = row.split(',');
			return rowFields.reduce((acc, field, index) => ({
				...acc,
				[headerFields[index].trim()]: field.trim()
			}), {});
		});
};

const formatCsv = (data) => {
	const header = Object.keys(data[0]).join(',');
	const rows = data.slice(1)
		.map((record) => Object.values(record).join(','))
		.join(getPlatformSeparator());
	return `${header}${getPlatformSeparator()}${rows}`;
};

const loadFile = (fileName) => 
	fs.readFileSync(path.resolve(IN_DIRECTORY, fileName), 'utf8');

const readFiles = () => 
	fs.readdirSync(IN_DIRECTORY)
		.filter((file) => '.gitkeep' !== file)
		.map((file) => loadFile(file))
		.map((csv) => parseCsv(csv));

const writeFile = (data) => {
	const nowString = format(new Date(), 'yyyyMMddHHmmss');
	const fileName = `output_${nowString}.csv`;
	fs.writeFileSync(path.resolve(OUT_DIRECTORY, fileName), data);
};

const aggregateData = (allData) => {
	// All calculations/modifications will go here

	const aggregate = allData.reduce((acc, dataSet) => {
		return dataSet.reduce((setAcc, record) => {
			const key = `${record[X_COL_NAME]}:${record[Y_COL_NAME]}`;
			let sum = 0;
			if (setAcc[key]) {
				sum = parseFloat(setAcc[key][Z_COL_NAME]) + parseFloat(record[Z_COL_NAME]);
			} else {
				sum = parseFloat(record[Z_COL_NAME]);
			}
			return {
				...setAcc,
				[key]: {
					[X_COL_NAME]: record[X_COL_NAME],
					[Y_COL_NAME]: record[Y_COL_NAME],
					[Z_COL_NAME]: `${sum}`
				}
			};
		}, acc);
	}, {});

	return Object.values(aggregate);
};

// const theData = readFiles();
// const aggregatedData = aggregateData(theData);
// // Not necessary in browser, useful for testing
// const csvOutput = formatCsv(aggregatedData);
// writeFile(csvOutput);

const csv = loadFile('SampleCombined.csv');
const data = parseCsv(csv);
console.log(JSON.stringify(data, null, 2));

console.timeEnd('timer');