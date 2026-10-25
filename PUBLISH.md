# Publishing checklist

The package, screenshots, market entry, and local git history are ready.
This file records the exact remaining steps. They were not run because
`github.com` and `api.github.com` are not reachable from this machine
(connection timeouts), so no remote repository, Release, or PR exists yet.

## What is already done

- `package.json` is publishable: name `dsh-lingua-atlas`, no `private`, MIT,
  repository `https://github.com/mkhl20/dsh-lingua-atlas`, `dsh.bundle.patch`,
  `dsh.client`, `files` includes dictionaries, corpus, CMUdict, LICENSE,
  screenshots, and `THIRD_PARTY_NOTICES.md`.
- `cordis.patch.yml` references `dsh-lingua-atlas`.
- `LICENSE`, `THIRD_PARTY_NOTICES.md`, `screenshots.json`,
  `assets/icon-512.png`, and two clean screenshots exist.
- Built `client.js`, ran i18n / logic / prosody / corpus tests and
  `node --check`.
- Local git repository has commits on `main`.
- Release tarball: `../release/dsh-lingua-atlas.tgz` (23 MB).
- Market entry: `market/dsh-lingua-atlas.yml`.

## 1. Authenticate and create the repository

Use the portable tools in `../.tools/` if `git` / `gh` are not on PATH.

```powershell
$git = '..\.tools\git\cmd\git.exe'
$gh  = '..\.tools\gh\bin\gh.exe'

# Browser OAuth; needs github.com reachable.
& $gh auth login --hostname github.com --git-protocol https --web

# Create the public repository and push main.
& $gh repo create mkhl20/dsh-lingua-atlas --public --source . --remote origin --push
```

If the repository was created by hand, use:

```powershell
& $git remote add origin https://github.com/mkhl20/dsh-lingua-atlas.git
& $git push -u origin main
```

## 2. Add the `dsh-plugin` topic

Repository → About → Topics → add `dsh-plugin`.

## 3. Create the Release

The tarball name must stay version-free so the market `latest/download` URL
does not rot.

```powershell
& $gh release create v1.0.0 ..\release\dsh-lingua-atlas.tgz `
  --repo mkhl20/dsh-lingua-atlas `
  --title "v1.0.0" `
  --notes "Offline Chinese-English dictionary, prosody, and public-domain literary corpus."
```

## 4. Submit the market entry

Fork `https://github.com/awesome-dsh-plugin/awesome-dsh-plugin`, then add
`market/dsh-lingua-atlas.yml` as
`data/plugins/mkhl20__dsh-lingua-atlas.yml` in the fork and open a PR.

The entry already contains `url`, `name`, `category: tools`, bilingual
descriptions, `icon`, and the Release `tarball`.

## Optional: npm

The name `dsh-lingua-atlas` is free on the public registry. Publishing is not
required for listing; if you publish, `repository` must point at the GitHub
repository above.

```powershell
npm publish
```

## Verify

```powershell
$node = 'C:\Users\33927\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe'
& $node test/i18n.test.mjs
& $node test/logic.test.mjs
& $node test/prosody.test.mjs
& $node test/corpus.test.mjs
& $node --check client.js
```
