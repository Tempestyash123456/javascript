const fs = require("fs");
const path = require("path");

class Utility {
    constructor() {
        this.charsWithQuoteSet = new Set([",", "\n", "\r", '"']);
    }

    getMasterDataFilePath() {
        return "";
    }

    extractOtp(message) {
        return "";
    }

    readFileData() {
        const filePath = this.getMasterDataFilePath();
        
        if (!filePath || !fs.existsSync(filePath)) {
            console.log("File path not found or file does not exist:", filePath);
            return [];
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        
        const allRows = [];
        let currentRow = [];
        let currentField = '';
        let quoted = false; 

        // Skip the header
        let startIndex = content.indexOf('\n') + 1;
        if (startIndex === 0) 
            startIndex = 0; 

        for (let i = startIndex; i < content.length; i++) {
            const char = content[i];

            if (quoted) {
                if (char === '"') {
                    if (i < content.length - 1 && content[i + 1] === '"') {
                        currentField += '"';
                        i++; 
                    } 
                    else 
                        quoted = false;                     
                } 
                else 
                    currentField += char;
                
            } 
            else {
                if (char === '"') {
                    quoted = true; 
                } 
                else if (char === ',') {
                    currentRow.push(currentField);
                    currentField = '';
                } 
                else if (char === '\n' || char === '\r') {
                    if (currentField !== '' || currentRow.length > 0 || (i > startIndex && content[i-1] !== '\r' && content[i-1] !== '\n')) {
                        currentRow.push(currentField);
                        allRows.push(currentRow);
                    }
                    currentRow = [];
                    currentField = '';
                    
                    if (char === '\r' && i < content.length - 1 && content[i + 1] === '\n') {
                        i++;
                    }
                } 
                else 
                    currentField += char;
            }
        }
        
        if (currentField !== '' || currentRow.length > 0) {
            currentRow.push(currentField);
            allRows.push(currentRow);
        }

        return allRows;
    }

    tryGetDataRow(line, skipEmptyRows, columnValues) {
        columnValues.length = 0;

        let chars = Array.from(line);
        let openingQuote = false; 
        let sb = '';

        for (let i = 0; i < chars.length; i++) {
            let currentChar = chars[i];

            if (currentChar === '"') {
                openingQuote = !openingQuote; 
            }
            if (!openingQuote && currentChar === ',') {
                columnValues.push(sb);
                sb = '';
            } 
            else 
                sb += currentChar;
        }

        columnValues.push(sb); 

        let isCurrentRowEmpty = true;

        for (let i = 0; i < columnValues.length; i++) {
            let itemValue = columnValues[i].trim();

            if (itemValue.length > 0) {
                let startIndex = itemValue.startsWith('"') ? 1 : 0;
                let endIndex = itemValue.endsWith('"') ? itemValue.length - 1 : itemValue.length;

                let processedValue = '';
                let quoteIndex = -1; 
                
                for (let j = startIndex; j < endIndex; j++) {
                    if (itemValue[j] === '"') {
                        if (j - quoteIndex !== 1) {
                            processedValue += '"'; 
                        }
                        quoteIndex = j;
                    } 
                    else 
                        processedValue += itemValue[j];
                }

                columnValues[i] = processedValue.trim();
            }

            if (columnValues[i] !== '') {
                isCurrentRowEmpty = false;
            }
        }

        if (skipEmptyRows && isCurrentRowEmpty) {
            columnValues.length = 0;
        }

        return columnValues.length > 0;
    }

    writeFile(dataRows) {
        let dataRow = [];
        const filePath = this.getMasterDataFilePath();

        if (filePath && fs.existsSync(filePath)) {
            try {
                const content = fs.readFileSync(filePath, "utf-8");
                const lines = content.split(/\r?\n/).slice(1); 
                
                for (let line of lines) {
                    let columnValues = [];
                    if (this.tryGetDataRow(line, true, columnValues)) {
                        dataRow.push([...columnValues]);
                    }
                }
            } 
            catch (e) {
                console.log(e.message);
            }
        }

        const res = dataRow; 

        const folderPath = filePath ? path.dirname(filePath) : "";
        const outputFilePath = folderPath
            ? path.join(folderPath, "output.csv")
            : "output.csv";
        const failedCasesFilePath = folderPath
            ? path.join(folderPath, "failedCases.csv")
            : "failedCases.csv";

        let failCases = 0;
        let allLines = ["Message,Extracted,Expected"];
        let failedLines = ["Message,Extracted,Expected"];

        for (let it = 0; it < dataRows.length; it++) {
            const message = dataRows[it][0] || "";
            const extracted = dataRows[it][1] || "";
            const expected = dataRows[it][2] !== undefined
                ? dataRows[it][2]
                : res[it] 
                    ? res[it][1]
                    : "";

            let flag = false;

            const extractedNorm = (extracted.toLowerCase() === "nan") ? "nan" : extracted;
            const expectedNorm = (String(expected).toLowerCase() === "nan") ? "nan" : expected;

            if (extractedNorm.toLowerCase() !== expectedNorm.toLowerCase()) {
                failCases++;
                flag = true;
            }

            const row = [message, extracted, expected].map((cell) => {
                let sb = "";
                let specialCharFound = false;
                
                for (let i = 0; i < String(cell).length; i++) {
                    const currentChar = String(cell)[i];
                    sb += currentChar;
                    
                    if (currentChar === '"') 
                        sb += currentChar; 
                    
                    if (this.charsWithQuoteSet.has(currentChar)) 
                        specialCharFound = true;
                }
                
                if (specialCharFound) 
                    sb = `"${sb}"`; 

                return sb;
            });

            allLines.push(row.join(","));
            if (flag) {
                failedLines.push(row.join(","));
            }
        }

        try {
            fs.writeFileSync(outputFilePath, allLines.join("\n"));
            fs.writeFileSync(failedCasesFilePath, failedLines.join("\n"));

            const accuracy = ((dataRows.length - failCases) / dataRows.length) * 100;
            console.log(`Accuracy: ${accuracy.toFixed(6)}%`);
            console.log(`CSV writing completed successfully: ${outputFilePath}`);
            
        } catch (ex) {
            console.log("Error writing CSV: " + ex.message);
        }
    }
}

module.exports = Utility;