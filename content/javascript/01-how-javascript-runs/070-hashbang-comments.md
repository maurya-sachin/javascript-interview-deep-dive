---
title: "What is a hashbang comment, and why is it in the grammar?"
status: draft
difficulty: easy
frequency: 1
core: false
tags: [hashbang, shebang, lexical-grammar, cli, nodejs]
related:
  - javascript/how-javascript-runs/ecmascript-engine-host
  - javascript/how-javascript-runs/scripts-vs-modules
  - javascript/how-javascript-runs/tc39-process
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-hashbang
  - https://tc39.es/ecma262/#sec-ecmascript-language-lexical-grammar
  - https://github.com/tc39/proposal-hashbang
  - https://github.com/tc39/proposals/blob/main/finished-proposals.md
  - https://docs.npmjs.com/cli/v11/configuring-npm/package-json#bin
tldr: >
  A hashbang comment is a `#!` line at the very start of a script or module, like
  `#!/usr/bin/env node`. Unix-like systems read it to pick an interpreter; the engine
  treats it as a single-line comment. It became standard grammar in ES2023 because CLI
  hosts were already stripping it themselves. Anywhere else, even after one space, it's a SyntaxError.
---

## Answer

A hashbang (or shebang) comment is a line starting with `#!` as the first two code points of a source text:

```text
#!/usr/bin/env node
```

It serves two readers. On Unix-like systems, the OS sees `#!` when you run an executable file directly and uses the rest of the line as the interpreter command; `/usr/bin/env node` finds `node` on the `PATH`. The engine then reads the same file, and the spec defines `HashbangComment` as `#!` followed by the rest of the line, discarded like any other comment.

Why it's in the grammar at all: CLI hosts such as Node.js already accepted the line, but `#` isn't valid JavaScript there, so each host stripped it before handing the text to the engine. The Hashbang Grammar proposal moved that into the language so every engine parses the same text the same way. It reached Stage 4 and shipped in ES2023.

The rules are tight on purpose:

- **Only at the very start.** The lexical grammar uses the `InputElementHashbangOrRegExp` goal only at the start of a Script or Module. One leading space or blank line makes `#!` a SyntaxError.
- **Scripts and modules, not function bodies.** `eval` parses a Script, so it accepts a hashbang; `new Function` parses a function body, so it doesn't.
- **It's a comment.** It has no effect on how the engine runs the code; the OS and the host decide what runs it.

You'll meet it in npm packages with a `bin` entry: npm's docs require the file to start with `#!/usr/bin/env node`, otherwise the script isn't started with Node.

## Example

```js
const parse = (label, source) => {
  try {
    console.log(label, eval(source));
  } catch (error) {
    console.log(label, error.name);
  }
};

parse('first line:', '#!/usr/bin/env node\n40 + 2'); // → first line: 42
parse('leading space:', ' #!/usr/bin/env node\n40 + 2'); // → leading space: SyntaxError
parse('second line:', '\n#!/usr/bin/env node\n40 + 2'); // → second line: SyntaxError

try {
  new Function('#!/usr/bin/env node\nreturn 42');
} catch (error) {
  console.log('Function body:', error.name); // → Function body: SyntaxError
}
```

## Pitfalls

- Putting anything before `#!`: a license comment, a blank line, or a byte order mark. The spec treats U+FEFF as white space, so a BOM-prefixed hashbang isn't at the start. Hosts may strip a BOM first: Node.js 24 runs such a file as an ES module but throws a SyntaxError for it as CommonJS.
- Expecting the hashbang to change how the engine behaves. To the engine it's only a comment; the rest of the line matters only to the OS that launches the interpreter.
- Forgetting the file must also be executable (`chmod +x`) for the OS to honour the line when run as `./cli.js`.

## Follow-ups

**Q:** Does a hashbang work in a browser?
**A:** Yes, syntactically. A classic or module script may start with one and the engine ignores it. It has no use there, since the browser, not an OS, decides what runs the code.

**Q:** Why `#!/usr/bin/env node` rather than `#!/usr/local/bin/node`?
**A:** `env` looks `node` up on the `PATH`, so the script runs whichever Node.js the user has installed (system, nvm, Homebrew) instead of failing when Node.js lives somewhere else.

**Q:** What happens on Windows?
**A:** Windows itself doesn't read the line. For a `bin` entry, npm installs a `.cmd` wrapper that runs the script with Node.js, and the engine still skips the hashbang as a comment.

## Exercises

### Predict the output

```js
const sources = ['#!node\n1', '#!node\r\n2', '/* c */\n#!node\n3'];
for (const source of sources) {
  try {
    console.log(eval(source));
  } catch (error) {
    console.log(error.name);
  }
}
```

**Answer:** `1`, `2`, then `SyntaxError`, each on its own line. A carriage return is a line terminator, so `\r\n` ends the hashbang line just like `\n`. In the third source, a comment comes first, so `#!` is no longer at the start of the Script and isn't a hashbang.
