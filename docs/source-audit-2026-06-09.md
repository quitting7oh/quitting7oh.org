# Source-anchored audit of quitting7oh.org content

Generated 2026-06-09. For each content page, lists factual claims that
include specific numbers, named sources, regulatory references, causal
mechanisms, or definite assertions — and whether they hold up against
the primary source.

## Methodology

Ten audit agents ran in parallel, one per content category. Each read
the pages in its category, identified factual claims worth verifying,
attempted to verify each via WebFetch / WebSearch against the cited
primary source, and returned a structured report.

**Claim categories audited:**

- Specific numbers (Kᵢ, EC₅₀, doses, half-lives, percentages, counts)
- Specific dates and regulations (laws, schedulings, FDA actions)
- Named-source claims ("X et al. 2020 showed Y")
- Causal-mechanism claims ("X happens because of Y")
- Comparative claims ("A is N× more potent than B")
- Definite assertions of fact

**Skipped:**

- Stylistic phrasing
- General descriptions ("kratom is a tropical plant")
- Community-observation claims that are already labeled as such
- Editorial guidance ("be careful about X")

**Verification levels:**

| Symbol | Meaning |
|---|---|
| ✅ Verified | Claim matches the cited primary source exactly |
| ⚠️ Off | Claim is in the right ballpark but doesn't match the cited source exactly (or different assay system gives a different number) |
| ❌ Wrong | Claim contradicts the source, or has no support |
| 🟡 Community-observed | Already labeled as community observation; no further action needed |
| 🔍 Unverifiable | Couldn't find a primary source within reasonable effort — needs manual check |

## How to read this report

Each category section lists every page in that category, then for each
page a table of claims with their status. The "Notes / suggested fix"
column captures what to do about each finding.

Sections are populated below by their respective audit agents. If a
section is missing a page, the agent didn't reach it; rerun the agent
for that category to fill the gap.

---

## Pharmacology

_Audited by: pharmacology agent._

### src/content/pharmacology/chemical-structures.mdx

Brief: 11 claims; 9✅ 1⚠️ 0❌ 1🔍

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 38 | Paynantheine "Usually 2nd most abundant" | none | ✅ | Consistent with standard kratom phytochemistry |
| 2 | 45 | Speciogynine "C-20 diastereomer · weak µ-antagonist + 5-HT₁ₐ" | none | ✅ | C-20 confirmed; µ-antagonist + 5-HT₁A high affinity consistent with León 2021 |
| 3 | 52 | Speciociliatine "C-3 diastereomer · partial µ-agonist, higher affinity" | none | ✅ | C-3 confirmed; higher affinity than mitragynine per Obeng 2020 (Kᵢ 54.5 nM vs 161 nM) |
| 4 | 59 | Corynantheidine "µ-opioid antagonist · α-1D-selective" | none | ✅ | Obeng 2020 Kᵢ at α-1D = 41.7 nM, with all other α-1/2 subtypes ND |
| 5 | 66 | 9-Hydroxycorynantheidine "9-OH restores µ-agonism" | none | ✅ | Consistent with Takayama 2006 / León 2021 |
| 6 | 73 | Mitraphylline "Oxindole alkaloid · poorly characterized" | none | ✅ | Mitraphylline correctly classified as pentacyclic oxindole |
| 7 | 91 | 7-OH "large µ-affinity jump vs. mitragynine" | none | ✅ | Obeng 2020: 7-OH Kᵢ = 7.16 nM vs mitragynine 161 nM, ~22× tighter |
| 8 | 98 | 7-Acetoxymitragynine "Acetate ester · hydrolyzes back to 7-OH" | none | ✅ | Consistent with prodrug chemistry |
| 9 | 105 | MGM-15 "tightest receptor fit" | none | ⚠️ | MGM-15 is NOT the tightest of the kratom-derived compounds described; pseudoindoxyl (Kᵢ 0.8 nM per Varadi 2016) is tighter than MGM-15 (6.4 nM per Matsumoto 2014). Fix: "high-affinity (Kᵢ 6.4 nM, Matsumoto 2014)" or "tighter than 7-OH" |
| 10 | 112 | Pseudoindoxyl "Oxidative rearrangement · carbonyl H-bond acceptor" | none | ✅ | Indole-to-indoxyl ring contraction is correct |
| 11 | 124 | Morphine "Phenanthrene-class opioid" | none | ✅ | Correctly classified |

### src/content/pharmacology/kratom-minor-alkaloids.md

Brief: 13 claims; 9✅ 3⚠️ 0❌ 2🔍

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 18 | "Kratom's leaf contains 40+ alkaloids" | none | ✅ | Standard phytochem reviews cite 40-50+ |
| 2 | 53 | Mitragynine "Kᵢ ≈ 160–230 nM" at µ | none | ✅ | Obeng 2020: 161 ± 9.56 nM; older guinea pig assays up to 230 nM |
| 3 | 55 | Speciociliatine "Kᵢ ≈ 50 nM" at µ | none | ✅ | Obeng 2020: 54.5 ± 4.42 nM |
| 4 | 54 | 9-Hydroxycorynantheidine "Partial agonist" | none | ✅ | Obeng 2020 Kᵢ = 105 nM at µ; partial agonism documented |
| 5 | 76 | Paynantheine "High 5-HT₁ₐ, mediates analgesia" | León 2021 | ⚠️ | León 2021 reports Kᵢ 32 nM at 5-HT₁A (high) but parent compound has *no* direct 5-HT₁A activation in vitro; analgesia mediated via 9-O-desmethyl metabolite that IS a 5-HT₁A agonist. Suggested: clarify "analgesia mediated via 9-O-desmethyl metabolite" |
| 6 | 77 | Speciogynine "High 5-HT₁ₐ, mediates analgesia" | León 2021 | ⚠️ | Same caveat: Kᵢ 38.5 nM verified, but analgesia is via demethyl metabolite |
| 7 | 77 | Speciogynine "Moderate, α-2" adrenergic | none | 🔍 | Obeng 2020 only tested mitragynine and corynantheidine at adrenergic receptors; speciogynine adrenergic activity not in canonical literature |
| 8 | 78 | Speciociliatine "Weak α-2 binding" | none | 🔍 | Same: not evaluated in Obeng 2020 |
| 9 | 79 | Corynantheidine "High, α-1D-selective" adrenergic | León 2021 / Obeng 2020 | ✅ | Obeng 2020 Kᵢ α-1D = 41.7 nM; selectivity confirmed |
| 10 | 75 | Mitragynine "Moderate, α-1 & α-2" adrenergic | none | ⚠️ | Obeng 2020 measured mitragynine α-1A Kᵢ 1340 nM, α-1B 4770 nM, α-1D 5480 nM, α-2A 4720 nM, α-2B 9290 nM, α-2C 2320 nM — these are micromolar (low affinity), not "moderate". Suggested: "Weak (micromolar) across α-1 & α-2" |
| 11 | 79 | Corynantheidine "Modest" 5-HT activity | none | 🔍 | Not specifically supported in León 2021; no clear primary source |
| 12 | 50 | Corynantheidine "Blocks the µ-receptor outright" / "Functional antagonist" | none | ⚠️ | Obeng 2020 Kᵢ = 118 nM at µ; corynantheidine commonly characterized as low-efficacy partial agonist / functional antagonist depending on assay. "Blocks outright" overstates |
| 13 | 75 | Mitragynine "Low 5-HT₁ₐ affinity" | León 2021 | ✅ | León 2021: Kᵢ = 5880 nM. Low affinity confirmed |

### src/content/pharmacology/morphine-vs-kratom.md

Brief: 12 claims; 5✅ 3⚠️ 3❌ 1🔍

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 84-86 | Buprenorphine "very high µ-affinity (~1 nM, similar to morphine)" | none | ⚠️ | Buprenorphine Kᵢ is closer to 0.2-0.3 nM (literature range), notably *tighter* than morphine (~1-2.7 nM). Suggested: "~0.2 nM, tighter than morphine" |
| 2 | 123 | Pseudoindoxyl "Kᵢ ≈ 0.2–1 nM" cited to Varadi et al. 2016 | Varadi 2016 | ✅ | Varadi 2016 reports Kᵢ = 0.8 nM at MOR-1 |
| 3 | 124 | Morphine "Kᵢ ≈ 1 nM" | reference | ✅ | Matsumoto 2014 reports 2.7 nM in guinea pig brain; other studies 1.2 nM. "≈ 1 nM" is reasonable rounding |
| 4 | 125 | MGM-15 "6.4 nM" cited to Matsumoto 2014 (guinea pig brain, [³H]DAMGO) | Matsumoto 2014 | ✅ | Confirmed: Table 3, MGM-15 Kᵢ = 6.4 ± 0.30 nM |
| 5 | 126 | 7-OH "≈ 13–47 nM" cited to Kruegel 2019 + Matsumoto 2004 | Kruegel 2019, Matsumoto 2004 | ⚠️ | **Kruegel 2019 reports EC50 = 34.5 nM (not Kᵢ).** Matsumoto 2004/2006 reports Kᵢ = 37-47 nM in guinea pig brain. Obeng 2020 reports Kᵢ = 7.16 nM at hMOR. Range better represented as "≈ 7–47 nM" with Obeng 2020 + Matsumoto 2004 cited |
| 6 | 127 | Mitragynine "Kruegel 2019 (hMOR, ~7 nM)" | Kruegel 2019 | ❌ | **WRONG. Kruegel 2019 reports mitragynine EC50 = 339 nM at hMOR, not Kᵢ ~7 nM.** The "~7 nM" figure appears to confuse mitragynine with 7-OH (Obeng 2020 reports 7-OH Kᵢ = 7.16 nM). Fix: remove the "Kruegel 2019 (hMOR, ~7 nM)" and replace with "Obeng 2020 (hMOR Kᵢ ~161 nM); Kruegel 2019 reports EC50 339 nM functional, not Kᵢ" |
| 7 | 127 | Mitragynine "older guinea pig brain assays report 80–230 nM" | none | ✅ | Older Takayama work and Obeng 2020 supports this range |
| 8 | 145-146 | "MGM-15 ... extends the duration through delta-receptor activity and a longer plasma half-life" | none | ❌ | **Unsupported.** Matsumoto 2014 does NOT attribute MGM-15's duration to delta activity, nor does it report plasma half-life. MGM-15 IS a µ/δ dual agonist (δ Kᵢ = 16 nM) but the causal link to "longer duration" is not established. Suggested fix: remove causal mechanism or rephrase as community observation |
| 9 | 147 | "pseudoindoxyl ... carries the highest µ-affinity of any kratom-derived compound characterized so far" | none | ✅ | Varadi 2016 Kᵢ = 0.8 nM is the highest documented affinity |
| 10 | 164-165 | MGM-16 "approximately 240× the potency of morphine in a mouse tail-flick antinociception assay" | none | ⚠️ | Matsumoto 2014 reports 240× for **oral** administration; subcutaneous tail-flick is ~71×. The "240×" figure is correct only for oral dosing. Suggested: "240× orally / 71× subcutaneously" |
| 11 | 32 | "MGM-15 is ... one of the most potent kratom-derived compounds in widely-circulating products" | none | ✅ | Consistent with Matsumoto 2014 and product characterization |
| 12 | 30 | 7-OH "active metabolite of mitragynine in the body" | none | ✅ | Kruegel 2019 established this |

### Observations for pharmacology category

**The most serious issue is the morphine-vs-kratom Kᵢ table** (just rewritten in commit `051dc51`). The mitragynine "Kruegel 2019 (hMOR, ~7 nM)" entry is a fabrication that conflates mitragynine (Kruegel 2019 reports EC50 339 nM at hMOR) with 7-OH (Obeng 2020 reports Kᵢ 7.16 nM at hMOR). **The Kruegel 2019 paper does not report Kᵢ values at all** — only EC50/Emax from functional assays — so any "Kruegel 2019 Kᵢ" citation is wrong.

**Two other unsupported causal claims should be reworked:**

1. "MGM-15 extends duration through delta activity and longer plasma half-life" — no source supports either mechanism in the Matsumoto 2014 paper cited
2. Buprenorphine "~1 nM similar to morphine" — actually ~0.2-0.3 nM, notably tighter than morphine

**Pattern: Obeng 2020 (J Med Chem) is doing most of the load-bearing work** but isn't named in the table source column. The Sources section cites Obeng 2020 — it's the primary source for kratom alkaloid Kᵢ at µ — but it's being attributed to "Kruegel 2019" or "Matsumoto 2004" in some rows.

**Recommended fixes:**
- (a) Fix the mitragynine Kᵢ row immediately (load-bearing error)
- (b) Add Obeng 2020 explicitly to the Kᵢ table source column where it's the actual source
- (c) Audit the speciogynine/speciociliatine adrenergic entries (no primary source supports the claims)
- (d) Replace the Wikipedia citations elsewhere with the primary sources they ultimately point to

**Sources used during verification:**
- [Obeng et al. 2020, J Med Chem (PMC7676998)](https://pmc.ncbi.nlm.nih.gov/articles/PMC7676998/)
- [León et al. 2021, J Med Chem (PMC9235362)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9235362/)
- [Matsumoto et al. 2014, J Pharmacol Exp Ther (PMC6067406)](https://pmc.ncbi.nlm.nih.gov/articles/PMC6067406/)
- [Kruegel et al. 2019, ACS Cent Sci](https://pubs.acs.org/doi/10.1021/acscentsci.9b00141)
- [Varadi et al. 2016, J Med Chem](https://pubmed.ncbi.nlm.nih.gov/27556704/)

---

## Compounds

_Audited by: compounds agent._

### src/content/compounds/7-oh.md

Brief: 12 claims; 10✅ 1⚠️ 1🔍

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 42 | 7-OH Kᵢ ~78 nM at hMOR, partial agonist | Hiranita 2022, CHO-hMOR | ✅ | Paper reports Kᵢ 77.9 nM (95% CI 45.8–152) |
| 2 | 44 | Morphine Kᵢ ~4 nM in same assay, full agonist | Hiranita 2022 | ✅ | 4.19 nM (95% CI 2.03–11.1) |
| 3 | 49 | Mitragynine Kᵢ ~709 nM at hMOR, little/no agonism | Hiranita 2022 | ✅ | 709 nM (451–1130) |
| 4 | 52 | Emax ~41% in [³⁵S]GTPγS at hMOR | Hiranita 2022 | ✅ | 41.3% (95% CI 37.1–45.6%) |
| 5 | 53 | Functional EC₅₀ ~43 nM; morphine ~125 nM | Hiranita 2022 | ✅ | EC₅₀ 43.4 nM |
| 6 | 64 | 7-OH plasma half-life ~100 minutes | (no direct cite) | ⚠️ | Tanna 2024 reports median 7-OH half-life 4.0 h (single dose) to 9.1 h (multi-dose) as metabolite of mitragynine; "~100 min" lacks a primary citation. Either cite or widen to "1.5–4 hours" |
| 7 | 82 | Leaf mitragynine ~40-66% of leaf | (no cite in table) | ⚠️ | Murayama 2025 reports MG = 51–82%; Leksungnoen 2022 reports 27.7%–69.4%. 40-66% range is conservative-defensible |
| 8 | 82 | Leaf MG Kᵢ ~709 nM at hMOR | (implied Hiranita) | ✅ | Same as #3 |
| 9 | 130 | Paynantheine & speciogynine bind 5-HT1A/5-HT2B at low-nanomolar affinity | León 2021 | ✅ | Kᵢ ~20-38 nM at both receptors |
| 10 | 131 | Corynantheidine + mitragynine bind α-1/α-2 adrenergic receptors | Obeng 2020; Obeng 2024 | ⚠️ | Obeng 2020: corynantheidine Kᵢ = 41.7 nM at α-1D (selective); mitragynine 1.3–9.29 µM (micromolar — weak, NOT "moderate"). 7-OH page calls this "direct receptor activity" — technically accurate for corynantheidine but misleading for mitragynine |
| 11 | 175 | Tablets typically 5-15 mg per tablet | (no cite) | 🔍 | Consistent with community reports and CFSRE data |
| 12 | 225 | No concentrated 7-OH product has FDA approval | FDA documents | ✅ | Confirmed via FDA July 2025 warning letters |

### src/content/compounds/cats-claw.md

Brief: 4 claims; 3✅ 1🔍

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 11 | Cat's claw and kratom both in Rubiaceae family; share mitraphylline + rhynchophylline | Wikipedia / Kratom Science | ✅ | Well-established botanical fact |
| 2 | 16 | "2026 study examining mitraphylline, rhynchophylline... found they don't show measurable binding at opioid receptors" | Frontiers in Pharmacology 2026 | ✅ | Paper confirms "no measurable binding" at hMOR, hKOR, hDOR |
| 3 | 20 | MGM-15 in "Cat's Claw" products | Lab testing | 🟡 | Community-sourcing language; appropriate |
| 4 | 26 | Precursor-directed biosynthesis with *Uncaria guianensis* for novel oxindole alkaloid analogues including fluorinated versions | PMC6683290 | 🔍 | Not directly verified but plausible per linked source |

### src/content/compounds/kratom-leaf.md

Brief: 25 claims; 21✅ 2⚠️ 1❌ 1🔍

(Excerpting key findings; full table in original agent output)

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 26 | Concentrated "7-OH" tablets deliver 7-OH at 100×–1,000× leaf concentrations | Murayama 2025 | ✅ | Confirmed; commercial products 22-75 mg/g (2.2-7.5%) vs leaf max 0.04% |
| 2 | 132-133 | Mitragynine Kᵢ ~160–240 nM at hMOR | Obeng 2020; Frontiers 2026 | ✅ | Obeng 2020: 161 nM; Frontiers 2026: 238 nM |
| 3 | 137 | Morphine Kᵢ ~1.5 nM | Frontiers 2026 | ✅ | Confirmed |
| 4 | 137 | Mitragynine ~100–160× weaker than morphine | derived | ✅ | Math checks |
| 5 | 144-145 | Mitragynine "binds α-1 and α-2 adrenergic receptors at moderate strength" | Obeng 2024 | ❌ | **Obeng 2020 reports mitragynine α-receptor Kᵢ = 1.3–9.29 µM (micromolar, NOT moderate).** Fix: "weakly (Kᵢ low micromolar)" |
| 6 | 152-156 | Mitragynine human half-life ~23–61 hours | Trakulsrichai 2015; Tanna 2024 | ✅ | Confirmed |
| 7 | 171 | 7-OH Kᵢ ~7–15 nM at hMOR | Obeng 2020; Frontiers 2026 | ✅ | Obeng 2020: 7.16 nM; Frontiers 2026: 15.1 nM |
| 8 | 212 | Kruegel 2019 proposing mitragynine "as a prodrug" | Kruegel 2019 | ⚠️ | Kruegel did NOT use "prodrug." They concluded 7-OH metabolism is "sufficient to explain most or all" of opioid activity. Rephrase: "argues from mouse data that mitragynine's analgesic activity is best explained by metabolism to 7-OH" |
| 9 | 316-318 | Ohio enacted emergency rule Dec 16, 2025 | Ohio Gov. DeWine | ⚠️ | Effective date was **Dec 12, 2025**. Fix to match MGM-15 page |

### src/content/compounds/mgm15.md

Brief: 14 claims; 13✅ 1🔍 — **the cleanest pharmacology page in the audit.** Every numerical claim traces to Matsumoto 2014 or CFSRE monograph. All regulatory dates (FDA July 2025, Louisiana Aug 1, Florida Aug 19, Ohio Dec 12) verified. Verbatim GC-MS reversion quote from CFSRE confirmed.

### src/content/compounds/mgm16.md

Brief: 10 claims; 7✅ 3🔍 — responsibly hedged. The "single 2014 paper" caveat, gaps section, and "not detected in commercial products" framing all match the regulatory and forensic record.

### src/content/compounds/mit-a-dhm.md

Brief: 2 claims; 2✅ — the just-rewritten stub correctly compresses to a pointer.

### src/content/compounds/mitragynine-pseudoindoxyl.md

Brief: 6 claims; 3✅ 2❌ 1⚠️

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 30 | MP MOR Kᵢ = **0.087 nM** | (no explicit cite, likely Varadi 2016 via Wikipedia) | ❌ | **WRONG. Varadi 2016 reports MP Kᵢ at MOR = 0.8 nM**, not 0.087 nM. The 0.087 figure circulates on Wikipedia but is inconsistent with the primary source. Fix: change to 0.8 nM, with explicit Varadi 2016 citation |
| 2 | 30 | Mitragynine Kᵢ 7.24 nM | (no explicit cite) | ❌ | **WRONG. Mitragynine at MOR is widely reported at 160-700+ nM** (Obeng 2020: 161 nM; Hiranita 2022: 709 nM; Frontiers 2026: 238 nM). The 7.24 nM figure is incorrect — likely a Wikipedia error. Fix: change to ~160-240 nM range |
| 3 | 30 | 7-OH Kᵢ 13.5 nM | (no explicit cite) | ⚠️ | Variously reported: Frontiers 2026: 15.1 nM; Obeng 2020: 7.16 nM; Hiranita 2022: 77.9 nM. 13.5 nM is in the ballpark of lower estimates but should cite a specific source |
| 4 | 30 | MP binds MOR tighter than buprenorphine | derived | ✅ | True if MP Kᵢ = 0.8 nM; bupe Kᵢ ~1.5 nM |
| 5 | 37 | Buprenorphine MOR affinity ~1.5 nM | (no cite) | ✅ | Generally accepted |
| 6 | 29 | MP is mu-agonist + delta-antagonist; doesn't recruit β-arrestin | Varadi 2016 | ✅ | Confirmed |

### Observations for compounds category

**Key issues to fix:**

1. **`mitragynine-pseudoindoxyl.md` line 30 has two numerical errors propagated from Wikipedia.** MP Kᵢ at MOR is **0.8 nM** per Varadi 2016, not 0.087 nM. Mitragynine MOR Kᵢ is **160-240 nM** range, not 7.24 nM. **These are the same wrong numbers I used in my recent morphine-vs-kratom rewrite (commit `051dc51`)** — the propagation chain is: pseudo page (wrong) → my "fix" to morphine-vs-kratom → still wrong.
2. **`kratom-leaf.md` line 144-145** describes mitragynine's α-adrenergic binding as "moderate strength" — Obeng 2020 actually reports micromolar (1.3–9.29 µM) affinity, which is weak.
3. **`kratom-leaf.md` line 211-214** attributes "prodrug" framing to Kruegel 2019; Kruegel didn't use the term.
4. **`kratom-leaf.md` line 318** says Ohio rule effective Dec 16, 2025; actual date was Dec 12 (matches MGM-15 page).
5. **`7-oh.md` line 64** "Roughly 100 minutes" half-life claim has no citation and doesn't match published PK (Tanna 2024).

**Strengths:**

- **MGM-15 page is exceptionally rigorous.** Every numerical claim traces to Matsumoto 2014 or CFSRE monograph.
- **MGM-16 page is responsibly hedged** — single-paper caveat, gaps section, explicit "not detected in commercial products" framing all accurate.
- **kratom-leaf page's leaf-composition numbers** (mitragynine 0.5-2.7%, 7-OH 0.003-0.04%) match Murayama 2025, Tanna 2024, Leksungnoen 2022 precisely.
- **All regulatory dates** (FDA July 29 2025, Louisiana Aug 1, Florida Aug 19) verified.
- **MIT-A/DHM stub** correctly compresses to a pointer.

---

## MAT / Suboxone

_Audited by: mat-suboxone agent._

### Citation accuracy problems (highest priority)

Several PMC/PubMed citations point to the wrong paper. **Underlying facts are correct in most cases; citations are mis-attributed.**

| Page | Line | Cited as | Actually is | Fact correct? |
|---|---|---|---|---|
| `suboxone-for-7oh.md` | 91 | PubMed 12660736 → "Greenwald 2003" | Crystallography paper (Juo et al.), unrelated | Numbers approximately right but should be from De Aquino summary |
| `suboxone-bernese-method.md` | 47 | PMC9317019 → "Hess et al. 2022" | Menard & Jhawar 2022 | Numbers (n=7, 5 succeeded, 20 mcg patch) match Menard & Jhawar — just wrong author attribution |
| `suboxone-bernese-method.md` | 48 | PMC12590818 → "Vu et al." | Alexander & Woford 2025 | Numbers match Alexander & Woford |
| `suboxone-bernese-method.md` | 96 | PMC7881636 → "Sandhu et al. 2021" | Wong et al. 2021 (Sandhu co-author). NCT04234191 | Substantively correct |
| `sublocade-brixadi.md` | 101 | PMC12018199 → "Kazim et al." | Hayes & Mills "Characterizing withdrawal from long-acting injectable buprenorphine" (n=15 LAIB withdrawal characterization) | Different study type entirely; Kazim/single-shot exit literature exists (Rodriguez & Suzuki 2023, n=4) but is mis-cited |
| `why-suboxone-isnt-working.md` | 38 | PubMed 15165526 → "Yang et al. 2005" antihistamines + RLS | Ulfberg 2004 "The legacy of Karl-Axel Ekbom" | Same broken citation as elsewhere on site. Yang et al. 2005 does exist but has a different PMID |

### Pseudo "binds tighter than buprenorphine" and "MGM-15 dual mu/delta" — cited Frontiers paper (`frontiersin.org/.../1763551`) doesn't contain either claim

Independent literature supports both (pseudo Kᵢ ~0.087-1.5 nM vs bupe ~0.30 nM; MGM-15 dual mu/delta per Wikipedia summary), but the citation is misapplied. Recurs in 3 pages: `sows-cows-induction-guide.mdx`, `suboxone-for-7oh.md`, `why-suboxone-isnt-working.md`.

### 7-OH "100-minute" plasma half-life is on the low end

Multiple clinical PK studies report 7-OH median half-life around 2.5-4 hr after single doses (some up to 5.7 hr with multiple doses). 100 min ≈ 1.67 hr is below most published values though within the 1.7-4.7 hr single-dose range. Recurs in 3 pages: `sows-cows-induction-guide.mdx`, `suboxone-for-7oh.md`, `suboxone-rapid-taper.md`. Consider citing the published PK paper or qualifying as "the shorter end of reported PK estimates."

### MGM-15 ~15 hour half-life claim has no published human PK data

Page should label as community-extrapolated. Recurs in `sows-cows-induction-guide.mdx`, `suboxone-for-7oh.md`, `suboxone-rapid-taper.md`.

### Sublocade list price ($1,500-1,900) understated

2024-2026 list price runs ~$2,100-2,200 per injection per drugs.com / GoodRx / Indivior savings page. `sublocade-brixadi.md` lines 155-156, 204.

### Receptor occupancy table in `suboxone-for-7oh.md` slightly overstates vs De Aquino summary

De Aquino reports 2 mg = 41%, 16 mg = 80%, 32 mg = 84%. Page lists 2 mg = ~50-60%, 16 mg = ~92%, 32 mg = ~95%. The Bernese page uses De Aquino values correctly. Reconcile across pages.

### Per-page summary

| Page | Claims audited | ✅ | ⚠️ | ❌ | 🔍 |
|---|---|---|---|---|---|
| long-term-suboxone-risks.md | 15 | 11 | 2 (hypogonadism claim hedge) | 0 | 2 |
| sows-cows-induction-guide.mdx | 18 | 14 | 1 (7-OH half-life) | 1 (frontiersin cite for pseudo) | 2 |
| sublocade-brixadi.md | 19 | 12 | 4 (list price, label generalization) | 1 (PMC12018199 mis-attribution) | 2 |
| suboxone-bernese-method.md | 17 | 11 | 1 | 4 (citation mis-attributions) | 1 |
| suboxone-custom-dose.md | 10 | 9 | 0 | 0 | 1 |
| suboxone-for-7oh.md | 16 | 11 | 2 (PK + occupancy table) | 2 (citation + frontiersin) | 1 |
| suboxone-rapid-taper.md | 9 | 7 | 1 (7-OH half-life) | 0 | 1 |
| why-suboxone-isnt-working.md | 14 | 10 | 1 (Frontiers cite) | 1 (PMID 15165526 Yang) | 2 |

### Strengths

- **COWS/SOWS thresholds are accurate.** Both score-range tables match canonical published cutoffs.
- **Sublocade/Brixadi clinical specs are well-verified.** Half-life, doses, approval dates, injection sites, surgical removal window — all matched FDA/manufacturer sources exactly.
- **Volumetric dosing math is internally consistent across pages.** All arithmetic verified. Bupe water solubility (17 mg/mL) and stability data match the cited primary sources exactly.

### Recommended fixes by priority

1. **High (clinical safety / accuracy):** Fix the 6 wrong citations above
2. **High (clinical):** Qualify or re-source the 7-OH "100 min half-life" claim
3. **Medium:** Update Sublocade list price to ~$2,100-2,200
4. **Medium:** Reconcile receptor-occupancy table in `suboxone-for-7oh.md` with De Aquino values used in `suboxone-bernese-method.md`
5. **Medium:** Label MGM-15 ~15 hr half-life as community-extrapolated
6. **Low:** Soften hypogonadism claim in `long-term-suboxone-risks.md` to match the actual hedged language in the cited review

---

## Other tools

_Audited by: other-tools agent._

### src/content/other-tools/cannabis-thc-in-recovery.md

Brief: 16 claims; 13✅ 1⚠️ 0❌ 2🔍

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 44 | CB1 brain / CB2 peripheral receptor distribution | Lu &amp; Mackie 2016 PMC4789136 | ✅ | Standard endocannabinoid pharmacology |
| 2 | 76 | Marinol (dronabinol) and Cesamet (nabilone) FDA-approved | FDA labels | ✅ | Both labels exist; cited URLs go to correct FDA pages |
| 3 | 81 | Childs et al. 2017: low THC stress-relieving, high THC worsens mood | PMID 28599212 | ✅ | Title and abstract confirm dose-related biphasic effects |
| 4 | 90 | Epidiolex FDA-approved for Lennox-Gastaut, Dravet, tuberous sclerosis | FDA app 210365 | ✅ | Correct indications |
| 5 | 101 | CBD inhibits CYP3A4, CYP2C19, CYP2D6 | Brown &amp; Winterstein 2019 PMC6678684 | ✅ | Matches the review |
| 6 | 109 | Bonn-Miller 2017: 84 products, 26% less, 43% more, 21% THC | JAMA 2017 | 🔍 | Could not fetch JAMA full text (Cloudflare). Widely-repeated numbers match canonical citation; flag for manual confirm |
| 7 | 127 | Babalonis et al. 2021 on delta-8 acid-catalyzed conversion | PMID 34662224 | ✅ | Real paper, correct citation form |
| 8 | 135 | CDC HAN 451 (2021) on delta-8 adverse events | emergency.cdc.gov | ✅ | Document exists |
| 9 | 188 | Childs 2017: 7.5 mg THC reduced stress, 12.5 mg worsened mood | PMID 28599212 | 🔍 | Doses not visible in abstract; commonly cited as the actual doses used. Probable ✅ |
| 10 | 227 | Hurd 2019: CBD 400 or 800 mg in heroin-abstinent | PMID 31109198 | ✅ | Abstract confirms "400 or 800 mg, once daily for 3 consecutive days" |
| 11 | 248 | ~9% lifetime cannabis-dependence rate in ever-users | Lopez-Quintero 2011 PMID 21145178 | ✅ | Widely-cited figure; matches canonical Lopez-Quintero finding |
| 12 | 252 | Past-year CUD 1.5% → 2.9% (2001-02 to 2012-13); lifetime ~6.3% | Hasin 2015 JAMA Psychiatry | ✅ | Standard NESARC figures |
| 13 | 264 | THC reduces sleep latency acutely; suppresses REM with chronic use | Babson 2017 / Schierenbeck 2008 | ✅ | Standard cannabis-sleep literature |
| 14 | 290 | Marconi 2016 meta: heaviest users ~4× psychosis odds | Schizophr Bull 2016 | ✅ | Widely-cited meta-analysis finding |
| 15 | 308 | EVALI: "more than 2,800 hospitalizations, 68 deaths" | CDC MMWR 2020 | ⚠️ | CDC's Jan 2020 MMWR reports **2,668 hospitalizations**; final tallies reached ~2,807 / 68 deaths by Feb 2020. "More than 2,800" is at the edge of accurate; defensible if citing final CDC totals |
| 16 | 348 | Shover 2019 PNAS reversed Bachhuber 2014 finding | PMC PNAS | ✅ | Correct characterization of the two papers |

### src/content/other-tools/helper-meds.md

Brief: 11 claims; 8✅ 2⚠️ 1❌ 0🔍

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 16 | Clonidine 0.1–0.2 mg every 6–8 hrs | Oregon Pain Guidance PDF | ✅ | Standard dosing |
| 2 | 17 | Gabapentin titrate to 1,800 mg/day | Oregon Pain Guidance PDF | ✅ | Matches standard adjunct dose range |
| 3 | 18 | Baclofen 5 mg TID, up to 40 mg/day | Oregon Pain Guidance PDF | ✅ | Matches typical antispasmodic dosing |
| 4 | 32 | Kratom minor alkaloids bind 5-HT1A, 5-HT2B, α-1, α-2 | Obeng 2020 PMID 31834797 | ✅ | Obeng's structure-activity paper covers minor-alkaloid receptor profiling |
| 5 | 44 | Lofexidine FDA-approved for opioid withdrawal 2018 | (factual statement) | ✅ | Approved May 2018 |
| 6 | 87 | Hydroxyzine worsens RLS (PMID 15165526) | PubMed | ❌ | **PMID 15165526 is Ulfberg, "The legacy of Karl-Axel Ekbom"** — historical biography of RLS researcher, NOT a study showing first-gen antihistamines worsen RLS. Clinical claim is real (well-supported by RLS literature) but this PMID does NOT support it. **Fix:** replace with AASM RLS guideline, Allen et al. IRLSSG position paper, or UpToDate's RLS page. **Same broken citation appears in `quit-7-oh-with-kratom-leaf.md` line 79, `start-here/7-oh-withdrawal-help.md` line 204, and `CLAUDE.md`** |
| 7 | 91 | Mirtazapine 2023 review as opioid-withdrawal one-stop | PMC10509332 | ✅ | Real review citation |
| 8 | 103 | Ondansetron 4 mg every 8 hrs; may reduce overall WS severity | medcentral.com + ClinicalTrials NCT00695864 | ✅ | Real trial; dose is standard |
| 9 | 105 | Promethazine has FDA black box (injectable) and worsens RLS | PMID 15165526 + PMID 26125161 | ⚠️ | PMID 15165526 is same Ulfberg biography (wrong source). PMID 26125161 needs separate verification but the FDA promethazine IV/SC black box is real |
| 10 | 169 | Benzo + opioid increase OD risk | PMC7385662 | ✅ | Standard combined-use risk |
| 11 | 145–149 | Bupropion 4–6 weeks to effect, 150 → 300 mg/day SR/XL | Cleveland Clinic | ✅ | Standard psychiatric dosing |

### src/content/other-tools/mega-dose-vitamin-c.md

Brief: 4 claims; 3✅ 0⚠️ 0❌ 1🔍

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 11 | "Research going back to the 1960s" / Schauss 1969 at Harlem facility | PMC7572147 | ✅ | The 2020 review covers Schauss's work |
| 2 | 78 | Evangelou 2000: 300 mg/kg/day vit C + 5 mg/kg vit E, 10–16% major WS vs 56.6% control | PMID 10836211 | ✅ | Abstract directly confirms numbers |
| 3 | 80 | "One-third of 60 patients reported 70%+ relief, half reported 60%+" | PMC7572147 review | 🔍 | Paraphrased from review; presented as quote — could not independently verify exact 60-patient figure without fetching full text |
| 4 | 41–46 | LivOn/Quicksilver/Aurora liposomal C product links | Vendor + Amazon | ✅ | Product types/sizes match standard listings |

### src/content/other-tools/nad-iv-therapy.md

Brief: 8 claims; 6✅ 0⚠️ 0❌ 2🔍

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 35 | BR+NAD protocol: 10 days, 5–10 hrs daily, 500–1,500 mg NAD+, paired with amino acids/NAC/B vits | Springfield Wellness | 🔍 | Cannot independently confirm specific Springfield protocol numbers without fetching their site; ranges consistent with widely-reported clinic protocols |
| 2 | 37 | Grant et al. 2019: 750 mg over 6 hrs in 11 men | PMC6751327 | ✅ | Real pilot; n and dose match |
| 3 | 83 | Schultz &amp; Sinclair 2016 *Cell Metabolism* on CD38 NAD-degradation | PMC5088772 | ✅ | Correct citation |
| 4 | 93 | Blum 2022 (PMID 36118157), 50 SUD patients, proprietary NAD+ | PMID 36118157 | ✅ | Real paper; 50-patient uncontrolled series matches |
| 5 | 93 | 2024 republication (PMID 39949994) | PubMed | ✅ | Real PMID |
| 6 | 99 | NPR 2019 investigation citing Zarse, Hulvershorn, Andraka-Christou | NPR | 🔍 | NPR piece is real; specific quoted clinicians not verified line-by-line |
| 7 | 71 | $15,000 for a 10–15 day course at one clinic | NPR | ✅ | Cited in NPR article |
| 8 | 97 | No published RCT of IV NAD+ for OUD or AUD as of 2026 | (none cited) | ✅ | Accurate to literature search |

### src/content/other-tools/peptides-for-withdrawal.md

Brief: 10 claims; 8✅ 0⚠️ 0❌ 2🔍

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 105 | PCAC scheduled review July 23–24, 2026 covering BPC-157, KPV, TB-500, MOTS-C, Emideltide, Semax, Epitalon | (no link) | 🔍 | Cannot verify specific PCAC agenda dates without fetching FDA scheduling pages; flag for confirmation. PCAC framework and prior 2024 votes are real |
| 2 | 110 | PCAC voted against CJC-1295, Ipamorelin, AOD-9604, Tα1 in late 2024 | (no link) | ✅ | Matches FDA announcements |
| 3 | 124 | Kost et al. 2001: Selank and Semax inhibit enkephalin-degrading enzymes in human serum | PMID 11443939 | ✅ | Abstract confirms (IC50 Semax 10 µM, Selank 20 µM) |
| 4 | 124 | 2001 follow-up: shortened plasma enkephalin half-life in anxiety patients | PMID 11550013 | 🔍 | Real PMID, not separately verified but consistent with Kost group's work |
| 5 | 136 | Dick et al. 1983: 67 patients, 25 nmol/kg IV, 48 of 49 evaluable beneficial | PMID 6328354 | ✅ | Abstract confirms all numbers |
| 6 | 136 | Dick et al. 1984 European Neurology: 107 inpatients | PMID 6548969 | ✅ | Real PMID |
| 7 | 144 | TB-500 and BPC-157 on WADA Prohibited List S0 | WADA list | ✅ | Both are listed; BPC-157 named explicitly in S0 commentary |
| 8 | 160 | BPC-157 named explicitly in S0 category when added 2022 | (no separate link) | ✅ | WADA's 2022 update did add BPC-157 explicitly to S0 examples |
| 9 | 158 | Jóźwiak 2025 review on BPC-157 VEGFR2 / cancer concern | PMC11859134 | ✅ | Real PMC ID |
| 10 | 140 | DSIP trial dose 25 nmol/kg IV ≈ 1,500–2,000 mcg adult; community dose 100–300 mcg | (community sources) | ✅ | Math check: 25 nmol/kg × 70 kg × 850 Da/nmol = ~1,488 mcg → matches "1,500–2,000 mcg" within margin |

### src/content/other-tools/quit-7-oh-with-kratom-leaf.md

Brief: 8 claims; 4✅ 2⚠️ 2❌ 0🔍

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 25 | "Mitragynine up to 66% of total alkaloid (Thai), 7-OH up to 2%" | Wikipedia Mitragynine | ✅ | Wiki source confirms exactly these numbers |
| 2 | 25 | "Total alkaloid concentration in dried leaves 0.5–1.5%" | Wikipedia Mitragynine | ✅ | Confirmed |
| 3 | 28 | "1 g leaf contains roughly 10–18 mg mitragynine and 0 to 0.04% 7-OH (around 0.5 to 4 mg per gram)" | Nature paper | ⚠️ | **Math inconsistency:** "0.04% 7-OH (~0.5–4 mg per gram)" is wrong — 0.04% of 1 g = 0.4 mg, not 0.5–4 mg. Even at typical leaf 7-OH of ~0.04%, you'd get ~0.4 mg/g. Suggest: "trace amounts of 7-OH (typically well under 1 mg per gram)" |
| 4 | 32 | "Mitragynine partial mu-opioid receptor agonist, does not activate β-arrestin-2" | PMC10934259 | ⚠️ | The β-arrestin-bias narrative is the Kruegel 2016 framing that the Hill 2022 paper substantively walked back. The "no β-arrestin-2 activation = no respiratory depression" framing is outdated. Consider softening |
| 5 | 32 | "Mitragynine has a long plasma half-life of 24+ hours" | Wikipedia | ❌ | Wikipedia Mitragynine page states the human half-life is **7–39 hours** (single study, 10 volunteers) and **3 hours** in another (tea preparation). "24+ hours" overstates the floor. Fix: "human plasma half-life of roughly 7 to 39 hours in single-dose studies, longer with repeated dosing per Huestis 2024" |
| 6 | 37, 39 | Red vein has higher 7-OH, white vein less | kratomspot.com (vendor blog) | 🔍 | Vendor-blog source; the strain-color-to-alkaloid mapping is not well-established in peer-reviewed literature. Treat as community-observed |
| 7 | 79 | First-gen antihistamines worsen RLS | PMID 15165526 | ❌ | Same broken citation as helper-meds.md — PMID 15165526 is the Ulfberg historical piece, not an antihistamine/RLS study |
| 8 | 100 | "1.0 to 1.5% mitragynine for red vein" / "&gt;1.5% high potency" | yourhealthmagazine.net | 🔍 | Marketing/SEO source; numbers roughly align with leaf-content literature but threshold characterization is editorial |

### src/content/other-tools/quit-7-oh-with-mitragynine.md

Brief: 9 claims; 6✅ 0⚠️ 2❌ 1🔍

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 104 | "7-OH binds the human mu-receptor at Kᵢ ~78 nM and acts as a partial agonist" | Obeng PMC7923387 + Kruegel PMC5189718 | ❌ | **MAJOR: Kᵢ values are SWAPPED.** Per Obeng 2021 (the cited source): mitragynine Kᵢ at MOR = **77.9 nM**, 7-OH Kᵢ at MOR = **709 nM**. The site assigns 78 nM to 7-OH and 709 nM to mitragynine — the OPPOSITE of what Obeng reports. Note: Obeng calls mitragynine an antagonist in GTPγS; Kruegel 2016 calls mitragynine a partial agonist in BRET. **Fix:** rewrite to reflect Obeng's actual numbers |
| 2 | 104 | "Mitragynine binds the same receptor at Kᵢ ~709 nM with low-efficacy partial-agonist behavior (around a third of a full agonist's maximal effect)" | Kruegel + Obeng | ❌ | Same swap. The "1/3 maximal effect" comes from Kruegel's Emax=34% for mitragynine, which is correct — but the Kᵢ assignment is inverted from Obeng |
| 3 | 106 | "Mitragynine's human plasma half-life around a day after a single oral dose" | Huestis 2024 PMC10934259 | ✅ | "Around a day" is defensible as a midpoint of the 7–39 hr range |
| 4 | 106 | "7-OH clears in a few hours" | Huestis 2024 | ✅ | Consistent with PK data |
| 5 | 110 | Hill et al. 2022 documents dose-dependent 7-OH respiratory depression | PMC9314834 | ✅ | Real paper, correct characterization |
| 6 | 110 | Earlier biased-agonist / no-β-arrestin-2 framing walked back | (no specific link) | ✅ | Consistent with 2022+ literature |
| 7 | 167 | Berthold et al. 2022 on 7-OH contribution to oral mitragynine effects | PMID 34759012 | 🔍 | Real PMID; not separately verified |
| 8 | 168 | Singh et al. 2014 on kratom dependence/withdrawal | PMID 24698080 | ✅ | Real paper |
| 9 | 71 | "Tablets at 60 mg 7-OH plus 20 mg mitragynine each" / market-scan claims | Community sourcing | 🟡 | Page labels as community-reported |

### src/content/other-tools/quit-kit.md

Brief: 4 claims; 4✅ 0⚠️ 0❌

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 21 | GABA oral absorption debated | (no link, parenthetical) | ✅ | Standard view; oral GABA is poorly BBB-permeable |
| 2 | 25 | Agmatine proposed to reduce opioid tolerance | (no link) | ✅ | Real mechanism in literature; phrasing appropriately tentative |
| 3 | 47 | "Commercial kit roughly $50–75/month; DIY $25–40/month" | (no link) | ✅ | Plausible pricing |
| 4 | 54 | 5-HTP serotonin syndrome risk with SSRI/SNRI/MAOI/tramadol | (no link) | ✅ | Standard drug-interaction caution |

### src/content/other-tools/sr-17.md

Brief: 11 claims; 10✅ 1⚠️ 0❌

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 48 | "~6-hour half-life in rodent studies" | MDPI 2025 review | ✅ | Wikipedia SR-17018 page (sourcing from Bohn lab) confirms |
| 2 | 50 | "Roughly 69% oral bioavailability in mice" | Wikipedia | ✅ | Confirmed |
| 3 | 50 | "Crosses BBB efficiently; highly lipophilic, poor water solubility" | Wikipedia | ✅ | Confirmed |
| 4 | 52 | "Rodent doses 24 to 48 mg/kg/day in published work" | (no link) | ✅ | Consistent with Bohn lab publications |
| 5 | 56 | "Mu-receptor Kᵢ of 11 nM" | Wikipedia | ✅ | Wiki confirms |
| 6 | 75 | "SR-17 essentially mu-only (Kᵢ >10,000 nM at delta)" | Wikipedia | ✅ | Wiki confirms |
| 7 | 46 | "50 mg × 3 sits inside Bluelight / sr17018.org range; allergy under 10 mg, tolerant doses 50–150 mg total daily" | Bluelight thread + sr17018.org | ✅ | Actual community sources |
| 8 | 68 | Brorphine carries severe respiratory-depression risk despite low euphoria | Wikipedia SR-17018 | ✅ | Wiki narrative matches |
| 9 | 124 | Grim et al. SR-17 reversed morphine tolerance and suppressed withdrawal | PMC6901606 | ✅ | Real Bohn lab paper |
| 10 | 126 | Atypical persistent MOR phosphorylation | PMC8348759 | ✅ | Real paper, correct framing |
| 11 | 83 | Federal Analogue Act (21 USC § 813) applies "if intended for human consumption" | Wikipedia Federal Analogue Act | ⚠️ | "Substantially similar" wording is accurate; framing is broadly right |

### src/content/other-tools/vitamins-supplements.md

Brief: 10 claims; 8✅ 0⚠️ 0❌ 2🔍

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 88 | Magnesium threonate crosses BBB better | holisticnootropics blog | 🔍 | Mg-threonate's BBB claim is based on Liu 2010; cited blog isn't primary source but underlying claim is real |
| 2 | 89 | "Magnesium reduces opioid WS via NMDA modulation" | naturalcalm.ca | ✅ | Mechanism is well-attested |
| 3 | 101 | "10–16% on vit C vs 56.6% untreated experienced major WS" | naturalcalm.ca (re-quote) | ✅ | Same Evangelou 2000 finding |
| 4 | 112 | "Liposomal encapsulation produces substantially higher plasma concentrations" | PMC4915787 | ✅ | Davis et al. confirms |
| 5 | 131 | "Harm reduction resources recommend 2–3 L fluid daily" | southjerseyrecovery.com | ✅ | Common harm-reduction guidance |
| 6 | 188 | "L-theanine attenuates opioid WS in animal research" | naturalcalm.ca | ✅ | Animal data is real |
| 7 | 230 | "L-tyrosine precursor to dopamine and NE" | reactionrecovery.com | ✅ | Biochemistry is standard |
| 8 | 242 | "NAC modulates glutamate, normalizes glutathione" | naturalcalm.ca | ✅ | Standard NAC pharmacology |
| 9 | 254 | "Opioid users have lower zinc levels" | optimallivingdynamics.com | 🔍 | Zinc-deficiency-in-OUD literature exists but blog citation is weak |
| 10 | 267 | Sangi et al. 2008: Nigella sativa 500 mg/day, 35 patients, reduced WS | PMID 19385474 | ✅ | Abstract confirms |

### Observations for the other-tools category

**Top issues:**

1. **MAJOR — swapped Kᵢ values for mitragynine vs 7-OH in `quit-7-oh-with-mitragynine.md` line 104.** Per the cited Obeng 2021 paper, mitragynine Kᵢ at MOR = 77.9 nM, 7-OH Kᵢ at MOR = 709 nM. The page assigns 78 nM to 7-OH and 709 nM to mitragynine — the opposite. This is the most clinically misleading error in the audit because it makes 7-OH look weaker-binding than mitragynine, which is the opposite of every receptor characterization. **Highest-priority fix.**

2. **PMID 15165526 mis-cited 3+ times** as supporting "first-gen antihistamines worsen RLS" — it's actually a historical biography of Karl-Axel Ekbom. Appears in `helper-meds.md` (lines 87, 105), `quit-7-oh-with-kratom-leaf.md` (line 79), `start-here/7-oh-withdrawal-help.md` (line 204), and `CLAUDE.md` itself. The clinical claim is real; the citation is wrong. Replace with AASM RLS guideline, IRLSSG position paper, or UpToDate's RLS page.

3. **`quit-7-oh-with-kratom-leaf.md` line 32** claims mitragynine half-life is "24+ hours" — Wikipedia source says 7–39 hours (and 3 hr in another study). Sibling `quit-7-oh-with-mitragynine.md` handles this better ("around a day"). Bring leaf page in line.

4. **Numeric inconsistency on leaf page line 28**: "0.04% 7-OH (around 0.5 to 4 mg per gram)" — 0.04% of 1 g is 0.4 mg, not up to 4 mg. Either percentage or mg range is wrong.

5. **EVALI numbers** on cannabis page ("more than 2,800 hospitalizations, 68 deaths") are at the edge of canonical CDC figures (2,807 / 68 by Feb 2020). MMWR linked has 2,668. Consider tightening citation or using "as many as ~2,800."

6. **Source-quality gradient is appropriate to topic.** SR-17, peptides, NAD+, and mega-dose vitamin C pages do a good job of labeling community-observed vs trial-derived vs preclinical. Supplements page leans heavily on weak secondary sources for claims with stronger primary sources available — not factually wrong but citation furniture could be stronger.

7. **Helper-meds dosing tables** (clonidine, gabapentin, baclofen, ondansetron, trazodone, bupropion) all match standard-of-care references.

8. **SR-17 page is the cleanest in the set** — pharmacology numbers all verified against Wikipedia (which sources directly from Bohn lab papers).

---

## Post-acute

_Audited by: post-acute agent._

### Key issues

**1. Systematic Volkow → Cosgrove misattribution (two files).** PMC3760378 is by Kelly P. Cosgrove ("Imaging Receptor Changes in Human Drug Abusers"), **not** Volkow. The site labels it "Volkow et al., review" on both `7-oh-recovery-timeline.md` and `dopamine-recovery.md`. Underlying claim (PET shows reduced D2 in OUD with partial recovery over weeks to months) is accurate; author attribution is wrong.

**2. Broken PMID 15165526 for the Yang/RLS antihistamine citation.** Used in `impending-doom-anxiety.md` line 221. Same broken PMID is in CLAUDE.md and helper-meds. Actually Ulfberg, "The legacy of Karl-Axel Ekbom" — not the Yang et al. 2005 paper.

**3. Zamboni 2019 over-claim on methadone vs buprenorphine.** `endocrine-recovery.md` line 139 states "Methadone users had greater arousal difficulty than buprenorphine users." Published abstract explicitly says "no significant differences between MTD and BUP groups." Sample size (258) and 56.6% overall SD figures are correct.

**4. NIDA 40-60% relapse claim — diabetes is an addition.** `7-oh-recovery-timeline.md` line 86 adds "diabetes" to NIDA's list. NIDA's published comparison only includes hypertension (50-70%) and asthma (50-70%).

**5. Bawor 2014 specific numbers (100 vs 415 ng/dL).** Abstract confirms dose-dependent suppression in men but doesn't surface the specific 100 vs 415 ng/dL figures. May come from full text or related Bawor paper.

**6. FDA testosterone URL is broken (404).** `endocrine-recovery.md` line 97. Underlying TRAVERSE-trial findings and early-2025 labeling changes plausible but couldn't be verified through cited URL.

### Per-page summary

| Page | Claims audited | ✅ | ⚠️ | ❌ | 🔍 |
|---|---|---|---|---|---|
| 7-oh-recovery-timeline.md | 9 | 6 | 2 | 1 (Volkow→Cosgrove attribution) | — |
| depression-and-anhedonia.md | 5 | 4 | — | — | 1 |
| dopamine-recovery.md | 5 | 3 | — | 1 (same Volkow→Cosgrove) | 1 |
| endocrine-recovery.md | 16 | 13 | 1 (Zamboni over-claim) | — | 2 (broken FDA URL, Bawor exact numbers) |
| impending-doom-anxiety.md | 8 | 4 | — | 1 (PMID 15165526) | 3 |
| kindling-and-relapse.md | 9 | 7 | — | — | 2 |
| naltrexone-low-dose.md | 8 | 7 | — | — | 1 |
| naltrexone-normal-dose.md | 10 | 8 | — | — | 1 (broken FDA URL) |
| naltrexone-ultra-low-dose.md | 8 | 7 | — | — | 1 |
| naltrexone.md | 4 | 3 | — | — | 1 |
| paws-post-acute-withdrawal.md | 8 | — | — | — | 8 (didn't deep-fetch) |
| pink-cloud.md | 2 | 1 | — | — | 1 |
| sleep-recovery.md | 4 | 4 | — | — | — |

### Strengths

- **Naltrexone pages have unusually robust citation practice.** Exact sample sizes, doses, percentages, p-values, and hazard ratios match the literature when checked. The honest acknowledgment of thin evidence (especially on ULDN and the retracted filamin A papers) is well-handled.
- **Endocrine page is dense but accurate.** Highest density of specific clinical claims. Spot-checks across Daniell 2002, Daniell 2008, Abs 2000, Schmittner 2005, Bawor 2015, Tremonti 2026, LaBryer 2018, Singh 2018, Bhasin 2018, Smith 2007 all matched published values exactly.
- **Community-observed framing is properly labeled** across all 13 files.

---

## For you (person in recovery)

_Audited by: for-you agent._

**Overall quality is high.** ~75 distinct factual claims across 8 pages. Only 2 minor issues found, plus a small set of `.gov` URLs that bot-protection prevented direct verification of.

### Issues worth fixing

1. **`mat-and-your-job.md` line 46:** "HIMS, Human Intervention Motivation Study" should be **"Human Intervention Motivational Study"** (Motivational, not Motivation). Verified directly on himsprogram.com.
2. **`fmla-ada-job.md` line 13:** The phrase "doesn't have to be consecutive, but most must be within the last 7 years" is a slight paraphrase of 29 CFR 825.110(b)(1). The regulation actually says employment periods prior to a 7-year break "need not be counted." Substantively the user-facing implication is the same.

### Verification notes

- **FMLA core claims fully verified** against 29 CFR 825.110, 825.111, 825.119, 825.200. 12 weeks/12 months/1,250 hours/50 employees/75 miles/7-year break / treatment-vs-active-use distinction all match the regulation exactly.
- **ADA OUD framing verified** against ada.gov/resources/opioid-use-disorder/.
- **All 14 mutual aid org URLs return 200** and the organizational descriptions all match each org's public framing.
- **Oxford House facts verified:** founded 1975, currently 3,400-3,500 houses.
- **FAA, FMCSA, ATF citations** all check out structurally.

### tapering-7oh.md deserves a callout

**Exemplar of the community-observed labeling discipline.** Every clinical-sounding number is explicitly framed as community observation, and the disclaimer at line 32 honestly delineates the absence of published 7-OH-specific taper literature. No changes needed.

### Per-page summary

| Page | Claims audited | ✅ | ⚠️ | ❌ | 🟡 |
|---|---|---|---|---|---|
| at-home-treatment.md | 6 | 6 | — | — | — |
| fmla-ada-job.md | 11 | 10 | 1 (slight paraphrase) | — | — |
| mat-and-your-job.md | 8 | 6 | 2 (HIMS spelling, PHP claim) | — | — |
| mutual-aid.md | 13 | 13 | — | — | — |
| rehabilitation-centers.md | 10 | 9 | 1 (DOL URL bot-blocked) | — | — |
| sober-living.md | 5 | 5 | — | — | — |
| tapering-7oh.md | 8 | — | — | — | 8 (all properly labeled) |
| welcome.md | 3 | 3 | — | — | — |

---

## For loved ones

_Audited by: for-loved-ones agent._

### src/content/for-loved-ones/asking-them-to-leave.md

Brief: 12 claims; 8✅ 2🟡 2🔍

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 21 | Tenancy rights after ~30 days varies by state | none | 🟡 | Generally accurate framing; "30 days" is a common rule-of-thumb threshold but actual law is highly state-specific. Page acknowledges this. |
| 2 | 22 | "Self-help eviction" is illegal in most states | none | ✅ | Accurate; nearly all US jurisdictions prohibit self-help eviction |
| 3 | 33 | Protective orders are "free to file in most places" | none | ✅ | Accurate; nearly all states waive filing fees for DV protective orders |
| 4 | 33 | Protective orders available in every state | none | ✅ | Accurate; all 50 states have civil protection order statutes |
| 5 | 35 | Emergency/ex parte orders issue same-day in many jurisdictions | none | ✅ | Accurate |
| 6 | 57 | Hearing scheduled "within a couple of weeks" | none | 🟡 | Varies widely (10-21 days typical); roughly accurate |
| 7 | 61 | "You do not need a lawyer to file a protective order" | none | ✅ | Accurate; most filed pro se |
| 8 | 65 | National DV Hotline 1-800-799-7233, text START to 88788 | thehotline.org | ✅ | Verified; number and shortcode current |
| 9 | 66 | WomensLaw.org helps all genders | womenslaw.org | ✅ | URL verified live; framing accurate per their materials |
| 10 | 72 | LSC has find-legal-aid zip code tool | lsc.gov | ✅ | URL verified |
| 11 | 73-77 | LawHelp.org, Pro Bono Net, law school clinics, courthouse DV advocates, state bar referrals | various | ✅ | All URLs verified live; framing accurate |
| 12 | 77 | Bar referrals typical $35-$50 initial consult | none | 🔍 | Common figure historically; not centrally tracked. Plausible |

### src/content/for-loved-ones/at-home-recovery.md

Brief: 9 claims; 5✅ 3🟡 1🔍

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 52 | Suboxone rapid taper "typically 5 to 10 days" | community/internal | 🟡 | Community-observed; consistent with site's own protocols |
| 2 | 72-79 | "First 72 hours are the worst," sweating/RLS/insomnia/etc. | none | ✅ | Accurate description of acute opioid withdrawal |
| 3 | 82-84 | "By days 4-7 physical symptoms ease; by week 2 acute phase mostly over" | none | ✅ | Consistent with short-acting opioid withdrawal timeline literature |
| 4 | 84 | PAWS persists "weeks to months" | internal link | ✅ | Consistent with PAWS literature |
| 5 | 102-105 | Narcan "essentially harmless if given when not needed" | CDC link | ✅ | Verified; CDC and SAMHSA materials concur |
| 6 | 128-133 | "Benzo withdrawal in particular can be fatal without management" | SAMHSA | ✅ | Accurate; well-established (DTs and seizure risk) |
| 7 | 132 | SAMHSA Helpline 1-800-662-4357 | SAMHSA | ✅ | Verified |
| 8 | 55-58 | SR-17 and kratom leaf as at-home paths | internal | 🟡 | Community-observed paths the site documents; correctly framed |
| 9 | 39 | "supervised detox" routing for benzo cases | none | ✅ | Aligns with standard clinical practice |

### src/content/for-loved-ones/boundaries.md

Brief: 4 claims; 2✅ 2🟡

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 9 | "Distilled from the family therapy tradition and CRAFT" | implicit | ✅ | Accurate framing; boundary-as-self-direction is canonical CRAFT concept |
| 2 | 61 | "Detaching with love" is an Al-Anon phrase | al-anon.org | ✅ | Accurate; canonical Al-Anon concept. Link verified |
| 3 | 11 | "A boundary is what you will do, not what they must do." | none | 🟡 | Common CRAFT/family-systems formulation; widely attributed across literature |
| 4 | 71 | "You did not cause the dependence... You are not extending the dependence" | implicit (3 Cs) | 🟡 | Aligns with classic Al-Anon/Nar-Anon "3 Cs" framing |

### src/content/for-loved-ones/fmla-workplace.md

Brief: 14 claims; 11✅ 1⚠️ 1🟡

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 11-17 | FMLA eligibility: 12 months worked, 1,250 hours, 50+ employees within 75 miles | DOL | ✅ | All three accurate per 29 USC § 2611 and DOL regs |
| 2 | 14 | 12 months "doesn't have to be consecutive, but most must be within the last 7 years" | none | ✅ | Accurate per 29 CFR § 825.110(b)(1) |
| 3 | 21 | "12 weeks of unpaid, job-protected leave per year" | DOL | ✅ | Correct per FMLA statute |
| 4 | 23 | Job restoration to same or equivalent position | DOL | ✅ | Accurate |
| 5 | 31 | Spouse, child (under 18, or adult if disabled under ADA), or parent | DOL/ADA | ✅ | Accurate per FMLA definitions |
| 6 | 36 | "Addiction in active recovery often qualifies as a disability under the ADA; active use generally does not" | ADA | ✅ | Accurate; ADA excludes current illegal drug use but protects those in/completed treatment (42 USC § 12114) |
| 7 | 38 | Sibling, in-law, grandparent, fiancé, unmarried partner NOT federally covered | DOL | ✅ | Accurate per FMLA family definitions |
| 8 | 43 | Intermittent leave permitted | DOL | ✅ | Accurate per FMLA statute |
| 9 | 49-55 | State paid family leave programs in CA, NY, NJ, MA, WA, OR, CT, RI, CO, DE, MD, MN, DC | DOL state link | ✅ | All states named have enacted PFML programs |
| 10 | 57 | "dol.gov/agencies/whd/state" state directory | DOL | ✅ | URL verified live |
| 11 | 68 | HIPAA: medical record not disclosed to HR, certification form goes to HR | HHS | ✅ | Accurate framing |
| 12 | 91 | WHD complaint line 1-866-487-9243 | DOL | ✅ | Verified |
| 13 | 91 | "Wage and Hour Division investigates FMLA complaints" | DOL | ✅ | Accurate |
| 14 | 100 | Short-term disability doesn't apply to caregiving | none | ⚠️ | Generally true federally but a few states' programs (NY PFL/DBL, NJ FLI) blur this. Wording is broadly correct but slightly underspecified |

### src/content/for-loved-ones/how-to-talk.md

Brief: 6 claims; 4✅ 2🟡

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 61 | CRAFT "consistently outperformed both Al-Anon and Johnson Intervention" | Meyers et al. | ✅ | Confirmed: Miller, Meyers & Tonigan 1999 found CRAFT 64% vs Al-Anon 13% vs Johnson 30% engagement for alcohol; Meyers et al. 2002 found 74% for drug users |
| 2 | 61 | "CRAFT gets roughly two-thirds of resistant loved ones into treatment" | Meyers et al. | ✅ | Accurate; published rates 64-74% |
| 3 | 61 | "compared to roughly 20-30% for the alternatives" | Meyers et al. | 🟡 | Slightly overstates Al-Anon side (13% in Miller/Meyers/Tonigan 1999); reasonable averaged range |
| 4 | 61 | "Meyers et al. studies in the late 1990s and 2000s" | Meyers et al. | ✅ | Accurate citation period (1996, 1999, 2002, 2005) |
| 5 | 76-79 | Allies in Recovery, SMART F&F, Beyond Addiction book, Get Your Loved One Sober book | various | ✅ | All URLs verified live; books in stock |
| 6 | 79 | Meyers in "Get Your Loved One Sober" "is the same Meyers from the foundational CRAFT studies" | book authorship | ✅ | Accurate; Robert J. Meyers is the CRAFT researcher |

### src/content/for-loved-ones/rehabilitation-centers.md

Brief: 11 claims; 8✅ 2🟡 1🔍

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 31 | Medical detox "typically 3-7 days" | none | ✅ | Standard clinical range for opioid detox |
| 2 | 37 | Residential "typically 28-90 days" | none | ✅ | Standard ranges |
| 3 | 43 | PHP "roughly 20-30 hours per week" | none | ✅ | Accurate per ASAM levels of care |
| 4 | 47 | IOP "roughly 9-15 hours per week" | none | ✅ | Accurate per ASAM |
| 5 | 60 | "Methadone... typically daily clinic visits" / "dedicated methadone clinics" | none | ✅ | Accurate per SAMHSA OTP regulations |
| 6 | 88 | "Medicaid covers SUD treatment in all 50 states" | Medicaid | ✅ | Accurate per ACA EHB requirement |
| 7 | 92 | MHPAEA requires parity with medical/surgical | MHPAEA/DOL | ✅ | Accurate per MHPAEA statute |
| 8 | 111 | Salvation Army ARC: "long-term residential, free, faith-based, work-therapy model" | Salvation Army | ✅ | Accurate description of ARC programs |
| 9 | 119 | SAMHSA Helpline 1-800-662-4357, 24/7, free, confidential | SAMHSA | ✅ | Verified |
| 10 | 126 | CARF & Joint Commission as accreditation bodies | CARF/JC | ✅ | URLs verified; canonical SUD accreditors |
| 11 | 127 | "Patient brokering" illegal in many states | none | 🟡 | Accurate; FL, CA, MI, TX have specific patient brokering laws |
| 12 | 131 | Programs without aftercare have "much higher relapse rates" | none | 🔍 | Directionally supported by SAMHSA/NIDA continuing-care literature; specific magnitude not cited |

### src/content/for-loved-ones/safety.md

Brief: 14 claims; 12✅ 1🟡 1⚠️

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 13 | Active SUDs "increase risk of domestic violence, child neglect, household accidents, overdose" | none | ✅ | Well-established epidemiology (CDC, NSDUH) |
| 2 | 53 | Mandatory reporters list (teachers, doctors, nurses, MH pros, daycare) | none | ✅ | Accurate for most US states |
| 3 | 55 | Childhelp 1-800-422-4453, 24/7 | childhelphotline.org | ✅ | Verified |
| 4 | 61-65 | All crisis numbers (DV, Childhelp, 988, SAMHSA, Poison Control) | various | ✅ | All numbers and URLs verified |
| 5 | 69 | Naloxone OTC at most pharmacies, often covered by insurance/Medicaid | CDC | ✅ | Accurate post-March 2023 FDA OTC approval for Narcan |
| 6 | 73 | Claim that "7-OH doesn't cause respiratory depression" comes from "limited research on isolated mitragynine in animal models" | none | ✅ | Accurate characterization |
| 7 | 77 | MGM-15 and pseudoindoxyl "more potent and less-studied than mitragynine" | internal | ✅ | Consistent with compound-page documentation |
| 8 | 78 | "Naloxone essentially harmless if given to someone who didn't need it. Worst case: mild withdrawal symptoms" | none | ✅ | Accurate per SAMHSA, NIH, CDC |
| 9 | 86 | Overdose signs: unresponsive, slow/stopped breathing, blue lips/fingertips, gurgling/snoring, pinpoint pupils | none | ✅ | Standard CDC/SAMHSA overdose signs |
| 10 | 87 | "Naloxone wears off in 30 to 90 minutes" | none | ✅ | Accurate (naloxone half-life ~30-90 min) |
| 11 | 87 | "the substance may last longer, and they can re-overdose" | none | ✅ | Accurate; CDC explicitly warns of re-narcotization |
| 12 | 88 | Administration steps (tilt head, insert nozzle, press plunger) | none | ✅ | Accurate per Narcan IFU |
| 13 | 90 | "If no response in 2-3 minutes, give second dose" | none | ✅ | Accurate per Narcan label and CDC guidance |
| 14 | 107 | "Most states have Good Samaritan laws" | none | 🟡 | Accurate; 48 states + DC (KS and WY are holdouts per NCSL tracking) |
| 15 | 91 | "They'll likely come to feeling sick, confused, or in withdrawal. That's normal and means it worked." | none | ⚠️ | Mostly accurate but slightly understated re: agitation; practical guidance is correct |

### src/content/for-loved-ones/support-groups.md

Brief: 10 claims; 8✅ 2🟡

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 23 | TIAWO / Quitting Kratom Support at kratomquitters.com | kratomquitters.com | ✅ | URL verified live |
| 2 | 31 | Learn to Cope "founded by a mother who lost a son to opioid use disorder" | learn2cope.org | ✅ | Accurate; founder Joanne Peterson. Worth double-checking exact "lost a son" wording against current About page (founder's son's status) |
| 3 | 33 | Learn to Cope "meetings mostly in Massachusetts in person" | learn2cope.org | ✅ | Accurate; MA-based with national online presence |
| 4 | 39 | Nar-Anon is "12-step, modeled on Al-Anon" | nar-anon.org | ✅ | Accurate |
| 5 | 47 | SMART F&F "built on the CRAFT framework and motivational interviewing" | smartrecovery.org | ✅ | Accurate per SMART F&F materials |
| 6 | 57 | Al-Anon "largest family support network in the world" | al-anon.org | 🟡 | Plausible by membership counts but not a citable single source |
| 7 | 71 | ACA = "Adult Children of Alcoholics, not the Affordable Care Act" | adultchildren.org | ✅ | Accurate disambiguation; URL verified |
| 8 | 65 | Families Anonymous: broader scope including mental health alongside SUD | familiesanonymous.org | ✅ | Accurate per FA's own materials |
| 9 | 79 | GRASP for "lost someone to substance use" | grasphelp.org | ✅ | Accurate scope; URL verified |
| 10 | 31 | LTC offers "free naloxone training and distribution at many chapter meetings" | learn2cope.org | 🟡 | Accurate based on LTC's public programming history |

### src/content/for-loved-ones/taking-care-of-yourself.md

Brief: 6 claims; 4✅ 2🟡

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 13 | "Real clinical literature on caregiver burnout" | none | ✅ | Accurate; substantial peer-reviewed literature on caregiver burden |
| 2 | 52 | EMDR/somatic therapies "have research behind them" | none | ✅ | Accurate (multiple RCTs on EMDR for PTSD) |
| 3 | 59 | Open Path Collective $40-80 sessions | openpathcollective.org | ✅ | Accurate fee range per their model |
| 4 | 60-61 | Inclusive Therapists, Therapy for Black Girls, Latinx Therapy directories | various | ✅ | All URLs verified |
| 5 | 61 | EAP "usually 3-6 free sessions" | none | 🟡 | Accurate as a common range; varies (some EAPs are 5, 8, or 10 sessions) |
| 6 | 81 | "Ambiguous loss... recognized form of grief with its own clinical literature" | none | ✅ | Accurate; Pauline Boss's work is canonical |

### src/content/for-loved-ones/welcome.md

Brief: 3 claims; 3✅

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 17-22 | The "3 Cs" framing (didn't cause, can't control, can't cure) | implicit Al-Anon | ✅ | Canonical Al-Anon/Nar-Anon formulation |
| 2 | 42 | "7-OH is a potent mu-opioid receptor agonist" | internal compound page | ✅ | Accurate per pharmacology literature |
| 3 | 42 | "MGM-15, pseudoindoxyl... even more potent, and most don't show up on standard drug tests" | internal | ✅ | Accurate per site's compound pages |

### src/content/for-loved-ones/what-to-expect.md

Brief: 8 claims; 6✅ 2🟡

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 13-15 | Opioid dependence rewires reward/survival systems | none | ✅ | Accurate per addiction neuroscience (Volkow, NIDA framing) |
| 2 | 69-79 | Opioid withdrawal symptom list | none | ✅ | Matches DSM-5 opioid withdrawal criteria and COWS items |
| 3 | 81 | "Acute symptoms typically peak around day 3-5 after last dose and ease over 1-2 weeks" | none | ✅ | Accurate for short-acting opioid withdrawal |
| 4 | 81 | Longer-acting synthetics (MGM-15, pseudoindoxyl) "stretch this out" | internal | 🟡 | Community-observed; consistent with longer half-lives |
| 5 | 85 | Mixing with benzos "can be fatal without medical management" | SAMHSA | ✅ | Accurate |
| 6 | 89 | PAWS lasts "months, sometimes a year or more" | internal PAWS page | ✅ | Consistent with PAWS clinical literature |
| 7 | 105 | "Most people don't get sober on the first try... relapse, especially in the first year, is part of the population-level pattern" | none | ✅ | Accurate per NIDA chronic-disease framing |
| 8 | 121 | CRAFT "outperforms both Al-Anon and the confrontational Johnson Intervention in clinical trials" | Meyers et al. | ✅ | Confirmed earlier in audit |

### Observations for for-loved-ones category

**Overall quality is high.** Across 11 pages, ~96 specific factual claims checked. No outright wrong claims found. A few 🟡 community-observed items that are already correctly framed.

**Strongest section: FMLA.** All 13 statutory/regulatory claims on `fmla-workplace.md` are accurate — 12 months, 1,250 hours, 50-employee/75-mile threshold, 12-week entitlement, family-member definitions, ADA-addiction-in-recovery framing, HIPAA cert-form scope, WHD complaint line, state PFL list. This page would survive a labor-attorney read.

**CRAFT statistics on `how-to-talk.md` are sourced correctly.** Wording "roughly two-thirds... compared to roughly 20-30%" is a reasonable averaged shorthand of the Miller/Meyers/Tonigan 1999 and Meyers et al. 2002 findings.

**Naloxone facts on `safety.md` are accurate.** Half-life, re-overdose risk, harmless-if-not-needed framing, administration steps, recovery position, 911-first guidance all check out.

**Minor improvement opportunities (not errors):**
1. `fmla-workplace.md` line 100 — STD-not-for-caregiving claim is broadly true but underspecified given some state PFML programs.
2. `support-groups.md` line 31 — Learn to Cope's founding story (founder's son's status) should be verified against LTC's current About page.

**Quality of named-source links:** every external URL checked returned 200. No dead links. Books referenced (Beyond Addiction, Get Your Loved One Sober) both in stock.

**Pharmacology framing consistent with house style.** No multi-year-synthetic claims found.

---

## Start here

_Audited by: start-here agent._

### src/content/start-here/welcome.md

Brief: "4 claims; 4✅ 0⚠️ 0❌ 0🔍"

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 17–20 | Kratom is a Southeast Asian plant whose leaves contain mu-opioid-active alkaloids | (general knowledge; internal /compounds links) | ✅ | Well-established |
| 2 | 19–20 | 7-OH is one of those alkaloids, concentrated and sold as tablets/shots | internal | ✅ | Accurate |
| 3 | 21–23 | Concentrated synthetics named: 7-OH, pseudo, MGM-15 | internal | ✅ | Consistent with site's compound taxonomy |
| 4 | 27–28 | "Calm reference… written by people who went through this" | site descriptor | ✅ | Not a factual claim |

### src/content/start-here/what-is-7-oh.md

Brief: "5 claims; 4✅ 1⚠️ 0❌ 0🔍"

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 14–17 | Kratom from *Mitragyna speciosa*, grows in Thailand/Malaysia/Indonesia; centuries of use as tea, stimulant at low dose / sedative at high dose | general botanical/ethnopharm consensus | ✅ | Standard description |
| 2 | 24–26 | 7-OH exists in kratom leaf in trace amounts, much stronger than mitragynine, acts on same receptors as morphine | Kruegel 2019, Matsumoto 2014 | ✅ | Consistent with literature; 7-OH is ~13× more potent than mitragynine at MOR |
| 3 | 28–32 | "7-OH tablets" are concentrated to roughly 100–1,000× natural leaf | FDA letter linked further down | ⚠️ | Plausible upper-end claim but no specific FDA quantification of "100–1,000×". FDA describes products as "concentrated" but doesn't peg a specific multiplier. The range is community-derived; reasonable but unsourced |
| 4 | 36–45 | Beer 5% / liquor 40% / Everclear 95% comparison; coca-leaf to cocaine parallel | analogy | ✅ | Numerical alcohol % are accurate; coca/cocaine analogy is structurally accurate (cocaine is the isolated alkaloid from same plant) |
| 5 | 49–56 | Concentrated 7-OH products marketed as kratom alternatives, wellness supplements, or research compounds | FDA warning letters (linked) | ✅ | FDA page confirms unapproved-drug marketing with claims of pain relief and anxiety management; "wellness/alternative/research compound" framing aligns with FDA's "unproven claims" language |

### src/content/start-here/how-to-use-this-website.md

Brief: "2 claims; 2✅ 0⚠️ 0❌ 0🔍"

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 44–48 | PAWS is "real, known, and has its own playbook" | internal | ✅ | Accurate framing |
| 2 | n/a | All other content is navigational; no factual claims requiring sourcing | — | ✅ | Map page, mostly internal routing |

### src/content/start-here/how-to-quit-7-oh.md

Brief: "6 claims; 4✅ 1⚠️ 0❌ 1🟡"

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 13 | "Kratom leaf is the least harmful thing on this list to stay on long-term" | community judgment | 🟡 | Reasonable community-observed framing; consistent with the harm-reduction ladder |
| 2 | 30–32 | "Leaf gives the receptors mitragynine at much lower potency" | implicit pharmacology | ✅ | Accurate — leaf delivers mitragynine at far lower MOR potency than concentrated 7-OH |
| 3 | 33 | Plain leaf preferred over concentrated mitragynine due to product-contamination concerns specific to concentrates | internal link | ✅ | Standard community framing; documented on linked page |
| 4 | 61 | Buprenorphine: "long-acting partial mu agonist" | pharmacology | ✅ | Correct |
| 5 | 61–62 | "A correct induction removes most of withdrawal within hours" | clinical | ✅ | Consistent with standard buprenorphine induction outcomes |
| 6 | 68–73 | SR-17018: "biased mu agonist with a long duration of action"; sidesteps bupe displacement problem | preclinical lit | ⚠️ | SR-17018 is described in preclinical lit (Schmid et al. 2017) as G-protein–biased at MOR; "long duration of action" is preclinical-mouse data, not human PK. Page does flag "off-prescription, less clinical literature" |

### src/content/start-here/7-oh-withdrawal-help.md

Brief: "10 claims; 7✅ 2⚠️ 0❌ 1🟡"

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 15–18 | "7-OH hits the same receptors as morphine. Your body adapted… receptors run underactive… mismatch is what withdrawal feels like" | mechanism | ✅ | Accurate simplified mechanism for mu-opioid dependence |
| 2 | 81–87 | 7-OH-alone hour-by-hour timeline: 6–12h first symptoms; 12–24h climbing; 24–72h peak; days 3–5 lifting; week 2+ PAWS | clinical opioid-withdrawal references + community observation | 🟡 | Reasonable for a short-acting opioid; structural shape matches established short-acting-opioid lit. 7-OH-specific timing is community-observed |
| 3 | 89–91 | MGM-15 (also sold as MIT-A or DHM): timeline longer, peak 48–96h instead of 24–72, longer tail | internal compound pages | 🟡 | Community-observed; consistent with longer-half-life synthetic profile |
| 4 | 93–98 | Minor alkaloids act at serotonin and adrenergic receptors; withdrawal can resemble SSRI/SNRI discontinuation | PMC9235362 | ✅ | Verified — cited paper documents 5-HT1A and 5-HT2B receptor activity for paynantheine and speciogynine. Adrenergic activity documented in broader literature |
| 5 | 100–103 | Pseudo binds the receptor "tighter than buprenorphine itself" | internal | ✅ | Pseudo Ki at MOR ≈ 0.087 nM vs. buprenorphine ~0.2–0.5 nM. Claim accurate |
| 6 | 112 | "Going earlier causes precipitated withdrawal" before COWS ≥ 12 | clinical | ✅ | Standard buprenorphine induction practice |
| 7 | 130–131 | "Opioid withdrawal alone rarely causes seizures, but if also withdrawing from alcohol or benzos, it can" | clinical | ✅ | Accurate — opioid withdrawal not classically seizurogenic; alcohol/benzo is |
| 8 | 135–136 | Pregnancy + acute opioid withdrawal: miscarriage and premature-labor risk | obstetrics literature | ✅ | Standard ACOG/SUD guidance |
| 9 | 140–144 | EMTALA requires ERs to stabilize regardless of insurance/immigration/ability to pay | US law | ✅ | Accurate description of EMTALA |
| 10 | 201–206 | First-gen antihistamines worsen restless legs; cites PubMed 15165526 | Yang et al., Sleep Med 2005 (claimed) | ⚠️ | **Citation problem.** PMID 15165526 is "The legacy of Karl-Axel Ekbom" by Ulfberg, *Sleep Med* 2004 — an editorial about Ekbom's history, **not** a study on antihistamines and RLS. Underlying claim is widely accepted (AASM/IRLSSG lists), but PMID cited is wrong. Same misattribution exists in CLAUDE.md. Replace with IRLSSG 2016 review (Garcia-Borreguero et al.) or AASM clinical practice guideline |

### src/content/start-here/cravings-and-relapse-thoughts.md

Brief: "6 claims; 5✅ 1⚠️ 0❌ 0🔍"

| # | Line | Claim | Cited source | Status | Notes |
|---|------|-------|--------------|--------|-------|
| 1 | 108–109 | Cravings peak and fall in waves of 15–30 minutes | community/CBT lit | ✅ | Standard urge-surfing/CBT framing; widely documented |
| 2 | 196–199 | NIDA 40–60% relapse rate, comparable to hypertension and asthma at 50–70% | NIDA page (linked) | ✅ | Verified at NIDA URL: numbers match exactly |
| 3 | 200–207 | Smyth et al. Ir Med J 2010: 91% relapse during follow-up; 59% in first week post-discharge | PMID 20669601 | ✅ | Verified: 99/109 (91%); 64/109 (59%). Exact match |
| 4 | 210–214 | 2023 Henningfield/Smith expert forum on kratom withdrawal "explicitly flags [kratom relapse data] as a research gap" | PMC10311168 | ⚠️ | Citation is real but page text says "Smith et al."; PMC10311168 is **Henningfield** et al. (2023). Also "explicitly flags as research gap" overstates — paper calls for more research on behavioral interventions and individual differences. Correct authorship and soften language |
| 5 | 215–219 | Peer support, regular check-ins, meetings, prescriber contact reduce relapse risk | general lit | ✅ | Widely supported in OUD/SUD literature |
| 6 | 234–246 | "Real fatal pattern in kratom-adjacent deaths is combinations: alcohol, benzos, gabapentinoids, other depressants"; MGM-15 and pseudo more potent solo | site framing | ✅ | Consistent with site framing rules and kratom-mortality literature |

### Observations for start-here category

**Two citation-accuracy issues worth fixing.**

1. **PMID 15165526 is the wrong citation for "first-gen antihistamines worsen RLS"** in `7-oh-withdrawal-help.md` line 204. The PMID points to Ulfberg's 2004 editorial on Ekbom's legacy, not to a study of antihistamines and RLS. The underlying claim is correct and well-accepted in sleep medicine, but the linked source doesn't support it. **Note: this same misattribution appears in CLAUDE.md (the hydroxyzine/RLS section), so the wrong PMID propagated from there into the page.** Replace with the IRLSSG/AASM clinical guidelines, Garcia-Borreguero 2016 review, or Earley/Silber RLS review literature.
2. **`cravings-and-relapse-thoughts.md` line 211 attributes the 2023 expert-forum paper to "Smith et al."** but PMC10311168 is Henningfield et al. (2023). Either there is a separate Smith-led companion paper that should be cited instead, or this should be corrected to Henningfield. Also, the page's framing slightly overstates the paper's explicitness.

**Everything else verifies well.** The NIDA 40–60% / 50–70% figures match the cited NIDA page verbatim. The Smyth et al. 91% / 59% figures match the paper exactly. The serotonin/adrenergic minor-alkaloid claim is well-supported by PMC9235362. The pseudo-binds-tighter-than-bupe claim checks out. The FDA warning-letters link works. EMTALA, opioid-withdrawal-not-seizurogenic, and pregnancy-risk claims all check out against standard clinical references.

**One unverified-but-plausible claim:** the "100 to 1,000 times" concentration multiplier in `what-is-7-oh.md` line 32 is community/range-estimate; FDA doesn't quantify. Plausible at upper end. Would be more honest with a "community estimate" qualifier.

**No path-comparison violations, no multi-year 7-OH claims, no 7-OH-overdose-mortality framing.** The pages comply with the site's editorial rules.

---

## Resources

_Audited by: resources agent._

### Highest-priority fixes (reader-facing accuracy)

1. **`telehealth-for-suboxone.md` L128 — broken BBB link.** The Bicycle Health BBB profile URL returns 404. Either drop the link or re-locate it.
2. **`telehealth-for-suboxone.md` L723 — broken settlement-site link.** `whprivacysettlement.com` returns 404. Replace with court docket (E.D. Mich. case 2:23-cv-11691) or news source.
3. **`crisis-hotlines.md` L41 — SAMHSA URL redirects.** `samhsa.gov/find-help/national-helpline` 301s to the new canonical path; update to drop redirect hop.
4. **`7-oh-taper-calculator.mdx` L17 — "~100 minutes plasma" half-life.** Community-observed effect duration, not published-PK number. Only published PK (Fan et al, beagle dogs) reports elimination t½ of 3.6 ± 0.5 h. No human PK exists. Mirrored from `/compounds/7-oh.md` — fix both if adjusted.

### Solid spots (no action needed)

- Crisis hotline numbers all canonical and verified.
- Meeting schedule data in `src/data/meetings.ts` matches both KA and TIAWO source pages exactly, including all 4 cutt.ly shortlinks (verified to resolve to hard-coded Zoom URLs).
- Telehealth provider state counts accurate (Bicycle 27, Boulder 7, Confidant 4, Eleanor 19, Groups 14, Ophelia 15, PursueCare 6, QuickMD 41+DC, Workit 14).
- Direct verbatim quotes (Boulder's Boustead on naloxone reversing 7-OH; Ophelia on 10x/13x potency; QuickMD's "can't be tapered" framing) verified word-for-word.
- Calculator defaults match both the code and the linked source pages.

### Per-page summary

| Page | Claims audited | ✅ | ⚠️ | ❌ | 🔍 |
|---|---|---|---|---|---|
| 7-oh-taper-calculator.mdx | 6 | 4 | — | — | 1 |
| crisis-hotlines.md | 12 | 10 | 1 (911.gov bot-block) | — | 1 |
| kratom-leaf-taper-calculator.mdx | 4 | 4 | — | — | — |
| meeting-schedules.mdx | 9 | 9 | — | — | — |
| sr-17-taper-calculator.mdx | 6 | 6 | — | — | — |
| suboxone-taper-calculator.mdx | 5 | 5 | — | — | — |
| taper-calculator.mdx | 6 | 6 | — | — | — |
| telehealth-for-suboxone.md | 28 | 23 | 3 (broken BBB, broken settlement URL, redirect) | — | 2 |

---

## About

_Audited by: about agent._

### Single notable factual error

**`how-ai-was-used.md` (line 17)** describes CLAUDE.md as "a working document of about 700 lines." The current file is **981 lines** on both disk and GitHub. The page itself notes "vagueness about AI use is part of the problem" — concrete numbers should be accurate. Update to "about 1,000 lines" or "nearly 1,000 lines."

### Reddit-side claims — Playwright re-verification

Re-ran the Reddit URLs in a headless Chromium browser (Playwright) to get past the JSON anti-bot wall. Results:

| Claim | Site says | Reddit says | Status |
|---|---|---|---|
| Subreddit creation date | "August 2024" | **Jul 16, 2024** (per the about page) | ❌ Off by ~3 weeks; should read "July 2024" |
| Transfer post `1gmmhdh` ("I'm taking ownership of this sub") | "November 2024" | **November 8, 2024** | ✅ Verified |
| Stepdown post `1t0u0jo` ("Passing the admin torch") | "May 2026" | **2026-05-01** | ✅ Verified |
| Stepdown post `1reegp9` ("Due to discords new dystopian policies…") | "May 2026" | **2026-02-25** | ⚠️ Off — this post is from February 2026, not May. It's about Discord policy changes, not the stepdown event. Linking it as part of "In May 2026, Fly stepped down" conflates two different posts |
| Fly active in r/quitting7oh | implied | **FlyAdventurous6231 username confirmed across multiple posts** | ✅ Verified |
| TheTimeIsHours created subreddit | "created in August 2024 by /u/TheTimeIsHours" | Unknown — Reddit blocks the mod-history page (403) and user profile pages are age-gated | 🔍 Still unverifiable |
| Mod team (cartmancakes, Icy-Muffin7572, AnointedDread, TheirTimeWasHours, drjinglesMD) | listed | Reddit's mod list page returns 403 even via headless browser | 🔍 Still unverifiable |

### Discord claims are partially verifiable

The Discord guild widget returns live data: server name "r/quitting7oh - Drug Recovery Community", presence count ~109 online, and member "18YearsOfRegret" visible — matching the page's listed Discord owner. Admin (@cartmancakes) and Head Mod (@Keso) aren't surfaced by the widget endpoint (widget shows online members only).

### Internal cross-links are clean

Every internal link in the six audited pages targets a real file.

### External URLs verified clean

GitHub repo, the CLAUDE.md raw, the stop-slop SKILL.md, and Hardik Pandya's upstream stop-slop (confirmed MIT-licensed) all return 200.

### Per-page summary

| Page | Claims audited | ✅ | ⚠️ | ❌ | 🔍 |
|---|---|---|---|---|---|
| changelog.md | 4 | 4 | — | — | — |
| contributing.md | 6 | 6 | — | — | — |
| how-ai-was-used.md | 9 | 6 | 2 (700-line claim, soft empirical claims) | — | 1 |
| the-community.mdx | 14 | 8 | — | — | 6 (Reddit unverifiable) |
| this-site.md | 6 | 6 | — | — | — |
| where-we-stand.md | 3 | 3 | — | — | — |

---

## Overall observations

### Headline findings

**1. There is a chain of propagated Kᵢ errors on the pharmacology pages.** Pseudoindoxyl Kᵢ at MOR is **0.8 nM per Varadi 2016**, not 0.087 nM. Mitragynine MOR Kᵢ is **160-240 nM range**, not 7.24 nM. Both wrong numbers circulate on Wikipedia and propagated into `compounds/mitragynine-pseudoindoxyl.md`, then into `pharmacology/morphine-vs-kratom.md` (in commit `051dc51` I made yesterday). The mitragynine number on `morphine-vs-kratom.md` was cited to "Kruegel 2019 (hMOR, ~7 nM)" but **Kruegel 2019 reports EC50 339 nM, not Kᵢ, for mitragynine** — and the 7 nM figure appears to confuse mitragynine with 7-OH (Obeng 2020 reports 7-OH Kᵢ = 7.16 nM). 

**2. PMID 15165526 is mis-cited 5+ times sitewide as "Yang et al. 2005" on antihistamines and RLS.** PMID 15165526 is actually Ulfberg, "The legacy of Karl-Axel Ekbom" (Sleep Med 2004 editorial). Appears in:
- `helper-meds.md` (×2)
- `start-here/7-oh-withdrawal-help.md`
- `quit-7-oh-with-kratom-leaf.md`
- `post-acute/impending-doom-anxiety.md`
- `why-suboxone-isnt-working.md`
- **`CLAUDE.md` itself** (the hydroxyzine rule — propagated from there into the pages)

The underlying claim (first-gen antihistamines worsen RLS) is well-supported by the broader RLS literature (IRLSSG, AASM); the citation is wrong. Replace with Garcia-Borreguero 2016 (IRLSSG), AASM RLS clinical practice guideline, or a UpToDate-grade source. **Fix in CLAUDE.md first to stop further propagation.**

**3. The "Quit 7-OH with Mitragynine" page has swapped Kᵢ values** that are the *inverse* of what its cited Obeng 2021 paper reports. Per Obeng 2021: mitragynine Kᵢ = 77.9 nM at MOR; 7-OH Kᵢ = 709 nM. The page assigns 78 nM to 7-OH and 709 nM to mitragynine. **Most clinically misleading error in the audit** because it makes 7-OH look weaker-binding than mitragynine, which is the opposite of every receptor characterization in the modern literature.

**4. Volkow → Cosgrove misattribution.** PMC3760378 is by Kelly P. Cosgrove ("Imaging Receptor Changes in Human Drug Abusers"), not Volkow. Mis-attributed in `7-oh-recovery-timeline.md` and `dopamine-recovery.md`.

**5. Wrong PMC IDs on the Bernese page.** Four citation mis-attributions in `suboxone-bernese-method.md` (Hess→Menard, Vu→Alexander, Sandhu→Wong, Kazim→Hayes&Mills). Underlying facts are correct in each case; only the author attribution is wrong.

**6. Frontiers paper `1763551` cited 3× for claims it doesn't contain** (pseudo binds tighter than buprenorphine; MGM-15 dual mu/delta). Both claims are supported by independent literature, just not by this paper.

### Numeric/dose claims worth re-anchoring

- **7-OH plasma half-life "~100 minutes"** appears on at least 4 pages (`compounds/7-oh.md`, `sows-cows-induction-guide.mdx`, `suboxone-for-7oh.md`, `suboxone-rapid-taper.md`, plus the 7-OH taper calculator). No primary source cited. Published clinical PK (Tanna 2024, Trakulsrichai) gives 4-9 hours as metabolite; the only published direct-7-OH PK is in dogs (3.6 h). The "100 min" figure is community-observed effect duration, not measured human PK. Either widen to "1.5-4 hours" with a citation, or label as "community-observed effect duration."
- **MGM-15 "~15 hour half-life"** appears on at least 3 pages. **No published human PK exists.** Label as community-extrapolated.
- **Mitragynine α-adrenergic binding "moderate"** — Obeng 2020 reports micromolar (1.3-9.29 µM), which is weak. Recurs on `kratom-leaf.md` and `7-oh.md`.

### Other site-wide patterns

- **Sublocade list price** ($1,500-1,900) understated; actual 2024-2026 price is ~$2,100-2,200.
- **Ohio scheduling date** is Dec 12, 2025 (MGM-15 page has it right); `kratom-leaf.md` has Dec 16.
- **EVALI hospitalization count** (cannabis page) is at the edge of CDC's final number (2,807); MMWR cited has 2,668.
- **Mitragynine "leaf 0.04% 7-OH = 0.5-4 mg/gram"** math is wrong — 0.04% of 1 g is 0.4 mg, not up to 4.
- **CLAUDE.md says "about 700 lines"** in `how-ai-was-used.md`; actually 981 lines.
- **HIMS acronym is "Motivational"** not "Motivation" (single letter typo on `mat-and-your-job.md`).
- **Reddit-side claims, after Playwright re-verification:** subreddit creation date is **Jul 16, 2024**, not August 2024 (off by ~3 weeks). The "May 2026 stepdown" framing on `about/the-community.mdx` line 65 conflates two separate posts — `1t0u0jo` is the actual stepdown post from May 1, 2026, but `1reegp9` is from February 25, 2026 and is about Discord policy changes, not the stepdown itself. Should be split into two distinct events with their correct dates. TheTimeIsHours as original creator and the current mod team remain unverifiable — Reddit's mod-history page returns 403 even in a headless browser.

### Pages with the most issues (recommended audit priority)

| Rank | Page | Why |
|---|---|---|
| 1 | `compounds/mitragynine-pseudoindoxyl.md` | Two wrong Kᵢ numbers from Wikipedia; cascaded into `morphine-vs-kratom.md` |
| 2 | `pharmacology/morphine-vs-kratom.md` | Just rewritten in `051dc51`, but the rewrite cascaded errors from the pseudo page |
| 3 | `other-tools/quit-7-oh-with-mitragynine.md` | Swapped Kᵢ values (inverse of Obeng 2021) |
| 4 | `mat-suboxone/suboxone-bernese-method.md` | 4 wrong author attributions; underlying facts correct |
| 5 | `mat-suboxone/suboxone-for-7oh.md` | Wrong PMID, slightly overstated occupancy table, 7-OH half-life citation gap |
| 6 | `other-tools/quit-7-oh-with-kratom-leaf.md` | Wrong mitragynine half-life (24+ vs 7-39 hr), broken antihistamine citation, math inconsistency |
| 7 | `mat-suboxone/sublocade-brixadi.md` | Price understated, wrong PMC attribution for Kazim claim |
| 8 | `compounds/7-oh.md` | "100 min" half-life unsourced, α-adrenergic strength miscalled, leaf composition slightly conservative |
| 9 | `compounds/kratom-leaf.md` | α-adrenergic strength miscalled, prodrug attribution to Kruegel wrong, Ohio date wrong |
| 10 | `post-acute/endocrine-recovery.md` | Zamboni over-claim on bupe vs methadone; FDA URL broken |

### Pages that came back clean (no significant issues)

- `for-loved-ones/fmla-workplace.md` — all 13 FMLA statutory/regulatory claims accurate
- `for-loved-ones/safety.md` — naloxone facts solid
- `mat-suboxone/sublocade-brixadi.md` clinical specs (separate from price)
- `for-you/mutual-aid.md` — all 14 mutual aid org URLs verified, descriptions match
- `for-you/tapering-7oh.md` — exemplar of community-observed labeling discipline
- `compounds/mgm15.md` — the cleanest pharmacology page in the audit
- `compounds/mgm16.md` — responsibly hedged single-paper caveat
- `other-tools/sr-17.md` — pharmacology numbers verified against Wikipedia (which sources from Bohn lab)
- `resources/crisis-hotlines.md` — all numbers canonical
- `resources/meeting-schedules.mdx` — matches both KA and TIAWO source pages exactly

### Suggested next-step priorities

**Pass 1 — fix the propagation chain (single commit):**
1. Fix the Yang/PMID 15165526 misattribution in `CLAUDE.md`, then sweep the 5 pages that cite it
2. Fix the pseudo Kᵢ (0.8 nM not 0.087) and mitragynine Kᵢ (160-240 nM not 7.24) in `mitragynine-pseudoindoxyl.md`
3. Re-do `morphine-vs-kratom.md` Kᵢ table with the corrected numbers — and remove the "Kruegel 2019 (hMOR)" Kᵢ attribution for mitragynine (Kruegel only reports EC50)
4. Fix the swapped Kᵢ in `quit-7-oh-with-mitragynine.md` (78 ↔ 709 reversed)

**Pass 2 — fix the citation mis-attributions:**
1. 4 PMC ID corrections on `suboxone-bernese-method.md`
2. Kazim→Hayes&Mills correction on `sublocade-brixadi.md`
3. Volkow→Cosgrove correction on `7-oh-recovery-timeline.md` and `dopamine-recovery.md`
4. Frontiers citation fix on 3 MAT-Suboxone pages (or move the claim to a real source)

**Pass 3 — small numeric fixes:**
1. Sublocade list price update
2. Ohio scheduling date on `kratom-leaf.md`
3. Mitragynine α-adrenergic strength (weak/micromolar, not moderate)
4. Leaf-7-OH-content math
5. CLAUDE.md line count on `how-ai-was-used.md`
6. HIMS "Motivational"

**Pass 4 — half-life claims:**
1. Re-anchor or qualify "7-OH ~100 minutes" across 4 pages
2. Label MGM-15 "~15 hour half-life" as community-extrapolated across 3 pages

This four-pass shape would clear about 80% of the substantive findings. The remaining items are either small (line numbers, links to update), unverifiable from this environment (Reddit history), or deliberate editorial framing (community-observed-but-labeled).
