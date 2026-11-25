# Deployment and maintenance

- Repository: https://github.com/mutwil/biokemi2-starch-lab
- Student exercise: https://mutwil.github.io/biokemi2-starch-lab/
- Instructor guide: https://mutwil.github.io/biokemi2-starch-lab/instructor.html
- Offline download: https://mutwil.github.io/biokemi2-starch-lab/data/biokemi2-starch-lab.zip

This follows the Module 4 workbook’s GitHub Actions → Pages deployment approach. The starch exercise is already static HTML, so it does not need Quarto or R.

## Edit and preview

Edit the source files at the repository root. Changes to simulated analytical results belong in `workshop-model.js`; keep their assumptions explicit in the student and instructor text.

```sh
node --test workshop.test.js
node --check workshop.js
python3 scripts/build.py
python3 -m http.server 8000 --directory _site
```

Open http://localhost:8000/. Verify the schedule links, theory selections, exam answers, reload persistence, sample reveal, both TLC modes, whole-day notebook export and printing after changing their code. The site works directly from local files too.

The build copies an explicit list of public teaching files into `_site/`, validates local links, and generates the offline ZIP. The allowlist includes selected source figures and two original Danish exam PDFs. Other source files, browser answers, screenshots and local QA outputs are not copied.

## Publish

```sh
git add index.html workshop.js workshop-model.js workshop.css instructor.html EXERCISE.md README.md
git commit -m "Describe the teaching change"
git push origin main
```

Stage any other intended source changes explicitly. Do not commit `_site/`.

The workflow runs tests and checks before deployment. Inspect the latest run:

```sh
gh run list -R mutwil/biokemi2-starch-lab --workflow publish.yml --limit 1
gh run watch RUN_ID -R mutwil/biokemi2-starch-lab --exit-status
curl -fI https://mutwil.github.io/biokemi2-starch-lab/
curl -fI https://mutwil.github.io/biokemi2-starch-lab/data/biokemi2-starch-lab.zip
```

To redeploy without editing source:

```sh
gh workflow run publish.yml -R mutwil/biokemi2-starch-lab
```

Pages is configured to use **GitHub Actions**, not a branch directory. If recreating the repository, enable Pages with GitHub Actions as its source before running the workflow.

## Teaching boundaries

Do not present the qualitative scenarios as measured results or use their darkness or migration positions for quantitative inference. Archived experimental data would need treatment labels, standards, detection method and provenance before replacing the scenarios.

Instructor answers are public. Student answers stay in browser storage and exported notebooks. Do not add student notebooks to the repository. Course announcements and student communication remain with the instructor.
