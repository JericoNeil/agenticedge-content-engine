import { TRANSCRIPT_PILOTS } from "./transcript-pilots";
import { TRANSCRIPT_FAMILY } from "./transcript-family";
import { ARTICLE_APPROVAL } from "./article-approval";

export interface DemoSource {
  id: string;
  label: string;
  title: string;
  kindLabel: string;
  origin: string;
  description: string;
  text: string;
}

export const DEMO_SOURCES: DemoSource[] = [
  {
    id: "pilots",
    label: "Podcast transcript",
    title: "Why AI pilots stall before production",
    kindLabel: "Transcript with timestamps",
    origin: "Leading in AI, episode 41",
    description: "Ines Varela, Head of Data Platforms at a Lisbon logistics group.",
    text: TRANSCRIPT_PILOTS,
  },
  {
    id: "family",
    label: "Podcast transcript",
    title: "AI adoption in Spanish family owned manufacturers",
    kindLabel: "Transcript with timestamps",
    origin: "Leading in AI, episode 44",
    description: "Pilar Aznar, general manager of a hardware fittings maker near Barcelona.",
    text: TRANSCRIPT_FAMILY,
  },
  {
    id: "article",
    label: "Article",
    title: "Content programmes stall at the approval step",
    kindLabel: "Article, no timestamps",
    origin: "Leading in AI, newsletter essay",
    description: "No timestamps, so the engine reports honestly that clip picks are unavailable.",
    text: ARTICLE_APPROVAL,
  },
];

export const PASTE_PLACEHOLDER = `Paste a transcript or an article here.

A transcript with lines like this gets clip picks with real timestamps:

[00:00] Host: Welcome to the show.
[00:14] Guest: Thanks for having me.

Plain text with no timestamps also works. The engine will say that clip picks are unavailable rather than invent a start and end time.`;
