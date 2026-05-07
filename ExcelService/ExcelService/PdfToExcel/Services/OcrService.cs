using Tesseract;

namespace PdfToExcel.Services
{
    public class OcrService
    {
        public string ExtractText(string imagePath)
        {
            var tessPath = Path.Combine(Directory.GetCurrentDirectory(), "tessdata");

            using var engine = new TesseractEngine(tessPath, "ara+eng", EngineMode.Default);

            engine.SetVariable("preserve_interword_spaces", "1");

            using var img = Pix.LoadFromFile(imagePath);
            using var page = engine.Process(img);

            var text = page.GetText();

            return page.GetText();
        }
    }
}