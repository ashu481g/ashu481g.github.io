# IIM Lucknow Revision Portal — MVP

## Included subjects

1. FRA — Financial Reporting & Analysis
2. MANAC — Management Accounting
3. CORP FIN — Corporate Finance
4. FDRM — Financial Derivatives & Risk Management
5. HFS — Hedge Fund Strategies
6. CVR — Corporate Valuation & Restructuring
7. M&A — Mergers & Acquisitions

## Files

- `index.html` — complete front-end portal
- `subjects.json` — subject/module/video/overlap data
- `README.md` — this guide

## Dashboard enhancements included

The portal now includes the suggested next-stage revision features:

1. **Overall completion** — total modules completed and overall percentage.
2. **Subject-wise completion** — progress bar and completed/total modules for every subject.
3. **Pending Modules** — a consolidated list of unfinished modules.
4. **Revise Now Queue** — a short actionable queue drawn from pending modules.
5. **Recently Completed** — timestamped history of the most recently completed modules.
6. **Cross-Subject Overlap Map** — overlap tags remain visible rather than silently merging repeated concepts.
7. **Persistent progress** — completion status remains in browser `localStorage`.
8. **Extensible subject model** — new subjects can be added by extending `subjects.json`; the page does not require a redesign for Subject 8+.

## Source boundary

Professor PPTs/PDFs remain the primary source for determining what was taught. Internet videos are revision/learning aids and are not evidence of professor coverage.

When an overlap exists, the same concept is deliberately retained under both subjects and flagged as an overlap. This allows revision from the perspective in which each professor/course treated the topic.

## Adding Subject 8+

Add another subject object to `subjects.json` using the same structure:

```json
{
  "id": "subject8",
  "code": "SUB8",
  "name": "Subject Name",
  "modules": [
    "Module 1",
    "Module 2"
  ],
  "videos": [
    {
      "title": "Revision resource",
      "provider": "Provider",
      "url": "https://example.com",
      "type": "Supplementary",
      "note": "Why this resource is useful"
    }
  ],
  "overlaps": [
    "FRA — related topic",
    "CVR — related topic"
  ]
}
```

## Running locally

Because the page loads `subjects.json`, open it through a local web server rather than directly as `file://`.

For example, from this folder:

```bash
python -m http.server 8080
```

Then open:

`http://localhost:8080/`

## Important

The current implementation is intentionally an MVP:

- No database
- No login/authentication
- No server-side progress storage
- No automatic extraction of topics from PPT/PDF files
- No AI-generated summaries inside the portal yet

The next logical phase is to add topic-level revision notes, source/PPT references, interview questions, and an AI-assisted search/revision workflow while keeping the same JSON-driven subject architecture.
