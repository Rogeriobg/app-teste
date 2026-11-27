This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Layout invariants (mandatory)

Every task that touches UI must keep the app free of horizontal overflow.
The RNTL does **not** measure geometry, so a passing test suite proves nothing
about layout — these rules are enforced by `npm run validate:layout`.

1. **A child of a `flexDirection: 'row'` container must be able to shrink**:
   declare `flexShrink: 1`, `flex: 1` or `minWidth: 0` on it.
   Without one of those, it keeps its intrinsic width and pushes its sibling
   off-screen.
2. **A fixed item is `flexShrink: 0`** — icons, badges, action buttons.
   Only one side of a row may be fixed; the other must shrink.
3. **Text inside a row needs `numberOfLines`** (+ `ellipsizeMode="tail"`).
   Without it, long text breaks character by character or overflows.
4. **`flex: 1` without `minWidth: 0` is invalid** — RN will not shrink the
   child and the text breaks character by character.
5. **Safe area is explicit**: use `useSafeAreaInsets()` and apply the inset
   per edge. Do not use `SafeAreaView` together with a manual inset — the
   inset gets counted twice.

Run before declaring a UI task done:

```bash
npm run validate:layout   # reprova transbordo horizontal
npm run validate:touch    # reprova alvo de toque < 44x44 px
npm run validate:contrast # reprova contraste abaixo de WCAG AA
```

Ambos rodam no CI e são portões obrigatórios.

**UI tasks must load the `mobile-designer` skill** and record which rules
were applied. See `AUDITORIA.md` for why this became mandatory.

## Native module invariants (learned on-device)

Behaviors below were **only** reproducible on a real device — web and
automated tests mask them. Verified during cycles 2–4 (see
`WORKFLOW_STATE.md`).

1. **`expo-print`'s output directory is unreadable.** The PDF written to
   `<cacheDir>/Print/<uuid>.pdf` cannot be read by any other module — not
   by `expo-sharing`'s `FileProvider` (`Not allowed to read file under
   given url`) nor by `expo-file-system` (`Missing 'READ' permission`).
   Only `expo-print` itself can read it.
   → The correct pattern is:

   ```ts
   const { base64 } = await printToFileAsync({ html, base64: true });
   const destino = new File(Paths.document, 'name.pdf');
   await destino.write(base64, { encoding: 'base64' });
   await shareAsync(destino.uri, { mimeType: 'application/pdf', UTI: '.pdf' });
   ```

2. **No `Alert.alert` before a native share sheet.** A native dialog sits
   on top of the screen and breaks the share sheet opened right after.
   Share first; report success/failure after.

3. **Native flex ≠ CSS flex.** `flex: 1` on a Text inside a fixed-width
   component (`flexShrink: 0`) makes the whole component stretch on the
   Yoga native engine. Web CSS masks it (`width: auto`). Enforced by
   `npm run validate:layout`.

4. **Mocked modules prove nothing about native behavior.** Tests that mock
   `shareAsync`/`FileSystem` cannot catch permission errors. Any feature
   touching a native module must be verified on a real device (phase 4c)
   before `[APROVADO]`.

## Pipeline: bug-first, no new features while blocked

`WORKFLOW_STATE.md` is the single source of truth. These rules are
non-negotiable:

1. **`[APROVADO]` means "no open high/medium bug assigned to this stage"** —
   not "the latest cycle passed". A stage with old open bugs stays
   `[REPROVADO]`.
2. **Check the "Gate de release" table before proposing any new work.** If
   it says `BLOQUEADO`, fix the blocking bugs first. Never suggest a new
   feature while medium/high bugs are open.
3. **QA cannot approve itself while it has open bugs.** Registering a bug
   and approving in the same cycle is contradictory.
4. **Every fix gets a verification gate.** If a bug was found visually
   (overflow, touch size, contrast), add an automated gate so it cannot
   regress — see `scripts/validate-layout.mjs` as the model.
5. **Bugs before features, always.** The order is: blocking bugs → low
   severity cleanup → new features. Never the reverse.
