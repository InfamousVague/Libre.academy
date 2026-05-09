# App Store Icon (1024 × 1024)

## What goes in this folder

A single file: **`AppIcon-1024.png`** — the marketing icon Apple shows on the App Store listing.

Drop the file into this folder and rename it `AppIcon-1024.png`. Drag it into App Store Connect → App Information → App Icon.

## The 1024 × 1024 master

The current build's marketing icon already exists in the repo:

```
src-tauri/gen/apple/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
```

That file IS 1024 × 1024 (`@2x` of a 512-point asset). Copy it here:

```bash
cp src-tauri/gen/apple/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png \
   appstore-submission/icon/AppIcon-1024.png
```

Verify the dimensions with `sips`:

```bash
sips --getProperty pixelWidth --getProperty pixelHeight \
     appstore-submission/icon/AppIcon-1024.png
```

Should print `pixelWidth: 1024` and `pixelHeight: 1024`. Anything else gets rejected at upload.

## What Apple actually checks

App Store Connect runs the icon through these gates:
- **Format**: PNG (8-bit per channel; `.jpg` is rejected).
- **Dimensions**: exactly 1024 × 1024.
- **Alpha channel**: must NOT be present. The corners stay opaque — Apple rounds them automatically.
- **Layers / transparency**: flat, no transparent pixels anywhere.

If your master has alpha, strip it with ImageMagick:

```bash
magick AppIcon-1024.png -background "#000000" -alpha remove -alpha off AppIcon-1024.png
```

(Replace `#000000` with the colour you want under any transparent areas.)

## Regenerating the whole icon set

If you redesign the icon, the source-of-truth is `cover-overrides/` — drop a 1024 × 1024 master there as `app-icon.png`, then regenerate every per-size asset Tauri's iOS bundle needs:

```bash
cd /Users/matt/Development/Apps/Fishbones
npx tauri icon path/to/source-1024.png
```

Tauri walks every required size (20×20 @1x/@2x/@3x, 29×29 …, 1024×1024) and writes them into `src-tauri/icons/`, `src-tauri/gen/apple/Assets.xcassets/AppIcon.appiconset/`, and the Android mipmap dirs.

After regenerating, copy `AppIcon-512@2x.png` into this folder again — that's the one you upload to App Store Connect.

## Sanity check before submit

- [ ] File is 1024 × 1024 PNG (not JPG, not PNG-with-alpha).
- [ ] No transparent pixels.
- [ ] Edge pixels match the icon's intended background colour (Apple rounds the corners; if the corner colour is transparent or doesn't match, you'll see a visible mask on iOS).
- [ ] Looks distinguishable at 60×60 — Apple displays the icon at that size in iPhone home-screen render. Open the file in Preview, zoom way out, check it still reads.

## Where this icon shows up

- App Store search results
- App Store product page hero
- Spotlight search results on iOS
- Settings → General → iPhone Storage → Libre

NOT used for the on-device home-screen icon — that comes from the per-size assets in `AppIcon.appiconset/`.

## Common rejection reasons (icon-specific)

- **Different from the home-screen icon.** Apple expects the marketing icon and the runtime icon to match. Both come from the same source PNG when you run `tauri icon`, so this stays consistent automatically.
- **Lossy compression visible.** Use the original PNG out of `tauri icon` — re-saving from Photoshop / Preview at low quality introduces gradient banding that looks bad at 1024 px.
- **Trademark / placeholder content.** If the icon contains something you don't have rights to (a logo, a stock-photo face, copyrighted typography), Apple rejects. Libre's icon is original — no risk here.
