using System;

namespace PdfToExcel.Models
{
    public class ConvertedFile
    {
        public Guid Id { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
