using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PdfToExcel.Data;

[ApiController]
[Route("api/currency")]
[AllowAnonymous]
public class CurrencyApiController : ControllerBase
{
    private readonly AppDbContext _context;

    public CurrencyApiController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("forex")]
    public async Task<IActionResult> GetForex()
    {
        var data = await _context.ForexCurrencies
            .AsNoTracking()
            .OrderBy(x => x.Id) 
            .Select(x => new
            {
                id = x.Id,
                code = x.Code,
                country = x.Country,
                mid = x.Mid,
                sell = x.Sell,
                buy = x.Buy,
                flag = x.Flag
            })
            .ToListAsync();

        return Ok(new { rows = data, total = data.Count });
    }

    [HttpGet("official")]
    public async Task<IActionResult> GetOfficial()
    {
        var data = await _context.OfficialCurrencies
            .AsNoTracking()
            .OrderBy(x => x.Id)
            .Select(x => new
            {
                id = x.Id,
                code = x.Code,
                country = x.Country,
                average = x.Average,
                buy = x.Buy,
                sell = x.Sell,
                margin = x.Margin,
                flag = x.Flag,
            })
            .ToListAsync();

       var priceMarginRecord = await _context.PriceMargins.FirstOrDefaultAsync();

        return Ok(new
        {
            rows         = data,
            total        = data.Count,
            priceMargin  = priceMarginRecord?.PriceMargin,
            bulletinNumber = priceMarginRecord?.BulletinNumber,   // 👈 new
            publishDate  = priceMarginRecord?.PublishDate,        // 👈 new
        });
    }
}
