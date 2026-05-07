using System.Text.Json;
using Azure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PdfToExcel.Models;
using PdfToExcel.Services;

namespace PdfToExcel.Controllers
{
    [ApiController]
    [Route("api/ocr")]
    [Authorize]
    public class OcrController : ControllerBase
    {
        private readonly PdfToImageService _pdf;
        private readonly OcrService _ocr;
        private readonly ExcelService _excel;
        private readonly AiService _ai;

        public OcrController(
            PdfToImageService pdf,
            OcrService ocr,
            ExcelService excel,
            AiService ai)
        {
            _pdf = pdf;
            _ocr = ocr;
            _excel = excel;
            _ai = ai;
        }

        [HttpPost("convert")]
        public async Task<IActionResult> Convert(IFormFile file)
        {
            if (file == null)
                return BadRequest("No file");

            // save PDF
            var pdfPath = Path.Combine("wwwroot/temp", Guid.NewGuid() + ".pdf");
            Directory.CreateDirectory("wwwroot/temp");

            using (var stream = new FileStream(pdfPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // PDF → images
            var images = _pdf.Convert(pdfPath);

            var fullText = "";

            // OCR
            foreach (var img in images)
            {
                fullText += _ocr.ExtractText(img) + "\n";
            }

            // AI 
            var aiRaw = await _ai.CleanOcrAsync(fullText);

            var aiResponse = JsonSerializer.Deserialize<AiResponse>(aiRaw);

            var cleanJson = aiResponse?.choices?[0]?.message?.content ?? "[]";

            // remove markdown if exists
            cleanJson = cleanJson.Replace("```json", "").Replace("```", "").Trim();

            // convert to objects
            var data = JsonSerializer.Deserialize<List<CurrencyRow>>(cleanJson);

            if (data == null || data.Count == 0)
                return BadRequest("AI failed to extract data");

            // convert to Excel format
            var table = data.Select(x => new List<string>
            {
                x.code,
                x.currency,
                x.buy.ToString(),
                x.sell.ToString()
            }).ToList();

            // Excel
            var excelFile = _excel.CreateExcel(table);

            var fullPath = Path.Combine("wwwroot/files", excelFile);

            var bytes = System.IO.File.ReadAllBytes(fullPath);

            return File(
                bytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                excelFile
            );
        }
    }
}