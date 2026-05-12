using ClosedXML.Excel;
using PdfToExcel.Models;
using System.Globalization;

public class ExcelReaderService
{
    public (bool isValid, string error) ValidateForex(string path)
    {
        try
        {
            using var workbook = new XLWorkbook(path);
            var ws = workbook.Worksheet(1);

            var headerMap = BuildHeaderMap(ws);
            if (!HasRequiredColumns(headerMap))
            {
                return (false, "Invalid Excel format. Required headers: Code, Country, Buy, Sell.");
            }

            if (ws.RowsUsed().Count() <= 1)
                return (false, "Excel file is empty.");

            return (true, string.Empty);
        }
        catch
        {
            return (false, "Invalid or corrupted Excel file.");
        }
    }

    public (bool isValid, string error) ValidateOfficial(string path)
    {
        try
        {
            using var workbook = new XLWorkbook(path);
            var ws = workbook.Worksheet(1);

            var headerMap = BuildHeaderMap(ws);
            if (!HasRequiredColumns(headerMap))
            {
                return (false, "Invalid Excel format. Required headers: Code, Country, Buy, Sell.");
            }

            if (ws.RowsUsed().Count() <= 1)
                return (false, "Excel file is empty.");

            return (true, string.Empty);
        }
        catch
        {
            return (false, "Invalid or corrupted Excel file.");
        }
    }

    public List<ForexCurrency> ReadForex(string path)
    {
        using var workbook = new XLWorkbook(path);
        var ws = workbook.Worksheet(1);
        var headerMap = BuildHeaderMap(ws);

        var list = new List<ForexCurrency>();
        int id = 1;
        foreach (var row in ws.RowsUsed().Skip(1))
        {
            var code = GetTextCell(row, headerMap, "code");
            var country = GetTextCell(row, headerMap, "country");
            var mid = GetNumberCell(row, headerMap, "mid");

            if (string.IsNullOrWhiteSpace(code) && string.IsNullOrWhiteSpace(country))
                continue;

            var buy = GetNumberCell(row, headerMap, "buy");
            var sell = GetNumberCell(row, headerMap, "sell");

            list.Add(new ForexCurrency
            {
                Id = id++,
                Flag = GetFlag(code),
                Country = country,
                Code = code,
                Buy = (decimal)buy,
                Sell = (decimal)sell,

            });
        }

        return list;
    }

    public List<OfficialCurrency> ReadOfficial(string path)
    {
        using var workbook = new XLWorkbook(path);
        var ws = workbook.Worksheet(1);
        var headerMap = BuildHeaderMap(ws);

        var list = new List<OfficialCurrency>();
        int id = 1;
        foreach (var row in ws.RowsUsed().Skip(1))
        {
            var code = GetTextCell(row, headerMap, "code");
            var country = GetTextCell(row, headerMap, "country");

            if (string.IsNullOrWhiteSpace(code) && string.IsNullOrWhiteSpace(country))
                continue;

            var buy = GetNumberCell(row, headerMap, "buy");
            var sell = GetNumberCell(row, headerMap, "sell");

            list.Add(new OfficialCurrency
            {
                Id = id++,
                Flag = GetFlag(code),
                Country = country,
                Code = code,
                Buy = (decimal)buy,
                Sell = (decimal)sell
                
            });
        }

        return list;
    }

    private static Dictionary<string, int> BuildHeaderMap(IXLWorksheet worksheet)
    {
        var map = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var row = worksheet.Row(1);

        foreach (var cell in row.CellsUsed())
        {
            var key = NormalizeHeader(cell.GetString());
            if (!string.IsNullOrWhiteSpace(key) && !map.ContainsKey(key))
            {
                map[key] = cell.Address.ColumnNumber;
            }
        }

        return map;
    }

    private static bool HasRequiredColumns(Dictionary<string, int> headerMap)
        => headerMap.ContainsKey("code")
           && headerMap.ContainsKey("country")
           && headerMap.ContainsKey("buy")
           && headerMap.ContainsKey("sell");

    private static string NormalizeHeader(string header)
        => (header ?? string.Empty)
            .Trim()
            .ToLowerInvariant()
            .Replace(" ", string.Empty)
            .Replace("_", string.Empty);

    private static string GetTextCell(IXLRow row, Dictionary<string, int> headerMap, string key)
    {
        return headerMap.TryGetValue(key, out var column)
            ? row.Cell(column).GetString().Trim()
            : string.Empty;
    }

    private static double GetNumberCell(IXLRow row, Dictionary<string, int> headerMap, string key)
    {
        if (!headerMap.TryGetValue(key, out var column))
            return 0;

        var cell = row.Cell(column);
        if (cell.TryGetValue<double>(out var asDouble))
            return asDouble;

        var raw = cell.GetString().Trim().Replace(",", string.Empty);
        if (double.TryParse(raw, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed))
            return parsed;

        return 0;
    }

    private string GetFlag(string code)
    {
        if (string.IsNullOrWhiteSpace(code) || code.Length < 2)
            return string.Empty;

        return $"https://flagcdn.com/w40/{code.ToLowerInvariant().Substring(0, 2)}.png";
    }
}
