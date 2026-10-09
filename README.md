# Magnet Mail – website

Landing page, support page, privacy policy and terms of use for the mobile game
[Magnet Mail](https://github.com/metur100/Magnet.Mail). Plain static HTML/CSS, hosted on GitHub Pages.

- Live: https://metur100.github.io/Magnet.Mail.Landing/
- Privacy policy (for Google Play / App Store Connect): https://metur100.github.io/Magnet.Mail.Landing/privacy.html
- Support URL: https://metur100.github.io/Magnet.Mail.Landing/#support

## When the app is live

In `index.html`, replace the two `href="#"` store links with the real store URLs and remove `aria-disabled="true"`.

## Assets

Screenshots and icons come from `store/` in the app repo. Fonts (Fredoka, Nunito) are self-hosted under the
SIL Open Font License (see `assets/fonts/OFL-*.txt`), so the site makes no third-party requests.

## Try-it section

The small interactive game in the middle of the page lives at the end of `assets/main.js` (plain canvas, no libraries).

## SEO

- Metadata, Open Graph/Twitter cards and JSON-LD (`WebSite`, `Organization`, `MobileApplication`/`VideoGame`, `FAQPage`,
  breadcrumbs on the legal pages) live in the `<head>` of each page. Validate with https://search.google.com/test/rich-results
- `sitemap.xml` lists all pages plus the screenshots. Update `<lastmod>` when content changes.
- `robots.txt` only takes effect at a domain root, so on `metur100.github.io/Magnet.Mail.Landing/` it is ignored;
  submit the sitemap in Google Search Console instead.

### Google Search Console (one-time)

1. https://search.google.com/search-console → *Add property* → **URL prefix** → `https://metur100.github.io/Magnet.Mail.Landing/`
2. Verify with *HTML tag*: paste the `<meta name="google-site-verification" ...>` tag into the `<head>` of `index.html` and push.
3. *Sitemaps* → submit `sitemap.xml`.
4. *URL inspection* → enter the homepage URL → *Request indexing*.
