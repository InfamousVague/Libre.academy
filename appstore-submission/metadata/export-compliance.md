# Export Compliance — encryption declaration

Every iOS upload triggers an "Export Compliance" question because of US encryption-export law. The wizard asks one core question: *"Does your app use encryption?"* — but the right answer hinges on whether you use **non-exempt** encryption, not whether you use any.

For Libre, the answer is **No (exempt)** because everything we use is either standard HTTPS (already exempt) or standard at-rest crypto provided by iOS (also exempt).

## What the wizard will ask, and how to answer

### "Does your app use encryption?"

**Yes** — but only standard, exempt encryption. Continue to the next question.

### "Does your app meet any of the following?"

Tick:
- ✅ **(a) Uses standard encryption only.** — TLS via `URLSession`/`fetch`, JWT validation, the bundled `crypto.subtle` API for SHA-256 hashing of course content. No custom ciphers.
- ✅ **(b) Uses encryption that is for authentication only.** — Sign in with Apple identity tokens, Google ID tokens, password-hash verification on the relay (bcrypt, server-side). All standard.

If both are true, the wizard concludes **No non-exempt encryption** and you're done.

### `ITSAppUsesNonExemptEncryption` in Info.plist

To skip this dialog on every upload, add this key to `src-tauri/gen/apple/libre_iOS/Info.plist`:

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

With that key set, App Store Connect doesn't ask again. Recommended — saves a click per upload.

> The `Info.plist` is checked-in (`xcodegen` is configured NOT to overwrite it — see the comment in `project.yml`), so editing it once persists across builds.

## What counts as non-exempt

For reference, you'd answer "Yes — non-exempt encryption" only if Libre did one of:
- Implemented a custom block cipher or hash function in app code (we don't).
- Encrypted data with a proprietary scheme rather than relying on iOS APIs (we don't).
- Bundled an encryption library NOT covered by the standard exemptions (e.g., a custom ChaCha20 build for non-authentication purposes — we don't).
- Distributed cryptographic algorithms TO third parties via the app (we don't).

Standard HTTPS, OAuth, JWT, password hashing for authentication, SHA-256 for content addressing — all exempt.

## Annual renewal

The US BIS exemption is per calendar year. If your app stays in the store across years, you'll get a once-a-year App Store Connect prompt to re-confirm the encryption answer. Same answer, one click.

## Source-of-truth links

- Apple's wizard explanation: https://help.apple.com/app-store-connect/#/dev88f5c7bf9
- BIS exemption details (the actual law): https://www.bis.doc.gov/index.php/policy-guidance/encryption
