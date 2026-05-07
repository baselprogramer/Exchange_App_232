using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PdfToExcel.Data;
using PdfToExcel.Models;

[Authorize]
public class CurrencyController : Controller
{
    private readonly ExcelReaderService _excel;
    private readonly IWebHostEnvironment _env;
    private readonly AppDbContext _context;

    public CurrencyController(
        ExcelReaderService excel,
        IWebHostEnvironment env,
        AppDbContext context)
    {
        _excel = excel;
        _env = env;
        _context = context;
    }


    [HttpPost]
    public async Task<IActionResult> UploadExcel(IFormFile file, string type)
    {
        var targetAction = type == "forex" ? "Forex" : "Official";

        if (file == null || file.Length == 0)
        {
            TempData["Error"] = "Please select a file.";
            return RedirectToAction(targetAction);
        }

        if (!Path.GetExtension(file.FileName).Equals(".xlsx", StringComparison.OrdinalIgnoreCase))
        {
            TempData["Error"] = "Only .xlsx files are supported.";
            return RedirectToAction(targetAction);
        }

        var folder = Path.Combine(_env.WebRootPath, "files");
        Directory.CreateDirectory(folder);

        var fileName = type == "forex" ? "forex.xlsx" : "official.xlsx";
        var finalPath = Path.Combine(folder, fileName);

        var tempPath = Path.Combine(folder, Guid.NewGuid() + ".xlsx");

        // SAVE TEMP FILE
        await using (var stream = new FileStream(tempPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // VALIDATE
        var result = type == "forex"
            ? _excel.ValidateForex(tempPath)
            : _excel.ValidateOfficial(tempPath);

        if (!result.isValid)
        {
            System.IO.File.Delete(tempPath);
            TempData["Error"] = result.error;
            return RedirectToAction(targetAction);
        }

        // REPLACE FINAL FILE
        if (System.IO.File.Exists(finalPath))
        {
            System.IO.File.Delete(finalPath);
        }

        System.IO.File.Move(tempPath, finalPath);

        TempData["Preview"] = type;

        TempData["Success"] = "Excel uploaded successfully. Click Publish to apply changes.";
        return RedirectToAction(targetAction);
    }

    [HttpPost]
    public async Task<IActionResult> PublishForex()
    {
        var result = await PublishInternalAsync("forex", null);
        if (IsAjaxRequest())
        {
            return result.success
                ? Ok(new { message = result.message, count = result.count })
                : BadRequest(new { message = result.message });
        }

        TempData[result.success ? "Success" : "Error"] = result.message;
        return RedirectToAction("Forex");
    }

    [HttpPost]
    public async Task<IActionResult> PublishOfficial()
    {
        decimal? priceMargin = null;

        try
        {
            using (var reader = new StreamReader(Request.Body))
            {
                var body = await reader.ReadToEndAsync();

                if (!string.IsNullOrEmpty(body))
                {
                    var json = System.Text.Json.JsonDocument.Parse(body);

                    if (json.RootElement.TryGetProperty("priceMargin", out var marginElement))
                    {
                        if (marginElement.ValueKind != System.Text.Json.JsonValueKind.Null)
                        {
                            priceMargin = marginElement.GetDecimal();
                        }
                    }
                }
            }
        }
        catch
        {
        }

        var result = await PublishInternalAsync("official", priceMargin);

        if (IsAjaxRequest())
        {
            return result.success
                ? Ok(new { message = result.message, count = result.count })
                : BadRequest(new { message = result.message });
        }

        TempData[result.success ? "Success" : "Error"] = result.message;
        return RedirectToAction("Official");
    }

    [HttpGet]
    public IActionResult DownloadExcel(string type)
    {
        var normalizedType = type == "official" ? "official" : "forex";
        var path = Path.Combine(_env.WebRootPath, "files", $"{normalizedType}.xlsx");

        if (!System.IO.File.Exists(path))
        {
            TempData["Error"] = $"No {normalizedType} Excel file is available to download yet.";
            return RedirectToAction(normalizedType == "forex" ? "Forex" : "Official");
        }

        var bytes = System.IO.File.ReadAllBytes(path);
        return File(bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"{normalizedType}.xlsx");
    }
    [HttpPost]
    public async Task<IActionResult> Clear([FromBody] JsonElement body)
    {
        var type = body.GetProperty("type").GetString();

        if (type == "forex")
        {
            _context.ForexCurrencies.RemoveRange(_context.ForexCurrencies);
            await _context.SaveChangesAsync();

            var path = Path.Combine(_env.WebRootPath, "files", "forex.xlsx");
            if (System.IO.File.Exists(path))
                System.IO.File.Delete(path);

            return Ok(new { message = "Forex table cleared." });
        }

        if (type == "official")
        {
            _context.OfficialCurrencies.RemoveRange(_context.OfficialCurrencies);
            await _context.SaveChangesAsync();

            var path = Path.Combine(_env.WebRootPath, "files", "official.xlsx");
            if (System.IO.File.Exists(path))
                System.IO.File.Delete(path);

            return Ok(new { message = "Official table cleared." });
        }

        return BadRequest(new { message = "Invalid type." });
    }

    public async Task<IActionResult> Forex()
    {
        var path = Path.Combine(_env.WebRootPath, "files", "forex.xlsx");

        if (TempData.Peek("Preview")?.ToString() == "forex" && System.IO.File.Exists(path))
        {
            var preview = _excel.ReadForex(path);
            return View(preview);
        }

        var data = await _context.ForexCurrencies
            .AsNoTracking()
            .OrderBy(x => x.Id)
            .ToListAsync();

        return View(data);
    }

    public async Task<IActionResult> Official()
    {
        var path = Path.Combine(_env.WebRootPath, "files", "official.xlsx");

        if (TempData.Peek("Preview")?.ToString() == "official" && System.IO.File.Exists(path))
        {
            var preview = _excel.ReadOfficial(path);
            return View(preview);
        }

        var data = await _context.OfficialCurrencies
            .AsNoTracking()
            .OrderBy(x => x.Id)
            .ToListAsync();

        return View(data);
    }

    private bool IsAjaxRequest() =>
        Request.Headers.TryGetValue("X-Requested-With", out var requestedWith) &&
        string.Equals(requestedWith, "XMLHttpRequest", StringComparison.OrdinalIgnoreCase);

    private async Task<(bool success, string message, int count)> PublishInternalAsync(string type, decimal? priceMargin)
    {
        var path = Path.Combine(_env.WebRootPath, "files", $"{type}.xlsx");
        if (!System.IO.File.Exists(path))
        {
            return (false, $"No {type} file found. Please import Excel first.", 0);
        }

        var today = DateTime.UtcNow.Date;

        if (type == "forex")
        {
            var data = _excel.ReadForex(path);

            foreach (var item in data)
            {
                item.Id = 0;
            }
            _context.ForexCurrencies.RemoveRange(_context.ForexCurrencies);
            await _context.SaveChangesAsync();


            _context.ForexCurrencies.AddRange(data);
            await _context.SaveChangesAsync();

            // ── أرشيف ──
        var archiveFileName = $"forex_{today:yyyy-MM-dd}.xlsx";
        var archivePath = Path.Combine(_env.WebRootPath, "files", "archive", archiveFileName);
        Directory.CreateDirectory(Path.Combine(_env.WebRootPath, "files", "archive"));
        System.IO.File.Copy(path, archivePath, overwrite: true);

        var record = await _context.BulletinArchives.FirstOrDefaultAsync(x => x.Date == today);
        if (record == null)
        {
            record = new BulletinArchive { Date = today };
            _context.BulletinArchives.Add(record);
        }
        record.ForexFilePath = archiveFileName;
        await _context.SaveChangesAsync();
        // ────────────

            return (true, $"Published {data.Count} forex rows.", data.Count);
        }

        var officialData = _excel.ReadOfficial(path);

        foreach (var item in officialData)
        {
            item.Id = 0;
        }

        _context.OfficialCurrencies.RemoveRange(_context.OfficialCurrencies);
        await _context.SaveChangesAsync();


        _context.OfficialCurrencies.AddRange(officialData);
        await _context.SaveChangesAsync();
        var existing = await _context.PriceMargins.FirstOrDefaultAsync();

        if (existing == null)
        {
            existing = new PriceMarginModel();
            _context.PriceMargins.Add(existing);
        }

        existing.PriceMargin = priceMargin;

        await _context.SaveChangesAsync();

            // ── أرشيف ──
    var offArchiveFileName = $"official_{today:yyyy-MM-dd}.xlsx";
    var offArchivePath = Path.Combine(_env.WebRootPath, "files", "archive", offArchiveFileName);
    Directory.CreateDirectory(Path.Combine(_env.WebRootPath, "files", "archive"));
    System.IO.File.Copy(path, offArchivePath, overwrite: true);

    var offRecord = await _context.BulletinArchives.FirstOrDefaultAsync(x => x.Date == today);
    if (offRecord == null)
    {
        offRecord = new BulletinArchive { Date = today };
        _context.BulletinArchives.Add(offRecord);
    }
    offRecord.OfficialFilePath = offArchiveFileName;
    await _context.SaveChangesAsync();
    // ────────────

        return (true, $"Published {officialData.Count} official rows.", officialData.Count);
    }
}
