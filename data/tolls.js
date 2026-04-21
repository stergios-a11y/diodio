/**
 * DIODIO — Greek Toll Booth Dataset
 * Coordinates sourced from diodia.com.gr Google My Maps (KMZ)
 * Prices updated January 2026.
 *
 * Vehicle categories:
 *   cat1 = Motorcycles
 *   cat2 = Cars / light vehicles (height ≤2.20m)
 *   cat3 = 3-axle / height >2.20m
 *   cat4 = 4+ axle / height >2.20m
 *
 * Station types:
 *   "frontal" — main barrier, both directions pay
 *   "entry"   — lateral ramp, pay on entry
 *   "exit"    — lateral ramp, pay on exit
 *   "bridge"  — bridge or tunnel
 */

const TOLL_DATA = [

  // ══════════════════════════════════════════════════════════
  // A1 / E75  ·  PATHE  ·  Athens – Thessaloniki – Evzoni
  // ══════════════════════════════════════════════════════════

  {
    id: "a1_metamorfosi",
    name: "Metamorfosi / Thiva",
    highway: "A1", highway_name: "PATHE (A1/E75) · Nea Odos",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.3708752, lng: 23.2868636,
    cat1: 1.30, cat2: 2.40, cat3: 4.80, cat4: 7.20,
    notes: "Thebes / Thiva area. First major frontal station north of Athens on A1."
  },
  {
    id: "a1_afidnes",
    name: "Afidnes",
    highway: "A1", highway_name: "PATHE (A1/E75) · Nea Odos",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.176469, lng: 23.8546228,
    cat1: 1.00, cat2: 1.90, cat3: 3.80, cat4: 5.70,
    notes: ""
  },
  {
    id: "a1_agios_konstantinos",
    name: "Agios Konstantinos (Agia Triada)",
    highway: "A1", highway_name: "PATHE (A1/E75) · Nea Odos",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.8087016, lng: 22.6025569,
    cat1: 1.40, cat2: 2.60, cat3: 5.20, cat4: 7.80,
    notes: "Near ferry port for Sporades islands (Skiathos, Skopelos)."
  },
  {
    id: "a1_traganas",
    name: "Mavromantila / Traganas",
    highway: "A1", highway_name: "PATHE (A1/E75) · Nea Odos",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.9238268, lng: 22.6291966,
    cat1: 1.20, cat2: 2.30, cat3: 4.60, cat4: 6.90,
    notes: "Zone boundary station."
  },
  {
    id: "a1_lianokladi",
    name: "Lianokladi",
    highway: "A1", highway_name: "PATHE (A1/E75) · Kentriki Odos",
    operator: "Kentriki Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.9148821, lng: 22.3487648,
    cat1: 1.20, cat2: 2.30, cat3: 4.60, cat4: 6.90,
    notes: "Near Lamia junction."
  },
  {
    id: "a1_pelasgia",
    name: "Pelasgia",
    highway: "A1", highway_name: "PATHE (A1/E75) · Kentriki Odos",
    operator: "Kentriki Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.9203273, lng: 22.8462812,
    cat1: 1.90, cat2: 3.70, cat3: 7.40, cat4: 11.10,
    notes: "Highest-priced station on Kentriki Odos section."
  },
  {
    id: "a1_larissa_aegean",
    name: "Makrychori / Larissa",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal", direction_label: "Both directions",
    lat: 39.8044068, lng: 22.5028431,
    cat1: 0.85, cat2: 1.60, cat3: 3.20, cat4: 4.80,
    notes: "Entry to Aegean Motorway section north of Larissa."
  },
  {
    id: "a1_kileler_ramp",
    name: "Moschochori / Kileler",
    highway: "A1", highway_name: "PATHE (A1/E75) · Kentriki Odos",
    operator: "Kentriki Odos",
    type: "exit", direction_label: "Exit — towards Volos / Larissa east",
    lat: 39.5227965, lng: 22.5567985,
    cat1: 1.30, cat2: 2.60, cat3: 5.20, cat4: 7.80,
    notes: "Lateral exit ramp."
  },
  {
    id: "a1_leptokarya",
    name: "Leptokarya",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal", direction_label: "Both directions",
    lat: 40.0357339, lng: 22.5698233,
    cat1: 4.30, cat2: 8.60, cat3: 17.20, cat4: 25.80,
    notes: "Largest frontal station on Aegean Motorway — covers Tempi Valley section."
  },
  {
    id: "a1_aeginio_ramp",
    name: "Kleidi / Aeginio",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "exit", direction_label: "Exit — towards Aeginio / Pieria coast",
    lat: 40.5195819, lng: 22.5726664,
    cat1: 0.85, cat2: 1.70, cat3: 3.40, cat4: 5.10,
    notes: ""
  },
  {
    id: "a1_malgara",
    name: "Malgara",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal", direction_label: "Both directions",
    lat: 40.6024027, lng: 22.6982903,
    cat1: 0.58, cat2: 1.15, cat3: 2.30, cat4: 3.45,
    notes: "Thessaloniki ring junction. Connects to Egnatia Odos."
  },
  {
    id: "a1_analipsi",
    name: "Analipsi",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal", direction_label: "Both directions",
    lat: 40.7068438, lng: 23.1914413,
    cat1: 1.18, cat2: 2.35, cat3: 4.70, cat4: 7.05,
    notes: "North of Thessaloniki towards Kavala / Halkidiki."
  },
  {
    id: "a1_asprovalta",
    name: "Asprovalta",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal", direction_label: "Both directions",
    lat: 40.7269335, lng: 23.6936209,
    cat1: 0.70, cat2: 1.40, cat3: 2.80, cat4: 4.20,
    notes: "Popular summer exit for Asprovalta beach."
  },
  {
    id: "a1_moustheni",
    name: "Moustheni / Strymoniko",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal", direction_label: "Both directions",
    lat: 40.8582573, lng: 24.1623607,
    cat1: 1.33, cat2: 2.65, cat3: 5.30, cat4: 7.95,
    notes: "Between Kavala and Drama junctions."
  },
  {
    id: "a1_evzoni",
    name: "Evzoni (N. Macedonia Border)",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal", direction_label: "Southbound (entering Greece from N. Macedonia)",
    lat: 41.108136, lng: 22.5590944,
    cat1: 1.48, cat2: 2.95, cat3: 5.90, cat4: 8.85,
    notes: "Greek–North Macedonian border. First toll entering Greece from the north."
  },

  // ══════════════════════════════════════════════════════════
  // A2 / E90  ·  EGNATIA ODOS  ·  Igoumenitsa – Kipoi
  // ══════════════════════════════════════════════════════════

  {
    id: "egnatia_igoumenitsa",
    name: "Tyria / Igoumenitsa",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 39.5403268, lng: 20.6743276,
    cat1: 1.00, cat2: 2.00, cat3: 4.00, cat4: 6.00,
    notes: "Western terminus of Egnatia. Departure from Igoumenitsa ferry."
  },
  {
    id: "egnatia_ioannina",
    name: "Pamvotida / Ioannina",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 39.618863, lng: 20.9475803,
    cat1: 1.10, cat2: 2.15, cat3: 4.30, cat4: 6.45,
    notes: "Ioannina bypass station. Pamvotida lake area."
  },
  {
    id: "egnatia_metsovo",
    name: "Malakasi / Metsovo Tunnel",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 39.7855212, lng: 21.2854099,
    cat1: 1.40, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Highest point on Egnatia. Mountain tunnel complex through Pindus."
  },
  {
    id: "egnatia_kozani",
    name: "Siatista / Kozani",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 40.2378869, lng: 21.5810286,
    cat1: 0.90, cat2: 1.80, cat3: 3.60, cat4: 5.40,
    notes: ""
  },
  {
    id: "egnatia_ieropigi",
    name: "Ieropigi",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 40.5665678, lng: 21.0665417,
    cat1: 0.80, cat2: 1.60, cat3: 3.20, cat4: 4.80,
    notes: "Western Macedonia section."
  },
  {
    id: "egnatia_veroia",
    name: "Polymylo / Veroia",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 40.3671958, lng: 22.0602089,
    cat1: 0.80, cat2: 1.60, cat3: 3.20, cat4: 4.80,
    notes: ""
  },
  {
    id: "egnatia_thessaloniki_west",
    name: "Thessaloniki West (Oraiokastro)",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 40.6956111, lng: 22.9162091,
    cat1: 0.60, cat2: 1.20, cat3: 2.40, cat4: 3.60,
    notes: "Western Thessaloniki bypass."
  },
  {
    id: "egnatia_strymoniko",
    name: "Strymoniko",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 41.0435183, lng: 23.2952374,
    cat1: 0.90, cat2: 1.80, cat3: 3.60, cat4: 5.40,
    notes: "Between Thessaloniki and Kavala."
  },
  {
    id: "egnatia_xanthi",
    name: "Iasmos / Xanthi",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 41.1203415, lng: 25.0802422,
    cat1: 0.85, cat2: 1.70, cat3: 3.40, cat4: 5.10,
    notes: ""
  },
  {
    id: "egnatia_komotini",
    name: "Mestis / Komotini",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 41.013524, lng: 25.5332019,
    cat1: 0.85, cat2: 1.70, cat3: 3.40, cat4: 5.10,
    notes: ""
  },
  {
    id: "egnatia_alexandroupoli",
    name: "Ardanio / Alexandroupoli",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 40.9441053, lng: 26.2045028,
    cat1: 0.80, cat2: 1.60, cat3: 3.20, cat4: 4.80,
    notes: "Near Turkish border."
  },
  {
    id: "egnatia_promahonas",
    name: "Promahonas (Bulgarian Border)",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "entry", direction_label: "Westbound (entering Greece from Bulgaria)",
    lat: 41.3641919, lng: 23.3567727,
    cat1: 1.18, cat2: 2.35, cat3: 4.70, cat4: 7.05,
    notes: "Greek–Bulgarian border spur."
  },

  // ══════════════════════════════════════════════════════════
  // A5  ·  IONIA ODOS  ·  Antirrio – Ioannina
  // ══════════════════════════════════════════════════════════

  {
    id: "ionia_klokova",
    name: "Klokova",
    highway: "A5", highway_name: "Ionia Odos (A5)",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.3592412, lng: 21.6565418,
    cat1: 1.20, cat2: 2.40, cat3: 4.80, cat4: 7.20,
    notes: "Zone 1 frontal station (Antirrio – Chaliki)."
  },
  {
    id: "ionia_aggelokastro",
    name: "Aggelokastro",
    highway: "A5", highway_name: "Ionia Odos (A5)",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.5494744, lng: 21.2723798,
    cat1: 1.40, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Zone 2 frontal (Chaliki – Amfilochia)."
  },
  {
    id: "ionia_menidi",
    name: "Menidi",
    highway: "A5", highway_name: "Ionia Odos (A5)",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.9898946, lng: 21.1709225,
    cat1: 1.63, cat2: 3.25, cat3: 6.50, cat4: 9.75,
    notes: "Large station on Arta–Ioannina section."
  },
  {
    id: "ionia_terovos",
    name: "Terovos / Arta",
    highway: "A5", highway_name: "Ionia Odos (A5)",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 39.425246, lng: 20.9053087,
    cat1: 1.40, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Near Arta. Zone 4 frontal station."
  },
  {
    id: "ionia_ioannina_south",
    name: "Ioannina South",
    highway: "A5", highway_name: "Ionia Odos (A5)",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 39.580, lng: 20.862,
    cat1: 1.80, cat2: 3.60, cat3: 7.20, cat4: 10.80,
    notes: "Southern approach to Ioannina. Junction with Egnatia Odos A2."
  },

  // ══════════════════════════════════════════════════════════
  // A8 / E94  ·  OLYMPIA ODOS  ·  Athens – Patras
  // ══════════════════════════════════════════════════════════

  {
    id: "olympia_elefsina",
    name: "Elefsina",
    highway: "A8", highway_name: "Olympia Odos (A8/E94)",
    operator: "Olympia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.0422442, lng: 23.4958076,
    cat1: 0.95, cat2: 1.90, cat3: 3.80, cat4: 5.70,
    notes: "Western Athens gateway. Junction with A6 Attiki Odos."
  },
  {
    id: "olympia_isthmos",
    name: "Zevgolatio / Isthmos",
    highway: "A8", highway_name: "Olympia Odos (A8/E94)",
    operator: "Olympia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 37.9222552, lng: 22.8096664,
    cat1: 1.40, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Near Corinth Canal. Gateway to Peloponnese."
  },
  {
    id: "olympia_aigio",
    name: "Elaionas / Aigio",
    highway: "A8", highway_name: "Olympia Odos (A8/E94)",
    operator: "Olympia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.2057293, lng: 22.1392536,
    cat1: 1.20, cat2: 2.40, cat3: 4.80, cat4: 7.20,
    notes: "Halfway Athens–Patras. Views of Gulf of Corinth."
  },
  {
    id: "olympia_patras_east",
    name: "Patras",
    highway: "A8", highway_name: "Olympia Odos (A8/E94)",
    operator: "Olympia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.1449493, lng: 21.619157,
    cat1: 0.95, cat2: 1.90, cat3: 3.80, cat4: 5.70,
    notes: "Eastern approach to Patras. Junction with A7 Moreas."
  },
  {
    id: "olympia_pyrgos",
    name: "Pyrgos",
    highway: "A8", highway_name: "Olympia Odos (A8/E94)",
    operator: "Olympia Odos",
    type: "exit", direction_label: "Exit — towards Pyrgos / Ancient Olympia",
    lat: 37.7525508, lng: 21.3585639,
    cat1: 0.95, cat2: 1.90, cat3: 3.80, cat4: 5.70,
    notes: "Exit for Ancient Olympia archaeological site."
  },

  // ══════════════════════════════════════════════════════════
  // BRIDGES & TUNNELS
  // ══════════════════════════════════════════════════════════

  {
    id: "rioantirrio",
    name: "Rio–Antirrio Bridge",
    highway: "BRIDGE", highway_name: "Rio–Antirrio Bridge (Gefyra SA)",
    operator: "Gefyra SA",
    type: "bridge", direction_label: "Westbound only (Antirrio side). Eastbound is FREE.",
    lat: 38.3337794, lng: 21.7660189,
    cat1: 7.60, cat2: 15.50, cat3: 25.00, cat4: 35.00,
    notes: "World's longest multi-span cable-stayed bridge (2.88 km). Toll collected only westbound."
  },
  {
    id: "aktio_preveza",
    name: "Aktio–Preveza Tunnel",
    highway: "BRIDGE", highway_name: "Aktio–Preveza Underwater Tunnel",
    operator: "State",
    type: "bridge", direction_label: "Both directions",
    lat: 38.9481954, lng: 20.7569504,
    cat1: 1.50, cat2: 3.00, cat3: 6.00, cat4: 9.00,
    notes: "Only underwater tunnel in Greece (1.5 km). Essential for reaching Lefkada overland."
  },

  // ══════════════════════════════════════════════════════════
  // A6  ·  ATTIKI ODOS  ·  Athens ring road
  // ══════════════════════════════════════════════════════════

  {
    id: "attiki_main",
    name: "Attiki Odos",
    highway: "A6", highway_name: "Attiki Odos (A6)",
    operator: "Attikes Diadromes",
    type: "entry", direction_label: "Pay once on entry — covers full traverse (€2.55)",
    lat: 38.0620135, lng: 23.7495232,
    cat1: 1.28, cat2: 2.55, cat3: 4.70, cat4: 7.00,
    notes: "Flat-rate toll paid once on entry. Covers entire ring regardless of exit point."
  },

  // ══════════════════════════════════════════════════════════
  // A7  ·  MOREAS  ·  Corinth – Tripoli – Kalamata
  // ══════════════════════════════════════════════════════════

  {
    id: "moreas_corinth",
    name: "Spathvounio / Corinth",
    highway: "A7", highway_name: "Moreas (A7)",
    operator: "Moreas SA",
    type: "frontal", direction_label: "Both directions",
    lat: 37.8359076, lng: 22.8079391,
    cat1: 1.05, cat2: 2.10, cat3: 4.20, cat4: 6.30,
    notes: "Start of Moreas motorway south of Corinth."
  },
  {
    id: "moreas_argos",
    name: "Nestani / Argos",
    highway: "A7", highway_name: "Moreas (A7)",
    operator: "Moreas SA",
    type: "frontal", direction_label: "Both directions",
    lat: 37.6007682, lng: 22.4464524,
    cat1: 1.20, cat2: 2.40, cat3: 4.80, cat4: 7.20,
    notes: "Near ancient Mycenae. Exit for Nafplio."
  },
  {
    id: "moreas_tripoli",
    name: "Petrina / Tripoli",
    highway: "A7", highway_name: "Moreas (A7)",
    operator: "Moreas SA",
    type: "frontal", direction_label: "Both directions",
    lat: 37.29885, lng: 22.2102678,
    cat1: 1.40, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Arcadian plateau section. Junction for Sparta branch."
  },
  {
    id: "moreas_veligosti",
    name: "Veligosti / Sparta branch",
    highway: "A7", highway_name: "Moreas (A7) — Sparta spur",
    operator: "Moreas SA",
    type: "exit", direction_label: "Exit — towards Sparta / Mystras",
    lat: 37.3450082, lng: 22.1103072,
    cat1: 1.05, cat2: 2.10, cat3: 4.20, cat4: 6.30,
    notes: "Lateral ramp for Lefktro–Sparta branch."
  },
  {
    id: "moreas_kalamata",
    name: "Kalamata",
    highway: "A7", highway_name: "Moreas (A7)",
    operator: "Moreas SA",
    type: "frontal", direction_label: "Both directions",
    lat: 37.1368508, lng: 22.0379627,
    cat1: 0.95, cat2: 1.90, cat3: 3.80, cat4: 5.70,
    notes: "Southern terminus of Moreas motorway."
  },

  // ══════════════════════════════════════════════════════════
  // E65  ·  CENTRAL GREECE  ·  Lamia – Trikala
  // ══════════════════════════════════════════════════════════

  {
    id: "e65_sofades",
    name: "Sofades",
    highway: "E65", highway_name: "Central Greece (E65)",
    operator: "Kentriki Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 39.2566317, lng: 22.0831633,
    cat1: 0.98, cat2: 1.95, cat3: 3.90, cat4: 5.85,
    notes: "First station on E65 north of Lamia junction."
  },
  {
    id: "e65_trikala",
    name: "Trikala",
    highway: "E65", highway_name: "Central Greece (E65)",
    operator: "Kentriki Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 39.5204295, lng: 21.8322372,
    cat1: 1.00, cat2: 2.00, cat3: 4.00, cat4: 6.00,
    notes: "Northern terminus of E65."
  },

];

// ── Highway colour palette ────────────────────────────────
const HIGHWAY_COLORS = {
  "A1":     "#1a6b3c",
  "A2":     "#1a4fa8",
  "A5":     "#8b5e1a",
  "A8":     "#b84c2e",
  "BRIDGE": "#8b2fc9",
  "A6":     "#c8a84b",
  "A7":     "#2e7d8b",
  "E65":    "#5e7a1a",
};

const TYPE_SHAPES = {
  frontal: "diamond",
  entry:   "triangle-up",
  exit:    "triangle-down",
  bridge:  "circle",
};

if (typeof module !== "undefined") module.exports = { TOLL_DATA, HIGHWAY_COLORS, TYPE_SHAPES };
