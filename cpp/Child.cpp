#include "Utility.cpp"
#include <regex>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

class Child : public Utility {
public:
    string getMasterDataFilePath() override {
        //Write path to your input master data.
        return "../master_data.csv";
    }

    string extractOtp(const string& message) override {
        // A list of specific regex patterns to find the OTP.
        // They are ordered by specificity.
        vector<regex> specific_patterns = {
            regex("Your OTP is (\\d{4,8})", regex::icase),
            regex("OTP for .*? is (\\d{4,8})", regex::icase),
            regex("(\\d{4,8}) is your OTP", regex::icase),
            regex("verification (?:code|pin) is (\\d{4,8})", regex::icase),
            regex("(\\d{4,8}) is your verification (?:number|code)", regex::icase),
            regex("one[- ]?time password.*?(\\d{4,8})", regex::icase),
            regex("secure code is (\\d{4,8})", regex::icase),
            regex("authentication code:? (\\d{4,8})", regex::icase),
            regex("use (\\d{4,8}) to verify", regex::icase),
            regex("enter (\\d{4,8})", regex::icase)
        };

        smatch match;
        for (const auto& pattern : specific_patterns) {
            if (regex_search(message, match, pattern) && match.size() > 1) {
                return match.str(1);
            }
        }

        // Generic fallback
        regex generic_regex("\\b(\\d{4,8})\\b");
        auto numbers_begin = sregex_iterator(message.begin(), message.end(), generic_regex);
        auto numbers_end = sregex_iterator();

        vector<string> numbers;
        for (sregex_iterator i = numbers_begin; i != numbers_end; ++i) {
            numbers.push_back((*i).str(1));
        }

        if (numbers.size() == 1) {
            return numbers[0];
        } else if (numbers.size() > 1) {
            // If there are multiple numbers, we need to decide which one is the OTP.
            // A common heuristic is to prefer 6-digit numbers.
            for (const auto& num : numbers) {
                if (num.length() == 6) {
                    return num;
                }
            }
            // If no 6-digit number is found, return the last one, as OTPs are often at the end of the message.
            return numbers.back();
        }

        return "";
    }
};