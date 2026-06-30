# assets/

Place your resume PDF here as **`resume.pdf`**.

The site's **Resume** button (hero) and **Download Resume** button (contact)
both link to `assets/resume.pdf`. Until you add the file, those buttons will
return a 404 — this is expected. It is the one placeholder you must fill before
publishing.

## How to generate `resume.pdf`

This repo's companion resume package lives in the sibling repo at
`../../resume-project/resume-building/output/`.
Export a PDF from one of the print-ready HTML layouts there:

1. Open `resume-building/output/resume-onepage.html` (or `resume-twopage.html`)
   in Chrome or Edge.
2. **Print → Save as PDF** (the `resume.css` stylesheet is tuned for this:
   0.5in margins, ATS-safe single column).
3. Save the result here as `professional-portfolio/assets/resume.pdf`.

Keep the filename `resume.pdf` so you don't have to edit the links.

> Optional: if you prefer a different filename, update the two
> `href="assets/resume.pdf"` links in `index.html` (search for
> `data-placeholder="resume"`).
