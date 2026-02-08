const LS_USER = "preu_user_v1";
const LS_PROFILE = "preu_profile_v1";

const user = load(LS_USER);
const profile = load(LS_PROFILE);

// Protección: si no hay sesión o no completó onboarding => vuelve a index
if(!user?.isLoggedIn || !profile?.completed){
  window.location.href = "index.html";
}

const hello = document.getElementById("hello");
hello.textContent = `Hola, ${user.email || "estudiante"} • Foco: ${labelFocus(profile.focus)}`;

document.getElementById("profileSummary").innerHTML = [
  row("Foco", labelFocus(profile.focus)),
  row("Curso", labelGrade(profile.grade)),
  row("Materias difíciles", (profile.hard || []).map(labelHard).join(" • ")),
  row("Tiempo semanal", humanWeeklyTime(profile.daysPerWeek, profile.sessionTime)),
  row("Horario mejor", labelBestTime(profile.bestTime)),
  row("Estilo explicación", labelStyle(profile.explainStyle)),
  row("Cuando te trabas", labelWhenStuck(profile.whenStuck)),
  row("Meta", buildGoalLine(profile))
].join("");

document.getElementById("logout").onclick = () => {
  localStorage.removeItem(LS_USER);
  window.location.href = "index.html";
};

document.getElementById("editOnboarding").onclick = () => {
  // Marca perfil incompleto para que re-aparezca onboarding
  profile.completed = false;
  save(LS_PROFILE, profile);
  window.location.href = "index.html";
};

document.getElementById("goHome").onclick = () => {
  alert("Aquí conectarías tu sitio completo (Inicio/Estudiar/Practicar/Progreso/Tutor IA).");
};

function row(k,v){
  return `
    <div class="summaryItem">
      <div class="summaryKey">${k}</div>
      <div class="summaryVal">${v || "—"}</div>
    </div>
  `;
}

function save(key, obj){ localStorage.setItem(key, JSON.stringify(obj)); }
function load(key){
  try{ return JSON.parse(localStorage.getItem(key) || "null"); }
  catch{ return null; }
}

function labelFocus(v){
  if(v === "PAES") return "PAES";
  if(v === "IB") return "IB";
  if(v === "AMBOS") return "PAES + IB";
  return "—";
}
function labelHard(v){
  const map = { LENG:"Lenguaje", M1:"M1", M2:"M2", CIEN:"Ciencias", HIST:"Historia", ORG:"Organización", TODO:"Todas" };
  return map[v] || v;
}
function labelStyle(v){
  const map = { PASO:"Paso a paso lento", RAP:"Directo y rápido", EJ:"Muchos ejemplos", VIS:"Visual" };
  return map[v] || "—";
}
function labelBestTime(v){
  const map = { MAN:"Mañana", TAR:"Tarde", NOC:"Noche" };
  return map[v] || "—";
}
function labelWhenStuck(v){
  const map = { OTRO:"Busca otro profe", REPET:"Repite ejercicios", FRUST:"Se frustra y lo deja", PREG:"Pregunta" };
  return map[v] || "—";
}
function labelGrade(v){
  const map = { "3M":"3° medio", "4M":"4° medio", "EG":"Egresado", "DP1":"IB DP1", "DP2":"IB DP2" };
  return map[v] || "—";
}
function humanWeeklyTime(days, mins){
  if(!days || !mins) return "—";
  const d = Number(days);
  const m = Number(mins);
  const totalMin = d * m;
  const h = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  return `${d} días × ${m} min = ${h}h ${mm}m/semana`;
}
function buildGoalLine(p){
  const parts = [];
  if(p.scoreGoal) parts.push(`Puntaje: ${p.scoreGoal}`);
  if(p.career === "SI") parts.push(`Carrera: ${p.careerText || "—"}`);
  if(p.career === "VAR") parts.push("Carrera: varias");
  if(p.career === "NO") parts.push("Carrera: aún no");
  if(p.worry) parts.push(`Preocupación: ${labelWorry(p.worry)}`);
  if(p.examYear) parts.push(`Año: ${p.examYear}`);
  return parts.length ? parts.join(" • ") : "—";
}
function labelWorry(v){
  const map = { PUN:"No alcanzar puntaje", ENT:"No entender materia", MOT:"Falta motivación", TIME:"Falta tiempo" };
  return map[v] || v;
}
