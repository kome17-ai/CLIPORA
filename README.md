# Clipora website

A product of Esar.App. Developed by Ekeme Rejoice.

## What is inside

```
index.html              Home page
privacy.html            Privacy policy (starter text)
terms.html              Terms of use (starter text)
404.html                Page not found
site.webmanifest        App name and icons for phones
robots.txt, sitemap.xml Search engine files (replace the domain)
firebase.json           Firebase Hosting settings
firebase/
  database.rules.json   Realtime Database rules (users + waitlist)
css/
  style.css             All site styles (colors are at the top in :root)
  pages.css             Extra styles for privacy, terms and 404
js/
  config.js             Your settings (waitlist, hero video)
  main.js               Animations, tabs, waitlist form
assets/
  img/                  Logo, emblem, icons, social share image
  video/                Put hero.mp4 here
```

## Preview it

Open `index.html` in a browser. For the most accurate preview, run a local server:

```
python3 -m http.server 8080
```

Then visit http://localhost:8080

## Change things

- **Texts:** edit `index.html`.
- **Colors and fonts:** edit the variables at the top of `css/style.css`.
- **Your email:** search all files for `your-email@example.com` and replace it.
- **Domain:** replace `your-domain.com` in `robots.txt` and `sitemap.xml`.
- **Sample app screens:** the two phone screens and the hero slideshow load images from your Cloudinary account. Swap the URLs in `index.html` any time.
- **Hero video:** save a portrait video as `assets/video/hero.mp4`. It plays inside the floating phone.

## Collect waitlist emails

Easiest with your Firebase project:

1. Firebase console -> Realtime Database -> copy the database URL.
2. Paste it into `firebaseDbUrl` in `js/config.js`.
3. Open the Rules tab and publish the contents of `firebase/database.rules.json`
   (it keeps your existing `users` rules and adds `waitlist`).
4. Emails appear under `waitlist` in the database.

Prefer a form service instead? Paste its URL into `waitlistEndpoint`.

## Put it online

**Firebase Hosting**

```
npm install -g firebase-tools
firebase login
firebase init hosting   (use the current folder as public, do not overwrite index.html)
firebase deploy
```

**Netlify:** drag the whole folder onto app.netlify.com/drop.

**GitHub Pages:** push the folder to a repo and enable Pages for the main branch.

## Before you launch

- `privacy.html` and `terms.html` are starter texts, not legal advice. Have them reviewed for your country.
- Check the claims on the page (Android first, 4K export, cloud backup) match what the app really does.
