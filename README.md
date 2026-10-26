# disposable-list-audit

Open disposable-email blocklists are great at catching throwaway inboxes. Some of them also catch addresses that belong to real people: mainstream mailbox providers and **privacy relays** (Apple Hide My Email, DuckDuckGo, Firefox Relay, SimpleLogin, Proton Pass, addy.io), which forward to an inbox the user actually reads.

This repo checks the popular lists for those false positives, re-runs every week, and publishes two small allowlists you can apply on top of whichever blocklist you use.

## Results

<!-- results:start -->
Last run: **2026-10-26**. 28 mainstream providers and 14 privacy-relay domains checked.

| List | Domains | Mainstream providers listed | Privacy relays listed |
|---|---:|---|---|
| [las-nish/disposable-emails](https://github.com/las-nish/disposable-emails) | 180,561 | **12** (outlook.com, hotmail.com, live.com, msn.com, proton.me, protonmail.com, pm.me, tutanota.com, tuta.io, qq.com, 163.com, naver.com) | **14** (privaterelay.appleid.com, duck.com, mozmail.com, relay.firefox.com, simplelogin.com, simplelogin.co, slmail.me, aleeas.com, passmail.net, passinbox.com, addy.io, anonaddy.com, anonaddy.me, 33mail.com) |
| [ivolo/disposable-email-domains](https://github.com/ivolo/disposable-email-domains) | 121,569 | 0 | **1** (33mail.com) |
| [Propaganistas/Laravel-Disposable-Email](https://github.com/Propaganistas/Laravel-Disposable-Email) | 97,713 | 0 | 0 |
| [FGRibreau/mailchecker](https://github.com/FGRibreau/mailchecker) | 57,702 | 0 | **13** (duck.com, mozmail.com, relay.firefox.com, simplelogin.com, simplelogin.co, slmail.me, aleeas.com, passmail.net, passinbox.com, addy.io, anonaddy.com, anonaddy.me, 33mail.com) |
| [wesbos/burner-email-providers](https://github.com/wesbos/burner-email-providers) | 27,277 | 0 | **4** (duck.com, anonaddy.com, anonaddy.me, 33mail.com) |
| [disposable-email-domains/disposable-email-domains](https://github.com/disposable-email-domains/disposable-email-domains) | 9,927 | 0 | 0 |
| [7c/fakefilter](https://github.com/7c/fakefilter) | 4,819 | 0 | 0 |
<!-- results:end -->

What this does **not** measure: how often relays are used for abuse. There is no signup-level data here, only list membership. Blocking relays can be a deliberate policy; the point is to make it a choice instead of a side effect of the list you picked.

## Allowlists (CC0)

| File | What it is |
|---|---|
| [`relays.txt`](relays.txt) / [`relays.json`](relays.json) | Privacy-relay domains that forward to a real inbox |
| [`providers.txt`](providers.txt) / [`providers.json`](providers.json) | Mainstream mailbox providers that should never be on a disposable list |

Relay domains and the services behind them:

| Service | Domains |
|---|---|
| Apple Hide My Email | `privaterelay.appleid.com` |
| DuckDuckGo Email Protection | `duck.com` |
| Firefox Relay | `mozmail.com`, `relay.firefox.com` |
| SimpleLogin | `simplelogin.com`, `simplelogin.co`, `slmail.me`, `aleeas.com` |
| Proton Pass | `passmail.net`, `passinbox.com` |
| addy.io (formerly AnonAddy) | `addy.io`, `anonaddy.com`, `anonaddy.me` |
| 33mail | `33mail.com` |

Note: relays such as SimpleLogin and addy.io also let users bring their own domain, so a relay address can come from any domain. These lists only cover the shared ones.

### Use it

Apply the allowlist after your blocklist check:

```js
import relays from './relays.json' with { type: 'json' };
import providers from './providers.json' with { type: 'json' };

const allow = new Set([...relays, ...providers]);

function isDisposable(email, blocklist) {
  const domain = email.split('@').pop().trim().toLowerCase();
  if (allow.has(domain)) return false;
  return blocklist.has(domain);
}
```

```python
import json

allow = set(json.load(open("relays.json"))) | set(json.load(open("providers.json")))

def is_disposable(email: str, blocklist: set[str]) -> bool:
    domain = email.rsplit("@", 1)[-1].strip().lower()
    return domain not in allow and domain in blocklist
```

## Method

[`audit.mjs`](audit.mjs) downloads each list from its default branch, normalises it (lowercase, comments and blanks removed, JSON arrays/objects and comma-separated lines supported) and checks exact membership of every domain in `providers.json` and `relays.json`. It writes [`results.json`](results.json) and the table above. A [GitHub Action](.github/workflows/audit.yml) runs it every Monday and commits any change.

```sh
node audit.mjs   # Node 18+, no dependencies
```

Found a relay or provider that should be here, or a list worth adding? Open an issue or a PR.

## License

The data and code in this repo are dedicated to the public domain under [CC0 1.0](LICENSE). The lists being tested belong to their authors under their own licenses; this repo only stores the membership results.

---

Maintained by the maker of [Vetto](https://usevetto.com), a signup checker that lets privacy relays through by default. The allowlists don't depend on it. The same study, with more context, is at [usevetto.com/disposable-email-list-test](https://usevetto.com/disposable-email-list-test).
