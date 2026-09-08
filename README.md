# Root & Rise — get it live on GitHub Pages

Your repo `sgleason15/Root-Rise` is currently **empty**, which is why the URL 404s.
Pages has nothing to serve. Fix it by uploading these files.

## 1. Upload the files

Go to https://github.com/sgleason15/Root-Rise

- Click **Add file → Upload files**
- Open this downloaded folder on your computer, select **everything inside it**
  (Ctrl+A / Cmd+A) and drag it onto the GitHub page. Drag the `_ds` folder in too —
  GitHub keeps folder structure.
- Scroll down, click **Commit changes**.

The files must sit at the **top level** of the repo, not inside another folder.
When you're done the repo file list should start with `.nojekyll`, `README.md`,
`Root & Rise App.dc.html`, `_ds`, `icon-180.png`, `index.html`…

> `.nojekyll` matters. Without it Pages hides the `_ds` folder and the app loads
> unstyled. If your computer hides dotfiles and it doesn't upload, use
> **Add file → Create new file**, name it `.nojekyll`, type one line, commit.

## 2. Turn Pages on

Repo → **Settings** → **Pages** (left sidebar, under "Code and automation")

- Source: **Deploy from a branch**
- Branch: **main**, folder: **/ (root)** → **Save**

Wait about a minute, then reload that Settings → Pages screen. Your live URL shows
at the top:

```
https://sgleason15.github.io/Root-Rise/
```

## 3. Install it on the iPhone

Open that URL in **Safari** (not Chrome) → tap **Share** → **Add to Home Screen** → **Add**.

It launches full-screen with its own icon and keeps working with no signal.

## If it still doesn't work

| What you see | What it means |
| --- | --- |
| 404 | Pages not enabled yet, or files are in a subfolder instead of the root |
| Page loads but looks plain / unstyled | `.nojekyll` is missing — add it and wait a minute |
| Blank white screen | `support.js` didn't upload — check it's in the repo root |
| A list of file names | `index.html` didn't upload |

Give it 1–2 minutes after any change; Pages rebuilds each time you commit.

## Updating it later

Upload the changed file over the old one and commit. The app caches itself for
offline use, so on the phone close it fully (swipe it away) and reopen once to
pick up the new version.

## Your data

Lessons, notes, hours and photos live in Safari's storage **on your phone** — not
in this repo. Anyone who visits the URL gets an empty app, not yours. Use
Setup → **Export backup** once a month, and don't clear Safari website data
without a backup.
