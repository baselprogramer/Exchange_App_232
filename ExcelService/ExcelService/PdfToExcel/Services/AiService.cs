using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace PdfToExcel.Services
{
    public class AiService
    {
        private readonly HttpClient _http;
        private readonly IConfiguration _config;

        public AiService(HttpClient http, IConfiguration config)
        {
            _http = http;
            _config = config;
        }

        public async Task<string> CleanOcrAsync(string ocrText)
        {
            var apiKey = _config["OpenRouter:ApiKey"];

            var requestBody = new
            {
                model = "openai/gpt-4o-mini",
                messages = new[]
                {
                    new {
                        role = "user",
                        content = $@"
Extract currency exchange table from this OCR text.

Return ONLY JSON like:
[
  {{""code"":""USD"",""currency"":""US Dollar"",""buy"":111,""sell"":110}}
]

Rules:
- Ignore Arabic text
- Ignore large numbers (like 11100)
- Keep only small decimals (111, 128.65)
- Fix OCR errors (USO → USD)
- No explanation

TEXT:
{ocrText}
"
                    }
                }
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://openrouter.ai/api/v1/chat/completions");

            request.Headers.Add("Authorization", $"Bearer {apiKey}");

            request.Content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _http.SendAsync(request);
            return await response.Content.ReadAsStringAsync();
        }
    }
}