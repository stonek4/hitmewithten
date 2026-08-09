# Sync (CAP-13) — what still has to happen in the Firebase console

Everything that can be a file in this repo is a file in this repo. What remains
needs console or CLI access, which the implementing agent does not have.

Project: **`vocards-62df8`** (display name *VoCards*, `.firebaserc` alias
`vocards`). The same project the legacy app uses for Analytics and Hosting —
**do not create a new one**. Firestore has never had a consumer, so nothing
here can disturb the live site.

---

## 1. Console steps (Kevin)

| # | Step | Where | Why |
|---|---|---|---|
| 1 | Enable **Email/Password** sign-in | Authentication → Sign-in method | The only provider the client implements today. Google and Apple are in the capability but not built. |
| 2 | Create the **Firestore database**, *Standard edition*, named `(default)` | Firestore Database | Enterprise-edition databases do not support security rules and the SDK will not find them. |
| 3 | Deploy rules and indexes | `firebase deploy --only firestore` (repo root) | Ships `firestore.rules` + `firestore.indexes.json`. **Nothing may reach production before this** — the default Firestore ruleset is open. |
| 4 | Restrict the web API key by **HTTP referrer** | Google Cloud console → Credentials | The key is a public identifier, not a secret, but referrer-restricting it limits abuse of the project's quota. |
| 5 | Confirm **Storage** and **Realtime Database** are disabled or locked | Console | `CLAUDE.md` flags that both are configured but unused. An unused, open service is a liability. |
| 6 | Set the client config for real builds | EAS env / `.env.local` | See §2. |

Step 3 is the one that must not be skipped or reordered. Deploying the app
without the rules would leave every user's card content world-readable.

---

## 2. Client configuration

The client reads `EXPO_PUBLIC_FIREBASE_*` (see `.env.example`). These are
**publishable identifiers, not secrets** — the web `apiKey` is visible in any
client bundle. What protects the data is `firestore.rules` plus the referrer
restriction.

A build with **no** API key is a valid, supported build: `isSyncConfigured()`
returns false, the Settings screen says sync is unavailable, and the app is
otherwise complete. That is deliberate — it makes "ship without sync" a config
decision rather than a code change.

`.env.local` is gitignored. Do not commit real values.

---

## 3. Verifying it once the console work is done

The signed-out path is already verified and guarded (see §4). The signed-in
path has **never been run against a real backend** — it is the outstanding
verification.

```bash
# Local, against the emulator (no console access needed):
firebase emulators:start --only auth,firestore
```

Then drive the app and check, in order:

1. Sign up creates the account and a first sync pass runs.
2. A set created **before** signing in is uploaded, not discarded — sign-in
   *adopts* local data (US-I3).
3. Editing the same set on two clients resolves last-writer-wins, and the
   loser's edit is the one that reached the server first.
4. Deleting a card on one client deletes it on the other, and it does **not**
   come back on the next pass (tombstones).
5. Deleting the account removes every document under `users/{uid}` and then the
   auth user, in that order.
6. Rules: a second signed-in user cannot read `users/{first-uid}/cards/*`.
   This is the one that matters most; test it explicitly rather than assuming.

---

## 4. What is already guaranteed, and must stay guaranteed

CAP-13 §13.1 is **P0** and gates the launch build: a user who never opts in
makes **zero** network requests and no auth calls of any kind.

- Verified by driving the whole app — library, session, results, about,
  settings, trophies, import — with sync **configured and signed out**:
  0 external requests, no Firebase globals present, 0 page errors.
- Guarded structurally by `src/features/sync/optionality.test.ts`, which fails
  the build if anyone adds a top-level value import of `firebase/*` outside the
  three allow-listed modules, or introduces `signInAnonymously`. That guard was
  verified to fail against a deliberately introduced violation.

The mechanism is the guarded `require()` in `src/services/firebase.ts`; the
reasoning is in that file's header. Do not "tidy" it into a top-level import.

---

## 5. Open question for Kevin — the privacy policy wording

`CAP-18` shipped this sentence, and it is currently **true**:

> There is no account, no sign-in and no sign-up. The app makes no network
> requests to us at all in this version.

Once a build ships with sync configured, that sentence is true only for users
who never sign in. It needs rewording before such a build reaches a store —
an inaccurate policy is both a store-review failure and a trust failure.

**This is a Kevin decision and has deliberately not been edited.** The
distinction the new wording has to carry is the one the capability already
draws: local-only by default, what sync stores if enabled, and what analytics
collects and how to disable it. The strings live at
`src/i18n/en-US.json` → `about.privacy.*`.
