import puppeteer from 'puppeteer';

// Fixed PDF generation with no margins and proper multi-page layout
export async function generatePDFFromHTML(html: string, templateId: number): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123 });
  
  // Add CSS to handle page breaks properly
  const modifiedHtml = html.replace(
    '<style>',
    `<style>
    @page {
      size: A4;
      margin: 0;
    }
    [style*="page-break-before: always"] {
      page-break-before: always !important;
      break-before: page !important;
    }`
  );
  
  await page.setContent(modifiedHtml, { waitUntil: 'networkidle0' });
  
  // Wait for charts to render
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const pdfBuffer = await page.pdf({ 
    format: 'A4',
    margin: {
      top: '0mm',
      right: '0mm',
      bottom: '0mm',
      left: '0mm'
    },
    printBackground: true,
    preferCSSPageSize: true
  });
  
  await browser.close();
  return pdfBuffer;
}

export async function generateImageFromHTML(html: string, templateId: number): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123 });
  
  // Remove page breaks from HTML for image generation (convert to simple dividers)
  const modifiedHtml = html.replace(
    /style="[^"]*page-break-before:\s*always[^"]*"/g,
    'style="height: 2px; background-color: transparent; margin: 20px 0;"'
  );
  
  await page.setContent(modifiedHtml, { waitUntil: 'networkidle0' });
  
  // Wait for charts to render
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Get the full height of the content to capture all pages
  const bodyHeight = await page.evaluate(() => {
    return Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
  });
  
  // Use full page screenshot to capture all content including multiple pages
  const imageBuffer = await page.screenshot({ 
    type: 'png',
    fullPage: true,
    clip: { x: 0, y: 0, width: 794, height: Math.max(bodyHeight, 1123) }
  });
  
  await browser.close();
  return imageBuffer;
}