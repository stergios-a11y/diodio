/* ════════════════════════════════════════════════════════════════
   DIODIO — City pair routes
   Each route lists the toll booths a driver passes through, plus
   estimated drive distance/time on the motorway path.
   Toll prices come from TOLL_DATA at runtime, so this file stays
   stable when prices change.
   ════════════════════════════════════════════════════════════════ */

// Cities sorted alphabetically (Greek alphabetic) — used for the matrix display.
const CITIES = [
  { id: "athens",         name_gr: "Αθήνα",          name_en: "Athens",         lat: 37.9838, lng: 23.7275 },
  { id: "alexandroupoli", name_gr: "Αλεξανδρούπολη", name_en: "Alexandroupoli", lat: 40.8463, lng: 25.8743 },
  { id: "thessaloniki",   name_gr: "Θεσσαλονίκη",    name_en: "Thessaloniki",   lat: 40.6401, lng: 22.9444 },
  { id: "ioannina",       name_gr: "Ιωάννινα",       name_en: "Ioannina",       lat: 39.6650, lng: 20.8537 },
  { id: "igoumenitsa",    name_gr: "Ηγουμενίτσα",    name_en: "Igoumenitsa",    lat: 39.5046, lng: 20.2628 },
  { id: "kavala",         name_gr: "Καβάλα",         name_en: "Kavala",         lat: 40.9396, lng: 24.4069 },
  { id: "kalamata",       name_gr: "Καλαμάτα",       name_en: "Kalamata",       lat: 37.0389, lng: 22.1142 },
  { id: "kozani",         name_gr: "Κοζάνη",         name_en: "Kozani",         lat: 40.3006, lng: 21.7889 },
  { id: "lamia",          name_gr: "Λαμία",          name_en: "Lamia",          lat: 38.9000, lng: 22.4339 },
  { id: "larissa",        name_gr: "Λάρισα",         name_en: "Larissa",        lat: 39.6390, lng: 22.4191 },
  { id: "patras",         name_gr: "Πάτρα",          name_en: "Patras",         lat: 38.2466, lng: 21.7346 },
  { id: "pyrgos",         name_gr: "Πύργος",         name_en: "Pyrgos",         lat: 37.6739, lng: 21.4413 },
  { id: "serres",         name_gr: "Σέρρες",         name_en: "Serres",         lat: 41.0855, lng: 23.5481 },
  { id: "sparta",         name_gr: "Σπάρτη",         name_en: "Sparta",         lat: 37.0744, lng: 22.4314 },
  { id: "volos",          name_gr: "Βόλος",          name_en: "Volos",          lat: 39.3622, lng: 22.9420 },
  { id: "xanthi",         name_gr: "Ξάνθη",          name_en: "Xanthi",         lat: 41.1339, lng: 24.8884 },
];

// For each city pair (one direction, the other is symmetric for now),
// list which tolls you pass through and the on-motorway distance + time.
// IMPORTANT: tolls are listed in geographic order from origin → destination.
// km/min are estimates of the FASTEST motorway-only route.
const ROUTE_PAIRS = {
  // ── Athens hub ─────────────────────────────────
  "athens-thessaloniki": {
    tolls: ["a1_afidnes","a1_thiva","a1_traganas","a1_agios_konstantinos","a1_mavromantila","a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara"],
    km: 503, min: 290,
  },
  "athens-larissa": {
    tolls: ["a1_afidnes","a1_thiva","a1_traganas","a1_agios_konstantinos","a1_mavromantila","a1_pelasgia","a1_moschochori"],
    km: 357, min: 215,
  },
  "athens-volos": {
    tolls: ["a1_afidnes","a1_thiva","a1_traganas","a1_agios_konstantinos","a1_mavromantila","a1_pelasgia"],
    km: 326, min: 195,
  },
  "athens-lamia": {
    tolls: ["a1_afidnes","a1_thiva","a1_traganas","a1_agios_konstantinos"],
    km: 217, min: 130,
  },
  "athens-patras": {
    tolls: ["olympia_elefsina","olympia_isthmos_canal","olympia_isthmos","olympia_aigio","olympia_rio","olympia_patras"],
    km: 213, min: 130,
  },
  "athens-pyrgos": {
    tolls: ["olympia_elefsina","olympia_isthmos_canal","olympia_isthmos","olympia_aigio","olympia_rio","olympia_patras","olympia_pyrgos"],
    km: 309, min: 190,
  },
  "athens-kalamata": {
    tolls: ["olympia_elefsina","moreas_corinth","moreas_nestani","moreas_petrina","moreas_kalamata"],
    km: 287, min: 175,
  },
  "athens-sparta": {
    tolls: ["olympia_elefsina","moreas_corinth","moreas_nestani","moreas_petrina","moreas_veligosti"],
    km: 245, min: 165,
  },
  "athens-ioannina": {
    tolls: ["olympia_elefsina","olympia_isthmos_canal","olympia_isthmos","olympia_aigio","olympia_rio","rioantirrio","ionia_klokova","ionia_aggelokastro","ionia_menidi","ionia_terovos"],
    km: 446, min: 290,
  },
  "athens-igoumenitsa": {
    tolls: ["olympia_elefsina","olympia_isthmos_canal","olympia_isthmos","olympia_aigio","olympia_rio","rioantirrio","ionia_klokova","ionia_aggelokastro","ionia_menidi","ionia_terovos","egnatia_ioannina","egnatia_igoumenitsa"],
    km: 528, min: 350,
  },
  "athens-kozani": {
    tolls: ["a1_afidnes","a1_thiva","a1_traganas","a1_agios_konstantinos","a1_mavromantila","a1_pelasgia","a1_moschochori","e65_lianokladi","egnatia_kozani"],
    km: 460, min: 290,
  },
  "athens-kavala": {
    tolls: ["a1_afidnes","a1_thiva","a1_traganas","a1_agios_konstantinos","a1_mavromantila","a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi","a1_moustheni"],
    km: 670, min: 390,
  },
  "athens-serres": {
    tolls: ["a1_afidnes","a1_thiva","a1_traganas","a1_agios_konstantinos","a1_mavromantila","a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara"],
    km: 575, min: 340,
  },
  "athens-xanthi": {
    tolls: ["a1_afidnes","a1_thiva","a1_traganas","a1_agios_konstantinos","a1_mavromantila","a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi","a1_moustheni","egnatia_xanthi"],
    km: 730, min: 430,
  },
  "athens-alexandroupoli": {
    tolls: ["a1_afidnes","a1_thiva","a1_traganas","a1_agios_konstantinos","a1_mavromantila","a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi","a1_moustheni","egnatia_xanthi","egnatia_komotini","egnatia_alexandroupoli"],
    km: 870, min: 510,
  },

  // ── Thessaloniki hub ──────────────────────────
  "thessaloniki-larissa": {
    tolls: ["a1_makrychori","a1_leptokarya","a1_kleidi"],
    km: 152, min: 95,
  },
  "thessaloniki-volos": {
    tolls: ["a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi"],
    km: 217, min: 130,
  },
  "thessaloniki-lamia": {
    tolls: ["a1_traganas","a1_agios_konstantinos","a1_mavromantila","a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara"],
    km: 286, min: 175,
  },
  "thessaloniki-patras": {
    tolls: ["a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","olympia_elefsina","olympia_isthmos_canal","olympia_isthmos","olympia_aigio","olympia_rio","olympia_patras"],
    km: 600, min: 380,
  },
  "thessaloniki-pyrgos": {
    tolls: ["a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","olympia_elefsina","olympia_isthmos_canal","olympia_isthmos","olympia_aigio","olympia_rio","olympia_patras","olympia_pyrgos"],
    km: 696, min: 440,
  },
  "thessaloniki-kalamata": {
    tolls: ["a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","olympia_elefsina","moreas_corinth","moreas_nestani","moreas_petrina","moreas_kalamata"],
    km: 720, min: 460,
  },
  "thessaloniki-sparta": {
    tolls: ["a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","olympia_elefsina","moreas_corinth","moreas_nestani","moreas_petrina","moreas_veligosti"],
    km: 700, min: 450,
  },
  "thessaloniki-ioannina": {
    tolls: ["egnatia_ioannina"],
    km: 264, min: 175,
  },
  "thessaloniki-igoumenitsa": {
    tolls: ["egnatia_ioannina","egnatia_igoumenitsa"],
    km: 360, min: 230,
  },
  "thessaloniki-kozani": {
    tolls: ["egnatia_kozani"],
    km: 124, min: 80,
  },
  "thessaloniki-kavala": {
    tolls: ["a1_analipsi","a1_moustheni"],
    km: 167, min: 105,
  },
  "thessaloniki-serres": {
    tolls: ["a1_analipsi"],
    km: 95, min: 65,
  },
  "thessaloniki-xanthi": {
    tolls: ["a1_analipsi","a1_moustheni","egnatia_xanthi"],
    km: 232, min: 150,
  },
  "thessaloniki-alexandroupoli": {
    tolls: ["a1_analipsi","a1_moustheni","egnatia_xanthi","egnatia_komotini","egnatia_alexandroupoli"],
    km: 360, min: 220,
  },

  // ── Larissa cluster ──────────────────────────
  "larissa-volos": { tolls: [], km: 65, min: 50 },
  "larissa-lamia": { tolls: ["a1_pelasgia","a1_moschochori"], km: 145, min: 90 },
  "larissa-ioannina": { tolls: ["egnatia_metsovo"], km: 240, min: 180 },
  "larissa-igoumenitsa": { tolls: ["egnatia_metsovo","egnatia_ioannina","egnatia_igoumenitsa"], km: 340, min: 240 },
  "larissa-kozani": { tolls: ["egnatia_metsovo","egnatia_veroia"], km: 165, min: 130 },
  "larissa-patras": {
    tolls: ["a1_pelasgia","a1_moschochori","olympia_elefsina","olympia_isthmos_canal","olympia_isthmos","olympia_aigio","olympia_rio","olympia_patras"],
    km: 460, min: 290,
  },
  "larissa-pyrgos": {
    tolls: ["a1_pelasgia","a1_moschochori","olympia_elefsina","olympia_isthmos_canal","olympia_isthmos","olympia_aigio","olympia_rio","olympia_patras","olympia_pyrgos"],
    km: 555, min: 350,
  },
  "larissa-kalamata": {
    tolls: ["a1_pelasgia","a1_moschochori","olympia_elefsina","moreas_corinth","moreas_nestani","moreas_petrina","moreas_kalamata"],
    km: 580, min: 380,
  },
  "larissa-sparta": {
    tolls: ["a1_pelasgia","a1_moschochori","olympia_elefsina","moreas_corinth","moreas_nestani","moreas_petrina","moreas_veligosti"],
    km: 545, min: 360,
  },
  "larissa-kavala": { tolls: ["a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi","a1_moustheni"], km: 322, min: 215 },
  "larissa-serres": { tolls: ["a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi"], km: 248, min: 165 },
  "larissa-xanthi": { tolls: ["a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi","a1_moustheni","egnatia_xanthi"], km: 385, min: 260 },
  "larissa-alexandroupoli": { tolls: ["a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi","a1_moustheni","egnatia_xanthi","egnatia_komotini","egnatia_alexandroupoli"], km: 515, min: 330 },

  // ── Volos ────────────────────────────────────
  "volos-lamia":      { tolls: ["a1_pelasgia"], km: 110, min: 75 },
  "volos-ioannina":   { tolls: ["egnatia_metsovo"], km: 305, min: 215 },
  "volos-igoumenitsa": { tolls: ["egnatia_metsovo","egnatia_ioannina","egnatia_igoumenitsa"], km: 405, min: 270 },
  "volos-kozani":     { tolls: ["egnatia_metsovo","egnatia_veroia"], km: 230, min: 165 },
  "volos-patras":     { tolls: ["a1_pelasgia","olympia_elefsina","olympia_isthmos_canal","olympia_isthmos","olympia_aigio","olympia_rio","olympia_patras"], km: 425, min: 270 },
  "volos-pyrgos":     { tolls: ["a1_pelasgia","olympia_elefsina","olympia_isthmos_canal","olympia_isthmos","olympia_aigio","olympia_rio","olympia_patras","olympia_pyrgos"], km: 520, min: 330 },
  "volos-kalamata":   { tolls: ["a1_pelasgia","olympia_elefsina","moreas_corinth","moreas_nestani","moreas_petrina","moreas_kalamata"], km: 545, min: 360 },
  "volos-sparta":     { tolls: ["a1_pelasgia","olympia_elefsina","moreas_corinth","moreas_nestani","moreas_petrina","moreas_veligosti"], km: 510, min: 340 },
  "volos-kavala":     { tolls: ["a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi","a1_moustheni"], km: 380, min: 245 },
  "volos-serres":     { tolls: ["a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi"], km: 305, min: 200 },
  "volos-xanthi":     { tolls: ["a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi","a1_moustheni","egnatia_xanthi"], km: 445, min: 290 },
  "volos-alexandroupoli": { tolls: ["a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi","a1_moustheni","egnatia_xanthi","egnatia_komotini","egnatia_alexandroupoli"], km: 575, min: 360 },

  // ── Lamia ───────────────────────────────────
  "lamia-ioannina":   { tolls: ["e65_lianokladi","ionia_aggelokastro","ionia_menidi","ionia_terovos"], km: 295, min: 200 },
  "lamia-igoumenitsa": { tolls: ["e65_lianokladi","ionia_aggelokastro","ionia_menidi","ionia_terovos","egnatia_ioannina","egnatia_igoumenitsa"], km: 380, min: 260 },
  "lamia-kozani":     { tolls: ["e65_lianokladi","egnatia_kozani"], km: 270, min: 195 },
  "lamia-patras":     { tolls: ["olympia_elefsina","olympia_isthmos_canal","olympia_isthmos","olympia_aigio","olympia_rio","olympia_patras"], km: 290, min: 200 },
  "lamia-pyrgos":     { tolls: ["olympia_elefsina","olympia_isthmos_canal","olympia_isthmos","olympia_aigio","olympia_rio","olympia_patras","olympia_pyrgos"], km: 380, min: 260 },
  "lamia-kalamata":   { tolls: ["olympia_elefsina","moreas_corinth","moreas_nestani","moreas_petrina","moreas_kalamata"], km: 415, min: 280 },
  "lamia-sparta":     { tolls: ["olympia_elefsina","moreas_corinth","moreas_nestani","moreas_petrina","moreas_veligosti"], km: 380, min: 270 },
  "lamia-kavala":     { tolls: ["a1_mavromantila","a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi","a1_moustheni"], km: 470, min: 295 },
  "lamia-serres":     { tolls: ["a1_mavromantila","a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi"], km: 395, min: 250 },
  "lamia-xanthi":     { tolls: ["a1_mavromantila","a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi","a1_moustheni","egnatia_xanthi"], km: 535, min: 340 },
  "lamia-alexandroupoli": { tolls: ["a1_mavromantila","a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi","a1_moustheni","egnatia_xanthi","egnatia_komotini","egnatia_alexandroupoli"], km: 665, min: 415 },

  // ── Patras hub ──────────────────────────────
  "patras-pyrgos":      { tolls: ["olympia_pyrgos"], km: 100, min: 60 },
  "patras-kalamata":    { tolls: ["moreas_corinth","moreas_nestani","moreas_petrina","moreas_kalamata"], km: 220, min: 150 },
  "patras-sparta":      { tolls: ["moreas_corinth","moreas_nestani","moreas_petrina","moreas_veligosti"], km: 260, min: 175 },
  "patras-ioannina":    { tolls: ["rioantirrio","ionia_klokova","ionia_aggelokastro","ionia_menidi","ionia_terovos"], km: 232, min: 165 },
  "patras-igoumenitsa": { tolls: ["rioantirrio","ionia_klokova","ionia_aggelokastro","ionia_menidi","ionia_terovos","egnatia_ioannina","egnatia_igoumenitsa"], km: 320, min: 220 },
  "patras-kozani":      { tolls: ["rioantirrio","ionia_klokova","ionia_aggelokastro","ionia_menidi","ionia_terovos","egnatia_ioannina","egnatia_metsovo","egnatia_veroia","egnatia_kozani"], km: 470, min: 340 },
  "patras-kavala":      { tolls: ["olympia_patras","olympia_rio","olympia_aigio","olympia_isthmos","olympia_isthmos_canal","olympia_elefsina","a1_thiva","a1_traganas","a1_agios_konstantinos","a1_mavromantila","a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi","a1_moustheni"], km: 770, min: 480 },
  "patras-serres":      { tolls: ["olympia_patras","olympia_rio","olympia_aigio","olympia_isthmos","olympia_isthmos_canal","olympia_elefsina","a1_thiva","a1_traganas","a1_agios_konstantinos","a1_mavromantila","a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi"], km: 700, min: 440 },
  "patras-xanthi":      { tolls: ["olympia_patras","olympia_rio","olympia_aigio","olympia_isthmos","olympia_isthmos_canal","olympia_elefsina","a1_thiva","a1_traganas","a1_agios_konstantinos","a1_mavromantila","a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi","a1_moustheni","egnatia_xanthi"], km: 835, min: 525 },
  "patras-alexandroupoli": { tolls: ["olympia_patras","olympia_rio","olympia_aigio","olympia_isthmos","olympia_isthmos_canal","olympia_elefsina","a1_thiva","a1_traganas","a1_agios_konstantinos","a1_mavromantila","a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi","a1_moustheni","egnatia_xanthi","egnatia_komotini","egnatia_alexandroupoli"], km: 970, min: 600 },

  // ── Pyrgos ──────────────────────────────────
  "pyrgos-kalamata":   { tolls: ["olympia_pyrgos","moreas_corinth","moreas_nestani","moreas_petrina","moreas_kalamata"], km: 280, min: 195 },
  "pyrgos-sparta":     { tolls: ["olympia_pyrgos","moreas_corinth","moreas_nestani","moreas_petrina","moreas_veligosti"], km: 285, min: 215 },
  "pyrgos-ioannina":   { tolls: ["olympia_patras","rioantirrio","ionia_klokova","ionia_aggelokastro","ionia_menidi","ionia_terovos"], km: 330, min: 230 },
  "pyrgos-igoumenitsa": { tolls: ["olympia_patras","rioantirrio","ionia_klokova","ionia_aggelokastro","ionia_menidi","ionia_terovos","egnatia_ioannina","egnatia_igoumenitsa"], km: 415, min: 285 },
  "pyrgos-kozani":     { tolls: ["olympia_patras","rioantirrio","ionia_klokova","ionia_aggelokastro","ionia_menidi","ionia_terovos","egnatia_ioannina","egnatia_metsovo","egnatia_veroia","egnatia_kozani"], km: 565, min: 405 },
  "pyrgos-kavala":     { tolls: ["olympia_pyrgos","olympia_patras","olympia_rio","olympia_aigio","olympia_isthmos","olympia_isthmos_canal","olympia_elefsina","a1_thiva","a1_traganas","a1_agios_konstantinos","a1_mavromantila","a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi","a1_moustheni"], km: 870, min: 540 },
  "pyrgos-serres":     { tolls: ["olympia_pyrgos","olympia_patras","olympia_rio","olympia_aigio","olympia_isthmos","olympia_isthmos_canal","olympia_elefsina","a1_thiva","a1_traganas","a1_agios_konstantinos","a1_mavromantila","a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi"], km: 800, min: 500 },
  "pyrgos-xanthi":     { tolls: ["olympia_pyrgos","olympia_patras","olympia_rio","olympia_aigio","olympia_isthmos","olympia_isthmos_canal","olympia_elefsina","a1_thiva","a1_traganas","a1_agios_konstantinos","a1_mavromantila","a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi","a1_moustheni","egnatia_xanthi"], km: 935, min: 580 },
  "pyrgos-alexandroupoli": { tolls: ["olympia_pyrgos","olympia_patras","olympia_rio","olympia_aigio","olympia_isthmos","olympia_isthmos_canal","olympia_elefsina","a1_thiva","a1_traganas","a1_agios_konstantinos","a1_mavromantila","a1_pelasgia","a1_moschochori","a1_makrychori","a1_leptokarya","a1_kleidi","a1_malgara","a1_analipsi","a1_moustheni","egnatia_xanthi","egnatia_komotini","egnatia_alexandroupoli"], km: 1065, min: 660 },

  // ── Kalamata ────────────────────────────────
  "kalamata-sparta": { tolls: ["moreas_petrina","moreas_veligosti"], km: 80, min: 75 },

  // ── Sparta ──────────────────────────────────
  // (only Athens, Patras, Thessaloniki, etc. via Moreas covered above)

  // ── Ioannina hub ────────────────────────────
  "ioannina-igoumenitsa": { tolls: ["egnatia_igoumenitsa"], km: 100, min: 75 },
  "ioannina-kozani":      { tolls: ["egnatia_metsovo","egnatia_veroia","egnatia_kozani"], km: 195, min: 150 },
  "ioannina-kavala":      { tolls: ["egnatia_metsovo","egnatia_veroia","egnatia_kozani","egnatia_thessaloniki_west","a1_analipsi","a1_moustheni"], km: 410, min: 300 },
  "ioannina-serres":      { tolls: ["egnatia_metsovo","egnatia_veroia","egnatia_kozani","egnatia_thessaloniki_west","a1_analipsi"], km: 360, min: 260 },
  "ioannina-xanthi":      { tolls: ["egnatia_metsovo","egnatia_veroia","egnatia_kozani","egnatia_thessaloniki_west","a1_analipsi","a1_moustheni","egnatia_xanthi"], km: 480, min: 350 },
  "ioannina-alexandroupoli": { tolls: ["egnatia_metsovo","egnatia_veroia","egnatia_kozani","egnatia_thessaloniki_west","a1_analipsi","a1_moustheni","egnatia_xanthi","egnatia_komotini","egnatia_alexandroupoli"], km: 615, min: 425 },

  // ── Igoumenitsa ─────────────────────────────
  "igoumenitsa-kozani": { tolls: ["egnatia_ioannina","egnatia_metsovo","egnatia_veroia","egnatia_kozani"], km: 290, min: 215 },
  "igoumenitsa-kavala": { tolls: ["egnatia_ioannina","egnatia_metsovo","egnatia_veroia","egnatia_kozani","egnatia_thessaloniki_west","a1_analipsi","a1_moustheni"], km: 500, min: 360 },
  "igoumenitsa-serres": { tolls: ["egnatia_ioannina","egnatia_metsovo","egnatia_veroia","egnatia_kozani","egnatia_thessaloniki_west","a1_analipsi"], km: 450, min: 320 },
  "igoumenitsa-xanthi": { tolls: ["egnatia_ioannina","egnatia_metsovo","egnatia_veroia","egnatia_kozani","egnatia_thessaloniki_west","a1_analipsi","a1_moustheni","egnatia_xanthi"], km: 580, min: 410 },
  "igoumenitsa-alexandroupoli": { tolls: ["egnatia_ioannina","egnatia_metsovo","egnatia_veroia","egnatia_kozani","egnatia_thessaloniki_west","a1_analipsi","a1_moustheni","egnatia_xanthi","egnatia_komotini","egnatia_alexandroupoli"], km: 715, min: 490 },

  // ── Kozani ──────────────────────────────────
  "kozani-kavala": { tolls: ["egnatia_thessaloniki_west","a1_analipsi","a1_moustheni"], km: 280, min: 190 },
  "kozani-serres": { tolls: ["egnatia_thessaloniki_west","a1_analipsi"], km: 215, min: 150 },
  "kozani-xanthi": { tolls: ["egnatia_thessaloniki_west","a1_analipsi","a1_moustheni","egnatia_xanthi"], km: 350, min: 245 },
  "kozani-alexandroupoli": { tolls: ["egnatia_thessaloniki_west","a1_analipsi","a1_moustheni","egnatia_xanthi","egnatia_komotini","egnatia_alexandroupoli"], km: 480, min: 320 },

  // ── Eastern Greece cluster ──────────────────
  "kavala-serres":         { tolls: ["a1_moustheni"], km: 80, min: 60 },
  "kavala-xanthi":         { tolls: ["egnatia_xanthi"], km: 75, min: 55 },
  "kavala-alexandroupoli": { tolls: ["egnatia_xanthi","egnatia_komotini","egnatia_alexandroupoli"], km: 200, min: 130 },
  "serres-xanthi":         { tolls: ["a1_moustheni","egnatia_xanthi"], km: 145, min: 100 },
  "serres-alexandroupoli": { tolls: ["a1_moustheni","egnatia_xanthi","egnatia_komotini","egnatia_alexandroupoli"], km: 270, min: 175 },
  "xanthi-alexandroupoli": { tolls: ["egnatia_komotini","egnatia_alexandroupoli"], km: 130, min: 80 },
};

// Helper: look up a route between two city ids (order-independent).
function getRoute(fromId, toId) {
  if (fromId === toId) return null;
  return ROUTE_PAIRS[`${fromId}-${toId}`] || ROUTE_PAIRS[`${toId}-${fromId}`] || null;
}

if (typeof module !== "undefined") module.exports = { CITIES, ROUTE_PAIRS, getRoute };
