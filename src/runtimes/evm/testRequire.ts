/// Minimal `require()` shim handed to lesson test code as the 6th
/// arg of the AsyncFunction the harness builds. Originally lived
/// inline in `runEvm` (`runtimes/evm.ts`); pulled out so the
/// headless CLI verifier (`scripts/verify-evm-course.mjs`) can
/// share one source of truth — divergence here means the in-app
/// "Verify course" and the CLI report different pass/fail counts
/// for the same code, which would defeat the whole point of having
/// a CLI mirror the in-app runtime.
///
/// Supports the small surface course tests actually exercise:
///   - `require('crypto').createHash('sha256').update(x).digest()` —
///     used by signature-verification lessons that pre-hash messages
///     off-chain. We only implement sha256 (no md5/sha1/ripemd) — if
///     a lesson asks for anything else we throw a helpful error.
///   - `require('ethers')` — `AbiCoder` for encode/decode + the two
///     module-level helpers `keccak256` and `solidityPacked`. Lessons
///     that build merkle leaves / commit hashes off-chain reach for
///     these by name.
///
/// We deliberately don't pull in real Node `crypto` / real `ethers`
/// here — those packages are 3MB+ each and would balloon the test
/// sandbox. The shimmed APIs are the smallest set the existing
/// course content needs.

import { hexToBytes } from "@ethereumjs/util";
import { keccak_256 } from "@noble/hashes/sha3";
import { sha256 } from "@noble/hashes/sha2";
import { encodeAbiParameters, decodeAbiParameters, type Hex } from "viem";

export type TestRequire = (name: string) => unknown;

/// Build the require() shim. Pure factory — no captured state.
/// Called once per `runEvm` invocation; the returned function is
/// passed straight into the AsyncFunction sandbox.
export function makeTestRequire(): TestRequire {
  return (name: string): unknown => {
    if (name === "crypto") {
      return {
        createHash(algo: string) {
          if (algo !== "sha256") {
            throw new Error(
              `crypto.createHash: only sha256 is shimmed (got ${algo})`,
            );
          }
          let buf: Uint8Array | null = null;
          const chunks: Uint8Array[] = [];
          return {
            update(data: Uint8Array | string) {
              const bytes =
                typeof data === "string"
                  ? new TextEncoder().encode(data)
                  : data;
              chunks.push(bytes);
              return this;
            },
            digest(enc?: "hex") {
              const total = chunks.reduce((n, c) => n + c.length, 0);
              const merged = new Uint8Array(total);
              let off = 0;
              for (const c of chunks) {
                merged.set(c, off);
                off += c.length;
              }
              buf = sha256(merged);
              if (enc === "hex") {
                return Array.from(buf, (b) =>
                  b.toString(16).padStart(2, "0"),
                ).join("");
              }
              // Buffer-like object that can `.toString('hex')`
              return Object.assign(buf, {
                toString(e?: string) {
                  if (e === "hex" || e === undefined) {
                    return Array.from(buf as Uint8Array, (b) =>
                      b.toString(16).padStart(2, "0"),
                    ).join("");
                  }
                  return new TextDecoder().decode(buf as Uint8Array);
                },
              });
            },
          };
        },
      };
    }
    if (name === "ethers") {
      return {
        AbiCoder: class {
          encode(types: string[], values: unknown[]): Hex {
            return encodeAbiParameters(
              types.map((t) => ({ type: t })),
              values as readonly unknown[],
            ) as Hex;
          }
          decode(types: string[], data: Hex): unknown[] {
            return decodeAbiParameters(
              types.map((t) => ({ type: t })),
              data,
            ) as unknown[];
          }
        },
        keccak256(data: Uint8Array | string): Hex {
          const bytes =
            typeof data === "string" ? hexToBytes(data as Hex) : data;
          return ("0x" +
            Array.from(keccak_256(bytes), (b) =>
              b.toString(16).padStart(2, "0"),
            ).join("")) as Hex;
        },
        solidityPacked(types: string[], values: unknown[]): Hex {
          // Mirror ethers.solidityPacked: tightly-packed encoding of
          // each (type, value) pair without abi-encoding length prefixes.
          let out = "0x";
          for (let i = 0; i < types.length; i++) {
            const t = types[i];
            const v = values[i];
            if (t === "bytes32") {
              const h = (v as string).toLowerCase().replace(/^0x/, "");
              out += h.padStart(64, "0");
            } else if (t === "address") {
              const h = (v as string).toLowerCase().replace(/^0x/, "");
              out += h.padStart(40, "0");
            } else if (/^uint(\d+)?$/.test(t) || /^int(\d+)?$/.test(t)) {
              const m = t.match(/^(?:u?int)(\d+)?$/);
              const bits = m && m[1] ? parseInt(m[1], 10) : 256;
              const hexLen = bits / 4;
              const bn = BigInt(v as string | number | bigint);
              out += bn.toString(16).padStart(hexLen, "0");
            } else if (t === "bool") {
              out += v ? "01" : "00";
            } else if (t === "string" || t === "bytes") {
              const bytes =
                typeof v === "string" && t === "string"
                  ? new TextEncoder().encode(v)
                  : typeof v === "string"
                    ? hexToBytes(v as Hex)
                    : (v as Uint8Array);
              out += Array.from(bytes, (b) =>
                b.toString(16).padStart(2, "0"),
              ).join("");
            } else {
              throw new Error(`solidityPacked: unsupported type ${t}`);
            }
          }
          return out as Hex;
        },
      };
    }
    throw new Error(
      `require(${JSON.stringify(name)}) is not supported in EVM tests`,
    );
  };
}
