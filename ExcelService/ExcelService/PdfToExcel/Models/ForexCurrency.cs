namespace PdfToExcel.Models
{
    public class ForexCurrency
    {
        public int Id { get; set; }
        public string Code { get; set; }
        public string Country { get; set; }
        public Decimal Mid => (Sell + Buy) / 2;
        public Decimal Buy { get; set; }
        public Decimal Sell { get; set; }
        public string Flag { get; set; }
    }
}
