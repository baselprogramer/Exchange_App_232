using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PdfToExcel.Data;
using PdfToExcel.Models;
using PdfToExcel.Services;

namespace PdfToExcel.Controllers
{
    [Authorize]
    public class FilesController : Controller
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly PdfToImageService _pdfToImage;
        private readonly OcrService _ocr;
        private readonly ExcelService _excel;
        private readonly AiService _ai; 

        public FilesController(
            AppDbContext context,
            IWebHostEnvironment env,
            PdfToImageService pdfToImage,
            OcrService ocr,
            ExcelService excel,
            AiService ai) 
        {
            _context = context;
            _env = env;
            _pdfToImage = pdfToImage;
            _ocr = ocr;
            _excel = excel;
            _ai = ai; 
        }

        public IActionResult Index(int page = 1)
        {

            const int pageSize = 4;

            var filesQuery = _context.ConvertedFiles
                .OrderByDescending(x => x.CreatedAt);

            var totalFiles = filesQuery.Count();
            var pagedFiles = filesQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            ViewBag.Page = page;
            ViewBag.TotalPages = Math.Ceiling(totalFiles / (double)pageSize);
            ViewBag.TotalFiles = totalFiles;

            return View(pagedFiles);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                TempData["Error"] = "Please choose a PDF file.";
                return RedirectToAction("Index");
            }

            if (!string.Equals(Path.GetExtension(file.FileName), ".pdf", StringComparison.OrdinalIgnoreCase))
            {
                TempData["Error"] = "Only PDF files are allowed.";
                return RedirectToAction("Index");
            }

            var tempRoot = Path.Combine(_env.WebRootPath, "temp");
            Directory.CreateDirectory(tempRoot);

            var tempPdfPath = Path.Combine(tempRoot, $"{Guid.NewGuid()}.pdf");
            var generatedImages = new List<string>();

            try
            {
                await using (var stream = new FileStream(tempPdfPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                generatedImages = _pdfToImage.Convert(tempPdfPath);

             // OCR → FULL TEXT
                var fullText = "";

                foreach (var imagePath in generatedImages)
                {
                    fullText += _ocr.ExtractText(imagePath) + "\n";
                }

                if (string.IsNullOrWhiteSpace(fullText))
                {
                    TempData["Error"] = "OCR found no readable text.";
                    return RedirectToAction("Index");
                }

                // AI STEP
                var aiRaw = await _ai.CleanOcrAsync(fullText);

                var aiResponse = JsonSerializer.Deserialize<AiResponse>(aiRaw);
                var cleanJson = aiResponse?.choices?[0]?.message?.content ?? "[]";

                cleanJson = cleanJson.Replace("```json", "").Replace("```", "").Trim();

                var data = JsonSerializer.Deserialize<List<CurrencyRow>>(cleanJson);

                if (data == null || data.Count == 0)
                {
                    TempData["Error"] = "AI failed to extract structured data.";
                    return RedirectToAction("Index");
                }

                //  convert to Excel format
                var table = data.Select(x => new List<string>
                {
                    x.code,
                    x.currency,
                    x.buy.ToString(),
                    x.sell.ToString()
                }).ToList();

                var excelFileName = _excel.CreateExcel(table);

                var originalBaseName = Path.GetFileNameWithoutExtension(file.FileName);
                var safeName = string.Concat(originalBaseName.Split(Path.GetInvalidFileNameChars()));
                if (string.IsNullOrWhiteSpace(safeName))
                {
                    safeName = "converted-file";
                }

                var downloadName = $"{safeName}.xlsx";

                var entity = new ConvertedFile
                {
                    Id = Guid.NewGuid(),
                    FileName = downloadName,
                    FilePath = excelFileName,
                    CreatedAt = DateTime.UtcNow
                };

                _context.ConvertedFiles.Add(entity);
                await _context.SaveChangesAsync();

                TempData["Success"] = "File converted successfully ";
            }
            catch (Exception ex)
            {
                TempData["Error"] = ex.Message;
            }
            finally
            {
                if (System.IO.File.Exists(tempPdfPath))
                {
                    System.IO.File.Delete(tempPdfPath);
                }

                foreach (var imagePath in generatedImages)
                {
                    if (System.IO.File.Exists(imagePath))
                    {
                        System.IO.File.Delete(imagePath);
                    }
                }
            }

            return RedirectToAction("Index");
        }

        public IActionResult Download(Guid id)
        {
            var file = _context.ConvertedFiles.FirstOrDefault(x => x.Id == id);
            if (file == null) return NotFound();

            var path = Path.Combine(_env.WebRootPath, "files", file.FilePath);

            if (!System.IO.File.Exists(path))
            {
                return NotFound("Converted file not found.");
            }

            return PhysicalFile(path,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                file.FileName);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult Delete(Guid id)
        {
            var file = _context.ConvertedFiles.FirstOrDefault(x => x.Id == id);
            if (file == null) return RedirectToAction("Index");

            var path = Path.Combine(_env.WebRootPath, "files", file.FilePath);

            if (System.IO.File.Exists(path))
            {
                System.IO.File.Delete(path);
            }

            _context.ConvertedFiles.Remove(file);
            _context.SaveChanges();

            TempData["Success"] = "Converted file deleted.";
            return RedirectToAction("Index");
        }
    }
}