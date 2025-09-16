using System;

public class RunnerClass
{
	public static void Main(string[] args)
	{
		Utility obj = new Child();

		string[] csvData = obj.ReadFileData();
		string[][] extractedData = new string[csvData.Length][];

		for (int i = 0; i < csvData.Length; i++)
		{
			string otp = obj.ExtractOtp(csvData[i]);
			extractedData[i] = new string[2];
			extractedData[i][0] = csvData[i];
			extractedData[i][1] = otp;
		}

		obj.WriteFile(extractedData);
	}
}
