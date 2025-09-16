#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <set>
#include <algorithm>

using namespace std;

class Utility {
private:
    const set<char> charsWithQuoteSet { ',', '\n', '\r', '\"' };

public:
    Utility() {}

    vector<string> readFileData() {
        vector<vector<string>> dataRows;
        string filePath = getMasterDataFilePath();

        if (!filePath.empty()) {
            ifstream file(filePath);
            if (file.is_open()) {
                string line;
                // Skip header
                getline(file, line);
                while (true) {
                    vector<string> columnValues;
                    if (!tryGetDataRow(file, true, columnValues)) break;
                    if (!columnValues.empty()) {
                        if (!columnValues.empty())
                            columnValues.pop_back();
                        dataRows.push_back(columnValues);
                    }
                }
            }
        }

        vector<string> res;
        for (const auto& row : dataRows) {
            res.insert(res.end(), row.begin(), row.end());
        }
        return res;
    }

    static bool tryGetDataRow(ifstream& csvReader, bool skipEmptyRows, vector<string>& columnValues) {
        columnValues.clear();

        if (!csvReader.good())
            return false;

        bool isCurrentRowEmpty;
        do {
            columnValues.clear();
            bool openingQuote = false;
            string sb;

            char currentChar;
            while (csvReader.get(currentChar)) {

                if (currentChar == '\"') {
                    openingQuote = !openingQuote;
                }

                if (!openingQuote && currentChar == ',') {
                    columnValues.push_back(sb);
                    sb.clear();
                }
                else if (!openingQuote && (currentChar == '\n' || currentChar == '\r')) {
                    if (csvReader.peek() != EOF) {
                        char nextChar = csvReader.peek();
                        if (nextChar != currentChar && (nextChar == '\n' || nextChar == '\r')) {
                            csvReader.get();
                        }
                    }
                    if (!sb.empty() || !columnValues.empty()) {
                        columnValues.push_back(sb);
                    }
                    break;
                }
                else {
                    sb += currentChar;
                }
            }

            isCurrentRowEmpty = true;
            for (size_t i = 0; i < columnValues.size(); ++i) {
                string& itemValue = columnValues[i];

                if (!itemValue.empty()) {
                    size_t startIndex = (itemValue.front() == '\"') ? 1 : 0;
                    size_t endIndex = (itemValue.back() == '\"') ? itemValue.size() - 1 : itemValue.size();

                    string processedValue;
                    int quoteIndex = -1;
                    for (size_t j = startIndex; j < endIndex; ++j) {
                        if (itemValue[j] == '\"') {
                            if (static_cast<int>(j) - quoteIndex != 1) {
                                processedValue += '\"';
                            }
                            quoteIndex = j;
                        } else {
                            processedValue += itemValue[j];
                        }
                    }
                    processedValue.erase(0, processedValue.find_first_not_of(" \t\n\r\f\v"));
                    processedValue.erase(processedValue.find_last_not_of(" \t\n\r\f\v") + 1);

                    itemValue = processedValue;
                }

                if (!columnValues[i].empty()) {
                    isCurrentRowEmpty = false;
                }
            }

            if (skipEmptyRows && isCurrentRowEmpty) {
                columnValues.clear();
            }
        } while (skipEmptyRows && isCurrentRowEmpty && csvReader.good());

        return !columnValues.empty();
    }

    void writeFile(const vector<vector<string>>& dataRows) {
        string filePath = getMasterDataFilePath();

        vector<vector<string>> resRows;
        if (!filePath.empty()) {
            ifstream csvReader(filePath);
            if (csvReader.is_open()) {
                string line;
                getline(csvReader, line);
                while (true) {
                    vector<string> columnValues;
                    if (!tryGetDataRow(csvReader, true, columnValues)) break;
                    resRows.push_back(columnValues);
                }
            }
        }

        string folderPath;
        size_t pos = filePath.find_last_of("/\\");
        if (pos != string::npos) {
            folderPath = filePath.substr(0, pos);
        }

        string outputFilePath = folderPath.empty() ? "output.csv" : folderPath + "/output.csv";
        string failedCasesFilePath = folderPath.empty() ? "failedCases.csv" : folderPath + "/failedCases.csv";

        ofstream csvWriter(outputFilePath);
        ofstream csvWriter_2(failedCasesFilePath);

        if (!csvWriter.is_open() || !csvWriter_2.is_open()) {
            cerr << "Error opening output files.\n";
            return;
        }

        csvWriter << "Message,Extracted,Expected\n";
        csvWriter_2 << "Message,Extracted,Expected\n";

        int failCases = 0;
        for (size_t it = 0; it < dataRows.size(); ++it) {
            bool flag = false;
            if (dataRows[it].size() != 2 || (it < resRows.size() && dataRows[it][1] != resRows[it][1])) {
                failCases++;
                flag = true;
            }

            vector<string> rows;
            for (const string& data : dataRows[it]) {
                string sb;
                bool specialCharFound = false;
                for (char currentChar : data) {
                    sb += currentChar;
                    if (currentChar == '\"') {
                        sb += currentChar;
                    }
                    if (charsWithQuoteSet.count(currentChar) > 0) {
                        specialCharFound = true;
                    }
                }
                if (specialCharFound) {
                    sb = '\"' + sb + '\"';
                }
                rows.push_back(sb);
            }

            string expected = (it < resRows.size()) ? resRows[it][1] : "";
            rows.push_back(expected);

            for (size_t i = 0; i < rows.size(); ++i) {
                csvWriter << rows[i];
                if (i < rows.size() - 1) csvWriter << ",";
            }
            csvWriter << "\n";

            if (flag) {
                for (size_t i = 0; i < rows.size(); ++i) {
                    csvWriter_2 << rows[i];
                    if (i < rows.size() - 1) csvWriter_2 << ",";
                }
                csvWriter_2 << "\n";
            }
        }

        double accuracy = dataRows.empty() ? 0 : (dataRows.size() - failCases) / (double)dataRows.size() * 100;
        cout << "Accuracy: " << accuracy << "%\n";
        cout << "CSV writing completed successfully: " << outputFilePath << endl;

        csvWriter.close();
        csvWriter_2.close();
    }

    virtual string extractOtp(const string& dataRow) {
        return "";
    }

    virtual string getMasterDataFilePath() {
        return "";
    }
};
