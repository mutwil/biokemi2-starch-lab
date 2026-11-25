# Biokemi 2 · Starch and glycogen day workbook

**[Open the complete day workbook](https://mutwil.github.io/biokemi2-starch-lab/)**

One self-contained page for the PLEN Biokemi 2 teaching day: the schedule, lecture notes, the theoretical exercise, the brewing talk, the virtual starch lab and the exam-style assignment. Students do not need GitHub accounts, coding tools or PowerPoint.

## Day plan

| Time | Session | Teacher / speaker |
|---|---|---|
| 09:00–09:45 | Glycogen lecture | Marek |
| 10:00–10:45 | Starch lecture | Marek |
| 11:00–12:00 | Theoretical exercise and group work | Marek |
| 13:00–13:45 | Starch and brewing industry talk | Finn Lok, Carlsberg |
| 14:00–15:45 | Virtual starch-degradation lab | Marek |
| 16:00–17:00 | Exam-style assignment | Marek |

The previously open afternoon slot now contains the virtual lab. Work in groups for theory and the lab, and individually for the exam-style assignment.

## Start here

1. Open the [day workbook](https://mutwil.github.io/biokemi2-starch-lab/), which starts with the schedule.
2. Follow its links to the relevant session. The five morning question groups and four exam questions appear inline with their figures and answer choices.
3. Attempt each exercise before unfolding its answer discussion.
4. In the virtual lab, predict the five conditions for your assigned substrate. Use the on-page guide to compare its iodine signals and TLC lanes, then reveal the class dataset.
5. Download the **day notebook**. It includes lecture and industry notes, theoretical answers, lab predictions and interpretations, and exam answers in chronological order.
6. Submit using the instructor’s normal course channel. The website does not collect submissions.

For offline use, download the [complete workbook ZIP](https://mutwil.github.io/biokemi2-starch-lab/data/biokemi2-starch-lab.zip), extract it, and open `index.html`. It includes the figures and optional original Danish exam PDFs. Keep all files and folders together.

Answers are saved only in the current browser when storage is available. **Download your notebook before leaving.** The instructor supplies the password for answer discussions and the instructor guide.

## Teaching materials

- [Theoretical exercise](https://mutwil.github.io/biokemi2-starch-lab/#theory): five question groups on glucan structure, storage, enzyme roles, pathway maps and seedling staining.
- [Virtual lab](https://mutwil.github.io/biokemi2-starch-lab/#brief): a 105-minute investigation with the full sample matrix, protocol and TLC guidance alongside the virtual bench and plate.
- [Exam-style assignment](https://mutwil.github.io/biokemi2-starch-lab/#exam): four questions about β-amylolytic limits, with the supplied 46% potato and 43% maize values.
- [Instructor guide](https://mutwil.github.io/biokemi2-starch-lab/instructor.html): facilitation and marking notes.
- [Source and adaptation notes](SOURCES.md): provenance and scientific clarifications.
- [Written afternoon worksheet](EXERCISE.md): an optional GitHub-readable companion to the virtual lab.

## The original 15 conditions

Numbers match the manual. “Heated” refers to **60°C for 5 min before the reaction**. All reactions use **37°C for 30 min**, including those with untreated substrate.

| Substrate | Tris, untreated | Tris, heated | Saliva, untreated | Saliva, heated | Isoamylase, heated |
|---|---:|---:|---:|---:|---:|
| Glycogen | 1 | 4 | 7 | 10 | 13 |
| Potato starch | 2 | 5 | 8 | 11 | 14 |
| “Pure amylose” starch | 3 | 6 | 9 | 12 | 15 |

The four TLC standards are glucose, maltose, maltotetraose and maltoheptaose. Detection can be switched between iodine vapour and sugar staining/charring.

## Virtual lab timing · 14:00–15:45

| Time | Activity |
|---|---|
| 14:00–14:10 | Introduce substrates, enzymes and the experimental question |
| 14:10–14:30 | Predict the five conditions for the assigned substrate |
| 14:30–14:50 | Reveal samples; inspect iodine and bond-cleavage diagrams |
| 14:50–14:55 | Break |
| 14:55–15:20 | Interpret TLC using standards and both detection methods |
| 15:20–15:35 | Compare all three substrates |
| 15:35–15:45 | Review the results table and interpretation questions, then export the notebook |

## Scientific scope and provenance

The experimental matrix, pretreatment, incubation conditions and TLC standards come from `LabManual_2023-2024_Danish.docx`, Section A and its afternoon continuation. The source manual and complete slide decks are not redistributed. Selected theoretical-exercise figures and the two original Danish exam PDFs are included; see SOURCES.md. Section B, the Arabidopsis wet-lab experiment, is not included.

**The virtual lab’s analytical outputs are authored, qualitative teaching scenarios, not measured laboratory results.** Colours, migration positions and band darkness are illustrative and must not be used to estimate yields or concentrations. The small molecular sketch and the optional particle sandbox do not generate the analytical dataset.

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
| `index.html` | Full day workbook and all exercises |
| `workshop.js` | Saved answers across the day, notebook export, result reveal, TLC and molecular diagrams |
| `workshop-model.js` | Qualitative scenarios and linkage connectivity |
| `workshop.css` | Screen and print styles |
| `EXERCISE.md` | GitHub-readable afternoon lab worksheet |
| `SOURCES.md` | Source materials and scientific clarifications |
| `assets/` | Embedded theoretical-exercise figures |
| `materials/` | Original Danish exam question PDF |
| `instructor.html` | Timetable, answer notes and marking guide |
| `simulation.html` | Optional enzyme particle sandbox |
| `workshop.test.js` | Sample numbering, specificity, connectivity and scenario checks |
| `scripts/build.py` | Builds an allowlisted static site and offline ZIP |
| `.github/workflows/publish.yml` | Test, build and Pages deployment |
