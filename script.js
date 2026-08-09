const app = document.getElementById("app");

const defaultData = {
  user: {name:"", email:"", password:""},
  profile: {age:"", gender:"", height:"", weight:""},
  goal: "",
  bmi: null,
  calories: 0,
  activity: "moderate",
  workoutLevel: "Beginner",
  workout: [],
  diet: [],
  water: 0,
  meals: {Breakfast:false, Lunch:false, Snack:false, Dinner:false},
  habits: {water:false, workout:false, healthy:false, sleep:false},
  streak: 0,
  lastCompletedDate: "",
  progress: {workouts:0, totalWater:0, waterDays:0, completedMeals:0, weightHistory:[]}
};

let data = JSON.parse(localStorage.getItem("fitAI")) || structuredClone(defaultData);
let selectedGoal = data.goal || "";

function save(){ localStorage.setItem("fitAI", JSON.stringify(data)); }
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function today(){return new Date().toISOString().slice(0,10)}
function yesterday(){let d=new Date();d.setDate(d.getDate()-1);return d.toISOString().slice(0,10)}
function go(page){ if(page==="dashboard") renderDashboard(); else if(page==="progress") renderProgress(); else if(page==="chat") renderChat(); else if(page==="profile") renderProfile(); }
function calcBMI(){const h=Number(data.profile.height)/100,w=Number(data.profile.weight);return h>0&&w>0?(w/(h*h)).toFixed(1):0}
function bmiLabel(b){b=Number(b);return b<18.5?"Underweight":b<25?"Normal":b<30?"Overweight":"Obesity"}
function calcCalories(){
  const a=Number(data.profile.age), h=Number(data.profile.height), w=Number(data.profile.weight);
  if(!a||!h||!w)return 0;
  let bmr=10*w+6.25*h-5*a+(data.profile.gender==="Female"?-161:5);
  const mult={low:1.2,light:1.375,moderate:1.55,high:1.725}[data.activity]||1.55;
  let c=Math.round(bmr*mult);
  if(data.goal==="Lose Weight") c-=300;
  if(data.goal==="Gain Muscle") c+=250;
  return Math.max(1200,c);
}
function makePlans(){
  const level=data.workoutLevel;
  const sets=level==="Beginner"?"2 x 10":level==="Intermediate"?"3 x 10":"4 x 8";
  data.workout=[
    ["Squats",sets],["Push-ups",sets],["Lunges",sets],["Plank","3 x 30 sec"],["Jumping Jacks","3 x 20"]
  ];
  data.diet=[
    ["Breakfast","Oats + eggs + banana","450 kcal"],
    ["Lunch","Chicken + rice + vegetables","650 kcal"],
    ["Snack","Fruit + yogurt","200 kcal"],
    ["Dinner","Grilled chicken + salad","500 kcal"]
  ];
}
function updateStreakIfComplete(){
  const all=Object.values(data.habits).every(Boolean) && Object.values(data.meals).some(Boolean) && data.water>=8;
  if(!all)return;
  const t=today();
  if(data.lastCompletedDate===t)return;
  data.streak = data.lastCompletedDate===yesterday()?data.streak+1:1;
  data.lastCompletedDate=t;
  save();
}

function splash(){
  app.innerHTML=`<div class="screen splash center"><div><div class="logo-mark">⚡</div><div class="brand">FitAI</div><p class="tagline">Your Personal Fitness Coach</p></div></div>`;
  setTimeout(()=>data.user.email?renderDashboard():welcome(),1800);
}
function welcome(){
  app.innerHTML=`<div class="screen center" style="background:linear-gradient(135deg,#ecfdf5,#f8fafc)"><div class="welcome-card">
    <div class="logo-mark" style="background:#ecfdf5;width:64px;height:64px;font-size:30px">⚡</div>
    <h1>Welcome to FitAI</h1><p class="sub">Simple fitness tracking for your daily journey.</p>
    <div class="actions"><button class="btn" onclick="login()">Login</button><button class="btn secondary" onclick="signup()">Create Account</button></div>
  </div></div>`;
}
function authCard(title,signupMode){
  app.innerHTML=`<div class="auth-wrap"><div class="auth-card">
    <div class="logo-mark" style="width:58px;height:58px;font-size:27px;background:#ecfdf5">⚡</div>
    <h1>${title}</h1><p class="sub">${signupMode?"Create your FitAI account":"Login to your fitness dashboard"}</p>
    <form id="authForm">
      ${signupMode?`<div class="field"><label>Name</label><input id="name" required placeholder="Your name"></div>`:""}
      <div class="field"><label>Email</label><input id="email" type="email" required placeholder="you@example.com"></div>
      <div class="field"><label>Password</label><input id="password" type="password" required placeholder="Password"></div>
      ${signupMode?`<div class="field"><label>Confirm Password</label><input id="confirm" type="password" required placeholder="Confirm password"></div>`:""}
      <button class="btn" type="submit">${signupMode?"Sign Up":"Login"}</button>
    </form>
    <p class="small-note">${signupMode?'Already have an account? <a href="#" onclick="login();return false">Login</a>':'New here? <a href="#" onclick="signup();return false">Create an account</a>'}</p>
  </div></div>`;
  document.getElementById("authForm").onsubmit=e=>{e.preventDefault();const email=document.getElementById("email").value.trim(),pass=document.getElementById("password").value;
    if(signupMode){const name=document.getElementById("name").value.trim(),confirm=document.getElementById("confirm").value;if(pass!==confirm)return alert("Passwords do not match.");data.user={name,email,password:pass};save();renderProfileSetup(1);}
    else{if(email!==data.user.email||pass!==data.user.password)return alert("Incorrect email or password.");renderDashboard();}
  };
}
function login(){authCard("Welcome Back 👋",false)}
function signup(){authCard("Create Account",true)}

function renderProfileSetup(step){
  if(step===1){
    app.innerHTML=`<div class="center screen"><div class="setup-card"><div class="setup-header"><b>FitAI Setup</b><span class="step">1 / 4</span></div><h1>Your Profile</h1><p class="sub">Tell us a little about yourself.</p>
      <form id="profileForm">
      <div class="field"><label>Age</label><input id="age" type="number" min="10" max="100" value="${esc(data.profile.age)}" required></div>
      <div class="field"><label>Gender</label><select id="gender" required><option value="">Select</option><option ${data.profile.gender==="Male"?"selected":""}>Male</option><option ${data.profile.gender==="Female"?"selected":""}>Female</option></select></div>
      <div class="field"><label>Height (cm)</label><input id="height" type="number" value="${esc(data.profile.height)}" required></div>
      <div class="field"><label>Weight (kg)</label><input id="weight" type="number" step="0.1" value="${esc(data.profile.weight)}" required></div>
      <button class="btn">Continue →</button></form></div></div>`;
    document.getElementById("profileForm").onsubmit=e=>{e.preventDefault();data.profile={age:age.value,gender:gender.value,height:height.value,weight:weight.value};save();renderGoal();}
  }
}
function renderGoal(){
  const goals=["Lose Weight","Gain Muscle","Stay Healthy","Improve Fitness"];
  app.innerHTML=`<div class="center screen"><div class="setup-card"><div class="setup-header"><b>FitAI Setup</b><span class="step">2 / 4</span></div><h1>Choose Your Goal</h1><p class="sub">What do you want to improve?</p><div class="goal-grid">${goals.map(g=>`<button class="goal ${selectedGoal===g?"selected":""}" onclick="selectGoal('${g}')"><b>${g}</b><span>${g==="Lose Weight"?"Reduce body weight":g==="Gain Muscle"?"Build strength and muscle":g==="Stay Healthy"?"Maintain healthy habits":"Improve overall fitness"}</span></button>`).join("")}</div><button class="btn" style="margin-top:18px" onclick="saveGoal()">Continue →</button></div></div>`;
}
function selectGoal(g){selectedGoal=g;renderGoal()}
function saveGoal(){if(!selectedGoal)return alert("Please choose a goal.");data.goal=selectedGoal;save();renderBMI()}
function renderBMI(){
  data.bmi=Number(calcBMI());save();
  app.innerHTML=`<div class="center screen"><div class="setup-card"><div class="setup-header"><b>FitAI Setup</b><span class="step">3 / 4</span></div><h1>BMI Calculator</h1><p class="sub">Based on your height and weight.</p><div class="bmi-box"><strong>${data.bmi}</strong><div>${bmiLabel(data.bmi)}</div></div><p class="muted" style="text-align:center">BMI = weight ÷ height²</p><button class="btn" style="margin-top:20px" onclick="renderCalories()">Continue →</button></div></div>`;
}
function renderCalories(){
  data.calories=calcCalories();save();
  app.innerHTML=`<div class="center screen"><div class="setup-card"><div class="setup-header"><b>FitAI Setup</b><span class="step">4 / 4</span></div><h1>Calories Calculator</h1><p class="sub">Choose your activity level.</p>
    <div class="field"><label>Activity Level</label><select id="activity"><option value="low">Low — little exercise</option><option value="light">Light — 1–3 days/week</option><option value="moderate" selected>Moderate — 3–5 days/week</option><option value="high">High — 6–7 days/week</option></select></div>
    <div class="bmi-box"><strong>${data.calories}</strong><div>estimated daily calories</div></div>
    <button class="btn" onclick="finishSetup()">Generate My Plan →</button></div></div>`;
  activity.value=data.activity;activity.onchange=()=>{data.activity=activity.value;data.calories=calcCalories();document.querySelector(".bmi-box strong").innerText=data.calories}
}
function finishSetup(){data.activity=document.getElementById("activity").value;data.calories=calcCalories();makePlans();save();renderDashboard()}

function shell(active,title,subtitle,content){
  app.innerHTML=`<div class="app-layout"><aside class="sidebar"><div class="side-brand"><span>⚡</span> FitAI</div><nav class="nav">
    <button class="${active==="dashboard"?"active":""}" onclick="go('dashboard')">🏠 Dashboard</button>
    <button class="${active==="progress"?"active":""}" onclick="go('progress')">📊 Progress</button>
    <button class="${active==="chat"?"active":""}" onclick="go('chat')">🤖 AI Coach</button>
    <button class="${active==="profile"?"active":""}" onclick="go('profile')">👤 Profile</button>
  </nav><div class="side-bottom"><button class="btn danger" onclick="logout()">🚪 Logout</button></div></aside>
  <main class="main"><div class="top"><div><h2>${title}</h2><p>${subtitle}</p></div><div class="avatar">${esc((data.user.name||"U")[0].toUpperCase())}</div></div>${content}</main></div>`;
}

function renderDashboard(){
  updateStreakIfComplete();
  const mealDone=Object.values(data.meals).filter(Boolean).length;
  const habitDone=Object.values(data.habits).filter(Boolean).length;
  shell("dashboard","Good morning, "+esc(data.user.name||"User")+" 👋","Let's make today a healthy day.",`
    <section class="grid stats">
      <div class="card stat"><div class="stat-icon">🔥</div><div><span>Streak</span><strong>${data.streak}</strong><span>days</span></div></div>
      <div class="card stat"><div class="stat-icon">💧</div><div><span>Water</span><strong>${data.water}</strong><span>/ 8 glasses</span></div></div>
      <div class="card stat"><div class="stat-icon">🥗</div><div><span>Meals</span><strong>${mealDone}</strong><span>/ 4 completed</span></div></div>
      <div class="card stat"><div class="stat-icon">⚖️</div><div><span>Weight</span><strong>${esc(data.profile.weight)}</strong><span>kg</span></div></div>
    </section>
    <br>
    <section class="grid two">
      <div class="card"><h3>Today's Habits</h3><p class="muted">${habitDone}/4 habits completed</p><div class="progress"><i style="width:${habitDone/4*100}%"></i></div>
        <div class="list">
          ${habitRow("water","💧","Water","Drink 8 glasses")}
          ${habitRow("workout","🏋️","Workout","Complete today's workout")}
          ${habitRow("healthy","🥗","Healthy Food","Follow your diet")}
          ${habitRow("sleep","😴","Sleep","Aim for 8 hours")}
        </div>
      </div>
      <div class="card"><h3>Water Tracker</h3><p class="muted">Target: 8 glasses</p><div class="water-control"><button class="circle" onclick="changeWater(-1)">−</button><div class="water-num">${data.water}/8</div><button class="circle" onclick="changeWater(1)">+</button></div><div class="progress"><i style="width:${Math.min(data.water/8*100,100)}%"></i></div><div class="notice">💧 Keep going! Hydration supports your daily routine.</div></div>
    </section>
    <br>
    <section class="grid two">
      <div class="card"><h3>Today's Workout</h3><p class="muted">${esc(data.workoutLevel)} plan</p>${data.workout.map((x,i)=>`<div class="exercise"><span>🏋️ ${esc(x[0])}<small class="muted"> — ${esc(x[1])}</small></span><input class="check" type="checkbox" onchange="workoutExercise(${i},this.checked)"></div>`).join("")}<button class="btn" style="margin-top:15px" onclick="completeWorkout()">Complete Workout</button></div>
      <div class="card"><h3>Today's Meals</h3><p class="muted">Mark meals as completed</p>${data.diet.map(x=>`<div class="meal"><span>🍽️ <b>${esc(x[0])}</b><br><small class="muted">${esc(x[1])}</small></span><label><input class="check" type="checkbox" ${data.meals[x[0]]?"checked":""} onchange="toggleMeal('${x[0]}',this.checked)"> ${x[2]}</label></div>`).join("")}</div>
    </section>
    <br>
    <section class="card"><h3>Quick AI Coach</h3><p class="muted">Get simple advice based on your fitness setup.</p><div class="chat-buttons"><button onclick="quickAnswer('Workout Tips')">🏋️ Workout Tips</button><button onclick="quickAnswer('Diet Tips')">🥗 Diet Tips</button><button onclick="quickAnswer('Water')">💧 Water</button><button onclick="quickAnswer('Motivation')">🔥 Motivation</button></div></section>
  `);
}
function habitRow(key,icon,title,desc){
  return `<label class="row"><span class="row-left"><input class="check" type="checkbox" ${data.habits[key]?"checked":""} onchange="toggleHabit('${key}',this.checked)"><span><b>${icon} ${title}</b><br><small class="muted">${desc}</small></span></span><span class="pill">${data.habits[key]?"Done":"Pending"}</span></label>`
}
function toggleHabit(k,v){data.habits[k]=v;save();renderDashboard()}
function toggleMeal(k,v){data.meals[k]=v;if(v)data.progress.completedMeals++;save();updateStreakIfComplete();renderDashboard()}
function changeWater(n){data.water=Math.max(0,Math.min(8,data.water+n));data.habits.water=data.water>=8;if(n>0){data.progress.totalWater++;}save();updateStreakIfComplete();renderDashboard()}
function workoutExercise(i,v){/* demo: exercise completion is visual; final button saves workout */}
function completeWorkout(){data.habits.workout=true;data.progress.workouts++;save();updateStreakIfComplete();alert("Workout completed! 💪");renderDashboard()}

function renderProgress(){
  const current=Number(data.profile.weight)||0;
  shell("progress","Your Progress","Simple weekly activity overview.",`
    <section class="grid three">
      <div class="card"><h3>Weight</h3><strong style="font-size:28px">${current} kg</strong><p class="muted">Current recorded weight</p></div>
      <div class="card"><h3>Workouts</h3><strong style="font-size:28px">${data.progress.workouts}</strong><p class="muted">Completed workouts</p></div>
      <div class="card"><h3>Average Water</h3><strong style="font-size:28px">${data.progress.waterDays?Math.round(data.progress.totalWater/data.progress.waterDays):data.water}/8</strong><p class="muted">Tracked glasses</p></div>
    </section><br>
    <section class="grid two"><div class="card"><h3>Current Streak</h3><strong style="font-size:48px;color:var(--green)">${data.streak}</strong><p class="muted">days</p></div><div class="card"><h3>Goal</h3><strong>${esc(data.goal)}</strong><p class="muted">BMI ${data.bmi} • ${data.calories} kcal/day</p></div></section>
  `);
}
function renderChat(){
  shell("chat","AI Fitness Coach","Student version with ready-made advice.",`<div class="card"><h3>Ask your coach</h3><p class="muted">Choose a topic to get a quick answer.</p><div class="chat-buttons"><button onclick="quickAnswer('Workout Tips')">🏋️ Workout Tips</button><button onclick="quickAnswer('Diet Tips')">🥗 Diet Tips</button><button onclick="quickAnswer('Water')">💧 Water</button><button onclick="quickAnswer('Motivation')">🔥 Motivation</button></div><div id="chatAnswer" class="chat-answer">Your answer will appear here.</div></div>`);
}
function quickAnswer(topic){
  const answers={
    "Workout Tips":"Start with controlled movements, warm up first, keep good form, and rest between sets. Increase difficulty gradually.",
    "Diet Tips":"Build simple balanced meals with protein, vegetables, whole grains and fruit. Keep your meals consistent with your calorie target.",
    "Water":"Your current target is 8 glasses. You have "+data.water+"/8 today. Try drinking water throughout the day.",
    "Motivation":"You do not need a perfect day. Small actions repeated consistently create progress. Keep going! 🔥"
  };
  const box=document.getElementById("chatAnswer");
  if(box)box.innerHTML=`<b>${topic}</b><br>${answers[topic]}`;
  else alert(answers[topic]);
}
function renderProfile(){
  shell("profile","My Profile","Manage your information and account.",`
    <section class="grid two"><div class="card"><h3>Personal Information</h3><div class="profile-list">
      <div class="profile-item"><b>Name</b><span>${esc(data.user.name)}</span></div>
      <div class="profile-item"><b>Email</b><span>${esc(data.user.email)}</span></div>
      <div class="profile-item"><b>Age</b><span>${esc(data.profile.age)}</span></div>
      <div class="profile-item"><b>Gender</b><span>${esc(data.profile.gender)}</span></div>
      <div class="profile-item"><b>Height</b><span>${esc(data.profile.height)} cm</span></div>
      <div class="profile-item"><b>Weight</b><span>${esc(data.profile.weight)} kg</span></div>
    </div></div>
    <div class="card"><h3>Fitness Setup</h3><div class="profile-list"><div class="profile-item"><b>Goal</b><span>${esc(data.goal)}</span></div><div class="profile-item"><b>BMI</b><span>${data.bmi}</span></div><div class="profile-item"><b>Calories</b><span>${data.calories} kcal</span></div></div><div class="actions" style="margin-top:18px"><button class="btn secondary" onclick="renderProfileSetup(1)">✏️ Edit Profile</button><button class="btn secondary" onclick="renderGoal()">🎯 Change Goal</button><button class="btn danger" onclick="resetData()">♻️ Reset Data</button></div></div></section>
  `);
}
function resetData(){if(confirm("Reset all FitAI data?")){localStorage.removeItem("fitAI");data=structuredClone(defaultData);welcome()}}
function logout(){if(confirm("Logout from FitAI?")){localStorage.removeItem("fitAI");data=structuredClone(defaultData);welcome()}}

splash();
