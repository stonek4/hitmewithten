---
name: rnweb-paper-landmines
description: react-native-web / react-native-paper / RNTL behaviours that pass every unit test and only break when you drive a real browser.
metadata:
  type: project
---

Environment: Expo SDK 57 · RN 0.86 · React 19.2 · react-native-paper 5.x ·
expo-router · react-native-web 0.21.

Every one of these was found by **driving the web build**, and every one passed
`tsc`, `eslint` and the whole Jest suite first.

- **`TextInput` has no `setSelection` method on react-native-web.**
  `inputRef.current?.setSelection?.(0, n)` threw
  `setSelection is not a function` — the optional call does not save you,
  because the property exists and is not callable. Use the declarative
  `selection={{ start, end }}` prop, and clear it on the next `onChangeText` or
  the caret is pinned to the start of the field. This fired on *every wrong
  answer* in the drilling loop, i.e. the app's core interaction.
- **Paper's `ProgressBar` stretches to fill a flex column on web and ignores a
  height passed through its own `style` prop.** Unpinned it measured 900 dp
  tall, pushed the whole screen below the fold, and collapsed the sibling
  `ScrollView` to zero height. Pin it with a wrapper `View`
  (`{ height: 4, overflow: 'hidden' }`).
- **`presentation: 'modal'` on a `Stack.Screen` makes the document taller than
  the viewport on web** (the root gets a negative offset for the sheet's
  travel), hiding the app bar. Branch on `Platform.OS`: `modal` on native,
  `card` on web.
- **RNTL excludes `accessibilityElementsHidden` elements from queries by
  default.** Assertions about what is *painted* inside a deliberately
  a11y-hidden subtree need `{ includeHiddenElements: true }`; assertions about
  the accessible name must not use it.
- Benign noise to ignore on web: `Animated: useNativeDriver is not supported`
  from Paper's animations.

**How to apply:** before adding any new Paper component to a flex column, or any
imperative `ref` call on a `TextInput`, check it in the browser — the unit-test
renderer performs no layout and mocks no platform method surface, so it cannot
see any of this. Follow `mobile/.claude/skills/verify/SKILL.md`.

Related: [[vocab-cards-layout]] · [[vocab-cards-landmines]]
