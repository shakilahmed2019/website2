import {
  CategoryItem,
  Course,
  Enrollment,
  NoticeItem,
  PaymentSubmission,
  UserProfile,
} from '../types/lms';
import { FACEBOOK_PAGE_URL, YOUTUBE_CHANNEL_ID, YOUTUBE_CHANNEL_URL } from '../services/youtubeSync';

export const CHANNEL_INFO = {
  brandName: "Tanvir's Science Square",
  shortName: 'Science Square',
  tagline: 'HSC & Academic Science · One-Shot & Admission Prep',
  instructorName: 'Tanvir',
  instructorTitle: "Founder & Lead Science Instructor, Tanvir's Science Square",
  channelId: YOUTUBE_CHANNEL_ID,
  youtubeUrl: YOUTUBE_CHANNEL_URL,
  facebookUrl: FACEBOOK_PAGE_URL,
  supportEmail: 'tamprorigmail@gmail.com',
  location: 'Dhaka, Bangladesh',
  supportHours: 'Sat–Thu, 10:00 AM – 8:00 PM (BST)',
  stats: [
    { label: '4K+ Subscribers', detail: 'YouTube Community' },
    { label: '50+ Free Science Classes', detail: 'One-Shot & Chapter Playlists' },
    { label: 'HSC & Admission Specialist', detail: 'Board · BUET · DU · Medical' },
  ],
};

export const COURSE_IMAGE_LIBRARY = [
  {
    id: 'chemistry-lab',
    label: 'Chemistry Lab & Titration',
    url: '/src/assets/images/science_chemistry_lab_1795187239908.jpg',
  },
  {
    id: 'physics-optics',
    label: 'Physics Prism & Optics',
    url: '/src/assets/images/science_physics_optics_1795187241108.jpg',
  },
  {
    id: 'higher-math',
    label: 'Higher Math Calculus & Conics',
    url: '/src/assets/images/science_higher_math_1795187241385.jpg',
  },
  {
    id: 'biology-microscopy',
    label: 'Biology DNA & Cell Microscopy',
    url: '/src/assets/images/science_biology_microscopy_1795187240712.jpg',
  },
  {
    id: 'admission-prep',
    label: 'Admission Science Workbook',
    url: '/src/assets/images/science_admission_prep_1795187240669.jpg',
  },
];

export const DEMO_USERS: Record<'student' | 'admin', UserProfile> = {
  student: {
    id: 'usr_student_arafat',
    name: 'Arafat Rahman',
    email: 'arafat.hsc26@sciencesquare.bd',
    role: 'student',
    title: 'HSC Science Candidate',
    initials: 'AR',
  },
  admin: {
    id: 'usr_admin_tanvir',
    name: 'Tanvir',
    email: 'tanvir@sciencesquare.bd',
    role: 'admin',
    title: "Founder & Lead Instructor · Tanvir's Science Square",
    initials: 'TS',
  },
};

export const CATEGORIES: CategoryItem[] = [
  { id: 'All', label: 'All Courses', shortLabel: 'All' },
  {
    id: 'Chemistry',
    label: 'Chemistry (রসায়ন / One-Shot)',
    shortLabel: 'Chemistry',
    bengaliHint: 'রসায়ন',
  },
  {
    id: 'Physics',
    label: 'Physics (পদার্থবিজ্ঞান)',
    shortLabel: 'Physics',
    bengaliHint: 'পদার্থবিজ্ঞান',
  },
  {
    id: 'Higher Math',
    label: 'Higher Math (উচ্চতর গণিত)',
    shortLabel: 'Higher Math',
    bengaliHint: 'উচ্চতর গণিত',
  },
  {
    id: 'Biology',
    label: 'Biology (জীববিজ্ঞান)',
    shortLabel: 'Biology',
    bengaliHint: 'জীববিজ্ঞান',
  },
  {
    id: 'Admission',
    label: 'Admission (এডমিশন প্রস্তুতি)',
    shortLabel: 'Admission',
    bengaliHint: 'এডমিশন',
  },
];

export const INITIAL_COURSES: Course[] = [
  {
    id: 'crs_hsc_env_chem',
    title: 'HSC Chemistry 2nd Paper: পরিবেশ রসায়ন (Environmental Chemistry) One-Shot Masterclass',
    subtitle:
      'Complete chapter coverage of Gas Laws (Boyle, Charles, Dalton), Ideal vs Real Gases, Acid-Base theories, BOD/COD & Board CQ-MCQ solving.',
    category: 'Chemistry',
    level: 'Intermediate',
    instructor: 'Tanvir',
    instructorRole: "Founder & Lead Science Instructor, Tanvir's Science Square",
    priceBdt: 0,
    durationHours: 6.5,
    rating: 4.9,
    enrolledCount: 4120,
    thumbnail: '/src/assets/images/science_chemistry_lab_1795187239908.jpg',
    featured: true,
    published: true,
    updatedAt: '2026-11-12',
    modules: [
      {
        id: 'mod_ec_1',
        title: '01. গ্যাস সূত্র ও আদর্শ গ্যাস সমীকরণ (Gas Laws & Kinetic Theory)',
        lessons: [
          {
            id: 'les_ec_1_1',
            title: 'Boyle, Charles, Avogadro & Ideal Gas Equation (PV = nRT)',
            durationMinutes: 32,
            summary:
              'Master graph transformations, RMS velocity derivations, and Dalton’s partial pressure numericals frequently tested in HSC Board & DU Ka.',
            keyTakeaways: [
              'All PV, V-T, and P-1/V isotherm/isobar graph interpretations',
              'Dalton’s law of partial pressure with moist gas correction',
              'Graham’s law of diffusion and RMS speed comparisons',
            ],
            resources: [
              { label: 'পরিবেশ রসায়ন Formula & Graph Sheet', type: 'pdf', sizeOrHint: '2.1 MB' },
              { label: 'Board CQ Question Bank (2018–2025)', type: 'slides', sizeOrHint: '42 slides' },
            ],
          },
          {
            id: 'les_ec_1_2',
            title: 'Real Gases, Compressibility Factor (Z) & Van der Waals Equation',
            durationMinutes: 26,
            summary:
              'Understand positive and negative deviations from ideality, Boyle temperature, and liquefaction of gases using Andrews isotherms.',
            keyTakeaways: [
              'Physical meaning and units of Van der Waals constants a and b',
              'Critical temperature (Tc), pressure (Pc), and volume (Vc) relations',
              'Joule-Thomson effect and inversion temperature criteria',
            ],
          },
        ],
      },
      {
        id: 'mod_ec_2',
        title: '02. এসিড-ক্ষার তত্ত্ব ও জলবায়ু রসায়ন (Acids, Bases & Water Quality)',
        lessons: [
          {
            id: 'les_ec_2_1',
            title: 'Arrhenius, Bronsted-Lowry Conjugate Pairs & Lewis Theory',
            durationMinutes: 24,
            summary:
              'Identify conjugate acids/bases, amphoteric species, and hard-soft Lewis acid-base interactions in seconds.',
            keyTakeaways: [
              'Comparing relative strengths of oxyacids and hydracids',
              'Water pollution parameters: DO, BOD, COD & TDS calculations',
            ],
            resources: [
              { label: 'BOD / COD Numerical Practice Set', type: 'pdf', sizeOrHint: '1.4 MB' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'crs_hsc_physics_cycle',
    title: 'HSC Physics Complete Cycle: Mechanics, Waves & Optics',
    subtitle:
      'Build rock-solid intuition across Newtonian Mechanics, Vector Calculus, Simple Harmonic Motion, Physical Optics & Modern Physics.',
    category: 'Physics',
    level: 'Intermediate',
    instructor: 'Tanvir',
    instructorRole: "Founder & Lead Science Instructor, Tanvir's Science Square",
    priceBdt: 1250,
    originalPriceBdt: 2000,
    durationHours: 18.0,
    rating: 4.9,
    enrolledCount: 2890,
    thumbnail: '/src/assets/images/science_physics_optics_1795187241108.jpg',
    featured: true,
    published: true,
    updatedAt: '2026-11-08',
    modules: [
      {
        id: 'mod_ph_1',
        title: '01. ভেক্টর ও নিউটনিয়ান বলবিদ্যা (Vectors & Newtonian Mechanics)',
        lessons: [
          {
            id: 'les_ph_1_1',
            title: 'Vector Calculus: Gradient, Divergence, Curl & River-Boat Math',
            durationMinutes: 29,
            summary:
              'Solve every river-crossing, rain-umbrella, and 3D dot/cross product problem cleanly for HSC & Engineering admission.',
            keyTakeaways: [
              'Minimum time vs. shortest path river crossing formulas',
              'Physical meaning of grad, div, and curl in HSC 1st Paper',
            ],
            resources: [
              { label: 'Vector & Kinematics Shortcut Compendium', type: 'pdf', sizeOrHint: '2.8 MB' },
            ],
          },
          {
            id: 'les_ph_1_2',
            title: 'Rotational Dynamics, Moment of Inertia & Banking of Roads',
            durationMinutes: 34,
            summary:
              'Parallel and perpendicular axis theorems, torque, angular momentum conservation, and friction-assisted banked curves.',
            keyTakeaways: [
              'Moment of inertia table for rods, rings, discs, and spheres',
              'Rolling without slipping energy conservation',
            ],
          },
        ],
      },
      {
        id: 'mod_ph_2',
        title: '02. ভৌত আলোকবিজ্ঞান ও তরঙ্গ (Waves & Physical Optics)',
        lessons: [
          {
            id: 'les_ph_2_1',
            title: 'Young’s Double Slit Interference, Diffraction & Polarization',
            durationMinutes: 27,
            summary:
              'Path difference vs. phase difference mastery, fringe width shifts in liquids, and single-slit diffraction minima.',
            keyTakeaways: [
              'Fringe width and angular fringe shift derivations',
              'Brewster’s law and Malus’s law problem solving',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'crs_admission_science_batch',
    title: 'Engineering & Varsity Admission Science Batch (BUET / DU / Medical)',
    subtitle:
      'High-yield shortcut strategies, written math drills, and question-bank analysis covering Physics, Chemistry & Higher Math for top public universities.',
    category: 'Admission',
    level: 'Advanced',
    instructor: 'Tanvir',
    instructorRole: "Founder & Lead Science Instructor, Tanvir's Science Square",
    priceBdt: 2450,
    originalPriceBdt: 3500,
    durationHours: 24.0,
    rating: 5.0,
    enrolledCount: 1940,
    thumbnail: '/src/assets/images/science_admission_prep_1795187240669.jpg',
    featured: true,
    published: true,
    updatedAt: '2026-11-15',
    modules: [
      {
        id: 'mod_adm_1',
        title: '01. BUET & CKRUET Written Problem Solving',
        lessons: [
          {
            id: 'les_adm_1_1',
            title: 'Stoichiometry, Limiting Reactants & Redox Titration Tricks',
            durationMinutes: 31,
            summary:
              'Master equivalent-weight shortcuts and multi-step KMnO4 / K2Cr2O7 back-titration problems in under 90 seconds.',
            keyTakeaways: [
              'Valency factor (e-number) determination for tricky redox salts',
              'Solving complex mixture titration without balancing full equations',
            ],
            resources: [
              { label: 'BUET Chemistry Written Archive (2015–2025)', type: 'pdf', sizeOrHint: '3.4 MB' },
            ],
          },
          {
            id: 'les_adm_1_2',
            title: 'Electrostatics, Gauss’s Law & Complex Capacitor Networks',
            durationMinutes: 28,
            summary:
              'Symmetry arguments, dielectric slab insertions, and RC transient circuits tailored for Engineering written exams.',
            keyTakeaways: [
              'Nodal potential method for non-trivial capacitor bridges',
              'Energy loss during charge sharing between capacitors',
            ],
          },
        ],
      },
      {
        id: 'mod_adm_2',
        title: '02. DU Ka & Medical High-Speed MCQ Sprint',
        lessons: [
          {
            id: 'les_adm_2_1',
            title: 'Organic Reaction Mechanisms & Named Reactions Rapid Fire',
            durationMinutes: 25,
            summary:
              'SN1/SN2, E1/E2, Aldol, Cannizzaro, and benzene electrophilic substitution selectivity without calculator guesswork.',
            keyTakeaways: [
              'Ortho/para vs. meta directing group reactivity chart',
              'Distinguishing carbonyls, alcohols, and amines rapidly',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'crs_hsc_higher_math',
    title: 'HSC Higher Math Mastery: Calculus, Straight Lines & Conics',
    subtitle:
      'Step-by-step mastery of Matrices, Straight Lines, Circles, Differentiation, Integration, and Conics with board + admission applications.',
    category: 'Higher Math',
    level: 'Intermediate',
    instructor: 'Tanvir',
    instructorRole: "Founder & Lead Science Instructor, Tanvir's Science Square",
    priceBdt: 1150,
    originalPriceBdt: 1800,
    durationHours: 15.5,
    rating: 4.9,
    enrolledCount: 2430,
    thumbnail: '/src/assets/images/science_higher_math_1795187241385.jpg',
    featured: false,
    published: true,
    updatedAt: '2026-11-01',
    modules: [
      {
        id: 'mod_hm_1',
        title: '01. অন্তরীকরণ ও যোগজীকরণ (Differential & Integral Calculus)',
        lessons: [
          {
            id: 'les_hm_1_1',
            title: 'Limits, Continuity & L’Hôpital’s Rule Shortcuts',
            durationMinutes: 24,
            summary:
              'Evaluate indeterminate forms (0/0, ∞/∞, 1^∞) rapidly using series expansions and L’Hôpital’s theorem.',
            keyTakeaways: [
              'Standard trigonometric and exponential limit identities',
              '1^∞ exponential shortcut formula for admission MCQs',
            ],
          },
          {
            id: 'les_hm_1_2',
            title: 'Definite Integrals, King’s Property & Area Under Curves',
            durationMinutes: 30,
            summary:
              'Solve board CQ area problems between parabolas, lines, and ellipses cleanly using symmetry properties.',
            keyTakeaways: [
              'King’s property and odd/even symmetry reductions',
              'Area enclosed between parabola and straight line shortcut',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'crs_hsc_biology',
    title: 'HSC Biology One-Shot: Cell Division, Genetics & Human Physiology',
    subtitle:
      'Visual concept breakdowns of Botany & Zoology high-weightage chapters, enzyme pathways, blood circulation, and genetics crosses.',
    category: 'Biology',
    level: 'Beginner',
    instructor: 'Tanvir',
    instructorRole: "Founder & Lead Science Instructor, Tanvir's Science Square",
    priceBdt: 850,
    originalPriceBdt: 1400,
    durationHours: 11.0,
    rating: 4.8,
    enrolledCount: 2180,
    thumbnail: '/src/assets/images/science_biology_microscopy_1795187240712.jpg',
    featured: false,
    published: true,
    updatedAt: '2026-10-26',
    modules: [
      {
        id: 'mod_bio_1',
        title: '01. কোষ বিভাজন ও জিনতত্ত্ব (Cell Biology & Genetics)',
        lessons: [
          {
            id: 'les_bio_1_1',
            title: 'Mitosis, Meiosis Crossing Over & DNA Replication',
            durationMinutes: 22,
            summary:
              'Trace chromosome numbers, chromatid separation, and chiasma formation visually for board CQ and Medical admission.',
            keyTakeaways: [
              'Prophase-I sub-stages (Leptotene through Diakinesis) mnemonics',
              'Leading vs. lagging strand enzymes in DNA replication',
            ],
          },
          {
            id: 'les_bio_1_2',
            title: 'Mendelian Deviations, Epistasis & Sex-Linked Inheritance',
            durationMinutes: 25,
            summary:
              'Solve 9:3:4, 9:7, 13:3 phenotypic ratio genetics problems and pedigree charts without memorization errors.',
            keyTakeaways: [
              'Dominant vs. recessive epistasis Punnett ratios',
              'ABO blood group, Rh factor, and color blindness genetics',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'crs_hsc_qualitative_chem',
    title: 'HSC Chemistry 1st Paper: গুণগত রসায়ন (Qualitative Chemistry) One-Shot',
    subtitle:
      'Bohr atomic model, quantum numbers, solubility product (Ksp), and radical identification tests explained from first principles.',
    category: 'Chemistry',
    level: 'Beginner',
    instructor: 'Tanvir',
    instructorRole: "Founder & Lead Science Instructor, Tanvir's Science Square",
    priceBdt: 0,
    durationHours: 5.5,
    rating: 4.9,
    enrolledCount: 3650,
    thumbnail: '/src/assets/images/science_chemistry_lab_1795187239908.jpg',
    featured: false,
    published: true,
    updatedAt: '2026-10-19',
    modules: [
      {
        id: 'mod_qc_1',
        title: '01. পরমাণুর মডেল ও দ্রাব্যতা গুণফল (Atomic Structure & Solubility)',
        lessons: [
          {
            id: 'les_qc_1_1',
            title: 'Bohr Spectrum (Lyman–Pfund), Quantum Numbers & Pauli Principle',
            durationMinutes: 27,
            summary:
              'Calculate Rydberg wavelengths, spectral line counts, and permissible orbital sets effortlessly.',
            keyTakeaways: [
              'Maximum spectral lines formula n(n-1)/2 and series limits',
              'Orbital radial & angular nodes calculation',
            ],
          },
          {
            id: 'les_qc_1_2',
            title: 'Solubility Product (Ksp), Common Ion Effect & Precipitation',
            durationMinutes: 29,
            summary:
              'Predict whether a precipitate forms when mixing two salt solutions using Kip vs. Ksp comparisons.',
            keyTakeaways: [
              'Relating solubility S to Ksp for AB, AB2, and A2B3 salts',
              'Common ion suppression in NaCl and AgCl equilibria',
            ],
          },
        ],
      },
    ],
  },
];

export const INITIAL_STUDENT_ENROLLMENTS: Enrollment[] = [
  {
    courseId: 'crs_hsc_env_chem',
    completedLessonIds: ['les_ec_1_1', 'les_ec_1_2', 'les_ec_2_1'],
    lastLessonId: 'les_ec_2_1',
    enrolledAt: '2026-10-12',
    completedAt: '2026-10-28',
    certificateId: 'TSS-2026-CHEM-4418',
  },
  {
    courseId: 'crs_hsc_physics_cycle',
    completedLessonIds: ['les_ph_1_1'],
    lastLessonId: 'les_ph_1_2',
    enrolledAt: '2026-11-02',
  },
  {
    courseId: 'crs_admission_science_batch',
    completedLessonIds: ['les_adm_1_1'],
    lastLessonId: 'les_adm_1_2',
    enrolledAt: '2026-11-10',
  },
];

export interface PromoRule {
  code: string;
  type: 'percent' | 'flat';
  value: number;
  label: string;
}

export const PROMO_CODES: PromoRule[] = [
  { code: 'TANVIR20', type: 'percent', value: 20, label: '20% Channel Subscriber Discount' },
  { code: 'HSC26', type: 'flat', value: 200, label: '৳200 HSC Batch Concession' },
  { code: 'SCIENCE50', type: 'percent', value: 50, label: '50% Merit Scholarship' },
];

export const INITIAL_NOTICES: NoticeItem[] = [
  {
    id: 'ntc_1',
    title: 'Live One-Shot Tonight',
    message:
      'HSC Chemistry 2nd Paper: পরিবেশ রসায়ন (Environmental Chemistry) Free Masterclass — enroll free or use promo code TANVIR20 on paid batches.',
    priority: 'live',
    active: true,
    linkLabel: 'Open Class',
    targetCourseId: 'crs_hsc_env_chem',
    createdAt: '2026-11-20',
  },
  {
    id: 'ntc_2',
    title: 'Admission Model Test',
    message:
      'BUET, DU Ka & Medical Science MCQ Exam Hall is now active inside every course classroom with instant explanations.',
    priority: 'urgent',
    active: true,
    linkLabel: 'Explore Admission Batch',
    targetCourseId: 'crs_admission_science_batch',
    createdAt: '2026-11-18',
  },
];

export const INITIAL_PAYMENTS: PaymentSubmission[] = [
  {
    id: 'pay_seed_1',
    courseId: 'crs_hsc_physics_cycle',
    courseTitle: 'HSC Physics Complete Cycle: Mechanics, Waves & Optics',
    studentName: 'Arafat Rahman',
    studentPhone: '01712345678',
    method: 'bkash',
    transactionId: 'BKA9X42M10',
    promoCode: 'TANVIR20',
    discountBdt: 250,
    amountPaidBdt: 1000,
    status: 'approved',
    submittedAt: '2026-11-02',
  },
  {
    id: 'pay_seed_2',
    courseId: 'crs_hsc_higher_math',
    courseTitle: 'HSC Higher Math Mastery: Calculus, Straight Lines & Conics',
    studentName: 'Nusrat Jahan',
    studentPhone: '01855987654',
    method: 'nagad',
    transactionId: 'NGD77P19Q8',
    promoCode: 'HSC26',
    discountBdt: 200,
    amountPaidBdt: 950,
    status: 'pending',
    submittedAt: '2026-11-19',
  },
  {
    id: 'pay_seed_3',
    courseId: 'crs_hsc_biology',
    courseTitle: 'HSC Biology One-Shot: Cell Division, Genetics & Human Physiology',
    studentName: 'Samiul Islam',
    studentPhone: '01911223344',
    method: 'rocket',
    transactionId: 'RKT5501928',
    discountBdt: 0,
    amountPaidBdt: 850,
    status: 'pending',
    submittedAt: '2026-11-20',
  },
];

