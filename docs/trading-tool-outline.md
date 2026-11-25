# Trading tool: outline and questions (draft 0.1)

2026-11-25 · Hudson, first run for Kevin · Source: Kevin's voice note (24 Nov): *"we should build a trading futures site for different indexes, probably using TradingView, that will allow us to execute bots automatically... I have to spend a little more time thinking about it."* This is an outline to react to, not a spec. Features are written as options; the questions in §5 decide which ones stay.

---

## 1. What it is (as understood)

A members' tool on top of GG Trading that turns the setups GG already teaches into **automated strategies that place real orders** on index futures, through TradingView.

What GG Trading has today (ggtrading.io): education and signals for **NQ and ES futures, mainly the micro contracts MNQ and MES**. Setups: Fair Value Gap + EMA crossover, Opening Range Breakout (6:30 AM), "red ribbon" bands. Daily pre-market bias, live streams and bar replay with Brandon, a private Discord with signal channels, 2:1 risk rules, and paid membership through Stripe (built, in sandbox).

The tool would move a member from *reading a signal and placing the trade by hand* to *the strategy places it for them*, within risk limits they set.

## 2. How the pieces usually fit

1. **Strategy in TradingView.** Each setup (FVG + EMA, ORB, …) is written as a TradingView script. It runs on the chart and fires an **alert** on entry and exit.
2. **Alert → webhook.** TradingView sends each alert to a web address (a webhook) with the order details.
3. **Our server checks it.** Is the member subscribed, is the strategy switched on for them, is it inside their risk limits (size, daily loss, trading hours)?
4. **Order to the broker.** The server places the order in the member's own broker account through the broker's API, or through a ready-made bridge service.
5. **Dashboard.** The member sees positions, fills, profit and loss, and a big **Stop all** button.

TradingView itself only sends the alert; the order is placed by the broker connection in step 4. Which broker (or bridge) is the main technical choice (§5, Q3).

## 3. Possible features (to pick from)

| # | Feature | What it does | Phase |
|---|---|---|---|
| T1 | Strategy library | GG's setups as TradingView scripts, each with a plain description, the rules and back-tested results | 1 |
| T2 | Paper trading | Run any strategy on simulated money first; required before going live | 1 |
| T3 | Connect a broker | Member links their own futures account (no money passes through GG) | 2 |
| T4 | Auto-execute | Alerts become real orders in the member's account | 2 |
| T5 | Risk controls | Per member: contracts per trade, max daily loss, trading hours, max trades per day; auto-stop when hit | 2 |
| T6 | Kill switch | Stop all strategies and flatten positions in one click; also an admin stop for every member | 2 |
| T7 | Dashboard | Positions, fills, P&L by day and strategy, a log of every alert and what happened to it | 2 |
| T8 | Alerts to members | Fill and stop notices by email / Discord | 2 |
| T9 | Admin console | GG staff publish or pause strategies, see health (alerts in, orders out, errors), see members' status (not their money) | 2 |
| T10 | Indexes beyond NQ/ES | YM (Dow), RTY (Russell 2000), their micros | 3 |
| T11 | Copy Brandon | Members mirror a lead trader's live trades | 3 |

Reuses what exists: GG sign-in (Supabase), membership and billing (Stripe), Discord, the site.

## 4. What it would take (rough, to order the work, not a quote)

- **Phase 1 (T1, T2):** scripts + paper trading + a simple results page. Small; mostly strategy work in TradingView.
- **Phase 2 (T3–T9):** the real product: webhook server, broker integration, risk engine, dashboard, admin. Medium–large; the broker integration and testing on a paper account are most of it.
- **Phase 3:** more indexes, copy trading.

## 5. Questions for Kevin (these decide the spec)

1. **Who uses it?** Only us (VF Tech / GG trading our own account), or GG members on their own accounts? This changes almost everything, including the legal question below.
2. **Money:** members always keep their money in their own broker account and GG never holds or moves it? (Assumed yes.)
3. **Broker:** which one(s)? Options include a futures broker with an API, or a bridge service that connects TradingView alerts to several brokers so we don't build each integration. Do you or Brandon already use one?
4. **Which strategies first?** ORB at 6:30 AM, FVG + EMA, or both? Who signs off a strategy before members can run it (Brandon)?
5. **Legal check:** automated trading on members' futures accounts, or sending them trade signals for a fee, can need registration in the US (futures regulators). Worth a short check with a lawyer before Phase 2, as for the OFAC question earlier.
6. **Price:** part of the current membership, a higher tier, or a separate add-on?
7. **Name and home:** inside ggtrading.io (members area) or its own site?
8. **Timing:** start after the Alco go-live and the portal specs?

## 6. Next step

Kevin answers §5 (Q1–Q3 are enough to start). Then this becomes a spec with requirement IDs like the Admin Portal one, and Kevin does UX and UI.
