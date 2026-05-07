// Controllers/ArchiveController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PdfToExcel.Data;

[Authorize]
public class ArchiveController : Controller
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public ArchiveController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    // صفحة الأرشيف
    public async Task<IActionResult> Index()
    {
        var records = await _context.BulletinArchives
            .OrderByDescending(x => x.Date)
            .ToListAsync();

        return View(records);
    }

    // تنزيل ملف من الأرشيف
    public IActionResult Download(int id, string type)
    {
        var record = _context.BulletinArchives.FirstOrDefault(x => x.Id == id);
        if (record == null) return NotFound();

        var fileName = type == "forex" ? record.ForexFilePath : record.OfficialFilePath;
        if (string.IsNullOrEmpty(fileName)) return NotFound();

        var path = Path.Combine(_env.WebRootPath, "files", "archive", fileName);
        if (!System.IO.File.Exists(path)) return NotFound("File not found on disk.");

        return PhysicalFile(path,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            fileName);
    }

    // حذف سجل من الأرشيف
    [HttpPost]
    public async Task<IActionResult> Delete(int id)
    {
        var record = await _context.BulletinArchives.FindAsync(id);
        if (record == null) return NotFound();

        // حذف الملفات من الديسك
        foreach (var fileName in new[] { record.ForexFilePath, record.OfficialFilePath })
        {
            if (string.IsNullOrEmpty(fileName)) continue;
            var path = Path.Combine(_env.WebRootPath, "files", "archive", fileName);
            if (System.IO.File.Exists(path)) System.IO.File.Delete(path);
        }

        _context.BulletinArchives.Remove(record);
        await _context.SaveChangesAsync();

        TempData["Success"] = "Record deleted.";
        return RedirectToAction("Index");
    }
}