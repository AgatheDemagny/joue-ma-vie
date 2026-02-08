// ----------------- INITIALISATION -----------------
let playerName = localStorage.getItem("playerName");
let data = JSON.parse(localStorage.getItem("joueMaVie")) || {
  totalXp:0,
  worlds:{},
  activeWorld:null,
  weekLoad:null,
  lastWorld:null
};

if(!playerName){
  playerName = prompt("Entre ton pseudo :");
  localStorage.setItem("playerName", playerName);
}

document.getElementById("name").innerText = playerName;

// Init mondes
worldsList.forEach(w=>{
  if(!data.worlds[w.name]) data.worlds[w.name] = {time:0, xp:0, quests:w.quests.map(q=>({...q}))};
});

function save(){ localStorage.setItem("joueMaVie", JSON.stringify(data)); }

// ----------------- RENDU -----------------
function renderHome(){
  renderWeek();
  renderProgress();
  renderMonth();
  renderLevel();
  renderWorlds();
}

function renderWeek(){
  const display = document.getElementById("weekDisplay");
  const goalEl = document.getElementById("weekGoal");
  if(!data.weekLoad){ data.weekLoad="normal"; }
  goalEl.innerText = WEEK_LOAD_XP[data.weekLoad];
  display.innerText = data.weekLoad.charAt(0).toUpperCase() + data.weekLoad.slice(1);
  save();
}

function renderProgress(){
  const goal = WEEK_LOAD_XP[data.weekLoad||"normal"];
  const totalWeekXp = Object.values(data.worlds).reduce((sum,w)=>sum+w.xp,0);
  const percent = Math.min(100, Math.floor(totalWeekXp/goal*100));
  const fill = document.getElementById("progressWeek");
  fill.style.width = percent + "%"; 
  fill.innerText = percent + "%";
  document.getElementById("totalXp").innerText = data.totalXp;
}

function renderMonth(){
  const totalMonthXp = Object.values(data.worlds).reduce((sum,w)=>sum+w.xp,0);
  document.getElementById("monthXp").innerText = totalMonthXp;
  document.getElementById("monthGoal").innerText = MONTH_GOAL;
  const percent = Math.min(100, Math.floor(totalMonthXp/MONTH_GOAL*100));
  const fill = document.getElementById("progressMonth");
  fill.style.width = percent + "%"; 
  fill.innerText = percent + "%";
}

function renderLevel(){
  let lvl = LEVELS.findIndex(xp=>data.totalXp<xp);
  if(lvl < 0) lvl = LEVELS.length;
  document.getElementById("level").innerText = lvl>0 ? lvl : 1;
}

function renderWorlds(){
  const container = document.getElementById("worldsList"); 
  container.innerHTML = "";
  worldsList.forEach(w=>{
    const btn = document.createElement("button");
    btn.className = "world-btn"; 
    btn.innerText = w.name; 
    btn.onclick = ()=>goToWorld(w.name);
    container.appendChild(btn);
  });
}

// ----------------- NAVIGATION -----------------
function goToWorld(world){
  data.activeWorld = world;
  document.getElementById("homeScreen").classList.add("hidden");
  document.getElementById("worldScreen").classList.remove("hidden");
  renderWorldScreen();
}

function goHome(){
  document.getElementById("worldScreen").classList.add("hidden");
  document.getElementById("homeScreen").classList.remove("hidden");
  renderHome();
}

// ----------------- MONDE -----------------
function renderWorldScreen(){
  const world = data.activeWorld;
  document.getElementById("worldName").innerText = world;
  document.getElementById("worldTime").innerText = data.worlds[world].time;
  document.getElementById("worldXp").innerText = data.worlds[world].xp;

  const qlist = document.getElementById("worldQuests");
  qlist.innerHTML = "";

  // Vider les champs de saisie à chaque ouverture de monde
  document.getElementById("newQuestName").value = "";
  document.getElementById("newQuestXp").value = "";

  // Afficher les quêtes existantes
  data.worlds[world].quests.forEach((q,i)=>{
    const div = document.createElement("div");
    div.className = "quest-item" + (q.done ? " done" : "");
    div.innerHTML = `
      <span>${q.name}</span>
      <button onclick="completeQuest('${world}',${i})">${q.done ? "✓" : q.xp + " XP"}</button>
    `;
    qlist.appendChild(div);
  });
}

// ----------------- TEMPS & XP -----------------
function addWorldTime(){
  const val = parseFloat(document.getElementById("timeInput").value);
  const unit = document.getElementById("timeUnit").value;
  if(isNaN(val) || val<=0){ alert("Entre un temps valide"); return; }
  let minutes = unit==="h"?val*60:val;
  let xp = minutes>=45?XP_RULES[45]:minutes>=30?XP_RULES[30]:XP_RULES[20];
  if(data.lastWorld && data.lastWorld!==data.activeWorld) xp += BONUS_CONSTANCE;
  data.lastWorld = data.activeWorld;

  const prevXp = data.totalXp;
  data.worlds[data.activeWorld].time += minutes;
  data.worlds[data.activeWorld].xp += xp;
  data.totalXp += xp;

  showPopup(`+${xp} XP gagné`);
  checkLevelUp(prevXp);
  save(); 
  renderWorldScreen(); 
  renderProgress(); 
  renderMonth();
}

// ----------------- VALIDATION QUÊTE -----------------
function completeQuest(world,i){
  const q = data.worlds[world].quests[i];
  if(!q.done){
    const prevXp = data.totalXp;
    q.done = true;
    data.totalXp += q.xp;
    showPopup(`Quête validée ! +${q.xp} XP`);
    checkLevelUp(prevXp);
    save(); 
    renderWorldScreen(); 
    renderProgress(); 
    renderMonth();
  }
}

// ----------------- BOUTON AJOUT QUÊTE -----------------
// On attache le listener UNE seule fois
function setupAddQuestButton(){
  const addBtn = document.getElementById("addQuestBtn");
  addBtn.onclick = function(){
    const world = data.activeWorld;
    if(!world) { alert("Sélectionne un monde d'abord"); return; }

    const nameInput = document.getElementById("newQuestName");
    const xpInput = document.getElementById("newQuestXp");
    const name = nameInput.value.trim();
    const xp = parseInt(xpInput.value);

    if(!name){ alert("Nom requis"); return; }
    if(isNaN(xp) || xp <=0){ alert("XP invalide"); return; }

    data.worlds[world].quests.push({name:name, xp:xp, done:false});
    save();

    // Vider les champs
    nameInput.value = "";
    xpInput.value = "";

    renderWorldScreen();
  };
}

// ----------------- INITIALISATION -----------------
setupAddQuestButton();
renderHome();

let newWorker;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").then(reg => {

    // nouvelle version détectée
    reg.addEventListener("updatefound", () => {
      newWorker = reg.installing;

      newWorker.addEventListener("statechange", () => {
        if (
          newWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          showUpdateToast();
        }
      });
    });
  });
}

function showUpdateToast() {
  const toast = document.getElementById("updateToast");
  const btn = document.getElementById("updateBtn");

  toast.classList.remove("hidden");

  btn.onclick = () => {
    if (newWorker) {
      newWorker.postMessage("SKIP_WAITING");
    }
  };
}

// recharge automatique après activation
navigator.serviceWorker.addEventListener("controllerchange", () => {
  window.location.reload();
});
