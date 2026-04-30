//! Argon2id-based password + token hashing.
//!
//! Two helpers each for passwords and tokens — separate fns rather
//! than a generic so a future audit can pin the exact param tuple per
//! use case. Passwords get the default Argon2id params (memory cost
//! ~19 MB, t=2) which the user only pays once per session; tokens
//! also use defaults but a future tightening could lower them since
//! we verify on every authenticated request.

use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rand::rngs::OsRng;

/// Hash a password for storage. Generates a fresh random salt per
/// call — never reuse one across users.
pub fn hash_password(password: &str) -> anyhow::Result<String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon = Argon2::default();
    Ok(argon
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| anyhow::anyhow!("hash failed: {e}"))?
        .to_string())
}

/// Constant-time verify of a plaintext password against an
/// Argon2-encoded hash. Returns false on any parse error so a
/// malformed hash row never panics the auth path.
pub fn verify_password(password: &str, hash: &str) -> bool {
    let parsed = match PasswordHash::new(hash) {
        Ok(h) => h,
        Err(_) => return false,
    };
    Argon2::default()
        .verify_password(password.as_bytes(), &parsed)
        .is_ok()
}

/// Hash a Bearer token for storage. Same Argon2id params as
/// `hash_password` for now; split into its own fn so that can change
/// independently later.
pub fn hash_token(token: &str) -> anyhow::Result<String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon = Argon2::default();
    let hash = argon
        .hash_password(token.as_bytes(), &salt)
        .map_err(|e| anyhow::anyhow!("hash failed: {e}"))?;
    Ok(hash.to_string())
}

/// Constant-time verify of a Bearer token against an Argon2-encoded
/// hash. Returns false on any parse error.
pub fn verify_token(token: &str, hash: &str) -> bool {
    let parsed = match PasswordHash::new(hash) {
        Ok(h) => h,
        Err(_) => return false,
    };
    Argon2::default()
        .verify_password(token.as_bytes(), &parsed)
        .is_ok()
}

/// Deterministic SHA-256 hash of a high-entropy random token, hex-
/// encoded for storage. Used as a database LOOKUP key — the same
/// plaintext always produces the same hash, so we can put it in a
/// `WHERE token_hash = ?` query and hit a primary-key index in O(1).
///
/// Don't use this for user passwords. The point of Argon2 (above) is
/// to be slow against brute-force on low-entropy inputs; SHA-256 is
/// fast enough that a leaked database with SHA-256 password hashes
/// could be cracked offline. For session / reset tokens that already
/// have 256 bits of entropy, the rainbow-table threat doesn't exist
/// — there's no shorter pre-image to find — so the deterministic
/// fast path is correct.
pub fn hash_lookup_token(token: &str) -> String {
    use sha2::{Digest, Sha256};
    let mut hasher = Sha256::new();
    hasher.update(token.as_bytes());
    let bytes = hasher.finalize();
    // Hex output keeps the column human-greppable for debugging
    // without giving up much storage (64 chars vs 32 raw bytes).
    let mut s = String::with_capacity(64);
    for b in bytes {
        use std::fmt::Write;
        let _ = write!(s, "{b:02x}");
    }
    s
}
