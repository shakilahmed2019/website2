import { McqQuestion } from '../types/lms';

export const SUBJECT_MCQ_BANK: Record<string, McqQuestion[]> = {
  Chemistry: [
    {
      id: 'mcq_chem_1',
      subject: 'Chemistry',
      chapter: 'পরিবেশ রসায়ন (Environmental Chemistry)',
      question:
        'At constant temperature, if the pressure of a fixed mass of an ideal gas is doubled, what happens to its PV product?',
      options: [
        'Becomes half',
        'Remains constant',
        'Becomes double',
        'Becomes four times',
      ],
      correctIndex: 1,
      explanation:
        'According to Boyle’s Law (PV = k at constant T and n), the product PV depends only on temperature for a fixed number of moles, so it remains constant.',
    },
    {
      id: 'mcq_chem_2',
      subject: 'Chemistry',
      chapter: 'পরিবেশ রসায়ন (Environmental Chemistry)',
      question:
        'Which gas exhibits the largest positive deviation from ideal gas behavior at high pressure and low temperature?',
      options: ['H₂ (Hydrogen)', 'N₂ (Nitrogen)', 'NH₃ (Ammonia)', 'CH₄ (Methane)'],
      correctIndex: 2,
      explanation:
        'NH₃ has strong intermolecular hydrogen bonding and a large Van der Waals attraction constant (a), causing significant deviation from PV = nRT.',
    },
    {
      id: 'mcq_chem_3',
      subject: 'Chemistry',
      chapter: 'পরিবেশ রসায়ন (Environmental Chemistry)',
      question:
        'What is the conjugate base of the dihydrogen phosphate ion (H₂PO₄⁻)?',
      options: ['H₃PO₄', 'HPO₄²⁻', 'PO₄³⁻', 'OH⁻'],
      correctIndex: 1,
      explanation:
        'Removing one H⁺ ion from H₂PO₄⁻ yields its conjugate base HPO₄²⁻ according to Brønsted–Lowry acid-base theory.',
    },
    {
      id: 'mcq_chem_4',
      subject: 'Chemistry',
      chapter: 'গুণগত রসায়ন (Qualitative Chemistry)',
      question:
        'What is the maximum number of spectral lines emitted when an electron in a hydrogen atom transitions from n = 5 down to n = 1?',
      options: ['6', '8', '10', '15'],
      correctIndex: 2,
      explanation:
        'Using the formula Δn(Δn + 1)/2 where Δn = 5 − 1 = 4, maximum spectral lines = 4 × 5 / 2 = 10.',
    },
    {
      id: 'mcq_chem_5',
      subject: 'Chemistry',
      chapter: 'পরিবেশ রসায়ন (Environmental Chemistry)',
      question:
        'For pure drinking water recommended by WHO, the Dissolved Oxygen (DO) level should typically be at least:',
      options: ['0.5–1.0 ppm', '1.5–2.0 ppm', '4.0–6.0 ppm', '12.0–15.0 ppm'],
      correctIndex: 2,
      explanation:
        'Healthy surface and drinking water maintains a Dissolved Oxygen (DO) concentration around 4–6 mg/L (ppm); lower values indicate organic pollution.',
    },
  ],
  Physics: [
    {
      id: 'mcq_phys_1',
      subject: 'Physics',
      chapter: 'ভেক্টর (Vectors)',
      question:
        'A swimmer wants to cross a river flowing at 3 m/s in the shortest possible time. If their speed in still water is 5 m/s, at what angle with the river current should they swim?',
      options: ['37°', '53°', '90°', '127°'],
      correctIndex: 2,
      explanation:
        'For minimum crossing time (t = d / v sinθ), sinθ must be maximum (= 1), which occurs when θ = 90° perpendicular to the current.',
    },
    {
      id: 'mcq_phys_2',
      subject: 'Physics',
      chapter: 'নিউটনিয়ান বলবিদ্যা (Newtonian Mechanics)',
      question:
        'What is the moment of inertia of a uniform thin circular disc of mass M and radius R about an axis passing through its center and perpendicular to its plane?',
      options: ['MR²', '½ MR²', '¼ MR²', '⅖ MR²'],
      correctIndex: 1,
      explanation:
        'A solid uniform disc has I = ½ MR² about its central perpendicular axis, whereas a thin ring has I = MR².',
    },
    {
      id: 'mcq_phys_3',
      subject: 'Physics',
      chapter: 'ভৌত আলোকবিজ্ঞান (Physical Optics)',
      question:
        'In Young’s double-slit experiment, if the entire apparatus is immersed in water (refractive index n = 1.33), what happens to the fringe width?',
      options: [
        'Increases by factor n',
        'Decreases by factor 1/n',
        'Remains unchanged',
        'Fringes disappear completely',
      ],
      correctIndex: 1,
      explanation:
        'Wavelength in water becomes λ′ = λ / n. Since fringe width β = λD / d, immersing in water reduces fringe width to β / n.',
    },
    {
      id: 'mcq_phys_4',
      subject: 'Physics',
      chapter: 'পর্যায়বৃত্ত গতি (SHM)',
      question:
        'Where is the acceleration of a particle executing Simple Harmonic Motion (SHM) maximum?',
      options: [
        'At the equilibrium position',
        'At half the amplitude',
        'At the extreme endpoints',
        'Uniform everywhere',
      ],
      correctIndex: 2,
      explanation:
        'In SHM, a = −ω²x, so acceleration magnitude |a| is maximum at extreme positions where displacement |x| = A.',
    },
  ],
  'Higher Math': [
    {
      id: 'mcq_math_1',
      subject: 'Higher Math',
      chapter: 'অন্তরীকরণ (Differentiation)',
      question: 'Evaluate the limit: lim(x → 0) [ (1 − cos x) / x² ]',
      options: ['0', '1/2', '1', '2'],
      correctIndex: 1,
      explanation:
        'Using 1 − cos x = 2 sin²(x/2), the limit becomes lim 2·[sin(x/2)/x]² = 2 × (1/2)² = 1/2.',
    },
    {
      id: 'mcq_math_2',
      subject: 'Higher Math',
      chapter: 'যোগজীকরণ (Integration)',
      question:
        'What is the area bounded by the parabola y² = 4ax and the straight line y = mx?',
      options: ['8a² / (3m³)', '4a² / (3m²)', '16a² / (3m³)', '2a² / m³'],
      correctIndex: 0,
      explanation:
        'Standard HSC & Admission shortcut: area between y² = 4ax and y = mx is given by 8a² / (3m³).',
    },
    {
      id: 'mcq_math_3',
      subject: 'Higher Math',
      chapter: 'কণিক (Conics)',
      question: 'What is the eccentricity (e) of a rectangular hyperbola?',
      options: ['1', '√2', '2', '1/√2'],
      correctIndex: 1,
      explanation:
        'For a rectangular hyperbola x² − y² = a² (where a = b), eccentricity e = √(1 + b²/a²) = √2.',
    },
    {
      id: 'mcq_math_4',
      subject: 'Higher Math',
      chapter: 'ম্যাট্রিক্স ও নির্ণায়ক (Matrices)',
      question:
        'If A is a 3×3 matrix with determinant |A| = 5, what is the determinant |2A|?',
      options: ['10', '20', '40', '80'],
      correctIndex: 2,
      explanation:
        'For an n×n matrix, |kA| = kⁿ|A|. Here n = 3 and k = 2, so |2A| = 2³ × 5 = 8 × 5 = 40.',
    },
  ],
  Biology: [
    {
      id: 'mcq_bio_1',
      subject: 'Biology',
      chapter: 'কোষ বিভাজন (Cell Division)',
      question:
        'During which sub-stage of Meiosis Prophase-I does crossing over between non-sister chromatids occur?',
      options: ['Leptotene', 'Zygotene', 'Pachytene', 'Diakinesis'],
      correctIndex: 2,
      explanation:
        'Synapsis occurs in Zygotene, and physical crossing over (exchange of genetic segments) occurs in Pachytene.',
    },
    {
      id: 'mcq_bio_2',
      subject: 'Biology',
      chapter: 'জিনতত্ত্ব (Genetics)',
      question:
        'What phenotypic ratio is produced in the F₂ generation due to complementary gene interaction (9:7) vs. recessive epistasis?',
      options: ['9:3:4', '12:3:1', '13:3', '9:3:3:1'],
      correctIndex: 0,
      explanation:
        'Recessive epistasis modifies Mendel’s dihybrid F₂ ratio (9:3:3:1) into 9:3:4, whereas dominant epistasis gives 12:3:1.',
    },
    {
      id: 'mcq_bio_3',
      subject: 'Biology',
      chapter: 'জিনতত্ত্ব ও ডিএনএ (DNA Replication)',
      question:
        'Which enzyme synthesizes short RNA primers to initiate DNA replication on the lagging strand?',
      options: ['DNA Ligase', 'Helicase', 'RNA Primase', 'Topoisomerase'],
      correctIndex: 2,
      explanation:
        'DNA Polymerase III cannot start a new strand de novo; RNA Primase lays down a short RNA primer with a free 3′-OH group.',
    },
    {
      id: 'mcq_bio_4',
      subject: 'Biology',
      chapter: 'মানব শারীরতত্ত্ব (Human Physiology)',
      question:
        'Which heart valve prevents backflow of oxygenated blood from the left ventricle into the left atrium?',
      options: [
        'Tricuspid valve',
        'Bicuspid (Mitral) valve',
        'Pulmonary semilunar valve',
        'Eustachian valve',
      ],
      correctIndex: 1,
      explanation:
        'The bicuspid (mitral) valve guards the left atrioventricular opening, preventing backflow during ventricular systole.',
    },
  ],
  Admission: [
    {
      id: 'mcq_adm_1',
      subject: 'Admission',
      chapter: 'BUET & DU Chemistry Written/MCQ',
      question:
        'How many moles of KMnO₄ are required to completely oxidize 5 moles of FeC₂O₄ (Ferrous Oxalate) in acidic medium?',
      options: ['1 mole', '2 moles', '3 moles', '5 moles'],
      correctIndex: 2,
      explanation:
        'Both Fe²⁺ → Fe³⁺ (1e⁻) and C₂O₄²⁻ → 2CO₂ (2e⁻) oxidize, giving n-factor = 3 for FeC₂O₄. KMnO₄ has n-factor = 5. By equivalence: 5 × 3 = n(KMnO₄) × 5 ⇒ 3 moles.',
    },
    {
      id: 'mcq_adm_2',
      subject: 'Admission',
      chapter: 'BUET Physics Electrostatics',
      question:
        'An isolated parallel-plate capacitor is charged and then disconnected from the battery. If a dielectric slab (K = 4) is inserted between the plates, what happens to stored electrostatic energy?',
      options: [
        'Increases 4 times',
        'Decreases to 1/4',
        'Remains constant',
        'Decreases to 1/2',
      ],
      correctIndex: 1,
      explanation:
        'When disconnected, charge Q stays constant. Capacitance increases to KC, so stored energy U = Q²/(2C) becomes U/K = U/4.',
    },
    {
      id: 'mcq_adm_3',
      subject: 'Admission',
      chapter: 'DU Ka Organic Chemistry',
      question:
        'Which of the following compounds undergoes both Aldol Condensation and Haloform (Iodoform) reaction?',
      options: ['Methanal (HCHO)', 'Benzaldehyde', 'Ethanal (CH₃CHO)', 'Benzophenone'],
      correctIndex: 2,
      explanation:
        'Ethanal (CH₃CHO) possesses both α-hydrogens (required for Aldol condensation) and a CH₃-C=O group (required for positive iodoform test).',
    },
    {
      id: 'mcq_adm_4',
      subject: 'Admission',
      chapter: 'DU Ka Higher Math',
      question: 'What is the value of i^i (where i = √−1) principal branch?',
      options: ['e^(−π/2)', 'e^(π/2)', '−1', 'i'],
      correctIndex: 0,
      explanation:
        'Using Euler’s identity i = e^(iπ/2), raising to power i yields i^i = (e^(iπ/2))^i = e^(i²π/2) = e^(−π/2), which is purely real!',
    },
  ],
};

export const MCQ_BANK: McqQuestion[] = Object.values(SUBJECT_MCQ_BANK).flat();

export function getQuestionsForCourse(category: string): McqQuestion[] {
  return (
    SUBJECT_MCQ_BANK[category] ??
    SUBJECT_MCQ_BANK.Chemistry
  );
}
