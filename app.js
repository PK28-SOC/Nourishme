// NourishMe - browser ready, no imports needed
const { useState, useEffect, useRef } = React;

// ── Storage (localStorage fallback since no window.storage in plain browser) ──
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} };
const load = (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch(e){ return null; } };
const todayStr = () => new Date().toISOString().split("T")[0];
const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };

// ── Calculations ──────────────────────────────────────────────────────────────
const calcBMR = p => { const b = 10*p.weight + 6.25*p.height - 5*p.age; return p.sex === "female" ? b - 161 : b + 5; };
const calcTDEE = bmr => bmr * 1.2;
const calcGoal = tdee => Math.round(tdee - 500);
const getBMIInfo = bmi => {
  if (bmi < 18.5) return { label:"Underweight", color:"#7dd3fc", band:0 };
  if (bmi < 25)   return { label:"Healthy",     color:"#6ee7b7", band:1 };
  if (bmi < 30)   return { label:"Overweight",  color:"#fcd34d", band:2 };
  return               { label:"Obese",       color:"#fca5a5", band:3 };
};

// ── INGREDIENT DATABASE ───────────────────────────────────────────────────────
const INGREDIENT_DB = [
  // Indian Breads
  { name:"Chapati", cat:"Indian Breads", emoji:"🫓",
    variants:[{l:"Small (15cm)",c:70},{l:"Medium (20cm)",c:100},{l:"Large (25cm)",c:140}],
    extras:[{l:"Plain",d:0},{l:"With ghee +40",d:40},{l:"With butter +35",d:35}],
    macros:{p:3,carb:18,f:2} },
  { name:"Paratha", cat:"Indian Breads", emoji:"🫓",
    variants:[{l:"Small",c:150},{l:"Medium",c:200},{l:"Large",c:260}],
    extras:[{l:"Plain",d:0},{l:"With ghee +50",d:50},{l:"Aloo stuffed +80",d:80},{l:"Paneer stuffed +70",d:70}],
    macros:{p:4,carb:28,f:7} },
  { name:"Naan", cat:"Indian Breads", emoji:"🫓",
    variants:[{l:"Small",c:170},{l:"Medium",c:260},{l:"Large",c:340}],
    extras:[{l:"Plain",d:0},{l:"Butter naan +60",d:60},{l:"Garlic naan +40",d:40}],
    macros:{p:8,carb:45,f:4} },
  { name:"Puri", cat:"Indian Breads", emoji:"🫓",
    variants:[{l:"Small",c:100},{l:"Medium",c:140},{l:"Large",c:180}],
    extras:[{l:"Regular",d:0},{l:"Whole wheat -10",d:-10}],
    macros:{p:3,carb:17,f:6} },
  { name:"Bhatura", cat:"Indian Breads", emoji:"🫓",
    variants:[{l:"Small",c:190},{l:"Medium",c:250},{l:"Large",c:320}],
    extras:[{l:"Regular",d:0}],
    macros:{p:5,carb:30,f:10} },
  { name:"Roti", cat:"Indian Breads", emoji:"🫓",
    variants:[{l:"1 roti",c:80},{l:"2 rotis",c:160}],
    extras:[{l:"Plain",d:0},{l:"With ghee +40",d:40}],
    macros:{p:3,carb:16,f:1} },

  // Rice
  { name:"Steamed rice", cat:"Rice", emoji:"🍚",
    variants:[{l:"Small bowl 100g",c:130},{l:"Medium bowl 150g",c:195},{l:"Large bowl 250g",c:325}],
    extras:[{l:"Basmati",d:0},{l:"White rice",d:0},{l:"Brown rice -10",d:-10},{l:"With ghee +40",d:40}],
    macros:{p:3,carb:28,f:0} },
  { name:"Jeera rice", cat:"Rice", emoji:"🍚",
    variants:[{l:"Small 100g",c:150},{l:"Medium 150g",c:225},{l:"Large 250g",c:375}],
    extras:[{l:"Light oil",d:0},{l:"Extra ghee +40",d:40}],
    macros:{p:3,carb:30,f:4} },
  { name:"Chicken biryani", cat:"Rice", emoji:"🍛",
    variants:[{l:"Small plate 200g",c:320},{l:"Medium plate 300g",c:480},{l:"Large plate 400g",c:640}],
    extras:[{l:"Plain",d:0},{l:"With raita +40",d:40}],
    macros:{p:18,carb:48,f:14} },
  { name:"Mutton biryani", cat:"Rice", emoji:"🍛",
    variants:[{l:"Small plate 200g",c:380},{l:"Medium plate 300g",c:570},{l:"Large plate 400g",c:760}],
    extras:[{l:"Plain",d:0},{l:"With raita +40",d:40}],
    macros:{p:22,carb:46,f:18} },
  { name:"Veg biryani", cat:"Rice", emoji:"🍛",
    variants:[{l:"Small plate 200g",c:260},{l:"Medium plate 300g",c:390},{l:"Large plate 400g",c:520}],
    extras:[{l:"Plain",d:0},{l:"With raita +40",d:40}],
    macros:{p:7,carb:50,f:8} },
  { name:"Curd rice", cat:"Rice", emoji:"🍚",
    variants:[{l:"Small bowl",c:180},{l:"Medium bowl",c:240},{l:"Large bowl",c:360}],
    extras:[{l:"With tempering",d:0},{l:"Plain",d:0}],
    macros:{p:6,carb:32,f:4} },

  // Dals
  { name:"Dal tadka", cat:"Dals", emoji:"🍲",
    variants:[{l:"Small bowl 100g",c:120},{l:"Medium bowl 150g",c:180},{l:"Large bowl 250g",c:300}],
    extras:[{l:"Plain",d:0},{l:"With ghee +40",d:40},{l:"No tempering -20",d:-20}],
    macros:{p:7,carb:18,f:4} },
  { name:"Dal makhani", cat:"Dals", emoji:"🍲",
    variants:[{l:"Small bowl",c:160},{l:"Medium bowl",c:240},{l:"Large bowl",c:400}],
    extras:[{l:"Regular",d:0},{l:"With cream +50",d:50},{l:"Light -30",d:-30}],
    macros:{p:8,carb:20,f:8} },
  { name:"Moong dal", cat:"Dals", emoji:"🍲",
    variants:[{l:"Small bowl",c:100},{l:"Medium bowl",c:150},{l:"Large bowl",c:250}],
    extras:[{l:"Plain",d:0},{l:"With ghee +40",d:40}],
    macros:{p:7,carb:16,f:2} },
  { name:"Rajma", cat:"Dals", emoji:"🫘",
    variants:[{l:"Small bowl",c:140},{l:"Medium bowl",c:210},{l:"Large bowl",c:350}],
    extras:[{l:"Regular",d:0}],
    macros:{p:9,carb:22,f:3} },
  { name:"Chole", cat:"Dals", emoji:"🫘",
    variants:[{l:"Small bowl",c:150},{l:"Medium bowl",c:225},{l:"Large bowl",c:375}],
    extras:[{l:"Regular",d:0}],
    macros:{p:8,carb:25,f:5} },
  { name:"Chana dal", cat:"Dals", emoji:"🍲",
    variants:[{l:"Small bowl",c:130},{l:"Medium bowl",c:195},{l:"Large bowl",c:325}],
    extras:[{l:"Plain",d:0},{l:"With ghee +40",d:40}],
    macros:{p:8,carb:22,f:3} },

  // Curries
  { name:"Egg curry", cat:"Curries", emoji:"🍛",
    variants:[{l:"1 egg",c:180},{l:"2 eggs",c:320},{l:"3 eggs",c:460}],
    extras:[{l:"With gravy",d:0},{l:"Dry style -30",d:-30},{l:"Extra gravy +20",d:20}],
    macros:{p:12,carb:8,f:12} },
  { name:"Chicken curry", cat:"Curries", emoji:"🍛",
    variants:[{l:"Small 100g",c:165},{l:"Medium 150g",c:248},{l:"Large 200g",c:330}],
    extras:[{l:"With bone",d:0},{l:"Boneless +10",d:10},{l:"Light gravy -20",d:-20}],
    macros:{p:18,carb:6,f:10} },
  { name:"Mutton curry", cat:"Curries", emoji:"🍛",
    variants:[{l:"Small 100g",c:230},{l:"Medium 150g",c:345},{l:"Large 200g",c:460}],
    extras:[{l:"Bone-in",d:0},{l:"Boneless +20",d:20}],
    macros:{p:20,carb:5,f:16} },
  { name:"Palak paneer", cat:"Curries", emoji:"🥬",
    variants:[{l:"Small 100g",c:160},{l:"Medium 150g",c:240},{l:"Large 200g",c:320}],
    extras:[{l:"Regular",d:0},{l:"Extra paneer +50",d:50},{l:"Light -20",d:-20}],
    macros:{p:9,carb:6,f:12} },
  { name:"Paneer butter masala", cat:"Curries", emoji:"🧀",
    variants:[{l:"Small 100g",c:220},{l:"Medium 150g",c:330},{l:"Large 200g",c:440}],
    extras:[{l:"With cream",d:0},{l:"Light -40",d:-40}],
    macros:{p:10,carb:10,f:16} },
  { name:"Aloo gobi", cat:"Curries", emoji:"🥔",
    variants:[{l:"Small 100g",c:110},{l:"Medium 150g",c:165},{l:"Large 200g",c:220}],
    extras:[{l:"Regular",d:0},{l:"Light -20",d:-20}],
    macros:{p:3,carb:16,f:5} },
  { name:"Bhindi masala", cat:"Curries", emoji:"🥗",
    variants:[{l:"Small 100g",c:100},{l:"Medium 150g",c:150},{l:"Large 200g",c:200}],
    extras:[{l:"Regular",d:0},{l:"Light -15",d:-15}],
    macros:{p:3,carb:12,f:5} },
  { name:"Fish curry", cat:"Curries", emoji:"🐟",
    variants:[{l:"Small 100g",c:160},{l:"Medium 150g",c:240},{l:"Large 200g",c:320}],
    extras:[{l:"Coconut based",d:0},{l:"Tomato based -20",d:-20}],
    macros:{p:18,carb:5,f:8} },
  { name:"Keema", cat:"Curries", emoji:"🍖",
    variants:[{l:"Small 100g",c:200},{l:"Medium 150g",c:300},{l:"Large 200g",c:400}],
    extras:[{l:"Chicken mince",d:0},{l:"Mutton mince +30",d:30},{l:"With peas",d:0}],
    macros:{p:20,carb:5,f:13} },
  { name:"Shahi paneer", cat:"Curries", emoji:"🧀",
    variants:[{l:"Small 100g",c:250},{l:"Medium 150g",c:375},{l:"Large 200g",c:500}],
    extras:[{l:"With cream",d:0},{l:"Light -50",d:-50}],
    macros:{p:10,carb:12,f:18} },

  // South Indian
  { name:"Idli", cat:"South Indian", emoji:"🍚",
    variants:[{l:"1 piece",c:40},{l:"2 pieces",c:80},{l:"4 pieces",c:160}],
    extras:[{l:"Plain",d:0},{l:"With sambar +50",d:50},{l:"With chutney +35",d:35}],
    macros:{p:2,carb:8,f:0} },
  { name:"Dosa", cat:"South Indian", emoji:"🥞",
    variants:[{l:"Plain dosa",c:120},{l:"Masala dosa",c:210},{l:"Rava dosa",c:180}],
    extras:[{l:"Plain",d:0},{l:"With ghee +40",d:40},{l:"With sambar +50",d:50}],
    macros:{p:4,carb:22,f:4} },
  { name:"Uttapam", cat:"South Indian", emoji:"🥞",
    variants:[{l:"Small",c:150},{l:"Medium",c:220},{l:"Large",c:300}],
    extras:[{l:"Onion",d:0},{l:"Mixed veg +10",d:10},{l:"With ghee +30",d:30}],
    macros:{p:5,carb:28,f:5} },
  { name:"Medu vada", cat:"South Indian", emoji:"🍩",
    variants:[{l:"1 piece",c:120},{l:"2 pieces",c:240}],
    extras:[{l:"Plain",d:0},{l:"With sambar +50",d:50}],
    macros:{p:4,carb:14,f:7} },

  // Snacks
  { name:"Samosa", cat:"Snacks", emoji:"🥟",
    variants:[{l:"Small",c:130},{l:"Medium",c:180},{l:"Large",c:250}],
    extras:[{l:"Plain",d:0},{l:"With chutney +20",d:20}],
    macros:{p:4,carb:22,f:8} },
  { name:"Pakora", cat:"Snacks", emoji:"🥟",
    variants:[{l:"3 pieces",c:150},{l:"5 pieces",c:250},{l:"8 pieces",c:400}],
    extras:[{l:"Onion",d:0},{l:"Paneer +30",d:30},{l:"Spinach -10",d:-10}],
    macros:{p:4,carb:20,f:8} },
  { name:"Poha", cat:"Snacks", emoji:"🍽",
    variants:[{l:"Small bowl",c:130},{l:"Medium bowl",c:195},{l:"Large bowl",c:325}],
    extras:[{l:"Regular",d:0},{l:"With peanuts +40",d:40}],
    macros:{p:3,carb:26,f:3} },
  { name:"Upma", cat:"Snacks", emoji:"🍽",
    variants:[{l:"Small bowl",c:140},{l:"Medium bowl",c:210},{l:"Large bowl",c:350}],
    extras:[{l:"Regular",d:0},{l:"With cashews +30",d:30}],
    macros:{p:4,carb:24,f:5} },
  { name:"Vada pav", cat:"Snacks", emoji:"🥙",
    variants:[{l:"Small",c:250},{l:"Regular",c:320}],
    extras:[{l:"With chutney +20",d:20},{l:"Plain",d:0}],
    macros:{p:6,carb:40,f:12} },
  { name:"Pav bhaji", cat:"Snacks", emoji:"🥙",
    variants:[{l:"1 pav + bhaji",c:350},{l:"2 pav + bhaji",c:520}],
    extras:[{l:"With butter",d:0},{l:"Extra butter +60",d:60},{l:"Light -30",d:-30}],
    macros:{p:8,carb:48,f:14} },
  { name:"Dhokla", cat:"Snacks", emoji:"🟡",
    variants:[{l:"2 pieces",c:120},{l:"4 pieces",c:240}],
    extras:[{l:"Regular",d:0}],
    macros:{p:6,carb:20,f:2} },

  // Indian Sweets
  { name:"Moong dal halwa", cat:"Indian Sweets", emoji:"🍮",
    variants:[{l:"Small serve 50g",c:180},{l:"Medium serve 80g",c:290},{l:"Large serve 100g",c:360}],
    extras:[{l:"Regular",d:0},{l:"Extra ghee +50",d:50},{l:"Less sweet -20",d:-20}],
    macros:{p:4,carb:35,f:16} },
  { name:"Gulab jamun", cat:"Indian Sweets", emoji:"🟤",
    variants:[{l:"1 small piece",c:125},{l:"1 large piece",c:175},{l:"2 pieces",c:300}],
    extras:[{l:"In syrup",d:0},{l:"Less syrup -20",d:-20}],
    macros:{p:3,carb:22,f:6} },
  { name:"Gajar halwa", cat:"Indian Sweets", emoji:"🥕",
    variants:[{l:"Small serve 80g",c:200},{l:"Medium serve 120g",c:300},{l:"Large serve 160g",c:400}],
    extras:[{l:"Regular",d:0},{l:"With khoya +40",d:40}],
    macros:{p:4,carb:30,f:10} },
  { name:"Kheer", cat:"Indian Sweets", emoji:"🥛",
    variants:[{l:"Small bowl",c:150},{l:"Medium bowl",c:225},{l:"Large bowl",c:300}],
    extras:[{l:"Full fat",d:0},{l:"Reduced fat -30",d:-30},{l:"With dry fruits +40",d:40}],
    macros:{p:5,carb:25,f:7} },
  { name:"Ladoo", cat:"Indian Sweets", emoji:"🟡",
    variants:[{l:"Small 30g",c:130},{l:"Medium 50g",c:215},{l:"Large 70g",c:300}],
    extras:[{l:"Besan",d:0},{l:"Motichoor +10",d:10},{l:"Coconut -15",d:-15}],
    macros:{p:3,carb:28,f:10} },
  { name:"Jalebi", cat:"Indian Sweets", emoji:"🟠",
    variants:[{l:"2 pieces 50g",c:150},{l:"4 pieces 100g",c:300}],
    extras:[{l:"Regular",d:0},{l:"With rabri +120",d:120}],
    macros:{p:2,carb:30,f:6} },
  { name:"Rasgulla", cat:"Indian Sweets", emoji:"⚪",
    variants:[{l:"1 piece",c:100},{l:"2 pieces",c:200}],
    extras:[{l:"In syrup",d:0},{l:"Less syrup -15",d:-15}],
    macros:{p:3,carb:20,f:2} },

  // Drinks
  { name:"Masala chai", cat:"Drinks", emoji:"☕",
    variants:[{l:"Small cup 150ml",c:60},{l:"Regular cup 200ml",c:80},{l:"Large cup 300ml",c:120}],
    extras:[{l:"With sugar",d:30},{l:"No sugar",d:0},{l:"Full fat milk",d:0},{l:"Reduced fat -10",d:-10}],
    macros:{p:2,carb:8,f:3} },
  { name:"Lassi", cat:"Drinks", emoji:"🥛",
    variants:[{l:"Small 200ml",c:140},{l:"Regular 300ml",c:210},{l:"Large 400ml",c:280}],
    extras:[{l:"Sweet",d:0},{l:"Salted -20",d:-20},{l:"Mango +40",d:40}],
    macros:{p:5,carb:22,f:5} },
  { name:"Buttermilk (chaas)", cat:"Drinks", emoji:"🥛",
    variants:[{l:"Small 200ml",c:40},{l:"Regular 300ml",c:60}],
    extras:[{l:"Salted with cumin",d:0},{l:"Sweet +20",d:20}],
    macros:{p:2,carb:5,f:1} },

  // Eggs
  { name:"Egg", cat:"Eggs & Protein", emoji:"🥚",
    variants:[{l:"Small",c:54},{l:"Medium",c:63},{l:"Large",c:78},{l:"Extra large",c:90}],
    extras:[{l:"Boiled",d:0},{l:"Fried +35",d:35},{l:"Scrambled +20",d:20},{l:"Poached",d:0},{l:"Half fry +25",d:25}],
    macros:{p:6,carb:0,f:5} },
  { name:"Egg bhurji", cat:"Eggs & Protein", emoji:"🥚",
    variants:[{l:"2 egg serve",c:200},{l:"3 egg serve",c:280},{l:"4 egg serve",c:360}],
    extras:[{l:"Regular",d:0},{l:"With butter +40",d:40}],
    macros:{p:14,carb:5,f:14} },
  { name:"Chicken breast", cat:"Eggs & Protein", emoji:"🍗",
    variants:[{l:"Small 100g",c:165},{l:"Medium 150g",c:248},{l:"Large 200g",c:330}],
    extras:[{l:"Grilled",d:0},{l:"Baked",d:0},{l:"Pan fried +30",d:30}],
    macros:{p:31,carb:0,f:4} },
  { name:"Salmon", cat:"Eggs & Protein", emoji:"🐟",
    variants:[{l:"Small 100g",c:208},{l:"Medium 150g",c:312},{l:"Large 200g",c:416}],
    extras:[{l:"Baked",d:0},{l:"Pan fried +40",d:40}],
    macros:{p:20,carb:0,f:13} },
  { name:"Tuna (canned)", cat:"Eggs & Protein", emoji:"🐟",
    variants:[{l:"Small can 95g",c:87},{l:"Large can 185g",c:170}],
    extras:[{l:"In spring water",d:0},{l:"In oil +50",d:50}],
    macros:{p:20,carb:0,f:1} },
  { name:"Paneer", cat:"Eggs & Protein", emoji:"🧀",
    variants:[{l:"Small 50g",c:145},{l:"Medium 100g",c:290},{l:"Large 150g",c:435}],
    extras:[{l:"Fresh",d:0},{l:"Fried +80",d:80},{l:"Grilled +20",d:20}],
    macros:{p:11,carb:2,f:23} },

  // Australian / Western
  { name:"Avocado", cat:"Aussie & Western", emoji:"🥑",
    variants:[{l:"Quarter",c:58},{l:"Half (medium)",c:115},{l:"Whole",c:230}],
    extras:[{l:"Mashed",d:0},{l:"Sliced",d:0}],
    macros:{p:1,carb:3,f:11} },
  { name:"Bread / Toast", cat:"Aussie & Western", emoji:"🍞",
    variants:[{l:"1 slice",c:79},{l:"2 slices",c:158}],
    extras:[{l:"Sourdough +5",d:5},{l:"Multigrain",d:0},{l:"White bread",d:0},{l:"Wholemeal",d:0},{l:"Rye -5",d:-5}],
    macros:{p:3,carb:15,f:1} },
  { name:"Flat white", cat:"Aussie & Western", emoji:"☕",
    variants:[{l:"Small 6oz",c:100},{l:"Regular 8oz",c:135},{l:"Large 12oz",c:180}],
    extras:[{l:"Full cream",d:0},{l:"Skim -20",d:-20},{l:"Oat milk -10",d:-10},{l:"Almond -30",d:-30}],
    macros:{p:6,carb:10,f:5} },
  { name:"Long black", cat:"Aussie & Western", emoji:"☕",
    variants:[{l:"Single shot",c:5},{l:"Double shot",c:10}],
    extras:[{l:"Plain",d:0},{l:"With sugar +30",d:30}],
    macros:{p:0,carb:0,f:0} },
  { name:"Meat pie", cat:"Aussie & Western", emoji:"🥧",
    variants:[{l:"Party pie 60g",c:160},{l:"Regular pie 175g",c:450},{l:"Large pie 220g",c:580}],
    extras:[{l:"Plain",d:0},{l:"With sauce +20",d:20}],
    macros:{p:12,carb:32,f:24} },
  { name:"Sausage roll", cat:"Aussie & Western", emoji:"🌭",
    variants:[{l:"Mini",c:130},{l:"Regular",c:280},{l:"Large",c:400}],
    extras:[{l:"Plain",d:0},{l:"With sauce +20",d:20}],
    macros:{p:8,carb:22,f:16} },
  { name:"Tim Tams", cat:"Aussie & Western", emoji:"🍫",
    variants:[{l:"1 biscuit",c:95},{l:"2 biscuits",c:190},{l:"3 biscuits",c:285}],
    extras:[{l:"Original",d:0},{l:"Dark choc +5",d:5}],
    macros:{p:1,carb:13,f:5} },
  { name:"Lamington", cat:"Aussie & Western", emoji:"🎂",
    variants:[{l:"Small piece",c:180},{l:"Regular piece",c:250}],
    extras:[{l:"Plain",d:0},{l:"With cream +60",d:60}],
    macros:{p:3,carb:38,f:8} },
  { name:"Vegemite", cat:"Aussie & Western", emoji:"🫙",
    variants:[{l:"Light spread 5g",c:11},{l:"Normal spread 10g",c:22}],
    extras:[{l:"On toast",d:0},{l:"With butter +35",d:35}],
    macros:{p:1,carb:2,f:0} },

  // Dairy & Other
  { name:"Greek yogurt", cat:"Dairy & Other", emoji:"🥛",
    variants:[{l:"Small 100g",c:59},{l:"Medium 150g",c:88},{l:"Large 200g",c:118}],
    extras:[{l:"Low fat",d:0},{l:"Full fat +30",d:30},{l:"Non-fat -15",d:-15}],
    macros:{p:10,carb:4,f:1} },
  { name:"Milk", cat:"Dairy & Other", emoji:"🥛",
    variants:[{l:"Small glass 150ml",c:92},{l:"Medium glass 250ml",c:153},{l:"Large glass 350ml",c:214}],
    extras:[{l:"Full cream",d:30},{l:"Reduced fat",d:0},{l:"Skim -30",d:-30},{l:"Oat milk -20",d:-20},{l:"Almond -80",d:-80}],
    macros:{p:5,carb:12,f:4} },
  { name:"Oats", cat:"Dairy & Other", emoji:"🥣",
    variants:[{l:"Small 40g",c:150},{l:"Medium 60g",c:225},{l:"Large 80g",c:300}],
    extras:[{l:"With water",d:0},{l:"With milk +60",d:60},{l:"With honey +45",d:45}],
    macros:{p:5,carb:27,f:3} },
  { name:"Banana", cat:"Dairy & Other", emoji:"🍌",
    variants:[{l:"Small",c:72},{l:"Medium",c:89},{l:"Large",c:121}],
    extras:[{l:"Fresh",d:0}],
    macros:{p:1,carb:23,f:0} },
  { name:"Apple", cat:"Dairy & Other", emoji:"🍎",
    variants:[{l:"Small",c:55},{l:"Medium",c:95},{l:"Large",c:130}],
    extras:[{l:"With skin",d:0},{l:"Peeled -5",d:-5}],
    macros:{p:0,carb:25,f:0} },
  { name:"Peanut butter", cat:"Dairy & Other", emoji:"🥜",
    variants:[{l:"1 tsp 7g",c:42},{l:"1 tbsp 16g",c:96}],
    extras:[{l:"Smooth",d:0},{l:"Crunchy",d:0},{l:"Natural",d:0}],
    macros:{p:4,carb:3,f:8} },
];

// ── COMPLETE MEAL DATABASE ────────────────────────────────────────────────────
const COMPLETE_MEALS = [
  { name:"Dal chawal", emoji:"🍲", cat:"Indian Mains", cal:520, time:"30 min", tags:["vegetarian","budget","high-fiber"],
    ingredients:["Dal tadka (medium bowl)","Steamed rice (medium bowl)","Chapati (1 medium)"],
    macros:{p:17,c:88,f:10}, tip:"A complete protein meal. Use less ghee to keep it light." },
  { name:"Chole bhature", emoji:"🫘", cat:"Indian Mains", cal:680, time:"40 min", tags:["vegetarian","indulgent"],
    ingredients:["Chole (medium bowl)","Bhatura (1 large)","Onion & pickle"],
    macros:{p:18,c:95,f:22}, tip:"High calorie — enjoy occasionally and skip dinner rice." },
  { name:"Rajma chawal", emoji:"🫘", cat:"Indian Mains", cal:560, time:"40 min", tags:["vegetarian","high-protein","budget"],
    ingredients:["Rajma (medium bowl)","Steamed rice (medium bowl)","Onion salad"],
    macros:{p:18,c:90,f:8}, tip:"Excellent plant-based protein. Skip ghee on rice to save 40 cal." },
  { name:"Egg curry with rice", emoji:"🍛", cat:"Indian Mains", cal:580, time:"30 min", tags:["high-protein","budget"],
    ingredients:["Egg curry (2 eggs)","Steamed rice (medium)","Chapati (1)"],
    macros:{p:22,c:68,f:18}, tip:"Great protein meal. Add extra veg on the side." },
  { name:"Chicken curry with chapati", emoji:"🍛", cat:"Indian Mains", cal:560, time:"40 min", tags:["high-protein"],
    ingredients:["Chicken curry (medium 150g)","Chapati (2 medium)","Raita"],
    macros:{p:28,c:42,f:18}, tip:"High protein, moderate carb. Perfect for weight loss." },
  { name:"Chicken biryani plate", emoji:"🍛", cat:"Indian Mains", cal:650, time:"60 min", tags:["high-protein","indulgent"],
    ingredients:["Chicken biryani (large plate)","Raita","Salad"],
    macros:{p:28,c:72,f:18}, tip:"Have medium plate instead of large to save 160 calories." },
  { name:"Mutton biryani plate", emoji:"🍛", cat:"Indian Mains", cal:760, time:"90 min", tags:["high-protein","indulgent"],
    ingredients:["Mutton biryani (large plate)","Raita","Salad"],
    macros:{p:32,c:68,f:26}, tip:"Very calorie dense. Enjoy occasionally and skip dessert." },
  { name:"Palak paneer with roti", emoji:"🥬", cat:"Indian Mains", cal:520, time:"30 min", tags:["vegetarian","calcium-rich"],
    ingredients:["Palak paneer (medium 150g)","Chapati (2 medium)","Raita (small)"],
    macros:{p:18,c:42,f:22}, tip:"Iron and calcium rich. Choose lower-fat paneer." },
  { name:"Dal makhani roti", emoji:"🍲", cat:"Indian Mains", cal:480, time:"45 min", tags:["vegetarian","protein"],
    ingredients:["Dal makhani (medium bowl)","Chapati (2 medium)","Salad"],
    macros:{p:15,c:58,f:14}, tip:"Skip cream topping to save 50 calories." },
  { name:"Aloo gobi sabzi roti", emoji:"🥔", cat:"Indian Mains", cal:390, time:"25 min", tags:["vegetarian","light","budget"],
    ingredients:["Aloo gobi (medium 150g)","Chapati (2 medium)","Dal (small)"],
    macros:{p:10,c:58,f:10}, tip:"Light vegetarian meal. Add dal to boost protein." },
  { name:"Veg biryani with raita", emoji:"🍛", cat:"Indian Mains", cal:480, time:"45 min", tags:["vegetarian","filling"],
    ingredients:["Veg biryani (medium plate)","Raita (medium)"],
    macros:{p:10,c:72,f:12}, tip:"Add paneer or tofu for more protein." },
  { name:"Paneer butter masala naan", emoji:"🧀", cat:"Indian Mains", cal:720, time:"35 min", tags:["vegetarian","indulgent"],
    ingredients:["Paneer butter masala (medium)","Butter naan (1 large)","Raita"],
    macros:{p:20,c:68,f:28}, tip:"Swap naan for 2 rotis to save 100 calories." },
  { name:"Sambar rice", emoji:"🍲", cat:"Indian Mains", cal:380, time:"10 min", tags:["vegetarian","light","budget"],
    ingredients:["Steamed rice (medium)","Dal tadka/sambar (large)","Papad"],
    macros:{p:12,c:62,f:5}, tip:"Simple and light. Add a vegetable side for more nutrients." },
  { name:"Fish curry rice", emoji:"🐟", cat:"Indian Mains", cal:520, time:"35 min", tags:["high-protein","omega-3"],
    ingredients:["Fish curry (medium 150g)","Steamed rice (medium)","Salad"],
    macros:{p:26,c:55,f:12}, tip:"Excellent omega-3 meal. Choose brown rice for extra fiber." },
  { name:"Keema pav", emoji:"🍖", cat:"Indian Mains", cal:580, time:"30 min", tags:["high-protein"],
    ingredients:["Keema (medium 150g)","Pav (2 pieces)","Onion & lemon"],
    macros:{p:28,c:52,f:22}, tip:"High protein but high fat. Balance with a large salad." },

  // Indian Breakfast
  { name:"Poha breakfast", emoji:"🍽", cat:"Indian Breakfast", cal:350, time:"15 min", tags:["light","quick","vegetarian"],
    ingredients:["Poha (medium bowl)","Peanuts","Lemon & coriander"],
    macros:{p:8,c:55,f:8}, tip:"Great light breakfast. Add a boiled egg for extra protein." },
  { name:"Idli sambar", emoji:"🍚", cat:"Indian Breakfast", cal:280, time:"5 min", tags:["low-fat","vegetarian"],
    ingredients:["Idli (4 pieces)","Sambar (small bowl)","Coconut chutney"],
    macros:{p:10,c:48,f:5}, tip:"One of the lowest calorie South Indian breakfasts. Excellent!" },
  { name:"Masala dosa", emoji:"🥞", cat:"Indian Breakfast", cal:380, time:"10 min", tags:["vegetarian","filling"],
    ingredients:["Masala dosa","Sambar (small)","2 chutneys"],
    macros:{p:9,c:55,f:12}, tip:"Skip extra ghee and coconut chutney to shave off 80 calories." },
  { name:"Aloo paratha breakfast", emoji:"🫓", cat:"Indian Breakfast", cal:480, time:"20 min", tags:["vegetarian","filling"],
    ingredients:["Paratha aloo stuffed (2 medium)","Curd/yogurt","Pickle"],
    macros:{p:11,c:68,f:18}, tip:"Have 1 paratha + extra yogurt to reduce calories." },
  { name:"Egg bhurji with roti", emoji:"🥚", cat:"Indian Breakfast", cal:440, time:"15 min", tags:["high-protein","quick"],
    ingredients:["Egg bhurji (3 egg serve)","Chapati (2 medium)","Chai"],
    macros:{p:22,c:42,f:20}, tip:"High protein start. Skip chai sugar to save 30 calories." },
  { name:"Upma breakfast", emoji:"🍽", cat:"Indian Breakfast", cal:310, time:"20 min", tags:["light","vegetarian"],
    ingredients:["Upma (medium bowl)","Coconut chutney","Chai"],
    macros:{p:7,c:50,f:8}, tip:"Light and filling. Add peanuts for protein and healthy fats." },

  // Indian Sweets & Snacks
  { name:"Moong dal halwa", emoji:"🍮", cat:"Indian Sweets", cal:360, time:"45 min", tags:["sweet","indulgent"],
    ingredients:["Moong dal halwa (large serve)"],
    macros:{p:7,c:45,f:18}, tip:"Rich in protein from moong dal but high in ghee. Small serve is plenty." },
  { name:"Gulab jamun 2 piece", emoji:"🟤", cat:"Indian Sweets", cal:300, time:"5 min", tags:["sweet","occasional"],
    ingredients:["Gulab jamun (2 large)"],
    macros:{p:5,c:45,f:12}, tip:"Very high in sugar. Enjoy occasionally and log it." },
  { name:"Gajar halwa serve", emoji:"🥕", cat:"Indian Sweets", cal:350, time:"40 min", tags:["sweet","winter"],
    ingredients:["Gajar halwa (large serve)"],
    macros:{p:5,c:42,f:14}, tip:"Smaller serves are fine — carrots add nutrition." },
  { name:"Samosa chaat plate", emoji:"🥟", cat:"Indian Snacks", cal:480, time:"10 min", tags:["snack","street-food"],
    ingredients:["Samosa (2 medium)","Chaat toppings","Chutneys","Curd"],
    macros:{p:10,c:62,f:18}, tip:"High calorie street snack. Great as a meal, not an addition." },
  { name:"Pakora plate with chai", emoji:"🥟", cat:"Indian Snacks", cal:420, time:"20 min", tags:["snack","occasional"],
    ingredients:["Pakora (8 pieces)","Chai (regular)","Chutney"],
    macros:{p:9,c:52,f:18}, tip:"Deep fried — enjoy occasionally and count calories." },
  { name:"Vada pav", emoji:"🥙", cat:"Indian Snacks", cal:370, time:"5 min", tags:["snack","street-food"],
    ingredients:["Vada pav (regular)","Green chutney"],
    macros:{p:8,c:50,f:15}, tip:"Filling street snack. Have with buttermilk to keep it lighter." },

  // Aussie meals
  { name:"Avo toast with eggs", emoji:"🥑", cat:"Aussie Meals", cal:460, time:"12 min", tags:["high-protein","aussie"],
    ingredients:["Sourdough toast (2 slices)","Avocado (half, mashed)","Egg (2 large, poached)","Lemon & chilli flakes"],
    macros:{p:20,c:35,f:20}, tip:"One of the best breakfasts for weight loss — protein-rich and filling." },
  { name:"Overnight oats", emoji:"🥣", cat:"Aussie Meals", cal:380, time:"5 min", tags:["high-fiber","meal-prep"],
    ingredients:["Oats (medium, with milk)","Banana (medium)","Peanut butter (1 tbsp)","Greek yogurt (small)"],
    macros:{p:14,c:55,f:9}, tip:"Prep the night before — perfect for busy mornings!" },
  { name:"Tuna salad bowl", emoji:"🥗", cat:"Aussie Meals", cal:320, time:"8 min", tags:["high-protein","low-carb","quick"],
    ingredients:["Tuna in spring water (large can)","Mixed greens","Avocado (quarter)","Cherry tomatoes"],
    macros:{p:28,c:10,f:10}, tip:"One of your best options for weight loss — high protein, low calorie." },
  { name:"Chicken salad sandwich", emoji:"🥪", cat:"Aussie Meals", cal:420, time:"8 min", tags:["high-protein","aussie"],
    ingredients:["Multigrain bread (2 slices)","Chicken breast (small, grilled)","Avocado (quarter)","Salad greens"],
    macros:{p:28,c:32,f:14}, tip:"Swap one bread slice for extra salad to cut 80 calories." },
  { name:"Salmon and veg dinner", emoji:"🐟", cat:"Aussie Meals", cal:480, time:"25 min", tags:["omega-3","low-carb","high-protein"],
    ingredients:["Salmon fillet (medium, baked)","Sweet potato (medium, roasted)","Broccoli (large, steamed)"],
    macros:{p:28,c:35,f:16}, tip:"Perfect weight loss dinner — high protein and omega-3." },
  { name:"Flat white and Tim Tams", emoji:"☕", cat:"Aussie Meals", cal:285, time:"2 min", tags:["snack","coffee"],
    ingredients:["Flat white (regular, oat milk)","Tim Tams (2 biscuits)"],
    macros:{p:5,c:32,f:14}, tip:"Swap to skim milk and 1 Tim Tam to save 80 calories." },
  { name:"Meat pie lunch", emoji:"🥧", cat:"Aussie Meals", cal:540, time:"5 min", tags:["aussie","indulgent"],
    ingredients:["Meat pie (regular)","Sauce","Side salad"],
    macros:{p:18,c:48,f:28}, tip:"High in saturated fat. A lighter lunch means more room for dinner." },
];

const MEAL_CATS = ["All", ...new Set(COMPLETE_MEALS.map(m => m.cat))];
const ALL_TAGS = [...new Set(COMPLETE_MEALS.flatMap(m => m.tags))];

// ── AI Meal Suggestion ────────────────────────────────────────────────────────
async function getAISuggestion(profile, remaining, mealType) {
  const prompt = `You are a friendly nutritionist. User wants to lose weight.
Profile: ${profile.age}y ${profile.sex}, ${profile.weight}kg, target ${profile.targetWeight}kg.
They have ${remaining} calories remaining today.
Suggest ONE ${mealType} meal under ${Math.round(remaining * 0.6)} calories for an Indian-Australian lifestyle.
Reply ONLY in this JSON (nothing else, no markdown):
{"name":"meal name","cal":number,"time":"X min","emoji":"emoji","recipe":"2-3 sentence recipe","tip":"1 weight loss tip"}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 350,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await res.json();
  const text = data.content?.find(b => b.type === "text")?.text || "{}";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

// ── SMALL COMPONENTS ──────────────────────────────────────────────────────────
function StatRow({ label, val, color }) {
  return React.createElement("div", { style: { marginBottom: 10 } },
    React.createElement("div", { style: { color: "#4a6a4a", fontSize: 10, marginBottom: 1 } }, label),
    React.createElement("div", { style: { color, fontWeight: 700, fontSize: 14 } }, val)
  );
}

function JCard({ icon, label, val, col }) {
  return React.createElement("div", {
    style: { flex: 1, background: "#14290f", border: "1px solid #2d4a2d", borderRadius: 12, padding: "12px 8px", textAlign: "center" }
  },
    React.createElement("div", { style: { fontSize: 18, marginBottom: 4 } }, icon),
    React.createElement("div", { style: { color: col, fontWeight: 700, fontSize: 14 } }, val),
    React.createElement("div", { style: { color: "#4a6a4a", fontSize: 10, marginTop: 2 } }, label)
  );
}

function Tag({ color, children }) {
  return React.createElement("span", {
    style: { background: "rgba(255,255,255,.07)", border: `1px solid ${color}44`, color, borderRadius: 6, padding: "2px 7px", fontSize: 10 }
  }, children);
}

function MacroPill({ label, val }) {
  return React.createElement("div", {
    style: { background: "#1a2e1a", borderRadius: 8, padding: "5px 10px", textAlign: "center" }
  },
    React.createElement("div", { style: { color: "#6b9e6b", fontSize: 10 } }, label),
    React.createElement("div", { style: { color: "#f0faf0", fontWeight: 700, fontSize: 13 } }, val)
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
function App() {
  const [tab, setTab] = React.useState("home");
  const [profile, setProfile] = React.useState(() => load("nm_profile"));
  const [pForm, setPForm] = React.useState({ name:"", weight:"", height:"", age:"", sex:"female", targetWeight:"" });
  const [meals, setMeals] = React.useState(() => load("nm_meals") || []);
  const [weightLog, setWeightLog] = React.useState(() => load("nm_weights") || []);
  const [newWeight, setNewWeight] = React.useState("");

  // Smart logger
  const [loggerIngs, setLoggerIngs] = React.useState([]);
  const [searchQ, setSearchQ] = React.useState("");
  const [searchResults, setSearchResults] = React.useState([]);
  const [mealLabel, setMealLabel] = React.useState("");
  const [showDropdown, setShowDropdown] = React.useState(false);

  // Meal DB
  const [dbSearch, setDbSearch] = React.useState("");
  const [dbCat, setDbCat] = React.useState("All");
  const [dbTag, setDbTag] = React.useState(null);

  // AI
  const [aiSuggestion, setAiSuggestion] = React.useState(null);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiMealType, setAiMealType] = React.useState("lunch");

  // Persist
  React.useEffect(() => { if (profile) save("nm_profile", profile); }, [profile]);
  React.useEffect(() => { save("nm_meals", meals); }, [meals]);
  React.useEffect(() => { save("nm_weights", weightLog); }, [weightLog]);

  // Search
  React.useEffect(() => {
    if (!searchQ.trim()) { setSearchResults([]); setShowDropdown(false); return; }
    const q = searchQ.toLowerCase();
    const res = INGREDIENT_DB.filter(f => f.name.toLowerCase().includes(q) || f.cat.toLowerCase().includes(q)).slice(0, 8);
    setSearchResults(res);
    setShowDropdown(res.length > 0);
  }, [searchQ]);

  const saveProfile = () => {
    const p = { ...pForm, weight: +pForm.weight, height: +pForm.height, age: +pForm.age, targetWeight: +pForm.targetWeight };
    setProfile(p);
    const wl = [{ date: todayStr(), weight: p.weight }];
    setWeightLog(wl);
    setTab("home");
  };

  const addIngredient = (food) => {
    setSearchQ(""); setShowDropdown(false);
    if (loggerIngs.find(i => i.name === food.name)) return;
    setLoggerIngs(prev => [...prev, {
      name: food.name, food,
      variant: food.variants[Math.floor(food.variants.length / 2)],
      extra: food.extras.find(e => e.d === 0) || food.extras[0],
      qty: 1
    }]);
  };

  const updateIng = (name, key, val) => setLoggerIngs(prev => prev.map(i => i.name === name ? { ...i, [key]: val } : i));
  const removeIng = (name) => setLoggerIngs(prev => prev.filter(i => i.name !== name));
  const calcIngCal = ing => Math.round((ing.variant.c + ing.extra.d) * ing.qty);
  const totalCal = loggerIngs.reduce((s, i) => s + calcIngCal(i), 0);
  const totalP = loggerIngs.reduce((s, i) => s + Math.round(i.food.macros.p * i.qty), 0);
  const totalCarb = loggerIngs.reduce((s, i) => s + Math.round(i.food.macros.carb * i.qty), 0);
  const totalF = loggerIngs.reduce((s, i) => s + Math.round(i.food.macros.f * i.qty), 0);

  const logCustomMeal = () => {
    if (!loggerIngs.length) return;
    const name = mealLabel || `Meal ${todayMeals.length + 1}`;
    const ingDesc = loggerIngs.map(i => `${i.qty}x ${i.name} (${i.variant.l}, ${i.extra.l})`).join(", ");
    setMeals(prev => [...prev, { name, calories: totalCal, ingredients: ingDesc, date: todayStr(), id: Date.now() }]);
    setLoggerIngs([]); setMealLabel("");
  };

  const logMealFromDB = (m) => {
    setMeals(prev => [...prev, { name: m.name, calories: m.cal, ingredients: m.ingredients.join(", "), date: todayStr(), id: Date.now() }]);
  };

  const removeMeal = (id) => setMeals(prev => prev.filter(x => x.id !== id));

  const logWeight = () => {
    if (!newWeight) return;
    setWeightLog(prev => [...prev, { date: todayStr(), weight: +newWeight }]);
    setNewWeight("");
  };

  const getAI = async () => {
    setAiLoading(true); setAiSuggestion(null);
    try { const s = await getAISuggestion(profile, remaining, aiMealType); setAiSuggestion(s); }
    catch { setAiSuggestion({ name: "Error", cal: 0, emoji: "⚠️", recipe: "Could not load suggestion. Please try again.", tip: "" }); }
    setAiLoading(false);
  };

  // ── Onboarding ──
  if (!profile) {
    return React.createElement("div", { style: S.root },
      React.createElement("div", { style: S.onboard },
        React.createElement("div", { style: { textAlign: "center", marginBottom: 24 } },
          React.createElement("div", { style: { fontSize: 52 } }, "🌿"),
          React.createElement("h1", { style: S.onboardTitle }, "NourishMe"),
          React.createElement("p", { style: S.onboardSub }, "Your personal weight loss companion")
        ),
        React.createElement("div", { style: S.fields },
          [["Your name","name","text","e.g. Priya"],["Current weight (kg)","weight","number","e.g. 85"],
           ["Target weight (kg)","targetWeight","number","e.g. 65"],["Height (cm)","height","number","e.g. 165"],
           ["Age","age","number","e.g. 30"]].map(([l,k,t,ph]) =>
            React.createElement("div", { key: k },
              React.createElement("div", { style: S.fieldLabel }, l),
              React.createElement("input", { style: S.input, type: t, placeholder: ph, value: pForm[k],
                onChange: e => setPForm(f => ({ ...f, [k]: e.target.value })) })
            )
          ),
          React.createElement("div", null,
            React.createElement("div", { style: S.fieldLabel }, "Biological sex"),
            React.createElement("div", { style: { display: "flex", gap: 10 } },
              ["female","male"].map(s => React.createElement("button", {
                key: s, style: { ...S.toggleBtn, ...(pForm.sex === s ? S.toggleActive : {}) },
                onClick: () => setPForm(f => ({ ...f, sex: s }))
              }, s === "female" ? "♀ Female" : "♂ Male"))
            )
          )
        ),
        React.createElement("button", {
          style: { ...S.btn, opacity: (!pForm.name || !pForm.weight || !pForm.height || !pForm.age || !pForm.targetWeight) ? 0.5 : 1 },
          onClick: saveProfile
        }, "Begin my journey →")
      )
    );
  }

  const bmi = profile.weight / ((profile.height / 100) ** 2);
  const bmr = calcBMR(profile);
  const tdee = calcTDEE(bmr);
  const dailyGoal = calcGoal(tdee);
  const todayMeals = meals.filter(m => m.date === todayStr());
  const todayKcal = todayMeals.reduce((s, m) => s + m.calories, 0);
  const remaining = dailyGoal - todayKcal;
  const pct = Math.min((todayKcal / dailyGoal) * 100, 100);
  const bmiInfo = getBMIInfo(bmi);
  const latestW = weightLog.length ? weightLog[weightLog.length - 1].weight : profile.weight;
  const lostSoFar = +(profile.weight - latestW).toFixed(1);
  const weeksLeft = Math.max(0, Math.ceil((latestW - profile.targetWeight) / 1));

  const filteredMeals = COMPLETE_MEALS.filter(m => {
    const matchCat = dbCat === "All" || m.cat === dbCat;
    const matchTag = !dbTag || m.tags.includes(dbTag);
    const matchQ = !dbSearch || m.name.toLowerCase().includes(dbSearch.toLowerCase());
    return matchCat && matchTag && matchQ;
  });

  const TABS = [
    { id:"home", icon:"🏠", label:"Home" },
    { id:"log",  icon:"✏️", label:"Log" },
    { id:"meals",icon:"📖", label:"Meals" },
    { id:"ideas",icon:"✨", label:"Ideas" },
    { id:"progress",icon:"📈",label:"Progress" },
  ];

  const e = React.createElement;

  return e("div", { style: S.root },
    e("div", { style: S.app },

      // ── Header ──
      e("div", { style: S.header },
        e("div", null,
          e("div", { style: S.hi }, `${greeting()}, ${profile.name.split(" ")[0]} 👋`),
          e("div", { style: S.headerSub }, new Date().toLocaleDateString("en-AU", { weekday:"long", day:"numeric", month:"long" }))
        ),
        e("div", { style: S.bmiChip },
          e("span", { style: { color: bmiInfo.color, fontWeight: 700 } }, bmiInfo.label),
          e("span", { style: { color: "#4a7a4a" } }, ` · ${bmi.toFixed(1)}`)
        )
      ),

      // ── Content ──
      e("div", { style: S.content },

        // HOME
        tab === "home" && e("div", null,
          // Calorie ring card
          e("div", { style: S.card },
            e("div", { style: S.cardTitle }, "Today's Calories"),
            e("div", { style: S.ringRow },
              e("svg", { width: 150, height: 150, viewBox: "0 0 150 150" },
                e("circle", { cx:75, cy:75, r:60, fill:"none", stroke:"#1c2e1c", strokeWidth:13 }),
                e("circle", { cx:75, cy:75, r:60, fill:"none",
                  stroke: remaining < 0 ? "#fca5a5" : "#6ee7b7", strokeWidth:13, strokeLinecap:"round",
                  strokeDasharray: `${2*Math.PI*60}`,
                  strokeDashoffset: `${2*Math.PI*60*(1-pct/100)}`,
                  transform:"rotate(-90 75 75)", style:{ transition:"stroke-dashoffset .7s ease" } }),
                e("text", { x:75, y:67, textAnchor:"middle", style:{ fill:"#f0faf0", fontSize:26, fontWeight:700, fontFamily:"Georgia" } }, todayKcal),
                e("text", { x:75, y:85, textAnchor:"middle", style:{ fill:"#6ee7b7", fontSize:11, fontFamily:"Georgia" } }, `of ${dailyGoal} kcal`),
                e("text", { x:75, y:103, textAnchor:"middle", style:{ fill: remaining<0?"#fca5a5":"#a7f3d0", fontSize:10, fontFamily:"Georgia" } },
                  remaining < 0 ? `${Math.abs(Math.round(remaining))} over` : `${Math.round(remaining)} remaining`)
              ),
              e("div", { style: { flex:1 } },
                e(StatRow, { label:"Daily goal", val:`${dailyGoal} kcal`, color:"#6ee7b7" }),
                e(StatRow, { label:"Consumed", val:`${todayKcal} kcal`, color:"#fcd34d" }),
                e(StatRow, { label:"Meals today", val:todayMeals.length, color:"#a5b4fc" }),
                e(StatRow, { label:"BMR", val:`${Math.round(bmr)} kcal`, color:"#f9a8d4" })
              )
            )
          ),

          // Journey row
          e("div", { style: S.journeyRow },
            e(JCard, { icon:"⚖️", label:"Lost", val:`${lostSoFar} kg`, col:"#6ee7b7" }),
            e(JCard, { icon:"🎯", label:"To go", val:`${(latestW-profile.targetWeight).toFixed(1)} kg`, col:"#fcd34d" }),
            e(JCard, { icon:"📅", label:"~Weeks", val: weeksLeft || "🎉", col:"#a5b4fc" })
          ),

          // BMI card
          e("div", { style: S.card },
            e("div", { style: S.cardTitle }, `BMI · ${bmi.toFixed(1)}`),
            e("div", { style: { display:"flex", gap:5, marginBottom:8 } },
              [["<18.5","#7dd3fc"],["18.5–25","#6ee7b7"],["25–30","#fcd34d"],["30+","#fca5a5"]].map(([l,c],i) =>
                e("div", { key:i, style:{ flex:1, textAlign:"center" } },
                  e("div", { style:{ height:8, background:c, opacity:bmiInfo.band===i?1:0.25, borderRadius:4, marginBottom:4 } }),
                  e("div", { style:{ color:"#4a6a4a", fontSize:9 } }, l)
                )
              )
            ),
            e("div", { style:{ color:bmiInfo.color, fontWeight:700, fontSize:14 } }, `${bmiInfo.label} — you've got this! 💪`)
          ),

          // Today's meals
          todayMeals.length > 0 && e("div", { style: S.card },
            e("div", { style: S.cardTitle }, "Today's meals"),
            todayMeals.map(m => e("div", { key: m.id, style: S.mealRowSmall },
              e("div", { style:{ flex:1 } },
                e("div", { style:{ color:"#d0ead0", fontSize:13 } }, `🍴 ${m.name}`),
                m.ingredients && e("div", { style:{ color:"#3a5a3a", fontSize:10, marginTop:2 } },
                  m.ingredients.length > 55 ? m.ingredients.slice(0,55)+"..." : m.ingredients)
              ),
              e("div", { style:{ display:"flex", alignItems:"center", gap:8 } },
                e("span", { style:{ color:"#6ee7b7", fontWeight:700, fontSize:13 } }, m.calories),
                e("button", { style: S.delBtn, onClick: () => removeMeal(m.id) }, "✕")
              )
            )),
            e("div", { style:{ color:"#6ee7b7", fontSize:12, marginTop:8, textAlign:"right" } }, `Total: ${todayKcal} kcal`)
          )
        ),

        // LOG TAB
        tab === "log" && e("div", null,
          e("div", { style: S.card },
            e("div", { style: S.cardTitle }, "🔍 Smart Ingredient Logger"),
            e("div", { style:{ color:"#6b9e6b", fontSize:12, marginBottom:12 } }, "Type any food — chapati, egg, dal, avocado, coffee..."),
            e("div", { style:{ position:"relative" } },
              e("input", { style: S.input, placeholder:"Search food...", value: searchQ,
                onChange: e2 => setSearchQ(e2.target.value),
                onBlur: () => setTimeout(() => setShowDropdown(false), 150) }),
              showDropdown && e("div", { style: S.dropdown },
                searchResults.map(f => e("div", { key: f.name, style: S.dropItem,
                  onMouseDown: () => addIngredient(f) },
                  e("span", { style:{ fontSize:16 } }, f.emoji),
                  e("div", { style:{ flex:1 } },
                    e("div", { style:{ color:"#f0faf0", fontSize:13 } }, f.name),
                    e("div", { style:{ color:"#4a7a4a", fontSize:10 } }, f.cat)
                  ),
                  e("span", { style:{ color:"#6ee7b7", fontSize:11 } }, `${f.variants[1]?.c || f.variants[0]?.c} kcal`)
                ))
              )
            )
          ),

          loggerIngs.length > 0 && e("div", null,
            loggerIngs.map(ing => e("div", { key: ing.name, style: S.ingCard },
              e("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 } },
                e("div", { style:{ color:"#f0faf0", fontWeight:700, fontSize:14 } }, `${ing.food.emoji} ${ing.name}`),
                e("div", { style:{ display:"flex", alignItems:"center", gap:8 } },
                  e("span", { style:{ color:"#6ee7b7", fontWeight:700 } }, `${calcIngCal(ing)} kcal`),
                  e("button", { style:{ background:"none", border:"none", color:"#fca5a5", cursor:"pointer", fontSize:18 },
                    onClick: () => removeIng(ing.name) }, "×")
                )
              ),
              e("div", { style:{ color:"#4a7a4a", fontSize:11, marginBottom:6 } }, "Size / Portion"),
              e("div", { style:{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 } },
                ing.food.variants.map(v => e("button", { key: v.l,
                  style:{ ...S.optBtn, ...(ing.variant.l===v.l ? S.optActive : {}) },
                  onClick: () => updateIng(ing.name, "variant", v) }, v.l))
              ),
              e("div", { style:{ color:"#4a7a4a", fontSize:11, marginBottom:6 } }, "Preparation"),
              e("div", { style:{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 } },
                ing.food.extras.map(ex => e("button", { key: ex.l,
                  style:{ ...S.optBtn, ...(ing.extra.l===ex.l ? S.optActive : {}) },
                  onClick: () => updateIng(ing.name, "extra", ex) }, ex.l))
              ),
              e("div", { style:{ display:"flex", alignItems:"center", gap:10 } },
                e("span", { style:{ color:"#4a7a4a", fontSize:11 } }, "Quantity:"),
                e("button", { style: S.qtyBtn, onClick: () => updateIng(ing.name, "qty", Math.max(1, ing.qty-1)) }, "−"),
                e("span", { style:{ color:"#f0faf0", fontWeight:700, minWidth:20, textAlign:"center" } }, ing.qty),
                e("button", { style: S.qtyBtn, onClick: () => updateIng(ing.name, "qty", Math.min(10, ing.qty+1)) }, "+")
              )
            )),

            e("div", { style:{ ...S.card, textAlign:"center" } },
              e("div", { style:{ color:"#6ee7b7", fontSize:22, fontWeight:700, marginBottom:6 } }, `${totalCal} kcal`),
              e("div", { style:{ display:"flex", gap:10, justifyContent:"center", marginBottom:12 } },
                e(MacroPill, { label:"Protein", val:`${totalP}g` }),
                e(MacroPill, { label:"Carbs", val:`${totalCarb}g` }),
                e(MacroPill, { label:"Fat", val:`${totalF}g` })
              ),
              e("input", { style:{ ...S.input, marginBottom:10, textAlign:"center" },
                placeholder:"Name this meal (e.g. Lunch)", value: mealLabel,
                onChange: e2 => setMealLabel(e2.target.value) }),
              e("button", { style: S.btn, onClick: logCustomMeal }, "✓ Log this meal")
            )
          ),

          todayMeals.length > 0 && e("div", null,
            e("div", { style:{ ...S.cardTitle, marginBottom:10 } }, "Today's log"),
            todayMeals.map(m => e("div", { key: m.id, style: S.mealRow },
              e("div", { style:{ flex:1 } },
                e("div", { style:{ color:"#f0faf0", fontSize:14, fontWeight:600 } }, m.name),
                m.ingredients && e("div", { style:{ color:"#3a5a3a", fontSize:10, marginTop:3, lineHeight:1.4 } }, m.ingredients)
              ),
              e("div", { style:{ display:"flex", alignItems:"center", gap:8, marginLeft:8 } },
                e("span", { style:{ color:"#6ee7b7", fontWeight:700 } }, m.calories),
                e("button", { style: S.delBtn, onClick: () => removeMeal(m.id) }, "✕")
              )
            )),
            e("div", { style: S.totalBanner },
              `${todayKcal} / ${dailyGoal} kcal`,
              remaining >= 0
                ? e("span", { style:{ color:"#6ee7b7" } }, ` · ${Math.round(remaining)} remaining`)
                : e("span", { style:{ color:"#fca5a5" } }, ` · ${Math.abs(Math.round(remaining))} over limit`)
            )
          )
        ),

        // MEALS DB TAB
        tab === "meals" && e("div", null,
          e("div", { style: S.card },
            e("div", { style: S.cardTitle }, "📖 Meal Database"),
            e("input", { style: S.input, placeholder:"Search meals... (biryani, dal chawal, avo toast...)",
              value: dbSearch, onChange: e2 => setDbSearch(e2.target.value) })
          ),
          e("div", { style:{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 } },
            MEAL_CATS.map(c => e("button", { key:c,
              style:{ ...S.catBtn, ...(dbCat===c ? S.catActive : {}) },
              onClick: () => setDbCat(c) }, c))
          ),
          e("div", { style:{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:14 } },
            ALL_TAGS.slice(0,12).map(t => e("button", { key:t,
              style:{ ...S.tagBtn, ...(dbTag===t ? S.tagActive : {}) },
              onClick: () => setDbTag(dbTag===t ? null : t) }, t))
          ),
          filteredMeals.length === 0 && e("div", { style:{ color:"#3a5a3a", textAlign:"center", padding:"20px 0" } }, "No meals found"),
          filteredMeals.map(m => e("div", { key: m.name, style: S.suggestCard },
            e("div", { style:{ display:"flex", gap:10, alignItems:"flex-start" } },
              e("span", { style:{ fontSize:24 } }, m.emoji),
              e("div", { style:{ flex:1 } },
                e("div", { style:{ color:"#f0faf0", fontWeight:700, fontSize:15 } }, m.name),
                e("div", { style:{ color:"#4a7a4a", fontSize:11, marginTop:2 } }, `${m.cat} · ${m.time}`),
                e("div", { style:{ display:"flex", gap:5, marginTop:6, flexWrap:"wrap" } },
                  e(Tag, { color:"#6ee7b7" }, `${m.cal} kcal`),
                  e(Tag, { color:"#f9a8d4" }, `P:${m.macros.p}g`),
                  e(Tag, { color:"#fcd34d" }, `C:${m.macros.c}g`),
                  e(Tag, { color:"#a5b4fc" }, `F:${m.macros.f}g`)
                ),
                e("div", { style:{ display:"flex", gap:4, flexWrap:"wrap", marginTop:6 } },
                  m.tags.map(t => e("span", { key:t,
                    style:{ background:"#1a2e1a", color:"#6b9e6b", fontSize:10, padding:"2px 7px", borderRadius:10 } }, t))
                )
              ),
              e("button", { style: S.logSmallBtn, onClick: () => logMealFromDB(m) }, "+ Log")
            ),
            e("div", { style:{ marginTop:10, padding:"8px 10px", background:"#0a150a", borderRadius:8 } },
              e("div", { style:{ color:"#4a7a4a", fontSize:10, marginBottom:4 } }, "Ingredients"),
              m.ingredients.map((ing,i) => e("div", { key:i, style:{ color:"#6b9e6b", fontSize:11, lineHeight:1.7 } }, `• ${ing}`))
            ),
            m.tip && e("div", { style:{ marginTop:8, padding:"7px 10px", background:"#142814", borderRadius:8, color:"#6ee7b7", fontSize:11 } }, `💡 ${m.tip}`)
          ))
        ),

        // IDEAS / AI TAB
        tab === "ideas" && e("div", null,
          e("div", { style: S.aiBox },
            e("div", { style:{ color:"#f0faf0", fontWeight:700, fontSize:16, marginBottom:4 } }, "✨ AI Meal Suggestion"),
            e("div", { style:{ color:"#6b9e6b", fontSize:12, marginBottom:12 } },
              "You have ", e("span", { style:{ color:"#6ee7b7", fontWeight:700 } }, `${Math.round(remaining)} kcal`), " remaining today"
            ),
            e("div", { style:{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" } },
              ["breakfast","lunch","dinner","snack"].map(t => e("button", { key:t,
                style:{ ...S.catBtn, ...(aiMealType===t ? S.catActive : {}) },
                onClick: () => setAiMealType(t) },
                `${{"breakfast":"🌅","lunch":"☀️","dinner":"🌙","snack":"🍎"}[t]} ${t}`))
            ),
            e("button", { style:{ ...S.btn, background:"#15803d" }, onClick: getAI, disabled: aiLoading },
              aiLoading ? "🔄 Finding a meal for you..." : "🤖 Suggest a meal for me"
            ),
            aiSuggestion && e("div", { style:{ marginTop:14, padding:14, background:"#0a150a", borderRadius:12, border:"1px solid #1e3a1e", textAlign:"center" } },
              e("div", { style:{ fontSize:32, marginBottom:6 } }, aiSuggestion.emoji),
              e("div", { style:{ color:"#f0faf0", fontWeight:700, fontSize:17, marginBottom:6 } }, aiSuggestion.name),
              e("div", { style:{ display:"flex", gap:8, justifyContent:"center", marginBottom:10, flexWrap:"wrap" } },
                e(Tag, { color:"#6ee7b7" }, `${aiSuggestion.cal} kcal`),
                e(Tag, { color:"#fcd34d" }, `⏱ ${aiSuggestion.time}`)
              ),
              e("div", { style:{ background:"#142814", borderRadius:8, padding:10, color:"#a0c8a0", fontSize:12, lineHeight:1.6, textAlign:"left", marginBottom:8 } },
                e("strong", { style:{ color:"#6ee7b7" } }, "Recipe: "), aiSuggestion.recipe
              ),
              aiSuggestion.tip && e("div", { style:{ background:"#0f2a0f", borderRadius:8, padding:9, color:"#6ee7b7", fontSize:12, textAlign:"left", marginBottom:10 } },
                `💡 ${aiSuggestion.tip}`
              ),
              e("button", { style:{ ...S.btn, fontSize:13, padding:"9px" },
                onClick: () => setMeals(prev => [...prev, { name: aiSuggestion.name, calories: aiSuggestion.cal, ingredients:"AI suggested meal", date: todayStr(), id: Date.now() }])
              }, "+ Log this meal")
            )
          ),

          e("div", { style: S.card },
            e("div", { style: S.cardTitle }, "💡 Smart picks for today"),
            e("div", { style:{ color:"#6b9e6b", fontSize:12, marginBottom:12 } }, `Meals under ${Math.round(remaining)} kcal`),
            COMPLETE_MEALS.filter(m => m.cal <= remaining).slice(0,6).map(m => e("div", { key: m.name, style: S.mealRowSmall },
              e("span", { style:{ fontSize:18, marginRight:8 } }, m.emoji),
              e("div", { style:{ flex:1 } },
                e("div", { style:{ color:"#d0ead0", fontSize:13 } }, m.name),
                e("div", { style:{ color:"#3a5a3a", fontSize:10 } }, `${m.cat} · ${m.time}`)
              ),
              e("div", { style:{ display:"flex", alignItems:"center", gap:8 } },
                e("span", { style:{ color:"#6ee7b7", fontSize:13, fontWeight:700 } }, `${m.cal} kcal`),
                e("button", { style: S.logSmallBtn, onClick: () => logMealFromDB(m) }, "+ Log")
              )
            )),
            COMPLETE_MEALS.filter(m => m.cal <= remaining).length === 0 &&
              e("div", { style:{ color:"#3a5a3a", textAlign:"center", fontSize:13 } }, "You've hit your calorie goal today! 🎉")
          )
        ),

        // PROGRESS TAB
        tab === "progress" && e("div", null,
          e("div", { style: S.card },
            e("div", { style: S.cardTitle }, "Log today's weight"),
            e("input", { style: S.input, type:"number", placeholder:"Your weight today (kg)", value: newWeight,
              onChange: e2 => setNewWeight(e2.target.value) }),
            e("button", { style:{ ...S.btn, marginTop:10, opacity: !newWeight?0.5:1 }, onClick: logWeight }, "Save weight")
          ),

          weightLog.length > 1 && e("div", { style: S.card },
            e("div", { style: S.cardTitle }, "Weight trend"),
            e("div", { style:{ display:"flex", gap:3, alignItems:"flex-end", minHeight:120, paddingBottom:4 } },
              weightLog.slice(-12).map((w,i,arr) => {
                const max = Math.max(...arr.map(x=>x.weight));
                const min = Math.min(...arr.map(x=>x.weight));
                const h = 20 + ((w.weight-min)/(max-min||1))*90;
                const isLowest = w.weight === Math.min(...arr.map(x=>x.weight));
                return e("div", { key:i, style:{ display:"flex", flexDirection:"column", alignItems:"center", flex:1, gap:3 } },
                  e("div", { style:{ color:"#86efac", fontSize:8 } }, w.weight),
                  e("div", { style:{ width:"80%", height:h, background: isLowest?"#4ade80":"#166534", borderRadius:"3px 3px 0 0" } }),
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

          lostSoFar > 0 && e("div", { style:{ ...S.card, textAlign:"center", border:"1px solid #4ade80", marginBottom:14 } },
            e("div", { style:{ fontSize:22, marginBottom:4 } }, "🎉"),
            e("div", { style:{ color:"#86efac", fontSize:16, fontWeight:700 } }, `Lost ${lostSoFar} kg so far!`),
            e("div", { style:{ color:"#6b9e6b", fontSize:12, marginTop:4 } }, `${weeksLeft} weeks to goal at this pace`)
          ),

          e("div", { style: S.card },
            e("div", { style: S.cardTitle }, "Your stats"),
            [["Height",`${profile.height} cm`],["Starting weight",`${profile.weight} kg`],
             ["Target weight",`${profile.targetWeight} kg`],["BMI",`${bmi.toFixed(1)} (${bmiInfo.label})`],
             ["BMR",`${Math.round(bmr)} kcal/day`],["TDEE",`${Math.round(tdee)} kcal/day`],
             ["Daily goal",`${dailyGoal} kcal/day`],["Deficit","500 kcal → ~1 kg/week"]].map(([l,v]) =>
              e("div", { key:l, style:{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:"1px solid #1e3a1e" } },
                e("span", { style:{ color:"#6b9e6b", fontSize:13 } }, l),
                e("span", { style:{ color:"#f0faf0", fontSize:13, fontWeight:600 } }, v)
              )
            ),
            e("div", { style:{ background:"#0a150a", borderRadius:10, padding:12, color:"#6b9e6b", fontSize:12, lineHeight:1.7, marginTop:12 } },
              `At 1 kg/week you'll reach ${profile.targetWeight} kg in ~${weeksLeft} weeks — around `,
              e("strong", { style:{ color:"#a5b4fc" } },
                new Date(Date.now()+weeksLeft*7*86400000).toLocaleDateString("en-AU",{month:"long",year:"numeric"})),
              `. You've got this! 💪`
            ),
            e("button", { style:{ ...S.btn, background:"#0a120a", border:"1px solid #4ade80", color:"#4ade80", marginTop:16 },
              onClick: () => { if(window.confirm("Reset all data and start over?")) { localStorage.clear(); setProfile(null); setMeals([]); setWeightLog([]); } }
            }, "Reset & start over")
          )
        )

      ),

      // ── Nav ──
      e("div", { style: S.nav },
        TABS.map(t => e("button", { key: t.id,
          style:{ ...S.navBtn, ...(tab===t.id ? S.navActive : {}) },
          onClick: () => setTab(t.id) },
          e("span", { style:{ fontSize:16 } }, t.icon),
          e("span", { style:{ fontSize:9, marginTop:1 } }, t.label)
        ))
      )
    )
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  root:{ minHeight:"100vh", background:"#080f08", display:"flex", justifyContent:"center", fontFamily:"Georgia,serif" },
  app:{ width:"100%", maxWidth:430, background:"#0c160c", minHeight:"100vh", display:"flex", flexDirection:"column" },
  header:{ padding:"16px 16px 12px", background:"#112211", borderBottom:"1px solid #1e3a1e", display:"flex", justifyContent:"space-between", alignItems:"center" },
  hi:{ color:"#f0faf0", fontSize:17, fontWeight:700 },
  headerSub:{ color:"#4a7a4a", fontSize:10, marginTop:2 },
  bmiChip:{ background:"#0c160c", border:"1px solid #2d4a2d", borderRadius:20, padding:"4px 10px", fontSize:11 },
  content:{ flex:1, padding:"14px 14px 80px", overflowY:"auto" },
  nav:{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"#080f08", borderTop:"1px solid #1e3a1e", display:"flex" },
  navBtn:{ flex:1, background:"none", border:"none", padding:"9px 0 7px", cursor:"pointer", color:"#4a6a4a", display:"flex", flexDirection:"column", alignItems:"center", gap:1, fontFamily:"Georgia" },
  navActive:{ background:"#112211", color:"#6ee7b7" },
  card:{ background:"#112211", border:"1px solid #1e3a1e", borderRadius:16, padding:16, marginBottom:14 },
  cardTitle:{ color:"#6ee7b7", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:12 },
  ringRow:{ display:"flex", gap:12, alignItems:"center" },
  journeyRow:{ display:"flex", gap:10, marginBottom:14 },
  mealRowSmall:{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #1e3a1e", alignItems:"center" },
  mealRow:{ background:"#112211", border:"1px solid #1e3a1e", borderRadius:10, padding:"11px 12px", marginBottom:7, display:"flex", justifyContent:"space-between", alignItems:"flex-start" },
  totalBanner:{ background:"#0a1a0a", borderRadius:10, padding:"10px 12px", color:"#d0ead0", fontSize:12, textAlign:"center", marginTop:4 },
  delBtn:{ background:"none", border:"none", color:"#fca5a5", cursor:"pointer", fontSize:13 },
  dropdown:{ position:"absolute", top:"100%", left:0, right:0, background:"#1a2e1a", border:"1px solid #2d4a2d", borderRadius:10, zIndex:50, maxHeight:250, overflowY:"auto" },
  dropItem:{ display:"flex", gap:10, alignItems:"center", padding:"10px 12px", cursor:"pointer", borderBottom:"1px solid #142814" },
  ingCard:{ background:"#112211", border:"1px solid #1e3a1e", borderRadius:14, padding:14, marginBottom:10 },
  optBtn:{ background:"#0a150a", border:"1px solid #1e3a1e", borderRadius:20, padding:"4px 10px", color:"#4a7a4a", cursor:"pointer", fontSize:11, fontFamily:"Georgia" },
  optActive:{ background:"#166534", border:"1px solid #4ade80", color:"#f0faf0" },
  qtyBtn:{ width:28, height:28, borderRadius:"50%", background:"#1a2e1a", border:"1px solid #2d4a2d", color:"#f0faf0", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" },
  catBtn:{ background:"#112211", border:"1px solid #1e3a1e", borderRadius:20, padding:"5px 10px", color:"#4a7a4a", cursor:"pointer", fontSize:11, fontFamily:"Georgia" },
  catActive:{ background:"#15803d", border:"1px solid #4ade80", color:"#f0faf0" },
  tagBtn:{ background:"#112211", border:"1px solid #1e3a1e", borderRadius:20, padding:"3px 8px", color:"#4a7a4a", cursor:"pointer", fontSize:10, fontFamily:"Georgia" },
  tagActive:{ background:"#166534", border:"1px solid #4ade80", color:"#f0faf0" },
  suggestCard:{ background:"#112211", border:"1px solid #1e3a1e", borderRadius:14, padding:14, marginBottom:10 },
  logSmallBtn:{ background:"#15803d", border:"none", borderRadius:7, padding:"5px 9px", color:"#f0faf0", cursor:"pointer", fontSize:10, fontFamily:"Georgia", whiteSpace:"nowrap" },
  aiBox:{ background:"#0c1f0c", border:"1px solid #2d5a2d", borderRadius:16, padding:16, marginBottom:14 },
  onboard:{ width:"100%", maxWidth:430, padding:"32px 24px", margin:"0 auto" },
  onboardTitle:{ color:"#f0faf0", fontSize:28, fontWeight:700, textAlign:"center", margin:"8px 0 4px" },
  onboardSub:{ color:"#4a7a4a", fontSize:13, textAlign:"center", marginBottom:28 },
  fields:{ display:"flex", flexDirection:"column", gap:14, marginBottom:24 },
  fieldLabel:{ color:"#6ee7b7", fontSize:11, textTransform:"uppercase", letterSpacing:.5, marginBottom:4 },
  input:{ background:"#080f08", border:"1px solid #1e3a1e", borderRadius:10, padding:"11px 14px", color:"#f0faf0", fontSize:14, fontFamily:"Georgia", outline:"none", width:"100%", boxSizing:"border-box" },
  toggleBtn:{ flex:1, background:"#112211", border:"1px solid #1e3a1e", borderRadius:10, padding:10, color:"#4a7a4a", cursor:"pointer", fontFamily:"Georgia", fontSize:14 },
  toggleActive:{ background:"#15803d", border:"1px solid #4ade80", color:"#f0faf0" },
  btn:{ background:"#15803d", border:"none", borderRadius:10, padding:"12px", color:"#f0faf0", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"Georgia", width:"100%" },
};

// ── Mount ─────────────────────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
