import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import {
  AcquisitionStrategy,
  AuditedParameterProvenanceRecord,
  BiologicCandidate,
  CandidatePathwayMode,
  DatabaseStreamRecord,
  DownstreamCogsResult,
  DownstreamEconomicParams,
  ExperimentObservation,
  GroundedSimulatorParams,
  HollowFibrePhysicsParams,
  HumanSafetyGate,
  LiveEightSeedBenchmarkSummary,
  MassBalanceAndPhysicsResult,
  ProposedReactorConfiguration,
  ReactorConfiguration,
  ReactorOptimisationObjectivePresetId,
  ReactorOptimisationObjectiveWeights,
  SafetyGateId,
  SafetyGateStatus,
  StirredTankPhysicsParams,
} from '../types/bioreact';
import {
  DEFAULT_HF_PHYSICS,
  DEFAULT_STR_PHYSICS,
} from '../data/bioprocessData';
import {
  PROTEIN_TARGETS_3D,
  ProteinTarget3DConfig,
  evaluateSmilesWithCritics,
  getModesForSmiles,
} from '../data/dissertationDockingData';
import {
  formatCogsHeadline,
  optimiseUnifiedReactorConfiguration,
  solveMassBalanceAndReactorPhysics,
} from '../services/bioprocessEngine';
import { WorkbenchSectionId } from './UnifiedWorkbenchHomePanel';
import { BioreactorProcessVisualiserPanel } from './BioreactorProcessVisualiserPanel';
import {
  DrugTargetKnownBinderIntakeState,
  INITIAL_DRUG_TARGET_PRESETS,
  InitialDrugTargetIntakePanel,
} from './InitialDrugTargetIntakePanel';

export type UnifiedFlowStage =
  | 'discover'
  | 'evaluate'
  | 'manufacture'
  | 'optimise'
  | 'next_experiments';

export type ClassifiedModalityId =
  | 'chemical_synthesis'
  | 'mammalian_cho_bioreactor'
  | 'microbial_fermentation'
  | 'insufficient_evidence_abstain';

export interface PassedCandidateOption {
  id: string;
  name: string;
  targetSymbol: string;
  targetRolePlain: string;
  presetKey: string;
  screeningStatus: 'PASSED' | 'PRELIMINARY' | 'REJECTED';
  molecularSummary: string;
  bindingSummary: string;
  autoClassifiedModality: ClassifiedModalityId;
  modalityLabel: string;
  supportStatus: 'Supported (Full Model)' | 'Preliminary (Screening Only)' | 'Not Yet Supported';
  autoClassificationReasoning: string;
  estimatedStepsOrProcess: string;
  estimatedCostAndTime: string;
  prosSummary: string;
  consAndRisks: string;
  missingEvidence: string;
  nextExperiments: string[];
}

export const PASSED_CANDIDATE_GALLERY: PassedCandidateOption[] = [
  {
    id: 'mrp1_r2_lead_1',
    name: 'R2-Lead-1 (Achiral Biphenyl Sulfonamide)',
    targetSymbol: 'MRP1 (ABCC1)',
    targetRolePlain: 'Drug-efflux pump that removes chemotherapy drugs from cells',
    presetKey: 'mrp1_mk571_small_molecule',
    screeningStatus: 'PASSED',
    molecularSummary: '412 Da small molecule · 0 chiral centres · SA score 2.64',
    bindingSummary: '−10.82 kcal/mol predicted pocket fit (vs. MK-571 −9.10 kcal/mol)',
    autoClassifiedModality: 'chemical_synthesis',
    modalityLabel: 'Small-Molecule Chemical Synthesis',
    supportStatus: 'Supported (Full Model)',
    autoClassificationReasoning:
      'Molecular weight is 412 Da (< 900 Da), structure is an achiral organic sulfonamide with zero peptide bonds or glycosylation sites. Synthesised via 3-step organic chemistry; does not require living cells or a bioreactor.',
    estimatedStepsOrProcess: '3 synthetic steps (Suzuki coupling + sulfonamide condensation)',
    estimatedCostAndTime: '~$1.2k–$2.5k per 10 g batch · ~2–3 weeks (heuristic estimate)',
    prosSummary:
      'Stronger predicted pocket fit than MK-571; zero chiral centres; simple 3-step convergent synthesis.',
    consAndRisks:
      'Docking predicts pocket fit only — does not prove functional MRP1 pump inhibition or intracellular drug retention.',
    missingEvidence:
      'Wet-lab synthesis yield, vesicular MRP1 transport IC₅₀, and cellular drug-retention assay.',
    nextExperiments: [
      'Synthesise 50–100 mg via the 3-step Suzuki/sulfonamide route and verify ≥95% purity by LC-MS/NMR.',
      'Measure direct MRP1 binding and ATP-dependent vesicular transport inhibition against MK-571 control.',
      'Run intracellular drug-retention assay (calcein-AM / daunorubicin accumulation) in MRP1-expressing cells.',
    ],
  },
  {
    id: 'egfr_biaryl_lead_2',
    name: 'EGFR-Biaryl-Lead-2 (Reversible Kinase Lead)',
    targetSymbol: 'EGFR (T790M)',
    targetRolePlain: 'Mutant growth-factor receptor kinase in lung cancer cells',
    presetKey: 'egfr_osimertinib_small_molecule',
    screeningStatus: 'PASSED',
    molecularSummary: '428 Da small molecule · 0 chiral centres · SA score 2.71',
    bindingSummary: '−10.40 kcal/mol predicted ATP-cleft fit (vs. Osimertinib −9.80 kcal/mol)',
    autoClassifiedModality: 'chemical_synthesis',
    modalityLabel: 'Small-Molecule Chemical Synthesis',
    supportStatus: 'Supported (Full Model)',
    autoClassificationReasoning:
      'Low-molecular-weight organic scaffold (428 Da) with no biological post-translational modifications. Appropriately manufactured via batch organic synthesis.',
    estimatedStepsOrProcess: '3 synthetic steps (achiral cross-coupling route)',
    estimatedCostAndTime: '~$1.5k–$3.0k per 10 g batch · ~2–3 weeks (heuristic estimate)',
    prosSummary:
      'Passes all synthesisability and process-chemistry structural alert critics.',
    consAndRisks:
      'Selectivity over wild-type EGFR and cellular phosphorylation IC₅₀ remain unmeasured.',
    missingEvidence:
      'Kinase panel selectivity and cellular p-EGFR inhibition.',
    nextExperiments: [
      'Synthesise 50 mg batch via 3-step biaryl coupling route.',
      'Run biochemical EGFR (T790M vs. WT) kinase inhibition assay.',
      'Test cellular viability and phosphorylation inhibition in H1975 cells.',
    ],
  },
  {
    id: 'her2_trastuzumab_mab',
    name: 'Trastuzumab (Herceptin · 145.5 kDa IgG1)',
    targetSymbol: 'HER2 (ERBB2)',
    targetRolePlain: 'Extracellular cell-surface growth receptor on HER2+ tumours',
    presetKey: 'her2_trastuzumab_biologic',
    screeningStatus: 'PASSED',
    molecularSummary: '145,531 Da heterotetrameric IgG1 antibody · 16 disulfide bonds + Fc N-glycan',
    bindingSummary: 'Measured K_D = 0.5 nM on HER2 extracellular domain IV (PDB: 1N8Z)',
    autoClassifiedModality: 'mammalian_cho_bioreactor',
    modalityLabel: 'Mammalian Cell Biomanufacturing (500 L CHO Bioreactor)',
    supportStatus: 'Supported (Full Model)',
    autoClassificationReasoning:
      '145.5 kDa multi-chain protein requiring complex heterotetrameric disulfide assembly and human-like Asn297 Fc glycosylation. Cannot be chemically synthesised; requires mammalian CHO suspension culture.',
    estimatedStepsOrProcess: '14-day 500 L CHO Perfusion culture + Protein A / IEX purification',
    estimatedCostAndTime: '~$68–$95 / g drug substance · ~6–8 week campaign (synthetic cost model)',
    prosSummary:
      'Clinically validated HER2 binder; full 500 L oxygen, shear, mixing, and hollow-fibre physics modelled.',
    consAndRisks:
      'Initial 500 L open-pipe bioreactor setup fails oxygen transfer (OTR 5.1 < OUR 13.9 mmol/L/h) and filter wall shear.',
    missingEvidence:
      'Pilot 500 L perfusion verification with 15 μm microsparger and 35% O₂ enrichment.',
    nextExperiments: [
      'Switch sparger from open-pipe to 15 μm sintered microsparger and increase inlet O₂ to 35% to close OTR ≥ OUR.',
      'Increase hollow-fibre cartridge count to 2 modules (2.0 mm lumen) to keep lumen wall shear below 1.65 Pa.',
      'Run Ranked Bayesian Optimisation Recipe #1 (Perfusion 2.1 VVD, DO 42%, 95 RPM) with human safety sign-off.',
    ],
  },
  {
    id: 'mrp1_scfv_microbial',
    name: 'Novel Anti-MRP1 scFv Fragment (Research Stage)',
    targetSymbol: 'MRP1 (ABCC1)',
    targetRolePlain: 'Single-chain antibody fragment targeting MRP1',
    presetKey: 'mrp1_mk571_small_molecule',
    screeningStatus: 'PRELIMINARY',
    molecularSummary: '28.4 kDa single-chain variable fragment · 2 disulfide bonds · No glycosylation',
    bindingSummary: 'Hypothesised binder — experimental K_D not yet measured',
    autoClassifiedModality: 'microbial_fermentation',
    modalityLabel: 'Microbial Precision Fermentation (E. coli / K. phaffii)',
    supportStatus: 'Preliminary (Screening Only)',
    autoClassificationReasoning:
      '28.4 kDa recombinant protein with no N-linked glycosylation requirement. Suitable for microbial fermentation screening, but bioREACT abstains from quantitative bioreactor optimisation until wet-lab kinetics (q_p, q_O2, μ_max) are supplied.',
    estimatedStepsOrProcess: 'Microbial fed-batch expression + periplasmic/affinity capture',
    estimatedCostAndTime: 'Not yet supported — requires experimental expression titre & kinetics',
    prosSummary:
      'Avoids mammalian cell culture cost if soluble expression succeeds.',
    consAndRisks:
      'High risk of inclusion body aggregation; no measured kinetic parameters available yet.',
    missingEvidence:
      'Shake-flask expression titre, soluble folding yield, and specific oxygen uptake rate (q_O2).',
    nextExperiments: [
      'Perform small-scale E. coli and K. phaffii expression screening to measure soluble titre.',
      'Measure specific productivity (q_p) and oxygen uptake (q_O2) to unlock quantitative bioreactor modelling.',
    ],
  },
  {
    id: 'mrp1_r1_c01_rejected',
    name: 'R1-C01 (Raw Docking Winner — Rejected by Critics)',
    targetSymbol: 'MRP1 (ABCC1)',
    targetRolePlain: 'Drug-efflux pump (illustrates why high docking score ≠ practical drug)',
    presetKey: 'mrp1_mk571_small_molecule',
    screeningStatus: 'REJECTED',
    molecularSummary: '684 Da strained polyphenolic C-glycoside · 7 chiral centres · SA score 6.42',
    bindingSummary: '−12.90 kcal/mol raw Vina score (strongest in-silico score, but unbuildable)',
    autoClassifiedModality: 'chemical_synthesis',
    modalityLabel: 'Small-Molecule Chemical Synthesis (Flagged Impractical)',
    supportStatus: 'Supported (Full Model)',
    autoClassificationReasoning:
      'Although R1-C01 has the strongest raw docking score (−12.90 kcal/mol), bioREACT’s synthesisability and process-chemistry critics reject it due to 7 stereocentres (128 stereoisomers) and ~12–18 synthetic steps.',
    estimatedStepsOrProcess: '12–18 steps with multiple chiral separations (Rejected)',
    estimatedCostAndTime: '>$20k–$40k per 10 g · ~10–14 weeks (impractical for lead discovery)',
    prosSummary:
      'Highest raw computational docking score in the MRP1 pocket.',
    consAndRisks:
      'Severe synthetic bottleneck; high risk of failed synthesis and poor cellular permeability.',
    missingEvidence:
      'Not recommended for synthesis — replaced by practical achiral lead R2-Lead-1.',
    nextExperiments: [
      'Do not advance R1-C01 to wet-lab synthesis.',
      'Select passed candidate R2-Lead-1 (−10.82 kcal/mol, 0 chiral centres, 3 steps) instead.',
    ],
  },
];

interface GuidedDemoModePanelProps {
  intakeState: DrugTargetKnownBinderIntakeState;
  onUpdateIntakeState: (next: DrugTargetKnownBinderIntakeState) => void;
  customTarget3D: ProteinTarget3DConfig | null;
  onUpdateCustomTarget3D: (next: ProteinTarget3DConfig | null) => void;
  candidate: BiologicCandidate;
  allBiologicCandidates: BiologicCandidate[];
  onSelectCandidate: (candidateId: string) => void;
  candidatePathwayMode: CandidatePathwayMode;
  onChangePathwayMode: (mode: CandidatePathwayMode) => void;
  groundedParams: GroundedSimulatorParams;
  strParams: StirredTankPhysicsParams;
  hfParams: HollowFibrePhysicsParams;
  physicsResult: MassBalanceAndPhysicsResult;
  onUpdateStrParams: (next: StirredTankPhysicsParams) => void;
  onUpdateHfParams: (next: HollowFibrePhysicsParams) => void;
  onTriggerOxygenDeficitDemo: () => void;
  selectedReactor: ReactorConfiguration;
  observations: ExperimentObservation[];
  onRunNextExperiment: (
    strategy: AcquisitionStrategy,
    manualCoords?: { x1_vvd: number; x2_do: number; tempC?: number }
  ) => void;
  downstreamEcon: DownstreamEconomicParams;
  downstreamCogs: DownstreamCogsResult;
  safetyGates: HumanSafetyGate[];
  onUpdateSafetyGate: (
    gateId: SafetyGateId,
    status: SafetyGateStatus,
    reviewerName: string,
    justification: string
  ) => void;
  onApproveAllDemoGates: () => void;
  records: DatabaseStreamRecord[];
  prismaIncludedCount: number;
  provenanceLedger: AuditedParameterProvenanceRecord[];
  liveEightSeedSummary: LiveEightSeedBenchmarkSummary;
  onSwitchToWorkbenchSection: (section: WorkbenchSectionId) => void;
}

const ELEMENT_COLORS: Record<string, number> = {
  C: 0x00e5ff,
  N: 0x3b82f6,
  O: 0xf43f5e,
  S: 0xfacc15,
  F: 0x4ade80,
  Cl: 0x22c55e,
  Br: 0xd97706,
  P: 0xf97316,
};

const DEMO_OBJECTIVE_PRESETS: Record<
  ReactorOptimisationObjectivePresetId,
  {
    label: string;
    plainDesc: string;
    weights: ReactorOptimisationObjectiveWeights;
  }
> = {
  balanced_all_constraints: {
    label: 'Balanced All-Round (Recommended)',
    plainDesc:
      'Solves oxygen supply while reducing mixing time, filter wall shear, and cell shear together.',
    weights: {
      minimiseMixingTime: 85,
      minimiseFilterPressureDrop: 85,
      maximiseOxygenTransfer: 85,
      minimiseShearStress: 80,
      balanceProductivityAndCost: 75,
    },
  },
  minimise_mixing_and_filter_dp: {
    label: 'Fastest Mixing & Lowest Filter Shear',
    plainDesc:
      'Prioritises rapid vessel homogenisation (t_m < 35 s) and low hollow-fibre pressure drop.',
    weights: {
      minimiseMixingTime: 100,
      minimiseFilterPressureDrop: 100,
      maximiseOxygenTransfer: 65,
      minimiseShearStress: 65,
      balanceProductivityAndCost: 50,
    },
  },
  maximise_otr_and_productivity: {
    label: 'Maximum Oxygen Margin & Output',
    plainDesc:
      'Maximises dissolved oxygen headroom (OTR − OUR) for high-density perfusion.',
    weights: {
      minimiseMixingTime: 65,
      minimiseFilterPressureDrop: 65,
      maximiseOxygenTransfer: 100,
      minimiseShearStress: 60,
      balanceProductivityAndCost: 95,
    },
  },
  minimise_shear_cell_protection: {
    label: 'Gentlest Cell Shear Protection',
    plainDesc:
      'Keeps impeller tip shear and hollow-fibre wall stress as low as possible for fragile CHO cells.',
    weights: {
      minimiseMixingTime: 55,
      minimiseFilterPressureDrop: 85,
      maximiseOxygenTransfer: 70,
      minimiseShearStress: 100,
      balanceProductivityAndCost: 60,
    },
  },
  balance_productivity_energy_cost: {
    label: 'Lowest Power & Gas Cost',
    plainDesc:
      'Minimises agitation power per litre, pure O₂ consumption, and downstream $/g cost.',
    weights: {
      minimiseMixingTime: 55,
      minimiseFilterPressureDrop: 70,
      maximiseOxygenTransfer: 65,
      minimiseShearStress: 75,
      balanceProductivityAndCost: 100,
    },
  },
};

export const GuidedDemoModePanel: React.FC<GuidedDemoModePanelProps> = ({
  intakeState,
  onUpdateIntakeState: setIntakeState,
  customTarget3D,
  onUpdateCustomTarget3D: setCustomTarget3D,
  candidate,
  allBiologicCandidates,
  onSelectCandidate,
  onChangePathwayMode,
  groundedParams,
  strParams,
  hfParams,
  physicsResult,
  onUpdateStrParams,
  onUpdateHfParams,
  onTriggerOxygenDeficitDemo,
  onRunNextExperiment,
  downstreamEcon,
  downstreamCogs,
  safetyGates,
  onUpdateSafetyGate,
  onApproveAllDemoGates,
  prismaIncludedCount,
  liveEightSeedSummary,
  onSwitchToWorkbenchSection,
}) => {
  // Unified 5-Stage Candidate-Centred Flow
  const [activeStage, setActiveStage] = useState<UnifiedFlowStage>('discover');

  // Selected candidate from the Passed Candidates gallery
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>(
    intakeState.pathwayRoute === 'route_b_biologic'
      ? 'her2_trastuzumab_mab'
      : 'mrp1_r2_lead_1'
  );

  // Researcher Modality Override (null = use automatic classification)
  const [researcherModalityOverride, setResearcherModalityOverride] =
    useState<ClassifiedModalityId | null>(null);

  // Progressive Disclosure Dropdowns (Keep default UI super clean and uncluttered!)
  const [showCustomInputForm, setShowCustomInputForm] = useState<boolean>(false);
  const [showScientificDetailsDropdown, setShowScientificDetailsDropdown] =
    useState<boolean>(false);

  // 3D Viewer Controls
  const [showPocketSurface, setShowPocketSurface] = useState<boolean>(true);
  const [showContactSticks, setShowContactSticks] = useState<boolean>(true);
  const [cameraResetTick, setCameraResetTick] = useState<number>(0);
  const viewerMountRef = useRef<HTMLDivElement | null>(null);

  // Optimiser Preset
  const [activePresetId, setActivePresetId] =
    useState<ReactorOptimisationObjectivePresetId>('balanced_all_constraints');
  const [lastAppliedConfigId, setLastAppliedConfigId] = useState<string | null>(
    null
  );
  const [reviewerName, setReviewerName] = useState<string>(
    'Simulated Demo Reviewer — Bioprocess Engineer'
  );

  const selectedCandidateCard = useMemo(
    () =>
      PASSED_CANDIDATE_GALLERY.find((c) => c.id === selectedGalleryId) ||
      PASSED_CANDIDATE_GALLERY[0],
    [selectedGalleryId]
  );

  const effectiveModality: ClassifiedModalityId =
    researcherModalityOverride || selectedCandidateCard.autoClassifiedModality;

  // Live Critic Evaluation of Current Candidate SMILES
  const liveCandidateCritic = useMemo(
    () => evaluateSmilesWithCritics(intakeState.candidateSmiles || 'c1ccccc1'),
    [intakeState.candidateSmiles]
  );

  // Select a candidate from the Passed Candidates Gallery and sync all state
  const handleSelectGalleryCandidate = (item: PassedCandidateOption) => {
    setSelectedGalleryId(item.id);
    setResearcherModalityOverride(null);
    const preset = INITIAL_DRUG_TARGET_PRESETS[item.presetKey];
    if (preset) {
      setIntakeState(preset);
    }
    setCustomTarget3D(null);
    if (item.autoClassifiedModality === 'mammalian_cho_bioreactor') {
      onChangePathwayMode('established_biologic');
      onSelectCandidate('trastuzumab');
    } else if (item.autoClassifiedModality === 'microbial_fermentation') {
      onChangePathwayMode('novel_dissertation_protein');
    } else {
      onChangePathwayMode('small_molecule_chemical');
    }
    setCameraResetTick((t) => t + 1);
  };

  // Resolve 3D Target and Pose for the Interactive 3D Viewer
  const activeTarget3D: ProteinTarget3DConfig = useMemo(() => {
    if (customTarget3D) return customTarget3D;
    if (
      selectedCandidateCard.id === 'her2_trastuzumab_mab' ||
      intakeState.targetProteinSymbol.toUpperCase().includes('HER2')
    ) {
      return PROTEIN_TARGETS_3D.HER2;
    }
    return PROTEIN_TARGETS_3D.MRP1;
  }, [customTarget3D, selectedCandidateCard.id, intakeState.targetProteinSymbol]);

  const currentPose = useMemo(() => {
    const smiles =
      selectedCandidateCard.id === 'mrp1_r1_c01_rejected'
        ? 'O=C(N[C@@H](Cc1ccc(O)cc1)C(=O)N[C@@H](CCCN=C(N)N)C(=O)O)[C@H]1O[C@H](CO)[C@@H](O)[C@H](O)[C@H]1c2ccc3nc(S(=O)(=O)c4ccc5ccccc5c4)sc3c2'
        : intakeState.activeViewerLigandMode === 'known_binder'
        ? intakeState.knownBinderSmiles
        : intakeState.candidateSmiles;
    const affinity =
      selectedCandidateCard.id === 'mrp1_r1_c01_rejected'
        ? -12.9
        : intakeState.activeViewerLigandMode === 'known_binder'
        ? intakeState.knownBinderAffinityKcalMol
        : intakeState.candidateAffinityKcalMol;
    const modes = getModesForSmiles(activeTarget3D, smiles, affinity);
    return modes[0];
  }, [selectedCandidateCard.id, intakeState, activeTarget3D]);

  // Interactive Three.js 3D Viewer Effect (Runs when on 'discover' or 'evaluate')
  useEffect(() => {
    if (activeStage !== 'discover' && activeStage !== 'evaluate') return;
    const container = viewerMountRef.current;
    if (!container) return;

    const width = container.clientWidth || 560;
    const height = container.clientHeight || 340;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);

    const [cx, cy, cz] = activeTarget3D.boxCenter;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(cx + 17, cy + 12, cz + 21);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(cx, cy, cz);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.65;

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
    dirLight.position.set(cx + 25, cy + 30, cz + 25);
    scene.add(dirLight);

    // 1. Pocket Helices
    activeTarget3D.helices.forEach((h) => {
      const start = new THREE.Vector3(...h.start);
      const end = new THREE.Vector3(...h.end);
      const dir = new THREE.Vector3().subVectors(end, start);
      const len = dir.length();
      const geom = new THREE.CylinderGeometry(h.radius, h.radius, len, 18);
      const mat = new THREE.MeshStandardMaterial({
        color: h.color,
        roughness: 0.45,
        metalness: 0.15,
        transparent: true,
        opacity: 0.55,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(start).addScaledVector(dir, 0.5);
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize()
      );
      scene.add(mesh);
    });

    // 2. Translucent Binding Box
    if (showPocketSurface) {
      const [bx, by, bz] = activeTarget3D.boxSize;
      const boxGeom = new THREE.BoxGeometry(bx * 0.72, by * 0.72, bz * 0.72);
      const edges = new THREE.EdgesGeometry(boxGeom);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.35,
        })
      );
      line.position.set(cx, cy, cz);
      scene.add(line);
    }

    // 3. Contact Residues
    if (showContactSticks) {
      activeTarget3D.contactResidues.forEach((res) => {
        res.atoms.forEach((a) => {
          const g = new THREE.SphereGeometry(0.28, 12, 12);
          const m = new THREE.MeshStandardMaterial({
            color:
              a.element === 'O'
                ? 0xf43f5e
                : a.element === 'N'
                ? 0x3b82f6
                : 0xfacc15,
          });
          const s = new THREE.Mesh(g, m);
          s.position.set(a.x, a.y, a.z);
          scene.add(s);
        });
      });
    }

    // 4. Ligand Atoms & Bonds
    if (currentPose) {
      const atoms = currentPose.ligandAtoms;
      atoms.forEach((a) => {
        const rad = a.element === 'C' ? 0.38 : 0.42;
        const g = new THREE.SphereGeometry(rad, 18, 18);
        const col =
          selectedCandidateCard.id === 'mrp1_r1_c01_rejected' && a.element === 'C'
            ? 0xfb7185
            : ELEMENT_COLORS[a.element] || 0x22d3ee;
        const m = new THREE.MeshStandardMaterial({
          color: col,
          roughness: 0.25,
          metalness: 0.2,
        });
        const mesh = new THREE.Mesh(g, m);
        mesh.position.set(a.x, a.y, a.z);
        scene.add(mesh);
      });

      for (let i = 0; i < atoms.length; i++) {
        for (let j = i + 1; j < atoms.length; j++) {
          const p1 = new THREE.Vector3(atoms[i].x, atoms[i].y, atoms[i].z);
          const p2 = new THREE.Vector3(atoms[j].x, atoms[j].y, atoms[j].z);
          const d = p1.distanceTo(p2);
          if (d > 0.4 && d < 1.95) {
            const dir = new THREE.Vector3().subVectors(p2, p1);
            const cyl = new THREE.CylinderGeometry(0.11, 0.11, d, 10);
            const mat = new THREE.MeshStandardMaterial({
              color: 0xe2e8f0,
              roughness: 0.35,
            });
            const bond = new THREE.Mesh(cyl, mat);
            bond.position.copy(p1).addScaledVector(dir, 0.5);
            bond.quaternion.setFromUnitVectors(
              new THREE.Vector3(0, 1, 0),
              dir.clone().normalize()
            );
            scene.add(bond);
          }
        }
      }
    }

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 560;
      const h = container.clientHeight || 340;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      controls.dispose();
      renderer.dispose();
    };
  }, [
    activeStage,
    activeTarget3D,
    currentPose,
    showPocketSurface,
    showContactSticks,
    selectedCandidateCard.id,
    cameraResetTick,
  ]);

  // Bioreactor Physics & Multi-Objective Optimiser State (Used when modality is mammalian_cho_bioreactor)
  const isO2Starved = physicsResult.otrMmolPerLHour < physicsResult.ourMmolPerLHour;
  const isShearViolated =
    physicsResult.estimatedShearStressPa > groundedParams.shearThresholdPa ||
    physicsResult.kolmogorovScaleUm < 18.0;
  const isMixingSlow = physicsResult.mixingTimeGassedS > 60.0;
  const isFilterViolated = physicsResult.isHfHydraulicsViolated;
  const isGasFlowViolated =
    strParams.spargeRateVvm < 0.018 || strParams.spargeRateVvm > 0.095;

  const failedConstraintDetails: string[] = [];
  if (isO2Starved) {
    failedConstraintDetails.push(
      `Oxygen Transfer (OTR ${physicsResult.otrMmolPerLHour.toFixed(1)} < OUR ${physicsResult.ourMmolPerLHour.toFixed(1)} mmol/L/h)`
    );
  }
  if (isShearViolated) {
    failedConstraintDetails.push(
      `Impeller Shear / Eddy (τ ${physicsResult.estimatedShearStressPa.toFixed(2)} Pa vs ${groundedParams.shearThresholdPa} Pa limit, λ_K ${physicsResult.kolmogorovScaleUm.toFixed(1)} μm)`
    );
  }
  if (isMixingSlow) {
    failedConstraintDetails.push(
      `Bulk Mixing Time (t_m ${physicsResult.mixingTimeGassedS.toFixed(1)} s > 60.0 s limit)`
    );
  }
  if (isFilterViolated) {
    failedConstraintDetails.push(
      physicsResult.isHfWallShearViolated
        ? `Filter Wall Shear (τ_w ${physicsResult.hfEffectiveWallShearStressPa.toFixed(2)} Pa > ${physicsResult.hfLumenWallShearLimitPa.toFixed(2)} Pa laminar lumen limit)`
        : `Filter Hydraulics (ΔP ${physicsResult.hfPressureDropKpa.toFixed(1)} kPa vs ${physicsResult.hfPressureDropLimitKpa.toFixed(1)} kPa limit)`
    );
  }
  if (isGasFlowViolated) {
    failedConstraintDetails.push(
      `Aeration Window (${strParams.spargeRateVvm.toFixed(3)} vvm outside 0.018–0.095 vvm)`
    );
  }
  if (physicsResult.isTopSubmergenceInsufficient && strParams.impellerCount >= 2) {
    failedConstraintDetails.push(
      `Impeller Submergence (S_top/D_i ${physicsResult.topImpellerSubmergenceRatioStopDi.toFixed(2)} < 0.50)`
    );
  }
  if (physicsResult.isCloselySpacedInteractionFlagged && strParams.impellerCount >= 2) {
    failedConstraintDetails.push(
      `Impeller Spacing (ΔC/D_i ${physicsResult.impellerSpacingRatioDeltaCDi.toFixed(2)} < 1.50)`
    );
  }

  const isAllPhysicsFeasible =
    failedConstraintDetails.length === 0 && physicsResult.isScaleUpFeasible;

  const baseline500LStrParams: StirredTankPhysicsParams = useMemo(
    () => ({
      ...DEFAULT_STR_PHYSICS,
      workingVolumeL: 500,
      spargerType: 'open_pipe',
      impellerType: 'marine_axial',
      impellerCount: 2,
      stirrerSpeedRpm: 115,
      spargeRateVvm: 0.04,
      oxygenEnrichmentFraction: 0.21,
      targetVcdE6PerMl: 43.5,
    }),
    []
  );

  const baselinePhysics = useMemo(
    () =>
      solveMassBalanceAndReactorPhysics(
        baseline500LStrParams,
        DEFAULT_HF_PHYSICS,
        groundedParams,
        groundedParams.optimalVvd,
        groundedParams.optimalDoPercent
      ),
    [baseline500LStrParams, groundedParams]
  );

  const activeWeights = DEMO_OBJECTIVE_PRESETS[activePresetId].weights;
  const unifiedSuite = useMemo(
    () =>
      optimiseUnifiedReactorConfiguration(
        strParams,
        hfParams,
        groundedParams,
        activeWeights,
        downstreamEcon
      ),
    [strParams, hfParams, groundedParams, activeWeights, downstreamEcon]
  );

  const gate2 = safetyGates.find((g) => g.id === 'gate2_reactor');
  const gate4 = safetyGates.find((g) => g.id === 'gate4_protocol');
  const isHumanApproved =
    gate2?.status === 'Approved' && gate4?.status === 'Approved';

  const handleApplyProposedConfig = (cfg: ProposedReactorConfiguration) => {
    onUpdateStrParams(cfg.strParams);
    onUpdateHfParams(cfg.hfParams);
    setLastAppliedConfigId(cfg.id);
  };

  const STAGES: { id: UnifiedFlowStage; num: string; label: string; sub: string }[] = [
    {
      id: 'discover',
      num: '1',
      label: 'Discover',
      sub: 'Target, Known Binder & 3D Pocket',
    },
    {
      id: 'evaluate',
      num: '2',
      label: 'Evaluate',
      sub: 'Passed Candidates & Pros/Cons',
    },
    {
      id: 'manufacture',
      num: '3',
      label: 'Manufacture',
      sub:
        effectiveModality === 'chemical_synthesis'
          ? 'Chemical Synthesis Feasibility'
          : effectiveModality === 'mammalian_cho_bioreactor'
          ? '500 L Animated Bioreactor'
          : 'Host & Modality Gate',
    },
    {
      id: 'optimise',
      num: '4',
      label: 'Optimise',
      sub:
        effectiveModality === 'chemical_synthesis'
          ? '3-Step Route vs Chiral Trap'
          : 'AI Reactor Interventions & BO',
    },
    {
      id: 'next_experiments',
      num: '5',
      label: 'Next Experiments',
      sub: 'Validation Plan & Human Sign-Off',
    },
  ];

  const currentStageIdx = STAGES.findIndex((s) => s.id === activeStage);

  return (
    <section
      aria-label="Unified Discovery-to-Manufacturing Guided Flow"
      className="space-y-5"
    >
      {/* Clean Top Navigation Header: 5 Unified Stages (Discover → Evaluate → Manufacture → Optimise → Next Experiments) */}
      <div className="bg-white border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-mono font-bold text-blue-700">
              <span className="normal-case">bioREACT</span> · UNIFIED DISCOVERY-TO-MANUFACTURING WORKFLOW
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-950 mt-0.5">
              From promising molecules to practical medicines.
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 max-w-3xl">
              Select a target protein and a passed candidate below. bioREACT automatically
              determines the appropriate manufacturing modality, checks synthesis or bioreactor
              feasibility, and recommends what to test next.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={currentStageIdx <= 0}
              onClick={() =>
                setActiveStage(STAGES[Math.max(0, currentStageIdx - 1)].id)
              }
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={currentStageIdx >= STAGES.length - 1}
              onClick={() =>
                setActiveStage(
                  STAGES[Math.min(STAGES.length - 1, currentStageIdx + 1)].id
                )
              }
              className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 cursor-pointer"
            >
              <span>Next Stage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5-Stage Segmented Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100">
          {STAGES.map((st) => {
            const isActive = activeStage === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveStage(st.id)}
                className={`p-3 text-left border transition-colors cursor-pointer ${
                  isActive
                    ? 'border-blue-600 bg-blue-50/60'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>
                    {st.num}. {st.label}
                  </span>
                  {isActive && (
                    <span className="text-[11px] font-mono text-blue-700">Active</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-600 truncate mt-0.5">
                  {st.sub}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* PERSISTENT PASSED CANDIDATES SELECTOR BAR (Interactive Candidate Picker Instead of Static Timeline) */}
      <div className="bg-white border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-950">
              Select a Screened Candidate to Take Forward
            </h2>
            <p className="text-xs text-slate-600">
              Click any candidate below to load its 3D target pocket, automatically classify its
              manufacturing pathway, and proceed through evaluation and next-experiment planning.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCustomInputForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 cursor-pointer shrink-0"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {showCustomInputForm
                ? 'Hide Custom Target / PDB / SMILES Input Form'
                : 'Customise Target Protein, Known Binder or Upload .pdb'}
            </span>
            {showCustomInputForm ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Interactive Candidate Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {PASSED_CANDIDATE_GALLERY.map((item) => {
            const isSelected = selectedCandidateCard.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectGalleryCandidate(item)}
                className={`p-3 text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1 text-[11px] font-mono">
                    <span
                      className={`font-bold ${
                        item.screeningStatus === 'PASSED'
                          ? 'text-emerald-700'
                          : item.screeningStatus === 'PRELIMINARY'
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {item.screeningStatus === 'PASSED'
                        ? '✓ PASSED'
                        : item.screeningStatus === 'PRELIMINARY'
                        ? '● PRELIMINARY'
                        : '✕ REJECTED'}
                    </span>
                    <span className="text-slate-500 truncate">{item.targetSymbol}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-950 leading-snug">
                    {item.name}
                  </div>
                </div>
                <div className="pt-2 mt-2 border-t border-slate-200/70 text-[11px] text-slate-600 truncate">
                  {item.modalityLabel}
                </div>
              </button>
            );
          })}
        </div>

        {/* Collapsible Custom Target, Receptor & Known Binder Input Form */}
        {showCustomInputForm && (
          <div className="pt-3 border-t border-slate-200">
            <InitialDrugTargetIntakePanel
              intakeState={intakeState}
              onUpdateIntakeState={setIntakeState}
              allBiologicCandidates={allBiologicCandidates}
              onSelectBiologicCandidate={onSelectCandidate}
              onChangePathwayMode={onChangePathwayMode}
              onApplyTo3DViewer={(nextIntake, customTarget) => {
                setIntakeState(nextIntake);
                if (customTarget) {
                  setCustomTarget3D(customTarget);
                }
                if (nextIntake.pathwayRoute === 'route_b_biologic') {
                  setSelectedGalleryId('her2_trastuzumab_mab');
                } else {
                  setSelectedGalleryId('mrp1_r2_lead_1');
                }
                setCameraResetTick((t) => t + 1);
              }}
            />
          </div>
        )}
      </div>

      {/* =====================================================================
          STAGE 1: DISCOVER — TARGET PROTEIN, KNOWN BINDER & 3D POCKET VIEWER
         ===================================================================== */}
      {activeStage === 'discover' && (
        <div className="bg-white border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="text-xs font-mono font-bold uppercase text-blue-700">
                1. Discover · Target Protein, Starting Molecule &amp; 3D Binding Pocket
              </div>
              <h2 className="text-lg font-bold text-slate-950 mt-0.5">
                {selectedCandidateCard.name} · Target: {selectedCandidateCard.targetSymbol}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 max-w-3xl">
                {selectedCandidateCard.targetSymbol.includes('MRP1')
                  ? 'Some cancer cells use proteins such as MRP1 to pump certain drugs out of the cell. Researchers design molecules to fit inside MRP1 and inhibit this transport, potentially helping drugs remain inside cells.'
                  : selectedCandidateCard.targetRolePlain}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveStage('evaluate')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shrink-0"
            >
              <span>Proceed to 2. Evaluate Candidate</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left 7 Cols: Interactive 3D Molecular Viewer */}
            <div className="lg:col-span-7 bg-slate-950 border border-slate-800 text-slate-100 flex flex-col justify-between">
              <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-semibold">
                    Interactive 3D Pocket ({activeTarget3D.symbol} · PDB {activeTarget3D.pdbId})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setIntakeState({
                        ...intakeState,
                        activeViewerLigandMode: 'known_binder',
                      })
                    }
                    className={`px-2 py-1 text-[11px] border cursor-pointer ${
                      intakeState.activeViewerLigandMode === 'known_binder'
                        ? 'bg-amber-600 text-white border-amber-500 font-semibold'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    Known Binder ({intakeState.knownBinderName.split('(')[0].trim()})
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setIntakeState({
                        ...intakeState,
                        activeViewerLigandMode: 'designed_candidate',
                      })
                    }
                    className={`px-2 py-1 text-[11px] border cursor-pointer ${
                      intakeState.activeViewerLigandMode === 'designed_candidate'
                        ? 'bg-emerald-600 text-white border-emerald-500 font-semibold'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    Selected Candidate
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPocketSurface((v) => !v)}
                    className="px-2 py-1 text-[11px] bg-slate-900 text-slate-300 border border-slate-700 cursor-pointer"
                  >
                    Box: {showPocketSurface ? 'ON' : 'OFF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraResetTick((t) => t + 1)}
                    className="px-2 py-1 text-[11px] bg-slate-900 text-slate-300 border border-slate-700 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 inline" />
                  </button>
                </div>
              </div>

              <div className="relative w-full h-[350px] bg-[#090d16]">
                <div ref={viewerMountRef} className="w-full h-full cursor-grab" />
                <div className="absolute bottom-3 left-3 right-3 bg-slate-950/85 border border-slate-800 px-3 py-2 text-[11px] font-mono text-slate-300 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    Showing:{' '}
                    <strong className="text-white">
                      {intakeState.activeViewerLigandMode === 'known_binder'
                        ? intakeState.knownBinderName
                        : selectedCandidateCard.name}
                    </strong>
                  </span>
                  <span className="text-amber-300">
                    Contacts:{' '}
                    {activeTarget3D.contactResidues
                      .map((r) => `${r.resName}-${r.resSeq}`)
                      .join(', ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Plain-English Summary & Automatic Manufacturing Modality Classification */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-slate-50 border border-slate-200 p-5 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono font-bold text-slate-700 uppercase">
                    Candidate Profile &amp; Modality Check
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      selectedCandidateCard.screeningStatus === 'PASSED'
                        ? 'text-emerald-700'
                        : selectedCandidateCard.screeningStatus === 'PRELIMINARY'
                        ? 'text-amber-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {selectedCandidateCard.screeningStatus}
                  </span>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 space-y-1.5 text-xs">
                  <div className="font-bold text-slate-900">
                    Predicted Binding &amp; Molecular Properties
                  </div>
                  <p className="text-slate-700">{selectedCandidateCard.bindingSummary}</p>
                  <p className="text-slate-600 font-mono text-[11px]">
                    {selectedCandidateCard.molecularSummary}
                  </p>
                </div>

                {/* Crucial Scientific Distinction Box */}
                <div className="p-3.5 bg-amber-50/90 border border-amber-200 text-xs text-amber-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Predicted Binding ≠ Proven Biological Activity</span>
                  </div>
                  <p className="leading-relaxed">
                    A molecule fitting into the 3D pocket does <strong>not</strong> prove it blocks
                    transporter activity or keeps drugs inside cells. Functional inhibition must be
                    validated in cellular assays.
                  </p>
                </div>

                {/* Automatic Manufacturing Modality Classifier */}
                <div className="p-3.5 bg-white border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">
                      Auto-Classified Manufacturing Pathway:
                    </span>
                    <span className="font-mono text-[11px] text-blue-700 font-semibold">
                      {selectedCandidateCard.supportStatus}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-blue-900">
                    {selectedCandidateCard.modalityLabel}
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedCandidateCard.autoClassificationReasoning}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSwitchToWorkbenchSection('dissertation_3d')}
                  className="text-xs font-medium text-blue-700 hover:underline cursor-pointer"
                >
                  Open Full 3D Docking Sandbox →
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStage('evaluate')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white hover:bg-blue-700 cursor-pointer"
                >
                  <span>Compare Candidates (2. Evaluate)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          STAGE 2: EVALUATE — COMPARE CANDIDATES, PROS VS CONS, COST & TIME
         ===================================================================== */}
      {activeStage === 'evaluate' && (
        <div className="bg-white border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="text-xs font-mono font-bold uppercase text-blue-700">
                2. Evaluate · Binding Score vs. Synthesis Feasibility, Cost &amp; Time
              </div>
              <h2 className="text-lg font-bold text-slate-950 mt-0.5">
                Why the Strongest Docking Score Is Not Always the Best Medicine
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 max-w-3xl">
                Compare candidates side by side. Click any candidate row to select it and proceed to
                its specific manufacturing feasibility model.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveStage('manufacture')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shrink-0"
            >
              <span>Proceed to 3. Manufacture ({selectedCandidateCard.modalityLabel})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Selected Candidate Highlight Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-slate-500 font-medium">Currently Selected Candidate</div>
              <div className="text-sm font-bold text-slate-950 mt-0.5">
                {selectedCandidateCard.name}
              </div>
              <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                Target: {selectedCandidateCard.targetSymbol}
              </div>
            </div>
            <div>
              <div className="text-slate-500 font-medium">Predicted Binding &amp; Complexity</div>
              <div className="font-semibold text-slate-900 mt-0.5">
                {selectedCandidateCard.bindingSummary}
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                {selectedCandidateCard.estimatedStepsOrProcess}
              </div>
            </div>
            <div>
              <div className="text-slate-500 font-medium">Heuristic Cost &amp; Time</div>
              <div className="font-mono font-semibold text-slate-900 mt-0.5">
                {selectedCandidateCard.estimatedCostAndTime}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Order-of-magnitude estimate (not a vendor quote)
              </div>
            </div>
            <div>
              <div className="text-slate-500 font-medium">Main Advantage vs. Risk</div>
              <div className="text-emerald-800 mt-0.5">
                <strong>Pro:</strong> {selectedCandidateCard.prosSummary}
              </div>
              <div className="text-amber-900 mt-0.5">
                <strong>Gap:</strong> {selectedCandidateCard.missingEvidence}
              </div>
            </div>
          </div>

          {/* Clean Candidate Comparison Table */}
          <div className="overflow-x-auto border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-semibold">
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Predicted Binding (with Caveats)</th>
                  <th className="p-3">Auto-Classified Manufacturing Route</th>
                  <th className="p-3">Steps / Process Complexity</th>
                  <th className="p-3">Est. Cost &amp; Time (Heuristic)</th>
                  <th className="p-3">Pros vs. Cons</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 align-top">
                {PASSED_CANDIDATE_GALLERY.map((c) => {
                  const isCurrent = c.id === selectedCandidateCard.id;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => handleSelectGalleryCandidate(c)}
                      className={`cursor-pointer transition-colors ${
                        isCurrent ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="p-3">
                        <div className="font-bold text-slate-950">{c.name}</div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          Target: {c.targetSymbol} · {c.screeningStatus}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{c.bindingSummary}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{c.modalityLabel}</div>
                        <div className="text-[11px] text-slate-500">{c.supportStatus}</div>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-800">
                        {c.estimatedStepsOrProcess}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-800">
                        {c.estimatedCostAndTime}
                      </td>
                      <td className="p-3 space-y-1">
                        <div className="text-emerald-800">
                          <strong>Pro:</strong> {c.prosSummary}
                        </div>
                        <div className="text-rose-800">
                          <strong>Risk:</strong> {c.consAndRisks}
                        </div>
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectGalleryCandidate(c);
                            setActiveStage('manufacture');
                          }}
                          className={`px-2.5 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap ${
                            isCurrent
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-900 text-white hover:bg-blue-600'
                          }`}
                        >
                          Inspect Manufacturing →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          STAGE 3: MANUFACTURE — AUTO-CLASSIFIED PATHWAY & APPROPRIATE SIMULATOR
         ===================================================================== */}
      {activeStage === 'manufacture' && (
        <div className="bg-white border border-slate-200 p-6 shadow-xs space-y-5">
          {/* Top Pathway Classification & Researcher Review Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="text-xs font-mono font-bold uppercase text-blue-700">
                3. Manufacture · Automatic Modality Classification &amp; Feasibility Check
              </div>
              <h2 className="text-lg font-bold text-slate-950 mt-0.5">
                {selectedCandidateCard.name} → {selectedCandidateCard.modalityLabel}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 max-w-3xl">
                {selectedCandidateCard.autoClassificationReasoning}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <label className="text-xs font-medium text-slate-700">
                Researcher Modality Review / Override:
              </label>
              <select
                aria-label="Researcher Modality Override"
                value={effectiveModality}
                onChange={(e) =>
                  setResearcherModalityOverride(e.target.value as ClassifiedModalityId)
                }
                className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-300 text-slate-900"
              >
                <option value="chemical_synthesis">
                  Small-Molecule Chemical Synthesis (Supported)
                </option>
                <option value="mammalian_cho_bioreactor">
                  Mammalian Cell Culture — 500 L CHO Bioreactor (Supported)
                </option>
                <option value="microbial_fermentation">
                  Microbial Fermentation — E. coli / Pichia (Screening Only)
                </option>
                <option value="insufficient_evidence_abstain">
                  Other / Insufficient Evidence (Abstain)
                </option>
              </select>
              <button
                type="button"
                onClick={() => setActiveStage('optimise')}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
              >
                <span>Proceed to 4. Optimise</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Warning if researcher overrides a small molecule into a CHO bioreactor */}
          {selectedCandidateCard.autoClassifiedModality === 'chemical_synthesis' &&
            effectiveModality === 'mammalian_cho_bioreactor' && (
              <div className="p-4 bg-rose-50 border border-rose-300 text-xs text-rose-950 flex items-center justify-between gap-3">
                <div>
                  <strong>Scientific Mismatch Warning:</strong> {selectedCandidateCard.name} is a
                  412 Da synthetic small molecule. Small molecules are manufactured by organic
                  chemical synthesis, not in a CHO mammalian bioreactor.
                </div>
                <button
                  type="button"
                  onClick={() => setResearcherModalityOverride(null)}
                  className="px-3 py-1.5 font-semibold bg-rose-700 text-white hover:bg-rose-800 cursor-pointer shrink-0"
                >
                  Restore Chemical Synthesis Route
                </button>
              </div>
            )}

          {/* CASE A: SMALL-MOLECULE CHEMICAL SYNTHESIS FEASIBILITY */}
          {effectiveModality === 'chemical_synthesis' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="text-xs font-mono text-slate-500">
                    1. SYNTHETIC ACCESSIBILITY CRITIC
                  </div>
                  <div className="text-base font-bold text-slate-950">
                    SA Score: {liveCandidateCritic.synthesisability.sa_score} / 10 (Threshold ≤ 4.5)
                  </div>
                  <p className="text-xs text-slate-600">
                    Evaluates fragment frequency and topological complexity (Ertl &amp;
                    Schuffenhauer). Zero chiral centres mean no costly enantiomeric separation is
                    required.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="text-xs font-mono text-slate-500">
                    2. PROCESS-CHEMISTRY ROUTE &amp; STEPS
                  </div>
                  <div className="text-base font-bold text-slate-950">
                    {selectedCandidateCard.estimatedStepsOrProcess}
                  </div>
                  <p className="text-xs text-slate-600">
                    Convergent synthesis from commercially available aryl boronic acid and sulfonyl
                    chloride building blocks, isolated by direct crystallisation.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="text-xs font-mono text-slate-500">
                    3. HEURISTIC COST &amp; TIME ESTIMATE
                  </div>
                  <div className="text-base font-bold text-emerald-800">
                    {selectedCandidateCard.estimatedCostAndTime}
                  </div>
                  <p className="text-xs text-slate-600">
                    Order-of-magnitude medicinal chemistry estimate (not a supplier quote). Avoids
                    the &gt;$20k / 10–14 week bottleneck of chiral glycoside hit R1-C01.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50/60 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <strong className="text-slate-950">
                    Want to inspect the 500 L CHO Bioreactor demonstration as well?
                  </strong>{' '}
                  <span className="text-slate-700">
                    Because {selectedCandidateCard.name.split('(')[0].trim()} is a small molecule,
                    it never enters a bioreactor. Select <strong>Trastuzumab (HER2 IgG1)</strong> to
                    see the animated 500 L CHO bioreactor simulator.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const tras = PASSED_CANDIDATE_GALLERY.find(
                      (c) => c.id === 'her2_trastuzumab_mab'
                    );
                    if (tras) handleSelectGalleryCandidate(tras);
                  }}
                  className="px-3.5 py-2 font-semibold bg-blue-700 text-white hover:bg-blue-800 cursor-pointer whitespace-nowrap shrink-0"
                >
                  Switch to Trastuzumab (500 L Bioreactor Example) →
                </button>
              </div>
            </div>
          )}

          {/* CASE B: MAMMALIAN CHO BIOMANUFACTURING (AUTHORITATIVE INTERACTIVE ANIMATED 500 L BIOREACTOR) */}
          {effectiveModality === 'mammalian_cho_bioreactor' && (
            <div className="space-y-5">
              {/* Plain-English Bottleneck Status Strip */}
              <div
                className={`p-4 border flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                  isAllPhysicsFeasible
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50/80 border-rose-300 text-rose-950'
                }`}
              >
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-sm">
                    {isAllPhysicsFeasible
                      ? '✓ All 500 L Bioreactor & Filter Constraints Satisfied — No Bottleneck Detected'
                      : `⚠ Bottleneck Detected (${failedConstraintDetails.length} Failing Constraint${
                          failedConstraintDetails.length > 1 ? 's' : ''
                        }): ${failedConstraintDetails.join(' · ')}`}
                  </div>
                  <p>
                    Oxygen Supply (OTR):{' '}
                    <strong className="font-mono">
                      {physicsResult.otrMmolPerLHour.toFixed(1)} mmol/L/h
                    </strong>{' '}
                    vs. Cellular Demand (OUR):{' '}
                    <strong className="font-mono">
                      {physicsResult.ourMmolPerLHour.toFixed(1)} mmol/L/h
                    </strong>{' '}
                    (kLa = <strong className="font-mono">{physicsResult.klaPerHour.toFixed(1)} h⁻¹</strong>) · Impeller Shear:{' '}
                    <strong className="font-mono">
                      {physicsResult.estimatedShearStressPa.toFixed(2)} Pa
                    </strong>{' '}
                    (≤ {groundedParams.shearThresholdPa} Pa) · Mixing Time:{' '}
                    <strong className="font-mono">
                      {physicsResult.mixingTimeGassedS.toFixed(1)} s
                    </strong>{' '}
                    (≤ 60.0 s) · Filter Wall Shear:{' '}
                    <strong className="font-mono">
                      {physicsResult.hfEffectiveWallShearStressPa.toFixed(2)} Pa
                    </strong>{' '}
                    (≤ {physicsResult.hfLumenWallShearLimitPa.toFixed(2)} Pa)
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={onTriggerOxygenDeficitDemo}
                    className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 cursor-pointer"
                  >
                    Reset to Failing 500 L Baseline
                  </button>
                  {unifiedSuite.rankedConfigurations[0] && !isAllPhysicsFeasible && (
                    <button
                      type="button"
                      onClick={() =>
                        handleApplyProposedConfig(unifiedSuite.rankedConfigurations[0])
                      }
                      className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
                    >
                      Apply AI Recommended Fix (All Constraints)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveStage('optimise')}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-blue-700 text-white hover:bg-blue-800 cursor-pointer"
                  >
                    Compare Ranked Reactor Configurations →
                  </button>
                </div>
              </div>

              {/* Single Authoritative Interactive Animated Bioreactor & Multi-Objective Optimiser */}
              <BioreactorProcessVisualiserPanel
                strParams={strParams}
                hfParams={hfParams}
                groundedParams={groundedParams}
                physics={physicsResult}
                onUpdateStrParams={onUpdateStrParams}
                onUpdateHfParams={onUpdateHfParams}
                safetyGates={safetyGates}
                onUpdateSafetyGate={onUpdateSafetyGate}
              />
            </div>
          )}

          {/* CASE C: MICROBIAL FERMENTATION OR UNSUPPORTED MODALITY (HONEST ABSTENTION) */}
          {(effectiveModality === 'microbial_fermentation' ||
            effectiveModality === 'insufficient_evidence_abstain') && (
            <div className="p-5 bg-amber-50/70 border border-amber-300 space-y-3 text-xs text-amber-950">
              <div className="font-bold text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Scientific Abstention Gate Active — Quantitative Bioreactor Model Not Yet
                  Calibrated for This Candidate
                </span>
              </div>
              <p className="leading-relaxed">
                {effectiveModality === 'microbial_fermentation'
                  ? `For ${selectedCandidateCard.name}, microbial fermentation (E. coli or K. phaffii) is biologically appropriate for initial expression screening. However, because no wet-lab specific productivity (q_p) or oxygen uptake (q_O2) data have been measured yet, bioREACT refuses to fabricate bioreactor curves or borrow CHO antibody parameters.`
                  : 'Insufficient structural or kinetic evidence is available to run a validated quantitative manufacturing model. bioREACT abstains from generating fabricated cost or process predictions.'}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveStage('next_experiments')}
                  className="px-3.5 py-1.5 font-semibold bg-amber-800 text-white hover:bg-amber-900 cursor-pointer"
                >
                  View Required Wet-Lab Characterization Experiments →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          STAGE 4: OPTIMISE — ROUTE-APPROPRIATE OPTIMISATION & TRADE-OFFS
         ===================================================================== */}
      {activeStage === 'optimise' && (
        <div className="bg-white border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="text-xs font-mono font-bold uppercase text-blue-700">
                4. Optimise · {selectedCandidateCard.modalityLabel}
              </div>
              <h2 className="text-lg font-bold text-slate-950 mt-0.5">
                {effectiveModality === 'chemical_synthesis'
                  ? `Closed-Loop Molecular Redesign: How ${selectedCandidateCard.name.split('(')[0].trim()} Was Optimised for Synthesis`
                  : `Multi-Objective 500 L Bioreactor Optimisation (${candidate.genericName})`}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveStage('next_experiments')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shrink-0"
            >
              <span>Proceed to 5. Next Experiments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {effectiveModality === 'chemical_synthesis' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-mono font-bold text-slate-500">
                  ROUND 0 · STARTING POINT
                </div>
                <div className="text-sm font-bold text-slate-950">
                  Known Binder: {intakeState.knownBinderName.split('(')[0].trim()}
                </div>
                <p className="text-slate-600">
                  Reference pocket score:{' '}
                  <strong className="font-mono">
                    {intakeState.knownBinderAffinityKcalMol.toFixed(2)} kcal/mol
                  </strong>
                  . Used to define the 3D binding box on {intakeState.targetProteinSymbol}.
                </p>
              </div>

              <div className="p-4 bg-rose-50/50 border border-rose-200 space-y-2">
                <div className="font-mono font-bold text-rose-700">
                  ROUND 1 · UNCONSTRAINED DOCKING TRAP
                </div>
                <div className="text-sm font-bold text-slate-950">
                  Raw Hit R1-C01 (−12.90 kcal/mol)
                </div>
                <p className="text-slate-700">
                  Strongest raw docking score, but chemistry critics flag <strong>7 chiral centres</strong>,
                  SA score 6.42, and 12–18 steps. Automatically rejected so researchers don’t waste
                  months on an unbuildable molecule.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/50 border border-emerald-300 space-y-2">
                <div className="font-mono font-bold text-emerald-800">
                  ROUND 2 · CRITIC-GUIDED PRACTICAL LEAD
                </div>
                <div className="text-sm font-bold text-slate-950">
                  {selectedCandidateCard.name}
                </div>
                <p className="text-slate-700">
                  Replaces the chiral glycoside with an achiral biphenyl sulfonamide: retains strong
                  predicted pocket fit (<strong>−10.82 kcal/mol</strong>) while cutting synthesis to{' '}
                  <strong>3 steps and 0 chiral centres</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Objective Selector Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {(
                  Object.keys(
                    DEMO_OBJECTIVE_PRESETS
                  ) as ReactorOptimisationObjectivePresetId[]
                ).map((presetKey) => {
                  const p = DEMO_OBJECTIVE_PRESETS[presetKey];
                  const isSelected = activePresetId === presetKey;
                  return (
                    <button
                      key={presetKey}
                      type="button"
                      onClick={() => setActivePresetId(presetKey)}
                      className={`px-3 py-1.5 text-xs font-medium border cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* Top 3 Ranked Multi-Objective Reactor Configurations */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {unifiedSuite.rankedConfigurations.map((cfg) => {
                  const isApplied = lastAppliedConfigId === cfg.id;
                  return (
                    <div
                      key={cfg.id}
                      className={`p-4 border flex flex-col justify-between space-y-3 text-xs ${
                        isApplied
                          ? 'border-emerald-600 bg-emerald-50/40'
                          : 'border-slate-200 bg-slate-50/60'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold text-blue-900">
                            OPTION #{cfg.rank} · Score {cfg.compositeObjectiveScore.toFixed(1)}/100
                          </span>
                          <span className="text-emerald-700 font-semibold">
                            All 4 Constraints PASS
                          </span>
                        </div>
                        <div className="text-sm font-bold text-slate-950">{cfg.title}</div>
                        <p className="text-slate-600">{cfg.summaryRationale}</p>
                        <div className="p-2.5 bg-white border border-slate-200 font-mono text-[11px] space-y-1">
                          <div>
                            OTR: <strong>{cfg.evalPhysics.otrMmolPerLHour.toFixed(1)}</strong> vs
                            OUR: <strong>{cfg.evalPhysics.ourMmolPerLHour.toFixed(1)}</strong>{' '}
                            mmol/L/h
                          </div>
                          <div>
                            Mixing: <strong>{cfg.evalPhysics.mixingTimeGassedS.toFixed(1)} s</strong>{' '}
                            · Impeller Shear:{' '}
                            <strong>{cfg.evalPhysics.estimatedShearStressPa.toFixed(2)} Pa</strong>
                          </div>
                          <div>
                            Filter ΔP:{' '}
                            <strong>{cfg.evalPhysics.hfPressureDropKpa.toFixed(1)} kPa</strong> ·
                            Wall Shear:{' '}
                            <strong>
                              {cfg.evalPhysics.hfEffectiveWallShearStressPa.toFixed(2)} Pa
                            </strong>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyProposedConfig(cfg)}
                        className={`w-full py-2 px-3 font-semibold cursor-pointer ${
                          isApplied
                            ? 'bg-emerald-700 text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isApplied ? '✓ Applied to 500 L Simulation' : 'Apply Configuration'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          STAGE 5: NEXT EXPERIMENTS — EVIDENCE-AWARE PLAN & HUMAN SIGN-OFF
         ===================================================================== */}
      {activeStage === 'next_experiments' && (
        <div className="bg-white border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="text-xs font-mono font-bold uppercase text-blue-700">
                5. Next Experiments · Evidence-Aware Validation &amp; Human Review
              </div>
              <h2 className="text-lg font-bold text-slate-950 mt-0.5">
                Recommended Next Validation Steps for {selectedCandidateCard.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 max-w-3xl">
                Review the missing experimental evidence, recommended wet-lab experiments, and human
                safety sign-off status.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSwitchToWorkbenchSection('home_workbench')}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white hover:bg-blue-700 cursor-pointer shrink-0"
            >
              Open Full Research Workbench →
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left 7 Cols: Recommended Next Validation Experiments */}
            <div className="lg:col-span-7 space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase font-mono">
                Recommended Next Experiments ({selectedCandidateCard.modalityLabel})
              </div>
              {selectedCandidateCard.nextExperiments.map((expText, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs"
                >
                  <span className="font-mono font-bold text-blue-700 shrink-0">
                    0{idx + 1}.
                  </span>
                  <p className="text-slate-800 leading-relaxed">{expText}</p>
                </div>
              ))}

              <div className="p-4 bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1">
                <div className="font-bold">Key Evidence Gap to Close Next:</div>
                <p>{selectedCandidateCard.missingEvidence}</p>
              </div>
            </div>

            {/* Right 5 Cols: Human-in-the-Loop Safety Gate Sign-Off */}
            <div className="lg:col-span-5 bg-slate-50 border border-slate-200 p-5 flex flex-col justify-between space-y-4 text-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800 uppercase">
                    Human Safety Gate Sign-Off
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      isHumanApproved && isAllPhysicsFeasible
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {isHumanApproved && isAllPhysicsFeasible
                      ? 'APPROVED'
                      : 'PENDING SIGN-OFF'}
                  </span>
                </div>

                <p className="text-slate-600 leading-relaxed">
                  No candidate synthesis route or 500 L bioreactor operating recipe is released for
                  wet-lab execution without explicit human investigator review.
                </p>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Reviewer Role (Simulated Demo Reviewer — No Institutional Approval Implied)
                  </label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 text-slate-900"
                  />
                </div>

                {effectiveModality === 'mammalian_cho_bioreactor' && !isAllPhysicsFeasible && (
                  <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 font-medium">
                    Safety Interlock Active: Cannot approve 500 L bioreactor sign-off while oxygen
                    transfer or filter shear constraints are violated. Apply an AI fix in Stage 3 or
                    4 first.
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  disabled={
                    effectiveModality === 'mammalian_cho_bioreactor' && !isAllPhysicsFeasible
                  }
                  onClick={() => {
                    onApproveAllDemoGates();
                    onRunNextExperiment('Constrained BO (EI × P_feas)');
                  }}
                  className="w-full py-2 px-3 font-semibold bg-emerald-700 text-white hover:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-600 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>
                    {effectiveModality === 'mammalian_cho_bioreactor' && !isAllPhysicsFeasible
                      ? 'Approval Blocked Until 500 L Bottleneck Resolved'
                      : 'Approve Candidate & Log Next Experiment'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Progressive Disclosure Dropdown: Quantitative Benchmark & Equations */}
          <div className="pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowScientificDetailsDropdown((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-950 cursor-pointer"
            >
              <span>
                {showScientificDetailsDropdown
                  ? 'Hide Technical Benchmark, Provenance & Equations'
                  : 'Show Technical Benchmark (8-Seed BO vs Random Search), Provenance & Equations'}
              </span>
              {showScientificDetailsDropdown ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showScientificDetailsDropdown && (
              <div className="mt-3 p-4 bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700">
                <div>
                  <div className="font-bold text-slate-900">
                    8-Seed Constrained BO vs. Random Search
                  </div>
                  <p className="mt-1 font-mono text-[11px]">
                    Constrained EI:{' '}
                    {liveEightSeedSummary.constrainedBoStats.finalScoreMean.toFixed(1)} ±{' '}
                    {liveEightSeedSummary.constrainedBoStats.finalScoreStd.toFixed(1)} vs. Random:{' '}
                    {liveEightSeedSummary.randomSearchStats.finalScoreMean.toFixed(1)} ±{' '}
                    {liveEightSeedSummary.randomSearchStats.finalScoreStd.toFixed(1)} synthetic
                    units.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-slate-900">
                    500 L Before vs. After Physics
                  </div>
                  <p className="mt-1 font-mono text-[11px]">
                    Baseline OTR {baselinePhysics.otrMmolPerLHour.toFixed(1)} → Current OTR{' '}
                    {physicsResult.otrMmolPerLHour.toFixed(1)} mmol/L/h (Demand OUR{' '}
                    {physicsResult.ourMmolPerLHour.toFixed(1)}).
                  </p>
                </div>
                <div>
                  <div className="font-bold text-slate-900">
                    Literature Provenance &amp; Cost Basis
                  </div>
                  <p className="mt-1 font-mono text-[11px]">
                    {prismaIncludedCount} PRISMA-screened records · Biologic COGS{' '}
                    {formatCogsHeadline(downstreamCogs.cogsPerGramUsd)} (synthetic cost model).
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
