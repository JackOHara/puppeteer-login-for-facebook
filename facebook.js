const FACEBOOK_URL = 'https://facebook.com';

const scroll = async (page) => {
  await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
};

const isLoggedIn = async (page) => {
  await page.goto(FACEBOOK_URL, {
    waitUntil: 'networkidle2',
  });
  await page.waitForSelector('div[role=feed]');
};

module.exports = {
  loginWithSession: async (cookies, page) => {
    console.log('Logging into Facebook using cookies');
    await page.setCookie(...cookies);
    await page.goto(FACEBOOK_URL, { waitUntil: 'networkidle2' });
    await isLoggedIn(page).catch((error) => {
      console.error('App is not logged into Facebook');
      throw error;
    });
  },

  loginWithCredentials: async (username, password, page) => {
    console.log('Logging into Facebook using credentials for', username);
    await page.goto(FACEBOOK_URL, {
      waitUntil: 'networkidle2',
    });
    await page.waitForSelector('#email');
    await page.type('#email', username);
    await page.type('#pass', password);

    const cookieBanner = 'div[data-testid="cookie-policy-banner"]';
    if (await page.$(cookieBanner) !== null) {
      console.log('Facebook cookie banner found');
      await page.evaluate((selector) => {
        const elements = document.querySelectorAll(selector);
        for (let i = 0; i < elements.length; i += 1) {
          elements[i].parentNode.removeChild(elements[i]);
        }
      }, cookieBanner);
    }

    await page.click('button[name=login]');
    await page.waitForNavigation();
    await isLoggedIn(page).catch((error) => {
      console.error('App is not logged into Facebook');
      throw error;
    });
  },

  scrape: async (page) => {
    const url = 'https://www.facebook.com/groups/123456789?sorting_setting=CHRONOLOGICAL';
    await page.goto(url);
    console.log(`Navigating to ${url}`);

    // Await for a news feed to load
    await page.waitForSelector('div[role=feed]');

    // Await for a group news feed to load
    // await page.waitForSelector('div[data-pagelet=GroupFeed]');

    await scroll();
  },
};
