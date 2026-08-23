# Marketing Content Engine

Turns one transcript or article into six on-brand assets, rendered to a locked template and held in an approval queue that nothing leaves without a human click.

**Live prototype: https://jericoneil.github.io/agenticedge-content-engine/**

Add `?demo=1` and it plays itself: [https://jericoneil.github.io/agenticedge-content-engine/?demo=1](https://jericoneil.github.io/agenticedge-content-engine/?demo=1). About fifteen seconds, no cursor and no clicking, so it can be screen recorded in one take or run live in front of an audience.

This is Automation H from the Agentic Edge catalogue of eight productised automations, built as a working prototype for the Agentic Edge business plan (Master's Final Project, Esade).

## What this proves

The business plan describes Automation H as a system that "turns a topic, article or transcript into on-brand social content, carousels, posts, captions and short reports, rendered to a locked brand template and queued for human approval before publishing". It is also the one automation Agentic Edge runs on itself, on its own Leading in AI podcast and newsletter, which is what drives the content cost of that channel close to zero while serving as a live demonstration of the company's capability.

Three claims from the plan are visible on screen:

| Claim | Where you see it |
| --- | --- |
| Grounded and traceable to source | Every asset carries a `Grounded in` row of transcript timestamps. Hover one and it shows the sentence it came from. Nothing in any asset is untraceable |
| Rendered to a locked brand template | The middle column shows the template constraints as read only fields. Switch the brand kit from Agentic Edge to the fictional client kit and every asset restyles while the grid, safe area and character cap do not move |
| Human approval before publishing | Six assets, all `Pending review`. The counter reads `0 of 6 approved`, and `Queue for publishing` stays disabled until a person approves each one |

One further point worth making: **clip timestamps are always produced by the local parser, never by a model.** Even with the live Claude toggle on, the model writes copy and the timestamps come from the transcript parser. A language model asked to cite a timestamp will invent a plausible one, and a client who publishes that clip finds out the hard way.

## How it works

Everything runs in the browser. There is no server and no backend.

### Parsing, `src/engine/parse.ts`

Splits a transcript into timestamped segments and speaker turns, then into sentences with character spans, so every downstream sentence can be traced back to a timestamp. Handles the article case, which has no timestamps, without inventing any.

### Term extraction, `src/engine/tfidf.ts`

Real TF-IDF, with document frequencies computed across the source's own sentences, a stopword list and a light suffix stripping stemmer. The top terms become the `Detected topics` chips.

### Theme extraction, `src/engine/textrank.ts`

A TextRank style sentence centrality: a sentence similarity graph built from cosine similarity over term vectors, then power iteration to convergence. The highest ranked sentences become the carousel slides and the insight report. A diversity pass stops the engine from picking five near identical sentences.

On the seeded episode this builds a graph of 108 nodes and 324 edges, and the interface reports those real counts as it runs.

### Quotability scoring, `src/engine/quotability.ts`

Clip picks are scored on features that actually predict whether a sentence works as a standalone clip:

- Length between 12 and 32 words
- Self contained opening, penalised for a leading pronoun or discourse connective
- Contains a figure or a claim verb
- Sits inside a single speaker turn with no crosstalk
- TextRank centrality

The interface shows each sub score for every pick, so the ranking is inspectable rather than asserted. The top three non overlapping picks get start and end timestamps derived from the segments they fall in, padded to sentence boundaries.

### Composition, `src/engine/compose.ts`

Assembles six assets under constraints enforced in code: a 3000 character LinkedIn limit, a 120 character cap per carousel slide across 5 fixed slides, 6 hooks at 140 characters, a 120 word newsletter blurb, 3 clips between 12 and 75 seconds, and 4 themes in the report. When a key point exceeds the slide cap the engine shortens it and says so, as an engine note on the card. It does not silently truncate.

Paste a different transcript and the topics, themes, clips and assets all change, because nothing is keyed to the identity of the seeded source.

## Tests

The engine ships with a self check that asserts the claims this prototype makes, rather than
just that it compiles:

```bash
npm run check
```

It asserts that two different transcripts produce different terms, key points, clips and copy,
that every clip timestamp falls inside a real transcript segment, that a source with no
timestamps yields no clips and says so, that every format constraint is enforced, that every
asset carries citations pointing at real sentences, and that the engine is deterministic.

## Run locally

```bash
npm install
npm run dev
```

## Live mode

Open the settings drawer in the header. The default is the local engine, which needs no key, no network and no configuration, and produces the same result every time.

Switching to `Claude API (live)` and entering an Anthropic API key routes composition through `claude-opus-5`. The key is held in React state and, only if you tick the box, in `localStorage`. It is sent directly from your browser to the Anthropic API and never to any Agentic Edge server. There is a `Clear key` button. In production this call would sit behind a server side proxy.

The model receives the themes, quotes and timestamps the local engine extracted, plus the brand and format constraints, and returns JSON matching the local engine's asset contract, so the same interface renders both modes. Timestamps are never taken from the model. If the call fails or the response does not parse, the app falls back to the local engine.

## Scope and limits

This is a prototype built to demonstrate a business plan, not a production deployment. A real client deployment would add:

- Real ingestion connectors: a podcast RSS feed, a YouTube transcript, a Notion or Drive document
- Real publishing connectors to LinkedIn, Instagram and a newsletter platform, behind the same approval gate
- A server side key and a per-tenant proxy, so no credential reaches the browser
- Actual video cutting from the clip timestamps, rather than reporting the in and out points
- Slide export as PNG and PDF alongside the SVG, and the brand kit loaded from the client's own asset store
- An evaluation harness measuring whether the extracted themes match what a human editor would have chosen, which is the only honest way to claim the extraction is good

## Demo data

The two transcripts, the article, the guests and the client brand kit are fictional and were written for this prototype. Leading in AI and Agentic Edge are the author's own brands. No real podcast guest is named or quoted anywhere in this repository.

See [DEMO.md](DEMO.md) for the recording script.

## Licence

MIT. Copyright 2026 Jerico Neil Agdan Papasin.
