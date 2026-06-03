const { chromium } = require('playwright');
const fs = require('fs');

async function scrapeBioBio() {
    let browser;
    try {
        const url = 'https://www.biobiochile.cl/bbcl-en-5-minutos/';
        
        browser = await chromium.launch({ headless: true });
        
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 720 }
        });
        
        const page = await context.newPage();
        
        await page.route('**/*', (route) => {
            const type = route.request().resourceType();
            if (['image', 'media'].includes(type)) {
                route.abort();
            } else {
                route.continue();
            }
        });

        await page.goto(url, { waitUntil: 'load', timeout: 45000 });
        
        await page.waitForSelector('h2', { state: 'attached', timeout: 15000 });

		// Extract injected news headers
        const newsText = await page.evaluate(() => {
            let accumulatedText = "";
            const newsHeaders = document.querySelectorAll('h2.font-serif, article h2');
            
            newsHeaders.forEach((elemento) => {
                const texto = elemento.textContent.trim();
                if (texto.length > 15 && !texto.includes('Compartir') && !texto.includes('Síguenos')) {
                    accumulatedText += texto + ". ";
                }
            });
            return accumulatedText.trim();
        });

		let finalText;
        if (!newsText) {
			finalText = "No se pudo obtener el desglose textual del resumen de hoy. Por favor, intente de nuevo más tarde o sintonice la señal en vivo.";
        } else {
			// Remove duplicates if Nuxt renders mobile and desktop cards at the same time
			const news = newsText.split('. ');
			const uniqueNews = [...new Set(news)];
			
			finalText = `Resumen Radio Bío-Bío en 5 minutos: ${uniqueNews.join('. ')}`;
		}

        // Oficial Amazon Flash Briefing API body format
        const alexaFeed = [
            {
                "uid": "biobio-en-5-minutos",
                "updateDate": new Date().toISOString(),
                "titleText": "Resumen de Noticias Radio Bío-Bío en 5 Minutos",
                "mainText": finalText.substring(0, 4500),
                "redirectionUrl": url
            }
        ];

        fs.writeFileSync('feed.json', JSON.stringify(alexaFeed, null, 2));
    } catch (error) {
        console.error('Scraping error:', error.message);
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

scrapeBioBio();