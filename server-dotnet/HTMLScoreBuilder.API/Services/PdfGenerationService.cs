using PuppeteerSharp;
using PuppeteerSharp.Media;

namespace HTMLScoreBuilder.API.Services;

public interface IPdfGenerationService
{
    Task<byte[]> GeneratePdfAsync(string html);
    Task<byte[]> GenerateImageAsync(string html);
}

public class PdfGenerationService : IPdfGenerationService
{
    private readonly ILogger<PdfGenerationService> _logger;

    public PdfGenerationService(ILogger<PdfGenerationService> logger)
    {
        _logger = logger;
    }

    public async Task<byte[]> GeneratePdfAsync(string html)
    {
        try
        {
            // Download Chromium if not available
            var fetcherOptions = new BrowserFetcherOptions { Path = Path.Combine(Path.GetTempPath(), "puppeteer") };
            var browserFetcher = new BrowserFetcher(fetcherOptions);
            var installed = await browserFetcher.DownloadAsync();
            var executable = installed.GetExecutablePath();

            var launchOptions = new LaunchOptions
            {
                Headless = true,
                ExecutablePath = executable,
                Args = new[]
                {
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage"
                }
            };

            using var browser = await Puppeteer.LaunchAsync(launchOptions);
            using var page = await browser.NewPageAsync();

            await page.SetContentAsync(html);
            await page.SetViewportAsync(new ViewPortOptions { Width = 794, Height = 1123 });

            // Wait for charts to render
            await Task.Delay(2000);

            var pdfOptions = new PdfOptions
            {
                Format = PuppeteerSharp.Media.PaperFormat.A4,
                MarginOptions = new PuppeteerSharp.Media.MarginOptions
                {
                    Top = "0.5in",
                    Right = "0.5in",
                    Bottom = "0.5in",
                    Left = "0.5in"
                }
            };

            var pdfBytes = await page.PdfDataAsync(pdfOptions);
            return pdfBytes;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating PDF");
            throw;
        }
    }

    public async Task<byte[]> GenerateImageAsync(string html)
    {
        try
        {
            // Download Chromium if not available
            await new BrowserFetcher().DownloadAsync();

            var launchOptions = new LaunchOptions
            {
                Headless = true,
                Args = new[]
                {
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-accelerated-2d-canvas",
                    "--no-first-run",
                    "--no-zygote",
                    "--single-process",
                    "--disable-gpu"
                }
            };

            using var browser = await Puppeteer.LaunchAsync(launchOptions);
            using var page = await browser.NewPageAsync();

            await page.SetContentAsync(html, new NavigationOptions { WaitUntil = new[] { WaitUntilNavigation.Networkidle0 } });
            await page.SetViewportAsync(new ViewPortOptions { Width = 794, Height = 1123 });

            // Wait for charts to render
            await Task.Delay(2000);

            var screenshotOptions = new ScreenshotOptions
            {
                Type = ScreenshotType.Png,
                FullPage = false,
                Clip = new PuppeteerSharp.Media.Clip
                {
                    X = 0,
                    Y = 0,
                    Width = 794,
                    Height = 1123
                }
            };

            var imageBytes = await page.ScreenshotDataAsync(screenshotOptions);
            return imageBytes;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating image");
            throw;
        }
    }
}