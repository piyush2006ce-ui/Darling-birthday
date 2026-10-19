# Baby Birthday Website ♡

A mobile-friendly, cinematic birthday microsite built with HTML, CSS and vanilla JavaScript. It includes photo memories with long personal paragraphs, an interactive birthday cake with cute boy/girl avatars, animated hearts, scroll reveals, a personal letter, confetti and your uploaded full-length song.

## Run it locally
1. Extract `neha_birthday_website.zip`.
2. Open the `neha_birthday_website` folder in VS Code.
3. Recommended: install the **Live Server** VS Code extension.
4. Right-click `index.html` → **Open with Live Server**.
   - Or run `python -m http.server 8000` from this folder and open `http://localhost:8000`.

## Add the song
The song file you uploaded is included at `assets/tu-hi-tu.mp3`. The music button plays the full file from beginning to end and loops it when it finishes. The visitor must tap the music button because browsers generally block autoplay.

## Personalize the letter
Open `index.html` and edit the paragraphs inside `.letter-body`. The first draft is editable and should be adjusted to sound like you.

## Replace photos/video
The uploaded photos and video are in `assets/`. You can replace an asset with another file using the same filename, or change the corresponding `src` in `index.html`. Keep filenames simple (letters, numbers, hyphens).

## Publish it online for free
**GitHub Pages**
1. Create a GitHub repository (for example `Baby-birthday`).
2. Upload all files/folders from this extracted project; make sure `index.html` is at the repository root.
3. In GitHub: **Settings → Pages → Deploy from a branch**.
4. Select `main` and `/ (root)`, then Save.
5. GitHub will show the public URL after deployment. Open it on your phone to test.

You can also use Netlify Drop by uploading the extracted project folder contents. Do not share the link publicly if you want the memories to remain private; a public static site can be opened by anyone who has the URL.

## Before sharing
- Test on a phone.
- Check the images load and the cake interaction works.
- Add the song file if you want music.
- Personalize the letter and verify all memories/captions.


## Autoplay behavior
The page attempts to autoplay the song on load. Browsers may block audio until the visitor interacts with the page; in that case, a “Tap to enter, Baby” screen appears and starts the song on tap. This fallback is necessary for reliable playback on mobile Chrome/Safari.


## Interactive Three.js scene
The final birthday scene uses Three.js from jsDelivr CDN and builds stylized 3D boy/girl avatars, a cake with candles, a detachable cake slice, floating hearts, and simple feed/hug motions from geometry in `3d-scene.js`. It requires an internet connection when the page loads so the Three.js module can be downloaded. Run via VS Code Live Server (do not open the HTML directly from the filesystem). Use the buttons below the 3D canvas to trigger cut, feed, and hug animations; drag in the canvas to look around.
