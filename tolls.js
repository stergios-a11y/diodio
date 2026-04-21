/**
 * DIODIO — Greek Toll Booth Dataset
 * Sources: Gefyra SA, Olympia Odos, Egnatia Odos AE, Attikes Diadromes,
 *          Nea Odos, Central Greece Motorway (E65), Moreas Motorway
 *
 * Prices in EUR, as of 2024.
 * Categories:
 *   cat1 = Motorcycles
 *   cat2 = Cars / light vehicles (≤3.5t)
 *   cat3 = Vehicles 3.5t–12t (small trucks, minibuses)
 *   cat4 = Vehicles >12t (heavy trucks, articulated lorries)
 */

const TOLL_DATA = [

  // ═══════════════════════════════════════
  // A1 / E75 — Athens–Thessaloniki
  // ═══════════════════════════════════════
  {
    id: "a1_metamorfosi",
    name: "Metamorfosi",
    highway: "A1",
    highway_name: "Athens–Thessaloniki (A1/E75)",
    lat: 38.063, lng: 23.762,
    direction: "Both",
    cat1: 1.50, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Northern Athens suburban entry point"
  },
  {
    id: "a1_afidnes",
    name: "Afidnes",
    highway: "A1",
    highway_name: "Athens–Thessaloniki (A1/E75)",
    lat: 38.196, lng: 23.831,
    direction: "Both",
    cat1: 1.10, cat2: 2.10, cat3: 4.20, cat4: 6.30,
    notes: ""
  },
  {
    id: "a1_agios_konstantinos",
    name: "Agios Konstantinos",
    highway: "A1",
    highway_name: "Athens–Thessaloniki (A1/E75)",
    lat: 38.750, lng: 22.864,
    direction: "Both",
    cat1: 1.40, cat2: 2.70, cat3: 5.40, cat4: 8.10,
    notes: "Near ferry port for Sporades islands"
  },
  {
    id: "a1_larissa_north",
    name: "Larissa North",
    highway: "A1",
    highway_name: "Athens–Thessaloniki (A1/E75)",
    lat: 39.701, lng: 22.398,
    direction: "Both",
    cat1: 1.30, cat2: 2.50, cat3: 5.00, cat4: 7.50,
    notes: ""
  },
  {
    id: "a1_katerini",
    name: "Katerini",
    highway: "A1",
    highway_name: "Athens–Thessaloniki (A1/E75)",
    lat: 40.269, lng: 22.509,
    direction: "Both",
    cat1: 1.50, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Gateway to Mount Olympus region"
  },
  {
    id: "a1_thessaloniki_malgara",
    name: "Malgara",
    highway: "A1",
    highway_name: "Athens–Thessaloniki (A1/E75)",
    lat: 40.680, lng: 22.684,
    direction: "Both",
    cat1: 0.90, cat2: 1.70, cat3: 3.40, cat4: 5.10,
    notes: "Thessaloniki bypass ring"
  },

  // ═══════════════════════════════════════
  // A2 / E90 — Egnatia Odos
  // ═══════════════════════════════════════
  {
    id: "egnatia_igoumenitsa",
    name: "Igoumenitsa East",
    highway: "A2",
    highway_name: "Egnatia Odos (A2/E90)",
    lat: 39.507, lng: 20.285,
    direction: "East",
    cat1: 1.80, cat2: 3.40, cat3: 6.80, cat4: 10.20,
    notes: "Departure from Igoumenitsa ferry terminal"
  },
  {
    id: "egnatia_ioannina",
    name: "Ioannina",
    highway: "A2",
    highway_name: "Egnatia Odos (A2/E90)",
    lat: 39.665, lng: 20.853,
    direction: "Both",
    cat1: 2.10, cat2: 4.00, cat3: 8.00, cat4: 12.00,
    notes: "Ioannina bypass"
  },
  {
    id: "egnatia_metsovo",
    name: "Metsovo Tunnel",
    highway: "A2",
    highway_name: "Egnatia Odos (A2/E90)",
    lat: 39.770, lng: 21.183,
    direction: "Both",
    cat1: 2.50, cat2: 4.70, cat3: 9.40, cat4: 14.10,
    notes: "Includes mountain tunnel; highest toll on Egnatia"
  },
  {
    id: "egnatia_kozani",
    name: "Kozani West",
    highway: "A2",
    highway_name: "Egnatia Odos (A2/E90)",
    lat: 40.296, lng: 21.788,
    direction: "Both",
    cat1: 1.60, cat2: 3.10, cat3: 6.20, cat4: 9.30,
    notes: ""
  },
  {
    id: "egnatia_veroia",
    name: "Veroia",
    highway: "A2",
    highway_name: "Egnatia Odos (A2/E90)",
    lat: 40.524, lng: 22.197,
    direction: "Both",
    cat1: 1.40, cat2: 2.70, cat3: 5.40, cat4: 8.10,
    notes: ""
  },
  {
    id: "egnatia_thessaloniki_east",
    name: "Thessaloniki East",
    highway: "A2",
    highway_name: "Egnatia Odos (A2/E90)",
    lat: 40.636, lng: 23.115,
    direction: "Both",
    cat1: 1.30, cat2: 2.40, cat3: 4.80, cat4: 7.20,
    notes: ""
  },
  {
    id: "egnatia_kavala",
    name: "Kavala West",
    highway: "A2",
    highway_name: "Egnatia Odos (A2/E90)",
    lat: 41.000, lng: 24.315,
    direction: "Both",
    cat1: 1.50, cat2: 2.90, cat3: 5.80, cat4: 8.70,
    notes: ""
  },
  {
    id: "egnatia_xanthi",
    name: "Xanthi",
    highway: "A2",
    highway_name: "Egnatia Odos (A2/E90)",
    lat: 41.133, lng: 24.875,
    direction: "Both",
    cat1: 1.40, cat2: 2.60, cat3: 5.20, cat4: 7.80,
    notes: ""
  },
  {
    id: "egnatia_komotini",
    name: "Komotini",
    highway: "A2",
    highway_name: "Egnatia Odos (A2/E90)",
    lat: 41.120, lng: 25.400,
    direction: "Both",
    cat1: 1.30, cat2: 2.50, cat3: 5.00, cat4: 7.50,
    notes: ""
  },
  {
    id: "egnatia_alexandroupoli",
    name: "Alexandroupoli",
    highway: "A2",
    highway_name: "Egnatia Odos (A2/E90)",
    lat: 40.847, lng: 25.869,
    direction: "Both",
    cat1: 1.20, cat2: 2.30, cat3: 4.60, cat4: 6.90,
    notes: "Near Turkish border"
  },

  // ═══════════════════════════════════════
  // A8 / E65 — Olympia Odos (Athens–Patras)
  // ═══════════════════════════════════════
  {
    id: "olympia_elefsina",
    name: "Elefsina",
    highway: "A8",
    highway_name: "Olympia Odos (A8/E65)",
    lat: 38.041, lng: 23.541,
    direction: "Both",
    cat1: 1.00, cat2: 1.90, cat3: 3.80, cat4: 5.70,
    notes: "Western Athens gateway"
  },
  {
    id: "olympia_megara",
    name: "Megara",
    highway: "A8",
    highway_name: "Olympia Odos (A8/E65)",
    lat: 37.993, lng: 23.346,
    direction: "Both",
    cat1: 1.20, cat2: 2.30, cat3: 4.60, cat4: 6.90,
    notes: ""
  },
  {
    id: "olympia_isthmos",
    name: "Isthmos (Corinth Canal)",
    highway: "A8",
    highway_name: "Olympia Odos (A8/E65)",
    lat: 37.934, lng: 22.987,
    direction: "Both",
    cat1: 1.50, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Crosses the Corinth Canal"
  },
  {
    id: "olympia_kiato",
    name: "Kiato",
    highway: "A8",
    highway_name: "Olympia Odos (A8/E65)",
    lat: 38.013, lng: 22.741,
    direction: "Both",
    cat1: 1.10, cat2: 2.10, cat3: 4.20, cat4: 6.30,
    notes: ""
  },
  {
    id: "olympia_aigio",
    name: "Aigio",
    highway: "A8",
    highway_name: "Olympia Odos (A8/E65)",
    lat: 38.252, lng: 22.085,
    direction: "Both",
    cat1: 1.30, cat2: 2.40, cat3: 4.80, cat4: 7.20,
    notes: ""
  },
  {
    id: "olympia_patras_east",
    name: "Patras East",
    highway: "A8",
    highway_name: "Olympia Odos (A8/E65)",
    lat: 38.230, lng: 21.795,
    direction: "Both",
    cat1: 1.00, cat2: 1.90, cat3: 3.80, cat4: 5.70,
    notes: "Entry to Patras urban area"
  },

  // ═══════════════════════════════════════
  // Rio–Antirrio Bridge
  // ═══════════════════════════════════════
  {
    id: "rioantirrio",
    name: "Rio–Antirrio Bridge",
    highway: "BRIDGE",
    highway_name: "Rio–Antirrio (Gefyra SA)",
    lat: 38.319, lng: 21.778,
    direction: "Both",
    cat1: 6.80, cat2: 13.50, cat3: 22.00, cat4: 31.00,
    notes: "Longest cable-stayed bridge in Greece (2.88 km). Toll collected only westbound. Return crossing is free."
  },

  // ═══════════════════════════════════════
  // A6 — Attiki Odos
  // ═══════════════════════════════════════
  {
    id: "attiki_elefsina_stavros",
    name: "Elefsina–Stavros (Full)",
    highway: "A6",
    highway_name: "Attiki Odos (A6)",
    lat: 38.001, lng: 23.630,
    direction: "Both",
    cat1: 1.50, cat2: 3.00, cat3: 5.50, cat4: 8.00,
    notes: "Full traverse of Attiki Odos"
  },
  {
    id: "attiki_pallini",
    name: "Pallini",
    highway: "A6",
    highway_name: "Attiki Odos (A6)",
    lat: 37.990, lng: 23.860,
    direction: "Both",
    cat1: 0.90, cat2: 1.80, cat3: 3.30, cat4: 4.90,
    notes: "Eastern section towards airport"
  },
  {
    id: "attiki_airport",
    name: "Airport (Spata)",
    highway: "A6",
    highway_name: "Attiki Odos (A6)",
    lat: 37.941, lng: 23.935,
    direction: "Both",
    cat1: 1.00, cat2: 2.00, cat3: 3.70, cat4: 5.50,
    notes: "Athens International Airport access"
  },

  // ═══════════════════════════════════════
  // A7 — Moreas (Corinth–Kalamata)
  // ═══════════════════════════════════════
  {
    id: "moreas_corinth",
    name: "Corinth South",
    highway: "A7",
    highway_name: "Moreas (A7)",
    lat: 37.902, lng: 22.917,
    direction: "South",
    cat1: 1.10, cat2: 2.10, cat3: 4.20, cat4: 6.30,
    notes: ""
  },
  {
    id: "moreas_argos",
    name: "Argos",
    highway: "A7",
    highway_name: "Moreas (A7)",
    lat: 37.638, lng: 22.723,
    direction: "Both",
    cat1: 1.30, cat2: 2.40, cat3: 4.80, cat4: 7.20,
    notes: ""
  },
  {
    id: "moreas_tripoli",
    name: "Tripoli North",
    highway: "A7",
    highway_name: "Moreas (A7)",
    lat: 37.523, lng: 22.380,
    direction: "Both",
    cat1: 1.50, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Highest point on Moreas, Arcadian plateau"
  },
  {
    id: "moreas_sparta",
    name: "Sparta Junction",
    highway: "A7",
    highway_name: "Moreas (A7)",
    lat: 37.077, lng: 22.432,
    direction: "Both",
    cat1: 1.20, cat2: 2.30, cat3: 4.60, cat4: 6.90,
    notes: ""
  },
  {
    id: "moreas_kalamata",
    name: "Kalamata",
    highway: "A7",
    highway_name: "Moreas (A7)",
    lat: 37.037, lng: 22.113,
    direction: "North",
    cat1: 1.00, cat2: 1.90, cat3: 3.80, cat4: 5.70,
    notes: "Terminus of Moreas motorway"
  },

  // ═══════════════════════════════════════
  // A25 — Thessaloniki–Kavala
  // ═══════════════════════════════════════
  {
    id: "a25_thessaloniki_airport",
    name: "Thessaloniki Airport",
    highway: "A25",
    highway_name: "Thessaloniki–Kavala (A25)",
    lat: 40.521, lng: 22.972,
    direction: "Both",
    cat1: 0.80, cat2: 1.50, cat3: 3.00, cat4: 4.50,
    notes: "Access to Makedonia Airport"
  },
  {
    id: "a25_langadas",
    name: "Langadas",
    highway: "A25",
    highway_name: "Thessaloniki–Kavala (A25)",
    lat: 40.760, lng: 23.067,
    direction: "Both",
    cat1: 1.00, cat2: 1.90, cat3: 3.80, cat4: 5.70,
    notes: ""
  },

  // ═══════════════════════════════════════
  // E65 — Central Greece (Lamia–Trikala)
  // ═══════════════════════════════════════
  {
    id: "e65_lamia",
    name: "Lamia North",
    highway: "E65",
    highway_name: "Central Greece (E65)",
    lat: 38.910, lng: 22.425,
    direction: "Both",
    cat1: 1.20, cat2: 2.30, cat3: 4.60, cat4: 6.90,
    notes: "Junction with A1"
  },
  {
    id: "e65_karditsa",
    name: "Karditsa",
    highway: "E65",
    highway_name: "Central Greece (E65)",
    lat: 39.364, lng: 21.925,
    direction: "Both",
    cat1: 1.40, cat2: 2.60, cat3: 5.20, cat4: 7.80,
    notes: ""
  },
  {
    id: "e65_trikala",
    name: "Trikala",
    highway: "E65",
    highway_name: "Central Greece (E65)",
    lat: 39.556, lng: 21.768,
    direction: "Both",
    cat1: 1.30, cat2: 2.40, cat3: 4.80, cat4: 7.20,
    notes: ""
  },

];

// Highway colour palette
const HIGHWAY_COLORS = {
  "A1":     "#1a6b3c",
  "A2":     "#1a4fa8",
  "A8":     "#b84c2e",
  "BRIDGE": "#8b2fc9",
  "A6":     "#c8a84b",
  "A7":     "#2e7d8b",
  "A25":    "#5e7a1a",
  "E65":    "#8b5e1a",
};

if (typeof module !== "undefined") module.exports = { TOLL_DATA, HIGHWAY_COLORS };
