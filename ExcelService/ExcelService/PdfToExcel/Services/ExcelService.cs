using ClosedXML.Excel;

namespace PdfToExcel.Services
{
    public class ExcelService
    {
        public string CreateExcel(List<List<string>> table)
        {
            var fileName = $"converted_{Guid.NewGuid()}.xlsx";
            var path = Path.Combine("wwwroot/files", fileName);

            Directory.CreateDirectory("wwwroot/files");

            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Sheet1");

            for (int i = 0; i < table.Count; i++)
            {
                for (int j = 0; j < table[i].Count; j++)
                {
                    ws.Cell(i + 1, j + 1).Value = table[i][j];
                }
            }



            workbook.SaveAs(path);

            return fileName;
        }
    }
}