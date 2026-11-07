// ADMIN // BLACKBOOK on the Apps & Software page: the featured product comes first, its Shopify checkout is unchanged, the
// obsolete logger is gone, the screenshots and assets exist, and the affiliate promotions still work below it.
// Static checks against both copies of the page (root, served by GitHub Pages; static/, served by the Flask app).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const PAGES = { root: 'store-apps.html', static: 'static/store-apps.html' };
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pageText = key => read(PAGES[key]);

// Values verified against the live Shopify product (Storefront API, read-only) and the app's own sources
const SHOP_DOMAIN = 'qbhrmg-jn.myshopify.com';
const PRODUCT_ID = '10395729002713';
const PRODUCT_URL = 'https://qbhrmg-jn.myshopify.com/products/admin-blackbook';
const CANONICAL = 'https://thedarknetdistrict.com/store-apps.html';
const NOTICE = 'The Darknet District is under continuous development.';

for (const key of Object.keys(PAGES)) {
  test(`${PAGES[key]}: ADMIN // BLACKBOOK is the first thing in the content, before the affiliate promotions`, () => {
    const html = pageText(key);
    const hero = html.indexOf('id="blackbook"');
    assert.ok(hero > 0, 'featured product present');
    assert.ok(hero > html.indexOf('<div class="content">'), 'the hero is inside the content, not in the header');
    assert.ok(hero < html.indexOf('id="affiliate-banner"'), 'the hero comes before the affiliate banner');
    assert.ok(html.indexOf('id="blackbook-overview"') < html.indexOf('id="affiliate-banner"'), 'overview before affiliate promotions');
    assert.ok(html.indexOf('id="blackbook-purchase"') < html.indexOf('id="affiliate-banner"'), 'purchase details before affiliate promotions');
  });

  test(`${PAGES[key]}: product details are shown correctly`, () => {
    const html = pageText(key);
    for (const phrase of [
      'ADMIN // BLACKBOOK',
      'Your eyes. Your evidence. Your rules.',
      'Android security assessment and observation app',
      'USD 3.99',
      'Android 7.0 (API 24) or later',
      'The app has no internet permission',
      'SHA-256 fingerprint',
      'at least 10 characters',
      'stops after 2 minutes',
      'six',
    ]) assert.ok(html.includes(phrase), `missing: ${phrase}`);
  });

  test(`${PAGES[key]}: Shopify checkout is unchanged apart from the button label`, () => {
    const html = pageText(key);
    assert.equal(html.split(`id: '${PRODUCT_ID}'`).length - 1, 1, 'one product component for the one product');
    assert.ok(html.includes(`domain: '${SHOP_DOMAIN}'`), 'shop domain');
    assert.ok(html.includes("buttonDestination: 'checkout'"), 'button goes straight to checkout, not a cart');
    assert.ok(html.includes("text: { button: 'Buy ADMIN // BLACKBOOK' }"), 'purchase button label');
    assert.ok(html.includes("buy-button-storefront.min.js"), 'official Shopify Buy Button SDK');
    assert.ok(!/shpat_|admin_api|X-Shopify-Access-Token/i.test(html), 'no Admin API credential is present');
    assert.ok(html.includes('id="blackbook-buy"') && html.includes('id="blackbook-status"'), 'button mount point and error message');
    assert.ok(html.includes('Checkout could not load.'), 'a useful message when the SDK fails');
    assert.ok(html.includes(PRODUCT_URL), 'verified product page link');
  });

  test(`${PAGES[key]}: no trace of the abandoned Kai Kryptos Logger`, () => {
    const html = pageText(key);
    assert.ok(!/kryptos|kai-kryptos|kryptos-logger|logger-app/i.test(html), 'no logger references');
    assert.ok(!/downloads\/[^"']*\.apk/i.test(html), 'no direct APK link on the page');
  });

  test(`${PAGES[key]}: the status notice from PR 199 is kept`, () => {
    const html = pageText(key);
    assert.ok(html.includes(NOTICE), 'notice text present');
    assert.ok(/<p class="district-notice" role="note">/.test(html), 'notice markup');
    assert.ok(html.indexOf('<!-- /District navigation -->') < html.indexOf('district-notice" role="note"') && html.indexOf('district-notice" role="note"') < html.indexOf('Top Navigation Buttons'), 'notice sits under the navigation, outside the generated block');
  });

  test(`${PAGES[key]}: the existing affiliate promotions still work`, () => {
    const html = pageText(key);
    for (const link of ['https://mosequipment.com/', 'https://www.cdprojektred.com/en', 'https://flipperzero.one/']) {
      assert.ok(html.includes(`link: "${link}"`), `banner link ${link}`);
    }
    for (const id of ['affiliate-banner', 'affiliate-link', 'affiliate-image', 'glitch-effect']) {
      assert.ok(html.includes(`id="${id}"`), `element ${id}`);
    }
  });

  test(`${PAGES[key]}: social, search and canonical metadata point at the existing .html address`, () => {
    const html = pageText(key);
    assert.ok(html.includes(`<link rel="canonical" href="${CANONICAL}">`), 'canonical');
    assert.ok(html.includes(`<meta property="og:url" content="${CANONICAL}">`), 'og:url');
    assert.ok(html.includes('<meta property="og:image" content="https://thedarknetdistrict.com/attached_assets/blackbook/feature-graphic-1024x500.png">'), 'og:image');
    assert.match(html, /<title>ADMIN \/\/ BLACKBOOK[^<]*<\/title>/, 'title leads with the product');
    assert.ok(/<meta name="description" content="[^"]{60,170}">/.test(html), 'a description of a sensible length');
  });

  test(`${PAGES[key]}: every image has descriptive alt text`, () => {
    const html = pageText(key);
    const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map(m => m[0]);
    assert.ok(imgs.length >= 12, 'hero icon, banners and ten screenshots');
    for (const tag of imgs) {
      const alt = /\balt="([^"]*)"/.exec(tag);
      assert.ok(alt, `image without alt: ${tag.slice(0, 80)}`);
      if (!/affiliate-image/.test(tag)) assert.ok(alt[1].trim().length > 0, `empty alt: ${tag.slice(0, 80)}`);
    }
  });

  test(`${PAGES[key]}: no claim is made that the owner has not verified`, () => {
    const html = pageText(key);
    // Subscriptions and account status could not be confirmed from the public Shopify API or the source
    assert.ok(!/no subscriptions?\b/i.test(html), 'no subscription claim');
    assert.ok(!/no account\b/i.test(html), 'no account claim');
    assert.ok(!/google play/i.test(html), 'no Play Store claim');
  });

  test(`${PAGES[key]}: every local image and link resolves to a real file`, () => {
    const html = pageText(key);
    const base = key === 'static' ? path.join(root, 'static') : root;
    const refs = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map(m => m[1]);
    const missing = [];
    for (const ref of refs) {
      if (/^(https?:|mailto:|data:|#|javascript:)/i.test(ref)) continue;
      const clean = ref.split('#')[0].split('?')[0];
      if (!clean) continue;
      const target = path.join(base, clean);
      if (!fs.existsSync(target)) missing.push(ref);
    }
    assert.deepEqual(missing, [], 'references to files that do not exist');
  });
}

test('the featured images are real files from the app repository', () => {
  for (const file of ['icon-512.png', 'feature-graphic-1024x500.png']) {
    for (const tree of ['attached_assets/blackbook', 'static/attached_assets/blackbook']) {
      assert.ok(fs.statSync(path.join(root, tree, file)).size > 1000, `${tree}/${file}`);
    }
  }
  const shots = fs.readdirSync(path.join(root, 'attached_assets/blackbook')).filter(f => /^bb-\d\d-.+\.jpg$/.test(f));
  assert.equal(shots.length, 10, 'ten screenshots from the user manual');
  for (const f of shots) assert.ok(fs.statSync(path.join(root, 'static/attached_assets/blackbook', f)).size > 1000, f);
});

test('the Iris widget is still loaded on the root page; the static copy keeps its existing setup', () => {
  assert.ok(pageText('root').includes('<script src="iris-widget.js" defer></script>'), 'root page loads Iris');
  assert.ok(fs.existsSync(path.join(root, 'iris-widget.js')), 'root iris-widget.js exists');
  assert.ok(!pageText('static').includes('iris-widget.js'), 'static copy does not reference the absent widget');
});

test('the notice styles are scoped to the store page, not added to the shared stylesheet', () => {
  const html = pageText('root');
  assert.ok(html.includes('body.site-navigation > .district-notice {'), 'notice style on this page');
  assert.ok(!read('home-navigation.css').includes('.district-notice'), 'shared home-navigation.css untouched');
});
