# Publishing a LAN game release

This guide is for maintainers publishing an updated, ready-to-play Windows LAN download on GitHub. Players do not need Node.js or the repository when they use this package.

## Before publishing

1. Make sure all intended changes are committed and pushed to GitHub.
2. Check that the GitHub commit you want to release is on `main`.
3. Run the main checks locally when possible:

   ```sh
   npm ci
   npm test
   npm run typecheck
   npm run build
   ```

The GitHub release workflow repeats the tests and TypeScript check before creating the download. A failing check prevents a broken ZIP from being attached.

## Choose the release version

Use a new tag for every published update. LAN release tags follow this pattern:

```text
lan-v0.1.0
lan-v0.1.1
lan-v0.2.0
```

- Increase the last number for fixes and small changes, such as `lan-v0.1.0` to `lan-v0.1.1`.
- Increase the middle number for a release with substantial new characters or features, such as `lan-v0.1.1` to `lan-v0.2.0`.
- Do not move or reuse a published tag for newer code. Create a new version so players can identify exactly which build they downloaded.

## Publish through GitHub

1. Open the repository on GitHub.
2. Open **Releases** and select **Draft a new release**.
3. Select **Choose a tag**, enter the new tag (for example `lan-v0.2.0`), and create it from the commit containing the changes. Usually this is the latest commit on `main`.
4. Give the release a readable title, such as **LAN v0.2.0**.
5. Describe the changes players will notice. Mention new characters, rule changes, important fixes, and whether saved games from the previous release can continue.
6. Select **Publish release**. There is no need to attach files manually.

Publishing starts the **Windows LAN download** workflow in [`.github/workflows/lan-release.yml`](../.github/workflows/lan-release.yml). It checks out the tagged commit, installs the pinned Node.js version, runs the automated tests and type check, creates the portable LAN package, and attaches these two files to the release:

- `WerewolvesOnTheClocktower-LAN-Windows-x64.zip`
- `WerewolvesOnTheClocktower-LAN-Windows-x64.zip.sha256`

The ZIP includes the game, local server, Windows launcher, portable Node.js runtime, guides, and licences. It does not contain saved games. The checksum lets users verify that the download was not damaged or changed.

## Check the workflow and download

1. Open the repository's **Actions** page.
2. Open the newest **Windows LAN download** run and wait for both the `build` and `publish` jobs to succeed.
3. Return to the release page and confirm that the ZIP and `.sha256` file appear under **Assets**. GitHub's automatic **Source code** archives are not the ready-to-play package.
4. Download the ZIP yourself and extract it into a new empty folder.
5. Double-click **Start LAN Game.cmd**, start a room, and join it from a phone on the same network.
6. Confirm that the released version contains the newest characters or fixes before sharing the release.

Never test or redistribute the ZIP from inside the archive. Extract the whole package first. Do not upload a previously used `.build/lan-kit` or any `.lan` game-data folder.

## If the workflow fails

Open the failed run under **Actions**, expand the failed step, and fix the reported test, type, or packaging error in the repository. Commit and push the fix, then publish a new release tag for the corrected commit.

If GitHub had a temporary runner problem and the tagged code is unchanged, use **Re-run all jobs** on the failed workflow. The upload command safely replaces assets with the same names on that same release.

If the release has already been shared and its code needs to change, keep that release and tag as historical records. Publish the fix under a new tag instead of moving the old tag.

## Build a release without publishing it

To let GitHub build a test package:

1. Open **Actions → Windows LAN download**.
2. Select **Run workflow**, choose the branch, and run it.
3. After the build succeeds, download the **Windows-LAN-download** workflow artifact.

This manual run does not create a GitHub release or attach files to an existing one.

On a Windows x64 development computer, the same package can be built locally:

```sh
npm ci
npm run lan:release
```

The ZIP and checksum are written to `.build/release`. Files under `.build` are generated and must stay out of Git.
