# Partner-Keyboard prototype

A strip of common coding symbols + snippets that pins above the
mobile system keyboard so mobile users can type real code instead
of being forced into blocks-mode.

## What's here

- `index.html` — self-contained prototype. No build step, no
  dependencies. Open it in a browser and tap into the textarea to
  see the strip appear.

The full design rationale + the two iOS-Safari tricks that make
this work (visualViewport math + pointerdown.preventDefault) live
inside the file's top-of-script comment.

## Test it on your phone

The two important behaviours (the strip pinning to the system
keyboard's top edge, and tapping a key not dismissing the keyboard)
only fire on a real touch device. Desktop testing confirms
insertion semantics but skips the keyboard interaction.

Pick whichever:

```sh
# Option A — single-shot static server (no install)
npx serve prototypes/partner-keyboard

# Option B — Python (preinstalled on macOS)
cd prototypes/partner-keyboard && python3 -m http.server 8080
```

Then on your phone (same wifi as your laptop), open the
`http://<your-mac-ip>:<port>/` URL. `ifconfig | grep "inet "`
shows your Mac's LAN IP.

If you'd rather skip the server and just open the file, `open
prototypes/partner-keyboard/index.html` works for desktop testing
— iOS Safari can be quirky with `file://` URLs around viewport
events, so the server route is the more honest test of the real
behaviour.

## What gets exercised

Five tabs across the top of the strip:

| Tab        | Contents                                                  |
|------------|-----------------------------------------------------------|
| symbols    | `( ) [ ] { } < > ; : , . ? ! @ # $ " ' ` \ / | & * _ + - = ^ ~ %` |
| pairs      | Paired chars that insert both halves with caret between (`()`, `[]`, `{}`, `<>`, `""`, `''`, `` `` ``, `/* */`, `<!-- -->`) |
| operators  | `= == === != !== += -= && \|\| ?? ++ -- << >> & \| ^ ~ ?:` |
| js         | Keywords + common snippets (`const `, `=>`, `if () {}`, `console.log()`, `.map(...)`, `try / catch`, ...) |
| cursor     | `tab`, `↩`, `←↑↓→`, line-start, line-end, delete-word, select-line |

## Bringing it into Fishbones (next pass)

When this design feels right on the phone, the integration shape is:

- Extract `<PartnerKeyboard>` as a React component that takes
  `target: HTMLTextAreaElement | MonacoEditor` plus an `active`
  flag.
- Portal-render into `document.body` so it escapes the editor's
  layout container and pins to the visual viewport's bottom.
- Mount only when `isMobile && editor.isFocused`. Desktop keeps
  its hardware keyboard.
- Wire the `cursor` tab's arrow / line-* / delete-word actions to
  the Monaco command palette directly when the editor is Monaco —
  Monaco's `editor.trigger('keyboard', 'cursorLeft')` etc. preserves
  the editor's own state model.
- Reuse `data-tts-block`-style block-mode hooks so the strip can
  surface lesson-specific snippets (per-language keywords / std
  fn calls) by reading the lesson's `language`.
- Probably ship as an opt-in toggle first under Settings → General
  → "Mobile coding strip", with default ON on phones once the
  design is dialled in.

The CATEGORIES object at the bottom of `index.html` is the source
of truth for what each tab contains — port that directly.
