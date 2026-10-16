# Paper Whisperer

**Any letter, in plain words.**

Take a photo of a bill, fine, grant notice or bank message. Paper Whisperer tells you what it says, what to do, and by when, in the language you speak at home.

> Student project: design a mobile app that solves a real problem in my community.

## The problem

Official letters in South Africa are written in formal English and legal language. Many people speak another language at home. A misunderstood letter can mean a missed deadline, a lost grant, extra fees, or a scam that works because the reader is confused.

## What it does

- **Scan or paste.** Photograph a letter (up to 4 pages at once), paste text from an SMS or email, or try an example.
- **Plain-language explanation** at about a 12-year-old reading level, with the headline first.
- **11 languages:** English, isiZulu, isiXhosa, Afrikaans, Sesotho, Sepedi, Setswana, Xitsonga, Tshivenda, siSwati, isiNdebele. Section headings are translated too.
- **Do this, by this date.** A tick-off checklist with deadlines.
- **Key details** pulled out: amounts, dates, reference numbers, where to go.
- **Scam check** on every document, with safe next steps when a message looks fake.
- **Words explained** for the hard terms in the letter.
- **Listen** (read aloud, where the device has a voice for the language) and **Copy summary**.
- **Ask a question** about the letter and get a short answer. Three suggested questions appear as one-tap chips.
- **Take with you** checklist of documents to bring (ID, payslip, proof of address).
- **Add dates to calendar.** Downloads a calendar file with one all-day event per deadline and reminders 7, 3 and 1 day before and on the morning of the day.
- **Reply to the sender.** Pick what you want to say (ask for a payment plan, query a charge, ask for information, confirm receipt) and get a short editable draft with `[placeholders]`. Send it by Copy, WhatsApp or Email. Not offered for messages that look like scams. Works offline as an English template.
- **Save on this phone.** Opt-in. Keeps the explanation (not the photo or the letter text) in this browser, and the home screen lists saved letters with days left, soonest first, overdue marked.
- **Share** the summary through the phone's share sheet, or WhatsApp.

## How it works

```
photo / text  ->  prompt (shared/whisper.js)  ->  Claude  ->  JSON  ->  normalizeResult()  ->  screen
```

1. The app builds a prompt that asks for one JSON object: headline, summary, urgency, deadline, steps (each with a machine-readable date), things to bring, suggested questions, key facts, scam risk, glossary and translated headings.
2. Claude reads the photo or text and replies in the chosen language.
3. `normalizeResult()` checks the reply (types, lengths, allowed values) so the screen never renders something unexpected.
4. Everything from the AI is inserted into the page as plain text, never as HTML. The prompt tells the model to treat the letter as data and ignore instructions written inside it.

The browser app picks its AI connection at start-up:

| Mode | When | How |
|------|------|-----|
| `api` | Normal website (Vercel) | Calls `/api/explain`, `/api/ask` and `/api/draft`, which call the Claude API with your key |
| `claude` | Opened inside Claude | Uses the page's own Claude connection |
| `offline` | No AI available | The four example letters still work in English |

## Run it

You need Node 18+ and an [Anthropic API key](https://console.anthropic.com/).

```bash
git clone <your-repo-url>
cd paper-whisperer
cp .env.example .env        # then paste your key into .env
npx vercel dev              # opens http://localhost:3000
```

Run the tests:

```bash
npm test
```

## Deploy (Vercel)

1. Push this folder to a GitHub repository (see below).
2. On [vercel.com](https://vercel.com), choose **Add New > Project** and import the repository. No build settings are needed.
3. In **Settings > Environment Variables**, add `ANTHROPIC_API_KEY`.
4. Deploy. Open the URL on your phone and scan a letter.

### Push to GitHub

```bash
git init
git add .
git commit -m "Paper Whisperer"
git branch -M main
git remote add origin https://github.com/<your-username>/paper-whisperer.git
git push -u origin main
```

## Project structure

```
index.html            App markup
styles.css            Design tokens, dark and light themes
app.js                Screens, AI engine selection, result rendering, saved letters, reply draft
shared/whisper.js     Prompts, JSON reading and checking, deadline maths, calendar file (browser and server)
data/samples.js       Four example letters with ready-made English results
api/explain.js        POST /api/explain  (photo or text -> explanation)
api/ask.js            POST /api/ask      (follow-up questions)
api/draft.js          POST /api/draft    (reply to the sender)
api/_anthropic.js     Claude API call and a simple rate limiter
test/whisper.test.js  Unit tests
vercel.json           Function time limit and basic headers
docs/PITCH.md         The 2-minute pitch script
docs/paper-whisperer-pitch.pptx   The pitch slides (9 slides, speaker notes included)
```

## Privacy

The server does not store letters. A letter is sent only to write the explanation, and the server functions keep nothing and set `Cache-Control: no-store`. The only thing kept anywhere is what the person chooses to save with **Save on this phone**: the explanation (headline, steps, dates), stored in that browser's `localStorage`. The photo and the letter text are never saved, and nothing saved leaves the device. If you deploy this for real users, add a privacy notice and avoid logging request bodies.

## Limits and honest notes

- The explanation is written by an AI. It can make mistakes, especially in languages with less training data. The app says so and tells people to check big decisions with the sender or an advice office.
- It is not legal advice.
- The example letters, names, account numbers and amounts are invented.
- The in-memory rate limiter in `api/_anthropic.js` is a starting point. Use a shared store (for example Vercel KV) for real traffic.
- South African Sign Language is not covered.
- Dates are read by the AI and checked for being real calendar dates, but not for being correct. The app shows them next to the original wording so people can compare.
- Several photos are shrunk a little before upload because Vercel rejects request bodies over 4.5 MB. Four pages is the limit.
- Inside Claude (`claude` mode) several photos are passed as a list; if that view only accepts one photo, scan one page at a time.
- Drafted replies are in English by default because most senders work in English; the person can choose another language.

## Roadmap

- Translate the whole interface, not only the result headings
- Push reminders for saved deadlines (today the calendar file does this through the person's own calendar)
- Offline mode for common letter types
- Partner version for municipalities, banks and NGOs, with their own letter templates
- Native mobile app with a document-edge scanner

## Built with

Plain HTML, CSS and JavaScript on the front end. Node serverless functions on Vercel. Claude for reading and explaining documents. Fonts: Instrument Serif and Manrope.

## License

MIT
