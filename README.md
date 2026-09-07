# fleuron.study

Official front-door website for [Fleuron](https://github.com/wilsonhyeh/fleuron), the offline-first qualitative analysis app.

The desktop application source code, releases, and issue tracker live at [github.com/wilsonhyeh/fleuron](https://github.com/wilsonhyeh/fleuron).

## Development

```bash
npm install
npm run dev
```

## Quality gates

```bash
npm run build
npx astro check
npm run check:links
npm test
npm run check:contrast
npm run check:no-external
```
