/**
 * DIODIO — Greek Toll Booth Dataset
 * Coordinates sourced from diodia.com.gr KMZ (49 verified points)
 * Exit/entry ramp coordinates from: Πλήρης Οδηγός Αποφυγής Διοδίων 2026
 * Prices updated January 2026.
 *
 * bypass_directions structure per direction (north/south/east/west):
 *   label       — human readable direction
 *   exit_name   — name of the motorway exit BEFORE the toll
 *   entry_name  — name of the motorway entry AFTER the toll
 *   exit        — {lat,lng} verified coordinates of exit ramp
 *   entry       — {lat,lng} verified coordinates of entry ramp
 *   minutes     — estimated extra travel time vs motorway
 *   via         — waypoints for the green bypass line on map
 */

const TOLL_DATA = [

  // ══════════════════════════════════════════════════════════
  // A1 · PATHE · Afidnes → Malgara
  // ══════════════════════════════════════════════════════════

  {
    id: "a1_afidnes",
    name_gr: "Διόδια Αφιδνών",
    name_en: "Afidnes",
    highway: "A1", highway_name: "PATHE (A1/E75) · Nea Odos",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.1764690, lng: 23.8546228,
    cat1: 1.00, cat2: 1.90, cat3: 3.80, cat4: 5.70,
    notes: "Northern Attica. First toll heading north from Athens.",
    bypass_directions: {
      north: {
        label: "Northbound (towards Thessaloniki)",
        exit_name: "Αγ. Στεφάνου", entry_name: "Πολυδενδρίου",
        pre_exit:   { lat: 38.13631451771822, lng: 23.841738538691523 },
        off_ramp:   { lat: 38.13833823155696, lng: 23.843249742760467 },
        on_ramp:    { lat: 38.202404734112505, lng: 23.85462956758912 },
        post_merge: { lat: 38.206819131930764, lng: 23.855254234010836 },
        minutes: 12,
        via: [{ lat: 38.13840, lng: 23.86445 },{ lat: 38.155, lng: 23.862 },{ lat: 38.176, lng: 23.855 },{ lat: 38.21485, lng: 23.86310 }],
        confidence: "verified"
      },
      south: {
        label: "Southbound (towards Athens)",
        exit_name: "Πολυδενδρίου", entry_name: "Αγ. Στεφάνου",
        pre_exit:   { lat: 38.20627367700232, lng: 23.85497115527781 },
        off_ramp:   { lat: 38.20230326448211, lng: 23.853767843828077 },
        on_ramp:    { lat: 38.13859494242029, lng: 23.842336167071487 },
        post_merge: { lat: 38.13685726142458, lng: 23.84182068410737 },
        minutes: 12,
        via: [{ lat: 38.21485, lng: 23.86310 },{ lat: 38.176, lng: 23.855 },{ lat: 38.155, lng: 23.862 },{ lat: 38.13840, lng: 23.86445 }],
        confidence: "verified"
      },
    },
  },
  {
    id: "a1_thiva",
    name_gr: "Διόδια Θήβας",
    name_en: "Thiva (Thebes)",
    highway: "A1", highway_name: "PATHE (A1/E75) · Nea Odos",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.3708752, lng: 23.2868636,
    cat1: 1.30, cat2: 2.40, cat3: 4.80, cat4: 7.20,
    notes: "North of Thiva / Thebes.",
    bypass_directions: {
      north: {
        label: "Northbound (towards Thessaloniki)",
        exit_name: "Ριτσώνας", entry_name: "Θήβας",
        pre_exit:   { lat: 38.365991, lng: 23.331733 },
        off_ramp:   { lat: 38.366465, lng: 23.32461 },
        on_ramp:    { lat: 38.403263, lng: 23.221864 },
        post_merge: { lat: 38.405774, lng: 23.219103 },
        minutes: 14,
        via: [{ lat: 38.40685, lng: 23.51860 },{ lat: 38.390, lng: 23.450 },{ lat: 38.371, lng: 23.380 },{ lat: 38.35825, lng: 23.33640 }],
        confidence: "auto"
      },
      south: {
        label: "Southbound (towards Athens)",
        exit_name: "Θήβας", entry_name: "Ριτσώνας",
        pre_exit:   { lat: 38.405441, lng: 23.219123 },
        off_ramp:   { lat: 38.402589, lng: 23.22106 },
        on_ramp:    { lat: 38.364631, lng: 23.321978 },
        post_merge: { lat: 38.365166, lng: 23.324049 },
        minutes: 14,
        via: [{ lat: 38.35825, lng: 23.33640 },{ lat: 38.371, lng: 23.380 },{ lat: 38.390, lng: 23.450 },{ lat: 38.40685, lng: 23.51860 }],
        confidence: "auto"
      },
    },
  },
  {
    id: "a1_traganas",
    name_gr: "Διόδια Τραγάνας",
    name_en: "Traganas",
    highway: "A1", highway_name: "PATHE (A1/E75) · Nea Odos",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.6174740, lng: 23.1434298,
    cat1: 1.20, cat2: 2.30, cat3: 4.60, cat4: 6.90,
    notes: "Between Thiva and Kamena Vourla.",
    bypass_directions: {
      north: {
        label: "Northbound (towards Thessaloniki)",
        exit_name: "Κάστρου", entry_name: "Λιβανατών",
        pre_exit:   { lat: 38.571955247833486, lng: 23.19585429040776 },
        off_ramp:   { lat: 38.571955247833486, lng: 23.19585429040776 },
        on_ramp:    { lat: 38.62254660197413, lng: 23.12393023130427 },
        post_merge: { lat: 38.62274330021454, lng: 23.120518509124068 },
        minutes: 15,
        via: [{ lat: 38.49755, lng: 23.16145 },{ lat: 38.560, lng: 23.130 },{ lat: 38.617, lng: 23.100 },{ lat: 38.660, lng: 23.070 },{ lat: 38.71150, lng: 23.03740 }],
        confidence: "verified"
      },
      south: {
        label: "Southbound (towards Athens)",
        exit_name: "Λιβανατών", entry_name: "Κάστρου",
        pre_exit:   { lat: 38.62267234322968, lng: 23.120105534694485 },
        off_ramp:   { lat: 38.62199329801496, lng: 23.12343345503746 },
        on_ramp:    { lat: 38.57375826149571, lng: 23.198828494003354 },
        post_merge: { lat: 38.57155117924188, lng: 23.194775607458954 },
        minutes: 15,
        via: [{ lat: 38.71150, lng: 23.03740 },{ lat: 38.660, lng: 23.070 },{ lat: 38.617, lng: 23.100 },{ lat: 38.560, lng: 23.130 },{ lat: 38.49755, lng: 23.16145 }],
        confidence: "verified"
      },
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
    notes: "Near ferry port for Sporades islands.",
    bypass_directions: {
      north: {
        label: "Northbound (towards Thessaloniki)",
        exit_name: "Μώλου", entry_name: "Θερμοπυλών",
        pre_exit:   { lat: 38.80092992897871, lng: 22.653421150540826 },
        off_ramp:   { lat: 38.801814017985045, lng: 22.647676438837426 },
        on_ramp:    { lat: 38.799591076740796, lng: 22.511031168094227 },
        post_merge: { lat: 38.80039529850744, lng: 22.50702057095407 },
        minutes: 16,
        via: [{ lat: 38.80955, lng: 22.64730 },{ lat: 38.809, lng: 22.620 },{ lat: 38.800, lng: 22.580 },{ lat: 38.79785, lng: 22.53585 }],
        confidence: "verified"
      },
      south: {
        label: "Southbound (towards Athens)",
        exit_name: "Θερμοπυλών", entry_name: "Μώλου",
        pre_exit:   { lat: 38.80095331249726, lng: 22.505496133170862 },
        off_ramp:   { lat: 38.80095331249726, lng: 22.505496133170862 },
        on_ramp:    { lat: 38.785807362122654, lng: 22.699659343761724 },
        post_merge: { lat: 38.785807362122654, lng: 22.699659343761724 },
        minutes: 16,
        via: [{ lat: 38.79785, lng: 22.53585 },{ lat: 38.800, lng: 22.580 },{ lat: 38.809, lng: 22.620 },{ lat: 38.80955, lng: 22.64730 }],
        confidence: "verified"
      },
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
      north: {
        label: "Northbound (towards Thessaloniki)",
        exit_name: "Λαμίας", entry_name: "Αγ. Μαρίνας",
        pre_exit:   { lat: 38.86690865730291, lng: 22.459566047881285 },
        off_ramp:   { lat: 38.86929536606521, lng: 22.459751248106066 },
        on_ramp:    { lat: 38.903048456353915, lng: 22.569177624283917 },
        post_merge: { lat: 38.90361673813972, lng: 22.57127220012787 },
        minutes: 18,
        via: [{ lat: 38.87855, lng: 22.45425 },{ lat: 38.882, lng: 22.500 },{ lat: 38.890, lng: 22.540 },{ lat: 38.89555, lng: 22.58435 }],
        confidence: "verified"
      },
      south: {
        label: "Southbound (towards Athens)",
        exit_name: "Αγ. Μαρίνας", entry_name: "Λαμίας",
        pre_exit:   { lat: 38.9044727354293, lng: 22.573705862773096 },
        off_ramp:   { lat: 38.9044727354293, lng: 22.573705862773096 },
        on_ramp:    { lat: 38.89899548628808, lng: 22.499170865064745 },
        post_merge: { lat: 38.897702225415934, lng: 22.496105733925777 },
        minutes: 18,
        via: [{ lat: 38.89555, lng: 22.58435 },{ lat: 38.890, lng: 22.540 },{ lat: 38.882, lng: 22.500 },{ lat: 38.87855, lng: 22.45425 }],
        confidence: "verified"
      },
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
      north: {
        label: "Northbound (towards Thessaloniki)",
        exit_name: "Γλύφας", entry_name: "Αλμυρού",
        exit:  { lat: 38.94825, lng: 22.95555 },
        entry: { lat: 39.15855, lng: 22.75620 },
        minutes: 22,
        via: [{ lat: 38.94825, lng: 22.95555 },{ lat: 39.000, lng: 22.900 },{ lat: 39.060, lng: 22.850 },{ lat: 39.100, lng: 22.810 },{ lat: 39.15855, lng: 22.75620 }],
        confidence: "approximate"
      },
      south: {
        label: "Southbound (towards Athens)",
        exit_name: "Αλμυρού", entry_name: "Γλύφας",
        exit:  { lat: 39.15855, lng: 22.75620 },
        entry: { lat: 38.94825, lng: 22.95555 },
        minutes: 22,
        via: [{ lat: 39.15855, lng: 22.75620 },{ lat: 39.100, lng: 22.810 },{ lat: 39.060, lng: 22.850 },{ lat: 39.000, lng: 22.900 },{ lat: 38.94825, lng: 22.95555 }],
        confidence: "approximate"
      },
    },
  },
  {
    id: "a1_moschochori",
    name_gr: "Διόδια Μοσχοχωρίου / Κιλελέρ",
    name_en: "Moschochori / Kileler",
    highway: "A1", highway_name: "PATHE (A1/E75) · Kentriki Odos",
    operator: "Kentriki Odos",
    type: "exit", direction_label: "Exit — towards Volos / Larissa east",
    lat: 39.5227965, lng: 22.5567985,
    cat1: 1.30, cat2: 2.60, cat3: 5.20, cat4: 7.80,
    notes: "Lateral exit ramp towards Volos and eastern Larissa.",
    bypass_directions: {
      north: {
        label: "Northbound (towards Thessaloniki)",
        exit_name: "Κιλελέρ", entry_name: "Νίκαιας",
        exit:  { lat: 39.46785, lng: 22.53425 },
        entry: { lat: 39.56945, lng: 22.46310 },
        minutes: 10,
        via: [{ lat: 39.46785, lng: 22.53425 },{ lat: 39.500, lng: 22.520 },{ lat: 39.523, lng: 22.510 },{ lat: 39.56945, lng: 22.46310 }],
        confidence: "approximate"
      },
      south: {
        label: "Southbound (towards Athens)",
        exit_name: "Νίκαιας", entry_name: "Κιλελέρ",
        exit:  { lat: 39.56945, lng: 22.46310 },
        entry: { lat: 39.46785, lng: 22.53425 },
        minutes: 10,
        via: [{ lat: 39.56945, lng: 22.46310 },{ lat: 39.523, lng: 22.510 },{ lat: 39.500, lng: 22.520 },{ lat: 39.46785, lng: 22.53425 }],
        confidence: "approximate"
      },
    },
  },
  {
    id: "a1_makrychori",
    name_gr: "Διόδια Μακρυχωρίου / Λάρισας",
    name_en: "Makrychori / Larissa",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal", direction_label: "Both directions",
    lat: 39.8044068, lng: 22.5028431,
    cat1: 0.85, cat2: 1.60, cat3: 3.20, cat4: 4.80,
    notes: "Entry to Aegean Motorway concession north of Larissa.",
    bypass_directions: {
      north: {
        label: "Northbound (towards Thessaloniki)",
        exit_name: "Ευαγγελισμού", entry_name: "Γυρτώνης",
        pre_exit:   { lat: 39.840195, lng: 22.514041 },
        off_ramp:   { lat: 39.845650, lng: 22.521350 },
        on_ramp:    { lat: 39.742350, lng: 22.476550 },
        post_merge: { lat: 39.751270, lng: 22.475050 },
        minutes: 14,
        via: [{ lat: 39.84565, lng: 22.52135 },{ lat: 39.820, lng: 22.510 },{ lat: 39.800, lng: 22.500 },{ lat: 39.74235, lng: 22.47655 }],
        confidence: "approximate"
      },
      south: {
        label: "Southbound (towards Athens)",
        exit_name: "Γυρτώνης", entry_name: "Ευαγγελισμού",
        pre_exit:   { lat: 39.751257, lng: 22.474875 },
        off_ramp:   { lat: 39.742350, lng: 22.476550 },
        on_ramp:    { lat: 39.845650, lng: 22.521350 },
        post_merge: { lat: 39.840324, lng: 22.513885 },
        minutes: 14,
        via: [{ lat: 39.74235, lng: 22.47655 },{ lat: 39.800, lng: 22.500 },{ lat: 39.820, lng: 22.510 },{ lat: 39.84565, lng: 22.52135 }],
        confidence: "approximate"
      },
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
    notes: "Highest toll — covers Tempi Valley tunnel. Old road via Stomio coastal village.",
    bypass_directions: {
      north: {
        label: "Northbound (towards Thessaloniki)",
        exit_name: "Πλαταμώνα", entry_name: "Λεπτοκαρυάς",
        pre_exit:   { lat: 39.976419, lng: 22.634363 },
        off_ramp:   { lat: 39.979837, lng: 22.623542 },
        on_ramp:    { lat: 40.045795, lng: 22.564413 },
        post_merge: { lat: 40.053832, lng: 22.559135 },
        minutes: 35,
        via: [{ lat: 39.99245, lng: 22.62415 },{ lat: 40.000, lng: 22.610 },{ lat: 40.020, lng: 22.592 },{ lat: 40.036, lng: 22.575 },{ lat: 40.06255, lng: 22.55835 }],
        confidence: "verified"
      },
      south: {
        label: "Southbound (towards Athens)",
        exit_name: "Λεπτοκαρυάς", entry_name: "Πλαταμώνα",
        pre_exit:   { lat: 40.053744, lng: 22.558919 },
        off_ramp:   { lat: 40.045795, lng: 22.564413 },
        on_ramp:    { lat: 39.979837, lng: 22.623542 },
        post_merge: { lat: 39.976292, lng: 22.634301 },
        minutes: 35,
        via: [{ lat: 40.06255, lng: 22.55835 },{ lat: 40.036, lng: 22.575 },{ lat: 40.020, lng: 22.592 },{ lat: 40.000, lng: 22.610 },{ lat: 39.99245, lng: 22.62415 }],
        confidence: "verified"
      },
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
    bypass_directions: {
      north: {
        label: "Northbound",
        exit_name: "Αιγινίου", entry_name: "Κολινδρού",
        pre_exit:   { lat: 40.504365, lng: 22.567625 },
        off_ramp:   { lat: 40.513160, lng: 22.570133 },
        on_ramp:    { lat: 40.478550, lng: 22.587450 },
        post_merge: { lat: 40.483264, lng: 22.567717 },
        minutes: 8,
        via: [{ lat: 40.50125, lng: 22.52845 },{ lat: 40.490, lng: 22.550 },{ lat: 40.47855, lng: 22.58745 }],
        confidence: "approximate"
      },
      south: {
        label: "Southbound",
        exit_name: "Κολινδρού", entry_name: "Αιγινίου",
        pre_exit:   { lat: 40.483208, lng: 22.567485 },
        off_ramp:   { lat: 40.478550, lng: 22.587450 },
        on_ramp:    { lat: 40.513160, lng: 22.570133 },
        post_merge: { lat: 40.504467, lng: 22.567103 },
        minutes: 8,
        via: [{ lat: 40.47855, lng: 22.58745 },{ lat: 40.490, lng: 22.550 },{ lat: 40.50125, lng: 22.52845 }],
        confidence: "approximate"
      },
    },
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
    notes: "Thessaloniki ring junction. Northern terminus of PATHE.",
    bypass_directions: {
      north: {
        label: "Northbound (towards Thessaloniki)",
        exit_name: "Χαλάστρας", entry_name: "Μαλγάρων",
        pre_exit:   { lat: 40.605881, lng: 22.723272 },
        off_ramp:   { lat: 40.623450, lng: 22.721550 },
        on_ramp:    { lat: 40.600191, lng: 22.681942 },
        post_merge: { lat: 40.601506, lng: 22.693671 },
        minutes: 10,
        via: [{ lat: 40.62345, lng: 22.72155 },{ lat: 40.618, lng: 22.706 },{ lat: 40.61255, lng: 22.67425 }],
        confidence: "approximate"
      },
      south: {
        label: "Southbound (towards Athens)",
        exit_name: "Μαλγάρων", entry_name: "Χαλάστρας",
        pre_exit:   { lat: 40.601839, lng: 22.693580 },
        off_ramp:   { lat: 40.600191, lng: 22.681942 },
        on_ramp:    { lat: 40.623450, lng: 22.721550 },
        post_merge: { lat: 40.606034, lng: 22.720249 },
        minutes: 10,
        via: [{ lat: 40.61255, lng: 22.67425 },{ lat: 40.618, lng: 22.706 },{ lat: 40.62345, lng: 22.72155 }],
        confidence: "approximate"
      },
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
      north: {
        label: "Northbound (towards Kavala)",
        exit_name: "Προφήτη", entry_name: "Λαγκαδά",
        exit:  { lat: 40.684178, lng: 23.257014 },
        entry: { lat: 40.739312, lng: 23.018035 },
        minutes: 18,
        via: [{ lat: 40.6854, lng: 23.2584 },{ lat: 40.700, lng: 23.220 },{ lat: 40.720, lng: 23.170 },{ lat: 40.7512, lng: 23.0584 }],
        confidence: "auto"
      },
      south: {
        label: "Southbound (towards Thessaloniki)",
        exit_name: "Λαγκαδά", entry_name: "Προφήτη",
        exit:  { lat: 40.739312, lng: 23.018035 },
        entry: { lat: 40.684178, lng: 23.257014 },
        minutes: 18,
        via: [{ lat: 40.7512, lng: 23.0584 },{ lat: 40.720, lng: 23.170 },{ lat: 40.700, lng: 23.220 },{ lat: 40.6854, lng: 23.2584 }],
        confidence: "auto"
      },
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
      north: {
        label: "Northbound (towards Kavala/Drama)",
        exit_name: "Γαληψού", entry_name: "Μουσθένης",
        exit:  { lat: 40.786484, lng: 23.960474 },
        entry: { lat: 40.8654, lng: 24.1254 },
        minutes: 20,
        via: [{ lat: 40.8542, lng: 23.9542 },{ lat: 40.856, lng: 24.000 },{ lat: 40.860, lng: 24.060 },{ lat: 40.8654, lng: 24.1254 }],
        confidence: "approximate"
      },
      south: {
        label: "Southbound (towards Thessaloniki)",
        exit_name: "Μουσθένης", entry_name: "Γαληψού",
        exit:  { lat: 40.8654, lng: 24.1254 },
        entry: { lat: 40.786484, lng: 23.960474 },
        minutes: 20,
        via: [{ lat: 40.8654, lng: 24.1254 },{ lat: 40.860, lng: 24.060 },{ lat: 40.856, lng: 24.000 },{ lat: 40.8542, lng: 23.9542 }],
        confidence: "approximate"
      },
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
    bypass_directions: null,
  },
  {
    id: "a1_evzoni",
    name_gr: "Διόδια Ευζώνων (Σύνορα Β. Μακεδονίας)",
    name_en: "Evzoni (N. Macedonia Border)",
    highway: "A1", highway_name: "PATHE (A1/E75) · Aegean Motorway",
    operator: "Aegean Motorway",
    type: "frontal", direction_label: "Southbound (entering Greece from N. Macedonia)",
    lat: 41.1081360, lng: 22.5590944,
    cat1: 1.48, cat2: 2.95, cat3: 5.90, cat4: 8.85,
    notes: "Greek–North Macedonian border. No bypass.",
    bypass_directions: null,
  },

  // ══════════════════════════════════════════════════════════
  // A2 · EGNATIA ODOS · Tyria → Ardanio
  // ══════════════════════════════════════════════════════════

  {
    id: "egnatia_igoumenitsa",
    name_gr: "Διόδια Τυριάς / Ηγουμενίτσας",
    name_en: "Tyria / Igoumenitsa",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 39.5403268, lng: 20.6743276,
    cat1: 1.00, cat2: 2.00, cat3: 4.00, cat4: 6.00,
    notes: "Western terminus of Egnatia.",
    bypass_directions: {
      east: {
        label: "Eastbound (towards Ioannina)",
        exit_name: "Δωδώνης", entry_name: "Σελλών",
        pre_exit:   { lat: 39.555673, lng: 20.761349 },
        off_ramp:   { lat: 39.548200, lng: 20.785400 },
        on_ramp:    { lat: 39.536720, lng: 20.691710 },
        post_merge: { lat: 39.535638, lng: 20.703223 },
        minutes: 14,
        via: [{ lat: 39.5482, lng: 20.7854 },{ lat: 39.535, lng: 20.740 },{ lat: 39.520, lng: 20.700 },{ lat: 39.5125, lng: 20.6584 }],
        confidence: "approximate"
      },
      west: {
        label: "Westbound (towards Igoumenitsa)",
        exit_name: "Σελλών", entry_name: "Δωδώνης",
        pre_exit:   { lat: 39.535778, lng: 20.703250 },
        off_ramp:   { lat: 39.536720, lng: 20.691710 },
        on_ramp:    { lat: 39.548200, lng: 20.785400 },
        post_merge: { lat: 39.555836, lng: 20.761219 },
        minutes: 14,
        via: [{ lat: 39.5125, lng: 20.6584 },{ lat: 39.520, lng: 20.700 },{ lat: 39.535, lng: 20.740 },{ lat: 39.5482, lng: 20.7854 }],
        confidence: "approximate"
      },
    },
  },
  {
    id: "egnatia_ioannina",
    name_gr: "Διόδια Παμβώτιδας / Ιωαννίνων",
    name_en: "Pamvotida / Ioannina",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 39.6188630, lng: 20.9475803,
    cat1: 1.10, cat2: 2.15, cat3: 4.30, cat4: 6.45,
    notes: "Ioannina bypass. Named after Pamvotida lake.",
    bypass_directions: {
      east: {
        label: "Eastbound (towards Thessaloniki)",
        exit_name: "Αράχθου", entry_name: "Ιωαννίνων",
        exit:  { lat: 39.6125, lng: 20.9854 },
        entry: { lat: 39.6584, lng: 20.8542 },
        minutes: 15,
        via: [{ lat: 39.6125, lng: 20.9854 },{ lat: 39.625, lng: 20.960 },{ lat: 39.640, lng: 20.920 },{ lat: 39.6584, lng: 20.8542 }],
        confidence: "approximate"
      },
      west: {
        label: "Westbound (towards Igoumenitsa)",
        exit_name: "Ιωαννίνων", entry_name: "Αράχθου",
        exit:  { lat: 39.6584, lng: 20.8542 },
        entry: { lat: 39.6125, lng: 20.9854 },
        minutes: 15,
        via: [{ lat: 39.6584, lng: 20.8542 },{ lat: 39.640, lng: 20.920 },{ lat: 39.625, lng: 20.960 },{ lat: 39.6125, lng: 20.9854 }],
        confidence: "approximate"
      },
    },
  },
  {
    id: "egnatia_metsovo",
    name_gr: "Διόδια Μαλακασίου / Σήραγγα Μετσόβου",
    name_en: "Malakasi / Metsovo Tunnel",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 39.7855212, lng: 21.2854099,
    cat1: 1.40, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Mountain tunnel through Pindus range. Old road via Metsovo village.",
    bypass_directions: {
      east: {
        label: "Eastbound (towards Thessaloniki)",
        exit_name: "Μετσόβου", entry_name: "Παναγιάς",
        pre_exit:   { lat: 39.754925, lng: 21.159824 },
        off_ramp:   { lat: 39.759905, lng: 21.169323 },
        on_ramp:    { lat: 39.793163, lng: 21.303378 },
        post_merge: { lat: 39.800653, lng: 21.309852 },
        minutes: 45,
        via: [{ lat: 39.7854, lng: 21.1854 },{ lat: 39.782, lng: 21.220 },{ lat: 39.786, lng: 21.270 },{ lat: 39.7985, lng: 21.3254 }],
        confidence: "auto"
      },
      west: {
        label: "Westbound (towards Ioannina)",
        exit_name: "Παναγιάς", entry_name: "Μετσόβου",
        pre_exit:   { lat: 39.800792, lng: 21.309623 },
        off_ramp:   { lat: 39.793163, lng: 21.303378 },
        on_ramp:    { lat: 39.759905, lng: 21.169323 },
        post_merge: { lat: 39.755197, lng: 21.159808 },
        minutes: 45,
        via: [{ lat: 39.7985, lng: 21.3254 },{ lat: 39.786, lng: 21.270 },{ lat: 39.782, lng: 21.220 },{ lat: 39.7854, lng: 21.1854 }],
        confidence: "auto"
      },
    },
  },
  {
    id: "egnatia_kozani",
    name_gr: "Διόδια Σιάτιστας / Κοζάνης",
    name_en: "Siatista / Kozani",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 40.2378869, lng: 21.5810286,
    cat1: 0.90, cat2: 1.80, cat3: 3.60, cat4: 5.40,
    notes: "",
    bypass_directions: {
      east: {
        label: "Eastbound (towards Thessaloniki)",
        exit_name: "Σιάτιστας", entry_name: "Κοζάνης",
        pre_exit:   { lat: 40.219947, lng: 21.543025 },
        off_ramp:   { lat: 40.227987, lng: 21.550016 },
        on_ramp:    { lat: 40.350638, lng: 21.808375 },
        post_merge: { lat: 40.358027, lng: 21.815010 },
        minutes: 20,
        via: [{ lat: 40.2584, lng: 21.5214 },{ lat: 40.268, lng: 21.620 },{ lat: 40.280, lng: 21.700 },{ lat: 40.3012, lng: 21.7854 }],
        confidence: "auto"
      },
      west: {
        label: "Westbound (towards Ioannina)",
        exit_name: "Κοζάνης", entry_name: "Σιάτιστας",
        pre_exit:   { lat: 40.358108, lng: 21.814906 },
        off_ramp:   { lat: 40.350638, lng: 21.808375 },
        on_ramp:    { lat: 40.227987, lng: 21.550016 },
        post_merge: { lat: 40.220057, lng: 21.542999 },
        minutes: 20,
        via: [{ lat: 40.3012, lng: 21.7854 },{ lat: 40.280, lng: 21.700 },{ lat: 40.268, lng: 21.620 },{ lat: 40.2584, lng: 21.5214 }],
        confidence: "auto"
      },
    },
  },
  {
    id: "egnatia_veroia",
    name_gr: "Διόδια Πολυμύλου / Βέροιας",
    name_en: "Polymylo / Veroia",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 40.3671958, lng: 22.0602089,
    cat1: 0.80, cat2: 1.60, cat3: 3.20, cat4: 4.80,
    notes: "",
    bypass_directions: {
      east: {
        label: "Eastbound (towards Thessaloniki)",
        exit_name: "Βέροιας", entry_name: "Πολυμύλου",
        exit:  { lat: 40.5284, lng: 22.1854 },
        entry: { lat: 40.368681, lng: 22.053816 },
        minutes: 18,
        via: [{ lat: 40.5284, lng: 22.1854 },{ lat: 40.480, lng: 22.150 },{ lat: 40.430, lng: 22.110 },{ lat: 40.3854, lng: 22.0542 }],
        confidence: "approximate"
      },
      west: {
        label: "Westbound (towards Kozani)",
        exit_name: "Πολυμύλου", entry_name: "Βέροιας",
        exit:  { lat: 40.368681, lng: 22.053816 },
        entry: { lat: 40.5284, lng: 22.1854 },
        minutes: 18,
        via: [{ lat: 40.3854, lng: 22.0542 },{ lat: 40.430, lng: 22.110 },{ lat: 40.480, lng: 22.150 },{ lat: 40.5284, lng: 22.1854 }],
        confidence: "approximate"
      },
    },
  },
  {
    id: "egnatia_ieropigi",
    name_gr: "Διόδια Ιεροπηγής",
    name_en: "Ieropigi",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90) — branch",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 40.5665678, lng: 21.0665417,
    cat1: 0.80, cat2: 1.60, cat3: 3.20, cat4: 4.80,
    notes: "Branch spur of Egnatia towards Kastoria / Albanian border.",
    bypass_directions: null,
  },
  {
    id: "egnatia_thessaloniki_west",
    name_gr: "Διόδια Θεσσαλονίκης Δυτ. (Ωραιόκαστρο)",
    name_en: "Thessaloniki West (Oraiokastro)",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 40.6956111, lng: 22.9162091,
    cat1: 0.60, cat2: 1.20, cat3: 2.40, cat4: 3.60,
    notes: "Western Thessaloniki bypass.",
    bypass_directions: null,
  },
  {
    id: "egnatia_strymoniko",
    name_gr: "Διόδια Στρυμονικού",
    name_en: "Strymoniko",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90) — branch",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 41.0435183, lng: 23.2952374,
    cat1: 0.90, cat2: 1.80, cat3: 3.60, cat4: 5.40,
    notes: "Branch spur north of Thessaloniki ring.",
    bypass_directions: null,
  },
  {
    id: "egnatia_xanthi",
    name_gr: "Διόδια Ιάσμου / Ξάνθης",
    name_en: "Iasmos / Xanthi",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 41.1203415, lng: 25.0802422,
    cat1: 0.85, cat2: 1.70, cat3: 3.40, cat4: 5.10,
    notes: "",
    bypass_directions: {
      east: {
        label: "Eastbound (towards Komotini)",
        exit_name: "ΒΙΠΕ Κομοτηνής", entry_name: "Ιάσμου",
        pre_exit:   { lat: 41.122146, lng: 25.310027 },
        off_ramp:   { lat: 41.125400, lng: 25.325400 },
        on_ramp:    { lat: 41.116579, lng: 25.178272 },
        post_merge: { lat: 41.115952, lng: 25.190159 },
        minutes: 18,
        via: [{ lat: 41.1254, lng: 25.3254 },{ lat: 41.127, lng: 25.250 },{ lat: 41.130, lng: 25.200 },{ lat: 41.1325, lng: 25.1254 }],
        confidence: "approximate"
      },
      west: {
        label: "Westbound (towards Kavala)",
        exit_name: "Ιάσμου", entry_name: "ΒΙΠΕ Κομοτηνής",
        pre_exit:   { lat: 41.116075, lng: 25.190151 },
        off_ramp:   { lat: 41.116579, lng: 25.178272 },
        on_ramp:    { lat: 41.125400, lng: 25.325400 },
        post_merge: { lat: 41.122263, lng: 25.310108 },
        minutes: 18,
        via: [{ lat: 41.1325, lng: 25.1254 },{ lat: 41.130, lng: 25.200 },{ lat: 41.127, lng: 25.250 },{ lat: 41.1254, lng: 25.3254 }],
        confidence: "approximate"
      },
    },
  },
  {
    id: "egnatia_komotini",
    name_gr: "Διόδια Μέστης / Κομοτηνής",
    name_en: "Mestis / Komotini",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 41.0135240, lng: 25.5332019,
    cat1: 0.85, cat2: 1.70, cat3: 3.40, cat4: 5.10,
    notes: "",
    bypass_directions: null,
  },
  {
    id: "egnatia_alexandroupoli",
    name_gr: "Διόδια Αρδανίου / Αλεξανδρούπολης",
    name_en: "Ardanio / Alexandroupoli",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90)",
    operator: "Egnatia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 40.9441053, lng: 26.2045028,
    cat1: 0.80, cat2: 1.60, cat3: 3.20, cat4: 4.80,
    notes: "Eastern terminus of main Egnatia line.",
    bypass_directions: null,
  },
  {
    id: "egnatia_promahonas",
    name_gr: "Διόδια Προμαχώνα (Σύνορα Βουλγαρίας)",
    name_en: "Promahonas (Bulgarian Border)",
    highway: "A2", highway_name: "Egnatia Odos (A2/E90) — branch",
    operator: "Egnatia Odos",
    type: "entry", direction_label: "Westbound (entering Greece from Bulgaria)",
    lat: 41.3641919, lng: 23.3567727,
    cat1: 1.18, cat2: 2.35, cat3: 4.70, cat4: 7.05,
    notes: "Greek–Bulgarian border spur.",
    bypass_directions: null,
  },

  // ══════════════════════════════════════════════════════════
  // A5 · NEA ODOS · Klokova → Terovos
  // ══════════════════════════════════════════════════════════

  {
    id: "ionia_klokova",
    name_gr: "Διόδια Κλόκοβας",
    name_en: "Klokova",
    highway: "A5", highway_name: "Nea Odos (A5)",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.3592412, lng: 21.6565418,
    cat1: 1.20, cat2: 2.40, cat3: 4.80, cat4: 7.20,
    notes: "First toll northbound from Antirrio.",
    bypass_directions: {
      north: {
        label: "Northbound (towards Ioannina)",
        exit_name: "Γαβρολίμνης", entry_name: "Μεσολογγίου",
        exit:  { lat: 38.3951, lng: 21.6582 },
        entry: { lat: 38.378905, lng: 21.501744 },
        minutes: 20,
        via: [{ lat: 38.3951, lng: 21.6582 },{ lat: 38.398, lng: 21.580 },{ lat: 38.401, lng: 21.510 },{ lat: 38.4021, lng: 21.4325 }],
        confidence: "approximate"
      },
      south: {
        label: "Southbound (towards Antirrio)",
        exit_name: "Μεσολογγίου", entry_name: "Γαβρολίμνης",
        exit:  { lat: 38.378905, lng: 21.501744 },
        entry: { lat: 38.3951, lng: 21.6582 },
        minutes: 20,
        via: [{ lat: 38.4021, lng: 21.4325 },{ lat: 38.401, lng: 21.510 },{ lat: 38.398, lng: 21.580 },{ lat: 38.3951, lng: 21.6582 }],
        confidence: "approximate"
      },
    },
  },
  {
    id: "ionia_aggelokastro",
    name_gr: "Διόδια Αγγελοκάστρου",
    name_en: "Aggelokastro",
    highway: "A5", highway_name: "Nea Odos (A5)",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.5494744, lng: 21.2723798,
    cat1: 1.40, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Zone 2 (Chaliki – Amfilochia).",
    bypass_directions: {
      north: {
        label: "Northbound (towards Ioannina)",
        exit_name: "Χαλικίου", entry_name: "Αγγελοκάστρου",
        pre_exit:   { lat: 38.512796, lng: 21.309039 },
        off_ramp:   { lat: 38.514200, lng: 21.285400 },
        on_ramp:    { lat: 38.540864, lng: 21.284177 },
        post_merge: { lat: 38.545800, lng: 21.274720 },
        minutes: 22,
        via: [{ lat: 38.5142, lng: 21.2854 },{ lat: 38.535, lng: 21.290 },{ lat: 38.555, lng: 21.298 },{ lat: 38.5684, lng: 21.3012 }],
        confidence: "approximate"
      },
      south: {
        label: "Southbound (towards Antirrio)",
        exit_name: "Αγγελοκάστρου", entry_name: "Χαλικίου",
        pre_exit:   { lat: 38.545701, lng: 21.274602 },
        off_ramp:   { lat: 38.540864, lng: 21.284177 },
        on_ramp:    { lat: 38.514200, lng: 21.285400 },
        post_merge: { lat: 38.512745, lng: 21.308881 },
        minutes: 22,
        via: [{ lat: 38.5684, lng: 21.3012 },{ lat: 38.555, lng: 21.298 },{ lat: 38.535, lng: 21.290 },{ lat: 38.5142, lng: 21.2854 }],
        confidence: "approximate"
      },
    },
  },
  {
    id: "ionia_menidi",
    name_gr: "Διόδια Κουβαρά / Μενιδίου",
    name_en: "Kouvaras / Menidi",
    highway: "A5", highway_name: "Nea Odos (A5)",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.9898946, lng: 21.1709225,
    cat1: 1.63, cat2: 3.25, cat3: 6.50, cat4: 9.75,
    notes: "Arta–Ioannina section.",
    bypass_directions: {
      north: {
        label: "Northbound (towards Ioannina)",
        exit_name: "Κουβαρά", entry_name: "Αμφιλοχίας",
        exit:  { lat: 38.7452, lng: 21.1542 },
        entry: { lat: 38.8654, lng: 21.1754 },
        minutes: 25,
        via: [{ lat: 38.7452, lng: 21.1542 },{ lat: 38.780, lng: 21.158 },{ lat: 38.820, lng: 21.164 },{ lat: 38.8654, lng: 21.1754 }],
        confidence: "approximate"
      },
      south: {
        label: "Southbound (towards Arta)",
        exit_name: "Αμφιλοχίας", entry_name: "Κουβαρά",
        exit:  { lat: 38.8654, lng: 21.1754 },
        entry: { lat: 38.7452, lng: 21.1542 },
        minutes: 25,
        via: [{ lat: 38.8654, lng: 21.1754 },{ lat: 38.820, lng: 21.164 },{ lat: 38.780, lng: 21.158 },{ lat: 38.7452, lng: 21.1542 }],
        confidence: "approximate"
      },
    },
  },
  {
    id: "ionia_terovos",
    name_gr: "Διόδια Τέροβου / Άρτας",
    name_en: "Terovos / Arta",
    highway: "A5", highway_name: "Nea Odos (A5)",
    operator: "Nea Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 39.4252460, lng: 20.9053087,
    cat1: 1.40, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Near Arta. Northern terminus of Nea Odos A5 section.",
    bypass_directions: {
      north: {
        label: "Northbound (towards Ioannina)",
        exit_name: "Αμμοτόπου", entry_name: "Αβγού",
        pre_exit:   { lat: 39.256196, lng: 20.926479 },
        off_ramp:   { lat: 39.264823, lng: 20.926189 },
        on_ramp:    { lat: 39.425400, lng: 20.885400 },
        post_merge: { lat: 39.432939, lng: 20.905487 },
        minutes: 20,
        via: [{ lat: 39.2654, lng: 20.9542 },{ lat: 39.320, lng: 20.935 },{ lat: 39.375, lng: 20.910 },{ lat: 39.4254, lng: 20.8854 }],
        confidence: "approximate"
      },
      south: {
        label: "Southbound (towards Antirrio)",
        exit_name: "Αβγού", entry_name: "Αμμοτόπου",
        pre_exit:   { lat: 39.433936, lng: 20.905357 },
        off_ramp:   { lat: 39.425400, lng: 20.885400 },
        on_ramp:    { lat: 39.264823, lng: 20.926189 },
        post_merge: { lat: 39.256120, lng: 20.926279 },
        minutes: 20,
        via: [{ lat: 39.4254, lng: 20.8854 },{ lat: 39.375, lng: 20.910 },{ lat: 39.320, lng: 20.935 },{ lat: 39.2654, lng: 20.9542 }],
        confidence: "approximate"
      },
    },
  },

  // ══════════════════════════════════════════════════════════
  // A8 · OLYMPIA ODOS · Elefsina → Pyrgos
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
      west: {
        label: "Westbound (towards Patras)",
        exit_name: "Παραλία Ελευσίνας", entry_name: "Νέα Πέραμος",
        pre_exit:   { lat: 38.048204, lng: 23.554602 },
        off_ramp:   { lat: 38.050060, lng: 23.545024 },
        on_ramp:    { lat: 38.019170, lng: 23.426483 },
        post_merge: { lat: 38.014808, lng: 23.416499 },
        minutes: 22,
        via: [{ lat: 38.0381, lng: 23.5245 },{ lat: 38.025, lng: 23.490 },{ lat: 38.010, lng: 23.450 },{ lat: 37.9972, lng: 23.4182 }],
        confidence: "verified"
      },
      east: {
        label: "Eastbound (towards Athens)",
        exit_name: "Νέα Πέραμος", entry_name: "Παραλία Ελευσίνας",
        pre_exit:   { lat: 38.014679, lng: 23.416593 },
        off_ramp:   { lat: 38.019170, lng: 23.426483 },
        on_ramp:    { lat: 38.050060, lng: 23.545024 },
        post_merge: { lat: 38.048063, lng: 23.554533 },
        minutes: 22,
        via: [{ lat: 37.9972, lng: 23.4182 },{ lat: 38.010, lng: 23.450 },{ lat: 38.025, lng: 23.490 },{ lat: 38.0381, lng: 23.5245 }],
        confidence: "verified"
      },
    },
  },
  {
    id: "olympia_isthmos_canal",
    name_gr: "Διόδια Ισθμού (Διώρυγα Κορίνθου)",
    name_en: "Isthmos (Corinth Canal)",
    highway: "A8", highway_name: "Olympia Odos (A8/E94)",
    operator: "Olympia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 37.9249719, lng: 23.0325365,
    cat1: 1.40, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "At the Corinth Canal. Iconic crossing point into the Peloponnese.",
    bypass_directions: {
      west: {
        label: "Westbound (towards Peloponnese)",
        exit_name: "Αγ. Θεόδωροι", entry_name: "Λουτράκι",
        pre_exit:   { lat: 37.929372, lng: 23.129453 },
        off_ramp:   { lat: 37.923720, lng: 23.120585 },
        on_ramp:    { lat: 37.924557, lng: 23.001337 },
        post_merge: { lat: 37.922206, lng: 22.991073 },
        minutes: 13,
        via: [{ lat: 37.9254, lng: 23.1368 },{ lat: 37.920, lng: 23.080 },{ lat: 37.916, lng: 23.040 },{ lat: 37.9145, lng: 22.9854 }],
        confidence: "verified"
      },
      east: {
        label: "Eastbound (towards Athens)",
        exit_name: "Λουτράκι", entry_name: "Αγ. Θεόδωροι",
        pre_exit:   { lat: 37.921986, lng: 22.990992 },
        off_ramp:   { lat: 37.924557, lng: 23.001337 },
        on_ramp:    { lat: 37.923720, lng: 23.120585 },
        post_merge: { lat: 37.929256, lng: 23.129571 },
        minutes: 13,
        via: [{ lat: 37.9145, lng: 22.9854 },{ lat: 37.916, lng: 23.040 },{ lat: 37.920, lng: 23.080 },{ lat: 37.9254, lng: 23.1368 }],
        confidence: "verified"
      },
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
    notes: "Near Corinth. Old road via Ancient Corinth.",
    bypass_directions: {
      west: {
        label: "Westbound (towards Patras)",
        exit_name: "Αρχ. Κόρινθος", entry_name: "Κιάτο",
        pre_exit:   { lat: 37.915961, lng: 22.891499 },
        off_ramp:   { lat: 37.913325, lng: 22.880630 },
        on_ramp:    { lat: 38.006894, lng: 22.735548 },
        post_merge: { lat: 38.015210, lng: 22.731201 },
        minutes: 15,
        via: [{ lat: 37.9123, lng: 22.8842 },{ lat: 37.930, lng: 22.860 },{ lat: 37.960, lng: 22.810 },{ lat: 38.0054, lng: 22.7421 }],
        confidence: "verified"
      },
      east: {
        label: "Eastbound (towards Athens)",
        exit_name: "Κιάτο", entry_name: "Αρχ. Κόρινθος",
        pre_exit:   { lat: 38.015167, lng: 22.731063 },
        off_ramp:   { lat: 38.006894, lng: 22.735548 },
        on_ramp:    { lat: 37.913325, lng: 22.880630 },
        post_merge: { lat: 37.915835, lng: 22.891565 },
        minutes: 15,
        via: [{ lat: 38.0054, lng: 22.7421 },{ lat: 37.960, lng: 22.810 },{ lat: 37.930, lng: 22.860 },{ lat: 37.9123, lng: 22.8842 }],
        confidence: "verified"
      },
    },
  },
  {
    id: "olympia_aigio",
    name_gr: "Διόδια Ελαιώνα / Αιγίου",
    name_en: "Elaionas / Aigio",
    highway: "A8", highway_name: "Olympia Odos (A8/E94)",
    operator: "Olympia Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.2057293, lng: 22.1392536,
    cat1: 1.20, cat2: 2.40, cat3: 4.80, cat4: 7.20,
    notes: "Halfway Athens–Patras. Old coastal road available.",
    bypass_directions: {
      west: {
        label: "Westbound (towards Patras)",
        exit_name: "Δερβένι", entry_name: "Αίγιο",
        pre_exit:   { lat: 38.129532, lng: 22.417006 },
        off_ramp:   { lat: 38.130865, lng: 22.405909 },
        on_ramp:    { lat: 38.222162, lng: 22.100968 },
        post_merge: { lat: 38.227085, lng: 22.091390 },
        minutes: 20,
        via: [{ lat: 38.1285, lng: 22.4185 },{ lat: 38.155, lng: 22.340 },{ lat: 38.180, lng: 22.250 },{ lat: 38.200, lng: 22.180 },{ lat: 38.2341, lng: 22.0912 }],
        confidence: "verified"
      },
      east: {
        label: "Eastbound (towards Athens)",
        exit_name: "Αίγιο", entry_name: "Δερβένι",
        pre_exit:   { lat: 38.226971, lng: 22.091295 },
        off_ramp:   { lat: 38.222162, lng: 22.100968 },
        on_ramp:    { lat: 38.130865, lng: 22.405909 },
        post_merge: { lat: 38.129376, lng: 22.416956 },
        minutes: 20,
        via: [{ lat: 38.2341, lng: 22.0912 },{ lat: 38.200, lng: 22.180 },{ lat: 38.180, lng: 22.250 },{ lat: 38.155, lng: 22.340 },{ lat: 38.1285, lng: 22.4185 }],
        confidence: "verified"
      },
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
      west: {
        label: "Westbound (towards Rio/Bridge)",
        exit_name: "Δρέπανο", entry_name: "Ρίο",
        pre_exit:   { lat: 38.324589, lng: 21.865335 },
        off_ramp:   { lat: 38.324251, lng: 21.854032 },
        on_ramp:    { lat: 38.298500, lng: 21.785400 },
        post_merge: { lat: 38.290444, lng: 21.778628 },
        minutes: 12,
        via: [{ lat: 38.3185, lng: 21.8485 },{ lat: 38.310, lng: 21.820 },{ lat: 38.2985, lng: 21.7854 }],
        confidence: "approximate"
      },
      east: {
        label: "Eastbound (towards Aigio)",
        exit_name: "Ρίο", entry_name: "Δρέπανο",
        pre_exit:   { lat: 38.290226, lng: 21.778829 },
        off_ramp:   { lat: 38.298500, lng: 21.785400 },
        on_ramp:    { lat: 38.324251, lng: 21.854032 },
        post_merge: { lat: 38.324461, lng: 21.865334 },
        minutes: 12,
        via: [{ lat: 38.2985, lng: 21.7854 },{ lat: 38.310, lng: 21.820 },{ lat: 38.3185, lng: 21.8485 }],
        confidence: "approximate"
      },
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
    notes: "Eastern approach to Patras.",
    bypass_directions: null,
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
    notes: "Southern terminus of Olympia Odos.",
    bypass_directions: null,
  },

  // ══════════════════════════════════════════════════════════
  // E65 · KENTRIKI ODOS · Lianokladi → Trikala
  // ══════════════════════════════════════════════════════════

  {
    id: "e65_lianokladi",
    name_gr: "Διόδια Λιανοκλαδίου",
    name_en: "Lianokladi",
    highway: "E65", highway_name: "Kentriki Odos (E65)",
    operator: "Kentriki Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 38.9148821, lng: 22.3487648,
    cat1: 1.20, cat2: 2.30, cat3: 4.60, cat4: 6.90,
    notes: "Southern terminus of Kentriki Odos. Near Lamia, junction with A1.",
    bypass_directions: null,
  },
  {
    id: "e65_sofades",
    name_gr: "Διόδια Σοφάδων",
    name_en: "Sofades",
    highway: "E65", highway_name: "Kentriki Odos (E65)",
    operator: "Kentriki Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 39.2566317, lng: 22.0831633,
    cat1: 0.98, cat2: 1.95, cat3: 3.90, cat4: 5.85,
    notes: "",
    bypass_directions: {
      north: {
        label: "Northbound (towards Trikala)",
        exit_name: "Ανάβρας", entry_name: "Σοφάδων",
        pre_exit:   { lat: 39.198475, lng: 22.077141 },
        off_ramp:   { lat: 39.207087, lng: 22.074090 },
        on_ramp:    { lat: 39.310875, lng: 22.064740 },
        post_merge: { lat: 39.318198, lng: 22.057989 },
        minutes: 15,
        confidence: "verified"
      },
      south: {
        label: "Southbound (towards Lamia)",
        exit_name: "Σοφάδων", entry_name: "Ανάβρας",
        pre_exit:   { lat: 39.318130, lng: 22.057871 },
        off_ramp:   { lat: 39.310875, lng: 22.064740 },
        on_ramp:    { lat: 39.207087, lng: 22.074090 },
        post_merge: { lat: 39.198466, lng: 22.077021 },
        minutes: 15,
        confidence: "verified"
      },
    },
  },
  {
    id: "e65_trikala",
    name_gr: "Διόδια Τρικάλων",
    name_en: "Trikala",
    highway: "E65", highway_name: "Kentriki Odos (E65)",
    operator: "Kentriki Odos",
    type: "frontal", direction_label: "Both directions",
    lat: 39.5204295, lng: 21.8322372,
    cat1: 1.00, cat2: 2.00, cat3: 4.00, cat4: 6.00,
    notes: "Northern terminus of Kentriki Odos.",
    bypass_directions: {
      north: {
        label: "Northbound (towards Trikala city)",
        exit_name: "Καρδίτσας", entry_name: "Τρικάλων",
        pre_exit:   { lat: 39.483472, lng: 21.870440 },
        off_ramp:   { lat: 39.485400, lng: 21.854200 },
        on_ramp:    { lat: 39.568233, lng: 21.814494 },
        post_merge: { lat: 39.566609, lng: 21.819893 },
        minutes: 12,
        via: [{ lat: 39.4854, lng: 21.8542 },{ lat: 39.510, lng: 21.830 },{ lat: 39.5584, lng: 21.7854 }],
        confidence: "approximate"
      },
      south: {
        label: "Southbound (towards Karditsa)",
        exit_name: "Τρικάλων", entry_name: "Καρδίτσας",
        exit:  { lat: 39.568233, lng: 21.814494 },
        entry: { lat: 39.4854, lng: 21.8542 },
        minutes: 12,
        via: [{ lat: 39.5584, lng: 21.7854 },{ lat: 39.510, lng: 21.830 },{ lat: 39.4854, lng: 21.8542 }],
        confidence: "approximate"
      },
    },
  },

  // ══════════════════════════════════════════════════════════
  // BRIDGE · Rio–Antirrio + Aktio
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
    notes: "2.88 km cable-stayed bridge. Toll only westbound. Return eastbound is free.",
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
    notes: "Flat-rate toll. Urban motorway — bypass via city streets adds 35+ min.",
    bypass_directions: null,
  },

  // ══════════════════════════════════════════════════════════
  // A7 · MOREAS · Corinth → Kalamata
  // ══════════════════════════════════════════════════════════

  {
    id: "moreas_corinth",
    name_gr: "Διόδια Σπαθοβουνίου / Κορίνθου",
    name_en: "Spathvounio / Corinth",
    highway: "A7", highway_name: "Moreas (A7)",
    operator: "Moreas SA",
    type: "frontal", direction_label: "Both directions",
    lat: 37.8359076, lng: 22.8079391,
    cat1: 1.05, cat2: 2.10, cat3: 4.20, cat4: 6.30,
    notes: "Start of Moreas motorway south of Corinth.",
    bypass_directions: null,
  },
  {
    id: "moreas_nestani",
    name_gr: "Διόδια Νεστάνης / Άργους",
    name_en: "Nestani / Argos",
    highway: "A7", highway_name: "Moreas (A7)",
    operator: "Moreas SA",
    type: "frontal", direction_label: "Both directions",
    lat: 37.6007682, lng: 22.4464524,
    cat1: 1.20, cat2: 2.40, cat3: 4.80, cat4: 7.20,
    notes: "Near ancient Mycenae. Exit for Nafplio.",
    bypass_directions: null,
  },
  {
    id: "moreas_petrina",
    name_gr: "Διόδια Πετρίνας / Τρίπολης",
    name_en: "Petrina / Tripoli",
    highway: "A7", highway_name: "Moreas (A7)",
    operator: "Moreas SA",
    type: "frontal", direction_label: "Both directions",
    lat: 37.2988500, lng: 22.2102678,
    cat1: 1.40, cat2: 2.80, cat3: 5.60, cat4: 8.40,
    notes: "Arcadian plateau. Junction for Sparta branch.",
    bypass_directions: null,
  },
  {
    id: "moreas_veligosti",
    name_gr: "Διόδια Βελιγοστής (διακλάδωση Σπάρτης)",
    name_en: "Veligosti / Sparta branch",
    highway: "A7", highway_name: "Moreas (A7) — Sparta spur",
    operator: "Moreas SA",
    type: "exit", direction_label: "Exit — towards Sparta / Mystras",
    lat: 37.3450082, lng: 22.1103072,
    cat1: 1.05, cat2: 2.10, cat3: 4.20, cat4: 6.30,
    notes: "Branch exit for Lefktro–Sparta.",
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
    bypass_directions: null,
  },

];

// ── Highway colour palette ────────────────────────────────
const HIGHWAY_COLORS = {
  "A1":     "#2a6b9e",  // Aegean blue — hero highway
  "A2":     "#5a4fa8",  // muted purple — Egnatia, the long traverse
  "A5":     "#c4613d",  // terracotta — Nea Odos
  "A8":     "#1e6b72",  // deep teal — Olympia, west coast
  "E65":    "#6b8a2e",  // olive — rural Thessaly
  "A7":     "#1e4f78",  // navy — Moreas / Peloponnese
  "A6":     "#9a6f1a",  // warm bronze — Attiki Odos
  "BRIDGE": "#b8502d",  // rust — bridges & tunnels
};

const TYPE_SHAPES = {
  frontal: "diamond",
  entry:   "triangle-up",
  exit:    "triangle-down",
  bridge:  "circle",
};

if (typeof module !== "undefined") module.exports = { TOLL_DATA, HIGHWAY_COLORS, TYPE_SHAPES };
