using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PdfToExcel.Migrations
{
    /// <inheritdoc />
    public partial class AddBulletinNumberAndPublishDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BulletinNumber",
                table: "PriceMargins",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PublishDate",
                table: "PriceMargins",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BulletinNumber",
                table: "PriceMargins");

            migrationBuilder.DropColumn(
                name: "PublishDate",
                table: "PriceMargins");
        }
    }
}
