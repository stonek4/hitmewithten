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
- Benign noise to ignore on web: `Animated: useNativeDriver is not supported`.

**How to apply:** before adding any Paper component to a flex column, or any
imperative `ref` call on a `TextInput`, check it in the browser — the
unit-test renderer performs no layout and mocks no platform method surface.
Follow `mobile/.claude/skills/verify/SKILL.md`.

Related: [[vocab-cards-layout]] · [[vocab-cards-landmines]]
