using Microsoft.EntityFrameworkCore;
using PdfToExcel.Data;
using PdfToExcel.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();
builder.Services.AddRazorPages(options =>
{
    options.Conventions.AllowAnonymousToAreaFolder("Identity", "/Account");
});
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});
// Services
builder.Services.AddHttpClient<AiService>();
builder.Services.AddSingleton<PdfToImageService>();
builder.Services.AddSingleton<OcrService>();
builder.Services.AddSingleton<ExcelService>();
builder.Services.AddScoped<ExcelReaderService>();

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=app.db"));

// Identity
builder.Services.AddDefaultIdentity<IdentityUser>(options =>
{
    options.SignIn.RequireConfirmedAccount = false;
})
.AddEntityFrameworkStores<AppDbContext>();

builder.Services.AddEndpointsApiExplorer();

// Swagger
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "PdfToExcel API",
        Version = "v1"
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
});

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
{
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();

// Swagger
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "PdfToExcel API v1");
});

// Routes
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Files}/{action=Index}/{id?}");

app.MapControllers();
app.MapRazorPages();

// ── قفل Register ──
app.MapGet("/Identity/Account/Register", context => {
    context.Response.Redirect("/Identity/Account/Login");
    return Task.CompletedTask;
});
app.MapPost("/Identity/Account/Register", context => {
    context.Response.Redirect("/Identity/Account/Login");
    return Task.CompletedTask;
});

// ── إنشاء Admin تلقائياً ──
using (var scope = app.Services.CreateScope())
{
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();

    var adminEmail = "admin@excelservice.com"; // ← غيّره
    var adminPassword = "Admin@123456";         // ← غيّره

    var existing = await userManager.FindByEmailAsync(adminEmail);
    if (existing == null)
    {
        var user = new IdentityUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            EmailConfirmed = true
        };
        await userManager.CreateAsync(user, adminPassword);
    }
}

app.Run();