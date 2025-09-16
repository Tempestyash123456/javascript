import os
import csv

class Utility:
    chars_with_quote_set = {',', '\n', '\r', '"'}

    def __init__(self):
        pass

    def get_master_data_file_path(self):
        return ""

    def read_file_data(self):
        file_path = self.get_master_data_file_path()
        data_rows = []

        if file_path and os.path.exists(file_path):
            with open(file_path, mode='r', newline='', encoding='utf-8') as csvfile:
                reader = csv.reader(csvfile)
                next(reader, None)  
                for row in reader:
                    if row:
                        row.pop()  
                        data_rows.append(row)

        res = [item for sublist in data_rows for item in sublist]
        return res

    def write_file(self, data_rows):
        file_path = self.get_master_data_file_path()
        folder_path = os.path.dirname(file_path) if file_path else ""

        if not folder_path:
            output_file_path = "output.csv"
            failed_cases_file_path = "failedCases.csv"
        else:
            output_file_path = os.path.join(folder_path, "output.csv")
            failed_cases_file_path = os.path.join(folder_path, "failedCases.csv")

        res = []
        if file_path and os.path.exists(file_path):
            with open(file_path, mode='r', newline='', encoding='utf-8') as csvfile:
                reader = csv.reader(csvfile)
                next(reader, None)  
                for row in reader:
                    res.append(row)

        fail_cases = 0
        with open(output_file_path, mode='w', newline='', encoding='utf-8') as csvfile_out, \
             open(failed_cases_file_path, mode='w', newline='', encoding='utf-8') as csvfile_fail:

            writer_out = csv.writer(csvfile_out)
            writer_fail = csv.writer(csvfile_fail)

            writer_out.writerow(["Message", "Extracted", "Expected"])
            writer_fail.writerow(["Message", "Extracted", "Expected"])

            for i in range(len(data_rows)):
                flag = False
               
                expected_value = res[i][1] if i < len(res) and len(res[i]) > 1 else ""
                if len(data_rows[i]) != 2 or data_rows[i][1].lower() != expected_value.lower():
                    fail_cases += 1
                    flag = True

                row = []
                for data in data_rows[i]:
                    special_char_found = any(ch in self.chars_with_quote_set for ch in data)
                    data_escaped = data.replace('"', '""')
                    if special_char_found:
                        data_escaped = f'"{data_escaped}"'
                    row.append(data_escaped)

                row.append(expected_value)

                writer_out.writerow(row)

                if flag:
                    writer_fail.writerow(row)

            accuracy = (len(data_rows) - fail_cases) / len(data_rows) * 100 if data_rows else 0
            print(f"Accuracy: {accuracy}%")
            print(f"CSV writing completed successfully: {output_file_path}")

    def extract_otp(self, message):
        return "113244"

