namespace PdfToExcel.Models
{
    public class OfficialCurrency
    {
        public int Id { get; set; }
        public string Code { get; set; }
        public string Country { get; set; }
        public Decimal Buy { get; set; }
        public Decimal Sell { get; set; }
        public Decimal Average => (Buy + Sell) / 2; 
        public Decimal Margin => Sell - Buy;       
        public string Flag { get; set; }
    }
}
