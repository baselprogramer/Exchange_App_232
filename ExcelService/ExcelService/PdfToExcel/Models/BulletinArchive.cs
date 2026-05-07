namespace PdfToExcel.Models
{
    public class BulletinArchive
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }                    // تاريخ النشرة
        public string? ForexFilePath { get; set; }            // اسم ملف الفوركس
        public string? OfficialFilePath { get; set; }         // اسم ملف الرسمي
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}