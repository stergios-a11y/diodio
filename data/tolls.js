/**
 * DIODIO — Greek Toll Booth Dataset
 * Coordinates sourced from diodia.com.gr KMZ (49 verified points)
 * Prices updated January 2026.
 *
 * Each entry includes:
 *   name_gr  — Greek name as shown on road signs
 *   name_en  — English transliteration
 *
 * bypass_directions: keyed by "north"/"south"/"east"/"west"
 *   minutes  — extra travel time for that direction
 *   exit     — {lat,lng} where driver leaves the motorway
 *   entry    — {lat,lng} where driver rejoins
 *   via      — [{lat,lng},...] waypoints on the free parallel road
 */

const TOLL_DATA = [

  // ══════════════════════════════════════════════════════════
  // A1 / E75 · PATHE · Athens – Thessaloniki – Evzoni
  // ══════════════════════════════════════════════════════════

  {
    id: "a1_thiva",
    name_gr: "Διόδια Θήβας",
    name_en: "Thiva (Thebes)",
    highway: "A1", highway_name: "PATHE (A1/E75) · Nea Odos",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.3708752, lng: 23.2868636,
    cat1: 1.30, cat2: 2.40, cat3: 4.80, cat4: 7.20,
    notes: "North of Thiva / Thebes, gateway from Attica to central Greece.",
    bypass_directions: {
      south: { label: "Southbound (towards Athens)", minutes: 10,
        exit:  { lat: 38.419, lng: 23.221 }, entry: { lat: 38.318, lng: 23.318 },
        via: [{ lat: 38.419, lng: 23.221 },{ lat: 38.399, lng: 23.238 },{ lat: 38.374, lng: 23.256 },{ lat: 38.355, lng: 23.270 },{ lat: 38.330, lng: 23.290 },{ lat: 38.318, lng: 23.318 }] },
      north: { label: "Northbound (towards Thessaloniki)", minutes: 12,
        exit:  { lat: 38.318, lng: 23.318 }, entry: { lat: 38.419, lng: 23.221 },
        via: [{ lat: 38.318, lng: 23.318 },{ lat: 38.330, lng: 23.290 },{ lat: 38.355, lng: 23.270 },{ lat: 38.374, lng: 23.256 },{ lat: 38.399, lng: 23.238 },{ lat: 38.419, lng: 23.221 }] },
    },
  },
  {
    id: "a1_afidnes",
    name_gr: "Διόδια Αφιδνών",
    name_en: "Afidnes",
    highway: "A1", highway_name: "PATHE (A1/E75) · Nea Odos",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.1764690, lng: 23.8546228,
    cat1: 1.00, cat2: 1.90, cat3: 3.80, cat4: 5.70,
    notes: "Northern Attica, old national road via Afidnes village.",
    bypass_directions: {
      south: { label: "Southbound (towards Athens)", minutes: 9,
        exit:  { lat: 38.210, lng: 23.840 }, entry: { lat: 38.140, lng: 23.870 },
        via: [{ lat: 38.210, lng: 23.840 },{ lat: 38.195, lng: 23.847 },{ lat: 38.177, lng: 23.854 },{ lat: 38.158, lng: 23.862 },{ lat: 38.140, lng: 23.870 }] },
      north: { label: "Northbound (towards Thessaloniki)", minutes: 10,
        exit:  { lat: 38.140, lng: 23.870 }, entry: { lat: 38.210, lng: 23.840 },
        via: [{ lat: 38.140, lng: 23.870 },{ lat: 38.158, lng: 23.862 },{ lat: 38.177, lng: 23.854 },{ lat: 38.195, lng: 23.847 },{ lat: 38.210, lng: 23.840 }] },
    },
  },
  {
    id: "a1_agios_konstantinos",
    name_gr: "Διόδια Αγίας Τριάδας",
    name_en: "Agios Konstantinos (Agia Triada)",
    highway: "A1", highway_name: "PATHE (A1/E75) · Nea Odos",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.8087016, lng: 22.6025569,
    cat1: 1.40, cat2: 2.60, cat3: 5.20, cat4: 7.80,
    notes: "Near ferry port for Sporades (Skiathos, Skopelos, Alonissos).",
    bypass_directions: {
      south: { label: "Southbound (towards Athens)", minutes: 14,
        exit:  { lat: 38.848, lng: 22.558 }, entry: { lat: 38.770, lng: 22.650 },
        via: [{ lat: 38.848, lng: 22.558 },{ lat: 38.828, lng: 22.577 },{ lat: 38.810, lng: 22.594 },{ lat: 38.790, lng: 22.621 },{ lat: 38.770, lng: 22.650 }] },
      north: { label: "Northbound (towards Thessaloniki)", minutes: 15,
        exit:  { lat: 38.770, lng: 22.650 }, entry: { lat: 38.848, lng: 22.558 },
        via: [{ lat: 38.770, lng: 22.650 },{ lat: 38.790, lng: 22.621 },{ lat: 38.810, lng: 22.594 },{ lat: 38.828, lng: 22.577 },{ lat: 38.848, lng: 22.558 }] },
    },
  },
  {
    id: "a1_mavromantila",
    name_gr: "Διόδια Μαυρομαντήλας",
    name_en: "Mavromantila",
    highway: "A1", highway_name: "PATHE (A1/E75) · Nea Odos",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.9238268, lng: 22.6291966,
    cat1: 1.20, cat2: 2.30, cat3: 4.60, cat4: 6.90,
    notes: "Zone boundary station near Kamena Vourla.",
    bypass_directions: {
      south: { label: "Southbound (towards Athens)", minutes: 11,
        exit:  { lat: 38.955, lng: 22.608 }, entry: { lat: 38.893, lng: 22.652 },
        via: [{ lat: 38.955, lng: 22.608 },{ lat: 38.940, lng: 22.618 },{ lat: 38.924, lng: 22.630 },{ lat: 38.908, lng: 22.641 },{ lat: 38.893, lng: 22.652 }] },
      north: { label: "Northbound (towards Thessaloniki)", minutes: 12,
        exit:  { lat: 38.893, lng: 22.652 }, entry: { lat: 38.955, lng: 22.608 },
        via: [{ lat: 38.893, lng: 22.652 },{ lat: 38.908, lng: 22.641 },{ lat: 38.924, lng: 22.630 },{ lat: 38.940, lng: 22.618 },{ lat: 38.955, lng: 22.608 }] },
    },
  },
  {
    id: "a1_traganas",
    name_gr: "Διόδια Τραγάνας",
    name_en: "Traganas (Kamena Vourla area)",
    highway: "A1", highway_name: "PATHE (A1/E75) · Nea Odos",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.6174740, lng: 23.1434298,
    cat1: 1.20, cat2: 2.30, cat3: 4.60, cat4: 6.90,
    notes: "Between Thiva and Kamena Vourla, near Tragana village.",
    bypass_directions: {
      south: { label: "Southbound (towards Athens)", minutes: 13,
        exit:  { lat: 38.645, lng: 23.120 }, entry: { lat: 38.592, lng: 23.165 },
        via: [{ lat: 38.645, lng: 23.120 },{ lat: 38.630, lng: 23.132 },{ lat: 38.617, lng: 23.143 },{ lat: 38.604, lng: 23.154 },{ lat: 38.592, lng: 23.165 }] },
      north: { label: "Northbound (towards Thessaloniki)", minutes: 14,
        exit:  { lat: 38.592, lng: 23.165 }, entry: { lat: 38.645, lng: 23.120 },
        via: [{ lat: 38.592, lng: 23.165 },{ lat: 38.604, lng: 23.154 },{ lat: 38.617, lng: 23.143 },{ lat: 38.630, lng: 23.132 },{ lat: 38.645, lng: 23.120 }] },
    },
  },
  {
    id: "a1_lianokladi",
    name_gr: "Διόδια Λιανοκλαδίου",
    name_en: "Lianokladi",
    highway: "A1", highway_name: "PATHE (A1/E75) · Kentriki Odos",
    operator: "Kentriki Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.9148821, lng: 22.3487648,
    cat1: 1.20, cat2: 2.30, cat3: 4.60, cat4: 6.90,
    notes: "Near Lamia. Junction with E65 Central Greece motorway.",
    bypass_directions: {
      south: { label: "Southbound (towards Athens)", minutes: 16,
        exit:  { lat: 38.950, lng: 22.318 }, entry: { lat: 38.880, lng: 22.380 },
        via: [{ lat: 38.950, lng: 22.318 },{ lat: 38.935, lng: 22.330 },{ lat: 38.920, lng: 22.342 },{ lat: 38.905, lng: 22.355 },{ lat: 38.880, lng: 22.380 }] },
      north: { label: "Northbound (towards Thessaloniki)", minutes: 18,
        exit:  { lat: 38.880, lng: 22.380 }, entry: { lat: 38.950, lng: 22.318 },
        via: [{ lat: 38.880, lng: 22.380 },{ lat: 38.905, lng: 22.355 },{ lat: 38.920, lng: 22.342 },{ lat: 38.935, lng: 22.330 },{ lat: 38.950, lng: 22.318 }] },
    },
  },
  {
    id: "a1_pelasgia",
    name_gr: "Διόδια Πελασγιάς",
    name_en: "Pelasgia",
    highway: "A1", highway_name: "PATHE (A1/E75) · Kentriki Odos",
    operator: "Kentriki Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.9203273, lng: 22.8462812,
    cat1: 1.90, cat2: 3.70, cat3: 7.40, cat4: 11.10,
    notes: "Highest-priced station on Kentriki Odos section.",
    bypass_directions: {
      south: { label: "Southbound (towards Athens)", minutes: 18,
        exit:  { lat: 38.958, lng: 22.815 }, entry: { lat: 38.882, lng: 22.878 },
        via: [{ lat: 38.958, lng: 22.815 },{ lat: 38.943, lng: 22.827 },{ lat: 38.928, lng: 22.839 },{ lat: 38.912, lng: 22.851 },{ lat: 38.895, lng: 22.864 },{ lat: 38.882, lng: 22.878 }] },
      north: { label: "Northbound (towards Thessaloniki)", minutes: 20,
        exit:  { lat: 38.882, lng: 22.878 }, entry: { lat: 38.958, lng: 22.815 },
        via: [{ lat: 38.882, lng: 22.878 },{ lat: 38.895, lng: 22.864 },{ lat: 38.912, lng: 22.851 },{ lat: 38.928, lng: 22.839 },{ lat: 38.943, lng: 22.827 },{ lat: 38.958, lng: 22.815 }] },
    },
  },
  {
    id: "a1_moschochori",
    name_gr: "Διόδια Μοσχοχωρίου",
    name_en: "Moschochori / Kileler",
    highway: "A1", highway_name: "PATHE (A1/E75) · Kentriki Odos",
    operator: "Kentriki Odos",
    type: "exit", direction_label: "Exit — towards Volos / Larissa east",
    lat: 39.5227965, lng: 22.5567985,
    cat1: 1.30, cat2: 2.60, cat3: 5.20, cat4: 7.80,
    notes: "Lateral exit ramp towards Volos and eastern Larissa.",
    bypass_directions: null,
  },
  {
    id: "a1_makrychori",
    name_gr: "Διόδια Μακρυχωρίου",
    name_en: "Makrychori / Larissa",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal", direction_label: "Both directions",
    lat: 39.8044068, lng: 22.5028431,
    cat1: 0.85, cat2: 1.60, cat3: 3.20, cat4: 4.80,
    notes: "Entry to Aegean Motorway concession north of Larissa.",
    bypass_directions: {
      south: { label: "Southbound (towards Athens)", minutes: 13,
        exit:  { lat: 39.840, lng: 22.488 }, entry: { lat: 39.769, lng: 22.520 },
        via: [{ lat: 39.840, lng: 22.488 },{ lat: 39.822, lng: 22.496 },{ lat: 39.804, lng: 22.504 },{ lat: 39.786, lng: 22.512 },{ lat: 39.769, lng: 22.520 }] },
      north: { label: "Northbound (towards Thessaloniki)", minutes: 15,
        exit:  { lat: 39.769, lng: 22.520 }, entry: { lat: 39.840, lng: 22.488 },
        via: [{ lat: 39.769, lng: 22.520 },{ lat: 39.786, lng: 22.512 },{ lat: 39.804, lng: 22.504 },{ lat: 39.822, lng: 22.496 },{ lat: 39.840, lng: 22.488 }] },
    },
  },
  {
    id: "a1_leptokarya",
    name_gr: "Διόδια Λεπτοκαρυάς",
    name_en: "Leptokarya",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal", direction_label: "Both directions",
    lat: 40.0357339, lng: 22.5698233,
    cat1: 4.30, cat2: 8.60, cat3: 17.20, cat4: 25.80,
    notes: "Highest toll on Aegean Motorway — covers Tempi Valley tunnel. Old road via Stomio coastal village.",
    bypass_directions: {
      south: { label: "Southbound (towards Athens)", minutes: 30,
        exit:  { lat: 40.080, lng: 22.549 }, entry: { lat: 39.988, lng: 22.590 },
        via: [{ lat: 40.080, lng: 22.549 },{ lat: 40.065, lng: 22.551 },{ lat: 40.050, lng: 22.553 },{ lat: 40.035, lng: 22.558 },{ lat: 40.020, lng: 22.564 },{ lat: 40.008, lng: 22.573 },{ lat: 39.998, lng: 22.582 },{ lat: 39.988, lng: 22.590 }] },
      north: { label: "Northbound (towards Thessaloniki)", minutes: 35,
        exit:  { lat: 39.988, lng: 22.590 }, entry: { lat: 40.080, lng: 22.549 },
        via: [{ lat: 39.988, lng: 22.590 },{ lat: 39.998, lng: 22.582 },{ lat: 40.008, lng: 22.573 },{ lat: 40.020, lng: 22.564 },{ lat: 40.035, lng: 22.558 },{ lat: 40.050, lng: 22.553 },{ lat: 40.065, lng: 22.551 },{ lat: 40.080, lng: 22.549 }] },
    },
  },
  {
    id: "a1_kleidi",
    name_gr: "Διόδια Κλειδίου (Αιγίνιο)",
    name_en: "Kleidi / Aeginio",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "exit", direction_label: "Exit — towards Aeginio / Pieria coast",
    lat: 40.5195819, lng: 22.5726664,
    cat1: 0.85, cat2: 1.70, cat3: 3.40, cat4: 5.10,
    notes: "Lateral exit ramp towards Aeginio and Pieria coast.",
    bypass_directions: null,
  },
  {
    id: "a1_malgara",
    name_gr: "Διόδια Μαλγάρων",
    name_en: "Malgara",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal", direction_label: "Both directions",
    lat: 40.6024027, lng: 22.6982903,
    cat1: 0.58, cat2: 1.15, cat3: 2.30, cat4: 3.45,
    notes: "Thessaloniki ring junction. Connects to Egnatia Odos westbound.",
    bypass_directions: {
      south: { label: "Southbound (towards Athens)", minutes: 9,
        exit:  { lat: 40.637, lng: 22.682 }, entry: { lat: 40.568, lng: 22.716 },
        via: [{ lat: 40.637, lng: 22.682 },{ lat: 40.619, lng: 22.690 },{ lat: 40.602, lng: 22.699 },{ lat: 40.584, lng: 22.707 },{ lat: 40.568, lng: 22.716 }] },
      north: { label: "Northbound (towards Thessaloniki)", minutes: 10,
        exit:  { lat: 40.568, lng: 22.716 }, entry: { lat: 40.637, lng: 22.682 },
        via: [{ lat: 40.568, lng: 22.716 },{ lat: 40.584, lng: 22.707 },{ lat: 40.602, lng: 22.699 },{ lat: 40.619, lng: 22.690 },{ lat: 40.637, lng: 22.682 }] },
    },
  },
  {
    id: "a1_analipsi",
    name_gr: "Διόδια Ανάληψης",
    name_en: "Analipsi",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal", direction_label: "Both directions",
    lat: 40.7068438, lng: 23.1914413,
    cat1: 1.18, cat2: 2.35, cat3: 4.70, cat4: 7.05,
    notes: "North of Thessaloniki towards Kavala / Halkidiki junction.",
    bypass_directions: {
      south: { label: "Southbound (towards Thessaloniki)", minutes: 16,
        exit:  { lat: 40.742, lng: 23.173 }, entry: { lat: 40.672, lng: 23.210 },
        via: [{ lat: 40.742, lng: 23.173 },{ lat: 40.724, lng: 23.182 },{ lat: 40.707, lng: 23.192 },{ lat: 40.689, lng: 23.201 },{ lat: 40.672, lng: 23.210 }] },
      north: { label: "Northbound (towards Kavala)", minutes: 18,
        exit:  { lat: 40.672, lng: 23.210 }, entry: { lat: 40.742, lng: 23.173 },
        via: [{ lat: 40.672, lng: 23.210 },{ lat: 40.689, lng: 23.201 },{ lat: 40.707, lng: 23.192 },{ lat: 40.724, lng: 23.182 },{ lat: 40.742, lng: 23.173 }] },
    },
  },
  {
    id: "a1_asprovalta",
    name_gr: "Διόδια Ασπροβάλτας",
    name_en: "Asprovalta",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal", direction_label: "Both directions",
    lat: 40.7269335, lng: 23.6936209,
    cat1: 0.70, cat2: 1.40, cat3: 2.80, cat4: 4.20,
    notes: "Popular summer exit for Asprovalta beach.",
    bypass_directions: {
      south: { label: "Southbound (towards Thessaloniki)", minutes: 11,
        exit:  { lat: 40.754, lng: 23.678 }, entry: { lat: 40.700, lng: 23.710 },
        via: [{ lat: 40.754, lng: 23.678 },{ lat: 40.741, lng: 23.686 },{ lat: 40.727, lng: 23.694 },{ lat: 40.714, lng: 23.702 },{ lat: 40.700, lng: 23.710 }] },
      north: { label: "Northbound (towards Kavala)", minutes: 12,
        exit:  { lat: 40.700, lng: 23.710 }, entry: { lat: 40.754, lng: 23.678 },
        via: [{ lat: 40.700, lng: 23.710 },{ lat: 40.714, lng: 23.702 },{ lat: 40.727, lng: 23.694 },{ lat: 40.741, lng: 23.686 },{ lat: 40.754, lng: 23.678 }] },
    },
  },
  {
    id: "a1_moustheni",
    name_gr: "Διόδια Μουσθένης / Στρυμονικού",
    name_en: "Moustheni / Strymoniko",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal", direction_label: "Both directions",
    lat: 40.8582573, lng: 24.1623607,
    cat1: 1.33, cat2: 2.65, cat3: 5.30, cat4: 7.95,
    notes: "Between Kavala and Drama junctions.",
    bypass_directions: {
      south: { label: "Southbound (towards Thessaloniki)", minutes: 18,
        exit:  { lat: 40.892, lng: 24.143 }, entry: { lat: 40.825, lng: 24.182 },
        via: [{ lat: 40.892, lng: 24.143 },{ lat: 40.875, lng: 24.152 },{ lat: 40.858, lng: 24.162 },{ lat: 40.841, lng: 24.172 },{ lat: 40.825, lng: 24.182 }] },
      north: { label: "Northbound (towards Kavala)", minutes: 20,
        exit:  { lat: 40.825, lng: 24.182 }, entry: { lat: 40.892, lng: 24.143 },
        via: [{ lat: 40.825, lng: 24.182 },{ lat: 40.841, lng: 24.172 },{ lat: 40.858, lng: 24.162 },{ lat: 40.875, lng: 24.152 },{ lat: 40.892, lng: 24.143 }] },
    },
  },
  {
    id: "a1_evzoni",
    name_gr: "Διόδια Ευζώνων",
    name_en: "Evzoni (N. Macedonia Border)",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal", direction_label: "Southbound (entering Greece from N. Macedonia)",
    lat: 41.1081360, lng: 22.5590944,
    cat1: 1.48, cat2: 2.95, cat3: 5.90, cat4: 8.85,
    notes: "Greek–North Macedonian border. No practical bypass.",
    bypass_directions: null,
  },

  // ══════════════════════════════════════════════════════════
  // A2 / E90 · EGNATIA ODOS · Igoumenitsa – Kipoi
  // ══════════════════════════════════════════════════════════

  {
    id: "egnatia_igoumenitsa",
    name_gr: "Διόδια Τυριάς",
    name_en: "Tyria / Igoumenitsa",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 39.5403268, lng: 20.6743276,
    cat1: 1.00, cat2: 2.00, cat3: 4.00, cat4: 6.00,
    notes: "Western terminus of Egnatia. Departure from Igoumenitsa ferry.",
    bypass_directions: null,
  },
  {
    id: "egnatia_ioannina",
    name_gr: "Διόδια Παμβώτιδας",
    name_en: "Pamvotida / Ioannina",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 39.6188630, lng: 20.9475803,
    cat1: 1.10, cat2: 2.15, cat3: 4.30, cat4: 6.45,
    notes: "Ioannina bypass. Named after Pamvotida lake.",
    bypass_directions: {
      west: { label: "Westbound (towards Igoumenitsa)", minutes: 14,
        exit:  { lat: 39.650, lng: 20.928 }, entry: { lat: 39.588, lng: 20.968 },
        via: [{ lat: 39.650, lng: 20.928 },{ lat: 39.633, lng: 20.940 },{ lat: 39.615, lng: 20.950 },{ lat: 39.600, lng: 20.960 },{ lat: 39.588, lng: 20.968 }] },
      east: { label: "Eastbound (towards Thessaloniki)", minutes: 15,
        exit:  { lat: 39.588, lng: 20.968 }, entry: { lat: 39.650, lng: 20.928 },
        via: [{ lat: 39.588, lng: 20.968 },{ lat: 39.600, lng: 20.960 },{ lat: 39.615, lng: 20.950 },{ lat: 39.633, lng: 20.940 },{ lat: 39.650, lng: 20.928 }] },
    },
  },
  {
    id: "egnatia_metsovo",
    name_gr: "Διόδια Μαλακασίου",
    name_en: "Malakasi / Metsovo Tunnel",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 39.7855212, lng: 21.2854099,
    cat1: 1.40, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Mountain tunnel through Pindus range. Old road via Metsovo village is scenic but very slow.",
    bypass_directions: {
      west: { label: "Westbound (towards Ioannina)", minutes: 40,
        exit:  { lat: 39.823, lng: 21.261 }, entry: { lat: 39.748, lng: 21.310 },
        via: [{ lat: 39.823, lng: 21.261 },{ lat: 39.810, lng: 21.267 },{ lat: 39.795, lng: 21.274 },{ lat: 39.781, lng: 21.284 },{ lat: 39.769, lng: 21.296 },{ lat: 39.757, lng: 21.304 },{ lat: 39.748, lng: 21.310 }] },
      east: { label: "Eastbound (towards Thessaloniki)", minutes: 45,
        exit:  { lat: 39.748, lng: 21.310 }, entry: { lat: 39.823, lng: 21.261 },
        via: [{ lat: 39.748, lng: 21.310 },{ lat: 39.757, lng: 21.304 },{ lat: 39.769, lng: 21.296 },{ lat: 39.781, lng: 21.284 },{ lat: 39.795, lng: 21.274 },{ lat: 39.810, lng: 21.267 },{ lat: 39.823, lng: 21.261 }] },
    },
  },
  {
    id: "egnatia_kozani",
    name_gr: "Διόδια Σιάτιστας",
    name_en: "Siatista / Kozani",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 40.2378869, lng: 21.5810286,
    cat1: 0.90, cat2: 1.80, cat3: 3.60, cat4: 5.40,
    notes: "",
    bypass_directions: {
      west: { label: "Westbound (towards Ioannina)", minutes: 18,
        exit:  { lat: 40.271, lng: 21.561 }, entry: { lat: 40.205, lng: 21.601 },
        via: [{ lat: 40.271, lng: 21.561 },{ lat: 40.254, lng: 21.572 },{ lat: 40.237, lng: 21.582 },{ lat: 40.220, lng: 21.592 },{ lat: 40.205, lng: 21.601 }] },
      east: { label: "Eastbound (towards Thessaloniki)", minutes: 20,
        exit:  { lat: 40.205, lng: 21.601 }, entry: { lat: 40.271, lng: 21.561 },
        via: [{ lat: 40.205, lng: 21.601 },{ lat: 40.220, lng: 21.592 },{ lat: 40.237, lng: 21.582 },{ lat: 40.254, lng: 21.572 },{ lat: 40.271, lng: 21.561 }] },
    },
  },
  {
    id: "egnatia_ieropigi",
    name_gr: "Διόδια Ιεροπηγής",
    name_en: "Ieropigi",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 40.5665678, lng: 21.0665417,
    cat1: 0.80, cat2: 1.60, cat3: 3.20, cat4: 4.80,
    notes: "Western Macedonia section near Kastoria junction.",
    bypass_directions: {
      west: { label: "Westbound (towards Ioannina)", minutes: 22,
        exit:  { lat: 40.598, lng: 21.045 }, entry: { lat: 40.535, lng: 21.088 },
        via: [{ lat: 40.598, lng: 21.045 },{ lat: 40.582, lng: 21.056 },{ lat: 40.566, lng: 21.067 },{ lat: 40.550, lng: 21.078 },{ lat: 40.535, lng: 21.088 }] },
      east: { label: "Eastbound (towards Thessaloniki)", minutes: 25,
        exit:  { lat: 40.535, lng: 21.088 }, entry: { lat: 40.598, lng: 21.045 },
        via: [{ lat: 40.535, lng: 21.088 },{ lat: 40.550, lng: 21.078 },{ lat: 40.566, lng: 21.067 },{ lat: 40.582, lng: 21.056 },{ lat: 40.598, lng: 21.045 }] },
    },
  },
  {
    id: "egnatia_veroia",
    name_gr: "Διόδια Πολυμύλου",
    name_en: "Polymylo / Veroia",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 40.3671958, lng: 22.0602089,
    cat1: 0.80, cat2: 1.60, cat3: 3.20, cat4: 4.80,
    notes: "",
    bypass_directions: {
      west: { label: "Westbound (towards Kozani)", minutes: 16,
        exit:  { lat: 40.399, lng: 22.042 }, entry: { lat: 40.336, lng: 22.079 },
        via: [{ lat: 40.399, lng: 22.042 },{ lat: 40.383, lng: 22.051 },{ lat: 40.367, lng: 22.061 },{ lat: 40.350, lng: 22.071 },{ lat: 40.336, lng: 22.079 }] },
      east: { label: "Eastbound (towards Thessaloniki)", minutes: 18,
        exit:  { lat: 40.336, lng: 22.079 }, entry: { lat: 40.399, lng: 22.042 },
        via: [{ lat: 40.336, lng: 22.079 },{ lat: 40.350, lng: 22.071 },{ lat: 40.367, lng: 22.061 },{ lat: 40.383, lng: 22.051 },{ lat: 40.399, lng: 22.042 }] },
    },
  },
  {
    id: "egnatia_thessaloniki_west",
    name_gr: "Διόδια Θεσσαλονίκης-Ωραιοκάστρου",
    name_en: "Thessaloniki West (Oraiokastro)",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 40.6956111, lng: 22.9162091,
    cat1: 0.60, cat2: 1.20, cat3: 2.40, cat4: 3.60,
    notes: "Western Thessaloniki bypass.",
    bypass_directions: {
      west: { label: "Westbound (towards Veroia)", minutes: 18,
        exit:  { lat: 40.726, lng: 22.900 }, entry: { lat: 40.666, lng: 22.933 },
        via: [{ lat: 40.726, lng: 22.900 },{ lat: 40.710, lng: 22.908 },{ lat: 40.695, lng: 22.917 },{ lat: 40.680, lng: 22.925 },{ lat: 40.666, lng: 22.933 }] },
      east: { label: "Eastbound (towards Kavala)", minutes: 20,
        exit:  { lat: 40.666, lng: 22.933 }, entry: { lat: 40.726, lng: 22.900 },
        via: [{ lat: 40.666, lng: 22.933 },{ lat: 40.680, lng: 22.925 },{ lat: 40.695, lng: 22.917 },{ lat: 40.710, lng: 22.908 },{ lat: 40.726, lng: 22.900 }] },
    },
  },
  {
    id: "egnatia_strymoniko",
    name_gr: "Διόδια Στρυμονικού",
    name_en: "Strymoniko",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 41.0435183, lng: 23.2952374,
    cat1: 0.90, cat2: 1.80, cat3: 3.60, cat4: 5.40,
    notes: "Between Thessaloniki and Kavala.",
    bypass_directions: {
      west: { label: "Westbound (towards Thessaloniki)", minutes: 18,
        exit:  { lat: 41.074, lng: 23.278 }, entry: { lat: 41.013, lng: 23.313 },
        via: [{ lat: 41.074, lng: 23.278 },{ lat: 41.058, lng: 23.287 },{ lat: 41.043, lng: 23.296 },{ lat: 41.027, lng: 23.305 },{ lat: 41.013, lng: 23.313 }] },
      east: { label: "Eastbound (towards Kavala)", minutes: 20,
        exit:  { lat: 41.013, lng: 23.313 }, entry: { lat: 41.074, lng: 23.278 },
        via: [{ lat: 41.013, lng: 23.313 },{ lat: 41.027, lng: 23.305 },{ lat: 41.043, lng: 23.296 },{ lat: 41.058, lng: 23.287 },{ lat: 41.074, lng: 23.278 }] },
    },
  },
  {
    id: "egnatia_xanthi",
    name_gr: "Διόδια Ιάσμου",
    name_en: "Iasmos / Xanthi",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 41.1203415, lng: 25.0802422,
    cat1: 0.85, cat2: 1.70, cat3: 3.40, cat4: 5.10,
    notes: "",
    bypass_directions: {
      west: { label: "Westbound (towards Kavala)", minutes: 16,
        exit:  { lat: 41.150, lng: 25.063 }, entry: { lat: 41.091, lng: 25.098 },
        via: [{ lat: 41.150, lng: 25.063 },{ lat: 41.135, lng: 25.072 },{ lat: 41.120, lng: 25.081 },{ lat: 41.105, lng: 25.090 },{ lat: 41.091, lng: 25.098 }] },
      east: { label: "Eastbound (towards Komotini)", minutes: 18,
        exit:  { lat: 41.091, lng: 25.098 }, entry: { lat: 41.150, lng: 25.063 },
        via: [{ lat: 41.091, lng: 25.098 },{ lat: 41.105, lng: 25.090 },{ lat: 41.120, lng: 25.081 },{ lat: 41.135, lng: 25.072 },{ lat: 41.150, lng: 25.063 }] },
    },
  },
  {
    id: "egnatia_komotini",
    name_gr: "Διόδια Μέστης",
    name_en: "Mestis / Komotini",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 41.0135240, lng: 25.5332019,
    cat1: 0.85, cat2: 1.70, cat3: 3.40, cat4: 5.10,
    notes: "",
    bypass_directions: {
      west: { label: "Westbound (towards Xanthi)", minutes: 13,
        exit:  { lat: 41.044, lng: 25.516 }, entry: { lat: 40.984, lng: 25.551 },
        via: [{ lat: 41.044, lng: 25.516 },{ lat: 41.029, lng: 25.525 },{ lat: 41.013, lng: 25.534 },{ lat: 40.998, lng: 25.543 },{ lat: 40.984, lng: 25.551 }] },
      east: { label: "Eastbound (towards Alexandroupoli)", minutes: 15,
        exit:  { lat: 40.984, lng: 25.551 }, entry: { lat: 41.044, lng: 25.516 },
        via: [{ lat: 40.984, lng: 25.551 },{ lat: 40.998, lng: 25.543 },{ lat: 41.013, lng: 25.534 },{ lat: 41.029, lng: 25.525 },{ lat: 41.044, lng: 25.516 }] },
    },
  },
  {
    id: "egnatia_alexandroupoli",
    name_gr: "Διόδια Αρδανίου",
    name_en: "Ardanio / Alexandroupoli",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 40.9441053, lng: 26.2045028,
    cat1: 0.80, cat2: 1.60, cat3: 3.20, cat4: 4.80,
    notes: "Near Turkish border.",
    bypass_directions: {
      west: { label: "Westbound (towards Komotini)", minutes: 13,
        exit:  { lat: 40.974, lng: 26.187 }, entry: { lat: 40.915, lng: 26.222 },
        via: [{ lat: 40.974, lng: 26.187 },{ lat: 40.959, lng: 26.196 },{ lat: 40.944, lng: 26.205 },{ lat: 40.929, lng: 26.214 },{ lat: 40.915, lng: 26.222 }] },
      east: { label: "Eastbound (towards Turkish border)", minutes: 15,
        exit:  { lat: 40.915, lng: 26.222 }, entry: { lat: 40.974, lng: 26.187 },
        via: [{ lat: 40.915, lng: 26.222 },{ lat: 40.929, lng: 26.214 },{ lat: 40.944, lng: 26.205 },{ lat: 40.959, lng: 26.196 },{ lat: 40.974, lng: 26.187 }] },
    },
  },
  {
    id: "egnatia_promahonas",
    name_gr: "Διόδια Προμαχώνα",
    name_en: "Promahonas (Bulgarian Border)",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "entry", direction_label: "Westbound (entering Greece from Bulgaria)",
    lat: 41.3641919, lng: 23.3567727,
    cat1: 1.18, cat2: 2.35, cat3: 4.70, cat4: 7.05,
    notes: "Greek–Bulgarian border spur.",
    bypass_directions: null,
  },

  // ══════════════════════════════════════════════════════════
  // A5 · IONIA ODOS · Antirrio – Ioannina
  // ══════════════════════════════════════════════════════════

  {
    id: "ionia_klokova",
    name_gr: "Διόδια Κλόκοβας",
    name_en: "Klokova",
    highway: "A5", highway_name: "Ionia Odos (A5)",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.3592412, lng: 21.6565418,
    cat1: 1.20, cat2: 2.40, cat3: 4.80, cat4: 7.20,
    notes: "Zone 1 frontal (Antirrio – Chaliki).",
    bypass_directions: {
      south: { label: "Southbound (towards Antirrio)", minutes: 18,
        exit:  { lat: 38.389, lng: 21.641 }, entry: { lat: 38.330, lng: 21.673 },
        via: [{ lat: 38.389, lng: 21.641 },{ lat: 38.375, lng: 21.649 },{ lat: 38.360, lng: 21.657 },{ lat: 38.345, lng: 21.665 },{ lat: 38.330, lng: 21.673 }] },
      north: { label: "Northbound (towards Ioannina)", minutes: 20,
        exit:  { lat: 38.330, lng: 21.673 }, entry: { lat: 38.389, lng: 21.641 },
        via: [{ lat: 38.330, lng: 21.673 },{ lat: 38.345, lng: 21.665 },{ lat: 38.360, lng: 21.657 },{ lat: 38.375, lng: 21.649 },{ lat: 38.389, lng: 21.641 }] },
    },
  },
  {
    id: "ionia_aggelokastro",
    name_gr: "Διόδια Αγγελοκάστρου",
    name_en: "Aggelokastro",
    highway: "A5", highway_name: "Ionia Odos (A5)",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.5494744, lng: 21.2723798,
    cat1: 1.40, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Zone 2 (Chaliki – Amfilochia).",
    bypass_directions: {
      south: { label: "Southbound (towards Antirrio)", minutes: 20,
        exit:  { lat: 38.580, lng: 21.255 }, entry: { lat: 38.519, lng: 21.290 },
        via: [{ lat: 38.580, lng: 21.255 },{ lat: 38.564, lng: 21.264 },{ lat: 38.549, lng: 21.273 },{ lat: 38.534, lng: 21.282 },{ lat: 38.519, lng: 21.290 }] },
      north: { label: "Northbound (towards Ioannina)", minutes: 22,
        exit:  { lat: 38.519, lng: 21.290 }, entry: { lat: 38.580, lng: 21.255 },
        via: [{ lat: 38.519, lng: 21.290 },{ lat: 38.534, lng: 21.282 },{ lat: 38.549, lng: 21.273 },{ lat: 38.564, lng: 21.264 },{ lat: 38.580, lng: 21.255 }] },
    },
  },
  {
    id: "ionia_menidi",
    name_gr: "Διόδια Μενιδίου",
    name_en: "Menidi",
    highway: "A5", highway_name: "Ionia Odos (A5)",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.9898946, lng: 21.1709225,
    cat1: 1.63, cat2: 3.25, cat3: 6.50, cat4: 9.75,
    notes: "Large station on Arta–Ioannina section.",
    bypass_directions: {
      south: { label: "Southbound (towards Arta)", minutes: 22,
        exit:  { lat: 39.021, lng: 21.154 }, entry: { lat: 38.960, lng: 21.188 },
        via: [{ lat: 39.021, lng: 21.154 },{ lat: 39.005, lng: 21.163 },{ lat: 38.990, lng: 21.172 },{ lat: 38.975, lng: 21.180 },{ lat: 38.960, lng: 21.188 }] },
      north: { label: "Northbound (towards Ioannina)", minutes: 25,
        exit:  { lat: 38.960, lng: 21.188 }, entry: { lat: 39.021, lng: 21.154 },
        via: [{ lat: 38.960, lng: 21.188 },{ lat: 38.975, lng: 21.180 },{ lat: 38.990, lng: 21.172 },{ lat: 39.005, lng: 21.163 },{ lat: 39.021, lng: 21.154 }] },
    },
  },
  {
    id: "ionia_terovos",
    name_gr: "Διόδια Τέροβου",
    name_en: "Terovos / Arta",
    highway: "A5", highway_name: "Ionia Odos (A5)",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 39.4252460, lng: 20.9053087,
    cat1: 1.40, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Near Arta. Zone 4 frontal station.",
    bypass_directions: {
      south: { label: "Southbound (towards Antirrio)", minutes: 18,
        exit:  { lat: 39.455, lng: 20.889 }, entry: { lat: 39.396, lng: 20.922 },
        via: [{ lat: 39.455, lng: 20.889 },{ lat: 39.440, lng: 20.897 },{ lat: 39.425, lng: 20.906 },{ lat: 39.410, lng: 20.915 },{ lat: 39.396, lng: 20.922 }] },
      north: { label: "Northbound (towards Ioannina)", minutes: 20,
        exit:  { lat: 39.396, lng: 20.922 }, entry: { lat: 39.455, lng: 20.889 },
        via: [{ lat: 39.396, lng: 20.922 },{ lat: 39.410, lng: 20.915 },{ lat: 39.425, lng: 20.906 },{ lat: 39.440, lng: 20.897 },{ lat: 39.455, lng: 20.889 }] },
    },
  },

  // ══════════════════════════════════════════════════════════
  // A8 / E94 · OLYMPIA ODOS · Athens – Patras
  // ══════════════════════════════════════════════════════════

  {
    id: "olympia_elefsina",
    name_gr: "Διόδια Ελευσίνας",
    name_en: "Elefsina",
    highway: "A8", highway_name: "Olympia Odos (A8/E94)",
    operator: "Olympia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.0422442, lng: 23.4958076,
    cat1: 0.95, cat2: 1.90, cat3: 3.80, cat4: 5.70,
    notes: "Western Athens gateway. Junction with A6 Attiki Odos.",
    bypass_directions: {
      east: { label: "Eastbound (towards Athens)", minutes: 22,
        exit:  { lat: 38.073, lng: 23.474 }, entry: { lat: 38.012, lng: 23.518 },
        via: [{ lat: 38.073, lng: 23.474 },{ lat: 38.058, lng: 23.484 },{ lat: 38.043, lng: 23.494 },{ lat: 38.028, lng: 23.506 },{ lat: 38.012, lng: 23.518 }] },
      west: { label: "Westbound (towards Patras)", minutes: 25,
        exit:  { lat: 38.012, lng: 23.518 }, entry: { lat: 38.073, lng: 23.474 },
        via: [{ lat: 38.012, lng: 23.518 },{ lat: 38.028, lng: 23.506 },{ lat: 38.043, lng: 23.494 },{ lat: 38.058, lng: 23.484 },{ lat: 38.073, lng: 23.474 }] },
    },
  },
  {
    id: "olympia_isthmos",
    name_gr: "Διόδια Ζευγολατίου",
    name_en: "Zevgolatio",
    highway: "A8", highway_name: "Olympia Odos (A8/E94)",
    operator: "Olympia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 37.9222552, lng: 22.8096664,
    cat1: 1.40, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Near Corinth, on approach to the isthmus. Old road via Corinth city.",
    bypass_directions: {
      east: { label: "Eastbound (towards Athens)", minutes: 13,
        exit:  { lat: 37.952, lng: 22.792 }, entry: { lat: 37.893, lng: 22.828 },
        via: [{ lat: 37.952, lng: 22.792 },{ lat: 37.937, lng: 22.801 },{ lat: 37.922, lng: 22.811 },{ lat: 37.907, lng: 22.820 },{ lat: 37.893, lng: 22.828 }] },
      west: { label: "Westbound (towards Patras)", minutes: 15,
        exit:  { lat: 37.893, lng: 22.828 }, entry: { lat: 37.952, lng: 22.792 },
        via: [{ lat: 37.893, lng: 22.828 },{ lat: 37.907, lng: 22.820 },{ lat: 37.922, lng: 22.811 },{ lat: 37.937, lng: 22.801 },{ lat: 37.952, lng: 22.792 }] },
    },
  },
  {
    id: "olympia_isthmos_canal",
    name_gr: "Διόδια Ισθμού",
    name_en: "Isthmos (Corinth Canal)",
    highway: "A8", highway_name: "Olympia Odos (A8/E94)",
    operator: "Olympia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 37.9249719, lng: 23.0325365,
    cat1: 1.40, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "At the Corinth Canal. Iconic crossing point into the Peloponnese.",
    bypass_directions: {
      east: { label: "Eastbound (towards Athens)", minutes: 12,
        exit:  { lat: 37.945, lng: 23.015 }, entry: { lat: 37.908, lng: 23.050 },
        via: [{ lat: 37.945, lng: 23.015 },{ lat: 37.933, lng: 23.025 },{ lat: 37.925, lng: 23.033 },{ lat: 37.916, lng: 23.041 },{ lat: 37.908, lng: 23.050 }] },
      west: { label: "Westbound (towards Patras/Peloponnese)", minutes: 13,
        exit:  { lat: 37.908, lng: 23.050 }, entry: { lat: 37.945, lng: 23.015 },
        via: [{ lat: 37.908, lng: 23.050 },{ lat: 37.916, lng: 23.041 },{ lat: 37.925, lng: 23.033 },{ lat: 37.933, lng: 23.025 },{ lat: 37.945, lng: 23.015 }] },
    },
  },
  {
    id: "olympia_aigio",
    name_gr: "Διόδια Ελαιώνα",
    name_en: "Elaionas / Aigio",
    highway: "A8", highway_name: "Olympia Odos (A8/E94)",
    operator: "Olympia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.2057293, lng: 22.1392536,
    cat1: 1.20, cat2: 2.40, cat3: 4.80, cat4: 7.20,
    notes: "Halfway Athens–Patras. Views of Gulf of Corinth. Old coastal road available.",
    bypass_directions: {
      east: { label: "Eastbound (towards Athens)", minutes: 18,
        exit:  { lat: 38.236, lng: 22.121 }, entry: { lat: 38.176, lng: 22.158 },
        via: [{ lat: 38.236, lng: 22.121 },{ lat: 38.220, lng: 22.130 },{ lat: 38.205, lng: 22.140 },{ lat: 38.190, lng: 22.150 },{ lat: 38.176, lng: 22.158 }] },
      west: { label: "Westbound (towards Patras)", minutes: 20,
        exit:  { lat: 38.176, lng: 22.158 }, entry: { lat: 38.236, lng: 22.121 },
        via: [{ lat: 38.176, lng: 22.158 },{ lat: 38.190, lng: 22.150 },{ lat: 38.205, lng: 22.140 },{ lat: 38.220, lng: 22.130 },{ lat: 38.236, lng: 22.121 }] },
    },
  },
  {
    id: "olympia_patras",
    name_gr: "Διόδια Πάτρας",
    name_en: "Patras",
    highway: "A8", highway_name: "Olympia Odos (A8/E94)",
    operator: "Olympia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.1449493, lng: 21.6191570,
    cat1: 0.95, cat2: 1.90, cat3: 3.80, cat4: 5.70,
    notes: "Eastern approach to Patras. Junction with A7 Moreas and A5 Ionia Odos.",
    bypass_directions: {
      east: { label: "Eastbound (towards Athens)", minutes: 13,
        exit:  { lat: 38.175, lng: 21.602 }, entry: { lat: 38.116, lng: 21.637 },
        via: [{ lat: 38.175, lng: 21.602 },{ lat: 38.159, lng: 21.611 },{ lat: 38.144, lng: 21.620 },{ lat: 38.130, lng: 21.629 },{ lat: 38.116, lng: 21.637 }] },
      west: { label: "Westbound (towards Rio/Patras)", minutes: 15,
        exit:  { lat: 38.116, lng: 21.637 }, entry: { lat: 38.175, lng: 21.602 },
        via: [{ lat: 38.116, lng: 21.637 },{ lat: 38.130, lng: 21.629 },{ lat: 38.144, lng: 21.620 },{ lat: 38.159, lng: 21.611 },{ lat: 38.175, lng: 21.602 }] },
    },
  },
  {
    id: "olympia_rio",
    name_gr: "Διόδια Ρίου",
    name_en: "Rio",
    highway: "A8", highway_name: "Olympia Odos (A8/E94)",
    operator: "Olympia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.3164492, lng: 21.8300325,
    cat1: 0.95, cat2: 1.90, cat3: 3.80, cat4: 5.70,
    notes: "Near Rio ferry landing and bridge approach.",
    bypass_directions: {
      east: { label: "Eastbound (towards Aigio)", minutes: 12,
        exit:  { lat: 38.335, lng: 21.818 }, entry: { lat: 38.298, lng: 21.842 },
        via: [{ lat: 38.335, lng: 21.818 },{ lat: 38.323, lng: 21.826 },{ lat: 38.316, lng: 21.830 },{ lat: 38.307, lng: 21.836 },{ lat: 38.298, lng: 21.842 }] },
      west: { label: "Westbound (towards Rio/Bridge)", minutes: 12,
        exit:  { lat: 38.298, lng: 21.842 }, entry: { lat: 38.335, lng: 21.818 },
        via: [{ lat: 38.298, lng: 21.842 },{ lat: 38.307, lng: 21.836 },{ lat: 38.316, lng: 21.830 },{ lat: 38.323, lng: 21.826 },{ lat: 38.335, lng: 21.818 }] },
    },
  },
  {
    id: "olympia_pyrgos",
    name_gr: "Διόδια Πύργου",
    name_en: "Pyrgos",
    highway: "A8", highway_name: "Olympia Odos (A8/E94)",
    operator: "Olympia Odos",
    type: "exit", direction_label: "Exit — towards Pyrgos / Ancient Olympia",
    lat: 37.7525508, lng: 21.3585639,
    cat1: 0.95, cat2: 1.90, cat3: 3.80, cat4: 5.70,
    notes: "Exit for Pyrgos and Ancient Olympia archaeological site.",
    bypass_directions: null,
  },

  // ══════════════════════════════════════════════════════════
  // BRIDGES & TUNNELS
  // ══════════════════════════════════════════════════════════

  {
    id: "rioantirrio",
    name_gr: "Διόδια Γέφυρας Ρίου-Αντιρρίου",
    name_en: "Rio–Antirrio Bridge",
    highway: "BRIDGE", highway_name: "Rio–Antirrio Bridge (Gefyra SA)",
    operator: "Gefyra SA",
    type: "bridge", direction_label: "Westbound only. Eastbound is FREE.",
    lat: 38.3337794, lng: 21.7660189,
    cat1: 7.60, cat2: 15.50, cat3: 25.00, cat4: 35.00,
    notes: "World's longest multi-span cable-stayed bridge (2.88 km). Toll collected only westbound. Return is free.",
    bypass_directions: null,
  },
  {
    id: "aktio_preveza",
    name_gr: "Διόδια Σύραγγας Ακτίου",
    name_en: "Aktio–Preveza Tunnel",
    highway: "BRIDGE", highway_name: "Aktio–Preveza Underwater Tunnel",
    operator: "Egnatia Odos",
    type: "bridge", direction_label: "Both directions",
    lat: 38.9481954, lng: 20.7569504,
    cat1: 1.50, cat2: 3.00, cat3: 6.00, cat4: 9.00,
    notes: "Only underwater tunnel in Greece (910m). No bypass.",
    bypass_directions: null,
  },

  // ══════════════════════════════════════════════════════════
  // A6 · ATTIKI ODOS
  // ══════════════════════════════════════════════════════════

  {
    id: "attiki_main",
    name_gr: "Αττική Οδός",
    name_en: "Attiki Odos",
    highway: "A6", highway_name: "Attiki Odos (A6)",
    operator: "Attikes Diadromes",
    type: "entry", direction_label: "Pay once on entry — covers full traverse",
    lat: 38.0620135, lng: 23.7495232,
    cat1: 1.28, cat2: 2.55, cat3: 4.70, cat4: 7.00,
    notes: "Flat-rate toll paid once on entry. Urban motorway — bypass via city streets adds 35+ min.",
    bypass_directions: null,
  },

  // ══════════════════════════════════════════════════════════
  // A7 · MOREAS · Corinth – Tripoli – Kalamata
  // ══════════════════════════════════════════════════════════

  {
    id: "moreas_corinth",
    name_gr: "Διόδια Σπαθοβουνίου",
    name_en: "Spathvounio / Corinth",
    highway: "A7", highway_name: "Moreas (A7)",
    operator: "Moreas SA",
    type: "frontal", direction_label: "Both directions",
    lat: 37.8359076, lng: 22.8079391,
    cat1: 1.05, cat2: 2.10, cat3: 4.20, cat4: 6.30,
    notes: "Start of Moreas motorway south of Corinth.",
    bypass_directions: {
      north: { label: "Northbound (towards Athens/Corinth)", minutes: 13,
        exit:  { lat: 37.866, lng: 22.790 }, entry: { lat: 37.807, lng: 22.826 },
        via: [{ lat: 37.866, lng: 22.790 },{ lat: 37.850, lng: 22.800 },{ lat: 37.835, lng: 22.809 },{ lat: 37.820, lng: 22.818 },{ lat: 37.807, lng: 22.826 }] },
      south: { label: "Southbound (towards Tripoli)", minutes: 15,
        exit:  { lat: 37.807, lng: 22.826 }, entry: { lat: 37.866, lng: 22.790 },
        via: [{ lat: 37.807, lng: 22.826 },{ lat: 37.820, lng: 22.818 },{ lat: 37.835, lng: 22.809 },{ lat: 37.850, lng: 22.800 },{ lat: 37.866, lng: 22.790 }] },
    },
  },
  {
    id: "moreas_nestani",
    name_gr: "Διόδια Νεστάνης",
    name_en: "Nestani / Argos",
    highway: "A7", highway_name: "Moreas (A7)",
    operator: "Moreas SA",
    type: "frontal", direction_label: "Both directions",
    lat: 37.6007682, lng: 22.4464524,
    cat1: 1.20, cat2: 2.40, cat3: 4.80, cat4: 7.20,
    notes: "Near ancient Mycenae. Exit for Nafplio.",
    bypass_directions: {
      north: { label: "Northbound (towards Corinth)", minutes: 18,
        exit:  { lat: 37.631, lng: 22.429 }, entry: { lat: 37.571, lng: 22.464 },
        via: [{ lat: 37.631, lng: 22.429 },{ lat: 37.615, lng: 22.438 },{ lat: 37.600, lng: 22.447 },{ lat: 37.585, lng: 22.457 },{ lat: 37.571, lng: 22.464 }] },
      south: { label: "Southbound (towards Tripoli)", minutes: 20,
        exit:  { lat: 37.571, lng: 22.464 }, entry: { lat: 37.631, lng: 22.429 },
        via: [{ lat: 37.571, lng: 22.464 },{ lat: 37.585, lng: 22.457 },{ lat: 37.600, lng: 22.447 },{ lat: 37.615, lng: 22.438 },{ lat: 37.631, lng: 22.429 }] },
    },
  },
  {
    id: "moreas_petrina",
    name_gr: "Διόδια Πετρίνας",
    name_en: "Petrina / Tripoli",
    highway: "A7", highway_name: "Moreas (A7)",
    operator: "Moreas SA",
    type: "frontal", direction_label: "Both directions",
    lat: 37.2988500, lng: 22.2102678,
    cat1: 1.40, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Arcadian plateau. Junction for Sparta branch.",
    bypass_directions: {
      north: { label: "Northbound (towards Argos)", minutes: 22,
        exit:  { lat: 37.329, lng: 22.193 }, entry: { lat: 37.269, lng: 22.228 },
        via: [{ lat: 37.329, lng: 22.193 },{ lat: 37.314, lng: 22.202 },{ lat: 37.299, lng: 22.211 },{ lat: 37.283, lng: 22.220 },{ lat: 37.269, lng: 22.228 }] },
      south: { label: "Southbound (towards Kalamata)", minutes: 25,
        exit:  { lat: 37.269, lng: 22.228 }, entry: { lat: 37.329, lng: 22.193 },
        via: [{ lat: 37.269, lng: 22.228 },{ lat: 37.283, lng: 22.220 },{ lat: 37.299, lng: 22.211 },{ lat: 37.314, lng: 22.202 },{ lat: 37.329, lng: 22.193 }] },
    },
  },
  {
    id: "moreas_veligosti",
    name_gr: "Διόδια Βελιγοστής",
    name_en: "Veligosti / Sparta branch",
    highway: "A7", highway_name: "Moreas (A7) — Sparta spur",
    operator: "Moreas SA",
    type: "exit", direction_label: "Exit — towards Sparta / Mystras",
    lat: 37.3450082, lng: 22.1103072,
    cat1: 1.05, cat2: 2.10, cat3: 4.20, cat4: 6.30,
    notes: "Lateral ramp exit for Lefktro–Sparta branch.",
    bypass_directions: null,
  },
  {
    id: "moreas_kalamata",
    name_gr: "Διόδια Καλαμάτας",
    name_en: "Kalamata",
    highway: "A7", highway_name: "Moreas (A7)",
    operator: "Moreas SA",
    type: "frontal", direction_label: "Both directions",
    lat: 37.1368508, lng: 22.0379627,
    cat1: 0.95, cat2: 1.90, cat3: 3.80, cat4: 5.70,
    notes: "Southern terminus of Moreas motorway.",
    bypass_directions: {
      north: { label: "Northbound (towards Tripoli)", minutes: 13,
        exit:  { lat: 37.166, lng: 22.022 }, entry: { lat: 37.108, lng: 22.054 },
        via: [{ lat: 37.166, lng: 22.022 },{ lat: 37.151, lng: 22.030 },{ lat: 37.137, lng: 22.039 },{ lat: 37.122, lng: 22.047 },{ lat: 37.108, lng: 22.054 }] },
      south: { label: "Southbound (towards Kalamata city)", minutes: 15,
        exit:  { lat: 37.108, lng: 22.054 }, entry: { lat: 37.166, lng: 22.022 },
        via: [{ lat: 37.108, lng: 22.054 },{ lat: 37.122, lng: 22.047 },{ lat: 37.137, lng: 22.039 },{ lat: 37.151, lng: 22.030 },{ lat: 37.166, lng: 22.022 }] },
    },
  },

  // ══════════════════════════════════════════════════════════
  // E65 · CENTRAL GREECE · Lamia – Trikala
  // ══════════════════════════════════════════════════════════

  {
    id: "e65_sofades",
    name_gr: "Διόδια Σοφάδων",
    name_en: "Sofades",
    highway: "E65", highway_name: "Central Greece (E65)",
    operator: "Kentriki Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 39.2566317, lng: 22.0831633,
    cat1: 0.98, cat2: 1.95, cat3: 3.90, cat4: 5.85,
    notes: "First station on E65 north of Lamia junction.",
    bypass_directions: {
      south: { label: "Southbound (towards Lamia)", minutes: 13,
        exit:  { lat: 39.286, lng: 22.068 }, entry: { lat: 39.228, lng: 22.099 },
        via: [{ lat: 39.286, lng: 22.068 },{ lat: 39.271, lng: 22.076 },{ lat: 39.256, lng: 22.084 },{ lat: 39.242, lng: 22.092 },{ lat: 39.228, lng: 22.099 }] },
      north: { label: "Northbound (towards Karditsa)", minutes: 15,
        exit:  { lat: 39.228, lng: 22.099 }, entry: { lat: 39.286, lng: 22.068 },
        via: [{ lat: 39.228, lng: 22.099 },{ lat: 39.242, lng: 22.092 },{ lat: 39.256, lng: 22.084 },{ lat: 39.271, lng: 22.076 },{ lat: 39.286, lng: 22.068 }] },
    },
  },
  {
    id: "e65_trikala",
    name_gr: "Διόδια Τρικάλων",
    name_en: "Trikala",
    highway: "E65", highway_name: "Central Greece (E65)",
    operator: "Kentriki Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 39.5204295, lng: 21.8322372,
    cat1: 1.00, cat2: 2.00, cat3: 4.00, cat4: 6.00,
    notes: "Northern terminus of E65.",
    bypass_directions: {
      south: { label: "Southbound (towards Karditsa)", minutes: 10,
        exit:  { lat: 39.549, lng: 21.817 }, entry: { lat: 39.492, lng: 21.848 },
        via: [{ lat: 39.549, lng: 21.817 },{ lat: 39.534, lng: 21.825 },{ lat: 39.520, lng: 21.833 },{ lat: 39.506, lng: 21.841 },{ lat: 39.492, lng: 21.848 }] },
      north: { label: "Northbound (towards Trikala city)", minutes: 12,
        exit:  { lat: 39.492, lng: 21.848 }, entry: { lat: 39.549, lng: 21.817 },
        via: [{ lat: 39.492, lng: 21.848 },{ lat: 39.506, lng: 21.841 },{ lat: 39.520, lng: 21.833 },{ lat: 39.534, lng: 21.825 },{ lat: 39.549, lng: 21.817 }] },
    },
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

/* ── HELP BUTTON ── */
.btn-help { gap: 6px; }

/* ── HELP MODAL ── */
#help-modal {
  position: fixed; inset: 0;
  z-index: 2000;
  background: rgba(20,20,18,0.55);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none;
  transition: opacity 0.2s;
  padding: 20px;
}
#help-modal.open { opacity: 1; pointer-events: all; }

.help-box {
  background: var(--bg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-lg);
  max-width: 520px; width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 28px 28px 24px;
  position: relative;
  border-radius: var(--radius);
}
.help-box::-webkit-scrollbar { width: 3px; }
.help-box::-webkit-scrollbar-thumb { background: var(--border2); }

.help-close {
  position: absolute; top: 14px; right: 14px;
  background: var(--bg2); border: 1px solid var(--border2);
  color: var(--ink3); cursor: pointer; font-size: 0.75rem;
  padding: 4px 9px; border-radius: var(--radius);
  transition: all 0.12s;
}
.help-close:hover { color: var(--rust); border-color: var(--rust); background: var(--rust-bg); }

.help-logo {
  font-family: var(--font-display); font-weight: 800; font-size: 1.6rem;
  letter-spacing: -0.04em; color: var(--ink); margin-bottom: 2px;
}
.help-logo em { color: var(--olive); font-style: normal; }

.help-subtitle {
  font-size: 0.72rem; color: var(--ink3); letter-spacing: 0.05em;
  margin-bottom: 22px;
}

.help-section { display: flex; gap: 14px; margin-bottom: 18px; }

.help-section-icon {
  font-size: 1.1rem; color: var(--olive); flex-shrink: 0;
  width: 24px; text-align: center; margin-top: 2px;
}

.help-section-title {
  font-family: var(--font-display); font-weight: 700; font-size: 0.88rem;
  color: var(--ink); margin-bottom: 6px;
}

.help-section-body {
  font-size: 0.75rem; color: var(--ink2); line-height: 1.75;
}

.help-section-body ul,
.help-section-body ol {
  padding-left: 18px; margin-top: 6px;
}

.help-section-body li { margin-bottom: 3px; }
.help-section-body strong { color: var(--ink); }

.help-divider {
  border: none; border-top: 1px solid var(--border);
  margin: 18px 0;
}

.help-tip {
  font-size: 0.72rem; color: var(--ink2); line-height: 1.6;
  background: var(--gold-bg); border: 1px solid #e8d89a;
  padding: 8px 12px; margin-bottom: 20px;
  border-radius: var(--radius);
}
.help-tip strong { color: var(--gold); }

.help-cta {
  width: 100%; background: var(--olive); border: none; color: white;
  font-family: var(--font-display); font-weight: 700; font-size: 0.82rem;
  letter-spacing: 0.08em; text-transform: uppercase;
  padding: 12px; cursor: pointer; border-radius: var(--radius);
  transition: background 0.15s;
}
.help-cta:hover { background: var(--olive-lt); }

const TYPE_SHAPES = {
  frontal: "diamond",
  entry:   "triangle-up",
  exit:    "triangle-down",
  bridge:  "circle",
};

if (typeof module !== "undefined") module.exports = { TOLL_DATA, HIGHWAY_COLORS, HIGHWAY_ROUTES, TYPE_SHAPES };
