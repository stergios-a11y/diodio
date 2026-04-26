/**
 * DIODIO — i18n.js
 * Language toggle: Greek (el) ⇄ English (en).
 * Default: el. Preference saved to localStorage.
 */

const STRINGS = {
  el: {
    'title':                   'DIODIO — Οδηγός Διοδίων Ελλάδας',
    'tagline':                 'Χάρτης διοδίων & σύμβουλος διαδρομής',
    'btn.legend.hide':         'Απόκρυψη',
    'btn.legend.show':         'Υπόμνημα',
    'btn.help':                'Οδηγίες χρήσης',
    'legend.title':            'Φίλτρο διοδίων ανά αυτοκινητόδρομο',
    'legend.ramps.title':      'Κόμβοι εξόδου & εισόδου',
    'legend.ramps.exit':       'Κόμβος εξόδου',
    'legend.ramps.entry':      'Κόμβος εισόδου',
    'legend.tollnames.title':  'Ονόματα διοδίων',
    'help.subtitle':           'Οδηγός Διοδίων Ελλάδας',
    'help.section1.title':     'Εξερεύνηση σταθμού διοδίων',
    'help.section1.intro':     'Κάθε τετραγωνικό σημείο στον χάρτη είναι σταθμός διοδίων. <strong>Τοποθέτησε</strong> τον κέρσορα για να δεις τιμές. <strong>Κλικ</strong> για να ανοίξεις λεπτομερές παράθυρο με:',
    'help.section1.item1':     'Τιμές για 4 κατηγορίες οχημάτων',
    'help.section1.item2':     'Σε ποια κατεύθυνση πληρώνεις',
    'help.section1.item3':     'Επιλογές παράκαμψης — ονόματα κόμβων εξόδου/εισόδου και επιπλέον χρόνος',
    'help.section1.item4':     'Η διαδρομή παράκαμψης σε πράσινο στον χάρτη',
    'help.section1.close':     'Κλικ οπουδήποτε στον χάρτη για κλείσιμο.',
    'help.section2.title':     'Ανάλυση διαδρομής',
    'help.section2.intro':     'Χρησιμοποίησε τη γραμμή στο κάτω μέρος για εξατομικευμένες συμβουλές:',
    'help.section2.item1':     'Εισάγαγε <strong>αφετηρία</strong> και <strong>προορισμό</strong>',
    'help.section2.item2':     'Επίλεξε <strong>τύπο οχήματος</strong>',
    'help.section2.item3':     'Όρισε την <strong>αξία χρόνου</strong> — πόσα λεπτά επιπλέον οδήγησης δέχεσαι για να εξοικονομήσεις €1. Στα 10 λεπτά/€1 ο χρόνος σου αξίζει €6/ώρα.',
    'help.section2.item4':     'Πάτησε <strong>Ανάλυση</strong>',
    'help.section2.outro':     'Η εφαρμογή σχεδιάζει τη διαδρομή σου, εντοπίζει κάθε διόδιο και σου λέει ποια αξίζει να πληρώσεις και ποια να παρακάμψεις.',
    'help.legend.avoid':       'Πράσινο = παράκαμψη',
    'help.legend.pay':         'μπλε = πλήρωσε',
    'help.legend.marginal':    'κίτρινο = οριακό',
    'help.tip':                '💡 <strong>Συμβουλή:</strong> Οι διαδρομές παράκαμψης βασίζονται στον Οδηγό Αποφυγής Διοδίων 2026. Επιβεβαίωσε πάντα με Google Maps πριν ακολουθήσεις άγνωστη διαδρομή.',
    'help.cta':                'Εντάξει, δείξε μου τον χάρτη',
    'sp.header':               'Στοιχεία διοδίου',
    'sp.close':                '✕ Κλείσιμο',
    'sp.prices':               'Τιμές διοδίων',
    'sp.direction':            'Κατεύθυνση',
    'sp.bypass':               'Παράκαμψη',
    'sp.no.bypass':            '⛔ Δεν υπάρχει πρακτική παράκαμψη για αυτό το διόδιο.',
    'sp.bypass.options':       '🟢 Επιλογές παράκαμψης',
    'sp.motorcycle':           'Μοτοσικλέτα',
    'sp.car':                  'Αυτοκίνητο',
    'sp.van':                  'Ελαφρύ φορτηγό / Βαν',
    'sp.truck':                'Βαρύ φορτηγό',
    'sp.exit.tag':             '↙ Έξοδος: ',
    'sp.entry.tag':            '↗ Επανείσοδος: ',
    'sp.detour':               '+{n} λεπτά',
    'dir.both':                'Και στις δύο κατευθύνσεις',
    'dir.north':               'Βόρεια κατεύθυνση',
    'dir.south':               'Νότια κατεύθυνση',
    'dir.east':                'Ανατολική κατεύθυνση',
    'dir.west':                'Δυτική κατεύθυνση',
    'dir.north.to':            'Βόρεια (προς {dest})',
    'dir.south.to':            'Νότια (προς {dest})',
    'dir.east.to':             'Ανατολικά (προς {dest})',
    'dir.west.to':             'Δυτικά (προς {dest})',
    'dir.west.free':           'Μόνο δυτική κατεύθυνση. Ανατολικά είναι ΔΩΡΕΑΝ.',
    'dir.south.border':        'Νότια (είσοδος από {dest})',
    'dir.west.border':         'Δυτικά (είσοδος από {dest})',
    'dir.exit.to':             'Έξοδος — προς {dest}',
    'dir.entry.once':          'Πληρωμή μία φορά στην είσοδο — καλύπτει όλη τη διαδρομή',
    'rp.title':                'Ανάλυση Διαδρομής',
    'rp.advice.loading':       '💡 Υπολογισμός συμβουλής διαδρομής…',
    'rp.total':                'Σύνολο',
    'rp.save':                 'Κέρδος',
    'rp.extra':                'επιπλέον',
    'bar.from':                'Από',
    'bar.to':                  'Προς',
    'bar.swap':                'Αντιστροφή διαδρομής',
    'bar.moto':                '🏍 Μοτο',
    'bar.car':                 '🚗 Αυτοκίνητο',
    'bar.van':                 '🚐 Βαν',
    'bar.truck':               '🚛 Φορτηγό',
    'bar.analyse':             'Ανάλυση',
    'bar.analysing':           'Αναλύω…',
    'bar.time.label1':         '€1 =',
    'bar.time.label2':         'λεπ',
    'err.missing':             'Εισάγετε αφετηρία και προορισμό',
    'err.geocode':             'Δεν βρέθηκε "{name}" στον χάρτη',
    'err.route':               'Δεν ήταν δυνατός ο υπολογισμός διαδρομής',
    'err.no.tolls':            'Δεν βρέθηκαν διόδια σε αυτή τη διαδρομή',
    'hover.click.details':     'κλικ για λεπτομέρειες',
    'verdict.pay':             'ΠΛΗΡΩΣΕ',
    'verdict.avoid':           'ΑΠΟΦΥΓΕ',
    'verdict.marginal':        'ΟΡΙΑΚΟ',
    'verdict.avoid.reason':    'Έξοδος {exit}, είσοδος {entry}. +{min} λεπτά εξοικονόμηση €{cost}.',
    'verdict.marginal.reason': 'Έξοδος {exit}. +{min} λεπτά — οριακή περίπτωση.',
    'verdict.pay.reason':      'Η παράκαμψη προσθέτει {min} λεπτά — δεν αξίζει. Πλήρωσε.',
    'verdict.no.bypass':       'Δεν υπάρχει παράκαμψη.',
    'verdict.no.bypass.short': 'Χωρίς παράκαμψη',
    'ramp.exit.label':         'ΕΞΟΔΟΣ',
    'ramp.entry.label':        'ΕΠΑΝΕΙΣΟΔΟΣ',
    'ramp.exit.tooltip':       'ΕΞΟΔΟΣ: {name}',
    'ramp.entry.tooltip':      'ΕΙΣΟΔΟΣ: {name}',
    'ramp.avoid':              'Παράκαμψη: {toll}',
    'bypass.tooltip':          'Παράκαμψη: έξοδος {exit} → είσοδος {entry} (+{min} λεπτά)',
    'toll.section.tooltip':    '🟠 Τμήμα με διόδιο',
    'nav.map':                 'Χάρτης',
    'nav.routes':              'Διαδρομές',
    'nav.tolls':               'Διόδια',
    'routes.title':            'Διαδρομές μεταξύ πόλεων',
    'routes.subtitle':         'Συνολικό κόστος διοδίων και χρόνος διαδρομής για κάθε ζεύγος πόλεων.',
    'routes.vehicle':          'Όχημα',
    'routes.toll':             'διόδιο',
    'routes.tolls':            'διόδια',
    'routes.hr':               'ώ',
    'routes.min':              'λ',
    'tolls.title':             'Όλα τα διόδια',
    'tolls.subtitle':          'Τιμές, αυτοκινητόδρομος, και χρόνος παράκαμψης ανά κατεύθυνση.',
    'tolls.search':            'Αναζήτηση…',
    'tolls.allhighways':       'Όλοι οι αυτοκινητόδρομοι',
    'tolls.col.name':          'Διόδιο',
    'tolls.col.highway':       'Αυτοκινητόδρομος',
    'tolls.col.bypass':        'Παράκαμψη',
    'tolls.bypass.none':       '—',
    'btn.feedback':            '💬 Σχόλια',
    'btn.feedback.short':      'Σχόλια',
    'btn.feedback.title':      'Στείλε σχόλια ή αναφορά',
    'control.ramps':           'Κόμβοι εξόδου/εισόδου',
    'control.tollnames':       'Ονόματα διοδίων',
    'legend.ramps.on':         'On',
    'legend.ramps.off':        'Off',
    'compare.bypass':          'Παράκαμψη',
    'compare.highway':         'Με διόδιο',
    'compare.diff':            'Διαφορά',
    'compare.loading':         'φόρτωση…',
    'compare.unavailable':     'μη διαθέσιμο',
    'sp.showing':              'Επιλεγμένη κατεύθυνση',
    'filter.both':             'Και τα δύο',
    'bypass.via.local':        'Μέσω τοπικού δρόμου',
    'bypass.via.highway':      'Μέσω αυτοκινητοδρόμου',
    'lang.toggle':             'EN',
    // Legend group labels
    'hwy.A1':                  'ΠΑΘΕ (A1)',
    'hwy.A1.sub':              'Αφίδνες → Μάλγαρα',
    'hwy.A2':                  'Εγνατία Οδός (A2)',
    'hwy.A2.sub':              'Ηγουμενίτσα → Αρδάνιο',
    'hwy.A5':                  'Νέα Οδός (A5)',
    'hwy.A5.sub':              'Κλόκοβα → Τέροβο',
    'hwy.A8':                  'Ολυμπία Οδός (A8)',
    'hwy.A8.sub':              'Ελευσίνα → Πύργος',
    'hwy.E65':                 'Κεντρική Οδός (E65)',
    'hwy.E65.sub':             'Λιανοκλάδι → Τρίκαλα',
    'hwy.A7':                  'Μορέας (A7)',
    'hwy.A7.sub':              'Κόρινθος → Καλαμάτα',
    'hwy.A6':                  'Αττική Οδός (A6)',
    'hwy.A6.sub':              'Περιφερειακός Αθηνών',
    'hwy.BRIDGE':              'Γέφυρες & Τούνελ',
    'hwy.BRIDGE.sub':          'Ρίο–Αντίρριο · Ακτιο',
  },

  en: {
    'title':                   'DIODIO — Greece Toll Road Advisor',
    'tagline':                 'Greek highway toll map & route advisor',
    'btn.legend.hide':         'Hide legend',
    'btn.legend.show':         'Legend',
    'btn.help':                'How to use',
    'legend.title':            'Filter tolls by motorway',
    'legend.ramps.title':      'Exit & Entry ramps',
    'legend.ramps.exit':       'Exit ramp (leave motorway)',
    'legend.ramps.entry':      'Entry ramp (rejoin motorway)',
    'legend.tollnames.title':  'Toll names',
    'help.subtitle':           'Greece Toll Road Advisor',
    'help.section1.title':     'Explore any toll booth',
    'help.section1.intro':     'Every diamond marker on the map is a toll station. <strong>Hover</strong> over any marker to see prices for motorcycles, cars and vans. <strong>Click</strong> any marker to open a detailed panel showing:',
    'help.section1.item1':     'Prices for all 4 vehicle categories',
    'help.section1.item2':     'Which direction(s) you pay',
    'help.section1.item3':     'Bypass options — the exact exit and entry ramp names, with the extra time per direction',
    'help.section1.item4':     'The bypass route drawn in green on the map',
    'help.section1.close':     'Click anywhere on the map to close the panel.',
    'help.section2.title':     'Analyse a route',
    'help.section2.intro':     'Use the bar at the bottom for personalised advice on any journey:',
    'help.section2.item1':     'Enter your <strong>origin</strong> and <strong>destination</strong>',
    'help.section2.item2':     'Select your <strong>vehicle type</strong>',
    'help.section2.item3':     'Set your <strong>time value</strong> — how many minutes of extra driving you\'d accept to save €1. At 10 min/€1 your time is worth €6/hr.',
    'help.section2.item4':     'Press <strong>Analyse</strong>',
    'help.section2.outro':     'The app draws your route, finds every toll on it, and tells you which are worth paying and which to bypass.',
    'help.legend.avoid':       'Green = avoid',
    'help.legend.pay':         'blue = pay',
    'help.legend.marginal':    'yellow = marginal',
    'help.tip':                '💡 <strong>Tip:</strong> Bypass routes are based on the 2026 Greek toll avoidance guide. Always verify with Google Maps before taking an unfamiliar detour.',
    'help.cta':                'Got it, show me the map',
    'sp.header':               'Toll details',
    'sp.close':                '✕ Close',
    'sp.prices':               'Toll prices',
    'sp.direction':            'Direction',
    'sp.bypass':               'Bypass',
    'sp.no.bypass':            '⛔ No practical bypass available for this toll.',
    'sp.bypass.options':       '🟢 Bypass options',
    'sp.motorcycle':           'Motorcycle',
    'sp.car':                  'Car',
    'sp.van':                  'Light truck / Van',
    'sp.truck':                'Heavy truck',
    'sp.exit.tag':             '↙ Exit: ',
    'sp.entry.tag':            '↗ Re-enter: ',
    'sp.detour':               '+{n} min',
    'dir.both':                'Both directions',
    'dir.north':               'Northbound',
    'dir.south':               'Southbound',
    'dir.east':                'Eastbound',
    'dir.west':                'Westbound',
    'dir.north.to':            'Northbound (towards {dest})',
    'dir.south.to':            'Southbound (towards {dest})',
    'dir.east.to':             'Eastbound (towards {dest})',
    'dir.west.to':             'Westbound (towards {dest})',
    'dir.west.free':           'Westbound only. Eastbound is FREE.',
    'dir.south.border':        'Southbound (entering Greece from {dest})',
    'dir.west.border':         'Westbound (entering Greece from {dest})',
    'dir.exit.to':             'Exit — towards {dest}',
    'dir.entry.once':          'Pay once on entry — covers full traverse',
    'rp.title':                'Route Analysis',
    'rp.advice.loading':       '💡 Calculating route advice…',
    'rp.total':                'Total',
    'rp.save':                 'Save',
    'rp.extra':                'extra',
    'bar.from':                'From',
    'bar.to':                  'To',
    'bar.swap':                'Reverse route',
    'bar.moto':                '🏍 Moto',
    'bar.car':                 '🚗 Car',
    'bar.van':                 '🚐 Van',
    'bar.truck':               '🚛 Truck',
    'bar.analyse':             'Analyse',
    'bar.analysing':           'Analysing…',
    'bar.time.label1':         '€1 =',
    'bar.time.label2':         'min',
    'err.missing':             'Enter origin and destination',
    'err.geocode':             'Could not find "{name}" on the map',
    'err.route':               'Could not calculate route',
    'err.no.tolls':            'No tolls found on this route',
    'hover.click.details':     'click for details',
    'verdict.pay':             'PAY',
    'verdict.avoid':           'AVOID',
    'verdict.marginal':        'CLOSE CALL',
    'verdict.avoid.reason':    'Exit {exit}, rejoin at {entry}. +{min} min saves €{cost}.',
    'verdict.marginal.reason': 'Exit at {exit}. +{min} min — close call.',
    'verdict.pay.reason':      'Bypass adds {min} min — not worth it. Pay the toll.',
    'verdict.no.bypass':       'No bypass available.',
    'verdict.no.bypass.short': 'No bypass',
    'ramp.exit.label':         'EXIT',
    'ramp.entry.label':        'RE-ENTER',
    'ramp.exit.tooltip':       'EXIT: {name}',
    'ramp.entry.tooltip':      'ENTER: {name}',
    'ramp.avoid':              'Avoid {toll}',
    'bypass.tooltip':          'Bypass: exit {exit} → rejoin {entry} (+{min} min)',
    'toll.section.tooltip':    '🟠 Toll section on motorway',
    'nav.map':                 'Map',
    'nav.routes':              'Routes',
    'nav.tolls':               'Tolls',
    'routes.title':            'City-to-city routes',
    'routes.subtitle':         'Total toll cost and drive time between Greek cities.',
    'routes.vehicle':          'Vehicle',
    'routes.toll':             'toll',
    'routes.tolls':            'tolls',
    'routes.hr':               'h',
    'routes.min':              'm',
    'tolls.title':             'All tolls',
    'tolls.subtitle':          'Prices, motorway, and bypass time per direction.',
    'tolls.search':            'Search…',
    'tolls.allhighways':       'All motorways',
    'tolls.col.name':          'Toll',
    'tolls.col.highway':       'Motorway',
    'tolls.col.bypass':        'Bypass',
    'tolls.bypass.none':       '—',
    'btn.feedback':            '💬 Feedback',
    'btn.feedback.short':      'Feedback',
    'btn.feedback.title':      'Send feedback or report an issue',
    'control.ramps':           'On & Off Ramps',
    'control.tollnames':       'Toll Names',
    'legend.ramps.on':         'On',
    'legend.ramps.off':        'Off',
    'compare.bypass':          'Bypass',
    'compare.highway':         'With toll',
    'compare.diff':            'Difference',
    'compare.loading':         'loading…',
    'compare.unavailable':     'unavailable',
    'sp.showing':              'Selected direction',
    'filter.both':             'Both',
    'bypass.via.local':        'Via local road',
    'bypass.via.highway':      'Via motorway',
    'lang.toggle':             'EL',
    'hwy.A1':                  'PATHE (A1)',
    'hwy.A1.sub':              'Afidnes → Malgara',
    'hwy.A2':                  'Egnatia Odos (A2)',
    'hwy.A2.sub':              'Igoumenitsa → Ardanio',
    'hwy.A5':                  'Nea Odos (A5)',
    'hwy.A5.sub':              'Klokova → Terovos',
    'hwy.A8':                  'Olympia Odos (A8)',
    'hwy.A8.sub':              'Elefsina → Pyrgos',
    'hwy.E65':                 'Kentriki Odos (E65)',
    'hwy.E65.sub':             'Lianokladi → Trikala',
    'hwy.A7':                  'Moreas (A7)',
    'hwy.A7.sub':              'Corinth → Kalamata',
    'hwy.A6':                  'Attiki Odos (A6)',
    'hwy.A6.sub':              'Athens ring road',
    'hwy.BRIDGE':              'Bridges & Tunnels',
    'hwy.BRIDGE.sub':          'Rio–Antirrio · Aktio',
  },
};

// Current language — default Greek, or saved preference
let currentLang = localStorage.getItem('diodio.lang') || 'el';

// Lookup function with {var} interpolation
function t(key, vars) {
  let s = STRINGS[currentLang][key] || STRINGS.en[key] || key;
  if (vars) {
    Object.keys(vars).forEach(k => {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), vars[k]);
    });
  }
  return s;
}

// Apply all translations to the DOM
function applyTranslations() {
  // <html lang="">
  document.documentElement.lang = currentLang;

  // <title>
  document.title = t('title');

  // Elements with data-i18n attribute (text)
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });

  // Elements with data-i18n-html (innerHTML, allows strong/etc.)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });

  // Elements with data-i18n-title (title attribute)
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });

  // Elements with data-i18n-placeholder (input placeholders)
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  // Legend toggle button — state-dependent
  const legendBtn = document.getElementById('legend-toggle');
  if (legendBtn && typeof window.legendVis !== 'undefined') {
    legendBtn.textContent = t(window.legendVis ? 'btn.legend.hide' : 'btn.legend.show');
  }

  // Language flag button — highlight the ACTIVE language pill
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) {
    langBtn.querySelectorAll('.flag-option').forEach(el => {
      el.classList.toggle('active', el.dataset.lang === currentLang);
    });
  }

  // Notify other modules (map.js, calculator.js) that language changed
  window.dispatchEvent(new Event('langchange'));
}

// Toggle between el ⇄ en
function toggleLanguage() {
  currentLang = currentLang === 'el' ? 'en' : 'el';
  localStorage.setItem('diodio.lang', currentLang);
  applyTranslations();
}

// Expose
window.t                = t;
window.toggleLanguage   = toggleLanguage;
window.applyTranslations = applyTranslations;
window.getCurrentLang   = () => currentLang;

// Apply on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyTranslations);
} else {
  applyTranslations();
}
