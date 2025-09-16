using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
public class Utility
{
	private static readonly HashSet<char> charsWithQuoteSet = new HashSet<char> { ',', '\n', '\r', '\"' };

	public Utility() { }

	public virtual string GetMasterDataFilePath()
	{
		return "";
	}

	public virtual string ExtractOtp(string dataRow)
	{
		return "";
	}

	public string[] ReadFileData()
	{
		List<List<string>> dataRows = new List<List<string>>();
		string filePath = GetMasterDataFilePath();

		if (!string.IsNullOrEmpty(filePath) && File.Exists(filePath))
		{
			try
			{
				using (StreamReader csvReader = new StreamReader(filePath))
				{
					string header = csvReader.ReadLine(); // Skip header
					List<string> columnValues = new List<string>();

					while (TryGetDataRow(csvReader, true, columnValues))
					{
						columnValues.RemoveAt(columnValues.Count - 1);
						dataRows.Add(new List<string>(columnValues));
						columnValues = new List<string>();
					}
				}
			}
			catch (IOException e)
			{
				Console.WriteLine(e.Message);
			}
		}

		return dataRows.SelectMany(row => row).ToArray();
	}

	public static bool TryGetDataRow(StreamReader csvReader, bool skipEmptyRows, List<string> columnValues)
	{
		columnValues.Clear();

		if (csvReader != null && !csvReader.EndOfStream)
		{
			bool isCurrentRowEmpty;
			do
			{
				columnValues.Clear();
				bool openingQuote = false;
				StringBuilder sb = new StringBuilder();

				int intChar;
				while ((intChar = csvReader.Read()) != -1)
				{
					char currentChar = (char)intChar;

					if (currentChar == '\"')
					{
						openingQuote = !openingQuote;
					}

					if (!openingQuote && currentChar == ',')
					{
						columnValues.Add(sb.ToString());
						sb.Clear();
					}
					else if (!openingQuote && (currentChar == '\n' || currentChar == '\r'))
					{
						int nextIntChar = csvReader.Peek();
						if (nextIntChar != -1)
						{
							char nextChar = (char)nextIntChar;
							if (nextChar == '\n' || nextChar == '\r')
							{
								csvReader.Read(); 
							}
						}

						if (sb.Length > 0 || columnValues.Count > 0)
						{
							columnValues.Add(sb.ToString());
						}
						break;
					}
					else
					{
						sb.Append(currentChar);
					}

					if (csvReader.EndOfStream)
					{
						columnValues.Add(sb.ToString());
					}
				}

				isCurrentRowEmpty = true;
				for (int i = 0; i < columnValues.Count; i++)
				{
					string itemValue = columnValues[i];

					if (!string.IsNullOrEmpty(itemValue))
					{
						int startIndex = itemValue.StartsWith("\"") ? 1 : 0;
						int endIndex = itemValue.EndsWith("\"") ? itemValue.Length - 1 : itemValue.Length;

						StringBuilder processedValue = new StringBuilder();
						int quoteIndex = -1;

						for (int j = startIndex; j < endIndex; j++)
						{
							if (itemValue[j] == '\"')
							{
								if (j - quoteIndex != 1)
								{
									processedValue.Append('\"');
								}
								quoteIndex = j;
							}
							else
							{
								processedValue.Append(itemValue[j]);
							}
						}

						columnValues[i] = processedValue.ToString().Trim();
					}

					if (!string.IsNullOrEmpty(columnValues[i]))
					{
						isCurrentRowEmpty = false;
					}
				}

				if (skipEmptyRows && isCurrentRowEmpty)
				{
					columnValues.Clear();
				}

			} while (skipEmptyRows && isCurrentRowEmpty && !csvReader.EndOfStream);
		}

		return columnValues.Count > 0;
	}

	public void WriteFile(string[][] dataRows)
	{
		List<List<string>> dataRow = new List<List<string>>();
		string filePath = GetMasterDataFilePath();

		if (!string.IsNullOrEmpty(filePath) && File.Exists(filePath))
		{
			try
			{
				using (StreamReader csvReader = new StreamReader(filePath))
				{
					csvReader.ReadLine(); // Skip header
					List<string> columnValues = new List<string>();

					while (TryGetDataRow(csvReader, true, columnValues))
					{
						dataRow.Add(new List<string>(columnValues));
						columnValues = new List<string>();
					}
				}
			}
			catch (IOException e)
			{
				Console.WriteLine(e.Message);
			}
		}

		string[][] res = dataRow.Select(row => row.ToArray()).ToArray();

		FileInfo originalFile = new FileInfo(filePath);
		string folderPath = originalFile.DirectoryName;

		string outputFilePath = string.IsNullOrEmpty(folderPath) ? "output.csv" : Path.Combine(folderPath, "output.csv");
		string failedCasesFilePath = string.IsNullOrEmpty(folderPath) ? "failedCases.csv" : Path.Combine(folderPath, "failedCases.csv");

		int failCases = 0;

		try
		{
			using (StreamWriter csvWriter = new StreamWriter(outputFilePath))
			using (StreamWriter csvWriter_2 = new StreamWriter(failedCasesFilePath))
			{
				csvWriter.WriteLine("Message,Extracted,Expected");
				csvWriter_2.WriteLine("Message,Extracted,Expected");

				for (int it = 0; it < dataRows.Length; it++)
				{
					bool flag = false;
					if (dataRows[it].Length != 2 || !dataRows[it][1].Equals(res[it][1], StringComparison.OrdinalIgnoreCase))
					{
						failCases++;
						flag = true;
					}

					List<string> rows = new List<string>();
					foreach (string data in dataRows[it])
					{
						StringBuilder sb = new StringBuilder();
						bool specialCharFound = false;

						foreach (char currentChar in data)
						{
							sb.Append(currentChar);

							if (currentChar == '\"')
							{
								sb.Append(currentChar);
							}

							if (charsWithQuoteSet.Contains(currentChar))
							{
								specialCharFound = true;
							}
						}

						if (specialCharFound)
						{
							sb.Insert(0, '\"').Append('\"');
						}

						rows.Add(sb.ToString());
					}

					rows.Add(res[it][1]);

					csvWriter.WriteLine(string.Join(",", rows));
					if (flag)
					{
						csvWriter_2.WriteLine(string.Join(",", rows));
					}
				}

				double accuracy = ((double)(dataRows.Length - failCases) / dataRows.Length) * 100;
				Console.WriteLine("Accuracy: " + accuracy + "%");
				Console.WriteLine("CSV writing completed successfully: " + outputFilePath);
			}
		}
		catch (IOException ex)
		{
			Console.WriteLine("Error writing CSV: " + ex.Message);
		}
	}
}

