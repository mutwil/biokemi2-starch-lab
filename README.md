# Biokemi 2 · Virtual starch lab

**[Open the exercise](https://mutwil.github.io/biokemi2-starch-lab/)** · [Student worksheet](EXERCISE.md) · [Instructor guide](https://mutwil.github.io/biokemi2-starch-lab/instructor.html)

A 105-minute, browser-based exercise for PLEN Biokemi 2, adapted from Section A of the 2023–2024 Danish laboratory manual: *Enzymatisk hydrolyse af glukaner samt analyse af produkter*.

Students investigate how substrate structure, accessibility and enzyme specificity affect starch and glycogen hydrolysis. No wet lab, coding, installation or GitHub account is required.

## Start here

1. Open the [online lab](https://mutwil.github.io/biokemi2-starch-lab/).
2. Work in groups of 3–4. Begin with one assigned substrate.
3. Record predictions for its five treatments, then reveal the samples.
4. Compare iodine staining, molecular linkage diagrams and TLC.
5. Reveal the full class dataset, complete the results table and write a short conclusion.
6. Download your notebook and submit it using your instructor’s normal course channel.

For offline use, download the [exercise ZIP](https://mutwil.github.io/biokemi2-starch-lab/data/biokemi2-starch-lab.zip), extract it, and open `index.html`. Keep all files together.

Answers are saved only in the current browser when browser storage is available. **There is no submission server. Download your notebook before leaving.** Instructor notes are openly accessible; this is a teaching activity, not a secure assessment platform.

## What you will learn

- Separate enzyme specificity from physical substrate accessibility.
- Distinguish internal α(1→4) cleavage by salivary α-amylase from α(1→6) debranching by isoamylase.
- Identify reducing and nonreducing ends before and after cleavage.
- Use matched controls to interpret enzyme and heat-treatment effects.
- Combine iodine and TLC evidence without equating loss of blue colour with glucose production.

## The original 15 conditions

Numbers match the manual. “Heated” refers to **60°C for 5 min before the reaction**. All reactions use **37°C for 30 min**, including those with untreated substrate.

| Substrate | Tris, untreated | Tris, heated | Saliva, untreated | Saliva, heated | Isoamylase, heated |
|---|---:|---:|---:|---:|---:|
| Glycogen | 1 | 4 | 7 | 10 | 13 |
| Potato starch | 2 | 5 | 8 | 11 | 14 |
| “Pure amylose” starch | 3 | 6 | 9 | 12 | 15 |

The four TLC standards are glucose, maltose, maltotetraose and maltoheptaose. Detection can be switched between iodine vapour and sugar staining/charring.

## Session · 14:00–15:45

| Time | Activity |
|---|---|
| 14:00–14:10 | Introduce substrates, enzymes and the experimental question |
| 14:10–14:30 | Predict the five conditions for the assigned substrate |
| 14:30–14:50 | Reveal samples; inspect iodine and bond-cleavage diagrams |
| 14:50–14:55 | Break |
| 14:55–15:20 | Interpret TLC using standards and both detection methods |
| 15:20–15:35 | Compare all three substrates |
| 15:35–15:45 | Complete the results table and conclusion; export the notebook |

## Scientific scope and provenance

The experimental matrix, pretreatment, incubation conditions and TLC standards come from `LabManual_2023-2024_Danish.docx`, Section A and its afternoon continuation. The source manual and lecture slides are not redistributed in this repository. Section B, the Arabidopsis leaf experiment, is not included.

**All analytical outputs are authored, qualitative teaching scenarios, not measured laboratory results.** Colours, migration positions and band darkness are illustrative and must not be used to estimate yields or concentrations. The small molecular sketch and the optional particle sandbox do not generate the analytical dataset.

Heating at 60°C for 5 min is not assumed to completely gelatinize every preparation. The amylose-rich preparation is idealized as unbranched. The exercise contains saliva and isoamylase treatments; β-amylase is present only in the separate optional sandbox.

## Maintain and publish

This is plain HTML, CSS and JavaScript. There are no runtime packages or external scripts.

```sh
node --test workshop.test.js
node --check workshop.js
python3 scripts/build.py
python3 -m http.server 8000 --directory _site
```

Open `http://localhost:8000/` to review the built site. You can also open the source `index.html` directly for an offline preview.

Push to `main` to run the tests, build the site and deploy through GitHub Actions to GitHub Pages. `_site/` and the generated download ZIP are build outputs and must not be committed. See [DEPLOYMENT.md](DEPLOYMENT.md) for setup and verification commands.

| File | Purpose |
|---|---|
| `index.html` | Student exercise |
| `workshop.js` | Predictions, result reveal, notebook, TLC and molecular diagrams |
| `workshop-model.js` | Qualitative scenarios and linkage connectivity |
| `workshop.css` | Screen and print styles |
| `EXERCISE.md` | GitHub-readable student worksheet |
| `instructor.html` | Timetable, answer notes and marking guide |
| `simulation.html` | Optional enzyme particle sandbox |
| `workshop.test.js` | Sample numbering, specificity, connectivity and scenario checks |
| `scripts/build.py` | Builds an allowlisted static site and offline ZIP |
| `.github/workflows/publish.yml` | Test, build and Pages deployment |
