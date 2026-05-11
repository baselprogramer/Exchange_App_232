namespace PdfToExcel.Models
{
    public class PriceMarginModel
    {
        public int Id { get; set; }
        public decimal? PriceMargin { get; set; }
        public int? BulletinNumber { get; set; }      // 👈 new
        public DateTime? PublishDate { get; set; }     // 👈 new
    }
}