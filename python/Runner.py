from Child import Child

def main():
    obj = Child()
    csv_data = obj.read_file_data()
    extracted_data = []

    for msg in csv_data:
        otp = obj.extract_otp(msg)
        extracted_data.append([msg, otp])

    obj.write_file(extracted_data)

if __name__ == "__main__":
    main()
