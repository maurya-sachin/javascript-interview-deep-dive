---
title: "What's the difference between `null` and `undefined`?"
status: draft
difficulty: easy
frequency: 5
core: true
tags: ["null", undefined, void, nullish, missing-values]
related:
  - javascript/values-and-types/language-types
  - javascript/values-and-types/typeof-null
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-ecmascript-language-types
  - https://tc39.es/ecma262/#sec-void-operator
  - https://tc39.es/ecma262/#sec-undefined
  - https://tc39.es/ecma262/#sec-islooselyequal
  - https://tc39.es/ecma262/#sec-islessthan
  - https://tc39.es/ecma262/#sec-tonumber
  - https://tc39.es/ecma262/#sec-json.stringify
  - https://tc39.es/ecma262/#sec-functiondeclarationinstantiation
  - https://tc39.es/ecma262/#sec-binary-logical-operators
  - https://tc39.es/ecma262/#sec-optional-chains
  - https://tc39.es/ecma262/#sec-ordinaryget
  - https://tc39.es/ecma262/#sec-object.create
  - https://tc39.es/ecma262/#sec-object.hasown
  - https://tc39.es/ecma262/#sec-array.prototype.join
  - https://tc39.es/ecma262/#sec-array.prototype.find
  - https://tc39.es/ecma262/#sec-regexp.prototype.exec
  - https://tc39.es/ecma262/#sec-string.prototype.match
  - https://tc39.es/ecma262/#sec-copydataproperties
  - https://tc39.es/ecma262/#sec-IsHTMLDDA-internal-slot
  - https://www.typescriptlang.org/tsconfig/#strictNullChecks
  - https://dom.spec.whatwg.org/#dom-parentnode-queryselector
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/null
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Data_structures
tldr: >
  Both are primitives with exactly one value. `undefined` is what the language gives you when
  something has no value yet: unassigned variables, missing arguments, absent properties, no
  `return`. `null` is a value you assign to say "intentionally nothing". They are `==` but not `===`,
  and they convert differently to numbers.
---

## Answer

Both are primitive types with exactly one value, and both are *nullish*. The difference is who produces them.

- **`undefined`** is produced by the language to mean "no value here": a declared but unassigned variable, a missing function argument, a property that doesn't exist, a function with no `return`. MDN frames it as absence of a *value*.
- **`null`** is something a programmer assigns to mean "intentionally empty". MDN frames it as absence of an *object*. The language yields it in few places: the end of the prototype chain, and built-ins such as `RegExp.prototype.exec` that return it for "no match".

How they differ in code:

- `typeof undefined` is `"undefined"`; `typeof null` is `"object"` (a historical quirk).
- `null == undefined` is `true`; `null === undefined` is `false`.
- As numbers, `Number(null)` is `0` and `Number(undefined)` is `NaN`.
- `JSON.stringify` keeps `null` but drops an `undefined` object property and turns an `undefined` array element into `null`.
- Default parameters apply only to `undefined`: `greet(null)` keeps `null`. `??` and `?.` treat both as nullish.

**Missing vs. present-but-undefined.** `obj.key === undefined` can't tell a missing property from one explicitly set to `undefined`. Use `'key' in obj` or `Object.hasOwn(obj, 'key')`.

**`void`.** `void expr` evaluates `expr` and returns `undefined`. `void 0` is an expression that always yields `undefined`. Common uses (per MDN) are discarding a return value, as in `() => void doSomething()`, and forcing a function expression to parse as an expression in `void function () {}()`.

## Example

```js
let declared;
const obj = { present: undefined, nothing: null };

console.log(declared, obj.missing, (() => {})()); // → undefined undefined undefined
console.log('present' in obj, 'missing' in obj); // → true false

console.log(null == undefined, null === undefined); // → true false
console.log(Number(null), Number(undefined)); // → 0 NaN
console.log(JSON.stringify({ a: undefined, b: null, c: [undefined] })); // → {"b":null,"c":[null]}

const greet = (name = 'guest') => name;
console.log(greet(undefined), greet(null)); // → guest null
console.log(null ?? 'fallback', 0 ?? 'fallback'); // → fallback 0
```

## Pitfalls

- Using `== null` without knowing it also matches `undefined`. That's often intended (it's the compact nullish check), but write a comment saying so.
- Assuming a default parameter replaces `null`. It doesn't; only `undefined` triggers it.
- Using `value || fallback` for nullish checks: it also replaces `0`, `''` and `false`. Use `??`.
- Reading `typeof x === 'undefined'` as "x doesn't exist". It's also true for a declared variable holding `undefined`.

## Follow-ups

**Q:** Which should my API return for "no result"?
**A:** Pick one and document it. MDN's guidance is that an API should likely accept both as equivalent inputs. Returning `undefined` matches what built-ins like `Array.prototype.find` do.

**Q:** Can `undefined` be overwritten?
**A:** The global `undefined` property is non-writable and non-configurable, so global assignment can't change it. A local variable named `undefined` is legal and shadows it, which is why you shouldn't write one.

## Deep dive

### How it works

The two values enter the language in different places. `undefined` is produced by named spec mechanisms, so you can predict every one:

- A `var` binding is created and initialized to `undefined` when its Environment Record is instantiated, which is why a hoisted `var` reads as `undefined` before its assignment. (`let` and `const` are different: they stay uninitialized, and reading them early throws.)
- A function body that finishes without a `return` value completes with `undefined`, and a parameter with no matching argument is `undefined`.
- `OrdinaryGet` returns `undefined` when it walks the prototype chain and reaches a `null` parent without finding the key. It also returns `undefined` for an accessor property whose getter is `undefined`.

`null`, by contrast, comes from the language in few places: it is the `[[Prototype]]` of `Object.prototype`, which is what ends the chain `OrdinaryGet` walks, and of objects you create with `Object.create(null)`; and built-ins such as `RegExp.prototype.exec` and `String.prototype.match` return it for "no match". Other `null`s come from host APIs (such as the DOM's `querySelector`), from JSON, or from program code.

```js
const proto = Object.getPrototypeOf(Object.prototype);
const setterOnly = { set value(v) {} };
const bare = Object.create(null);

console.log(proto); // → null
console.log(setterOnly.value, bare.toString); // → undefined undefined
console.log(Object.getPrototypeOf(bare)); // → null
console.log(Object.hasOwn(setterOnly, 'value')); // → true
```

`setterOnly.value` is `undefined` even though the property exists, so `=== undefined` cannot mean "absent". That is the same trap the Answer describes for explicitly assigned `undefined`, reached by a second route.

### Edge cases

`==` has a dedicated rule for this pair: `IsLooselyEqual` returns `true` when one side is `null` and the other `undefined`, and neither is loosely equal to anything else, including `0`, `''` and `false`. Relational operators don't use that rule. They convert with `ToNumber`, so `null` becomes `0` and `undefined` becomes `NaN`, and the results look inconsistent:

```js
console.log(null == 0, null >= 0, null > 0); // → false true false
console.log(undefined == 0, undefined >= 0, undefined < 0); // → false false false
console.log(null + 1, undefined + 1); // → 1 NaN
console.log(`${null} ${undefined}`, String([null, undefined])); // → null undefined ,
```

The last line shows a third behaviour: `Array.prototype.join` (and so `String(array)`) renders both as an empty string, while template literals print the words.

*Legacy:* browsers implement the Annex B `[[IsHTMLDDA]]` internal slot, which the spec lists as a normative-optional exception in `IsLooselyEqual`. `document.all` has it, so `document.all == null` is `true` even though it is an object and `typeof document.all` is `"undefined"`. Don't rely on it; it exists only for old compatibility checks.

### Real-world scenario

The distinction decides whether a value is *ignored* or *applied*, and different layers disagree about which side they are on. A settings form sends partial updates:

```js
const defaults = { theme: 'light', pageSize: 20 };
const fromForm = { theme: undefined, pageSize: null };

console.log({ ...defaults, ...fromForm }); // → { theme: undefined, pageSize: null }

const patch = JSON.stringify({ name: 'Ada', nickname: null, bio: undefined });
console.log(patch); // → {"name":"Ada","nickname":null}

const { theme = 'light', pageSize = 20 } = fromForm;
console.log(theme, pageSize); // → light null
```

- **Spread and `Object.assign`** copy own enumerable properties as they are, so `theme: undefined` overwrites the default. Only defaults (destructuring or parameter) and `??` treat `undefined` as "use the fallback"; defaults keep `null`, while `??` replaces it too.
- **JSON** has `null` but no `undefined`, so a PATCH body can say "clear the nickname" (`null`) versus "leave the bio alone" (omitted). Setting a field to `undefined` and expecting the server to clear it silently sends nothing.
- **Defaults** applied with `= value` skip `null`, so a `null` from an API response reaches code that assumed a default had been applied.

The fix is to decide per boundary, then normalise once at the edge: for API input, map `null` to the domain's "cleared" value explicitly, and strip or reject `undefined` keys before merging.

### Trade-offs

Using only one of them is simpler, but you can't fully do it: the language still hands you `undefined` for missing arguments and properties, and JSON hands you `null`. A common convention is `undefined` for "not provided / not found" (matching `Array.prototype.find` and `Map.prototype.get`) and `null` for "deliberately empty" in stored or transmitted data. In TypeScript with `strictNullChecks`, that convention becomes visible in types (`string | null` for "cleared", an optional property for "absent"), which is the main reason to keep the two meanings apart rather than treat them as interchangeable.
