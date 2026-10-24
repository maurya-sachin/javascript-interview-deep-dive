---
title: "How do browsers resolve bare specifiers with import maps?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [modules, import-maps, bare-specifiers, module-resolution, html]
related:
  - javascript/modules/es-module-loading
  - javascript/modules/import-meta
  - javascript/modules/dynamic-import
  - javascript/modules/esm-vs-commonjs
verified: 2026-10
perishable:
  - Multiple import maps not Baseline; Firefox behind a flag
  - Import map integrity key in Chrome 127, Firefox 138, Safari 18
  - External import maps (src) not supported by the HTML spec
  - Node.js has no built-in import map support
sources:
  - https://html.spec.whatwg.org/multipage/webappapis.html#import-maps
  - https://html.spec.whatwg.org/multipage/webappapis.html#resolve-a-module-specifier
  - https://html.spec.whatwg.org/multipage/webappapis.html#resolving-an-imports-match
  - https://html.spec.whatwg.org/multipage/webappapis.html#merge-existing-and-new-import-maps
  - https://html.spec.whatwg.org/multipage/webappapis.html#resolving-a-module-integrity-metadata
  - https://html.spec.whatwg.org/multipage/scripting.html#prepare-the-script-element
  - https://nodejs.org/docs/latest-v24.x/api/module.html#import-maps
  - https://nodejs.org/docs/latest-v24.x/api/packages.html#subpath-imports
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap
tldr: >
  A bare specifier like `'lodash'` isn't a URL, so a browser throws a `TypeError` unless an import map
  says where it lives. An inline `<script type="importmap">` maps specifiers (or prefixes ending in `/`)
  to URLs, `scopes` override them for modules under a URL prefix, and `integrity` adds SRI hashes.
  Several maps now merge; earlier rules and already-resolved specifiers win.
---

## Answer

ECMAScript leaves specifiers to the host; in browsers, HTML's *resolve a module specifier* algorithm turns them into URLs. Relative and absolute URLs (`./`, `../`, `/`, `https:`) resolve against the importing module's URL; a bare specifier like `'chart'` has no URL meaning, so without an import map it throws a `TypeError`.

An import map is JSON in an inline `<script type="importmap">` with up to three keys:

- **`imports`:** specifier → URL. A key ending in `/` maps a whole prefix: `"chart/": "/vendor/chart@4/"` sends `chart/helpers.js` to `/vendor/chart@4/helpers.js`. URL-like keys work too (remap `/js/app.js` to a hashed file); a `null` value blocks a specifier.
- **`scopes`:** URL prefix → its own specifier map, used only when the *importing module's* URL matches the prefix. Scopes are tried most-specific first, then `imports`. This is how two versions of one package coexist.
- **`integrity`:** URL → SRI hash, applied to modules fetched through `import` and `import()`. A top-level `<script src>` still uses its own `integrity` attribute.

Resolution order: matching scopes, then `imports`, then plain URL resolution, else `TypeError`. Within a map the most specific key wins, and a prefix match can't climb above its prefix with `../`.

A document can now have several import maps. Each is merged into one global map when registered, even after modules have loaded, but a new rule is dropped if its scope and specifier already exist or if it would change an already-resolved specifier. Import maps can't be external: a `src` attribute fires an `error` event.

Support: import maps are Baseline widely available, in every major engine since March 2023. Multiple import maps aren't Baseline yet: Chrome 133 and Safari 18.4 ship them, Firefox only behind a flag. Node.js has no import maps; its docs show a resolve hook implementing a subset, and package.json `"imports"` covers in-package aliases.

## Example

```html
<!-- http://localhost:8765/index.html, run in Chrome 155 -->
<script type="importmap">
  {
    "imports": {
      "chart": "/vendor/chart@4/chart.js",
      "chart/": "/vendor/chart@4/",
      "app/": "/src/"
    },
    "scopes": {
      "/legacy/": { "chart": "/vendor/chart@2/chart.js" }
    }
  }
</script>
<script type="module">
  console.log(import.meta.resolve('chart')); // → http://localhost:8765/vendor/chart@4/chart.js
  console.log(import.meta.resolve('chart/helpers.js')); // → http://localhost:8765/vendor/chart@4/helpers.js
  console.log(import.meta.resolve('app/main.js')); // → http://localhost:8765/src/main.js
  try { import.meta.resolve('react'); } catch (e) { console.log(e.name); } // → TypeError

  // /legacy/entry.js: export const chartUrl = import.meta.resolve('chart');
  const { chartUrl } = await import('/legacy/entry.js');
  console.log(chartUrl); // → http://localhost:8765/vendor/chart@2/chart.js
</script>
```

## Pitfalls

- Mapping `"chart"` but not `"chart/"`. The bare key matches only the exact specifier, so `import 'chart/helpers.js'` still throws.
- Adding an import map after code has already resolved the specifier you're remapping. The merge silently drops that rule (Chrome logs a console warning), so declare maps before the first module that needs them.
- Writing a scope for the *target* URL. Scopes match the URL of the module doing the importing, not the module being imported.
- Expecting `<script type="importmap" src="map.json">` to work. External import maps aren't supported; the element fires `error` and the map is ignored.

## Follow-ups

**Q:** Do import maps apply in workers?
**A:** Not in the current spec. *Resolve a module specifier* uses the import map only when the global object is a `Window`; in workers it uses an empty map, so bare specifiers throw there.

**Q:** When an import map is merged and a rule conflicts, which one wins?
**A:** The existing one. *Merge module specifier maps* skips any new specifier already in the old map, and *merge existing and new import maps* removes new rules that would change an already-resolved specifier. Browsers may warn in the console.

**Q:** Why bother with import maps when bundlers resolve bare specifiers anyway?
**A:** Unbundled or partly bundled apps, CDN-hosted dependencies, and cache busting: map `"app/"` to a hashed folder and only the map changes on deploy. They also let module code shared with Node.js and bundlers keep bare specifiers in the browser.

## Exercises

### Predict the output

Served from `http://localhost:8765/`, run in Chrome 155.

```html
<script type="importmap">
  { "imports": { "chart": "/vendor/chart@4/chart.js" } }
</script>
<script type="module">
  console.log(import.meta.resolve('chart'));
  const map = document.createElement('script');
  map.type = 'importmap';
  map.textContent = JSON.stringify({
    imports: { chart: '/vendor/chart@5/chart.js', dates: '/vendor/dates/index.js' },
  });
  document.head.append(map);
  console.log(import.meta.resolve('chart'), import.meta.resolve('dates'));
</script>
```

**Answer:** `http://localhost:8765/vendor/chart@4/chart.js`, then `http://localhost:8765/vendor/chart@4/chart.js http://localhost:8765/vendor/dates/index.js`. The second map is merged, so `dates` resolves, but its `chart` rule is dropped because `chart` was already resolved; Chrome logs a warning saying so.

### Predict the resolutions

The module `/scope2/scope3/r.mjs` resolves `a`, `b` and `c` with this map (Chrome 155).

```html
<script type="importmap">
  {
    "imports": { "a": "/a-1.mjs", "b": "/b-1.mjs", "c": "/c-1.mjs" },
    "scopes": {
      "/scope2/": { "a": "/a-2.mjs" },
      "/scope2/scope3/": { "b": "/b-3.mjs" }
    }
  }
</script>
```

**Answer:** `/a-2.mjs /b-3.mjs /c-1.mjs`. Both scopes match the importer's URL. `b` is found in the more specific `/scope2/scope3/`; `a` isn't there, so resolution falls back to `/scope2/`; `c` is in no scope and comes from `imports`.
