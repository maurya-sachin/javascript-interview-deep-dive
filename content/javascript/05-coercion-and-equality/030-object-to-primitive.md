---
title: "How does an object convert to a primitive?"
status: draft
difficulty: hard
frequency: 3
core: true
tags: [coercion, to-primitive, symbol-toprimitive, valueof, tostring, date]
related:
  - javascript/coercion-and-equality/loose-equality
  - javascript/coercion-and-equality/addition-operator-coercion
  - javascript/values-and-types/symbols
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-toprimitive
  - https://tc39.es/ecma262/#sec-ordinarytoprimitive
  - https://tc39.es/ecma262/#sec-date.prototype-%symbol.toprimitive%
  - https://tc39.es/ecma262/#sec-symbol.prototype-%symbol.toprimitive%
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Symbol.toPrimitive
tldr: >
  The engine calls `ToPrimitive(obj, hint)`. If the object has a `Symbol.toPrimitive` method it is called with
  `"string"`, `"number"` or `"default"`; its result must be a primitive or a `TypeError` is thrown. Otherwise
  `OrdinaryToPrimitive` tries `valueOf` then `toString` (number and default hints) or `toString` then `valueOf`
  (string hint). `Date` treats `"default"` as `"string"`.
---

## Answer

Whenever an object appears where a primitive is required, the engine runs **`ToPrimitive(input, preferredType)`**:

1. If the object has a `Symbol.toPrimitive` method (looked up with `GetMethod`), call it with a **hint** string: `"string"`, `"number"`, or `"default"` (no preferred type). The result must not be an object, otherwise a `TypeError` is thrown.
2. Otherwise run **`OrdinaryToPrimitive`**. For hint `"string"` try `toString()` then `valueOf()`. For `"number"` and `"default"` try `valueOf()` then `toString()`. The first call that returns a non-object wins. If neither does, throw a `TypeError`.

Which hint you get depends on the operation:

- `"string"`: template literals, `String(x)`, property keys (`obj[x]`).
- `"number"`: unary `+`, `-`, `Number(x)`, relational `<`, `>`, `Math` functions.
- `"default"`: binary `+` and `==`.

Ordinary objects ignore the difference: `valueOf` returns the object itself (not a primitive), so the engine falls to `toString`, giving `"[object Object]"`, and arrays give `"1,2"`. `Date` is the exception: its built-in `Symbol.toPrimitive` treats `"default"` as `"string"`, so `date + 1` concatenates while `date - 1` is numeric. `Symbol.prototype[Symbol.toPrimitive]` returns the symbol.

To customize conversion, define `[Symbol.toPrimitive](hint)` on the class or object; it is the preferred mechanism over overriding `valueOf` and `toString` because it can distinguish the hints.

## Example

```js
const price = {
  amount: 42,
  [Symbol.toPrimitive](hint) {
    console.log("hint:", hint);
    return hint === "string" ? `$${this.amount}` : this.amount;
  },
};

console.log(`${price}`); // → hint: string
//   $42
console.log(+price); // → hint: number
//   42
console.log(price + 1); // → hint: default
//   43
console.log(price == 42); // → hint: default
//   true

const plain = { valueOf: () => 7, toString: () => "seven" };
console.log(`${plain}`, plain + "", plain * 2); // → seven 7 14
```

## Pitfalls

- Believing `+` uses the string hint. Binary `+` passes `"default"`, which most objects treat as `"number"`; the result is a string only if one of the converted operands is.
- Returning an object from `valueOf`, `toString` or `Symbol.toPrimitive`. An object result from `Symbol.toPrimitive` throws at once; from `valueOf`/`toString` it is skipped and the next method is tried.
- Forgetting `Date`: `new Date() + 1` is a string concatenation, but `new Date() - 1` is a number.
- Ignoring that a `Symbol.toPrimitive` method on the object overrides `valueOf` and `toString` entirely; they are never consulted.

## Follow-ups

**Q:** What happens if both `valueOf` and `toString` return objects?
**A:** `OrdinaryToPrimitive` throws a `TypeError`, as in `Object.create(null) + ""`, which has neither method.

**Q:** Why does `[] + []` give `""`?
**A:** `[]` has no `Symbol.toPrimitive`, `valueOf` returns the array itself, then `toString` calls `join` and returns `""`. Two empty strings concatenate to `""`.

**Q:** Why does `String({})` give `"[object Object]"`?
**A:** The string hint tries `toString` first. `Object.prototype.toString` returns `"[object "` plus the type tag plus `"]"`, which is `"Object"` for plain objects.

## Deep dive

### How it works

The spec algorithm, simplified from ECMA-262 `ToPrimitive`:

```
ToPrimitive(input, preferredType?)
  if input is not an Object: return input
  method = GetMethod(input, @@toPrimitive)
  if method is not undefined:
    hint = "default" | "string" | "number"   // from preferredType
    result = Call(method, input, hint)
    if result is not an Object: return result
    throw TypeError
  OrdinaryToPrimitive(input, preferredType ?? "number")
```

`OrdinaryToPrimitive(obj, hint)` builds the list `[toString, valueOf]` for `"string"`, else `[valueOf, toString]`. For each name it does `Get(obj, name)`; if the value is callable, calls it with `obj` as `this`, and returns the result when it is not an Object. Non-callable properties are skipped silently. After the list, it throws a `TypeError`.

The spec note says `ToPrimitive` without a hint "generally behaves as if the hint were number", and names `Date` and `Symbol` objects as the only built-ins that override this.

### Edge cases

```js
console.log(String({}), String([1, 2]), String(() => 1)); // → [object Object] 1,2 () => 1
console.log([] + {}, {} + []); // → [object Object] [object Object]
const d = new Date(0);
console.log(typeof (d + 1), typeof (d - 1)); // → string number
console.log(d[Symbol.toPrimitive]("number")); // → 0

const bad = { [Symbol.toPrimitive]: () => ({}) };
try {
  `${bad}`;
} catch (error) {
  console.log(error.constructor.name); // → TypeError
}

const skip = { valueOf: () => ({}), toString: () => "ok" };
console.log(`${skip}`, skip + ""); // → ok ok
console.log(Object(Symbol.iterator) == Symbol.iterator); // → true
```

`d[Symbol.toPrimitive]` accepts only the three hint strings; anything else throws a `TypeError`. A `null`-prototype object (`Object.create(null)`) has neither method, so any primitive conversion throws.

### Real-world scenario

A money or duration value object: comparisons and arithmetic should use the number, while logging should format it. A single `Symbol.toPrimitive` serves both. Note the default hint: `money + 5` and `money == 5` both receive `"default"`, so treat it the same as `"number"` unless your type has a good reason not to.

```js
class Duration {
  constructor(ms) {
    this.ms = ms;
  }
  [Symbol.toPrimitive](hint) {
    return hint === "string" ? `${this.ms / 1000}s` : this.ms;
  }
}

const timeout = new Duration(1500);
console.log(`${timeout}`, timeout > 1000, timeout + 500); // → 1.5s true 2000
```

### Trade-offs

Overriding `valueOf`/`toString` works everywhere and is how older code did it, but you cannot tell the hints apart and the two methods double as the public string and debugging representation. `Symbol.toPrimitive` is explicit but invisible to readers who do not know it, and implicit numeric coercion of objects makes call sites harder to read. Prefer explicit methods (`.toNumber()`, `.format()`) for domain types; reserve `Symbol.toPrimitive` for value-like objects where operators are natural.

## Exercises

### Which hint, and what prints?

```js
const probe = {
  [Symbol.toPrimitive](hint) {
    return hint;
  },
};
console.log(`${probe}`, probe + "", probe * 1, [probe] + "");
```

**Answer:** `string default NaN string`. The template uses `"string"`; `+` uses `"default"`; `* 1` uses `"number"`, which returns the string `"number"` and converts to `NaN`. The array join converts each element with `ToString`, so `probe` gets `"string"`.

### Date and the default hint

```js
const d = new Date(5);
console.log(d + 1 === d.toString() + "1", d - 1);
```

**Answer:** `true 4`. `+` passes `"default"`, which `Date` maps to `"string"`, so it concatenates the date string with `"1"`. `-` uses the number hint, giving the timestamp `5` minus `1`.
