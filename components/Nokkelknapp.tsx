/* ══════════════════════════════════════════════════════════════════
     NØKKELKNAPPEN — limes inn øverst i <body>, rett etter lukkeren.

     Mobilappen har én felles innlogging lagret kryptert på telefonen.
     Åpner appen denne sida, åpner den også en meldingskanal gjennom
     Chrome. Da, og bare da, kommer en 🔑 under passordfeltet. Trykk, så
     fyller appen inn e-post og passord. Skjemaet sendes ALDRI inn herfra.

     ── MÅ LIGGE INLINE, ØVERST ────────────────────────────────────
     Chrome gir sida porten én gang, i den første meldingen. Lytter vi
     ikke når den kommer, er kanalen tapt for denne sidelastingen. En
     React-komponent starter for sent – derfor rett i HTML-en serveren
     sender. I React-apper: som <script dangerouslySetInnerHTML> i skallet.

     ── SLIK KOMMER KANALEN (målt på Chrome, ikke gjettet) ─────────
     Først en vindusmelding med tom data og porten, med opphavet
     android-app://<vert>/no.haugemaskin.mobil. Så kommer hilsenen fra
     appen – {"type":"hm-hei","nokkel":true} – på porten. Står hilsenen i
     selve vindusmeldingen, slik dokumentasjonen beskriver, virker det også.

     ── HVEM VI HØRER PÅ ───────────────────────────────────────────
     Bare vår egen app, eller vårt eget opphav. Et android-app-opphav kan
     bare lages av Chrome, og bare etter at /.well-known/assetlinks.json på
     dette domenet har godkjent appen (use_as_origin). Et svar fylles bare
     inn når sida selv har spurt, og aldri etter tre sekunder.

     ── UTFYLLINGEN ────────────────────────────────────────────────
     Samme regler som Windows-appen (hauge-maskin-app/src/main.js):
       · uten et synlig passordfelt røres ingenting
       · søke- og filterfelt hoppes over
       · e-postfeltet er tekstfeltet rett før passordfeltet i skjemaet
       · verdien settes slik at React merker den (input + change)

     SIKKERHETSNETT: alt ligger i try/catch. Knappen og stilen dens lages
     først når det finnes et passordfelt – sider uten innlogging får ingen
     ting lagt inn. Knappen ligger utenfor rammeverkets rot, så React kan
     ikke rive den. Uten svar fra appen sier knappen fra i stedet for å henge.

     Kanonisk kopi: hauge-maskin-mobil/twa/hm-snutt.html
     ══════════════════════════════════════════════════════════════════
*/

/* Her som komponent: lukkeren er en React-komponent i dette systemet, og
   nøkkelknappen må ligge i HTML-en serveren sender – derfor rendres den i
   skallet, rett etter <Lukkar />, ikke i en komponent som starter etter
   hydrering. String.raw, så skråstrekene i regex-en kommer ut uendret.

   Generert fra twa/hm-snutt.html. Endres der, og lages på nytt herfra. */
const JS = String.raw`
(function () {
  try {
    var TEKST = '🔑 Fyll inn';
    var APPEN = /^android-app:\/\/([^\/]+\/)?no\.haugemaskin\.mobil(\/|$)/;
    var STIL =
      '#hm-nokkel{position:fixed;z-index:2147483646;top:0;left:0;display:none;' +
      'align-items:center;padding:8px 14px;border:0;border-radius:999px;' +
      'background:#e2001a;color:#fff;font:700 14px/1.2 system-ui,-apple-system,' +
      '"Segoe UI",Roboto,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.35);' +
      'cursor:pointer;-webkit-tap-highlight-color:transparent}' +
      '#hm-nokkel.synleg{display:inline-flex}#hm-nokkel:active{background:#b40015}';

    var port = null, harNokkel = false, ferdig = false, vakt = null;
    var knapp = null, venter = null, tilbake = null;

    function les(t) { try { return JSON.parse(t); } catch (x) { return null; } }
    function fraAppen(o) { return o === location.origin || APPEN.test(String(o)); }

    function synleg(el) {
      var r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && !el.disabled && !el.readOnly;
    }

    function passordfelt() {
      var alle = document.querySelectorAll('input[type="password"]');
      for (var i = 0; i < alle.length; i++) if (synleg(alle[i])) return alle[i];
      return null;
    }

    var SOK = /(search|søk|sok|query|filter|finn)/i;
    function erSokefelt(el) {
      if (el.type === 'search') return true;
      var t = [el.name, el.id, el.placeholder, el.getAttribute('aria-label'),
               el.getAttribute('autocomplete')].filter(Boolean).join(' ');
      return SOK.test(t);
    }

    function settVerdi(el, verdi) {
      var setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(el, verdi);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function fyll(epost, passord) {
      var pf = passordfelt();
      if (!pf) return 0;
      var omraade = pf.form || document;
      var kandidatar = [].slice.call(omraade.querySelectorAll(
        'input[type="email"], input[type="text"], input[type="tel"], input:not([type])'
      )).filter(function (el) { return synleg(el) && !erSokefelt(el); });
      var alle = [].slice.call(document.querySelectorAll('input'));
      var pos = alle.indexOf(pf);
      var foer = kandidatar.filter(function (el) { return alle.indexOf(el) < pos; });
      var bf = foer.length ? foer[foer.length - 1] : null;
      var n = 0;
      if (typeof epost === 'string' && epost && bf) { settVerdi(bf, epost); n++; }
      if (typeof passord === 'string' && passord) { settVerdi(pf, passord); pf.focus(); n++; }
      return n;
    }

    /* En melding på knappen står en stund, så kommer teksten tilbake. */
    function tekst(t, kort) {
      if (!knapp) return;
      knapp.textContent = t;
      if (tilbake) { clearTimeout(tilbake); tilbake = null; }
      if (kort) tilbake = setTimeout(function () { tilbake = null; if (knapp) knapp.textContent = TEKST; }, 4000);
    }

    function lagKnapp() {
      if (knapp) return;
      var stil = document.createElement('style');
      stil.id = 'hm-nokkel-stil';
      stil.textContent = STIL;
      (document.head || document.documentElement).appendChild(stil);
      knapp = document.createElement('button');
      knapp.id = 'hm-nokkel';
      knapp.type = 'button';
      knapp.textContent = TEKST;
      knapp.addEventListener('click', hent);
      document.body.appendChild(knapp);
    }

    /* Under passordfeltet, høyrejustert, så knappen ikke dekker midten av
       «Logg inn»-knappen som som regel står rett under. Knappen lages
       først her, når det faktisk finnes et passordfelt. */
    function plasser() {
      var pf = port && harNokkel && !ferdig ? passordfelt() : null;
      if (!pf) { if (knapp && knapp.className) knapp.className = ''; return; }
      lagKnapp();
      if (knapp.className !== 'synleg') knapp.className = 'synleg';
      var r = pf.getBoundingClientRect();
      var topp = Math.round(r.bottom + 6) + 'px';
      var venstre = Math.round(Math.max(8, r.right - knapp.offsetWidth)) + 'px';
      if (knapp.style.top !== topp) knapp.style.top = topp;
      if (knapp.style.left !== venstre) knapp.style.left = venstre;
    }

    /* Følger med på sida, så knappen kommer når innloggingen tegnes og går
       når den forsvinner. Våre egne endringer setter ikke i gang en ny runde. */
    function folgMed() {
      if (vakt) return;
      vakt = new MutationObserver(function (poster) {
        for (var i = 0; i < poster.length; i++) {
          var mal = poster[i].target;
          if (mal !== knapp && !(knapp && knapp.contains(mal))) { plasser(); return; }
        }
      });
      vakt.observe(document.documentElement, {
        childList: true, subtree: true,
        attributes: true, attributeFilter: ['class', 'style', 'hidden', 'type', 'disabled']
      });
      window.addEventListener('scroll', plasser, true);
      window.addEventListener('resize', plasser);
      if (window.visualViewport) window.visualViewport.addEventListener('resize', plasser);
    }

    function hent() {
      if (!port || venter) return;
      tekst('🔑 …');
      port.postMessage(JSON.stringify({ type: 'hm-hent' }));
      venter = setTimeout(function () {
        venter = null;
        tekst('Åpne sida fra appen på nytt', true);
      }, 3000);
    }

    function hei(m) {
      harNokkel = m.nokkel === true;
      ferdig = false;
      if (!harNokkel) { plasser(); return; }
      if (document.body) { folgMed(); plasser(); }
      else document.addEventListener('DOMContentLoaded', function () { folgMed(); plasser(); });
    }

    function svar(m) {
      if (!venter) return; /* bare svar på noe vi har spurt om */
      clearTimeout(venter);
      venter = null;
      if (m.feil) { tekst(String(m.feil), true); return; }
      if (fyll(m.epost, m.passord)) {
        ferdig = true;
        tekst(TEKST);
        plasser();
      } else {
        tekst('Fant ikke innloggingen', true);
      }
    }

    function motta(e) {
      var m = les(e && e.data);
      if (!m) return;
      if (m.type === 'hm-hei') hei(m);
      else if (m.type === 'hm-nokkel') svar(m);
    }

    window.addEventListener('message', function (e) {
      if (!e.ports || !e.ports[0] || !fraAppen(e.origin)) return;
      port = e.ports[0];
      port.onmessage = motta;
      var m = les(e.data);
      if (m && m.type === 'hm-hei') hei(m);
    });
  } catch (x) { /* nøkkelknappen skal aldri kunne ta ned sida */ }
})();
`

export function Nokkelknapp() {
  return <script dangerouslySetInnerHTML={{ __html: JS }} />
}
