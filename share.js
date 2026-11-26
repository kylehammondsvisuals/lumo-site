// Public share pages: show what was shared and hand off to the Lumo app.
const SB = "https://evwvhaipompdhiegrojg.supabase.co/rest/v1/";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d3ZoYWlwb21wZGhpZWdyb2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU3Mjc5OTcsImV4cCI6MjExMTMwMzk5N30.ViP2uzWLa_KGsxeNpvabAcKYRLxBxAn02KmWFhKNxa0";
const APP_STORE = "https://apps.apple.com/app/id6839802878";
const LABEL = { trailer: "Trailer", bts: "Behind the scenes", photo_story: "Photo story", bonus: "Bonus", episode: "Episode" };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const isId = (s) => /^[0-9a-f-]{36}$/i.test(s || "");
async function get(path) {
  const r = await fetch(SB + path, { headers: { apikey: KEY, Authorization: "Bearer " + KEY } });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}
const fmt = (t) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
function vimeo(url) { const m = /vimeo\.com\/(?:video\/)?(\d+)(?:\/([0-9a-f]+))?/.exec(url || ""); return m ? m : null; }
function player(url, poster) {
  const v = vimeo(url);
  if (v) return `<div class="vid"><iframe src="https://player.vimeo.com/video/${v[1]}?${v[2] ? "h=" + v[2] + "&" : ""}playsinline=1&title=0&byline=0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
  return `<div class="vid"><video src="${esc(url)}" ${poster ? `poster="${esc(poster)}"` : ""} controls playsinline preload="metadata"></video></div>`;
}
function render(html) { document.getElementById("app").innerHTML = html; }
function buttons(deep) {
  return `<a class="btn primary" href="${esc(deep)}">Watch in the Lumo app</a>
  <a class="btn" href="${APP_STORE}">Get Lumo on the App Store</a>
  <p class="small">Already have Lumo? Tap “Watch in the Lumo app”. New here? Your first 7 days are free.</p>`;
}
async function watchPage() {
  const p = new URLSearchParams(location.search);
  const s = p.get("s"), e = p.get("e"), t = /^\d+$/.test(p.get("t") || "") ? Number(p.get("t")) : 0;
  if (!isId(s)) return render(`<h1>Watch on Lumo</h1><p>Short series from Channel X.</p>${buttons("lumo://")}`);
  const deep = `lumo://watch/${s}${isId(e) ? `?ep=${e}${t ? `&t=${t}` : ""}` : ""}`;
  try {
    const [show] = await get(`shows?id=eq.${s}&select=title,description,genre,thumbnail_url,trailer_url`);
    if (!show) throw new Error("missing");
    const [ep] = isId(e) ? await get(`episodes?id=eq.${e}&published=eq.true&select=title,content_type,episode_number,is_free,video_url,thumbnail_url,description`) : [];
    const label = ep ? (ep.content_type === "episode" ? `Episode ${ep.episode_number}` : LABEL[ep.content_type] || "Episode") : "";
    document.title = `${show.title} · Lumo`;
    const poster = ep?.thumbnail_url || show.thumbnail_url;
    const preview = ep?.is_free && ep.video_url ? player(ep.video_url, poster) : !ep && show.trailer_url ? player(show.trailer_url, poster)
      : poster ? `<img class="poster" src="${esc(poster)}" alt="">` : "";
    render(`${preview}
      <p class="eyebrow">${esc(show.genre || "Lumo original")}</p>
      <h1>${esc(show.title)}</h1>
      ${ep ? `<p class="ep">${esc(label)}${ep.title && ep.title !== label ? " · " + esc(ep.title) : ""}${t ? ` · from ${fmt(t)}` : ""}</p>` : ""}
      <p class="desc">${esc(ep?.description || show.description || "")}</p>
      ${ep && !ep.is_free ? '<p class="small lock">This episode is for Lumo members.</p>' : ""}
      ${buttons(deep)}`);
  } catch {
    render(`<h1>Watch on Lumo</h1><p>We couldn't load this show right now.</p>${buttons(deep)}`);
  }
}
async function profilePage() {
  const h = new URLSearchParams(location.search).get("h") || "";
  const deep = `lumo://u/${encodeURIComponent(h)}`;
  let who = null;
  try { [who] = await get(`profiles?handle=eq.${encodeURIComponent(h)}&select=handle,avatar_url,bio`); } catch {}
  render(`${who?.avatar_url ? `<img class="avatar" src="${esc(who.avatar_url)}" alt="">` : ""}
    <h1>${who ? "@" + esc(who.handle) : "Join me on Lumo"}</h1>
    ${who ? `<p class="desc">${esc(who.bio || "")}</p>` : ""}
    ${buttons(deep).replaceAll("Watch in the Lumo app", "Open in the Lumo app")}`);
}
(document.body.dataset.page === "profile" ? profilePage : watchPage)();
