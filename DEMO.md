# Recording script

## The easy way: let it play itself

Open this and do nothing:

```
https://jericoneil.github.io/agenticedge-content-engine/?demo=1
```

The page runs the whole sequence on its own, with no cursor and no clicking: the assets are generated, the carousel advances a slide, the brand kit switches and everything restyles, and one asset is approved. A thin progress line across the top of the window shows how far through it is, and it turns green and reads `demo complete` at the end, so a recording has a clean start and finish. It takes about fifteen seconds.

Two things matter for a clean capture:

1. **Keep the window focused while it plays.** Chrome slows down timers in background tabs, which stretches the sequence out. Click into the window, then start recording.
2. **Load the page once before the take.** The first load fetches fonts and the script; a reload after that starts instantly.

To record it on a Mac, press Shift, Command and 5, choose `Record Selected Portion`, drag around the browser window, press Record, then reload the demo URL. Stop when the line turns green. QuickTime saves it as a .mov you can drop straight into Keynote or PowerPoint.

If you would rather present it live than play a video, just open the demo URL in front of the board. It is the real prototype, so it holds up if anyone asks you to run it again.

## Driving it by hand

Everything below is the same sequence, done manually, in case you want to pause on a particular screen or answer a question mid-demo.


Live prototype: https://jericoneil.github.io/agenticedge-content-engine/

Before recording, open the settings drawer and press `Reset demo`, then close it. The engine mode must read `Local engine`. Record at 1440 by 900 or wider so all three columns are visible at once.

## 15 second take

The point of this take is that one transcript becomes six finished, branded, reviewable assets without anybody writing a word.

```
0s   Load the page. The three columns read left to right as the pipeline:
     Source, then Brand kit with the locked template, then Assets and approval.

2s   Click the first source card, "Why AI pilots stall before production".

4s   Click "Generate assets".
     Stages step through with the real counts: parsing 44 segments, extracting
     terms across 281 unique stems, ranking sentences over a 108 node and 324
     edge graph, scoring 96 quotability candidates, rendering to the locked
     template, queueing 6 for review.

8s   Six asset cards land, each marked Pending review with a confidence score.
     The detected topics appear above them.

10s  Scroll the right column to the "Carousel, five slides" card. The slide is
     rendered in the Agentic Edge template. Click the next arrow once.

13s  Click the "Costa Verde Tours" brand kit in the middle column. Every asset
     restyles. The grid, the safe area and the character cap do not move.

15s  End on the restyled carousel.
```

## 30 second take

Adds the grounding and the approval gate, which are the two things the business plan actually claims.

```
0s   Load the page.

3s   Click the first source card, then "Generate assets". Let the stage counts
     run so the board sees real numbers rather than a spinner.

9s   Point at the "Grounded in" row on the LinkedIn post card. Those are
     transcript timestamps. Hover one to show the sentence behind it.

13s  Scroll to the "Clip picks" card. Each pick shows its start and end
     timestamp and its quotability sub scores: length, self contained opening,
     figure or claim verb, single turn, centrality. Say that the ranking is
     inspectable.

17s  Point at the engine note on the carousel card, where slide 4 exceeded the
     120 character cap and the engine shortened it and said so.

20s  Switch the brand kit to Costa Verde Tours. Everything restyles, the layout
     holds.

24s  Approve two cards. The counter moves to 2 of 6. Point at "Queue for
     publishing", still disabled.

28s  Click "Request change" on a third and type a word into the note.

30s  End on the counter and the disabled publish button.
```

## Line worth saying over the recording

The clip timestamps come from the transcript parser, never from the model. Ask a language model to cite a timestamp and it will invent a plausible one, and the client finds out when they publish the clip.

## Notes for re-takes

- `Reset demo` in the settings drawer returns everything to first load.
- The local engine is deterministic. The same source produces the same topics, the same key points, the same clips and the same confidence scores on every run.
- The third source is an article with no timestamps. Selecting it is a good way to show that the clip picks card reports honestly that clips are unavailable rather than inventing them. It is not part of the 15 second take.
- `Queue for publishing` is labelled as a prototype that does not publish, and it publishes nothing even when enabled.
- The asset cards are rendered in full rather than collapsed, so the right column is a long scroll. Plan the scroll before the take: the LinkedIn post is at the top, the carousel is second, and the brand kit switch is a click in the middle column that needs no scrolling at all.
