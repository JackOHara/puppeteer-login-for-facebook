const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const facebookHandler = require('./facebook');

const FACEBOOK_URL = 'https://www.facebook.com';

const getDefaultBrowser = async (headless) => {
  const browser = await puppeteer.launch({
    headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = browser.defaultBrowserContext();
  context.overridePermissions(FACEBOOK_URL, []);
  return browser;
};

const getDefaultPage = async (browser) => {
  const page = await browser.newPage();
  await page.setViewport({
    width: 800,
    height: 800,
    deviceScaleFactor: 1,
  });
  await page.setDefaultNavigationTimeout(Number.MAX_SAFE_INTEGER);
  return page;
};

(async () => {
  const browser = await getDefaultBrowser(true);
  const page = await getDefaultPage(browser);
  const username = 'mark.zuck@gmail.com';
  const password = 'HelloWorld';

  // Load cookies from previous session
  const cookies = await fs.readFile('cookies.js')
    .then((facebookCookies) => JSON.parse(facebookCookies))
    .catch((error) => {
      console.error(`Unable to load Facebook cookies: ${error}`);
      return {};
    });

  // Use our cookies to login. If it fails fallback to username and password login.
  if (cookies && Object.keys(cookies).length) {
    await facebookHandler.loginWithSession(cookies, page).catch(async (error) => {
      console.error(`Unable to login using session: ${error}`);
      await facebookHandler.loginWithCredentials(username, password, page);
    });
  } else {
    await facebookHandler.loginWithCredentials(username, password, page);
  }

  // Save our freshest cookies that contain our Facebook session
  await page.cookies().then(async (freshCookies) => {
    await fs.writeFile('cookies.js', JSON.stringify(freshCookies, null, 2));
  });

  await facebookHandler.scrape(page);
})();
