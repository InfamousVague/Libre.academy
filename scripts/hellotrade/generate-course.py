#!/usr/bin/env python3
"""
Generate the HelloTrade starter course JSON from inline lesson
content. Output lands at public/starter-courses/hellotrade.json.

Source material distilled from the HelloTrade developer docs at
https://hellotrade.gitbook.io/hellotrade-docs/. Half the size of
A to Zig (~50 lessons vs ~105) — lighter touch, more focus on
the API tester (TradeDock) which is the central interactive tool.

Lesson kinds used:
  - reading:  prose lesson, body markdown only
  - quiz:     multiple-choice + short-answer questions, all-correct
              gates completion
  - mixed:    prose lesson with `harness: "trade"` so the TradeDock
              mounts above. We use mixed instead of exercise so the
              lesson doesn't require a runnable code starter the
              learner has to "pass" — the dock IS the interactive
              part. The optional starter is a tiny console.log so
              the editor pane has a default state, and the test
              just asserts true so verify always passes (the real
              learning is in the dock, not the run output).

Run with: python3 scripts/hellotrade/generate-course.py
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


# A trivial "always-passes" exercise harness. Since TradeDock-using
# lessons aren't really about code-running (they're about API
# requests inside the dock), every coding lesson here uses the same
# placeholder starter + tests. This way the editor still works
# the same way as in any other course and clicking Run gives a
# friendly "looks good" output, but the learner's real attention
# lives above in the TradeDock.
TRADE_PLACEHOLDER = {
    "language": "javascript",
    "starter": (
        "// This lesson's interactive surface is the API Tester above.\n"
        "// Run this when you're done — it just confirms you reached the lesson.\n"
        "console.log('Switch to the API Tester above to follow this lesson.');\n"
    ),
    "solution": (
        "console.log('Switch to the API Tester above to follow this lesson.');\n"
    ),
    "tests": (
        "// Trivial test — the lesson is dock-driven, not run-driven.\n"
        "test('reached the lesson', () => {\n"
        "  expect(true).toBe(true);\n"
        "});\n"
    ),
    "harness": "trade",
}


def reading(lesson_id: str, title: str, body: str) -> dict[str, Any]:
    return {
        "id": lesson_id,
        "kind": "reading",
        "title": title,
        "body": body.strip() + "\n",
    }


def trade_lesson(
    lesson_id: str, title: str, body: str, *, starter: str | None = None
) -> dict[str, Any]:
    """Mixed-kind lesson with the TradeDock harness bound."""
    base = {
        "id": lesson_id,
        "kind": "mixed",
        "title": title,
        "body": body.strip() + "\n",
    }
    base.update(TRADE_PLACEHOLDER)
    if starter is not None:
        base["starter"] = starter
        base["solution"] = starter  # solution irrelevant; starter == solution
    return base


def quiz(lesson_id: str, title: str, body: str, questions: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "id": lesson_id,
        "kind": "quiz",
        "title": title,
        "body": body.strip() + "\n",
        "questions": questions,
    }


def mcq(prompt: str, options: list[str], correct_index: int, explanation: str = "") -> dict[str, Any]:
    return {
        "kind": "mcq",
        "prompt": prompt,
        "options": options,
        "correctIndex": correct_index,
        **({"explanation": explanation} if explanation else {}),
    }


def short_answer(prompt: str, accept: list[str], explanation: str = "") -> dict[str, Any]:
    return {
        "kind": "short",
        "prompt": prompt,
        "accept": accept,
        **({"explanation": explanation} if explanation else {}),
    }


# ────────────────────────────────────────────────────────────────────
# Course content
# ────────────────────────────────────────────────────────────────────

CHAPTERS: list[dict[str, Any]] = []

# ── Chapter 1: What is HelloTrade? ─────────────────────────────────

CHAPTERS.append(
    {
        "id": "intro",
        "title": "What is HelloTrade?",
        "lessons": [
            reading(
                "what-is-hellotrade",
                "What is HelloTrade?",
                """
HelloTrade is a **decentralized perpetual futures exchange** that
lets you trade crypto with leverage — without any of the gas-fee
friction usually associated with on-chain trading. You authenticate
with your wallet, sign your orders, and the exchange does the rest.

If you've used Binance or Coinbase, the trading screen will feel
familiar: an order book, candle charts, market and limit orders,
positions. If you've used Uniswap, the wallet-first auth flow will
feel familiar: no email, no password, just a signature.

What makes HelloTrade different from both:

- **No gas for orders.** Placing, modifying, and cancelling all
  happen off-chain via cryptographic signatures. You only pay
  on-chain fees when you deposit or withdraw collateral.
- **One wallet = one account.** Connect a wallet, sign a message,
  done. The exchange auto-creates your account on first auth.
- **Public market data with no auth.** Anyone can subscribe to
  the live ticker feed, order book, and trades stream — useful
  for building dashboards, bots, or just learning.

This course will walk you through the trading concepts, the
cryptographic signature scheme, and the WebSocket + REST APIs
you'd use to build your own client. We'll also use a built-in
**API tester** (the panel that appears above many lessons) to
hit real endpoints as we go.
""",
            ),
            reading(
                "perp-vs-spot",
                "Perpetual futures vs. spot",
                """
A **spot** trade is the simple kind: you buy 0.1 BTC for $6,700
USDC, your wallet balance shifts, you own the BTC.

A **perpetual futures contract** (or "perp") is different. You're
not buying the asset — you're entering a contract that **tracks**
the asset's price. If you "buy" 0.1 BTC-PERP at $67,000 and the
price moves to $68,000, your account credits the $100 difference.
If it moves to $66,000, your account debits $100. You never hold
BTC; you hold a position.

Why bother? Two reasons:

1. **Leverage.** A perp lets you control more notional value than
   the cash you put down as collateral. Post $1,000 in USDC,
   trade $10,000 worth of BTC exposure — that's 10x leverage.
   Profits and losses scale to the notional, not the cash.
2. **Shorting is symmetric.** "Selling" a perp you don't own is
   just opening a short position. There's no borrow step like
   on a centralized spot exchange.

Perps are called "perpetual" because they have no expiry date,
unlike traditional dated futures. To keep the perp's price
anchored to the underlying spot price, the exchange runs a
**funding rate** mechanism — periodic payments between longs
and shorts that we'll cover in chapter 3.
""",
            ),
            reading(
                "centralized-vs-decentralized",
                "Centralized vs. decentralized exchanges",
                """
HelloTrade sits between the two ends of a spectrum:

- A **centralized exchange** (CEX) like Binance custodies your
  funds, runs its own order matching engine, and handles
  authentication via username + password (often plus 2FA). You
  trust them with both your money and your identity.
- A **decentralized exchange** (DEX) like Uniswap runs entirely
  on-chain. Trades are smart-contract calls; you keep custody of
  your funds in your wallet. Trade-off: every action costs gas
  and confirmation takes seconds, which is awful for high-
  frequency trading.

HelloTrade's hybrid model:

- **Custody is on-chain.** Your USDC sits in the exchange's
  vault smart contract. You can withdraw it any time with a
  signed message.
- **Matching is off-chain.** The matching engine runs as a
  centralized server (fast, sub-millisecond fills) but every
  order is signed by your wallet. The server can't trade on your
  behalf without a signature.
- **Authentication is wallet-based.** No password to leak, no
  account to recover.

The result: the user experience of a CEX (instant fills, no gas
per trade) with the custody guarantee of a DEX (the exchange
operator can't run away with your funds).
""",
            ),
            reading(
                "the-order-book",
                "The order book",
                """
Every market on HelloTrade has an **order book** — two stacks of
resting orders waiting to match:

- The **bids** are buy orders, sorted by price descending.
  Whoever is willing to pay the most sits at the top.
- The **asks** are sell orders, sorted by price ascending.
  Whoever is willing to sell for the least sits at the top.

The gap between the highest bid and lowest ask is the **spread**.
Tight spreads mean a healthy market with lots of activity; wide
spreads mean illiquidity (or a fast-moving price).

When a new order arrives, the matching engine checks: does it
**cross** the book? A buy order at $67,341 would match against
the lowest ask of $67,340, generating a trade. A buy order at
$67,338 would just sit on the book as a new resting bid.

Order book snapshots look like this (top of book, BTC-PERP):

```
Asks
  67342.0  ×  0.270
  67341.5  ×  1.554
  67341.0  ×  0.901
  67340.5  ×  0.345    ← best ask (lowest sell price)
─────────────────────
  67340.0  ×  0.521    ← best bid (highest buy price)
  67339.5  ×  0.834
  67339.0  ×  1.230
  67338.5  ×  0.412
Bids
```

Spread: 67340.5 − 67340.0 = $0.50.

You'll see this exact shape in chapter 5 when we subscribe to the
live order book stream.
""",
            ),
            reading(
                "leverage-and-margin",
                "Leverage and margin (the basics)",
                """
**Margin** is the cash you post as collateral against a leveraged
position. **Leverage** is the multiplier between your margin and
your position size.

Example: you open a 10x long on BTC-PERP at $67,000.

- Position size: 1 BTC ($67,000 notional)
- Margin posted: $6,700 (1/10 of notional — that's the 10x)
- Available collateral remaining: depends on your account balance

If BTC rises 1% to $67,670:
- Position value: $67,670
- Profit: +$670
- Return on margin: +10% (the 1% × 10x leverage)

If BTC falls 1% to $66,330:
- Loss: −$670
- Return on margin: −10%

Leverage cuts both ways. It also exposes you to **liquidation** —
if your losses eat into your margin past a maintenance threshold,
the exchange will close your position to prevent it from going
negative. We'll cover liquidation in detail in chapter 3.

For now, the mental model: leverage lets you put up less money
to control more position. The exchange wants your collateral to
cover any plausible adverse move; if it can't, the position has
to close.
""",
            ),
            quiz(
                "intro-quiz",
                "Checkpoint: trading basics",
                "Quick check before we dive into the order types.",
                [
                    mcq(
                        "What's the main difference between perpetual futures and spot trading?",
                        [
                            "Perps cost more in fees than spot.",
                            "Perps track the asset price without you ever owning the asset; spot involves actually buying it.",
                            "Perps can only be sold, never bought.",
                            "Spot is always more leveraged than perps.",
                        ],
                        1,
                        "A perp is a contract that mirrors the price of an underlying asset. You profit or lose based on the price move; you never custody the asset.",
                    ),
                    mcq(
                        "How does HelloTrade authenticate users?",
                        [
                            "Username + password",
                            "Email magic links",
                            "A signed message from your wallet (no password)",
                            "An API key that you generate in a dashboard",
                        ],
                        2,
                        "Wallet signatures are the entire auth model — no password, no email, no API keys.",
                    ),
                    short_answer(
                        "What's the term for the gap between the best bid and the best ask in an order book?",
                        ["spread", "the spread", "bid ask spread", "bid-ask spread"],
                        "The spread. Tight spreads = liquid market; wide = thin or volatile.",
                    ),
                    mcq(
                        "If you open a 10x leveraged long on BTC-PERP and BTC rises 2%, your return on margin is approximately:",
                        ["+2%", "+5%", "+10%", "+20%"],
                        3,
                        "Leverage multiplies the percentage move on the underlying. 2% × 10x = 20% return on margin (and the same magnitude downside if it had moved against you).",
                    ),
                ],
            ),
        ],
    }
)

# ── Chapter 2: Order types and pricing ────────────────────────────

CHAPTERS.append(
    {
        "id": "orders",
        "title": "Order types and pricing",
        "lessons": [
            reading(
                "limit-orders",
                "Limit orders",
                """
A **limit order** says: "match me, but only at this price or
better." A buy limit at $67,000 will fill at $67,000 or below;
a sell limit at $67,000 will fill at $67,000 or above.

Limit orders let you control the price you pay, but they don't
guarantee a fill — if the market never reaches your price, your
order sits on the book forever (or until the time-in-force
expires; more on that shortly).

Limit orders that don't immediately match become **resting
orders** sitting on the order book. They're the orders you saw in
the previous chapter's bid/ask stack.

A limit order that DOES immediately match (e.g. a buy limit
above the best ask) acts like a market order for the matched
portion, and any leftover sits on the book. This is called a
**marketable limit** — usually preferred over a pure market
order because it caps your worst-case execution price.
""",
            ),
            reading(
                "market-orders",
                "Market orders",
                """
A **market order** says: "match me right now, at whatever price
the book offers." Market buys eat through the asks from the top
down; market sells eat through the bids.

The trade-off: instant fill, but your fill price depends on how
much liquidity sits at each level. A small buy might fill at the
best ask. A huge buy in a thin market can **slip** several
percent as it consumes successive levels.

```
Asks
  67342.0  ×  0.270   ← consumed second
  67341.5  ×  1.554
  67341.0  ×  0.901
  67340.5  ×  0.345   ← consumed first
```

A market buy of 0.5 BTC against this book fills as:
- 0.345 @ 67340.5
- 0.155 @ 67341.0 (top of next level)
- Volume-weighted average: ~$67,340.66

That ~$0.16 above the best ask is your **slippage**. For tiny
sizes against deep books it's negligible; for large sizes against
thin books it's the dominant cost.

For this reason, most algorithmic traders use marketable limit
orders (a limit slightly above the best ask) instead of pure
market orders — same instant fill, but a hard cap on slippage.
""",
            ),
            reading(
                "stop-and-stoplimit",
                "Stop and stop-limit orders",
                """
A **stop order** is conditional: it sits dormant until a trigger
price is touched, then activates as a market order.

Stop orders come in two flavours:

- **Stop-loss**: triggers when the price moves AGAINST you.
  Long position at $67,000 with a stop at $66,500 → if BTC drops
  to $66,500, your stop fires a market sell to close the position.
- **Stop-buy**: triggers when the price moves UP through a level.
  Useful for breakout entries: place a buy stop above current
  resistance, get filled if and only if the breakout happens.

The risk with a plain stop is the same as a plain market order:
slippage. In a fast move, the market price at trigger time may
be well past your stop level, and you fill into a thin book.

A **stop-limit** order solves this. Two prices:
- **Stop price**: when the market touches this, the order activates.
- **Limit price**: once active, it's a regular limit order at this price.

A stop-limit sell with stop=$66,500 and limit=$66,400 means: at
$66,500 the order arms; it then tries to fill at $66,400 or
better. If the market gaps straight to $66,000, the limit at
$66,400 doesn't match and the position stays open.

The trade-off vs. a plain stop: you avoid catastrophic slippage,
but you might not fill at all in a violent move.
""",
            ),
            reading(
                "time-in-force",
                "Time in force flags",
                """
Every order carries a **time in force (TIF)** flag that controls
how long the matching engine keeps it alive:

- **GTC** (Good Till Cancelled): rests on the book until you
  cancel it or it fills. The default for limit orders that you
  expect to live for a while.
- **GTD** (Good Till Date): like GTC, but auto-cancels at a
  specified deadline timestamp.
- **IOC** (Immediate Or Cancel): match what you can right now;
  cancel any unfilled remainder. Used for "I want at most this
  price, but if I can't get my whole size, I don't want a leftover
  resting on the book."
- **FOK** (Fill Or Kill): match the whole order immediately, or
  cancel completely. No partial fills. Used for "all or nothing"
  arbitrage where a partial fill leaves you with an unwanted leg.
- **DAY**: like GTC, but auto-cancels at the end of the current
  trading day (defined by exchange UTC midnight).

Market orders are typically IOC by definition — there's no resting
state for a market order to return to.

Picking the right TIF matters as much as picking the right price:
a GTC limit can leave you in a stale position weeks later, an FOK
on a thin market just gets cancelled instantly.
""",
            ),
            reading(
                "ticks-and-lots",
                "Tick sizes and lot sizes",
                """
Markets aren't continuous. Every market has a **tick size**
(minimum price increment) and a **lot size** (minimum size
increment).

For BTC-PERP on HelloTrade:
- Tick size: 0.5 — prices are quoted in $0.50 steps
  ($67,340.00, $67,340.50, $67,341.00, but never $67,340.30)
- Lot size: 0.0001 — order sizes round to 0.0001 BTC
  (you can trade 0.0001, 0.0002, etc., but not 0.00005)

For ETH-PERP:
- Tick size: 0.05
- Lot size: 0.001

The exchange tells you these values via the **instruments
endpoint** (`GET /api/instruments`), which we'll hit in the API
tester in chapter 7. If you submit an order at a non-tick price,
the engine rejects it with an `INVALID_PRICE` error.

Your client code should round prices and sizes to the tick / lot
before sending. Common idiom:

```js
function roundToTick(price, tickSize) {
  return Math.round(price / tickSize) * tickSize;
}
```
""",
            ),
            reading(
                "self-trade-prevention",
                "Self-trade prevention",
                """
What happens if you accidentally place a buy order that matches
your own resting sell order? On most exchanges, by default, the
trade just fills — you swap with yourself, eat the fee, and walk
away with the same position you had before.

HelloTrade has **self-trade prevention (STP)** built in. When the
matching engine sees an incoming order from account X about to
cross with a resting order from the SAME account X, it can:

- **Cancel both** orders and let you re-place
- **Cancel the resting** order and let the new one rest
- **Cancel the new** order and leave the resting one
- **Decrement and cancel** — match the smaller side, cancel the
  rest of the larger

Which mode applies depends on the order's STP flag. Most
algorithmic traders set "cancel both" so neither side leaks
through; manual traders often use "cancel new" so they don't
accidentally lose a long-resting order.

This matters most for market makers who quote both sides
constantly — without STP, every requote risk eating its own
quote.
""",
            ),
            quiz(
                "orders-quiz",
                "Checkpoint: order types",
                "Make sure these are second-nature before we touch the API.",
                [
                    mcq(
                        "You want to enter a long position only if BTC breaks above $70,000. What order type fits?",
                        [
                            "Limit buy at $70,000",
                            "Market buy",
                            "Stop-buy with trigger $70,000",
                            "Stop-limit sell with stop $70,000",
                        ],
                        2,
                        "A stop-buy sits dormant until the trigger is touched, then activates. A limit at $70k would fill any time the market is at or below $70k — the opposite of waiting for a breakout.",
                    ),
                    mcq(
                        "What does FOK (Fill Or Kill) guarantee?",
                        [
                            "The order fills the full size or doesn't fill at all",
                            "The order rests on the book until you cancel it",
                            "The order fills at the best available price regardless of size",
                            "The order auto-cancels at end of day",
                        ],
                        0,
                        "All-or-nothing. Used when a partial fill would leave you with an unwanted leg.",
                    ),
                    short_answer(
                        "If BTC-PERP has a tick size of 0.5, can you place a limit at 67340.30?",
                        ["no", "No", "no, must be a multiple of 0.5"],
                        "No — prices have to land on a tick boundary. The engine rejects non-tick prices with INVALID_PRICE.",
                    ),
                    mcq(
                        "What is self-trade prevention designed to stop?",
                        [
                            "Two different traders matching against each other",
                            "Your account matching against another account on the same exchange",
                            "Your incoming order accidentally matching a resting order from the same account",
                            "Stop orders triggering during low liquidity",
                        ],
                        2,
                        "STP catches the case where you'd be on both sides of the trade — wasting fees and leaving your net position unchanged.",
                    ),
                ],
            ),
            trade_lesson(
                "first-api-call",
                "Your first API call",
                """
Time to actually use the platform. Above this lesson is the **API
Tester** — it's like a built-in Postman, with HelloTrade's
endpoints pre-loaded in the sidebar.

Try this:

1. In the sidebar, under **Market data**, click **List markets**.
2. The URL bar fills with `GET {{baseUrl}}/api/markets`.
3. Hit **Send**.
4. The response panel shows a JSON list of every market the
   exchange supports — BTC-PERP, ETH-PERP, etc., along with their
   numeric ids and decimal precision.

By default the dock runs in **MOCK** mode (the pill in the header
says so) — the response is canned but structurally accurate, so
the lesson works offline. Toggle **Live mode** to hit the real
staging API. Either way, the request and response shapes are
identical.

Now try **List instruments** — same kind of GET, returns more
metadata (tick sizes, lot sizes, max leverage). This is the
endpoint your client would call on startup to know what to
display.

A few other things worth poking at while you're here:
- The `{{·}}` button opens the **environment editor** — that's
  where `{{baseUrl}}` is defined. You can swap to mainnet by
  editing one variable.
- The **History** in your browser localStorage remembers your
  recent requests so reloading doesn't lose them.

Spend a couple of minutes exploring; the rest of the course
hangs off this tool.
""",
            ),
        ],
    }
)

# ── Chapter 3: Risk: liquidation, funding, margin ─────────────────

CHAPTERS.append(
    {
        "id": "risk",
        "title": "Risk: liquidation, funding, margin",
        "lessons": [
            reading(
                "initial-vs-maintenance-margin",
                "Initial vs. maintenance margin",
                """
Two margin numbers control your position's risk envelope:

- **Initial margin** is what you have to post to OPEN the
  position. At 10x leverage on a $10,000 notional, initial margin
  is $1,000.
- **Maintenance margin** is the minimum equity you must keep in
  the position to STAY open. Always lower than initial margin —
  typically 50% of it (so 5% of notional for the 10x example).

If your equity in the position drops below the maintenance
margin (because the price moved against you), the exchange
**liquidates** — closes the position automatically to prevent
your account from going negative.

Quick walkthrough. Long 1 BTC at $67,000, 10x leverage:
- Initial margin: $6,700 (10% of notional)
- Maintenance margin: $3,350 (5% of notional)
- Liquidation price: roughly when your unrealized loss equals
  initial − maintenance = $3,350. That's a $3,350 / 1 BTC =
  $3,350 move down → liquidation around $63,650.

The exact liquidation price depends on funding accruals, fees,
and any cross-margin contributions from other positions, but
that's the back-of-envelope.
""",
            ),
            reading(
                "the-liquidation-engine",
                "How liquidation works",
                """
When your equity hits the maintenance margin threshold, the
liquidation engine fires:

1. **Position is taken over** by the liquidation system.
2. The system places a **closing order** on the book — usually a
   market or marketable limit order to flatten the position
   immediately.
3. If the resulting fill is at a worse price than the bankruptcy
   price (where your remaining margin would be exactly zero),
   the exchange's **insurance fund** absorbs the deficit so the
   counterparty still gets full payout.
4. If even the insurance fund can't cover it (rare, only in
   extreme moves), **auto-deleveraging (ADL)** kicks in: the
   exchange selects profitable counterparties (highest leverage,
   then highest unrealized PnL) and closes a fraction of THEIR
   positions to socialise the loss.

What this means for you as a trader:
- Don't wait for liquidation; close manually if you can. The
  liquidation system charges a fee on top of your loss.
- ADL is rare but real — extreme volatility can cap your profits
  even if your direction was right, because someone on the other
  side blew up.
- Insurance funds are healthy on big exchanges; ADL is a
  catastrophic-tail risk, not a daily concern.
""",
            ),
            reading(
                "funding-rates",
                "Funding rates explained",
                """
Perpetual futures have no expiry — so what keeps them tracking
the spot price? Funding rates.

Every 8 hours (or hourly on some exchanges), the platform
calculates the spread between the perp price and the spot index.
If the perp is trading ABOVE spot (longs want exposure more than
shorts), longs PAY shorts a small percentage of their position
value. If it's trading BELOW spot, shorts pay longs.

The math:
- Funding rate is computed and published continuously.
- A typical rate is in the range ±0.01% per 8-hour period
  (about 11% annualized, either way).
- At each funding tick, every position pays/receives:
  `position_size × index_price × funding_rate`.

Why this matters as a trader:
- **Carry cost.** If you're long a market with persistently
  positive funding, you're paying ~10–30% APR just to hold the
  position, even if the price doesn't move.
- **Mean reversion signal.** Extreme funding rates often precede
  price reversals — they imply lopsided positioning.
- **Funding arbitrage.** You can short the perp and buy the spot
  in equal size to harvest the funding rate while staying
  delta-neutral. Real cash, real profit, real risk (basis risk
  if the legs decouple).

You can fetch current and historical funding rates via the
`/api/funding-rates` endpoint — try it in the API tester after
this chapter.
""",
            ),
            reading(
                "mark-vs-index-price",
                "Mark price vs. index price vs. last price",
                """
Three prices a perp keeps track of, and they're not the same:

- **Last price**: the price of the most recent trade on this
  market. What you see flashing on the ticker.
- **Index price**: a volume-weighted average from external spot
  exchanges. Represents the "fair" price of the underlying.
- **Mark price**: the price the exchange uses to compute
  unrealized PnL and trigger liquidations. Usually a smoothed
  blend of index price + perp price, biased toward the index to
  prevent manipulation.

Why mark price exists: imagine you're long with a tight stop. A
malicious actor briefly spikes the LAST price by hitting your
stop on this exchange. If the system used last price for
liquidations, your position blows up on a flash crash that didn't
happen on any other exchange. By using mark price (anchored to a
broader index), the exchange protects you from these single-venue
attacks.

The flip side: your liquidation price is computed against mark
price, not last price. If the perp briefly trades $200 below the
index because someone dumped a market order, you don't get
liquidated unless the MARK price (which barely moved) crossed
your liquidation threshold.

Pull the current mark + index pair from `/api/mark-prices`.
""",
            ),
            reading(
                "insurance-fund-and-adl",
                "Insurance fund and ADL",
                """
We mentioned these in the liquidation walkthrough; here's the
fuller picture.

**The insurance fund** is the exchange's cash buffer for
absorbing liquidation shortfalls. It gets fed by:
- A small fee charged on every liquidation (the "liquidation
  fee" — typically a few basis points of the closed notional).
- Any positive slippage on liquidation closes (the system
  closes at a better price than bankruptcy, the difference goes
  to the fund).

The fund pays out when:
- A liquidation closes at a WORSE price than bankruptcy.
  Counterparty still gets paid in full; the fund covers the
  difference.

A healthy insurance fund is the exchange's main defence against
needing to socialise losses. On HelloTrade staging, you can
inspect the current fund balance via a public endpoint (we'll
look at this in the REST chapter).

**Auto-deleveraging (ADL)** is the last-resort mechanism. If the
insurance fund is empty and a liquidation can't be cleared,
the exchange picks profitable counterparties on the other side
of the market and force-closes a fraction of their positions
to make the books balance.

ADL ranking is usually: highest leverage first, then highest
unrealized PnL. The intuition: someone running 50x with a 200%
unrealized profit is the closest to "house money" — losing some
of it stings less than haircutting a conservative position.

Some clients let you display your current ADL queue position so
you know where you stand. On HelloTrade, this comes through as
an account event you can subscribe to via WebSocket.
""",
            ),
            reading(
                "a-losing-trade-walkthrough",
                "A losing trade, step by step",
                """
Putting it all together. You open a 5x long on ETH-PERP.

- Entry: $3,300
- Size: 1 ETH
- Notional: $3,300
- Leverage: 5x
- Initial margin posted: $660
- Maintenance margin: $330 (50% of initial)
- Liquidation price (before fees + funding): roughly $2,970

What happens over the next 12 hours:

**Hour 0**: Position opens. Account equity = $660.

**Hour 4**: ETH drops to $3,200. Unrealized PnL = −$100.
Equity = $560. Still well above maintenance.

**Hour 8**: First funding tick. Funding rate is +0.012% (longs
pay shorts; market is leaning long). You pay $3,200 × 0.00012 =
$0.38. Negligible by itself, but it adds up.

**Hour 10**: ETH drops further to $3,050. Unrealized PnL = −$250.
Equity = $410. Close to maintenance.

**Hour 11**: ETH spikes down to $2,970 on a market sell wave.
**Mark price** rises from $2,970 to $2,975 because the index
anchored to other exchanges hasn't fallen as much. Mark price
is what triggers liquidation, and at $2,975 your equity is
still $325 — JUST below the $330 maintenance threshold.

**Liquidation fires.** The engine market-sells your 1 ETH at
$2,968 (a hair below mark, because the book had thin asks
above). Closed PnL = −$332. Liquidation fee = $5 charged. Your
$660 margin returns approximately $323.

**Hour 12**: ETH bounces back to $3,250. You missed it.

Lessons:
- Mark price (not last price) is what matters for survival.
- A 10% adverse move was enough to liquidate a 5x position.
- The liquidation engine paid out roughly half your initial
  margin — high leverage trades with thin stops can wipe quickly.
""",
            ),
            quiz(
                "risk-quiz",
                "Checkpoint: risk and margin",
                "These concepts decide whether you survive a bad trade.",
                [
                    short_answer(
                        "If your initial margin requirement is 10% of notional and your maintenance margin is 5% of notional, what leverage are you running?",
                        ["10x", "10", "10X"],
                        "Initial margin is 1/leverage of notional. 10% = 1/10 = 10x.",
                    ),
                    mcq(
                        "Which price does HelloTrade use to trigger liquidations?",
                        [
                            "Last trade price on HelloTrade",
                            "Index price (external average)",
                            "Mark price (smoothed blend, anchored to the index)",
                            "Whichever of the three is highest",
                        ],
                        2,
                        "Mark price is the manipulation-resistant choice. Pure last price would expose traders to single-venue spikes.",
                    ),
                    mcq(
                        "Funding rates exist primarily to:",
                        [
                            "Generate revenue for the exchange",
                            "Compensate market makers for liquidity",
                            "Anchor the perp price to the spot price",
                            "Discourage high-leverage trading",
                        ],
                        2,
                        "When perp > spot, longs pay shorts (encouraging shorts). When perp < spot, shorts pay longs. The economic pressure pulls the perp back to spot.",
                    ),
                    short_answer(
                        "Last-resort mechanism that haircuts profitable traders' positions when the insurance fund can't cover a liquidation:",
                        ["ADL", "auto-deleveraging", "auto deleveraging", "adl"],
                        "Auto-deleveraging. Rare but real — a tail risk to be aware of in extreme moves.",
                    ),
                ],
            ),
        ],
    }
)

# ── Chapter 4: Crypto signatures crash course ─────────────────────

CHAPTERS.append(
    {
        "id": "signatures",
        "title": "Crypto signatures crash course",
        "lessons": [
            reading(
                "why-gasless-needs-signatures",
                "Why gasless trading needs signatures",
                """
HelloTrade is gasless because trades happen off-chain. But the
exchange still needs to know that YOU authorized each order —
otherwise anyone with your account address could place orders
on your behalf.

The solution: every operation that affects your account is a
**signed message**. You compute the message contents, sign it
with your wallet's private key, and send the signature alongside
the request. The exchange verifies the signature against your
public address. Match → it's really you. Mismatch → rejected.

This is the same cryptographic primitive Ethereum uses to
authorize on-chain transactions — except instead of broadcasting
the signed message to a blockchain (and paying gas), you send it
to HelloTrade's matching engine.

Two signature standards are in play:
- **EIP-191**: signs an arbitrary string. Used for simple things
  like authentication and mass-cancel where the payload doesn't
  need a structured schema.
- **EIP-712**: signs a structured object with a typed schema.
  Used for orders, deposits, and withdrawals — the types lock
  the meaning of each field so a malicious frontend can't trick
  you into signing something different from what your wallet
  shows.

The next few lessons unpack each one.
""",
            ),
            reading(
                "eip-191",
                "EIP-191: simple message signing",
                """
EIP-191 is the older, simpler standard. The wallet prepends a
fixed prefix to your message and signs the keccak256 hash:

```
"\\x19Ethereum Signed Message:\\n" + len(message) + message
```

The prefix prevents the signed message from being valid as a
transaction — an attacker can't trick you into signing what
looks like a chat message but is actually a transfer payload.

For HelloTrade authentication, the message is a simple format:

```
${walletAddress}:${nonce}
```

Example:
```
0xa1B2c3D4E5F60718293A4b5C6D7E8f9012345678:1730812345000
```

Your wallet pops up "Sign this message" with the plain text
visible. You sign; the exchange verifies the signature recovers
your address; you're authenticated.

In TypeScript with ethers.js:

```js
const nonce = Date.now();
const message = `${walletAddress}:${nonce}`;
const signature = await signer.signMessage(message);
```

That's it. The `signMessage` call handles the prefix + hashing
internally. Send `{ signature, payload: encodedPayload }` and
the exchange does the inverse.
""",
            ),
            reading(
                "eip-712",
                "EIP-712: typed structured signing",
                """
EIP-191 is fine for "I'm me" but loses its grip when you're
signing complex payloads. If the message is just a hash, your
wallet shows a meaningless hex blob — and a malicious frontend
could swap the bytes for a different action.

**EIP-712** fixes this by signing a TYPED structure. The wallet
shows a human-readable view of every field:

```
Place Order
─────────────
account:  0xa1B2…5678
market:   8 (BTC-PERP)
size:     0.0500
price:    66400.00
nonce:    1730812345000
deadline: 1733404345000
```

The signing process:

1. **Domain** is defined once — a struct with the verifying
   contract address, chain id, app name, version. Locks the
   signature to a specific exchange instance.
2. **Types** are declared as a schema. Each field has a name and
   a Solidity type (`address`, `uint32`, `int256`, `uint256`).
3. **Message** is the actual struct value.
4. The wallet computes the EIP-712 hash and signs it. The user
   sees the readable struct, not the hash.

In ethers.js:

```js
const domain = {
  name: "HelloTrade Vault",
  version: "1",
  chainId: 8453,
  verifyingContract: "0xVAULT_ADDRESS",
};

const types = {
  Order: [
    { name: "account",    type: "address" },
    { name: "market",     type: "uint32"  },
    { name: "size",       type: "int256"  },
    { name: "limitPrice", type: "uint256" },
    { name: "nonce",      type: "uint256" },
    { name: "deadline",   type: "uint256" },
    { name: "flags",      type: "uint256" },
  ],
};

const order = { account, market: 8, size, limitPrice, nonce, deadline, flags };
const signature = await signer._signTypedData(domain, types, order);
```

The exchange independently reconstructs the domain + struct,
verifies the signature, and accepts or rejects.
""",
            ),
            trade_lesson(
                "sign-your-first-message",
                "Sign your first message",
                """
You'll do this for real later. For now, let's just look at the
**shape** of an authentication payload using the API tester.

In the **WebSocket** tab, click **Authenticate session** in the
sidebar. The URL pre-fills `{{wsUrl}}` and the message body
shows:

```json
{
  "type": "authenticate",
  "signature": {
    "sig": "<eip191-sig>",
    "payload": "<hex-payload>"
  }
}
```

That's the contract: every authenticated WS message has a
`signature` object with two fields. `sig` is the hex output of
`signer.signMessage(...)`. `payload` is the hex-encoded payload
the signature was computed over (the exchange recomputes the
hash from this payload to verify).

Hit **Connect**. The dock fakes a server response since neither
`sig` nor `payload` is real:

```json
{
  "type": "authenticate.error",
  "code": "INVALID_SIGNATURE",
  "message": "Mock mode can't verify a real wallet signature…"
}
```

The error is the point — you've sent a structurally correct
authenticate frame, the server validated the shape and rejected
on the missing real signature. In a real client you'd derive
`sig` from your wallet (via ethers / viem / wagmi) before
sending.

Toggle **Live mode** off if you flipped it; mock mode is fine
for everything in this chapter.
""",
            ),
            reading(
                "nonces-and-deadlines",
                "Nonces and deadlines: replay protection",
                """
Cryptographic signatures are deterministic — sign the same
message twice, get the same signature. Without protection, an
attacker who captured your "buy 1 BTC at $67,000" signature
could replay it tomorrow when BTC is at $50,000 and you'd be
forced into a terrible trade.

Two mechanisms fix this:

**Nonce** is a unique number per signature. The exchange tracks
which nonces it's seen for your account; once consumed, that
nonce can never be reused. Standard practice on HelloTrade is
to use `Date.now()` (epoch milliseconds) — guaranteed unique
within reasonable concurrency, doesn't require persisting state.

**Deadline** is a timestamp after which the signature is no
longer valid. Even if no nonce is set, an attacker who replays
a stale signature past the deadline gets nothing.

Together they bound the validity window: signature is valid IFF
nonce is fresh AND now < deadline.

For order signatures, deadlines are usually tight — minutes to
a few hours. For deposits / withdrawals, deadlines can be days.
For session auth, deadlines are typically session-length (e.g.
24 hours).

What you need to remember:
- **Always** include a nonce + deadline.
- Use `Date.now()` for nonces unless you have a reason not to.
- Set deadlines as tight as your operation tolerates.

We'll cover the platform's rate limits in the next chapter; they
work hand-in-hand with nonces to limit replay damage.
""",
            ),
            reading(
                "erc-2612-permits",
                "ERC-2612 permits (gasless deposits)",
                """
Depositing USDC into HelloTrade traditionally takes two
transactions:

1. `approve()` the vault contract to pull USDC from your wallet.
   Costs gas.
2. `deposit()` calls the vault, which then `transferFrom()`s
   the approved USDC. Also costs gas.

That's two on-chain transactions for one logical action.

**ERC-2612 permits** collapse this into ONE. ERC-2612 is an
extension to the ERC-20 standard that adds a `permit()` function
accepting a SIGNED approval. Instead of calling `approve()` from
your wallet (paying gas), you sign an EIP-712 `Permit` struct
and pass the signature to the deposit function. The deposit
function calls `permit()` (which uses your signature to set the
allowance) and then `transferFrom()` in the same transaction.

The signed `Permit` struct:

```ts
{
  owner:    "0xYOUR_WALLET",
  spender:  "0xVAULT_ADDRESS",
  value:    "1000000000",          // 1000 USDC (6 decimals)
  nonce:    permitNonce,             // ERC-20 contract's nonce, NOT yours
  deadline: ts + 86400               // 24 hours
}
```

The HelloTrade deposit endpoint accepts this signature and
handles the entire flow on its side. From your wallet's POV:
one signature, no transactions, no gas. The exchange pays the
gas for the actual on-chain call (and recovers it from your
deposit volume, presumably).

USDC, USDT, DAI, and most modern stablecoins all support ERC-2612.
""",
            ),
            quiz(
                "signatures-quiz",
                "Checkpoint: signatures",
                "Lock these in before we drive the API for real.",
                [
                    mcq(
                        "Why does EIP-712 exist when we already have EIP-191?",
                        [
                            "EIP-712 signatures are smaller on the wire",
                            "EIP-712 lets the wallet display a typed, human-readable view of what you're signing",
                            "EIP-712 doesn't require a chain id",
                            "EIP-191 is being deprecated",
                        ],
                        1,
                        "EIP-712's typed schema means the wallet shows fields by name and value — no hex blob, no risk of signing something different from what was displayed.",
                    ),
                    mcq(
                        "What two values protect a signature against replay attacks?",
                        [
                            "Public key + private key",
                            "Nonce + deadline",
                            "Domain + chain id",
                            "Account + signature",
                        ],
                        1,
                        "Nonce ensures uniqueness; deadline bounds the validity window. Both together are the defence-in-depth.",
                    ),
                    short_answer(
                        "What ERC standard collapses approve+deposit into a single signed permit?",
                        ["erc-2612", "ERC-2612", "erc 2612", "2612", "erc2612"],
                        "ERC-2612. The classic example of \"on-chain feature that reduces UX friction in DeFi.\"",
                    ),
                    mcq(
                        "On HelloTrade, what's the standard way to generate a nonce?",
                        [
                            "Random 256-bit integer",
                            "Sequential counter persisted to disk",
                            "Date.now() — epoch milliseconds",
                            "Hash of the previous signature",
                        ],
                        2,
                        "Date.now() is unique enough at single-client concurrency, doesn't require persisted state, and is monotonically increasing so the server can spot replays cheaply.",
                    ),
                ],
            ),
        ],
    }
)

# ── Chapter 5: Market data over WebSocket ─────────────────────────

CHAPTERS.append(
    {
        "id": "market-data",
        "title": "Market data over WebSocket",
        "lessons": [
            reading(
                "websocket-101",
                "WebSocket 101",
                """
A **WebSocket** is a persistent bidirectional connection between
client and server. Open one, and either side can push messages
at any time — no polling, no request/response cycle.

The protocol upgrade looks like a regular HTTP request that asks
the server to switch protocols:

```
GET /marketdata HTTP/1.1
Host: api.staging.hello.trade
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: …
Sec-WebSocket-Version: 13
```

Server responds:

```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: …
```

After that, the connection is a duplex stream of "frames" —
typically text (UTF-8 strings, often JSON) but binary is supported.

In the browser:

```js
const ws = new WebSocket("wss://api.staging.hello.trade/marketdata?token=…");
ws.addEventListener("open",    ()  => console.log("connected"));
ws.addEventListener("message", (e) => console.log("got:", e.data));
ws.addEventListener("close",   ()  => console.log("disconnected"));
ws.addEventListener("error",   (e) => console.error("WS error:", e));
```

To send: `ws.send(JSON.stringify({ type: "subscribe", channel: "lightTickers" }))`.

You'll be doing exactly this in the API tester for the rest of
this chapter.

A few pragmatic things to know:
- Connections drop. Idle proxies, mobile network changes, server
  restarts. Plan for a **reconnect-with-backoff** loop in production.
- Servers often send periodic **ping** frames to keep proxies
  from killing the connection. Reply with **pong** (the browser's
  WebSocket implementation usually handles this transparently).
- WebSocket frames are NOT request/response — there's no built-in
  way to correlate a response with a specific request. If you
  need that, include an id in your sent message and have the
  server echo it back.
""",
            ),
            trade_lesson(
                "subscribe-tickers",
                "Subscribe to live tickers",
                """
In the API tester above, switch to the **WebSocket** tab and
click **Live tickers** in the sidebar.

The URL bar fills with the public market-data endpoint:

```
wss://api.staging.hello.trade/marketdata?token=…
```

(That `token` is a public exchange identifier — not a secret.
It's hardcoded in the env panel as `marketDataToken`.)

The send box shows the subscribe message:

```json
{ "type": "subscribe", "channel": "lightTickers" }
```

Click **Connect**. The mock layer simulates the real server:

1. A `welcome` frame arrives confirming the connection.
2. Your subscribe frame echoes outbound (purple ←/→ marker).
3. A `subscribed` frame confirms.
4. A `tickers` payload arrives with the current state of every
   market.

The shape of the inbound `tickers` payload — `s` (symbol),
`p` (last price), `v` (24h volume) — is intentionally compact.
Light tickers are the "hot" path; the exchange compresses field
names to save bandwidth on a stream that fires many times per
second on busy markets.

Try clicking **Live mode** in the dock header and reconnecting
to see the actual production ticker feed. You'll get hundreds
of frames per second on a busy day.
""",
            ),
            trade_lesson(
                "reading-the-orderbook",
                "Reading the order book stream",
                """
Click **Order book (BTC-PERP)** in the WebSocket sidebar. The
subscribe message:

```json
{
  "type": "subscribe",
  "channel": "partialOrderBook",
  "market": "BTC-PERP",
  "depth": 10
}
```

Connect. Two kinds of frames arrive:

- A **snapshot** with the full top-N levels of the book:

  ```json
  {
    "type": "orderbook.snapshot",
    "market": "BTC-PERP",
    "bids": [["67340.0", "0.521"], ["67339.5", "0.834"], ...],
    "asks": [["67340.5", "0.345"], ["67341.0", "0.901"], ...],
    "ts": 1730812345000
  }
  ```

- One or more **diff** frames updating individual levels:

  ```json
  {
    "type": "orderbook.diff",
    "market": "BTC-PERP",
    "bids": [["67340.0", "0.621"]],
    "asks": [["67342.5", "0"]],
    "ts": 1730812346000
  }
  ```

Diffs follow these rules:
- A non-zero size means "the new size at this price is X" (it
  could be larger or smaller than before — diffs aren't deltas).
- A zero size means "this level is now empty; remove it from
  your book."
- New price levels just appear in a diff; you insert them.

Your client maintains a local mirror of the book by applying
the snapshot, then folding each diff into it. If you ever
miss a frame, the cleanest recovery is to disconnect and let
the next snapshot rebuild your state.

We'll skip writing the actual mirror code (it's straightforward),
but watch the diff frames in the dock — you'll see the bid at
67340.0 grow from 0.521 to 0.621, and the ask at 67342.5 disappear.
""",
            ),
            trade_lesson(
                "live-trades",
                "Live trades stream",
                """
Click **Live trades (BTC-PERP)** in the sidebar. Subscribe:

```json
{ "type": "subscribe", "channel": "trades", "market": "BTC-PERP" }
```

Each inbound `trade` frame:

```json
{
  "type": "trade",
  "market": "BTC-PERP",
  "side": "BUY",
  "size": "0.0125",
  "price": "67340.5",
  "ts": 1730812345000
}
```

Three trades arrive in quick succession. Each one represents an
actual matched fill on the exchange. The `side` field reports
the AGGRESSIVE side — the order that hit the book is the side
listed. So a `BUY` trade means a buy crossed the spread to
match a resting ask; a `SELL` means a sell hit a resting bid.

This is the rawest stream of "what's happening" on the market.
You can:
- Compute volume-weighted average price (VWAP) over a window.
- Detect liquidations (large prints with no preceding order
  book activity from your subscriber).
- Trigger your strategy on tape patterns (a sudden burst of
  one-sided trades often precedes a price move).

The trades stream pairs naturally with the candles stream —
trades are the raw data from which OHLCV bars are computed.
""",
            ),
            trade_lesson(
                "candles",
                "Candles (OHLCV)",
                """
Candles are time-bucketed summaries of the trades stream. Each
candle covers an interval (1m, 5m, 1h, …) and carries:

- **Open** — first trade price in the interval.
- **High** — highest trade price.
- **Low** — lowest trade price.
- **Close** — last trade price.
- **Volume** — total quantity traded in the interval.

Candles are the standard input to charting libraries and to most
technical-analysis indicators (moving averages, RSI, MACD, etc).

Two ways to get candles on HelloTrade:

1. **Historical (REST)**: `GET /api/candles?market=BTC-PERP&interval=1m&limit=100`.
   You'll hit this in chapter 7 — it's how a chart loads its
   initial backfill on page load.
2. **Live (WebSocket)**: subscribe to the `candles` channel.
   Each new bar is published when the interval rolls; the
   current bar's running OHLCV is republished as it updates.

Click **Live candles (BTC-PERP)** in the sidebar. The subscribe
message specifies both market AND interval:

```json
{ "type": "subscribe", "channel": "candles", "market": "BTC-PERP", "interval": "1m" }
```

The first frame contains the latest 1m bar. In a real session,
new frames would arrive once per minute (or sooner if you
subscribed to a smaller interval).
""",
            ),
            reading(
                "funding-and-mark-streams",
                "Funding rates and mark prices over WS",
                """
Two more market-data channels worth knowing:

**`fundingRates`** — published every funding tick (typically
every 8 hours). The frame carries the rate that was just charged
plus the next predicted rate based on current order flow:

```json
{
  "type": "fundingRate",
  "market": "BTC-PERP",
  "rate":  "0.00012",
  "nextRate": "0.00009",
  "nextFundingMs": 1730841600000
}
```

If you're holding leveraged positions overnight, your bot should
subscribe to this and either close before adverse funding or
flip sides if the rate justifies it.

**`markPrices`** — pushed continuously as the underlying index
moves. Same shape as the REST `mark-prices` endpoint:

```json
{
  "type": "markPrice",
  "market": "BTC-PERP",
  "indexPrice": "67340.12",
  "markPrice":  "67342.85"
}
```

Why subscribe to mark when you already have the trades stream?
Two reasons:
- Mark price is what your liquidation engine watches. Knowing
  the live mark lets your client compute distance-to-liquidation
  in real time.
- During illiquid periods (e.g. weekend nights), mark price can
  move via the index even when there are no trades on the perp.
  Subscribing to mark catches those moves.

Both channels are public — no auth required.
""",
            ),
            quiz(
                "market-data-quiz",
                "Checkpoint: market data",
                "Some of this overlaps with what you saw in the dock.",
                [
                    mcq(
                        "What does a `partialOrderBook` snapshot frame contain?",
                        [
                            "Just the best bid and ask",
                            "The top N levels of bids + asks",
                            "Every level of the book",
                            "All trades in the last minute",
                        ],
                        1,
                        "`depth` controls N. The full book is too big to push on every diff; partial-book streams are the normal path.",
                    ),
                    mcq(
                        "In an order book diff frame, a price level with size = 0 means:",
                        [
                            "The level was added at zero size (a placeholder)",
                            "The level was removed from the book",
                            "An error occurred at that level",
                            "The level matched a trade at that price",
                        ],
                        1,
                        "Size 0 = remove the level. Non-zero = set the new size at that level.",
                    ),
                    short_answer(
                        "Which 5 fields make up a candle (OHLCV)? List the 5 letters.",
                        ["ohlcv", "OHLCV", "o h l c v", "open high low close volume"],
                        "Open, High, Low, Close, Volume. Standard everywhere.",
                    ),
                    mcq(
                        "Why subscribe to the markPrices stream instead of just trades?",
                        [
                            "Mark prices have lower latency than trades",
                            "The trades stream is paid; mark prices are free",
                            "Mark price is what your liquidation engine watches; the trades stream alone misses moves driven by the external index",
                            "Mark prices include liquidation fees",
                        ],
                        2,
                        "Mark = manipulation-resistant blend, anchored to the index. Your survival math should track it, not last price.",
                    ),
                ],
            ),
        ],
    }
)

# ── Chapter 6: Trading via WebSocket ──────────────────────────────

CHAPTERS.append(
    {
        "id": "trading",
        "title": "Trading via WebSocket",
        "lessons": [
            reading(
                "trading-ws-overview",
                "The trading WebSocket",
                """
Market data has a separate WebSocket from the trading WebSocket:

- `wss://api.staging.hello.trade/marketdata` — public, no auth.
- `wss://api.staging.hello.trade/ws` — private, requires an
  authenticated session.

Why two? Performance and security. The marketdata feed is
high-throughput and 99% read-only — it can scale horizontally
and serve millions of subscribers. The trading feed handles per-
account writes, has strict rate limits, and needs the full
signature-verification path on every frame.

The trading WS handshake:

1. Open the WS connection.
2. Send `{"type": "authenticate", "signature": {...}}`. The
   server verifies your EIP-191 signature.
3. Once authenticated, the server marks the connection as
   "session = X for account Y".
4. Send `{"type": "subscribeTrading"}` to start receiving
   execution reports.
5. Send order frames (place, cancel, replace, etc) as you wish.
   Each carries its own per-frame signature.

That's the whole shape. The next few lessons cover each step
hands-on in the API tester.
""",
            ),
            trade_lesson(
                "authenticating-ws",
                "Authenticating the trading WS",
                """
In the API tester's WebSocket tab, click **Authenticate session**.

The frame:

```json
{
  "type": "authenticate",
  "signature": {
    "sig": "<eip191-sig>",
    "payload": "<hex-payload>"
  }
}
```

The `payload` here is hex-encoded:

```
[1 byte type][abi.encode(SimpleSignature)]
```

Where `type` is the discriminator byte (2 for SimpleSignature)
and the `SimpleSignature` struct is:

```js
{
  account:  "0xYOUR_WALLET",
  nonce:    1730812345000,
  deadline: 1730898745000   // 24 hours later
}
```

The discriminator byte prevents one signature from being valid
across multiple operation types — even if an attacker could
trick you into signing the same hash for two different
operations, the type byte would diverge.

Click **Connect**. In mock mode you get an `INVALID_SIGNATURE`
error (we can't fake a real wallet sig). In a real client you'd
plug your wallet's `signMessage` output into `sig` and the
hex-encoded payload into `payload`.

Once authenticated, the connection holds your session for the
24-hour deadline. You can send any number of trade ops without
re-signing the auth.
""",
            ),
            trade_lesson(
                "subscribe-trading",
                "Subscribe to execution reports",
                """
Authentication only opens the door — to receive notifications
about your orders + fills, you also have to subscribe.

Click **Subscribe to execution reports**:

```json
{ "type": "subscribeTrading" }
```

Once subscribed, you start receiving server-pushed events for:

- **Order events** — `orderAccepted`, `orderFilled`,
  `orderCancelled`, `orderRejected`, etc.
- **Trade events** — every execution that involves your account.
- **Margin events** — deposits, withdrawals, leverage updates.
- **Liquidation events** — if your account ever gets liquidated,
  you'll see it here.
- **Funding events** — every funding tick that touches your
  positions, with the dollar amount paid or received.

Each event has a stable `type` field plus a payload specific to
that event. Your client should switch on `type` and route to the
right handler.

A typical bot's main loop:
1. Subscribe to market data on one connection.
2. Authenticate + subscribe to execution reports on the other.
3. Local strategy logic decides when to send orders.
4. Order confirmations come back as execution reports — update
   local state.
""",
            ),
            trade_lesson(
                "place-an-order",
                "Place a limit order",
                """
The fun one. Click **Place limit order** in the sidebar:

```json
{
  "type": "placeOrder",
  "signature": {
    "sig": "<eip712-sig>",
    "payload": "<hex-order-payload>"
  }
}
```

The `payload` is the hex-encoded `Order` struct from chapter 4
(account, market, size, limitPrice, nonce, deadline, flags) with
the type discriminator byte 0 prepended.

A few details on the fields:
- **`size`** is a signed integer. Positive = long (buy);
  negative = short (sell). Note the units: `int256` raw integer
  scaled to the market's `baseDecimals` from the instruments
  endpoint. For BTC-PERP (baseDecimals = 8), `1.0 BTC = 100000000`.
- **`limitPrice`** is `uint256` scaled to `quoteDecimals`. For
  BTC-PERP (quoteDecimals = 6), `$67000.00 = 67000000000`.
- **`flags`** is a bit-packed integer holding TIF + STP + post-only
  + reduce-only + other modifiers. Each flag has its own bit
  position; see the docs for the canonical layout.

For mock mode, the connect button + auto-send shows the wire
shape but the server rejects (no real sig). The contract you
just built — `type` + `signature.payload` + `signature.sig` —
is exactly what your real bot would emit.

Sanity check before signing in production:
- nonce is unique
- deadline is in the future
- size + price are scaled to the right decimals
- account matches the authenticated session
""",
            ),
            trade_lesson(
                "cancel-and-replace",
                "Cancel and replace orders",
                """
Two more order ops. Click **Cancel order** in the sidebar:

```json
{
  "type": "cancelOrder",
  "signature": {
    "sig": "<eip712-sig>",
    "payload": "<hex-cancel-payload>"
  }
}
```

The `OrderCancel` struct (discriminator byte 1):

```ts
{
  account:  "0xYOUR_WALLET",
  orderId:  "ord_8FQp2",          // returned in the orderAccepted event
  nonce:    Date.now(),
  deadline: ts + 60                // tight — cancel should be fast
}
```

A successful cancel bounces back as an `orderCancelled`
execution report. If the order had partially filled before the
cancel landed, the partial fill stays — only the unfilled
remainder is cancelled.

**Replace** is a logical "modify": cancel the existing order +
place a new one in a single signed atomic op. Useful when you're
adjusting price on a resting limit and don't want a window where
neither order is live.

The replace shape isn't a separate frame type on HelloTrade —
it's a `placeOrder` with a `replaceOrderId` field set. The
matching engine cancels the named order and replaces it with the
new one in one atomic step.

```js
{
  type: "placeOrder",
  signature: { sig, payload }, // standard place sig
  replaceOrderId: "ord_8FQp2",
}
```

For high-frequency strategies (market makers especially),
replaces are the workhorse — your quotes update on every order
book tick.
""",
            ),
            reading(
                "execution-reports",
                "Reading execution reports",
                """
Once you've subscribed to trading events, you'll see frames flow
in for every change to your orders + positions. The shapes you'll
encounter most often:

**`orderAccepted`** — the engine accepted your order:

```json
{
  "type":   "orderAccepted",
  "orderId": "ord_8FQp2",
  "market":  "BTC-PERP",
  "side":    "BUY",
  "size":    "0.0100",
  "price":   "66400.00",
  "ts":      1730812345000
}
```

**`orderFilled`** — full or partial fill:

```json
{
  "type":      "orderFilled",
  "orderId":   "ord_8FQp2",
  "fillSize":  "0.0050",
  "fillPrice": "66401.50",
  "remaining": "0.0050",
  "ts":        1730812346000
}
```

If `remaining` is "0", the order is fully done. Otherwise it
stays on the book.

**`orderRejected`** — the engine refused:

```json
{
  "type":   "orderRejected",
  "code":   "PRICE_TOO_FAR_FROM_MARK",
  "message": "Limit price 100000.00 is more than 5% from mark 67340.50"
}
```

Common rejection codes: `INSUFFICIENT_MARGIN`,
`INVALID_PRICE` (off-tick), `INVALID_NONCE`,
`SIGNATURE_EXPIRED`, `MARKET_CLOSED`.

**`positionUpdate`** — your net position changed:

```json
{
  "type":         "positionUpdate",
  "market":       "BTC-PERP",
  "size":         "0.0100",
  "avgEntry":     "66400.00",
  "leverage":     10,
  "unrealizedPnl": "12.50"
}
```

Your client's "is my order live?" / "what's my P&L?" UI is
entirely driven by these frames. Keep a local order/position
state mirror updated from them; never poll REST in a hot loop
for state you can subscribe to.
""",
            ),
            trade_lesson(
                "market-maker-sketch",
                "Sketch: a tiny market maker",
                """
Putting the chapter together — the architecture of a simple
market-making bot:

```
┌────────────────────┐         ┌──────────────────┐
│ marketdata WS      │ ─────→  │ Local orderbook  │
│  partialOrderBook  │         │   mirror         │
└────────────────────┘         └────────┬─────────┘
                                        │
                                        ▼
                               ┌──────────────────┐
                               │ Quote calculator │
                               │ (top of book ±   │
                               │  spread / 2)     │
                               └────────┬─────────┘
                                        │ desired bid + ask
                                        ▼
┌────────────────────┐         ┌──────────────────┐
│ trading WS         │ ←─────  │ Order placement  │
│  authenticate      │         │ logic — replace  │
│  placeOrder        │         │ orders when      │
│  cancelOrder       │ ─────→  │ desired ≠ live   │
└─────────┬──────────┘         └──────────────────┘
          │
          ▼
┌────────────────────┐
│ Execution reports  │
│  → update local    │
│    order state     │
└────────────────────┘
```

What you'd write to actually deploy this:

1. **Two WS connections.** marketdata for the book, trading for
   your orders.
2. **Local book mirror.** Apply snapshots + diffs as we covered
   in chapter 5.
3. **Quote logic.** "I want a bid 5 ticks below the best bid and
   an ask 5 ticks above the best ask, each sized at 0.01 BTC."
4. **State diff.** Compare desired quotes with currently-live
   orders. If desired != live, send a replace.
5. **Risk guards.** Stop quoting if your inventory crosses a
   threshold. Pause on funding announcements. Bail on
   high-volatility windows.
6. **Reconnect logic.** Both sockets need backoff retry; trading
   WS needs to re-authenticate after reconnect.

This isn't actually a profitable strategy without real edge —
market making is hard and you'd lose money against actual flow.
But the SHAPE is the universal market-maker shape. Real strategies
build on top of this scaffold with smarter quote-pricing,
inventory management, and adverse-selection protection.
""",
            ),
            quiz(
                "trading-quiz",
                "Checkpoint: trading flow",
                "Last quiz before REST.",
                [
                    mcq(
                        "What's the order of operations to start trading on the WebSocket?",
                        [
                            "Subscribe → Authenticate → Place order",
                            "Place order → Authenticate → Subscribe",
                            "Authenticate → Subscribe → Place order",
                            "Connect → Place order (no auth needed for staging)",
                        ],
                        2,
                        "Connect → authenticate → subscribeTrading → then send order frames. The auth establishes the session, the subscribe opens the execution-report channel.",
                    ),
                    mcq(
                        "An `orderFilled` event reports `fillSize: 0.0050, remaining: 0.0050`. Your order:",
                        [
                            "Is fully done; no further fills will arrive",
                            "Was rejected and never matched",
                            "Has half-filled and is still resting on the book for the remainder",
                            "Was modified to a smaller size",
                        ],
                        2,
                        "remaining > 0 means the order is still live. Another fill or your cancel will close it out.",
                    ),
                    short_answer(
                        "What field do you set in a `placeOrder` to atomically swap an existing order for a new one?",
                        ["replaceOrderId", "replaceOrderID", "replaceorderid"],
                        "`replaceOrderId`. The engine cancels + replaces in a single signed op — no \"no order live\" gap.",
                    ),
                    mcq(
                        "If the trading WS disconnects, what should your client do?",
                        [
                            "Wait for the server to reconnect you",
                            "Reconnect with backoff, re-authenticate, and re-subscribe to trading",
                            "Switch to REST polling permanently",
                            "Cancel all orders via REST then start fresh",
                        ],
                        1,
                        "Auth and subscriptions are per-connection. The server doesn't remember your session across reconnects.",
                    ),
                ],
            ),
        ],
    }
)

# ── Chapter 7: REST API + capstone ────────────────────────────────

CHAPTERS.append(
    {
        "id": "rest-and-capstone",
        "title": "REST API and a capstone",
        "lessons": [
            reading(
                "rest-vs-ws",
                "When to use REST instead of WebSocket",
                """
Most live data on HelloTrade comes over WebSocket — it's faster
and more efficient for high-frequency updates. So why does the
REST API exist at all?

REST shines for:

- **One-shot lookups.** "What instruments exist?" "What are the
  current funding rates?" Those are GET requests you call once
  on startup, not subscriptions.
- **Historical data.** Backfill the last 100 candles before your
  WebSocket starts streaming new ones. Pull historical funding
  rates to compute carry estimates.
- **Account state at a point in time.** If you just want a
  current balance + position snapshot without subscribing to
  the stream, REST is simpler.
- **Mutations that need atomicity.** Deposit and withdraw are
  REST POSTs because they involve on-chain transfers; the
  request/response cycle maps cleanly.

Rule of thumb:
- **Read once → REST.**
- **Read continuously → WebSocket.**
- **Write → REST or WS depending on the operation.** Trading
  ops go via WS for low latency. Margin ops go via REST.

The next two lessons cover the public + authenticated REST
endpoints in turn.
""",
            ),
            trade_lesson(
                "rest-public-endpoints",
                "Public REST endpoints",
                """
Switch the API tester to the **REST** tab. Several public
endpoints in the sidebar need no signature:

**`GET /api/instruments`** — every tradable market with its
metadata. This is what your client hits on startup to populate
its trading dropdown:

```json
[
  { "symbol": "BTC-PERP", "type": "PERP", "tickSize": "0.5",
    "lotSize": "0.0001", "maxLeverage": 50, "isActive": true },
  …
]
```

**`GET /api/markets`** — numeric market ids and decimal places.
Your order signatures need the numeric `market` field; this is
where you map from symbol to id:

```json
[
  { "id": 8, "symbol": "BTC-PERP", "baseDecimals": 8, "quoteDecimals": 6 },
  …
]
```

**`GET /api/tickers`** — last price + 24h stats for every market.
Use this for a market-overview UI on first paint:

```json
[
  { "symbol": "BTC-PERP", "last": "67342.50",
    "change24h": "+1.84%", "volume24h": "8421.5", … },
  …
]
```

**`GET /api/candles?market=BTC-PERP&interval=1m&limit=100`** —
historical OHLCV. The query params control which market and
how many bars back. Try changing the `interval` to `1h` or the
`limit` to 200 and re-sending.

**`GET /api/funding-rates?market=BTC-PERP&limit=24`** — last 24
hours of hourly funding marks. Useful for carry calculations
or showing a funding history chart.

Click around. Each one returns canned-but-realistic JSON in
mock mode; toggle Live mode for real numbers.
""",
            ),
            trade_lesson(
                "rest-account-snapshot",
                "Account snapshot via REST",
                """
The first authenticated endpoint. Click **Account snapshot** in
the sidebar:

```
GET {{baseUrl}}/api/account
```

In real production:
- The request needs an `X-Signature` header carrying your
  EIP-191 signature.
- An `X-Payload` header carries the hex-encoded
  SimpleSignaturePayload.

In mock mode you'll get a 401 because we can't fake a real sig.
Toggle Live mode if you've got a wallet hooked up; otherwise
look at the response as a contract example.

The expected 200 response (visible in the mock layer's
"successful" branch when sigs check out):

```json
{
  "account": "0xa1B2c3D4E5F60718…",
  "collateral": {
    "asset": "USDC",
    "balance":   "12450.000000",
    "available": "8200.500000"
  },
  "positions": [
    {
      "market":       "BTC-PERP",
      "size":         "0.0500",
      "entryPrice":   "66400.00",
      "markPrice":    "67342.85",
      "unrealizedPnl": "+47.14",
      "leverage":      10
    }
  ],
  "openOrders": [
    {
      "orderId":   "ord_8FQp2",
      "market":    "BTC-PERP",
      "side":      "BUY",
      "type":      "LIMIT",
      "size":      "0.0100",
      "price":     "66000.00",
      "filled":    "0.0000",
      "status":    "OPEN"
    }
  ]
}
```

That's enough to fully populate your client's home screen on
boot — balance, positions, open orders, all from one call.
After this snapshot, you'd switch to the WebSocket execution-
reports stream for live updates.
""",
            ),
            trade_lesson(
                "rest-deposit",
                "Depositing USDC",
                """
**Click `Deposit USDC` in the sidebar.** Method is POST, URL is
`{{baseUrl}}/api/deposit`, body is a JSON object with a permit-
based signature.

```json
{
  "account":  "0xYOUR_WALLET",
  "amount":   "1000000000",       // 1000 USDC (6 decimals)
  "nonce":    1,                   // ERC-20 contract nonce
  "deadline": 1733404345,          // unix seconds
  "signature": {
    "sig":     "<eip712-sig>",
    "payload": "<hex-permit-payload>"
  }
}
```

The signature is over an EIP-712 `Permit` struct (chapter 4
covered this). The exchange's deposit handler:

1. Verifies your sig matches the permit struct.
2. Calls `permit()` on the USDC contract to set its allowance.
3. Calls `transferFrom()` to pull the USDC into the vault.
4. Credits your HelloTrade collateral balance.

All of those happen in ONE on-chain transaction, paid by the
exchange. From your wallet's POV: one signature, no gas.

In mock mode, sending the request returns a `201 Created`:

```json
{
  "depositId": "dep_a1b2c3d4",
  "status":    "pending",
  "receivedAt": "2026-05-09T13:30:00.000Z"
}
```

The `pending` status indicates the on-chain settlement is in
flight. A subsequent `WebSocket margin event` (subscribed via
trading WS) will fire `marginCredited` once the chain confirms.
Time-to-confirm depends on the chain (typically a few seconds
on a high-throughput L2).
""",
            ),
            trade_lesson(
                "rest-withdraw",
                "Withdrawing USDC",
                """
The mirror operation. Click **Withdraw USDC**:

```
POST {{baseUrl}}/api/withdraw
```

Body:

```json
{
  "account":  "0xYOUR_WALLET",
  "amount":   "500000000",         // 500 USDC
  "nonce":    Date.now(),
  "deadline": ts + 86400,
  "signature": {
    "sig":     "<eip712-sig>",
    "payload": "<hex-withdraw-payload>"
  }
}
```

The signature is over an EIP-712 `Withdrawal` struct
(discriminator byte 3) — this is YOUR signature authorising
the exchange to release funds to your wallet.

Important: withdrawal authorisations have a **deadline** that
gates how long they're valid. Once you sign, the exchange has
until the deadline to process. After that, your sig is dead and
you'd need to re-sign. This protects you against the exchange
sitting on your withdrawal indefinitely while attempting to
front-run your other actions.

Mock response:

```json
{
  "withdrawalId":         "wd_e5f6g7h8",
  "status":               "queued",
  "estimatedSettlementMs": 2400
}
```

`status: queued` means the off-chain processing started; a
`marginDebited` event over the trading WS confirms the
collateral debit. Then a follow-up event when the on-chain
transfer to your wallet settles.

Withdrawals can be larger than your `available` balance only if
they wouldn't liquidate any open positions. The exchange checks
maintenance margin before approving — if withdrawing would push
you below it, you get a `WITHDRAWAL_BLOCKED_BY_MARGIN` error.
""",
            ),
            reading(
                "error-codes-and-retries",
                "Error codes, rate limits, and retries",
                """
Every endpoint can fail. Knowing how each error means + what to
do about it is the difference between a robust client and one
that hangs at 3am.

Common errors and recommended responses:

- **`401 INVALID_SIGNATURE`** — your signature didn't verify.
  Check your nonce isn't reused, the deadline isn't past, the
  domain matches the environment (staging vs production), and
  the struct fields match what you signed.
- **`429 RATE_LIMITED`** — slow down. Wait at least the
  `Retry-After` header's value before retrying. The platform
  enforces per-account rate caps; bursting through them gets
  your IP cooled off.
- **`422 INVALID_NONCE`** — the nonce was already used or is in
  the past. Use `Date.now()` and ensure each request gets a
  fresh value.
- **`410 SIGNATURE_EXPIRED`** — deadline passed. Re-sign with a
  fresh deadline.
- **`403 INSUFFICIENT_MARGIN`** — your collateral doesn't cover
  the requested operation. Add margin, reduce size, or close
  other positions.
- **`5xx`** — server side. Retry with exponential backoff. If
  the operation was idempotent (GETs always are; some POSTs are
  marked idempotent in the docs), it's safe to retry blindly.
  For non-idempotent POSTs (placeOrder, deposit), check the
  account state via REST before retrying to avoid duplicates.

A retry policy that works in practice:
- Initial backoff: 100ms
- Max attempts: 5
- Backoff multiplier: 2x with ±20% jitter
- Hard cap: 30s
- For 4xx errors, DON'T retry — the request is broken; fix it
  and try again manually.
- For 5xx and network errors, retry per the policy above.

Don't blindly retry on 401/422/410 — those mean your client
state is stale (nonce reused, deadline expired). Refresh the
state first.
""",
            ),
            trade_lesson(
                "capstone-a-complete-client",
                "Capstone: a complete client",
                """
This is the architecture of a complete HelloTrade client. Below
is what the bootstrapping flow looks like. Use the API tester
to verify each step.

**On startup (REST):**

1. `GET /api/instruments` — populate market dropdown.
2. `GET /api/markets` — get numeric market ids for order sigs.
3. `GET /api/tickers` — first paint of the market overview.
4. `GET /api/candles?market=DEFAULT&limit=200` — backfill chart.
5. `GET /api/account` (signed) — load balance + positions +
   open orders.

**Then, two WebSockets:**

6. Connect to `/marketdata` (no auth):
   - `subscribe lightTickers` for the market overview.
   - `subscribe partialOrderBook` for the active market's book.
   - `subscribe trades` for the tape.
   - `subscribe candles` for live bars.
7. Connect to `/ws` (auth required):
   - `authenticate` with EIP-191 sig.
   - `subscribeTrading` for execution reports.

**Then, normal operation:**

- User clicks Buy → sign EIP-712 Order, send via trading WS.
- Receive `orderAccepted` → mark order as live in local state.
- Receive `orderFilled` → update position; if fully filled,
  remove from open-orders list.
- Periodically receive `fundingPaid` events and adjust P&L.

**On disconnect (either WS):**

- Mark connection state.
- Reconnect with exponential backoff (start at 250ms, cap at 10s).
- On marketdata: re-subscribe to all channels you had open.
- On trading: re-authenticate (your previous session is dead),
  then re-subscribe.

**On error:**

- 401/422/410 → re-derive your nonce / re-sign / re-auth as
  appropriate. Never retry the same request.
- 429 → backoff per Retry-After.
- 5xx → exponential backoff retry.

That's the complete shape. From here, the differentiation
between clients is in:
- **UI** — chart, order entry, portfolio view.
- **Strategy** — manual UI vs. automated bot vs. market maker.
- **Risk management** — pre-trade size limits, post-trade
  position limits, kill switches.

Spend a few minutes hitting each of the bootstrapping endpoints
in the dock above. The shapes you've seen across all 7 chapters
are the entire surface area you need to build a real client on
HelloTrade.
""",
            ),
            reading(
                "where-to-go-next",
                "Where to go next",
                """
You now know enough to:

- Read and contribute to a HelloTrade client codebase.
- Build a market-data dashboard with the public WS feed.
- Authenticate with a wallet and place / cancel signed orders.
- Compute liquidation prices, funding accruals, and unrealized
  P&L from raw market data.
- Recover from disconnects, signature expirations, and rate-limit
  bumps.

Some places to point yourself next:

**The official SDK.** As of writing, HelloTrade is shipping an
official client SDK that wraps signature creation, payload
encoding, and the WebSocket reconnect loop. When it lands, much
of what you hand-rolled in chapter 4-6 becomes a one-line call.
Keep an eye on the `developer-tools/sdk` page in the docs.

**The reference implementation.** The HelloTrade docs include
TypeScript snippets for every operation in this course. Pull
them into a small project and wire up a real wallet (testnet
USDC is plenty for learning).

**Open-source clients.** Search "hellotrade" on GitHub for
community implementations in TypeScript, Python, and Rust.
Reading existing code is the fastest way to internalise the
patterns.

**Testnet faucets.** Don't trade real money learning. Use the
staging environment at `*.staging.hello.trade` with testnet
USDC. The exchange's docs list current faucet links.

**Risk discipline.** None of this course is investment advice.
Leverage cuts both ways and decentralised exchanges have
liquidation engines that don't pause for your bad day. Start
small, paper-trade a strategy before deploying capital, and
cap your downside per trade to a percentage of your account
you can lose without it changing your mood.

Good luck. You've got the tools.
""",
            ),
        ],
    }
)

# ────────────────────────────────────────────────────────────────────
# Assemble + write
# ────────────────────────────────────────────────────────────────────


COURSE: dict[str, Any] = {
    "id": "hellotrade",
    "title": "HelloTrade: Trading the Decentralized Way",
    "author": "Libre · scraped from hellotrade.gitbook.io",
    "description": (
        "A guided tour of the HelloTrade decentralized perpetuals "
        "exchange. Covers the trading concepts (perps, leverage, "
        "liquidation, funding), the cryptographic signature scheme "
        "(EIP-191 / EIP-712 / ERC-2612), and the WebSocket + REST "
        "APIs you'd use to build your own client. Comes with a "
        "Postman-style API tester built in — every lesson lets you "
        "fire real requests at the staging environment from inside "
        "the app."
    ),
    "language": "javascript",
    "releaseStatus": "BETA",
    "tier": "core",
    "chapters": [
        {
            "id": ch["id"],
            "title": ch["title"],
            "lessons": ch["lessons"],
        }
        for ch in CHAPTERS
    ],
}


def main() -> None:
    out = (
        Path(__file__).resolve().parent.parent.parent
        / "public"
        / "starter-courses"
        / "hellotrade.json"
    )
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(COURSE, indent=2) + "\n", encoding="utf-8")
    total_lessons = sum(len(ch["lessons"]) for ch in CHAPTERS)
    print(
        f"Wrote {out}\n"
        f"  {len(CHAPTERS)} chapters · {total_lessons} lessons · {out.stat().st_size:,} bytes"
    )


if __name__ == "__main__":
    main()
