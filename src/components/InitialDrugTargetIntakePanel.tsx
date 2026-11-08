import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Database,
  FlaskConical,
  Layers,
  Sparkles,
  Upload,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import {
  CombinedCandidateAssessment,
  PROTEIN_TARGETS_3D,
  ProteinTarget3DConfig,
  evaluateSmilesWithCritics,
} from '../data/dissertationDockingData';
import { BiologicCandidate, CandidatePathwayMode } from '../types/bioreact';

export interface DrugTargetKnownBinderIntakeState {
  presetId: string;
  pathwayRoute: 'route_a_small_molecule' | 'route_b_biologic';
  referenceCitation: string;
  referenceAccessionId: string;
  targetProteinSymbol: string;
  targetProteinFullName: string;
  targetUniprotId: string;
  receptorPdbId: string;
  receptorPocketDescription: string;
  pocketCenter: [number, number, number];
  pocketSize: [number, number, number];
  uploadedReceptorFileName?: string;
  uploadedAtomCount?: number;
  knownBinderName: string;
  knownBinderSmiles: string;
  knownBinderAffinityKcalMol: number;
  knownBinderKdOrPotency: string;
  candidateName: string;
  candidateSmiles: string;
  candidateAffinityKcalMol: number;
  activeViewerLigandMode: 'known_binder' | 'designed_candidate';
  linkedBiologicCandidateId?: string;
}

export const INITIAL_DRUG_TARGET_PRESETS: Record<
  string,
  DrugTargetKnownBinderIntakeState
> = {
  mrp1_mk571_small_molecule: {
    presetId: 'mrp1_mk571_small_molecule',
    pathwayRoute: 'route_a_small_molecule',
    referenceCitation:
      'Johnson & Chen (Cell, 2017) — Cryo-EM structure of ATP-bound human MRP1 + LTC4 pocket',
    referenceAccessionId: 'DOI: 10.1016/j.cell.2017.01.008 · Europe PMC PMC5582140',
    targetProteinSymbol: 'MRP1 (ABCC1)',
    targetProteinFullName:
      'Multidrug Resistance-Associated Protein 1 (ATP-Binding Cassette Sub-Family C Member 1)',
    targetUniprotId: 'P33527',
    receptorPdbId: '5UJA / 6BHU',
    receptorPocketDescription:
      'Transmembrane Bundle TMD1–TMD2 Bipartite P-Pocket (LYS-332, ARG-1196) & H-Pocket (TRP-1246, PHE-594)',
    pocketCenter: [114.2, 128.6, 96.4],
    pocketSize: [24.0, 24.0, 24.0],
    knownBinderName: 'MK-571 (Known Competitive MRP1 / LTC4 Pocket Inhibitor)',
    knownBinderSmiles:
      'CN(C)C(=O)CCS(=O)(=O)c1ccc(cc1)C(SCCC(=O)O)c2cccc(\\C=C\\c3ccc4ccc(Cl)cc4n3)c2',
    knownBinderAffinityKcalMol: -9.1,
    knownBinderKdOrPotency: 'IC₅₀ = 1.1 μM (Vina Ref −9.10 kcal/mol)',
    candidateName: 'R2-Lead-1 (Achiral Biphenyl Sulfonamide Lead)',
    candidateSmiles:
      'O=C(O)c1ccc(-c2ccc(S(=O)(=O)Nc3ccc(Cl)c(C(F)(F)F)c3)cc2)cc1',
    candidateAffinityKcalMol: -10.82,
    activeViewerLigandMode: 'designed_candidate',
  },
  her2_trastuzumab_biologic: {
    presetId: 'her2_trastuzumab_biologic',
    pathwayRoute: 'route_b_biologic',
    referenceCitation:
      'Cho et al. (Nature, 2003) & Aertgeerts et al. (J. Biol. Chem., 2011) — HER2 Ectodomain & Kinase Structure',
    referenceAccessionId: 'DrugBank DB00072 · ChEMBL1201585 · PMID 12589362',
    targetProteinSymbol: 'HER2 (ERBB2)',
    targetProteinFullName:
      'Receptor Tyrosine-Protein Kinase erbB-2 (Proto-Oncogene Neu / CD340)',
    targetUniprotId: 'P04626',
    receptorPdbId: '3PP0 / 1N8Z',
    receptorPocketDescription:
      'Extracellular Domain IV Juxtamembrane Epitope (1N8Z for mAb) & Kinase Hinge MET-801 / LYS-753 Pocket (3PP0)',
    pocketCenter: [16.4, 24.8, 32.1],
    pocketSize: [22.0, 22.0, 22.0],
    knownBinderName:
      'Trastuzumab (Herceptin · Known IgG1 Biologic Binder) + SYR127063 Kinase Reference',
    knownBinderSmiles:
      'Cc1cc(Nc2ncnc3ccc(NC4=NC(C)(C)CO4)cc23)ccc1Oc1ccn2ncnc2c1',
    knownBinderAffinityKcalMol: -9.6,
    knownBinderKdOrPotency: 'mAb K_D = 0.5 nM (145.5 kDa IgG1) · Kinase Ref −9.60 kcal/mol',
    candidateName: 'Trastuzumab (Herceptin · 145.5 kDa Humanised IgG1 mAb)',
    candidateSmiles:
      'Cc1cc(Nc2ncnc3ccc(NC4=NC(C)(C)CO4)cc23)ccc1Oc1ccn2ncnc2c1',
    candidateAffinityKcalMol: -9.6,
    activeViewerLigandMode: 'known_binder',
    linkedBiologicCandidateId: 'trastuzumab',
  },
  pd1_pembrolizumab_biologic: {
    presetId: 'pd1_pembrolizumab_biologic',
    pathwayRoute: 'route_b_biologic',
    referenceCitation:
      'Tan et al. (Nat. Commun., 2017) & Na et al. (Cell Res., 2017) — Pembrolizumab Fab–PD-1 Complex',
    referenceAccessionId: 'DrugBank DB09037 · ChEMBL3137343 · PDB 5GGS',
    targetProteinSymbol: 'PD-1 (PDCD1)',
    targetProteinFullName:
      'Programmed Cell Death Protein 1 (Immune Checkpoint Receptor CD279)',
    targetUniprotId: 'Q15116',
    receptorPdbId: '5GGS / 5JXE',
    receptorPocketDescription:
      'Extracellular IgV Domain C’D-Loop & FG-Loop Checkpoint Interface (Blocks PD-L1 Binding)',
    pocketCenter: [16.4, 24.8, 32.1],
    pocketSize: [22.0, 22.0, 22.0],
    knownBinderName: 'Pembrolizumab (Keytruda · Known IgG4 S228P Checkpoint Binder)',
    knownBinderSmiles:
      'Cc1cc(Nc2ncnc3ccc(NC4=NC(C)(C)CO4)cc23)ccc1Oc1ccn2ncnc2c1',
    knownBinderAffinityKcalMol: -9.4,
    knownBinderKdOrPotency: 'mAb K_D = 29 pM (146.3 kDa IgG4 S228P)',
    candidateName: 'Pembrolizumab (Keytruda · 146.3 kDa IgG4 mAb)',
    candidateSmiles:
      'Cc1cc(Nc2ncnc3ccc(NC4=NC(C)(C)CO4)cc23)ccc1Oc1ccn2ncnc2c1',
    candidateAffinityKcalMol: -9.4,
    activeViewerLigandMode: 'known_binder',
    linkedBiologicCandidateId: 'pembrolizumab',
  },
  egfr_osimertinib_small_molecule: {
    presetId: 'egfr_osimertinib_small_molecule',
    pathwayRoute: 'route_a_small_molecule',
    referenceCitation:
      'Yosaatmadja et al. (J. Med. Chem., 2015) — Crystal Structure of EGFR Kinase Domain with AZD9291',
    referenceAccessionId: 'DOI: 10.1021/acs.jmedchem.5b01146 · ChEMBL3353410 · PDB 4ZAU',
    targetProteinSymbol: 'EGFR (T790M)',
    targetProteinFullName:
      'Epidermal Growth Factor Receptor Tyrosine Kinase (Gatekeeper T790M Mutant)',
    targetUniprotId: 'P00533',
    receptorPdbId: '4ZAU',
    receptorPocketDescription:
      'ATP-Binding Hinge (MET-793) & Covalent CYS-797 Margin near Gatekeeper MET-790',
    pocketCenter: [114.2, 128.6, 96.4],
    pocketSize: [22.0, 22.0, 22.0],
    knownBinderName: 'Osimertinib / AZD9291 (Known 3rd-Gen EGFR T790M Binder)',
    knownBinderSmiles:
      'COc1cc(N(C)CCN(C)C)c(NC(=O)C=C)cc1Nc2nccc(n2)-c3cn(C)c4ccccc34',
    knownBinderAffinityKcalMol: -9.45,
    knownBinderKdOrPotency: 'IC₅₀ = 12 nM (Vina −9.45 kcal/mol)',
    candidateName: 'Achiral Reversible Biaryl-Pyrimidine Lead (Non-Michael Acceptor)',
    candidateSmiles:
      'COc1cc(N2CCOCC2)ccc1Nc2nccc(n2)-c3ccc(S(=O)(=O)Nc4ccc(F)cc4)cc3',
    candidateAffinityKcalMol: -10.15,
    activeViewerLigandMode: 'known_binder',
  },
};

interface InitialDrugTargetIntakePanelProps {
  intakeState: DrugTargetKnownBinderIntakeState;
  onUpdateIntakeState: (next: DrugTargetKnownBinderIntakeState) => void;
  allBiologicCandidates?: BiologicCandidate[];
  onSelectBiologicCandidate?: (candidateId: string) => void;
  onChangePathwayMode?: (mode: CandidatePathwayMode) => void;
  onApplyTo3DViewer?: (
    intake: DrugTargetKnownBinderIntakeState,
    customTarget?: ProteinTarget3DConfig
  ) => void;
  compactMode?: boolean;
}

export const InitialDrugTargetIntakePanel: React.FC<
  InitialDrugTargetIntakePanelProps
> = ({
  intakeState,
  onUpdateIntakeState,
  onSelectBiologicCandidate,
  onChangePathwayMode,
  onApplyTo3DViewer,
  compactMode = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Live Critic Evaluation of Known Binder SMILES and Candidate SMILES
  const knownBinderCritic: CombinedCandidateAssessment = useMemo(
    () => evaluateSmilesWithCritics(intakeState.knownBinderSmiles || 'c1ccccc1'),
    [intakeState.knownBinderSmiles]
  );

  const candidateCritic: CombinedCandidateAssessment = useMemo(
    () => evaluateSmilesWithCritics(intakeState.candidateSmiles || 'c1ccccc1'),
    [intakeState.candidateSmiles]
  );

  const handleSelectPreset = (presetKey: string) => {
    const preset = INITIAL_DRUG_TARGET_PRESETS[presetKey];
    if (!preset) return;
    onUpdateIntakeState(preset);
    if (preset.pathwayRoute === 'route_b_biologic') {
      onChangePathwayMode?.('established_biologic');
      if (preset.linkedBiologicCandidateId) {
        onSelectBiologicCandidate?.(preset.linkedBiologicCandidateId);
      }
    } else {
      onChangePathwayMode?.('small_molecule_chemical');
    }
    onApplyTo3DViewer?.(preset);
    setStatusBanner(
      `Loaded preset "${preset.targetProteinSymbol}" with receptor ${preset.receptorPdbId}, reference (${preset.referenceAccessionId.split('·')[0].trim()}), and known binder "${preset.knownBinderName}".`
    );
  };

  // Parse uploaded .pdb / .pdbqt file to compute 3D pocket coordinates
  const handleReceptorFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/);
    const xs: number[] = [];
    const ys: number[] = [];
    const zs: number[] = [];

    for (const line of lines) {
      if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
        const x = parseFloat(line.slice(30, 38));
        const y = parseFloat(line.slice(38, 46));
        const z = parseFloat(line.slice(46, 54));
        if (!Number.isNaN(x) && !Number.isNaN(y) && !Number.isNaN(z)) {
          xs.push(x);
          ys.push(y);
          zs.push(z);
        }
      }
    }

    if (xs.length === 0) {
      setStatusBanner(
        `Uploaded ${file.name}, but no ATOM/HETATM coordinate lines were found.`
      );
      return;
    }

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    const cx = Number(((minX + maxX) / 2).toFixed(2));
    const cy = Number(((minY + maxY) / 2).toFixed(2));
    const cz = Number(((minZ + maxZ) / 2).toFixed(2));

    const sx = Number(Math.min(30, Math.max(18, maxX - minX + 10)).toFixed(1));
    const sy = Number(Math.min(30, Math.max(18, maxY - minY + 10)).toFixed(1));
    const sz = Number(Math.min(30, Math.max(18, maxZ - minZ + 10)).toFixed(1));

    const nextState: DrugTargetKnownBinderIntakeState = {
      ...intakeState,
      presetId: 'custom_user_input',
      receptorPdbId: file.name,
      uploadedReceptorFileName: file.name,
      uploadedAtomCount: xs.length,
      pocketCenter: [cx, cy, cz],
      pocketSize: [sx, sy, sz],
    };
    onUpdateIntakeState(nextState);
    setStatusBanner(
      `Parsed receptor structure "${file.name}" (${xs.length.toLocaleString()} atoms) → Auto-computed 3D docking box center [${cx}, ${cy}, ${cz}] Å (${sx}×${sy}×${sz} Å).`
    );
  };

  const handleApplyIntake = () => {
    const baseTarget =
      intakeState.pathwayRoute === 'route_b_biologic' ||
      intakeState.targetProteinSymbol.toUpperCase().includes('HER2')
        ? PROTEIN_TARGETS_3D.HER2
        : PROTEIN_TARGETS_3D.MRP1;

    const customTarget: ProteinTarget3DConfig = {
      ...baseTarget,
      id: intakeState.targetProteinSymbol.split(' ')[0] || 'CUSTOM',
      symbol: intakeState.targetProteinSymbol,
      fullName: intakeState.targetProteinFullName,
      pdbId: intakeState.receptorPdbId,
      uniprotId: intakeState.targetUniprotId,
      referenceLigandName: intakeState.knownBinderName,
      referenceLigandSmiles: intakeState.knownBinderSmiles,
      referenceAffinityKcalMol: intakeState.knownBinderAffinityKcalMol,
      boxCenter: intakeState.pocketCenter,
      boxSize: intakeState.pocketSize,
    };

    if (intakeState.pathwayRoute === 'route_b_biologic') {
      onChangePathwayMode?.('established_biologic');
      if (intakeState.linkedBiologicCandidateId) {
        onSelectBiologicCandidate?.(intakeState.linkedBiologicCandidateId);
      }
    } else {
      onChangePathwayMode?.('small_molecule_chemical');
    }

    onApplyTo3DViewer?.(intakeState, customTarget);
    setStatusBanner(
      `Synchronised 3D Viewer & Route Gate with Target "${intakeState.targetProteinSymbol}" (${intakeState.targetUniprotId}), Receptor PDB "${intakeState.receptorPdbId}", Reference "${intakeState.referenceAccessionId}", and Known Binder "${intakeState.knownBinderName}".`
    );
  };

  return (
    <div className="bg-white border border-slate-300 shadow-xs">
      {/* Header Bar */}
      <div className="px-4 py-3 bg-slate-900 text-slate-100 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500 text-slate-950">
            INITIAL DRUG &amp; TARGET INPUT
          </span>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white">
              Configure Candidate Drug via Literature Reference, Target Protein, 3D Receptor &amp; Known Binder
            </h2>
            <p className="text-[11px] text-slate-300">
              Select a verified benchmark preset or enter custom Reference + Target Protein + Receptor (.pdb/PDB ID) + Known Binder (SMILES/mAb) to initialise the 3D pocket &amp; manufacturing route.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSelectPreset('mrp1_mk571_small_molecule')}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Default
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="px-2.5 py-1 text-[11px] font-mono font-semibold bg-slate-800 text-cyan-300 border border-slate-700 hover:bg-slate-700 cursor-pointer"
          >
            {isExpanded ? 'Collapse Input Form' : 'Expand Input Form'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* 1-Click Benchmark Presets Strip */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-mono font-bold uppercase text-slate-700">
                Quick-Load Validated Target + Receptor + Known Binder Presets:
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Active Mode:{' '}
                <strong className="text-slate-900">
                  {intakeState.pathwayRoute === 'route_a_small_molecule'
                    ? 'Route A · Small-Molecule Chemical Synthesis'
                    : 'Route B · Biologic Cell-Culture Bioreactor'}
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                {
                  id: 'mrp1_mk571_small_molecule',
                  badge: 'Route A · Small Molecule',
                  title: 'MRP1 (ABCC1) + MK-571 Binder',
                  sub: 'PDB 5UJA · UniProt P33527 · Ref −9.1 kcal/mol',
                },
                {
                  id: 'her2_trastuzumab_biologic',
                  badge: 'Route B · Biologic mAb',
                  title: 'HER2 (ERBB2) + Trastuzumab',
                  sub: 'PDB 3PP0/1N8Z · UniProt P04626 · DB00072',
                },
                {
                  id: 'pd1_pembrolizumab_biologic',
                  badge: 'Route B · Biologic mAb',
                  title: 'PD-1 (PDCD1) + Pembrolizumab',
                  sub: 'PDB 5GGS · UniProt Q15116 · DB09037',
                },
                {
                  id: 'egfr_osimertinib_small_molecule',
                  badge: 'Route A · Small Molecule',
                  title: 'EGFR (T790M) + Osimertinib',
                  sub: 'PDB 4ZAU · UniProt P00533 · ChEMBL3353410',
                },
              ].map((p) => {
                const isSelected = intakeState.presetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id)}
                    className={`p-2.5 text-left border transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                      <span
                        className={`px-1.5 py-0.5 font-bold ${
                          p.badge.includes('Route A')
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        {p.badge}
                      </span>
                      {isSelected && (
                        <span className="text-blue-700 font-bold">● Active</span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1">
                      {p.title}
                    </div>
                    <div className="text-[10px] font-mono text-slate-600 truncate">
                      {p.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4-Pillar Input Grid: (1) Reference, (2) Target Protein, (3) Receptor Structure, (4) Known Binder */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* PILLAR 1: LITERATURE / DATABASE REFERENCE */}
            <div className="p-3 bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1 border-b border-slate-200 pb-1.5">
                  <span className="text-[11px] font-mono font-bold uppercase text-slate-900 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    1. Reference Source
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-blue-100 text-blue-900 font-semibold">
                    DOI / PMID / DB
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-semibold text-slate-600 mb-0.5">
                    Primary Literature Citation / Study
                  </label>
                  <input
                    type="text"
                    aria-label="Primary Literature Citation"
                    value={intakeState.referenceCitation}
                    onChange={(e) =>
                      onUpdateIntakeState({
                        ...intakeState,
                        presetId: 'custom_user_input',
                        referenceCitation: e.target.value,
                      })
                    }
                    placeholder="e.g. Johnson & Chen (Cell 2017)"
                    className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-semibold text-slate-600 mb-0.5">
                    Reference Accession (DOI / PubMed / ChEMBL / DrugBank)
                  </label>
                  <input
                    type="text"
                    aria-label="Reference Accession ID"
                    value={intakeState.referenceAccessionId}
                    onChange={(e) =>
                      onUpdateIntakeState({
                        ...intakeState,
                        presetId: 'custom_user_input',
                        referenceAccessionId: e.target.value,
                      })
                    }
                    placeholder="e.g. DOI: 10.1016/... or DB00072"
                    className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200">
                Grounds parameter provenance &amp; PRISMA audit trail.
              </div>
            </div>

            {/* PILLAR 2: TARGET PROTEIN */}
            <div className="p-3 bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1 border-b border-slate-200 pb-1.5">
                  <span className="text-[11px] font-mono font-bold uppercase text-slate-900 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    2. Target Protein
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-100 text-emerald-900 font-semibold">
                    UniProt: {intakeState.targetUniprotId}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="block text-[10px] font-mono font-semibold text-slate-600 mb-0.5">
                      Target Symbol
                    </label>
                    <input
                      type="text"
                      aria-label="Target Protein Symbol"
                      value={intakeState.targetProteinSymbol}
                      onChange={(e) =>
                        onUpdateIntakeState({
                          ...intakeState,
                          presetId: 'custom_user_input',
                          targetProteinSymbol: e.target.value,
                        })
                      }
                      placeholder="e.g. MRP1 (ABCC1)"
                      className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-semibold text-slate-600 mb-0.5">
                      UniProt ID
                    </label>
                    <input
                      type="text"
                      aria-label="Target UniProt ID"
                      value={intakeState.targetUniprotId}
                      onChange={(e) =>
                        onUpdateIntakeState({
                          ...intakeState,
                          presetId: 'custom_user_input',
                          targetUniprotId: e.target.value,
                        })
                      }
                      placeholder="e.g. P33527"
                      className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-semibold text-slate-600 mb-0.5">
                    Target Protein Name &amp; Modality Route
                  </label>
                  <input
                    type="text"
                    aria-label="Target Protein Full Name"
                    value={intakeState.targetProteinFullName}
                    onChange={(e) =>
                      onUpdateIntakeState({
                        ...intakeState,
                        presetId: 'custom_user_input',
                        targetProteinFullName: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 text-slate-900 mb-1.5"
                  />
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateIntakeState({
                          ...intakeState,
                          pathwayRoute: 'route_a_small_molecule',
                        });
                        onChangePathwayMode?.('small_molecule_chemical');
                      }}
                      className={`py-1 px-1.5 text-[10px] font-mono border cursor-pointer ${
                        intakeState.pathwayRoute === 'route_a_small_molecule'
                          ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      Route A: Small Mol
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateIntakeState({
                          ...intakeState,
                          pathwayRoute: 'route_b_biologic',
                        });
                        onChangePathwayMode?.('established_biologic');
                      }}
                      className={`py-1 px-1.5 text-[10px] font-mono border cursor-pointer ${
                        intakeState.pathwayRoute === 'route_b_biologic'
                          ? 'bg-blue-700 text-white border-blue-700 font-bold'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      Route B: Biologic
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200">
                Distinguishes target antigen/receptor from therapeutic drug.
              </div>
            </div>

            {/* PILLAR 3: 3D RECEPTOR STRUCTURE & POCKET */}
            <div className="p-3 bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1 border-b border-slate-200 pb-1.5">
                  <span className="text-[11px] font-mono font-bold uppercase text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    3. Receptor Structure
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-indigo-100 text-indigo-900 font-semibold">
                    PDB: {intakeState.receptorPdbId}
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-semibold text-slate-600 mb-0.5">
                    Receptor PDB ID / Cryo-EM or Crystal Structure
                  </label>
                  <input
                    type="text"
                    aria-label="Receptor PDB ID"
                    value={intakeState.receptorPdbId}
                    onChange={(e) =>
                      onUpdateIntakeState({
                        ...intakeState,
                        presetId: 'custom_user_input',
                        receptorPdbId: e.target.value,
                      })
                    }
                    placeholder="e.g. 5UJA / 3PP0"
                    className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-semibold text-slate-600 mb-0.5">
                    Binding Pocket / Epitope Coordinates (x, y, z Å)
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {[0, 1, 2].map((axisIdx) => (
                      <input
                        key={axisIdx}
                        type="number"
                        step="0.1"
                        aria-label={`Pocket Center Axis ${axisIdx}`}
                        value={intakeState.pocketCenter[axisIdx]}
                        onChange={(e) => {
                          const nextCenter: [number, number, number] = [
                            ...intakeState.pocketCenter,
                          ] as [number, number, number];
                          nextCenter[axisIdx] = Number(e.target.value) || 0;
                          onUpdateIntakeState({
                            ...intakeState,
                            presetId: 'custom_user_input',
                            pocketCenter: nextCenter,
                          });
                        }}
                        className="w-full px-1.5 py-1 text-[11px] font-mono bg-white border border-slate-300 text-slate-900"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-semibold text-slate-600 mb-0.5">
                    Or Upload Receptor Structure (.pdb / .pdbqt)
                  </label>
                  <label className="flex items-center justify-center gap-1.5 w-full py-1 px-2 text-[10px] font-mono bg-white border border-dashed border-slate-400 text-slate-700 hover:bg-slate-100 cursor-pointer">
                    <Upload className="w-3 h-3 text-indigo-600" />
                    <span>
                      {intakeState.uploadedReceptorFileName
                        ? `${intakeState.uploadedReceptorFileName} (${intakeState.uploadedAtomCount} atoms)`
                        : 'Upload .pdb / .pdbqt File'}
                    </span>
                    <input
                      type="file"
                      accept=".pdb,.pdbqt,.ent"
                      onChange={handleReceptorFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200">
                Box: {intakeState.pocketSize[0]}×{intakeState.pocketSize[1]}×
                {intakeState.pocketSize[2]} Å around pocket center.
              </div>
            </div>

            {/* PILLAR 4: KNOWN BINDER / REFERENCE LIGAND */}
            <div className="p-3 bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1 border-b border-slate-200 pb-1.5">
                  <span className="text-[11px] font-mono font-bold uppercase text-slate-900 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    4. Known Binder
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-amber-100 text-amber-900 font-semibold">
                    {intakeState.knownBinderAffinityKcalMol.toFixed(2)} kcal/mol
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-semibold text-slate-600 mb-0.5">
                    Known Binder / Reference Drug Name
                  </label>
                  <input
                    type="text"
                    aria-label="Known Binder Name"
                    value={intakeState.knownBinderName}
                    onChange={(e) =>
                      onUpdateIntakeState({
                        ...intakeState,
                        presetId: 'custom_user_input',
                        knownBinderName: e.target.value,
                      })
                    }
                    placeholder="e.g. MK-571 or Trastuzumab"
                    className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-semibold text-slate-600 mb-0.5">
                    Known Binder SMILES (for 3D Pose &amp; Critic Check)
                  </label>
                  <input
                    type="text"
                    aria-label="Known Binder SMILES"
                    value={intakeState.knownBinderSmiles}
                    onChange={(e) =>
                      onUpdateIntakeState({
                        ...intakeState,
                        presetId: 'custom_user_input',
                        knownBinderSmiles: e.target.value,
                      })
                    }
                    placeholder="Paste SMILES string..."
                    className="w-full px-2 py-1 text-[11px] font-mono bg-white border border-slate-300 text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="block text-[10px] font-mono font-semibold text-slate-600 mb-0.5">
                      Ref Vina (kcal/mol)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      aria-label="Known Binder Reference Affinity"
                      value={intakeState.knownBinderAffinityKcalMol}
                      onChange={(e) =>
                        onUpdateIntakeState({
                          ...intakeState,
                          presetId: 'custom_user_input',
                          knownBinderAffinityKcalMol: Number(e.target.value) || -9.0,
                        })
                      }
                      className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-semibold text-slate-600 mb-0.5">
                      3D Pose Shown
                    </label>
                    <select
                      aria-label="Active 3D Pose Selection"
                      value={intakeState.activeViewerLigandMode}
                      onChange={(e) => {
                        const nextMode = e.target.value as
                          | 'known_binder'
                          | 'designed_candidate';
                        const next = {
                          ...intakeState,
                          activeViewerLigandMode: nextMode,
                        };
                        onUpdateIntakeState(next);
                        onApplyTo3DViewer?.(next);
                      }}
                      className="w-full px-1.5 py-1 text-[11px] font-mono bg-white border border-slate-300 text-slate-900"
                    >
                      <option value="known_binder">Known Binder</option>
                      <option value="designed_candidate">Lead Candidate</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-600 pt-1 border-t border-slate-200 flex items-center justify-between">
                <span>
                  SA: {knownBinderCritic.synthesisability.sa_score} ·{' '}
                  {knownBinderCritic.synthesisability.stereocentres} stereo · ~
                  {knownBinderCritic.process_chemistry.estimated_steps} steps
                </span>
                <span
                  className={`px-1 font-bold uppercase ${
                    knownBinderCritic.overall_verdict === 'pass'
                      ? 'text-emerald-700'
                      : knownBinderCritic.overall_verdict === 'flag'
                      ? 'text-amber-700'
                      : 'text-rose-700'
                  }`}
                >
                  {knownBinderCritic.overall_verdict}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Designed / Evaluative Drug Input + Apply to 3D Viewer Button */}
          {!compactMode && (
            <div className="p-3 bg-slate-100 border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-700">
                    Candidate Drug / Lead Name (Compared vs. Known Binder)
                  </label>
                  <input
                    type="text"
                    aria-label="Candidate Drug Name"
                    value={intakeState.candidateName}
                    onChange={(e) =>
                      onUpdateIntakeState({
                        ...intakeState,
                        presetId: 'custom_user_input',
                        candidateName: e.target.value,
                      })
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs font-mono bg-white border border-slate-300 text-slate-900"
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-slate-700">
                      Candidate SMILES (or Active Scaffold)
                    </span>
                    <span className="text-slate-600">
                      Critic:{' '}
                      <strong
                        className={
                          candidateCritic.overall_verdict === 'pass'
                            ? 'text-emerald-700'
                            : candidateCritic.overall_verdict === 'flag'
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }
                      >
                        {candidateCritic.summary}
                      </strong>
                    </span>
                  </div>
                  <input
                    type="text"
                    aria-label="Candidate Drug SMILES"
                    value={intakeState.candidateSmiles}
                    onChange={(e) =>
                      onUpdateIntakeState({
                        ...intakeState,
                        presetId: 'custom_user_input',
                        candidateSmiles: e.target.value,
                      })
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs font-mono bg-white border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleApplyIntake}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Target, Receptor &amp; Known Binder into 3D Pocket</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {statusBanner && (
            <div className="px-3 py-2 bg-emerald-50 border border-emerald-300 text-xs font-mono text-emerald-950 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{statusBanner}</span>
              </span>
              <button
                type="button"
                onClick={() => setStatusBanner(null)}
                className="text-[10px] underline cursor-pointer shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
