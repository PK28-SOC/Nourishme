const { useState, useEffect, useRef } = React;

const save = async (key, val) => { try { await window.storage.set(key, JSON.stringify(val)); } catch {} };
const load = async (key) => { try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; } catch { return null; } };
const todayStr = () => new Date().toISOString().split("T")[0];

const calcBMR = (p) => { const b = 10 * p.weight + 6.25 * p.height - 5 * p.age; return p.sex === "female" ? b - 161 : b + 5; };
const calcTDEE = (bmr) => bmr * 1.2;
const calcGoal = (tdee) => Math.round(tdee - 500);
const getBMIInfo = (bmi) => {
  if (bmi < 18.5) return { label: "Underweight", color: "#7dd3fc", band: 0 };
  if (bmi < 25)   return { label: "Healthy",     color: "#6ee7b7", band: 1 };
  if (bmi < 30)   return { label: "Overweight",  color: "#fcd34d", band: 2 };
  return               { label: "Obese",        color: "#fca5a5", band: 3 };
};

const MEAL_DB = {
  breakfast: [
    { name: "Overnight Oats", cal: 320, time: "5 min", tags: ["high-fiber","easy"], recipe: "Rolled oats + milk + chia seeds + banana slices. Prep the night before.", emoji: "🥣" },
    { name: "Egg & Avocado Toast", cal: 380, time: "10 min", tags: ["protein","healthy-fat"], recipe: "2 boiled eggs, half avocado mashed on 2 wholegrain toast slices. Season with lemon & chilli flakes.", emoji: "🥑" },
    { name: "Greek Yogurt Parfait", cal: 280, time: "3 min", tags: ["protein","quick"], recipe: "Low-fat Greek yogurt + mixed berries + 1 tbsp honey + a handful of granola.", emoji: "🍓" },
    { name: "Banana Protein Smoothie", cal: 310, time: "5 min", tags: ["protein","quick"], recipe: "1 banana + 1 scoop protein powder + 1 cup milk + 1 tbsp peanut butter. Blend.", emoji: "🍌" },
    { name: "Veggie Omelette", cal: 290, time: "12 min", tags: ["protein","low-carb"], recipe: "3 eggs + spinach + mushrooms + cherry tomatoes. Cook in non-stick pan with olive oil spray.", emoji: "🍳" },
  ],
  lunch: [
    { name: "Grilled Chicken Bowl", cal: 450, time: "20 min", tags: ["high-protein","meal-prep"], recipe: "150g grilled chicken breast + 1/2 cup brown rice + steamed broccoli + cucumber. Lemon dressing.", emoji: "🍗" },
    { name: "Lentil Soup", cal: 380, time: "25 min", tags: ["high-fiber","budget"], recipe: "Red lentils + diced tomatoes + cumin + turmeric + vegetable stock. Simmer 20 mins.", emoji: "🍲" },
    { name: "Tuna Salad Wrap", cal: 360, time: "8 min", tags: ["quick","protein"], recipe: "Canned tuna + low-fat mayo + lettuce + tomato in a wholegrain wrap.", emoji: "🌯" },
    { name: "Quinoa & Roasted Veg", cal: 420, time: "30 min", tags: ["plant-based","meal-prep"], recipe: "Cooked quinoa + roasted capsicum, zucchini, red onion with olive oil & herbs.", emoji: "🥗" },
    { name: "Turkey & Cheese Sandwich", cal: 390, time: "5 min", tags: ["quick","protein"], recipe: "Wholegrain bread + sliced turkey breast + low-fat cheese + spinach + mustard.", emoji: "🥪" },
  ],
  dinner: [
    { name: "Baked Salmon & Veg", cal: 480, time: "25 min", tags: ["omega-3","easy"], recipe: "150g salmon fillet + asparagus + cherry tomatoes. Bake at 200C for 18-20 mins with lemon & herbs.", emoji: "🐟" },
    { name: "Chicken Stir Fry", cal: 420, time: "20 min", tags: ["low-carb","quick"], recipe: "Sliced chicken + mixed veg (capsicum, broccoli, snap peas) stir fried in soy sauce & ginger. Serve with cauliflower rice.", emoji: "🥘" },
    { name: "Dal & Roti", cal: 450, time: "30 min", tags: ["budget","high-fiber"], recipe: "Yellow dal with turmeric, cumin, garlic + 2 small wholegrain rotis. Add a side salad.", emoji: "🫓" },
    { name: "Lean Beef Tacos", cal: 490, time: "20 min", tags: ["protein","family-friendly"], recipe: "Lean minced beef + taco seasoning in lettuce cups. Top with salsa, low-fat yogurt & avocado.", emoji: "🌮" },
    { name: "Zucchini Pasta", cal: 350, time: "15 min", tags: ["low-carb","vegetarian"], recipe: "Spiralized zucchini + cherry tomatoes + garlic + basil + parmesan. Light olive oil toss.", emoji: "🍝" },
  ],
  snacks: [
    { name: "Apple & Peanut Butter", cal: 200, time: "1 min", tags: ["fiber","healthy-fat"], recipe: "1 medium apple sliced + 1 tbsp natural peanut butter.", emoji: "🍎" },
    { name: "Boiled Eggs", cal: 156, time: "10 min", tags: ["protein","cheap"], recipe: "2 hard boiled eggs. Prep a batch at the start of the week.", emoji: "🥚" },
    { name: "Hummus & Veggie Sticks", cal: 180, time: "5 min", tags: ["fiber","vegetarian"], recipe: "3 tbsp hummus + carrot sticks + celery + cucumber slices.", emoji: "🥕" },
    { name: "Cottage Cheese Cup", cal: 160, time: "1 min", tags: ["protein","low-fat"], recipe: "1/2 cup low-fat cottage cheese + sliced cucumber + pinch of black pepper.", emoji: "🧀" },
  ],
};

const ALL_TAGS = ["quick","protein","low-carb","high-fiber","easy","plant-based","meal-prep","budget"];

async function getAISuggestion(profile, remaining, mealType) {
  const prompt = `You are a friendly nutritionist. The user wants to lose weight.
Profile: ${profile.age}y ${profile.sex}, ${profile.weight}kg, target ${profile.targetWeight}kg, BMI ${(profile.weight/((profile.height/100)**2)).toFixed(1)}.
They have ${remaining} calories remaining today.
Suggest ONE ${mealType} meal that fits within ${Math.round(remaining * 0.6)} calories.
Reply in this exact JSON format (nothing else):
{"name":"meal name","cal":number,"time":"X min","emoji":"single emoji","recipe":"2-3 sentence recipe","tip":"1 sentence motivation/tip"}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await res.json();
  const text = data.content?.find(b => b.type === "text")?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

function App() {
  const [tab, setTab] = useState("home");
  const [profile, setProfile] = useState(null);
  const [pForm, setPForm] = useState({ name:"", weight:"", height:"", age:"", sex:"female", targetWeight:"" });
  const [meals, setMeals] = useState([]);
  const [weightLog, setWeightLog] = useState([]);
  const [mealInput, setMealInput] = useState({ name:"", calories:"" });
  const [newWeight, setNewWeight] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [suggestTab, setSuggestTab] = useState("breakfast");
  const [filterTag, setFilterTag] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    (async () => {
      const p = await load("nm_profile");
      const m = await load("nm_meals");
      const w = await load("nm_weights");
      if (p) setProfile(p);
      if (m) setMeals(m);
      if (w) setWeightLog(w);
      setLoaded(true);
    })();
  }, []);

  const saveProfile = async () => {
    const p = { ...pForm, weight: +pForm.weight, height: +pForm.height, age: +pForm.age, targetWeight: +pForm.targetWeight };
    setProfile(p);
    await save("nm_profile", p);
    const wl = [{ date: todayStr(), weight: p.weight }];
    setWeightLog(wl);
    await save("nm_weights", wl);
    setTab("home");
  };

  const todayMeals = meals.filter(m => m.date === todayStr());
  const todayKcal = todayMeals.reduce((s, m) => s + m.calories, 0);

  const addMeal = async (name, cal) => {
    if (!name || !cal) return;
    const m = [...meals, { name, calories: +cal, date: todayStr(), id: Date.now() }];
    setMeals(m); await save("nm_meals", m);
    setMealInput({ name:"", calories:"" });
  };

  const removeMeal = async (id) => {
    const m = meals.filter(x => x.id !== id);
    setMeals(m); await save("nm_meals", m);
  };

  const logWeight = async () => {
    if (!newWeight) return;
    const wl = [...weightLog, { date: todayStr(), weight: +newWeight }];
    setWeightLog(wl); await save("nm_weights", wl);
    setNewWeight("");
  };

  const getAI = async () => {
    setAiLoading(true); setAiError(null); setAiSuggestion(null);
    try {
      const s = await getAISuggestion(profile, dailyGoal - todayKcal, suggestTab);
      setAiSuggestion(s);
    } catch(e) { setAiError("Couldn't load suggestion. Try again!"); }
    setAiLoading(false);
  };

  if (!loaded) return React.createElement("div", { style: { color:"#6ee7b7", padding:40, fontFamily:"Georgia", fontSize:18 } }, "🌿 Loading...");

  if (!profile) {
    return React.createElement("div", { style: S.root },
      React.createElement("div", { style: S.onboard },
        React.createElement("div", { style: { textAlign:"center", marginBottom:24, paddingTop:20 } },
          React.createElement("div", { style: { fontSize:52 } }, "🌿"),
          React.createElement("h1", { style: { color:"#f0faf0", fontSize:28, fontWeight:700, margin:"8px 0 4px", fontFamily:"Georgia" } }, "NourishMe"),
          React.createElement("p", { style: { color:"#4a7a4a", fontSize:13 } }, "Your personal weight loss companion")
        ),
        [["Your name","name","text","e.g. Priya"],["Current weight (kg)","weight","number","e.g. 85"],
         ["Target weight (kg)","targetWeight","number","e.g. 65"],["Height (cm)","height","number","e.g. 165"],
         ["Age","age","number","e.g. 30"]].map(([l,k,t,ph]) =>
          React.createElement("div", { key:k, style:{ marginBottom:14 } },
            React.createElement("div", { style: S.fieldLabel }, l),
            React.createElement("input", { style: S.input, type:t, placeholder:ph, value:pForm[k],
              onChange: e => setPForm(f=>({...f,[k]:e.target.value})) })
          )
        ),
        React.createElement("div", { style:{ marginBottom:14 } },
          React.createElement("div", { style: S.fieldLabel }, "Biological sex"),
          React.createElement("div", { style:{ display:"flex", gap:10 } },
            ["female","male"].map(s =>
              React.createElement("button", { key:s, style:{...S.toggleBtn,...(pForm.sex===s?S.toggleActive:{})},
                onClick: ()=>setPForm(f=>({...f,sex:s})) }, s==="female"?"♀ Female":"♂ Male")
            )
          )
        ),
        React.createElement("button", { style: S.btn, onClick: saveProfile,
          disabled: !pForm.name||!pForm.weight||!pForm.height||!pForm.age||!pForm.targetWeight },
          "Begin my journey →")
      )
    );
  }

  const bmi = profile.weight / ((profile.height/100)**2);
  const bmr = calcBMR(profile);
  const tdee = calcTDEE(bmr);
  const dailyGoal = calcGoal(tdee);
  const remaining = dailyGoal - todayKcal;
  const pct = Math.min((todayKcal/dailyGoal)*100, 100);
  const bmiInfo = getBMIInfo(bmi);
  const latestW = weightLog.length ? weightLog[weightLog.length-1].weight : profile.weight;
  const lostSoFar = +(profile.weight - latestW).toFixed(1);
  const weeksLeft = Math.max(0, Math.ceil((latestW - profile.targetWeight)/1));
  const filteredMeals = MEAL_DB[suggestTab].filter(m => !filterTag || m.tags.includes(filterTag));

  const greeting = () => { const h=new Date().getHours(); return h<12?"Good morning":h<17?"Good afternoon":"Good evening"; };

  const TABS = [
    {id:"home",icon:"🏠",label:"Home"},
    {id:"log",icon:"🍽",label:"Log"},
    {id:"meals",icon:"✨",label:"Meals"},
    {id:"progress",icon:"📈",label:"Progress"},
    {id:"profile",icon:"👤",label:"Profile"},
  ];

  const e = React.createElement;

  const Tag = ({color, children}) => e("span", { style:{ background:"rgba(255,255,255,.07)", border:`1px solid ${color}44`, color, borderRadius:6, padding:"2px 7px", fontSize:10 } }, children);
  const StatRow = ({label,val,color}) => e("div", { style:{ marginBottom:10 } }, e("div",{style:{color:"#4a6a4a",fontSize:10,marginBottom:1}},label), e("div",{style:{color,fontWeight:700,fontSize:14}},val));
  const JCard = ({icon,label,val,col}) => e("div",{style:{flex:1,background:"#14290f",border:"1px solid #2d4a2d",borderRadius:12,padding:"12px 8px",textAlign:"center"}}, e("div",{style:{fontSize:18,marginBottom:4}},icon), e("div",{style:{color:col,fontWeight:700,fontSize:14}},val), e("div",{style:{color:"#4a6a4a",fontSize:10,marginTop:2}},label));

  return e("div", { style: S.root },
    e("div", { style: S.app },

      // Header
      e("div", { style: S.header },
        e("div", null,
          e("div", { style: S.hi }, `${greeting()}, ${profile.name.split(" ")[0]} 👋`),
          e("div", { style: S.headerSub }, todayStr())
        ),
        e("div", { style: S.bmiChip },
          e("span", { style:{ color:bmiInfo.color, fontWeight:700 } }, bmiInfo.label),
          e("span", { style: S.bmiChipNum }, ` · BMI ${bmi.toFixed(1)}`)
        )
      ),

      // Content
      e("div", { style: S.content },

        // HOME TAB
        tab==="home" && e("div", null,
          e("div", { style: S.card },
            e("div", { style: S.cardTitle }, "Today's Calories"),
            e("div", { style: S.ringRow },
              e("svg", { width:150, height:150, viewBox:"0 0 150 150" },
                e("circle", { cx:75, cy:75, r:60, fill:"none", stroke:"#1c2e1c", strokeWidth:13 }),
                e("circle", { cx:75, cy:75, r:60, fill:"none", stroke:remaining<0?"#fca5a5":"#6ee7b7", strokeWidth:13, strokeLinecap:"round",
                  strokeDasharray:`${2*Math.PI*60}`, strokeDashoffset:`${2*Math.PI*60*(1-pct/100)}`,
                  transform:"rotate(-90 75 75)", style:{ transition:"stroke-dashoffset .7s ease" } }),
                e("text", { x:75, y:67, textAnchor:"middle", style:{ fill:"#f0faf0", fontSize:26, fontWeight:700, fontFamily:"Georgia" } }, todayKcal),
                e("text", { x:75, y:85, textAnchor:"middle", style:{ fill:"#6ee7b7", fontSize:11, fontFamily:"Georgia" } }, `of ${dailyGoal} kcal`),
                e("text", { x:75, y:103, textAnchor:"middle", style:{ fill:remaining<0?"#fca5a5":"#a7f3d0", fontSize:10, fontFamily:"Georgia" } },
                  remaining<0?`${Math.abs(Math.round(remaining))} over`:`${Math.round(remaining)} remaining`)
              ),
              e("div", { style: S.ringStats },
                e(StatRow, { label:"Daily goal", val:`${dailyGoal} kcal`, color:"#6ee7b7" }),
                e(StatRow, { label:"Consumed", val:`${todayKcal} kcal`, color:"#fcd34d" }),
                e(StatRow, { label:"Meals today", val:todayMeals.length, color:"#a5b4fc" }),
                e(StatRow, { label:"BMR", val:`${Math.round(bmr)} kcal`, color:"#f9a8d4" })
              )
            )
          ),
          e("div", { style: S.journeyRow },
            e(JCard, { icon:"⚖️", label:"Lost", val:`${lostSoFar} kg`, col:"#6ee7b7" }),
            e(JCard, { icon:"🎯", label:"To go", val:`${(latestW-profile.targetWeight).toFixed(1)} kg`, col:"#fcd34d" }),
            e(JCard, { icon:"📅", label:"~Weeks", val:weeksLeft||"🎉", col:"#a5b4fc" })
          ),
          e("div", { style: S.card },
            e("div", { style: S.cardTitle }, `Body Mass Index · ${bmi.toFixed(1)}`),
            e("div", { style: S.bmiBarRow },
              [["<18.5","#7dd3fc"],["18.5-25","#6ee7b7"],["25-30","#fcd34d"],["30+","#fca5a5"]].map(([l,c],i) =>
                e("div", { key:i, style:{ flex:1, textAlign:"center" } },
                  e("div", { style:{ height:8, background:c, opacity:bmiInfo.band===i?1:0.25, borderRadius:4, marginBottom:4 } }),
                  e("div", { style:{ color:"#4a6a4a", fontSize:9 } }, l)
                )
              )
            ),
            e("div", { style:{ color:bmiInfo.color, fontWeight:700, fontSize:14, marginTop:6 } }, `${bmiInfo.label} — keep going! 💪`)
          ),
          todayMeals.length>0 && e("div", { style: S.card },
            e("div", { style: S.cardTitle }, "Today's meals"),
            todayMeals.slice(-4).map(m =>
              e("div", { key:m.id, style: S.mealRowSmall },
                e("span", { style:{ color:"#d0ead0", fontSize:13 } }, `🍴 ${m.name}`),
                e("span", { style:{ color:"#6ee7b7", fontWeight:700, fontSize:13 } }, `${m.calories} kcal`)
              )
            )
          )
        ),

        // LOG TAB
        tab==="log" && e("div", null,
          e("div", { style: S.card },
            e("div", { style: S.cardTitle }, "Add a meal"),
            e("input", { style: S.input, placeholder:"Food name", value:mealInput.name,
              onChange: ev=>setMealInput(f=>({...f,name:ev.target.value})) }),
            e("input", { style:{...S.input,marginTop:8}, type:"number", placeholder:"Calories (kcal)", value:mealInput.calories,
              onChange: ev=>setMealInput(f=>({...f,calories:ev.target.value})) }),
            e("button", { style:{...S.btn,marginTop:12}, onClick:()=>addMeal(mealInput.name,mealInput.calories) }, "+ Add meal")
          ),
          e("div", { style:{...S.cardTitle,marginBottom:10} }, "Quick add"),
          e("div", { style: S.quickGrid },
            [...MEAL_DB.breakfast,...MEAL_DB.snacks].map(f =>
              e("button", { key:f.name, style: S.quickBtn, onClick:()=>addMeal(f.name,f.cal) },
                e("span", { style:{ fontSize:20 } }, f.emoji),
                e("span", { style:{ color:"#d0ead0", fontSize:10, lineHeight:1.3, textAlign:"center" } }, f.name),
                e("span", { style:{ color:"#6ee7b7", fontWeight:700, fontSize:11 } }, `${f.cal} kcal`)
              )
            )
          ),
          e("div", { style:{...S.cardTitle,marginBottom:10} }, "Today's log"),
          todayMeals.length===0 && e("div", { style: S.empty }, "No meals logged yet today"),
          todayMeals.map(m =>
            e("div", { key:m.id, style: S.mealRow },
              e("span", { style:{ color:"#f0faf0", fontSize:14 } }, m.name),
              e("div", { style:{ display:"flex", alignItems:"center", gap:10 } },
                e("span", { style:{ color:"#6ee7b7", fontWeight:700 } }, `${m.calories} kcal`),
                e("button", { style: S.delBtn, onClick:()=>removeMeal(m.id) }, "✕")
              )
            )
          ),
          todayMeals.length>0 && e("div", { style: S.totalBanner },
            `${todayKcal} / ${dailyGoal} kcal`,
            remaining>=0
              ? e("span", { style:{ color:"#6ee7b7" } }, ` · ${Math.round(remaining)} remaining`)
              : e("span", { style:{ color:"#fca5a5" } }, ` · ${Math.abs(Math.round(remaining))} over!`)
          )
        ),

        // MEALS TAB
        tab==="meals" && e("div", null,
          e("div", { style: S.mealTypeTabs },
            ["breakfast","lunch","dinner","snacks"].map(t =>
              e("button", { key:t, style:{...S.mealTypeBtn,...(suggestTab===t?S.mealTypeActive:{})},
                onClick:()=>{ setSuggestTab(t); setAiSuggestion(null); } },
                `${{"breakfast":"🌅","lunch":"☀️","dinner":"🌙","snacks":"🍎"}[t]} ${t}`)
            )
          ),
          e("div", { style: S.aiBox },
            e("div", { style: S.aiTitle }, "✨ AI Meal Suggestion"),
            e("div", { style: S.aiSub }, `Get a personalised meal based on your remaining ${Math.round(remaining)} kcal today`),
            e("button", { style:{...S.btn,marginTop:10,background:"linear-gradient(135deg,#166534,#15803d)"}, onClick:getAI, disabled:aiLoading },
              aiLoading?"🔄 Finding something for you...":"🤖 Suggest a meal for me"),
            aiError && e("div", { style:{ color:"#fca5a5", fontSize:12, marginTop:8 } }, aiError),
            aiSuggestion && e("div", { style: S.aiResult },
              e("div", { style:{ fontSize:32, marginBottom:6 } }, aiSuggestion.emoji),
              e("div", { style:{ color:"#f0faf0", fontWeight:700, fontSize:17, marginBottom:6 } }, aiSuggestion.name),
              e("div", { style:{ display:"flex", gap:8, marginBottom:10, justifyContent:"center", flexWrap:"wrap" } },
                e(Tag, { color:"#6ee7b7" }, `${aiSuggestion.cal} kcal`),
                e(Tag, { color:"#fcd34d" }, `⏱ ${aiSuggestion.time}`)
              ),
              e("div", { style: S.recipeBox }, e("strong", { style:{ color:"#6ee7b7" } }, "Recipe: "), aiSuggestion.recipe),
              aiSuggestion.tip && e("div", { style: S.tipBox }, `💡 ${aiSuggestion.tip}`),
              e("button", { style:{...S.btn,marginTop:10,fontSize:12,padding:"8px"}, onClick:()=>addMeal(aiSuggestion.name,aiSuggestion.cal) }, "+ Log this meal")
            )
          ),
          e("div", { style: S.tagRow },
            e("button", { style:{...S.tagBtn,...(!filterTag?S.tagActive:{})}, onClick:()=>setFilterTag(null) }, "All"),
            ALL_TAGS.map(t => e("button", { key:t, style:{...S.tagBtn,...(filterTag===t?S.tagActive:{})}, onClick:()=>setFilterTag(filterTag===t?null:t) }, t))
          ),
          filteredMeals.map(m =>
            e("div", { key:m.name, style: S.suggestCard },
              e("div", { style: S.suggestTop },
                e("span", { style:{ fontSize:26 } }, m.emoji),
                e("div", { style:{ flex:1 } },
                  e("div", { style:{ color:"#f0faf0", fontWeight:700, fontSize:14 } }, m.name),
                  e("div", { style:{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap" } },
                    e(Tag, { color:"#6ee7b7" }, `${m.cal} kcal`),
                    e(Tag, { color:"#fcd34d" }, `⏱ ${m.time}`),
                    m.tags.slice(0,2).map(t => e(Tag, { key:t, color:"#a5b4fc" }, t))
                  )
                ),
                e("button", { style: S.logSmallBtn, onClick:()=>addMeal(m.name,m.cal) }, "+ Log")
              ),
              e("div", { style: S.recipeBox }, m.recipe)
            )
          )
        ),

        // PROGRESS TAB
        tab==="progress" && e("div", null,
          e("div", { style: S.card },
            e("div", { style: S.cardTitle }, "Log today's weight"),
            e("input", { style: S.input, type:"number", placeholder:"Your weight today (kg)", value:newWeight,
              onChange: ev=>setNewWeight(ev.target.value) }),
            e("button", { style:{...S.btn,marginTop:10}, onClick:logWeight, disabled:!newWeight }, "Save weight")
          ),
          weightLog.length>1 && e("div", { style: S.card },
            e("div", { style: S.cardTitle }, "Weight trend"),
            e("div", { style: S.chartWrap },
              weightLog.slice(-12).map((w,i,arr) => {
                const max=Math.max(...arr.map(x=>x.weight));
                const min=Math.min(...arr.map(x=>x.weight));
                const range=max-min||1;
                const h=20+((w.weight-min)/range)*90;
                const isLowest=w.weight===Math.min(...arr.map(x=>x.weight));
                return e("div", { key:i, style:{ display:"flex", flexDirection:"column", alignItems:"center", flex:1, gap:3 } },
                  e("div", { style:{ color:"#86efac", fontSize:8 } }, w.weight),
                  e("div", { style:{ width:"80%", height:h, background:isLowest?"#4ade80":"#166534", borderRadius:"3px 3px 0 0" } }),
                  e("div", { style:{ color:"#4a6a4a", fontSize:7, transform:"rotate(-40deg)", transformOrigin:"center", whiteSpace:"nowrap" } }, w.date.slice(5))
                );
              })
            )
          ),
          e("div", { style: S.journeyRow },
            e(JCard, { icon:"🏁", label:"Start", val:`${profile.weight} kg`, col:"#a5b4fc" }),
            e(JCard, { icon:"📍", label:"Now", val:`${latestW} kg`, col:"#6ee7b7" }),
            e(JCard, { icon:"🏆", label:"Goal", val:`${profile.targetWeight} kg`, col:"#fcd34d" })
          ),
          lostSoFar>0 && e("div", { style: S.lostBanner }, "🎉 You've lost ", e("strong", null, `${lostSoFar} kg`), " so far — amazing work!"),
          e("div", { style: S.card },
            e("div", { style: S.cardTitle }, "Projection"),
            e("div", { style:{ color:"#d0ead0", fontSize:13, lineHeight:1.8 } },
              "At 1 kg/week, you'll reach ",
              e("strong", { style:{ color:"#fcd34d" } }, `${profile.targetWeight} kg`),
              " in approximately ",
              e("strong", { style:{ color:"#6ee7b7" } }, `${weeksLeft} weeks`),
              ". That's roughly ",
              e("strong", { style:{ color:"#a5b4fc" } }, new Date(Date.now()+weeksLeft*7*86400000).toLocaleDateString("en-AU",{month:"long",year:"numeric"})),
              ". You've got this! 💪"
            )
          )
        ),

        // PROFILE TAB
        tab==="profile" && e("div", { style: S.card },
          e("div", { style:{ textAlign:"center", marginBottom:16 } },
            e("div", { style: S.avatar }, profile.name[0].toUpperCase()),
            e("div", { style:{ color:"#f0faf0", fontSize:20, fontWeight:700 } }, profile.name),
            e("div", { style:{ color:"#6b9e6b", fontSize:12, marginTop:4 } }, `${profile.sex==="female"?"♀":"♂"} · ${profile.age} years old`)
          ),
          [["Height",`${profile.height} cm`],["Starting weight",`${profile.weight} kg`],
           ["Target weight",`${profile.targetWeight} kg`],["BMI",`${bmi.toFixed(1)} (${bmiInfo.label})`],
           ["BMR",`${Math.round(bmr)} kcal/day`],["TDEE",`${Math.round(tdee)} kcal/day`],
           ["Daily calorie goal",`${dailyGoal} kcal/day`],["Daily deficit","500 kcal/day = 1 kg/week"]].map(([l,v]) =>
            e("div", { key:l, style: S.profileRow },
              e("span", { style:{ color:"#6b9e6b", fontSize:13 } }, l),
              e("span", { style:{ color:"#f0faf0", fontSize:13, fontWeight:600 } }, v)
            )
          ),
          e("div", { style: S.infoBox },
            e("strong", null, "How your calorie goal works: "),
            `Your BMR (${Math.round(bmr)} kcal) x 1.2 activity = TDEE (${Math.round(tdee)} kcal). Subtracting 500 kcal/day creates a deficit that leads to ~1 kg/week loss safely.`
          ),
          e("button", { style:{...S.btn, background:"#0a120a", border:"1px solid #4ade80", color:"#4ade80", marginTop:16},
            onClick:()=>{ setProfile(null); setPForm({ name:"", weight:"", height:"", age:"", sex:"female", targetWeight:"" }); } },
            "Reset & start over")
        )

      ),

      // Nav bar
      e("div", { style: S.nav },
        TABS.map(t =>
          e("button", { key:t.id, style:{...S.navBtn,...(tab===t.id?S.navActive:{})}, onClick:()=>setTab(t.id) },
            e("span", { style:{ fontSize:17 } }, t.icon),
            e("span", { style:{ fontSize:9, marginTop:1 } }, t.label)
          )
        )
      )

    )
  );
}

const S = {
  root:{ minHeight:"100vh", background:"#080f08", display:"flex", justifyContent:"center", fontFamily:"Georgia,serif" },
  app:{ width:"100%", maxWidth:430, background:"#0c160c", minHeight:"100vh", display:"flex", flexDirection:"column" },
  header:{ padding:"18px 18px 14px", background:"linear-gradient(160deg,#112211 0%,#1a2e1a 100%)", borderBottom:"1px solid #1e3a1e", display:"flex", justifyContent:"space-between", alignItems:"center" },
  hi:{ color:"#f0faf0", fontSize:18, fontWeight:700 },
  headerSub:{ color:"#4a7a4a", fontSize:11, marginTop:2 },
  bmiChip:{ background:"#0c160c", border:"1px solid #2d4a2d", borderRadius:20, padding:"4px 12px", fontSize:12 },
  bmiChipNum:{ color:"#4a7a4a" },
  content:{ flex:1, padding:"14px 14px 80px", overflowY:"auto" },
  nav:{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"#080f08", borderTop:"1px solid #1e3a1e", display:"flex" },
  navBtn:{ flex:1, background:"none", border:"none", padding:"10px 0 8px", cursor:"pointer", color:"#4a6a4a", display:"flex", flexDirection:"column", alignItems:"center", gap:1, fontFamily:"Georgia" },
  navActive:{ background:"#112211", color:"#6ee7b7" },
  card:{ background:"#112211", border:"1px solid #1e3a1e", borderRadius:16, padding:16, marginBottom:14 },
  cardTitle:{ color:"#6ee7b7", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:12 },
  ringRow:{ display:"flex", gap:16, alignItems:"center" },
  ringStats:{ flex:1 },
  journeyRow:{ display:"flex", gap:10, marginBottom:14 },
  bmiBarRow:{ display:"flex", gap:6, marginBottom:6 },
  mealRowSmall:{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #1e3a1e" },
  quickGrid:{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:16 },
  quickBtn:{ background:"#112211", border:"1px solid #1e3a1e", borderRadius:10, padding:"10px 6px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3 },
  mealRow:{ background:"#112211", border:"1px solid #1e3a1e", borderRadius:10, padding:"12px 14px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" },
  delBtn:{ background:"none", border:"none", color:"#fca5a5", cursor:"pointer", fontSize:14 },
  totalBanner:{ background:"#0a1a0a", borderRadius:10, padding:"12px 14px", color:"#d0ead0", fontSize:13, marginTop:4, textAlign:"center" },
  empty:{ color:"#3a5a3a", fontSize:13, padding:"20px 0", textAlign:"center" },
  mealTypeTabs:{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" },
  mealTypeBtn:{ background:"#112211", border:"1px solid #1e3a1e", borderRadius:20, padding:"6px 12px", color:"#4a7a4a", cursor:"pointer", fontSize:12, fontFamily:"Georgia", textTransform:"capitalize" },
  mealTypeActive:{ background:"#15803d", border:"1px solid #4ade80", color:"#f0faf0" },
  aiBox:{ background:"linear-gradient(135deg,#0c1f0c,#142814)", border:"1px solid #2d5a2d", borderRadius:16, padding:16, marginBottom:14 },
  aiTitle:{ color:"#f0faf0", fontWeight:700, fontSize:16, marginBottom:4 },
  aiSub:{ color:"#6b9e6b", fontSize:12 },
  aiResult:{ marginTop:14, padding:14, background:"#0a150a", borderRadius:12, border:"1px solid #1e3a1e", textAlign:"center" },
  recipeBox:{ background:"#0a150a", borderRadius:8, padding:10, color:"#a0c8a0", fontSize:12, lineHeight:1.6, marginTop:8, textAlign:"left" },
  tipBox:{ background:"#142814", borderRadius:8, padding:10, color:"#6ee7b7", fontSize:12, marginTop:8, textAlign:"left" },
  tagRow:{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 },
  tagBtn:{ background:"#112211", border:"1px solid #1e3a1e", borderRadius:20, padding:"4px 10px", color:"#4a7a4a", cursor:"pointer", fontSize:11, fontFamily:"Georgia" },
  tagActive:{ background:"#166534", border:"1px solid #4ade80", color:"#f0faf0" },
  suggestCard:{ background:"#112211", border:"1px solid #1e3a1e", borderRadius:14, padding:14, marginBottom:10 },
  suggestTop:{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:10 },
  logSmallBtn:{ background:"#15803d", border:"none", borderRadius:8, padding:"6px 10px", color:"#f0faf0", cursor:"pointer", fontSize:11, fontFamily:"Georgia", whiteSpace:"nowrap" },
  chartWrap:{ display:"flex", gap:4, alignItems:"flex-end", minHeight:130, padding:"0 0 4px" },
  lostBanner:{ background:"#112211", border:"1px solid #4ade80", borderRadius:12, padding:"12px 16px", color:"#86efac", fontSize:14, textAlign:"center", marginBottom:14 },
  avatar:{ width:56, height:56, borderRadius:"50%", background:"#15803d", color:"#f0faf0", fontSize:24, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px", fontWeight:700 },
  profileRow:{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #1e3a1e" },
  infoBox:{ background:"#0a150a", borderRadius:10, padding:12, color:"#6b9e6b", fontSize:12, lineHeight:1.7, marginTop:12 },
  onboard:{ width:"100%", maxWidth:430, padding:"32px 24px", margin:"0 auto" },
  fieldLabel:{ color:"#6ee7b7", fontSize:11, textTransform:"uppercase", letterSpacing:.5, marginBottom:4 },
  input:{ background:"#080f08", border:"1px solid #1e3a1e", borderRadius:10, padding:"11px 14px", color:"#f0faf0", fontSize:14, fontFamily:"Georgia", outline:"none", width:"100%", boxSizing:"border-box" },
  toggleBtn:{ flex:1, background:"#112211", border:"1px solid #1e3a1e", borderRadius:10, padding:10, color:"#4a7a4a", cursor:"pointer", fontFamily:"Georgia", fontSize:14 },
  toggleActive:{ background:"#15803d", border:"1px solid #4ade80", color:"#f0faf0" },
  btn:{ background:"#15803d", border:"none", borderRadius:10, padding:"12px", color:"#f0faf0", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"Georgia", width:"100%" },
};
