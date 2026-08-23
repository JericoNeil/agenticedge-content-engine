/**
 * Seeded demo source 1.
 * Fictional episode of Leading in AI, the Agentic Edge podcast.
 * The guest, the company and every figure in this transcript are invented.
 */

export const TRANSCRIPT_PILOTS = `[00:00] Host: Welcome back to Leading in AI. Today we are talking about the gap between a pilot that impresses everyone in a meeting room and a system that survives a Monday morning. My guest runs data platforms for a logistics group in Lisbon. Ines Varela, thank you for coming on.
[00:22] Ines Varela: Thanks for having me. This is the conversation I have been wanting to have in public for about a year.
[00:29] Host: Let us start with the number you gave me on the phone. You said your group ran eleven AI pilots in two years and put three of them into production. Is that still accurate?
[00:44] Ines Varela: It is eleven started, three running today, and one of those three we rebuilt from scratch after six months. So the honest success rate is closer to two in eleven. Everybody in this industry quotes a similar figure and then quietly stops talking about it.
[01:08] Host: Why do the other eight die?
[01:11] Ines Varela: Almost never because the model was wrong. That is the part people find hard to accept. In eight cases out of eleven the model performed at or above the target we set in the pilot brief. What killed the project was everything around the model.
[01:33] Ines Varela: The first killer is data access. Our fastest pilot got a signed data access approval in forty one days. The slowest waited four months for a read only view of the dispatch table. By the time the access arrived, the sponsor had moved to another department and the budget had been reallocated.
[02:01] Host: Forty one days for the fast one.
[02:04] Ines Varela: Forty one days for the fast one, yes. And I want to be fair to the security team, because they were not being obstructive. Nobody had ever written down who owns the dispatch table. The approval was slow because the ownership question had no answer, not because the process was hostile.
[02:31] Ines Varela: So the lesson we took is that a pilot should not start until a named human being owns the data it needs. Not a department, a person, with a name in a document.
[02:47] Host: That sounds obvious when you say it out loud.
[02:51] Ines Varela: Everything in this field sounds obvious once somebody has spent four months learning it.
[02:58] Host: What is the second killer?
[03:01] Ines Varela: Evaluation. Or rather, the absence of it. Most pilots are evaluated by a demo. Somebody shows fifteen examples in a slide deck, the room nods, and the project moves to the next gate on the strength of fifteen examples.
[03:24] Ines Varela: We now require a held out set of at least three hundred real cases before anything is allowed near a production queue. It is boring work. It is also the single change that improved our hit rate more than any other decision we made.
[03:47] Host: Three hundred cases sounds like a lot of manual labelling.
[03:52] Ines Varela: It took two people eleven days for our invoice matching system. Eleven days of tedious work against a project that would otherwise have burned sixty thousand euros before anyone noticed it did not work outside the demo. That trade is not close.
[04:16] Host: Let us talk about that invoice system, because that is one of the three that survived.
[04:22] Ines Varela: The invoice matching system reads a supplier invoice and matches it to the delivery record. Before, a clerk did this by hand. The average handling time was eighteen minutes per exception, and we had roughly four hundred exceptions a week across the group.
[04:47] Ines Varela: The system now closes about seventy per cent of those exceptions without a human touch. The rest go to a review queue with the reason it could not decide attached. We deliberately did not push for a higher automation rate.
[05:09] Host: Why not? Most people would push for ninety.
[05:14] Ines Varela: Because the last thirty per cent is where the expensive mistakes live. A wrong match on a straightforward invoice costs almost nothing to fix. A wrong match on a disputed delivery becomes a legal conversation with a customer. Confidence based routing is not a compromise, it is the design.
[05:41] Ines Varela: We set the threshold using the evaluation set. Above a certain confidence the error rate was under one per cent, below it the error rate climbed sharply. So the machine takes the top band and a person takes the rest. There is nothing clever about it and it is why the system is still running.
[06:09] Host: Third killer?
[06:11] Ines Varela: Integration into the workflow people already use. Our first attempt put the output in a new web application. Adoption after eight weeks was under ten per cent of the target users. We rebuilt it so the result appears in the tool the clerks already had open all day, and adoption went past eighty per cent in three weeks.
[06:41] Ines Varela: Same model. Same accuracy. A completely different outcome, because we stopped asking people to change where they work.
[06:52] Host: That is the rebuild you mentioned earlier.
[06:56] Ines Varela: That is the rebuild. It cost us six months and it was entirely avoidable. If I could give one piece of advice to a company starting this year, it would be to design the handover point before you design the model.
[07:18] Host: Say more about the handover point.
[07:22] Ines Varela: Every automation has a moment where it gives the work back to a person. Most teams treat that moment as an edge case. It is not an edge case, it is the product. If the handover is clean, people trust the system on the cases it does keep. If the handover is messy, they check everything and you have added work instead of removing it.
[07:53] Host: How do you measure whether a handover is clean?
[07:58] Ines Varela: We measure how long it takes a person to accept or reject the machine's suggestion. If that takes longer than doing the task from scratch, the handover has failed, whatever the accuracy number says. For invoice matching it is now about ninety seconds against eighteen minutes manually.
[08:24] Host: What about the fourth killer, if there is one.
[08:29] Ines Varela: There is, and it is the least discussed. Ownership after go live. A pilot has a project manager. A production system needs someone whose job description includes it on the day everyone has forgotten it was ever exciting.
[08:52] Ines Varela: Two of our eleven pilots reached production quality and then decayed, because nobody owned the data drift. The supplier changed the invoice layout in March and accuracy fell for five weeks before anyone raised it. Not a model failure, an ownership failure.
[09:19] Host: If you were advising a mid sized company with no data team at all, where would you tell them to start?
[09:27] Ines Varela: Start with a process that runs at least fifty times a week, has a written rule somewhere, and where a mistake is cheap to reverse. That is it. Those three filters remove almost every project that would have wasted their year.
[09:52] Ines Varela: And measure the before state properly for two weeks before you build anything. Half the companies I speak to cannot say how long the current process takes, which means they will never be able to prove the new one is better.
[10:14] Host: What does the board ask you now that they did not ask two years ago?
[10:20] Ines Varela: Two years ago they asked what the model could do. Now they ask what happens when it is wrong, who sees it first, and how quickly we can turn it off. Those are much better questions and I wish they had arrived a year earlier.
[10:44] Host: Last one. What is the thing you believe about this that most people in your position would disagree with?
[10:52] Ines Varela: That the technology is now the easy part. I know that sounds like a slogan. But of the eight projects we lost, not one was lost on model quality. They were lost on ownership, on evaluation, on access, and on where the output landed. The interesting work has moved out of the model and into the operating design around it.
[11:24] Host: Ines Varela, thank you.
[11:27] Ines Varela: Thank you, this was fun.`;
