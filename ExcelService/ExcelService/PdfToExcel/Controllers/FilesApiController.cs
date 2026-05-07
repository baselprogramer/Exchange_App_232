using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PdfToExcel.Data;

namespace PdfToExcel.Controllers
{
    [ApiController]
    [Route("api/files")]
    [Authorize]
    public class FilesApiController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public FilesApiController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // GET: api/files
        [HttpGet]
        public IActionResult GetAll()
        {
            var files = _context.ConvertedFiles
                .OrderByDescending(x => x.CreatedAt)
                .ToList();

            return Ok(files);
        }

        // GET: api/files/{id}
        [HttpGet("{id}")]
        public IActionResult GetById(Guid id)
        {
            var file = _context.ConvertedFiles.FirstOrDefault(x => x.Id == id);

            if (file == null)
                return NotFound();

            return Ok(file);
        }

        // DOWNLOAD FILE API
        // GET: api/files/download/{id}
        [HttpGet("download/{id}")]
        public IActionResult Download(Guid id)
        {
            var file = _context.ConvertedFiles.FirstOrDefault(x => x.Id == id);

            if (file == null)
                return NotFound();

            var path = Path.Combine(_env.WebRootPath, "files", file.FilePath);

            if (!System.IO.File.Exists(path))
                return NotFound("File not found on server");

            var contentType = "application/octet-stream";

            return PhysicalFile(path, contentType, file.FileName);
        }
    }
}