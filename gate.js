// gate.js — Login + Onboarding (3 pasos) + guardado local.
// Para conectar tu PREU real: cambia DESTINATION.

const DESTINATION = "preu.html"; // <-- si tu preu real es otra ruta, cámbialo (ej: "app/dashboard.html")
const LS_USER = "preu_user_v1";  // sesión (demo)
const LS_PROFILE = "preu_profile_v1"; // onboarding

const $ = (s) => document.querySelector(s);

const stepLogin = $("#step-login");
const stepOn = $("#step-onboarding");
const stepDone = $("#step-done");

initTheme();
boot();

function boot(){
  // Si ya existe sesión + perfil completo => entra directo
  const user = load(LS_USER);
  const profile = load(LS_PROFILE);
  if(user?.isLoggedIn && profile?.completed){
    window.location.href = DESTINATION;
    return;
  }

  // Login handlers
  $("#googleBtn").addEventListener("click", () => {
    // DEMO: login Google simulado
    save(LS_USER, { isLoggedIn: true, method: "google", email: "usuario@google.com" });
    startOnboarding();
  });

  $("#emailLoginBtn").addEventListener("click", () => {
    const email = ($("#email").value || "").trim();
    const pass = ($("#password").value || "").trim();

    if(!email || !pass){
      toast("Escribe correo y contraseña.");
      return;
    }
    // DEMO: login por correo simulado
    save(LS_USER, { isLoggedIn: true, method: "email", email });
    startOnboarding();
  });

  $("#forgotBtn").addEventListener("click", () => {
    toast("Demo: aquí iría 'recuperar contraseña' por email.");
  });
}

function startOnboarding(){
  // Si ya hay perfil parcial, seguimos donde quedó
  const profile = load(LS_PROFILE) || {};
  const startStep = profile.stepIndex ?? 0;

  show(stepOn);
  hide(stepLogin);
  hide(stepDone);

  runOnboarding(startStep, profile);
}

/* ------------------ ONBOARDING STEPS ------------------ */
/*
  Objetivo: 2–3 min máximo. 3 pasos.

  PASO 1: (A + B esenciales)
    - Para qué estudias: PAES / IB / ambos (ESENCIAL 1)
    - Curso actual: 3° / 4° / Egresado / IB DP1 / IB DP2
    - Materias que cuesta más (ESENCIAL 2)

  PASO 2: (C + D esenciales)
    - Tiempo real semanal (ESENCIAL 3) -> días/semana + minutos/sesión
    - Horario: mañana/tarde/noche
    - Estilo explicación preferido (ESENCIAL 4)
    - Cuando no entiendes qué haces (para recomendaciones)

  PASO 3: (E objetivo)
    - Meta puntaje (opcional pero útil)
    - Carrera en mente (sí/cuál / varias / no)
    - Preocupación principal (emocional)
    - Año PAES/IB (si sabe)
*/

function runOnboarding(stepIndex, profile){
  const steps = buildSteps(profile);
  let i = clamp(stepIndex, 0, steps.length - 1);

  // wire buttons
  $("#backBtn").onclick = () => {
    if(i === 0){
      // volver al login (si quiere)
      hide(stepOn);
      show(stepLogin);
      return;
    }
    persist();
    i--;
    render();
  };

  $("#nextBtn").onclick = () => {
    // valida mínimas (no todo)
    const ok = validateStep(steps[i], profile);
    if(!ok) return;

    persist();
    if(i < steps.length - 1){
      i++;
      render();
    }else{
      // terminado
      profile.completed = true;
      profile.stepIndex = steps.length - 1;
      save(LS_PROFILE, profile);
      showDone(profile);
    }
  };

  render();

  function render(){
    const s = steps[i];
    $("#stepLabel").textContent = `Paso ${i+1} de ${steps.length}`;
    $("#progressFill").style.width = `${Math.round(((i+1)/steps.length)*100)}%`;
    $("#onTitle").textContent = s.title;
    $("#onSubtitle").textContent = s.subtitle;

    $("#onForm").innerHTML = s.render(profile);
    hookOptionClicks(profile);

    // Cambia texto final del botón en el último paso
    $("#nextBtn").textContent = (i === steps.length - 1) ? "Finalizar ✅" : "Siguiente →";
  }

  function persist(){
    profile.stepIndex = i;
    save(LS_PROFILE, profile);
  }
}

function buildSteps(profile){
  return [
    {
      key: "step1",
      title: "Lo esencial académico",
      subtitle: "Con esto sabemos qué mostrar y qué esconder (sin saturarte).",
      render: (p) => `
        ${qSingle("focus", "1) ¿Para qué estás estudiando principalmente?", [
          ["PAES","PAES"],
          ["IB","IB"],
          ["AMBOS","Ambos"]
        ], p.focus)}

        ${qSingle("grade", "2) ¿En qué curso estás actualmente?", [
          ["3M","3° medio"],
          ["4M","4° medio"],
          ["EG","Egresado"],
          ["DP1","IB DP1"],
          ["DP2","IB DP2"]
        ], p.grade)}

        ${qMulti("hard", "3) ¿Qué materias te cuestan más? (elige hasta 3)", [
          ["LENG","Lenguaje"],
          ["M1","Matemática M1"],
          ["M2","Matemática M2"],
          ["CIEN","Ciencias"],
          ["HIST","Historia"],
          ["ORG","Organización"],
          ["TODO","Todas 😅"]
        ], p.hard || [], 3)}
      `
    },

    {
      key: "step2",
      title: "Tu tiempo real + cómo aprendes",
      subtitle: "Así evitamos planes imposibles y te recomendamos el estilo correcto.",
      render: (p) => `
        ${qSingle("daysPerWeek", "4) ¿Cuántos días a la semana puedes estudiar?", [
          ["2","2 días"],
          ["3","3 días"],
          ["4","4 días"],
          ["5","5 días"],
          ["6","6 días"],
          ["7","7 días"]
        ], p.daysPerWeek)}

        ${qSingle("sessionTime", "5) ¿Cuánto tiempo por sesión?", [
          ["30","30 min"],
          ["60","1 hora"],
          ["90","1 hora y media"],
          ["120","2 horas"]
        ], p.sessionTime)}

        ${qSingle("bestTime", "6) ¿En qué horario rindes mejor?", [
          ["MAN","Mañana"],
          ["TAR","Tarde"],
          ["NOC","Noche"]
        ], p.bestTime)}

        ${qSingle("explainStyle", "7) ¿Cómo prefieres que te expliquen?", [
          ["PASO","Paso a paso lento"],
          ["RAP","Directo y rápido"],
          ["EJ","Con muchos ejemplos"],
          ["VIS","Visual (dibujos/esquemas)"]
        ], p.explainStyle)}

        ${qSingle("whenStuck", "8) Cuando no entiendes un tema, ¿qué haces?", [
          ["OTRO","Busco otro profe"],
          ["REPET","Repito ejercicios"],
          ["FRUST","Me frustro y lo dejo"],
          ["PREG","Pregunto"]
        ], p.whenStuck)}
      `
    },

    {
      key: "step3",
      title: "Objetivos reales (sin humo)",
      subtitle: "Esto mejora motivación, orientación y mensajes personalizados.",
      render: (p) => `
        ${qSingle("scoreGoal", "9) ¿Tienes una meta de puntaje?", [
          ["NS","No lo sé"],
          ["<600","Menos de 600"],
          ["600-700","600–700"],
          ["700+","700+"]
        ], p.scoreGoal)}

        ${qSingle("career", "10) ¿Tienes una carrera en mente?", [
          ["SI","Sí (cuál)"],
          ["VAR","Varias"],
          ["NO","No aún"]
        ], p.career)}

        ${p.career === "SI" ? `
          <div class="qBlock">
            <div class="qTitle">¿Cuál carrera?</div>
            <input id="careerText" class="input" placeholder="Ej: Ingeniería, Derecho, Medicina..." value="${escape(p.careerText || "")}" />
          </div>
        ` : ""}

        ${qSingle("worry", "11) ¿Qué es lo que más te preocupa hoy?", [
          ["PUN","No alcanzar el puntaje"],
          ["ENT","No entender la materia"],
          ["MOT","Falta de motivación"],
          ["TIME","Falta de tiempo"]
        ], p.worry)}

        ${qSingle("examYear", "12) Año en que rendirás PAES o exámenes IB (si lo sabes)", [
          ["2026","2026"],
          ["2027","2027"],
          ["2028","2028"],
          ["NS","No lo sé"]
        ], p.examYear)}
      `
    }
  ];
}

/* ------------------ VALIDATION (mínimo) ------------------ */
function validateStep(step, p){
  // Mantener onboarding ligero: solo validamos lo esencial
  if(step.key === "step1"){
    if(!p.focus){ toast("Elige para qué estás estudiando (PAES / IB / ambos)."); return false; }
    if(!(p.hard?.length)){ toast("Elige al menos 1 cosa que te cueste."); return false; }
    return true;
  }
  if(step.key === "step2"){
    if(!p.daysPerWeek || !p.sessionTime){ toast("Elige tus días por semana y tiempo por sesión."); return false; }
    if(!p.explainStyle){ toast("Elige tu estilo de explicación preferido."); return false; }
    return true;
  }
  // paso 3: no es obligatorio todo, solo dejamos pasar
  if(p.career === "SI"){
    const txt = ($("#careerText")?.value || "").trim();
    p.careerText = txt;
  }
  return true;
}

/* ------------------ DONE SCREEN ------------------ */
function showDone(profile){
  hide(stepOn);
  hide(stepLogin);
  show(stepDone);

  const summary = $("#summaryBox");
  summary.innerHTML = [
    sumRow("Foco", labelFocus(profile.focus)),
    sumRow("Materias difíciles", (profile.hard || []).map(labelHard).join(" • ")),
    sumRow("Tiempo real semanal", humanWeeklyTime(profile.daysPerWeek, profile.sessionTime)),
    sumRow("Estilo de aprendizaje", labelStyle(profile.explainStyle)),
    sumRow("Meta", buildGoalLine(profile))
  ].join("");

  $("#editBtn").onclick = () => startOnboarding(); // vuelve a editar
  $("#enterBtn").onclick = () => {
    // Entra al preu
    window.location.href = DESTINATION;
  };
}

/* ------------------ OPTION UI HELPERS ------------------ */
function qSingle(key, title, options, selected){
  return `
    <div class="qBlock" data-qtype="single" data-key="${key}">
      <div class="qTitle">${title}</div>
      <div class="opts">
        ${options.map(([val, label]) => `
          <div class="opt ${selected === val ? "selected" : ""}" data-value="${val}">
            ${label}
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function qMulti(key, title, options, selectedArr, maxPick){
  const selected = new Set(selectedArr || []);
  return `
    <div class="qBlock" data-qtype="multi" data-key="${key}" data-max="${maxPick}">
      <div class="qTitle">${title}</div>
      <div class="opts">
        ${options.map(([val, label]) => `
          <div class="opt ${selected.has(val) ? "selected" : ""}" data-value="${val}">
            ${label}
          </div>
        `).join("")}
      </div>
      <div class="muted small">Máx. ${maxPick}. Si eliges “Todas”, priorizamos lo básico primero.</div>
    </div>
  `;
}

function hookOptionClicks(profile){
  // Click options => update profile in localStorage in real-time
  document.querySelectorAll(".qBlock").forEach(block => {
    const key = block.dataset.key;
    const type = block.dataset.qtype;

    block.querySelectorAll(".opt").forEach(opt => {
      opt.addEventListener("click", () => {
        const val = opt.dataset.value;

        if(type === "single"){
          block.querySelectorAll(".opt").forEach(o => o.classList.remove("selected"));
          opt.classList.add("selected");
          profile[key] = val;

          // si cambia carrera, refrescar vista (para mostrar input)
          if(key === "career"){
            save(LS_PROFILE, profile);
            // re-render simple: reiniciamos onboarding en el paso actual
            const p = load(LS_PROFILE) || profile;
            startOnboardingFromStep(p.stepIndex ?? 0, p);
          }else{
            save(LS_PROFILE, profile);
          }
        }

        if(type === "multi"){
          const max = Number(block.dataset.max || 3);
          profile[key] = profile[key] || [];
          const set = new Set(profile[key]);

          // regla: "TODO" se comporta especial
          if(val === "TODO"){
            set.clear();
            set.add("TODO");
            block.querySelectorAll(".opt").forEach(o => o.classList.remove("selected"));
            opt.classList.add("selected");
          }else{
            if(set.has("TODO")) set.delete("TODO");
            if(set.has(val)) set.delete(val);
            else{
              if(set.size >= max){
                toast(`Máximo ${max}. Elige las más importantes.`);
                return;
              }
              set.add(val);
            }
            // actualizar UI
            block.querySelectorAll(".opt").forEach(o => {
              const v = o.dataset.value;
              if(set.has(v)) o.classList.add("selected");
              else o.classList.remove("selected");
            });
          }

          profile[key] = Array.from(set);
          save(LS_PROFILE, profile);
        }
      });
    });

    // si hay input de carrera, guardarlo al escribir
    const ct = $("#careerText");
    if(ct){
      ct.addEventListener("input", () => {
        profile.careerText = ct.value;
        save(LS_PROFILE, profile);
      });
    }
  });
}

// Pequeña ayuda para re-render sin romper estado (cuando career cambia)
function startOnboardingFromStep(stepIndex, profile){
  // fuerza mostrar onboarding en el paso actual con el profile nuevo
  show(stepOn);
  hide(stepLogin);
  hide(stepDone);

  // recrea el flujo manteniendo stepIndex
  profile.stepIndex = stepIndex;
  save(LS_PROFILE, profile);

  // Ejecuta onboarding desde stepIndex
  // (duplicamos inicio de forma simple)
  const steps = buildSteps(profile);
  let i = clamp(stepIndex, 0, steps.length - 1);

  $("#backBtn").onclick = () => {
    if(i === 0){ hide(stepOn); show(stepLogin); return; }
    persist(); i--; render();
  };
  $("#nextBtn").onclick = () => {
    const ok = validateStep(steps[i], profile);
    if(!ok) return;
    persist();
    if(i < steps.length - 1){ i++; render(); }
    else{ profile.completed = true; profile.stepIndex = steps.length - 1; save(LS_PROFILE, profile); showDone(profile); }
  };

  render();

  function render(){
    const s = steps[i];
    $("#stepLabel").textContent = `Paso ${i+1} de ${steps.length}`;
    $("#progressFill").style.width = `${Math.round(((i+1)/steps.length)*100)}%`;
    $("#onTitle").textContent = s.title;
    $("#onSubtitle").textContent = s.subtitle;
    $("#onForm").innerHTML = s.render(profile);
    hookOptionClicks(profile);
    $("#nextBtn").textContent = (i === steps.length - 1) ? "Finalizar ✅" : "Siguiente →";
  }
  function persist(){ profile.stepIndex = i; save(LS_PROFILE, profile); }
}

/* ------------------ THEME ------------------ */
function initTheme(){
  const saved = load("preu_theme_v1")?.theme || "dark";
  document.documentElement.dataset.theme = saved;
  $("#themeIcon").textContent = (saved === "light") ? "☀️" : "🌙";

  $("#themeBtn").addEventListener("click", () => {
    const next = (document.documentElement.dataset.theme === "light") ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    $("#themeIcon").textContent = (next === "light") ? "☀️" : "🌙";
    save("preu_theme_v1", { theme: next });
  });
}

/* ------------------ UTIL ------------------ */
function show(el){ el.classList.remove("hidden"); }
function hide(el){ el.classList.add("hidden"); }

function save(key, obj){ localStorage.setItem(key, JSON.stringify(obj)); }
function load(key){
  try{ return JSON.parse(localStorage.getItem(key) || "null"); }
  catch{ return null; }
}

function clamp(n,a,b){ return Math.max(a, Math.min(b, n)); }

function toast(msg){
  const t = document.createElement("div");
  t.style.position = "fixed";
  t.style.left = "50%";
  t.style.bottom = "18px";
  t.style.transform = "translateX(-50%)";
  t.style.padding = "10px 12px";
  t.style.borderRadius = "999px";
  t.style.border = "1px solid rgba(255,255,255,0.14)";
  t.style.background = "rgba(0,0,0,0.35)";
  t.style.backdropFilter = "blur(10px)";
  t.style.boxShadow = "0 18px 60px rgba(0,0,0,0.35)";
  t.style.color = "white";
  t.style.zIndex = "9999";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=> t.remove(), 1700);
}

function escape(s){
  return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}

/* ------------------ SUMMARY LABELS ------------------ */
function sumRow(k,v){
  return `
    <div class="summaryItem">
      <div class="summaryKey">${k}</div>
      <div class="summaryVal">${v || "—"}</div>
    </div>
  `;
}

function labelFocus(v){
  if(v === "PAES") return "PAES";
  if(v === "IB") return "IB";
  if(v === "AMBOS") return "PAES + IB";
  return "—";
}
function labelHard(v){
  const map = {
    LENG:"Lenguaje", M1:"M1", M2:"M2", CIEN:"Ciencias", HIST:"Historia", ORG:"Organización", TODO:"Todas"
  };
  return map[v] || v;
}
function labelStyle(v){
  const map = {
    PASO:"Paso a paso lento",
    RAP:"Directo y rápido",
    EJ:"Muchos ejemplos",
    VIS:"Visual (esquemas)"
  };
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
  return parts.length ? parts.join(" • ") : "—";
}
function labelWorry(v){
  const map = { PUN:"Puntaje", ENT:"Entender materia", MOT:"Motivación", TIME:"Tiempo" };
  return map[v] || v;
}
