/**
 * DIODIO — Greek Toll Booth Dataset
 * Prices in EUR, updated January 2026.
 * Sources: aegeanmotorway.gr, neaodos.gr, egnatia.eu,
 *          olympiaodos.gr, kentrikiodos.gr, attikesdidromes.gr,
 *          moreas.com.gr, gefyra.gr, nikana.gr
 *
 * Vehicle categories:
 *   cat1 = Motorcycles / tricycles
 *   cat2 = Cars / light vehicles (height ≤2.20m)
 *   cat3 = 3-axle vehicles / height >2.20m
 *   cat4 = 4+ axle vehicles / height >2.20m
 *
 * Station types:
 *   "frontal"  — main barrier across all lanes (both directions pay here)
 *   "entry"    — lateral ramp; paid when entering the motorway
 *   "exit"     — lateral ramp; paid when leaving the motorway
 *   "bridge"   — bridge / tunnel crossing
 */

const TOLL_DATA = [

  // ══════════════════════════════════════════════════════════
  // A1 / E75  ·  PATHE  ·  Athens – Thessaloniki – Evzoni
  // Operators: Nea Odos (south), Kentriki Odos (centre), Aegean Motorway (north)
  // ══════════════════════════════════════════════════════════

  {
    id: "a1_metamorfosi",
    name: "Metamorfosi",
    highway: "A1", highway_name: "PATHE (A1/E75) · Nea Odos",
    operator: "Nea Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 38.063, lng: 23.762,
    cat1: 1.30, cat2: 2.40, cat3: 4.80, cat4: 7.20,
    notes: "First frontal station north of Athens."
  },
  {
    id: "a1_afidnes",
    name: "Afidnes",
    highway: "A1", highway_name: "PATHE (A1/E75) · Nea Odos",
    operator: "Nea Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 38.196, lng: 23.831,
    cat1: 1.00, cat2: 1.90, cat3: 3.80, cat4: 5.70,
    notes: ""
  },
  {
    id: "a1_agios_konstantinos",
    name: "Agios Konstantinos",
    highway: "A1", highway_name: "PATHE (A1/E75) · Nea Odos",
    operator: "Nea Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 38.750, lng: 22.864,
    cat1: 1.40, cat2: 2.60, cat3: 5.20, cat4: 7.80,
    notes: "Near ferry port for Sporades islands (Skiathos, Skopelos)."
  },
  {
    id: "a1_traganas",
    name: "Traganas",
    highway: "A1", highway_name: "PATHE (A1/E75) · Nea Odos",
    operator: "Nea Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 38.850, lng: 22.783,
    cat1: 1.20, cat2: 2.30, cat3: 4.60, cat4: 6.90,
    notes: "Zone boundary station near Martino / Skarfia."
  },
  {
    id: "a1_raches_entry",
    name: "Raches (Entry)",
    highway: "A1", highway_name: "PATHE (A1/E75) · Nea Odos",
    operator: "Nea Odos",
    type: "entry",
    direction_label: "Entry — northbound (towards Thessaloniki)",
    lat: 38.900, lng: 22.741,
    cat1: 0.60, cat2: 1.10, cat3: 2.20, cat4: 3.30,
    notes: "Lateral ramp — pay on entry heading north."
  },
  {
    id: "a1_pelasgia",
    name: "Pelasgia",
    highway: "A1", highway_name: "PATHE (A1/E75) · Kentriki Odos",
    operator: "Kentriki Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 38.990, lng: 22.535,
    cat1: 1.90, cat2: 3.70, cat3: 7.40, cat4: 11.10,
    notes: "Highest-priced station on Kentriki Odos section."
  },
  {
    id: "a1_glyfa_ramp",
    name: "Glyfa (Exit)",
    highway: "A1", highway_name: "PATHE (A1/E75) · Kentriki Odos",
    operator: "Kentriki Odos",
    type: "exit",
    direction_label: "Exit — towards Glyfa / Evia ferry",
    lat: 38.938, lng: 22.641,
    cat1: 1.40, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Lateral exit towards Glyfa ferry for Evia island."
  },
  {
    id: "a1_velestino_ramp",
    name: "Velestino (Exit)",
    highway: "A1", highway_name: "PATHE (A1/E75) · Kentriki Odos",
    operator: "Kentriki Odos",
    type: "exit",
    direction_label: "Exit — towards Volos / Velestino",
    lat: 39.382, lng: 22.741,
    cat1: 0.65, cat2: 1.30, cat3: 2.60, cat4: 3.90,
    notes: "Lateral ramp exit towards Volos."
  },
  {
    id: "a1_kileler_ramp",
    name: "Kileler (Exit)",
    highway: "A1", highway_name: "PATHE (A1/E75) · Kentriki Odos",
    operator: "Kentriki Odos",
    type: "exit",
    direction_label: "Exit — towards Larissa east",
    lat: 39.521, lng: 22.502,
    cat1: 1.30, cat2: 2.60, cat3: 5.20, cat4: 7.80,
    notes: "Lateral exit ramp towards eastern Larissa."
  },
  {
    id: "a1_larissa_aegean",
    name: "Larissa",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal",
    direction_label: "Both directions",
    lat: 39.660, lng: 22.398,
    cat1: 0.85, cat2: 1.60, cat3: 3.20, cat4: 4.80,
    notes: "Entry to Aegean Motorway section."
  },
  {
    id: "a1_gyrtoni_ramp",
    name: "Gyrtoni (Exit)",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "exit",
    direction_label: "Exit — towards Tyrnavos",
    lat: 39.752, lng: 22.370,
    cat1: 0.40, cat2: 0.80, cat3: 1.60, cat4: 2.40,
    notes: ""
  },
  {
    id: "a1_leptokarya",
    name: "Leptokarya",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal",
    direction_label: "Both directions",
    lat: 40.101, lng: 22.492,
    cat1: 4.30, cat2: 8.60, cat3: 17.20, cat4: 25.80,
    notes: "Largest frontal station on Aegean Motorway — covers Tempi Valley section."
  },
  {
    id: "a1_leptokarya_ramp",
    name: "Leptokarya (Exit)",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "exit",
    direction_label: "Exit — towards Leptokarya beach",
    lat: 40.099, lng: 22.518,
    cat1: 0.95, cat2: 1.90, cat3: 3.80, cat4: 5.70,
    notes: ""
  },
  {
    id: "a1_platamonas_ramp",
    name: "Platamonas (Exit)",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "exit",
    direction_label: "Exit — towards Platamonas castle / beach",
    lat: 40.000, lng: 22.599,
    cat1: 0.35, cat2: 0.70, cat3: 1.40, cat4: 2.10,
    notes: ""
  },
  {
    id: "a1_katerini",
    name: "Katerini",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal",
    direction_label: "Both directions",
    lat: 40.269, lng: 22.509,
    cat1: 0.85, cat2: 1.60, cat3: 3.20, cat4: 4.80,
    notes: "Gateway to Mount Olympus region."
  },
  {
    id: "a1_aeginio_ramp",
    name: "Aeginio (Exit)",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "exit",
    direction_label: "Exit — towards Aeginio / Pieria coast",
    lat: 40.398, lng: 22.557,
    cat1: 0.85, cat2: 1.70, cat3: 3.40, cat4: 5.10,
    notes: ""
  },
  {
    id: "a1_malgara",
    name: "Malgara",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal",
    direction_label: "Both directions",
    lat: 40.535, lng: 22.587,
    cat1: 0.58, cat2: 1.15, cat3: 2.30, cat4: 3.45,
    notes: "Thessaloniki ring junction. Connects to Egnatia Odos."
  },
  {
    id: "a1_analipsi",
    name: "Analipsi",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal",
    direction_label: "Both directions",
    lat: 40.718, lng: 22.890,
    cat1: 1.18, cat2: 2.35, cat3: 4.70, cat4: 7.05,
    notes: "North of Thessaloniki towards Kavala / Halkidiki."
  },
  {
    id: "a1_asprovalta",
    name: "Asprovalta",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal",
    direction_label: "Both directions",
    lat: 40.723, lng: 23.714,
    cat1: 0.70, cat2: 1.40, cat3: 2.80, cat4: 4.20,
    notes: "Popular summer exit for Asprovalta beach."
  },
  {
    id: "a1_moustheni",
    name: "Moustheni",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal",
    direction_label: "Both directions",
    lat: 40.917, lng: 24.103,
    cat1: 1.33, cat2: 2.65, cat3: 5.30, cat4: 7.95,
    notes: "Between Kavala and Drama junctions."
  },
  {
    id: "a1_evzoni",
    name: "Evzoni (N. Macedonia Border)",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal",
    direction_label: "Southbound (entering Greece from N. Macedonia)",
    lat: 41.135, lng: 22.530,
    cat1: 1.48, cat2: 2.95, cat3: 5.90, cat4: 8.85,
    notes: "Greek–North Macedonian border. First toll entering Greece from the north."
  },

  // ══════════════════════════════════════════════════════════
  // A2 / E90  ·  EGNATIA ODOS  ·  Igoumenitsa – Kipoi
  // Operator: Egnatia Odos AE
  // ══════════════════════════════════════════════════════════
  {
    id: "egnatia_igoumenitsa",
    name: "Igoumenitsa East",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 39.510, lng: 20.290,
    cat1: 1.00, cat2: 2.00, cat3: 4.00, cat4: 6.00,
    notes: "Western terminus of Egnatia. Departure from Igoumenitsa ferry."
  },
  {
    id: "egnatia_ioannina",
    name: "Ioannina",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 39.665, lng: 20.853,
    cat1: 1.10, cat2: 2.15, cat3: 4.30, cat4: 6.45,
    notes: "Ioannina bypass station."
  },
  {
    id: "egnatia_metsovo",
    name: "Metsovo Tunnel",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 39.770, lng: 21.183,
    cat1: 1.40, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Highest point on Egnatia. Mountain tunnel complex through Pindus."
  },
  {
    id: "egnatia_kozani",
    name: "Kozani West",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 40.296, lng: 21.788,
    cat1: 0.90, cat2: 1.80, cat3: 3.60, cat4: 5.40,
    notes: ""
  },
  {
    id: "egnatia_veroia",
    name: "Veroia",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 40.524, lng: 22.197,
    cat1: 0.80, cat2: 1.60, cat3: 3.20, cat4: 4.80,
    notes: ""
  },
  {
    id: "egnatia_thessaloniki_west",
    name: "Thessaloniki West",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 40.636, lng: 22.820,
    cat1: 0.60, cat2: 1.20, cat3: 2.40, cat4: 3.60,
    notes: "Western Thessaloniki bypass."
  },
  {
    id: "egnatia_thessaloniki_east",
    name: "Thessaloniki East",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 40.636, lng: 23.115,
    cat1: 0.65, cat2: 1.30, cat3: 2.60, cat4: 3.90,
    notes: "Eastern bypass towards Kavala / Halkidiki."
  },
  {
    id: "egnatia_kavala_west",
    name: "Kavala West",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 41.000, lng: 24.315,
    cat1: 0.90, cat2: 1.80, cat3: 3.60, cat4: 5.40,
    notes: ""
  },
  {
    id: "egnatia_xanthi",
    name: "Xanthi",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 41.133, lng: 24.875,
    cat1: 0.85, cat2: 1.70, cat3: 3.40, cat4: 5.10,
    notes: ""
  },
  {
    id: "egnatia_komotini",
    name: "Komotini",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 41.120, lng: 25.400,
    cat1: 0.85, cat2: 1.70, cat3: 3.40, cat4: 5.10,
    notes: ""
  },
  {
    id: "egnatia_alexandroupoli",
    name: "Alexandroupoli",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 40.847, lng: 25.869,
    cat1: 0.80, cat2: 1.60, cat3: 3.20, cat4: 4.80,
    notes: "Near Turkish and Bulgarian borders."
  },
  {
    id: "egnatia_kipoi",
    name: "Kipoi (Turkish Border)",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal",
    direction_label: "Westbound (entering Greece from Turkey)",
    lat: 41.298, lng: 26.371,
    cat1: 1.00, cat2: 2.00, cat3: 4.00, cat4: 6.00,
    notes: "Eastern terminus of Egnatia at Greek–Turkish border."
  },
  {
    id: "egnatia_promahonas",
    name: "Promahonas (Bulgarian Border)",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "entry",
    direction_label: "Westbound (entering Greece from Bulgaria)",
    lat: 41.390, lng: 23.394,
    cat1: 1.18, cat2: 2.35, cat3: 4.70, cat4: 7.05,
    notes: "Greek–Bulgarian border spur. Total to Thessaloniki ≈ €5.05."
  },

  // ══════════════════════════════════════════════════════════
  // A5  ·  IONIA ODOS  ·  Antirrio – Ioannina
  // Operator: Nea Odos
  // ══════════════════════════════════════════════════════════
  {
    id: "ionia_klokova",
    name: "Klokova",
    highway: "A5", highway_name: "Ionia Odos (A5)",
    operator: "Nea Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 38.520, lng: 21.450,
    cat1: 1.20, cat2: 2.40, cat3: 4.80, cat4: 7.20,
    notes: "Zone 1 frontal station (Antirrio – Chaliki)."
  },
  {
    id: "ionia_gavrolimni",
    name: "Gavrolimni (Entry)",
    highway: "A5", highway_name: "Ionia Odos (A5)",
    operator: "Nea Odos",
    type: "entry",
    direction_label: "Entry — northbound (towards Ioannina)",
    lat: 38.570, lng: 21.390,
    cat1: 0.60, cat2: 1.20, cat3: 2.40, cat4: 3.60,
    notes: "Lateral entry ramp northbound."
  },
  {
    id: "ionia_missolonghi",
    name: "Missolonghi (Exit)",
    highway: "A5", highway_name: "Ionia Odos (A5)",
    operator: "Nea Odos",
    type: "exit",
    direction_label: "Exit — towards Missolonghi",
    lat: 38.368, lng: 21.432,
    cat1: 0.55, cat2: 1.10, cat3: 2.20, cat4: 3.30,
    notes: "Exit towards historic Missolonghi (Lord Byron connection)."
  },
  {
    id: "ionia_aggelokastro",
    name: "Aggelokastro",
    highway: "A5", highway_name: "Ionia Odos (A5)",
    operator: "Nea Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 38.651, lng: 21.372,
    cat1: 1.40, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Zone 2 frontal (Chaliki – Amfilochia)."
  },
  {
    id: "ionia_amfilochia",
    name: "Amfilochia",
    highway: "A5", highway_name: "Ionia Odos (A5)",
    operator: "Nea Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 38.856, lng: 21.165,
    cat1: 1.60, cat2: 3.20, cat3: 6.40, cat4: 9.60,
    notes: "Zone 3 frontal. Scenic Amvrakikos Gulf area."
  },
  {
    id: "ionia_arta",
    name: "Arta",
    highway: "A5", highway_name: "Ionia Odos (A5)",
    operator: "Nea Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 39.160, lng: 20.985,
    cat1: 1.40, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Zone 4. Near the historic Ottoman bridge of Arta."
  },
  {
    id: "ionia_menidi",
    name: "Menidi",
    highway: "A5", highway_name: "Ionia Odos (A5)",
    operator: "Nea Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 39.095, lng: 20.878,
    cat1: 1.63, cat2: 3.25, cat3: 6.50, cat4: 9.75,
    notes: "Large station on Arta–Ioannina section."
  },
  {
    id: "ionia_menidi_exit",
    name: "Menidi (Exit)",
    highway: "A5", highway_name: "Ionia Odos (A5)",
    operator: "Nea Odos",
    type: "exit",
    direction_label: "Exit — towards Arta / Preveza",
    lat: 39.085, lng: 20.865,
    cat1: 1.63, cat2: 3.25, cat3: 6.50, cat4: 9.75,
    notes: "Lateral ramp exit."
  },
  {
    id: "ionia_ioannina_south",
    name: "Ioannina South",
    highway: "A5", highway_name: "Ionia Odos (A5)",
    operator: "Nea Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 39.580, lng: 20.862,
    cat1: 1.80, cat2: 3.60, cat3: 7.20, cat4: 10.80,
    notes: "Southern approach to Ioannina. Junction with Egnatia Odos A2."
  },

  // ══════════════════════════════════════════════════════════
  // A8 / E94  ·  OLYMPIA ODOS  ·  Athens – Patras
  // Operator: Olympia Odos
  // ══════════════════════════════════════════════════════════
  {
    id: "olympia_elefsina",
    name: "Elefsina",
    highway: "A8", highway_name: "Olympia Odos (A8/E94)",
    operator: "Olympia Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 38.041, lng: 23.541,
    cat1: 0.95, cat2: 1.90, cat3: 3.80, cat4: 5.70,
    notes: "Western Athens gateway. Junction with A6 Attiki Odos."
  },
  {
    id: "olympia_megara",
    name: "Megara",
    highway: "A8", highway_name: "Olympia Odos (A8/E94)",
    operator: "Olympia Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 37.993, lng: 23.346,
    cat1: 1.15, cat2: 2.30, cat3: 4.60, cat4: 6.90,
    notes: ""
  },
  {
    id: "olympia_isthmos",
    name: "Isthmos (Corinth Canal)",
    highway: "A8", highway_name: "Olympia Odos (A8/E94)",
    operator: "Olympia Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 37.934, lng: 22.987,
    cat1: 1.40, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Crosses the Corinth Canal. Gateway to Peloponnese."
  },
  {
    id: "olympia_kiato",
    name: "Kiato",
    highway: "A8", highway_name: "Olympia Odos (A8/E94)",
    operator: "Olympia Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 38.013, lng: 22.741,
    cat1: 1.05, cat2: 2.10, cat3: 4.20, cat4: 6.30,
    notes: ""
  },
  {
    id: "olympia_xylokastro_exit",
    name: "Xylokastro (Exit)",
    highway: "A8", highway_name: "Olympia Odos (A8/E94)",
    operator: "Olympia Odos",
    type: "exit",
    direction_label: "Exit — towards Xylokastro coast",
    lat: 38.076, lng: 22.634,
    cat1: 0.55, cat2: 1.10, cat3: 2.20, cat4: 3.30,
    notes: "Exit ramp for Xylokastro seaside resort."
  },
  {
    id: "olympia_aigio",
    name: "Aigio",
    highway: "A8", highway_name: "Olympia Odos (A8/E94)",
    operator: "Olympia Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 38.252, lng: 22.085,
    cat1: 1.20, cat2: 2.40, cat3: 4.80, cat4: 7.20,
    notes: "Halfway Athens–Patras. Views of Gulf of Corinth."
  },
  {
    id: "olympia_klini_exit",
    name: "Klini (Exit)",
    highway: "A8", highway_name: "Olympia Odos (A8/E94)",
    operator: "Olympia Odos",
    type: "exit",
    direction_label: "Exit — towards Klini port (Zakynthos ferry)",
    lat: 38.198, lng: 21.627,
    cat1: 0.95, cat2: 1.90, cat3: 3.80, cat4: 5.70,
    notes: "Exit for Klini port — ferries to Zakynthos island."
  },
  {
    id: "olympia_patras_east",
    name: "Patras East",
    highway: "A8", highway_name: "Olympia Odos (A8/E94)",
    operator: "Olympia Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 38.230, lng: 21.795,
    cat1: 0.95, cat2: 1.90, cat3: 3.80, cat4: 5.70,
    notes: "Eastern approach to Patras. Junction with A7 Moreas."
  },

  // ══════════════════════════════════════════════════════════
  // BRIDGES & TUNNELS
  // ══════════════════════════════════════════════════════════
  {
    id: "rioantirrio",
    name: "Rio–Antirrio Bridge",
    highway: "BRIDGE", highway_name: "Rio–Antirrio Bridge (Gefyra SA)",
    operator: "Gefyra SA",
    type: "bridge",
    direction_label: "Westbound only (Antirrio side). Eastbound is FREE.",
    lat: 38.319, lng: 21.778,
    cat1: 7.60, cat2: 15.50, cat3: 25.00, cat4: 35.00,
    notes: "World's longest multi-span cable-stayed bridge (2.88 km). Toll collected only westbound."
  },
  {
    id: "aktio_preveza",
    name: "Aktio–Preveza Tunnel",
    highway: "BRIDGE", highway_name: "Aktio–Preveza Underwater Tunnel",
    operator: "State",
    type: "bridge",
    direction_label: "Both directions",
    lat: 38.960, lng: 20.747,
    cat1: 1.50, cat2: 3.00, cat3: 6.00, cat4: 9.00,
    notes: "Only underwater tunnel in Greece (1.5 km). Essential for reaching Lefkada overland."
  },

  // ══════════════════════════════════════════════════════════
  // A6  ·  ATTIKI ODOS  ·  Athens ring road
  // Operator: Attikes Diadromes
  // ══════════════════════════════════════════════════════════
  {
    id: "attiki_main",
    name: "Attiki Odos (Entry)",
    highway: "A6", highway_name: "Attiki Odos (A6)",
    operator: "Attikes Diadromes",
    type: "entry",
    direction_label: "Pay once on entry — covers full traverse (€2.55)",
    lat: 38.020, lng: 23.660,
    cat1: 1.28, cat2: 2.55, cat3: 4.70, cat4: 7.00,
    notes: "Flat-rate toll paid once on entry. Covers entire ring regardless of exit. Height limit: 1.30m above first axle."
  },
  {
    id: "attiki_airport",
    name: "Airport Spur (Spata)",
    highway: "A6", highway_name: "Attiki Odos (A6) — Airport branch",
    operator: "Attikes Diadromes",
    type: "entry",
    direction_label: "Entry — towards Athens Airport (Eleftherios Venizelos)",
    lat: 37.941, lng: 23.935,
    cat1: 1.28, cat2: 2.55, cat3: 4.70, cat4: 7.00,
    notes: "Spur to Athens International Airport."
  },

  // ══════════════════════════════════════════════════════════
  // A7  ·  MOREAS  ·  Corinth – Tripoli – Kalamata
  // Operator: Moreas SA
  // ══════════════════════════════════════════════════════════
  {
    id: "moreas_corinth",
    name: "Corinth South",
    highway: "A7", highway_name: "Moreas (A7)",
    operator: "Moreas SA",
    type: "frontal",
    direction_label: "Southbound (entering Peloponnese)",
    lat: 37.902, lng: 22.917,
    cat1: 1.05, cat2: 2.10, cat3: 4.20, cat4: 6.30,
    notes: "Start of Moreas motorway."
  },
  {
    id: "moreas_argos",
    name: "Argos",
    highway: "A7", highway_name: "Moreas (A7)",
    operator: "Moreas SA",
    type: "frontal",
    direction_label: "Both directions",
    lat: 37.638, lng: 22.723,
    cat1: 1.20, cat2: 2.40, cat3: 4.80, cat4: 7.20,
    notes: "Near ancient Mycenae. Exit for Nafplio."
  },
  {
    id: "moreas_nafplio_exit",
    name: "Nafplio (Exit)",
    highway: "A7", highway_name: "Moreas (A7)",
    operator: "Moreas SA",
    type: "exit",
    direction_label: "Exit — towards Nafplio / Epidaurus",
    lat: 37.593, lng: 22.797,
    cat1: 0.60, cat2: 1.20, cat3: 2.40, cat4: 3.60,
    notes: "Exit for Nafplio, one of Greece's most scenic towns."
  },
  {
    id: "moreas_tripoli",
    name: "Tripoli North",
    highway: "A7", highway_name: "Moreas (A7)",
    operator: "Moreas SA",
    type: "frontal",
    direction_label: "Both directions",
    lat: 37.523, lng: 22.380,
    cat1: 1.40, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Highest point on Moreas (Arcadian plateau). Junction for Sparta branch."
  },
  {
    id: "moreas_sparta_exit",
    name: "Sparta Branch (Exit)",
    highway: "A7", highway_name: "Moreas (A7) — Sparta spur",
    operator: "Moreas SA",
    type: "exit",
    direction_label: "Exit — towards Sparta / Mystras",
    lat: 37.260, lng: 22.430,
    cat1: 1.05, cat2: 2.10, cat3: 4.20, cat4: 6.30,
    notes: "Lateral ramp for Lefktro–Sparta branch."
  },
  {
    id: "moreas_kalamata",
    name: "Kalamata",
    highway: "A7", highway_name: "Moreas (A7)",
    operator: "Moreas SA",
    type: "frontal",
    direction_label: "Both directions",
    lat: 37.037, lng: 22.113,
    cat1: 0.95, cat2: 1.90, cat3: 3.80, cat4: 5.70,
    notes: "Southern terminus of Moreas motorway."
  },

  // ══════════════════════════════════════════════════════════
  // E65  ·  CENTRAL GREECE  ·  Lamia – Trikala
  // Operator: Kentriki Odos
  // ══════════════════════════════════════════════════════════
  {
    id: "e65_sofades",
    name: "Sofades",
    highway: "E65", highway_name: "Central Greece (E65)",
    operator: "Kentriki Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 39.340, lng: 22.109,
    cat1: 0.98, cat2: 1.95, cat3: 3.90, cat4: 5.85,
    notes: "First station on E65 north of Lamia junction."
  },
  {
    id: "e65_karditsa",
    name: "Karditsa",
    highway: "E65", highway_name: "Central Greece (E65)",
    operator: "Kentriki Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 39.364, lng: 21.925,
    cat1: 1.10, cat2: 2.20, cat3: 4.40, cat4: 6.60,
    notes: ""
  },
  {
    id: "e65_trikala",
    name: "Trikala",
    highway: "E65", highway_name: "Central Greece (E65)",
    operator: "Kentriki Odos",
    type: "frontal",
    direction_label: "Both directions",
    lat: 39.556, lng: 21.768,
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

// ── Marker shape by station type ─────────────────────────
// frontal = full diamond, entry = upward triangle, exit = downward triangle, bridge = circle
const TYPE_SHAPES = {
  frontal: "diamond",
  entry:   "triangle-up",
  exit:    "triangle-down",
  bridge:  "circle",
};

if (typeof module !== "undefined") module.exports = { TOLL_DATA, HIGHWAY_COLORS, TYPE_SHAPES };
