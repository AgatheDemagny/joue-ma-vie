const XP_RULES = {20:10,30:15,45:25};
const WEEK_LOAD_XP = {light:180, normal:150, heavy:100};
const MALUS = 10;
const LEVELS = [0,100,250,450,700,1000,1350];
const BONUS_CONSTANCE = 5;
const MONTH_GOAL = 400;

function showPopup(message){
  const popup=document.getElementById("popup");
  popup.textContent=message;
  popup.style.display="block";
  setTimeout(()=>popup.style.display="none",2000);
}

function checkLevelUp(prevXp){
  const levelBefore = LEVELS.findIndex(xp => prevXp < xp);
  const levelAfter = LEVELS.findIndex(xp => data.totalXp < xp);
  if(levelAfter !== levelBefore){
    showPopup(`Niveau ${levelAfter>0?levelAfter:LEVELS.length} atteint !`);
  }
}
