/**
 * Seeded demo source 2.
 * Fictional episode of Leading in AI, the Agentic Edge podcast.
 * The guest, the company and every figure in this transcript are invented.
 */

export const TRANSCRIPT_FAMILY = `[00:00] Host: This is Leading in AI. Family owned manufacturers are the backbone of the Spanish industrial base and almost nobody writes about how they are adopting this technology. My guest is the general manager of a hardware fittings maker near Barcelona. Pilar Aznar, welcome.
[00:24] Pilar Aznar: Thank you. I should say at the start that I am the third generation in this company, so I have opinions about change that are older than I am.
[00:36] Host: Give me the shape of the business first.
[00:40] Pilar Aznar: We make door and window fittings. One hundred and forty employees, two plants, about two thousand three hundred active references. My grandfather started it in nineteen sixty one with four people and a press.
[01:01] Host: And where did artificial intelligence enter that picture?
[01:06] Pilar Aznar: Through quoting, which is not where anybody expects. Everyone assumes a factory starts with robots on the line. We started with the office, because the office was where the pain was loudest.
[01:26] Pilar Aznar: A custom quote used to take one of our two estimators about four hours. They would open six spreadsheets, look up material prices that were three weeks old, check an old job that looked similar, and then apply a margin from memory. It worked, in the sense that the company survived sixty years doing it.
[01:56] Host: But it did not scale.
[02:00] Pilar Aznar: It did not scale and, more importantly, it did not survive a retirement. One of the estimators is sixty two. Everything he knows about which jobs are profitable is in his head. That is the real risk in a company like ours, and no software vendor has ever led a sales pitch with it.
[02:27] Host: So what did you build?
[02:30] Pilar Aznar: A system that reads the customer request, finds the five most similar jobs we have quoted in the last four years, and shows what we charged, what it actually cost us, and where the margin ended up. It does not set the price. It brings the evidence to the person who sets the price.
[02:58] Pilar Aznar: The first quote took the estimator eleven minutes instead of four hours. But the number I care about is different. A junior colleague with fourteen months of experience produced a quote that the senior estimator agreed with, without help. That had never happened before.
[03:26] Host: That is a training story more than an efficiency story.
[03:31] Pilar Aznar: It is entirely a training story. We are not trying to remove the estimator. We are trying to make it possible for somebody to become one in two years instead of ten.
[03:47] Host: How did the shop floor react? That is the part I always want to hear about.
[03:54] Pilar Aznar: Badly, at first, and they were right to. The word automation in a Spanish factory means one thing to the people on the line, and it is not efficiency. We had a works council meeting in the second month that was, let us say, energetic.
[04:18] Pilar Aznar: What changed it was a rule we wrote down and signed. No system we install decides anything about a person. It can suggest, it can sort, it can prepare, but a human approves. We put that in writing before the first tool went live and we have not broken it.
[04:47] Host: Did that rule cost you anything in efficiency?
[04:52] Pilar Aznar: Yes, and the cost is worth it. There are approvals in our process that a machine could do faster. We keep the human there because the trust we get back is worth more than the four minutes we lose. In a family company you are managing a fifty year relationship, not a quarter.
[05:20] Host: What was the second thing you automated?
[05:25] Pilar Aznar: Supplier documents. We receive material certificates from about seventy suppliers in fourteen different formats. Somebody used to type the values into our system by hand. Twenty seven per cent of those entries had at least one error, which we only discovered when we measured it properly.
[05:53] Pilar Aznar: Now the documents are read automatically and the values arrive with a confidence score. Anything below the threshold goes to a person with the original document open next to it. Errors are now under three per cent and, honestly, the remaining ones are supplier errors, not ours.
[06:22] Host: You mentioned your ERP earlier. How old is it?
[06:27] Pilar Aznar: The core was installed in two thousand and nine. Everybody tells us to replace it. Replacing it would cost more than both automations combined and would stop the plant for a week. So we built around it instead, reading from it and writing back through a small number of controlled points.
[06:56] Pilar Aznar: I think this is the practical reality that consultants underestimate. A company like ours does not get to start from a clean architecture. The question is never what would be ideal, it is what can be added on a Tuesday without stopping production.
[07:22] Host: What did the family think? You mentioned three generations.
[07:28] Pilar Aznar: My father asked one question, which was what happens to the people. Not the return on investment, not the payback period. Once he understood that nobody was leaving because of it, he stopped asking about the technology entirely.
[07:52] Pilar Aznar: My daughter, who is twenty four and works in logistics for us, asked why it had taken so long. Both reactions are correct and they are the two poles you manage in a family company.
[08:11] Host: What would you tell a similar company that has not started?
[08:17] Pilar Aznar: Pick the process where your best person is a single point of failure. Not the biggest cost, the biggest concentration of knowledge in one head. That is where this technology earns its money in a company of our size.
[08:39] Pilar Aznar: And do not buy a platform. Buy an outcome you can measure in ninety days. If a vendor cannot describe the outcome in one sentence that your production manager understands, the project will fail and you will blame the technology.
[09:03] Host: Are you worried about the cost of falling behind?
[09:08] Pilar Aznar: Less than I was. Two years ago the conversation was about a wave that would drown anyone who was slow. What I see now is that the companies that moved carefully are ahead of the ones that moved fast, because the fast ones bought platforms nobody uses.
[09:35] Pilar Aznar: We spent about forty thousand euros in total across both projects. A competitor of ours spent close to four hundred thousand on a system that their people worked around within a year. Speed is not the variable that matters. Fit is.
[10:01] Host: Last question. What is different about doing this in a family owned company?
[10:08] Pilar Aznar: Time. I am not optimising for the next twelve months, I am handing something over. That changes which projects look attractive. A system that saves money and costs us the trust of forty people on the line is not a good deal in a company that expects to exist in twenty forty five.
[10:38] Host: Pilar Aznar, thank you very much.
[10:42] Pilar Aznar: Thank you for having me.`;
