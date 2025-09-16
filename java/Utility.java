import java.io.*;
import java.util.*;

public class Utility {

    private static final Set<Character> charsWithQuoteSet = new HashSet<>(Arrays.asList(',', '\n', '\r', '\"'));

    public Utility(){}

    public String[] readFileData() {
        List<List<String>> dataRows = new ArrayList<>();
        String filePath = getMasterDataFilePath();

        if (filePath != null && !filePath.isEmpty() && new File(filePath).exists()) {
            try {
                BufferedReader csvReader = new BufferedReader(new FileReader(filePath));
                List<String> columnValues = new ArrayList<>();
                csvReader.readLine(); // Skip header
                while (tryGetDataRow(csvReader, true, columnValues)) {
                    columnValues.remove(columnValues.size() - 1);
                    dataRows.add(columnValues);
                    columnValues = new ArrayList<>();
                }
            } catch (IOException e) {
                System.out.println(e.getMessage());
            }
        }

        String[] res = dataRows.stream().flatMap(row -> row.stream()).toArray(size -> new String[size]);
        return res;
    }

    public static boolean tryGetDataRow(BufferedReader csvReader, boolean skipEmptyRows, java.util.List<String> columnValues) throws java.io.IOException {
        columnValues.clear();

        if (csvReader != null && csvReader.ready()) {
            boolean isCurrentRowEmpty;
            do {
                columnValues.clear();
                boolean openingQuote = false;
                StringBuilder sb = new StringBuilder();

                int intChar;
                while ((intChar = csvReader.read()) != -1) {
                    char currentChar = (char) intChar;

                    if (currentChar == '\"') {
                        openingQuote = !openingQuote;
                    }

                    if (!openingQuote && currentChar == ',') {
                        columnValues.add(sb.toString());
                        sb.setLength(0);
                    } else if (!openingQuote && (currentChar == '\n' || currentChar == '\r')) {
                        int nextIntChar = csvReader.read();
                        if (nextIntChar != -1) {
                            char nextChar = (char) nextIntChar;
                            if (nextChar != currentChar && (nextChar == '\n' || nextChar == '\r')) {
                                // skip second newline char in CRLF or LFCR
                            } else {
                                csvReader.reset();
                            }
                        }
                        if (sb.length() > 0 || !columnValues.isEmpty()) {
                            columnValues.add(sb.toString());
                        }
                        break;
                    } else {
                        sb.append(currentChar);
                    }

                    if (csvReader.markSupported()) {
                        csvReader.mark(1);
                    }
                    if (!csvReader.ready()) {
                        columnValues.add(sb.toString());
                    }
                }

                isCurrentRowEmpty = true;
                for (int i = 0; i < columnValues.size(); i++) {
                    String itemValue = columnValues.get(i);

                    if (!itemValue.isEmpty()) {
                        int startIndex = itemValue.charAt(0) == '\"' ? 1 : 0;
                        int endIndex = itemValue.length() - (itemValue.charAt(itemValue.length() - 1) == '\"' ? 1 : 0);

                        StringBuilder processedValue = new StringBuilder();
                        int quoteIndex = -1;
                        for (int j = startIndex; j < endIndex; j++) {
                            if (itemValue.charAt(j) == '\"') {
                                if (j - quoteIndex != 1) {
                                    processedValue.append('\"');
                                }
                                quoteIndex = j;
                            } else {
                                processedValue.append(itemValue.charAt(j));
                            }
                        }

                        columnValues.set(i, processedValue.toString().trim());
                    }

                    if (!columnValues.get(i).isEmpty()) {
                        isCurrentRowEmpty = false;
                    }
                }

                if (skipEmptyRows && isCurrentRowEmpty) {
                    columnValues.clear();
                }
            } while (skipEmptyRows && isCurrentRowEmpty && csvReader.ready());
        }

        return !columnValues.isEmpty();
    }

    public void writeFile(String[][] dataRows) {
        List<List<String>> dataRow = new ArrayList<>();
        String filePath = getMasterDataFilePath();

        if (filePath != null && !filePath.isEmpty() && new File(filePath).exists()) {
            try {
                BufferedReader csvReader = new BufferedReader(new FileReader(filePath));
                List<String> columnValues = new ArrayList<>();
                csvReader.readLine(); // Skip header
                while (tryGetDataRow(csvReader, true, columnValues)) {
                    dataRow.add(columnValues);
                    columnValues = new ArrayList<>();
                }
            } catch (IOException e) {
                System.out.println(e.getMessage());
            }
        }

        String[][] res = dataRow.stream().map(row -> row.toArray(new String[0])).toArray(size -> new String[size][]);

        File originalFile = new File(filePath);
        String folderPath = originalFile.getParent();
        String outputFilePath ="";
        String failedCasesFilePath ="";
        if(folderPath==null){
            outputFilePath ="output.csv";
            failedCasesFilePath ="failedCases.csv";
        }
        else{
            outputFilePath =folderPath + File.separator + "output.csv";
            failedCasesFilePath =folderPath + File.separator + "failedCases.csv";
        }

        int failCases = 0;
        BufferedWriter csvWriter = null;
        BufferedWriter csvWriter_2= null;

        try {
            csvWriter = new BufferedWriter(new FileWriter(outputFilePath));
            csvWriter.write("Message,Extracted,Expected\n");

            csvWriter_2 = new BufferedWriter(new FileWriter(failedCasesFilePath));
            csvWriter_2.write("Message,Extracted,Expected\n");

            for (int it = 0; it < dataRows.length; it++) {
                boolean flag=false;
                if (dataRows[it].length != 2 || !dataRows[it][1].equalsIgnoreCase(res[it][1])) {
                    failCases++;
                    flag=true;
                }

                List<String> rows = new ArrayList<>();
                for (String data : dataRows[it]) {
                    StringBuilder sb = new StringBuilder();
                    boolean specialCharFound = false;

                    for (int i = 0; i < data.length(); i++) {
                        char currentChar = data.charAt(i);
                        sb.append(currentChar);

                        if (currentChar == '\"') {
                            sb.append(currentChar);
                        }

                        if (charsWithQuoteSet.contains(currentChar)) {
                            specialCharFound = true;
                        }
                    }

                    if (specialCharFound) {
                        sb.insert(0, '\"').append('\"');
                    }

                    rows.add(sb.toString());

                }

                rows.add(res[it][1]);

                csvWriter.write(String.join(",", rows));
                csvWriter.newLine();

                if(flag){
                    csvWriter_2.write(String.join(",", rows));
                    csvWriter_2.newLine();
                }
            }

            double accuracy = (dataRows.length - failCases) / (double) dataRows.length * 100;
            System.out.println("Accuracy: " + accuracy + "%");
            System.out.println("CSV writing completed successfully: " + outputFilePath);

        } catch (IOException ex) {
            System.out.println("Error writing CSV: " + ex.getMessage());
        } finally {
            try {
                if (csvWriter != null) {
                    csvWriter.close();
                }
                if (csvWriter_2 != null) {
                    csvWriter_2.close();
                }
            } catch (IOException e) {
                System.out.println("Error closing CSV writer: " + e.getMessage());
            }
        }
    }

    public String extractOtp(String dataRow) {
        return "";
    }

    public String getMasterDataFilePath() {
        return "";
    }
}
