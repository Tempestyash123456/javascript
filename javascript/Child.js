const Utility = require("./Utility");

class Child extends Utility {
    static otpRegex = /\b(?:\d{4,8}|\d{3,4}[-\s]\d{3,4})\b/g;
    static keywords = new Set([
        "otp", "password", "code", "verification", "auth",
        "pin", "passcode", "refuse", "pickupcode"
    ]);
    static strongKeywords = new Set([
        "code refuse", "do not share", "pickupcode"
    ]);
    static ignoreWords = new Set([
        "rs", "call us", "customer care", "helpline", "inr",
        "ending", "a/c", "card", "order", "date", "dt",
        "cash", "txn", "awb", "recorded", "bal", "temp",
        "delivery", "id"
    ]);

    static keywordRegex = new RegExp(`\\b(${Array.from(Child.keywords).join('|')})\\b`, 'g');
    static strongKeywordRegex = new RegExp(`\\b(${Array.from(Child.strongKeywords).join('|')})\\b`, 'g');
    static ignoreRegex = new RegExp(`\\b(${Array.from(Child.ignoreWords).join('|')})\\b`, 'g');


    getMasterDataFilePath() {
        return "../master_data.csv";
    }

    extractOtp(message) {
        if (typeof message !== "string")
            return "nan";


        const msg = message.toLowerCase();
        Child.otpRegex.lastIndex = 0;
        const matches = Array.from(msg.matchAll(Child.otpRegex));

        if (matches.length === 0)
            return "nan";

        let bestCandidate = null;
        let bestScore = -Infinity;

        for (const match of matches) {
            const rawValue = match[0];
            const otp = rawValue.replace(/[-\s]/g, "");

            if (/^0+$/.test(otp)) continue;

            const position = match.index;
            const before = msg.slice(Math.max(0, position - 20), position);
            const after = msg.slice(position + rawValue.length, Math.min(msg.length, position + rawValue.length + 30));

            if (Child.ignoreRegex.test(before)) continue;

            const score = this.calculateScore(otp, before, after);
            if (score > bestScore) {
                bestScore = score;
                bestCandidate = { otp, score };
            }
        }

        return bestCandidate?.otp || "nan";
    }


    calculateScore(o, b, a) {
        let s = o.length;
        const kb = b.match(Child.keywordRegex) || [];
        const ka = a.match(Child.keywordRegex) || [];
        s += (kb.length * 10) + (ka.length * 5);
        const sb = b.match(Child.strongKeywordRegex) || [];
        const sa = a.match(Child.strongKeywordRegex) || [];
        s += (sa.length * 10) + (sb.length * 5);
        return s;
    }
}

module.exports = Child;