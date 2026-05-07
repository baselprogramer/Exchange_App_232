using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PdfToExcel.Models;

namespace PdfToExcel.Data
{
    public class AppDbContext : IdentityDbContext<IdentityUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<ForexCurrency> ForexCurrencies { get; set; }
        public DbSet<OfficialCurrency> OfficialCurrencies { get; set; }
        public DbSet<ConvertedFile> ConvertedFiles { get; set; } = null!;
        public DbSet<PriceMarginModel> PriceMargins { get; set; }
        public DbSet<BulletinArchive> BulletinArchives { get; set; }


    }
}
