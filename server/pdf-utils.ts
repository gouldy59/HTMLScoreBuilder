import puppeteer from 'puppeteer';

// Fixed PDF generation with no margins and proper full-page layout
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
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
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
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  // Wait for charts to render
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const imageBuffer = await page.screenshot({ 
    type: 'png',
    fullPage: false,
    clip: { x: 0, y: 0, width: 794, height: 1123 } 
  });
  
  await browser.close();
  return imageBuffer;
}