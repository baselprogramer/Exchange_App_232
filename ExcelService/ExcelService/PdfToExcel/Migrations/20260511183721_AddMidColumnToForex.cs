using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PdfToExcel.Migrations
{
    /// <inheritdoc />
    public partial class AddMidColumnToForex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Mid",
                table: "ForexCurrencies",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Mid",
                table: "ForexCurrencies");
        }
    }
}
