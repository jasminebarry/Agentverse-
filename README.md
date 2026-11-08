# bioREACT — Scientific Decision-Support Workbench Linking Drug Discovery to Bioprocess Manufacturing

**bioREACT** is an interactive, evidence-aware computational decision-support system that connects early-stage **molecular target & candidate discovery** directly to **industrial manufacturing feasibility, reactor scale-up physics, and constrained Bayesian experimental design**.

In translational biotechnology and pharmaceutical R&D, promising molecular candidates frequently fail during CMC (Chemistry, Manufacturing, and Controls) scale-up because discovery metrics (such as pocket binding affinity) are evaluated in isolation from bulk manufacturing constraints (such as synthetic route complexity for small molecules or oxygen transfer, hydrodynamic shear, mixing time, and cell-retention filter hydraulics for mammalian biologics). **bioREACT** bridges this gap within a single authoritative scientific workbench—empowering medicinal chemists, bioprocess engineers, and multidisciplinary review teams to evaluate *what to make*, *how to manufacture it at scale*, and *which wet-lab experiment to run next*.

---

## Core Mission & Design Philosophy

- **Discovery-to-Manufacturing Continuity**: Unifies target selection, 3D structural binding inspection, modality routing, scale-up physics, and technoeconomic COGS estimation into one continuous workflow.
- **Modality-Appropriate Physics (Zero False Extrapolation)**: Automatically classifies candidates into **Small-Molecule Organic Synthesis** vs **Mammalian CHO Perfusion Biomanufacturing** (with researcher override and an **Honest Scientific Abstention Gate** when evidence is insufficient or when microbial fermentation physics are uncalibrated). Small-molecule docking scores are never falsely extrapolated to predict biologic bioreactor performance.
- **Single Authoritative Simulation State**: Both **Guided Demo Mode** (streamlined 5-stage pitch workflow) and **Research Workbench Mode** (full 7-stage engineering & PRISMA literature workbench) share the exact same live reactor configuration, mass-balance engine, constraint radar, and safety gates.
- **Epistemic Transparency & Human-in-the-Loop Governance**: Every parameter carries a strict provenance classification (*Directly measured & source-verified*, *Literature-derived*, *Researcher-provided*, or *Synthetic demonstration assumption*), and all automated protocol recommendations are gated behind mandatory human engineering sign-off.

---

## Overview of Core Scientific Workbench Features

### 1. Interactive 3D Molecular Docking & Multi-Critic Candidate Screening
- **Real-Time 3D Structural Pocket & Biologic Viewer (`Three.js` / WebGL)**:
  - Interactive ribbon, surface, and atomic ball-and-stick rendering for curated therapeutic targets including **MRP1 / ABCC1 (Multidrug Resistance-Associated Protein 1, PDB: `5UJA` / `6BHU`)**, **PARP1 (`5DS3`)**, **EGFR (`1M17`)**, **BCR-ABL1 (`2HYY`)**, and full IgG1 monoclonal antibody architectures (**Trastuzumab / HER2**, **Adalimumab / TNF-α**, **Pembrolizumab / PD-1**, **Bevacizumab / VEGF-A**).
  - Visualises the 3D docking search box, key pocket residues, hydrogen bonds, $\pi$-stacking, and hydrophobic contacts alongside experimental cryo-EM / X-ray resolution and Ramachandran quality metrics.
- **Target-Specific Biological Context**:
  - For efflux-transporter targets like **MRP1**, illustrates how designing a selective pocket inhibitor blocks ATP-dependent drug efflux so intracellular chemotherapy stays inside resistant tumour cells.
- **Multi-Critic Molecular Screening Pipeline**:
  - Evaluates reference ligands, co-crystallised substrates, custom SMILES inputs, and generative analogues (`GenMol` / `DiffSBDD`) across:
    - **Docking Affinity** ($\Delta G$, $\text{kcal/mol}$) across multiple binding poses
    - **Synthetic Accessibility Score ($\text{SA}$)** & multi-step route complexity
    - **Quantitative Estimate of Drug-likeness ($\text{QED}$)**
    - **Lipinski Rule-of-Five** & PAINS / structural alert critics

---

### 2. Engineering Feasibility & Interactive 500 L Bioreactor Physics
For biologically manufactured candidates (such as recombinant IgG1 mAbs expressed in high-density **CHO-K1 perfusion culture**), **bioREACT** provides a first-principles hydrodynamic and mass-transfer simulation engine coupled to a live **Interactive Animated 500 L Stirred-Tank Bioreactor (STR) + Hollow-Fibre Perfusion Cutaway**:

- **Live Physics & Hydrodynamic Model (`src/services/bioprocessEngine.ts`)**:
  - **Oxygen Mass Balance**: Computes volumetric mass-transfer coefficient $k_La$ via Van 't Riet correlations across sparger types (`Open Pipe`, `Ring Sparger`, `Sintered Microsparger`), gassed power draw $P_g/V$ (Michel correlation), superficial gas velocity $v_s$, and Henry's law $\text{O}_2$ enrichment ($21\%\text{–}100\%$) to test whether **Oxygen Transfer Rate ($\text{OTR}$)** satisfies cellular **Oxygen Uptake Rate ($\text{OUR} = q_{\text{O}_2} \cdot X_v$)**.
  - **Impeller Hydrodynamics & Kolmogorov Microscale**: Evaluates Reynolds number ($Re$), transitional/turbulent power number ($N_p$), maximum local energy dissipation ($\varepsilon_{\max}$), **Kolmogorov eddy microscale ($\lambda_K \ge 18.0\,\mu\text{m}$)**, and **impeller tip shear stress ($\tau_{\max} \le 1.65\text{ Pa}$)** across 1 to 3 impeller stages (`Rushton Turbine`, `Pitched-Blade`, `Marine Axial`, `Low-Shear Hydrofoil`).
  - **Gassed Bulk Mixing Time ($t_{m,95}$)**: Computes gassed compartmental mixing time ($t_{m,95} \le 60.0\text{ s}$) accounting for vessel aspect ratio ($Z/D_T$), impeller spacing ($\Delta C/D_i$), and top impeller submergence ($S_{\text{top}}/D_i \ge 0.50$).
  - **Hollow-Fibre Cell-Retention Hydraulics (`ATF` vs `TFF`)**: Models Hagen-Poiseuille lumen wall shear rate ($\gamma_w$), effective cell-suspension viscosity ($\mu_{\text{eff}}$), **lumen wall shear stress ($\tau_w \le 2.50\text{ Pa}$)**, and **axial lumen pressure drop ($\Delta P_{\text{HF}} \le 35.0\text{ kPa}$)** as a function of fibre count, inner lumen diameter ($0.5\text{–}1.2\text{ mm}$), and recirculation flow rate.
- **6-Axis Constraint Violation Radar Chart**:
  - Normalises all six coupled physical constraints (Oxygen Transfer, Impeller Shear, Bulk Mixing Time, Filter Hydraulics, Superficial Gas Velocity, and Impeller Geometry) to $100\%$ of their operational ceiling so cross-subsystem bottlenecks are immediately diagnosed.
- **Unified Multi-Objective Reactor Configuration Optimiser**:
  - Simultaneously optimises discrete and continuous vessel + filter hardware settings against user-weighted objectives (*Minimise Mixing Time*, *Minimise Filter Pressure Drop & Wall Shear*, *Maximise Oxygen Transfer*, *Minimise Shear Stress*, and *Balance Productivity vs COGS/Energy*), returning ranked configurations with before-and-after physical comparisons.

---

### 3. Constrained Bayesian Optimisation & Reproducible Benchmarking
- **Continuous-Margin Constrained Gaussian Process Surrogate**:
  - Optimises continuous perfusion operating setpoints—**Perfusion Exchange Rate ($x_1$, $\text{VVD}$)** and **Dissolved Oxygen Setpoint ($x_2$, $\text{DO}\%$)**—using Expected Improvement weighted by joint probabilistic feasibility ($\text{EI}(\mathbf{x}) \times \prod_k \Phi(\text{margin}_k)$).
  - Avoids the boundary-collapse pathology of flat penalty baselines ($-500$ cliff penalties) by modelling smooth physical constraint margins across the operating window.
- **Reproducible 8-Seed Computational Benchmark**:
  - Runs live, deterministic head-to-head evaluations (`Seeds 101–108`, 16 iterations per seed) comparing **Constrained Bayesian Optimisation** against **Uniform Random Search** and a **Flat $-500$ Penalty GP Baseline** on identical initial Latin Hypercube designs, reporting mean ± SD best feasible volumetric productivity ($\text{mg}\cdot\text{L}^{-1}\cdot\text{day}^{-1}$) and paired sign-test statistics.
- **Uncertainty-Aware Next Experiments & Human Safety Gates**:
  - Proposes three complementary candidate wet-lab protocols (**Exploitation**, **Boundary Test**, and **Exploration**) alongside GP leave-one-out cross-validation ($R^2$, coverage) and **4 mandatory Human-in-the-Loop Safety Gates** (*Literature Provenance*, *Reactor Scale-Up Sign-Off*, *Shear & CQA Margin*, and *Wet-Lab Release*).
- **8-Database PRISMA Literature Scoping Pipeline**:
  - Queries and deduplicates records across **Europe PMC, OpenAlex, PubMed, Crossref, Semantic Scholar, UniProt, ChEMBL, and ClinicalTrials.gov** (with verified offline literature fixtures for deterministic reproducibility).

---

## Technology Stack

| Layer | Technologies Used | Purpose in bioREACT |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19**, **TypeScript 7**, **Tailwind CSS v4** (`@tailwindcss/vite`) | Modular scientific workbench UI, responsive layout, synchronized Guided Demo & Research Workbench views |
| **3D Molecular & Spatial Graphics** | **Three.js** (`three`, `OrbitControls`) + Custom Interactive SVG Physics Canvas | Hardware-accelerated 3D protein/ligand pocket viewer and live animated 500 L bioreactor & hollow-fibre cutaway |
| **Scientific & Optimisation Engine** | Custom TypeScript First-Principles Engine (`src/services/bioprocessEngine.ts`) | Mass-balance solver, Van 't Riet $k_La$, Kolmogorov shear, Hagen-Poiseuille filter hydraulics, Matérn 5/2 GP surrogate, and Constrained BO |
| **Backend & API Proxy** | **Node.js (v22+)**, **Express 4** (`server.ts`), **tsx** | Parallel 8-database PRISMA literature scoping (`/api/streams/gather`), deterministic/LLM synthesis (`/api/agent/synthesize`), and Vite middleware integration |
| **AI Synthesis Integration** | **Google GenAI SDK** (`@google/genai`) | Optional server-side scientific brief synthesis with automatic deterministic rule-based fallback |
| **Build & Tooling** | **Vite 8** (`@vitejs/plugin-react`), **TypeScript (`tsc`)**, **Lucide React** | Fast frontend bundling, strict static type verification (`npm run lint`), and production asset compilation |

---

## Installation & Usage (Vite + Express Full-Stack Workflow)

### Prerequisites
- **Node.js** `v22.0.0` or higher
- **npm** `v10+`

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Environment Configuration (Optional)
Copy `.env.example` to `.env` if you wish to enable live Gemini API prose synthesis for Stage 6/7 executive reports:
```bash
cp .env.example .env
```
```env
# Optional: If omitted, bioREACT runs 100% deterministically using its built-in mass-balance & PRISMA orchestrator
GEMINI_API_KEY="your_api_key_here"
```

### 3. Run the Development Server (Vite Middleware + Express API)
```bash
npm run dev
```
- Starts the full-stack server (`tsx server.ts`) with **Vite** mounted in middleware mode at **`http://localhost:3000`**.

### 4. Type-Check & Build with Vite for Production
```bash
# Run TypeScript compiler verification
npm run lint

# Build optimized client bundle into dist/ using Vite
npm run build
```

### 5. Preview or Start Production Server
```bash
# Start the production Express + static dist/ server on port 3000
npm start

# Or preview the static Vite build directly
npm run preview
```

---

## Repository Structure

```text
├── index.html                                    # Vite HTML entry point
├── vite.config.ts                                # Vite 8 configuration (React + Tailwind CSS v4)
├── server.ts                                     # Express backend server + Vite dev middleware & production static server
├── package.json                                  # Scripts & dependency manifest
├── src/
│   ├── App.tsx                                   # Authoritative state container linking Guided Demo & Research Workbench
│   ├── main.tsx                                  # React 19 DOM root
│   ├── types/
│   │   └── bioreact.ts                           # Comprehensive TypeScript interfaces for physics, docking, GP & provenance
│   ├── data/
│   │   ├── bioprocessData.ts                     # Curated biologic candidates, impeller hydrodynamics, 500 L STR & HF defaults
│   │   └── dissertationDockingData.ts            # 3D protein coordinates (MRP1, PARP1, EGFR, BCR-ABL1) & multi-critic ligand data
│   ├── services/
│   │   └── bioprocessEngine.ts                   # Mass-balance solver, multi-objective reactor optimiser & Constrained BO engine
│   └── components/
│       ├── GuidedDemoModePanel.tsx               # 5-stage Guided Demo workflow for 4-minute hackathon pitches
│       ├── UnifiedWorkbenchHomePanel.tsx         # Target & ligand input, 3D molecular viewer, modality classifier & route comparison
│       ├── BioreactorProcessVisualiserPanel.tsx  # Interactive animated 500 L STR cutaway & unified multi-objective reactor optimiser
│       ├── ConstraintViolationRadarPanel.tsx     # 6-axis normalised engineering constraint radar chart
│       ├── MassBalanceScaleUpPanel.tsx           # Detailed mass-balance tables, sensitivity sweeps & hollow-fibre hydraulic controls
│       ├── ResolveOxygenLimitationPanel.tsx      # Staged engineering intervention comparison & trade-off matrix
│       ├── NextExperimentsPanel.tsx              # Uncertainty-aware experiment recommendations & human safety gates
│       └── ProvenanceAuditDrawer.tsx             # Parameter-level epistemic audit & literature citation drawer
```
