const Child = require('./Child');

function main() {
    const obj = new Child();
    const csvData = obj.readFileData();
    
    // 2D array to store 3 cols indicating original_msg, extracted_otp and expected_otp
    const extractedData = new Array(csvData.length).fill(null).map(() => new Array(3));

    for (let i = 0; i < csvData.length; i++) {
        const message = csvData[i][0];
        const expected = csvData[i][1]; 
        const otp = obj.extractOtp(message);
        
        extractedData[i][0] = message;   
        extractedData[i][1] = otp;       
        extractedData[i][2] = expected;  
    }

    obj.writeFile(extractedData);
}

main();