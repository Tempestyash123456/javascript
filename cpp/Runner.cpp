#include <iostream>
#include "Child.cpp"

using namespace std;

int main() {
    Child obj;

    vector<string> csvData = obj.readFileData();
    vector<vector<string>> extractedData(csvData.size(), vector<string>(2));

    for (size_t i = 0; i < csvData.size(); i++) {
        string otp = obj.extractOtp(csvData[i]);
        extractedData[i][0] = csvData[i];
        extractedData[i][1] = otp;
    }

    obj.writeFile(extractedData);

    return 0;
}
