---
name: rnweb-paper-landmines
description: react-native-web / react-native-paper / RNTL / expo-router behaviours that pass every unit test and only break when you drive a real browser.
metadata:
  type: project
---

Environment: Expo SDK 57 · RN 0.86 · React 19.2 · react-native-paper 5.x ·
expo-router 57 · react-native-web 0.21.

Every one of these was found by **driving the web build**, and every one passed
`tsc`, `eslint` and the whole Jest suite first.

- **`TextInput` has no `setSelection` method on react-native-web.**
  `inputRef.current?.setSelection?.(0, n)` threw `setSelection is not a
  function` — the optional call does not save you, because the property exists
  and is not callable. Use the declarative `selection={{ start, end }}` prop,
  and clear it on the next `onChangeText` or the caret is pinned to the start.
- **Paper's `ProgressBar` stretches to fill a flex column on web and ignores a
  height passed through its own `style` prop.** Pin it with a wrapper `View`
  (`{ height: 4, overflow: 'hidden' }`). Unpinned it measured 900 dp and
  collapsed the sibling `ScrollView` to zero height.
- **`presentation: 'modal'` on a `Stack.Screen` makes the document taller than
  the viewport on web**, hiding the app bar. Branch on `Platform.OS`.
- **RNTL excludes `accessibilityElementsHidden` elements from queries by
  default.** Visual assertions inside a deliberately a11y-hidden subtree need
  `{ includeHiddenElements: true }`.
- **A pushed screen stays mounted-but-hidden underneath.** A Playwright
  `getByTestId` on the previous screen resolves that stale hidden node and
  hangs on `waitFor` visible. Anchor on a testID unique to the screen you
  expect, or `page.goto('/')` to reset the stack.
- **A shared `StyleSheet.create` object passed as a prop widens to
  `TextStyle | ViewStyle | ImageStyle`** and stops type-checking against the
  element it lands on. Let each component own its own sheet.
- **`useColorScheme()` can report `'unspecified'`**, not just light/dark/null —
  type any scheme resolver against `string`, not the RN union.
- **A React context provider cannot consume its own context.** The Appearance
  setting driving the theme needed the navigator split into a child component
  inside `PreferencesProvider`.
- **i18next selects a plural form from a single `count`.** A sentence carrying
  two independently-varying numbers cannot be one key — it renders the singular
  form ("2 set imported"). Split it into two messages, each its own `<Text>`.
  Never concatenate them into one string; that is untranslatable.
- **`onTouchEnd` on a `View` never fires for a mouse click**, so a "tappable"
  row is dead on web — and a plain `View` is not focusable, so there is no
  keyboard path to it either. Use `Pressable`.
- **`router.back()` silently does nothing when the history stack is empty** —
  which is every deep link, bookmark and reload, because web serves real URLs.
  The navigator logs "GO_BACK was not handled" and the user is stranded.
  `src/lib/navigation.ts`'s `goBackOrHome()` is the fix; use it everywhere.
- **`AccessibilityInfo.isReduceMotionEnabled()` is asynchronous.** A component
  that animates on mount runs its animation before the answer arrives, moving
  the screen for a user who asked for no movement. `useReduceMotion()` returns
  a `resolved` flag; treat "not yet known" as reduce-motion.
- **`Animated.Value.__getValue()` is a private RN internal** — present at
  runtime, absent from the public types, so `tsc` rejects it while Jest passes.
  There is no public synchronous read (`addListener` fires only on change, so
  it cannot observe a value that never moved). Isolate the cast in one helper
  and add a guard test that fails if RN removes it.
- **`useRef(new Animated.Value(x)).current` trips `react-hooks/refs`**
  ("cannot access refs during render"). Use lazy `useState(() => …)`.
- **Paper's `Snackbar` has no `onShow`.** Tie side effects to the visibility
  prop changing in an effect instead.
- Benign noise to ignore on web: `Animated: useNativeDriver is not supported`.

**How to apply:** before adding any Paper component to a flex column, or any
imperative `ref` call on a `TextInput`, check it in the browser — the
unit-test renderer performs no layout and mocks no platform method surface.
Follow `mobile/.claude/skills/verify/SKILL.md`.

Related: [[vocab-cards-layout]] · [[vocab-cards-landmines]]
