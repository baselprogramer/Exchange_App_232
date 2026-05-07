using Docnet.Core;
using Docnet.Core.Models;
using Docnet.Core.Readers;
using System.Drawing;
using System.Drawing.Imaging;

namespace PdfToExcel.Services
{
    public class PdfToImageService
    {
        public List<string> Convert(string pdfPath)
        {
            var output = new List<string>();
            Directory.CreateDirectory("wwwroot/temp");

            using var docReader = DocLib.Instance.GetDocReader(pdfPath, new PageDimensions(1080, 1920));

            for (int i = 0; i < docReader.GetPageCount(); i++)
            {
                using var pageReader = docReader.GetPageReader(i);

                var rawBytes = pageReader.GetImage(); 

                int width = pageReader.GetPageWidth();
                int height = pageReader.GetPageHeight();

                using var bitmap = new Bitmap(width, height, PixelFormat.Format32bppArgb);

                var bitmapData = bitmap.LockBits(
                    new Rectangle(0, 0, width, height),
                    ImageLockMode.WriteOnly,
                    PixelFormat.Format32bppArgb);

                System.Runtime.InteropServices.Marshal.Copy(rawBytes, 0, bitmapData.Scan0, rawBytes.Length);

                bitmap.UnlockBits(bitmapData);

                var path = $"wwwroot/temp/page_{Guid.NewGuid()}.png";
                bitmap.Save(path, ImageFormat.Png);

                output.Add(path);
            }

            return output;
        }
    }
}