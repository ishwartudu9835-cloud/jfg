/* =====================================================================
   Cowartu · Voice Actors — shared settings
   Fill the Supabase anon key below, then upload all files to Cloudflare Pages.
   ===================================================================== */
window.VA_CONFIG = {
  SUPABASE_URL: 'https://bpdewnmfalfodcemzoff.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_53Z7OUBd_lj7Gr4j92uqMA_N30JjxVE',   // publishable key (safe in the browser)
  LISTING_FEE: 149,
  WHATSAPP: '919279044047',                                  // ₹149 is paid by UPI QR on this WhatsApp
  BUCKET: 'voice-actors'
};

window.VA = (function () {
  const LANGUAGES = ['Hindi','English','Bengali','Tamil','Telugu','Marathi','Gujarati','Kannada',
    'Malayalam','Punjabi','Odia','Urdu','Assamese','Bhojpuri','Santali','Japanese','Korean','Other'];
  const VOICE_TYPES = ['Hero / Lead','Heroine / Lead','Villain','Child','Teen','Old / Elderly',
    'Character / Cartoon','Narrator','Announcer / Promo','Comic'];
  const GENRES = ['Cartoon & Animation','Anime','Film & Series Dubbing','Ads & Commercials','Audiobook',
    'E-learning','Gaming','Documentary','IVR & Corporate','Radio & Podcast'];
  const GENDERS = ['Male','Female','Other'];
  const AGES = ['Child','Teen','Young Adult','Adult','Senior'];
  const TIERS = {
    gold:   { label: 'Elite Voice',  short: 'Gold',   rank: 0 },
    green:  { label: 'Pro Voice',    short: 'Green',  rank: 1 },
    normal: { label: 'Rising Voice', short: 'Normal', rank: 2 }
  };

  const cfg = window.VA_CONFIG;
  const configured = cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.startsWith('PASTE');
  let client = null;
  function db() {
    if (!configured || !window.supabase) return null;
    if (!client) client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    return client;
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function slugify(s) {
    return String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
  }
  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }
  function sortActors(list) {
    return list.slice().sort((a, b) =>
      (b.is_featured - a.is_featured) ||
      (TIERS[a.tier || 'normal'].rank - TIERS[b.tier || 'normal'].rank) ||
      ((b.sort_order || 0) - (a.sort_order || 0)) ||
      String(a.name).localeCompare(String(b.name)));
  }

  const DEMO = [
    { id:'d1', slug:'ishwar-tudu', name:'Ishwar Tudu', headline:'Deep, warm narrator · Founder, Cowartu',
      bio:'Voice actor, dubbing artist and trainer. Specialises in narration, character voices and Hindi dubbing for animation and documentaries.',
      gender:'Male', age_range:'Adult', languages:['Hindi','English','Santali'], voice_types:['Narrator','Hero / Lead','Character / Cartoon'],
      genres:['Documentary','Cartoon & Animation','Audiobook'], city:'Jadugora', portfolio_url:'https://www.instagram.com/cowartu_in', tier:'gold', is_certified:true, is_featured:true,
      samples:[{title:'Narration demo',url:''},{title:'Character reel',url:''}] },
    { id:'d2', slug:'priya-sharma', name:'Priya Sharma', headline:'Bright, youthful heroine voice',
      bio:'Anime and cartoon dubbing artist with a clear, expressive tone. Comfortable with emotional scenes and fast-paced comedy.',
      gender:'Female', age_range:'Young Adult', languages:['Hindi','English'], voice_types:['Heroine / Lead','Teen','Character / Cartoon'],
      genres:['Anime','Cartoon & Animation'], city:'Mumbai', portfolio_url:'https://www.youtube.com', tier:'gold', is_certified:true, is_featured:false, samples:[{title:'Anime demo',url:''}] },
    { id:'d3', slug:'arjun-das', name:'Arjun Das', headline:'Powerful promo & villain voice',
      bio:'Promo, trailer and villain voices with a heavy bass. Experienced in ads and gaming.',
      gender:'Male', age_range:'Adult', languages:['Bengali','Hindi'], voice_types:['Villain','Announcer / Promo'],
      genres:['Ads & Commercials','Gaming'], city:'Kolkata', tier:'green', is_certified:false, samples:[{title:'Promo reel',url:''}] },
    { id:'d4', slug:'meena-iyer', name:'Meena Iyer', headline:'Calm e-learning & IVR voice',
      bio:'Clean, neutral delivery for corporate, e-learning and IVR in Tamil and English.',
      gender:'Female', age_range:'Adult', languages:['Tamil','English'], voice_types:['Narrator','Announcer / Promo'],
      genres:['E-learning','IVR & Corporate'], city:'Chennai', tier:'green', is_certified:true, samples:[{title:'E-learning sample',url:''}] },
    { id:'d5', slug:'rohit-kumar', name:'Rohit Kumar', headline:'Fun comic & cartoon voices',
      bio:'Started voice acting recently. Loves comic timing and funny cartoon characters.',
      gender:'Male', age_range:'Young Adult', languages:['Hindi','Bhojpuri'], voice_types:['Comic','Character / Cartoon'],
      genres:['Cartoon & Animation','Radio & Podcast'], city:'Patna', tier:'normal', is_certified:true, samples:[{title:'Comic demo',url:''}] },
    { id:'d6', slug:'sneha-patil', name:'Sneha Patil', headline:'Sweet child & teen voices',
      bio:'Specialises in child and teen characters for animation in Marathi and Hindi.',
      gender:'Female', age_range:'Young Adult', languages:['Marathi','Hindi'], voice_types:['Child','Teen'],
      genres:['Cartoon & Animation','Audiobook'], city:'Pune', tier:'normal', is_certified:false, samples:[{title:'Child voice demo',url:''}] }
  ];

  function waUrl(t){ return 'https://api.whatsapp.com/send?phone=' + cfg.WHATSAPP + '&text=' + encodeURIComponent(t); }
  return { waUrl, cfg, configured, db, esc, slugify, initials, sortActors, LANGUAGES, VOICE_TYPES, GENRES, GENDERS, AGES, TIERS, DEMO };
})();
