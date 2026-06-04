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

		// Blocks heavy resources for faster info processing
		await page.route('**/*', (route) => {
			const type = route.request().resourceType();
			if (['image', 'media', 'font'].includes(type)) {
				route.abort();
			} else {
				route.continue();
			}
		});

		await page.goto(url, { waitUntil: 'load', timeout: 45000 });

		await page.waitForSelector('div[style*="display: none"] a, a.mb-6', { state: 'attached', timeout: 15000 });

		const alexaFeed = [];
		const maxNews = 5;

		for (let i = 0; i < maxNews; i++) {
			// Forcing click on index
			await page.evaluate((index) => {
				const enlaces = document.querySelectorAll('main a[href*="/bbcl-en-5-minutos/"]');
				if (enlaces && enlaces[index]) {
					enlaces[index].click();
				}
			}, i);

			await page.waitForTimeout(1000);

			const newsData = await page.evaluate((index) => {
				let title = "";
				let newsText = "";

				const articles = document.querySelectorAll('main article, main div.relative.min-w-0');

				const currentArticle = articles[index];

				if (currentArticle) {
					const h2Title = currentArticle.querySelector('h2');
					if (h2Title) {
						title = h2Title.textContent.trim();
					}

					const paragraphs = currentArticle.querySelectorAll('p, h4');

					paragraphs.forEach(paragraph => {
						let text = paragraph.textContent.trim();

						text = text.replace('Resumen generado con Inteligencia Artificial y revisado por editores', '').trim();
						text = text.replace('Desarrollado con Inteligencia Artificial', '').trim();

						if (text.length > 25 && !newsText.includes(text)) {
							newsText += text + " ";
						}
					});
				}

				return {
					title: title,
					body: newsText.trim()
				};
			}, i);

			if (newsData.title && newsData.body) {
				// Clean duplicates
				const paragraphs = newsData.body.split('. ');
				const uniqueParagraphs = [...new Set(paragraphs)];
				let cleanBody = uniqueParagraphs.join('. ').replace(/\s+/g, ' ').trim();

				// Amazon max body length for news is 4300 characters
				if (cleanBody.length > 4300) {
					cleanBody = cleanBody.substring(0, 4300) + "...";
				}

				const titleSlug = newsData.title
                    .toLowerCase().normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9\s-]/g, "")
                    .trim().replace(/\s+/g, "-");

				alexaFeed.push({
					"uid": `bbcl-${titleSlug}`,
					"updateDate": new Date().toISOString(),
					"titleText": newsData.title,
					"mainText": `${cleanBody}`,
					"redirectionUrl": url
				});
			}

			// Internally go back on the SPA to prepare the next click
			await page.evaluate(() => {
				window.history.back();
			});
			await page.waitForTimeout(1000);
		}

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