/**
 * mydiodia — i18n.js
 * Language toggle: Greek (el) ⇄ English (en).
 * Default: el. Preference saved to localStorage.
 */

const STRINGS = {
  el: {
    'title':                   'mydiodia — Οδηγός Διοδίων Ελλάδας',
    'btn.legend.hide':         'Απόκρυψη',
    'btn.legend.show':         'Υπόμνημα',
    'btn.help':                'Οδηγίες χρήσης',
    'btn.basemap.title':       'Στυλ χάρτη',
    'btn.basemap.streets':     'Χάρτης',
    'btn.basemap.satellite':   'Δορυφόρος',
    'btn.basemap.hybrid':      'Υβριδικό',
    'legend.title':            'Φίλτρο διοδίων ανά αυτοκινητόδρομο',
    'legend.ramps.title':      'Κόμβοι εξόδου & εισόδου',
    'legend.ramps.exit':       'Κόμβος εξόδου',
    'legend.ramps.entry':      'Κόμβος εισόδου',
    'help.subtitle':           'Οδηγός Διοδίων Ελλάδας',
    'help.section1.title':     'Εξερεύνησε τα διόδια',
    'help.section1.intro':     'Κλικ σε οποιοδήποτε διόδιο στον χάρτη για τιμές και διαδρομή παράκαμψης.',
    'help.section2.title':     'Ανάλυσε τη διαδρομή σου',
    'help.section2.intro':     'Στη γραμμή κάτω: όρισε αφετηρία/προορισμό, όχημα, και πόσα λεπτά είσαι διατεθειμένος να οδηγήσεις παραπάνω για να γλιτώσεις €1.',
    'help.section2.outro':     'Πατάς Ανάλυση και βλέπεις ποια διόδια αξίζει να πληρώσεις και ποια να παρακάμψεις.',
    'help.legend.avoid':       'Πράσινο = απόφυγε',
    'help.legend.pay':         'Πορτοκαλί = πλήρωσε',
    'help.legend.marginal':    'Κίτρινο = οριακό',
    'help.tip':                '💡 Πάντα επιβεβαίωσε στο Google Maps πριν ακολουθήσεις άγνωστη παράκαμψη.',
    'help.cta':                'Εντάξει',
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
    'sp.confidence.approximate': '⚠ Κατά προσέγγιση — επιβεβαιώστε στο Google Maps πριν χρησιμοποιήσετε αυτή την παράκαμψη.',
    'sp.confidence.auto':      '✓ Συντεταγμένες από OpenStreetMap',
    'sp.confidence.tooltip.approximate': 'Οι συντεταγμένες της εξόδου ή της εισόδου δεν επαληθεύτηκαν αυτόματα. Δείτε στο Google Maps πριν τη χρήση.',
    'sp.confidence.tooltip.auto': 'Οι συντεταγμένες αντιστοιχήθηκαν αυτόματα με κόμβους αυτοκινητόδρομου από το OpenStreetMap.',
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
    'rp.extra':                'Επιπλέον',
    'rp.tolls':                'Διόδια',
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
    'bar.time.prefix':         'Θα οδηγούσα',
    'bar.time.suffix':         'επιπλέον λεπτά για να γλιτώσω €1 σε διόδια',
    'bar.time.short.prefix':   'Δεκτή παράκαμψη:',
    'bar.time.short.suffix':   'λεπ. ανά €1',
    'bar.time.tier.hurry':     'βιάζομαι',
    'bar.time.tier.balanced':  'ισορροπημένο',
    'bar.time.tier.thrifty':   'οικονομικό',
    'bar.time.tier.frugal':    'πολύ οικονομικό',
    'err.missing':             'Εισάγετε αφετηρία και προορισμό',
    'err.geocode':             'Δεν βρέθηκε "{name}" στον χάρτη',
    'err.route':               'Δεν ήταν δυνατός ο υπολογισμός διαδρομής',
    'err.no.tolls':            'Δεν βρέθηκαν διόδια σε αυτή τη διαδρομή',
    'hover.click.details':     'κλικ για λεπτομέρειες',
    'verdict.pay':                  'ΠΛΗΡΩΣΕ',
    'verdict.avoid':                'ΑΠΟΦΥΓΕ',
    'verdict.marginal.avoid':       'ΜΑΛΛΟΝ ΑΠΟΦΥΓΕ',
    'verdict.marginal.pay':         'ΜΑΛΛΟΝ ΠΛΗΡΩΣΕ',
    'verdict.avoid.reason':         'Έξοδος {exit}, είσοδος {entry}. +{min} λεπτά εξοικονόμηση €{cost}.',
    'verdict.marginal.avoid.reason':'Έξοδος {exit}, είσοδος {entry}. +{min} λεπτά για €{cost} — οριακό αλλά μάλλον αξίζει.',
    'verdict.marginal.pay.reason':  'Η παράκαμψη προσθέτει {min} λεπτά για €{cost} — οριακό, μάλλον πλήρωσε.',
    'verdict.pay.reason':           'Η παράκαμψη προσθέτει {min} λεπτά — δεν αξίζει. Πλήρωσε.',
    'verdict.no.bypass':            'Δεν υπάρχει παράκαμψη.',
    'verdict.no.bypass.short':      'Χωρίς παράκαμψη',
    'ramp.exit.label':         'ΕΞΟΔΟΣ',
    'ramp.entry.label':        'ΕΠΑΝΕΙΣΟΔΟΣ',
    'ramp.exit.tooltip':       'ΕΞΟΔΟΣ: {name}',
    'ramp.entry.tooltip':      'ΕΙΣΟΔΟΣ: {name}',
    'ramp.avoid':              'Παράκαμψη: {toll}',
    'bypass.tooltip':          'Παράκαμψη: έξοδος {exit} → είσοδος {entry} (+{min} λεπτά)',
    'toll.section.tooltip':    '🟠 Τμήμα με διόδιο',
    'nav.map':                 'Χάρτης',
    'nav.routes':              'Διαδρομές',
    'nav.tolls':               'Όλα τα διόδια',
    'routes.title':            'Διαδρομές μεταξύ πόλεων',
    'routes.subtitle':         'Συνολικό κόστος διοδίων, απόσταση και κόστος ανά χιλιόμετρο για κάθε ζεύγος πόλεων.',
    'routes.vehicle':          'Όχημα',
    'routes.toll':             'διόδιο',
    'routes.tolls':            'διόδια',
    'routes.hr':               'ώ',
    'routes.min':              'λ',
    'tolls.title':             'Όλα τα διόδια',
    'tolls.subtitle':          'Πάτα οποιαδήποτε στήλη για ταξινόμηση — π.χ. βρες τα ακριβότερα διόδια ή με τη μεγαλύτερη παράκαμψη.',
    'tolls.search':            'Αναζήτηση…',
    'tolls.allhighways':       'Όλοι οι αυτοκινητόδρομοι',
    'tolls.col.name':          'Διόδιο',
    'tolls.col.highway':       'Αυτοκινητόδρομος',
    'tolls.col.bypass':        'Παράκαμψη',
    'tolls.col.verdict':       'Συμβουλή',
    'tolls.bypass.none':       '—',
    'tolls.advisor.vehicle':   'Όχημα',
    'tolls.advisor.time':      'Ανοχή',
    'tolls.advisor.time.short':'λεπ. ανά €1',
    'tolls.advisor.avoidonly': 'Μόνο όσα αξίζει να παρακάμψω',
    'tolls.advisor.count':     '{n} από {total} διόδια',
    'btn.feedback':            '💬 Σχόλια',
    'btn.feedback.short':      'Σχόλια',
    'btn.feedback.title':      'Στείλε σχόλια ή αναφορά',
    'control.ramps':           'Κόμβοι εξόδου/εισόδου',
    'control.tollnames':       'Ονόματα διοδίων',
    'control.side':            'Πλευρικά διόδια',
    'legend.ramps.on':         'On',
    'legend.ramps.off':        'Off',
    'legend.side.on':          'On',
    'legend.side.off':         'Off',
    'compare.bypass':          'Παράκαμψη',
    'compare.highway':         'Με διόδιο',
    'compare.diff':            'Διαφορά',
    'compare.loading':         'φόρτωση…',
    'compare.unavailable':     'μη διαθέσιμο',
    'sp.showing':              'Επιλεγμένη κατεύθυνση',
    'filter.both':             'Και τα δύο',
    'bypass.via.local':        'Μέσω τοπικού δρόμου',
    'bypass.via.highway':      'Μέσω αυτοκινητοδρόμου',
    // Accessible names for unlabeled controls (used via data-i18n-aria-label)
    'aria.origin':             'Πόλη αφετηρίας',
    'aria.dest':               'Πόλη προορισμού',
    'aria.vehicle':            'Επιλογή οχήματος',
    'aria.time.slider':        'Ανοχή παράκαμψης σε λεπτά ανά ευρώ',
    'aria.search.tolls':       'Αναζήτηση διοδίων',
    'aria.highway.filter':     'Φίλτρο αυτοκινητοδρόμου',
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
    'footer.copy':             '© 2026 mydiodia · Στέργιος Γούσιος',
    'footer.code':             'Κώδικας: MIT',
    'footer.data':             'Δεδομένα: CC BY-NC 4.0',
    'footer.source':           'Πηγαίος κώδικας',
  },

  en: {
    'title':                   'mydiodia — Greece Toll Road Advisor',
    'btn.legend.hide':         'Hide legend',
    'btn.legend.show':         'Legend',
    'btn.help':                'How to use',
    'btn.basemap.title':       'Map style',
    'btn.basemap.streets':     'Map',
    'btn.basemap.satellite':   'Satellite',
    'btn.basemap.hybrid':      'Hybrid',
    'legend.title':            'Filter tolls by motorway',
    'legend.ramps.title':      'Exit & Entry ramps',
    'legend.ramps.exit':       'Exit ramp (leave motorway)',
    'legend.ramps.entry':      'Entry ramp (rejoin motorway)',
    'help.subtitle':           'Greece Toll Road Advisor',
    'help.section1.title':     'Explore tolls',
    'help.section1.intro':     'Click any toll on the map to see prices and the bypass route.',
    'help.section2.title':     'Analyse your route',
    'help.section2.intro':     'In the bottom bar: set your origin/destination, vehicle, and how many extra minutes you\'d drive to save €1.',
    'help.section2.outro':     'Press Analyse and see which tolls are worth paying and which to bypass.',
    'help.legend.avoid':       'Green = avoid',
    'help.legend.pay':         'Orange = pay',
    'help.legend.marginal':    'Yellow = marginal',
    'help.tip':                '💡 Always verify with Google Maps before taking an unfamiliar detour.',
    'help.cta':                'Got it',
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
    'sp.confidence.approximate': '⚠ Approximate — verify on Google Maps before relying on this bypass.',
    'sp.confidence.auto':      '✓ Coordinates from OpenStreetMap',
    'sp.confidence.tooltip.approximate': 'Exit or re-entry coordinates were not auto-verified. Check Google Maps before using.',
    'sp.confidence.tooltip.auto': 'Coordinates auto-matched against motorway junctions in OpenStreetMap.',
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
    'rp.extra':                'Extra time',
    'rp.tolls':                'Tolls',
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
    'bar.time.prefix':         'I\'d drive',
    'bar.time.suffix':         'extra minutes to save €1 in tolls',
    'bar.time.short.prefix':   'Worth detour:',
    'bar.time.short.suffix':   'min per €1',
    'bar.time.tier.hurry':     'in a hurry',
    'bar.time.tier.balanced':  'balanced',
    'bar.time.tier.thrifty':   'thrifty',
    'bar.time.tier.frugal':    'very thrifty',
    'err.missing':             'Enter origin and destination',
    'err.geocode':             'Could not find "{name}" on the map',
    'err.route':               'Could not calculate route',
    'err.no.tolls':            'No tolls found on this route',
    'hover.click.details':     'click for details',
    'verdict.pay':                  'PAY',
    'verdict.avoid':                'AVOID',
    'verdict.marginal.avoid':       'MARGINAL AVOID',
    'verdict.marginal.pay':         'MARGINAL PAY',
    'verdict.avoid.reason':         'Exit {exit}, rejoin at {entry}. +{min} min saves €{cost}.',
    'verdict.marginal.avoid.reason':'Exit {exit}, rejoin at {entry}. +{min} min for €{cost} — borderline but probably worth it.',
    'verdict.marginal.pay.reason':  'Bypass adds {min} min for €{cost} — borderline, probably better to pay.',
    'verdict.pay.reason':           'Bypass adds {min} min — not worth it. Pay the toll.',
    'verdict.no.bypass':            'No bypass available.',
    'verdict.no.bypass.short':      'No bypass',
    'ramp.exit.label':         'EXIT',
    'ramp.entry.label':        'RE-ENTER',
    'ramp.exit.tooltip':       'EXIT: {name}',
    'ramp.entry.tooltip':      'ENTER: {name}',
    'ramp.avoid':              'Avoid {toll}',
    'bypass.tooltip':          'Bypass: exit {exit} → rejoin {entry} (+{min} min)',
    'toll.section.tooltip':    '🟠 Toll section on motorway',
    'nav.map':                 'Map',
    'nav.routes':              'Routes',
    'nav.tolls':               'All Tolls',
    'routes.title':            'City-to-city routes',
    'routes.subtitle':         'Total toll cost, distance, and cost per kilometre between Greek cities.',
    'routes.vehicle':          'Vehicle',
    'routes.toll':             'toll',
    'routes.tolls':            'tolls',
    'routes.hr':               'h',
    'routes.min':              'm',
    'tolls.title':             'All tolls',
    'tolls.subtitle':          'Click any column to sort — e.g. find the most expensive tolls or those with longest bypass.',
    'tolls.search':            'Search…',
    'tolls.allhighways':       'All motorways',
    'tolls.col.name':          'Toll',
    'tolls.col.highway':       'Motorway',
    'tolls.col.bypass':        'Bypass',
    'tolls.col.verdict':       'Advice',
    'tolls.bypass.none':       '—',
    'tolls.advisor.vehicle':   'Vehicle',
    'tolls.advisor.time':      'Tolerance',
    'tolls.advisor.time.short':'min per €1',
    'tolls.advisor.avoidonly': 'Only worth-bypassing',
    'tolls.advisor.count':     '{n} of {total} tolls',
    'btn.feedback':            '💬 Feedback',
    'btn.feedback.short':      'Feedback',
    'btn.feedback.title':      'Send feedback or report an issue',
    'control.ramps':           'On & Off Ramps',
    'control.tollnames':       'Toll Names',
    'control.side':            'Side tolls',
    'legend.ramps.on':         'On',
    'legend.ramps.off':        'Off',
    'legend.side.on':          'On',
    'legend.side.off':         'Off',
    'compare.bypass':          'Bypass',
    'compare.highway':         'With toll',
    'compare.diff':            'Difference',
    'compare.loading':         'loading…',
    'compare.unavailable':     'unavailable',
    'sp.showing':              'Selected direction',
    'filter.both':             'Both',
    'bypass.via.local':        'Via local road',
    'bypass.via.highway':      'Via motorway',
    'aria.origin':             'Origin city',
    'aria.dest':               'Destination city',
    'aria.vehicle':            'Vehicle type',
    'aria.time.slider':        'Bypass tolerance in minutes per euro',
    'aria.search.tolls':       'Search tolls',
    'aria.highway.filter':     'Highway filter',
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
    'footer.copy':             '© 2026 mydiodia · Stergios Gousios',
    'footer.code':             'Code: MIT',
    'footer.data':             'Data: CC BY-NC 4.0',
    'footer.source':           'Source code',
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

  // Elements with data-i18n-aria-label (screen-reader names for unlabeled controls)
  document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
    el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
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

// Strip the redundant "Διόδια" / "Toll of" prefix for clean display in lists/labels.
// The toll name in TOLL_DATA has these prefixes so the data is self-describing,
// but we don't need to repeat "Διόδια" before every entry in tables and labels.
window.stripTollPrefix = function(name) {
  if (!name) return '';
  return name.replace(/^Διόδια\s+/i, '').replace(/^Toll\s+of\s+/i, '');
};

// Apply on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyTranslations);
} else {
  applyTranslations();
}
