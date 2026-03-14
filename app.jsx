import { useState, useEffect, useRef } from "react";

// ─── Storage ──────────────────────────────────────────────────────────────────
const save = async (k,v)=>{try{await window.storage.set(k,JSON.stringify(v));}catch{}};
const load = async (k)=>{try{const r=await window.storage.get(k);return r?JSON.parse(r.value):null;}catch{return null;}};
const todayStr = ()=>new Date().toISOString().split("T")[0];
const greeting = ()=>{const h=new Date().getHours();return h<12?"Good morning":h<17?"Good afternoon":"Good evening";};

// ─── Calculations ─────────────────────────────────────────────────────────────
const calcBMR = p=>{const b=10*p.weight+6.25*p.height-5*p.age;return p.sex==="female"?b-161:b+5;};
const calcTDEE = bmr=>bmr*1.2;
const calcGoal = tdee=>Math.round(tdee-500);
const getBMIInfo = bmi=>{
  if(bmi<18.5)return{label:"Underweight",color:"#7dd3fc",band:0};
  if(bmi<25)return{label:"Healthy",color:"#6ee7b7",band:1};
  if(bmi<30)return{label:"Overweight",color:"#fcd34d",band:2};
  return{label:"Obese",color:"#fca5a5",band:3};
};

// ─── INGREDIENT DATABASE (individual foods) ───────────────────────────────────
const INGREDIENT_DB = [
  // Indian breads
  {name:"Chapati",cat:"🫓 Indian Breads",emoji:"🫓",
    variants:[{l:"Small (15cm)",c:70},{l:"Medium (20cm)",c:100},{l:"Large (25cm)",c:140}],
    extras:[{l:"Plain",d:0},{l:"With ghee (+40 kcal)",d:40},{l:"With butter (+35 kcal)",d:35}],
    macros:{p:3,carb:18,f:2},unit:"piece"},
  {name:"Paratha",cat:"🫓 Indian Breads",emoji:"🫓",
    variants:[{l:"Small",c:150},{l:"Medium",c:200},{l:"Large",c:260}],
    extras:[{l:"Plain",d:0},{l:"With ghee (+50 kcal)",d:50},{l:"Aloo stuffed (+80 kcal)",d:80},{l:"Paneer stuffed (+70 kcal)",d:70}],
    macros:{p:4,carb:28,f:7},unit:"piece"},
  {name:"Puri",cat:"🫓 Indian Breads",emoji:"🫓",
    variants:[{l:"Small",c:100},{l:"Medium",c:140},{l:"Large",c:180}],
    extras:[{l:"Regular",d:0},{l:"Whole wheat (-10 kcal)",d:-10}],
    macros:{p:3,carb:17,f:6},unit:"piece"},
  {name:"Naan",cat:"🫓 Indian Breads",emoji:"🫓",
    variants:[{l:"Small",c:170},{l:"Medium",c:260},{l:"Large",c:340}],
    extras:[{l:"Plain",d:0},{l:"Butter naan (+60 kcal)",d:60},{l:"Garlic naan (+40 kcal)",d:40},{l:"Cheese naan (+80 kcal)",d:80}],
    macros:{p:8,carb:45,f:4},unit:"piece"},
  {name:"Roti (store bought)",cat:"🫓 Indian Breads",emoji:"🫓",
    variants:[{l:"1 roti",c:80},{l:"2 rotis",c:160}],
    extras:[{l:"Plain",d:0},{l:"With ghee (+40 kcal)",d:40}],
    macros:{p:3,carb:16,f:1},unit:"piece"},
  {name:"Bhatura",cat:"🫓 Indian Breads",emoji:"🫓",
    variants:[{l:"Small",c:190},{l:"Medium",c:250},{l:"Large",c:320}],
    extras:[{l:"Regular",d:0}],
    macros:{p:5,carb:30,f:10},unit:"piece"},

  // Rice dishes
  {name:"Steamed rice",cat:"🍚 Rice",emoji:"🍚",
    variants:[{l:"Small bowl (100g)",c:130},{l:"Medium bowl (150g)",c:195},{l:"Large bowl (250g)",c:325}],
    extras:[{l:"Basmati",d:0},{l:"White rice",d:0},{l:"Brown rice (-10 kcal)",d:-10},{l:"With ghee (+40 kcal)",d:40}],
    macros:{p:3,carb:28,f:0},unit:"bowl"},
  {name:"Jeera rice",cat:"🍚 Rice",emoji:"🍚",
    variants:[{l:"Small (100g)",c:150},{l:"Medium (150g)",c:225},{l:"Large (250g)",c:375}],
    extras:[{l:"Light oil",d:0},{l:"Extra ghee (+40 kcal)",d:40}],
    macros:{p:3,carb:30,f:4},unit:"bowl"},
  {name:"Chicken biryani",cat:"🍚 Rice",emoji:"🍛",
    variants:[{l:"Small plate (200g)",c:320},{l:"Medium plate (300g)",c:480},{l:"Large plate (400g)",c:640}],
    extras:[{l:"With raita (+40 kcal)",d:40},{l:"Plain",d:0},{l:"Extra masala",d:0}],
    macros:{p:18,carb:48,f:14},unit:"plate"},
  {name:"Mutton biryani",cat:"🍚 Rice",emoji:"🍛",
    variants:[{l:"Small plate (200g)",c:380},{l:"Medium plate (300g)",c:570},{l:"Large plate (400g)",c:760}],
    extras:[{l:"With raita (+40 kcal)",d:40},{l:"Plain",d:0}],
    macros:{p:22,carb:46,f:18},unit:"plate"},
  {name:"Veg biryani",cat:"🍚 Rice",emoji:"🍛",
    variants:[{l:"Small plate (200g)",c:260},{l:"Medium plate (300g)",c:390},{l:"Large plate (400g)",c:520}],
    extras:[{l:"With raita (+40 kcal)",d:40},{l:"Plain",d:0}],
    macros:{p:7,carb:50,f:8},unit:"plate"},
  {name:"Curd rice",cat:"🍚 Rice",emoji:"🍚",
    variants:[{l:"Small bowl (150g)",c:180},{l:"Medium bowl (200g)",c:240},{l:"Large bowl (300g)",c:360}],
    extras:[{l:"With tempering",d:0},{l:"Plain",d:0}],
    macros:{p:6,carb:32,f:4},unit:"bowl"},

  // Dals & Lentils
  {name:"Dal tadka",cat:"🍲 Dals",emoji:"🍲",
    variants:[{l:"Small bowl (100g)",c:120},{l:"Medium bowl (150g)",c:180},{l:"Large bowl (250g)",c:300}],
    extras:[{l:"With ghee (+40 kcal)",d:40},{l:"Light oil",d:0},{l:"No tempering (-20 kcal)",d:-20}],
    macros:{p:7,carb:18,f:4},unit:"bowl"},
  {name:"Dal makhani",cat:"🍲 Dals",emoji:"🍲",
    variants:[{l:"Small bowl (100g)",c:160},{l:"Medium bowl (150g)",c:240},{l:"Large bowl (250g)",c:400}],
    extras:[{l:"With cream (+50 kcal)",d:50},{l:"Regular",d:0},{l:"Light (-30 kcal)",d:-30}],
    macros:{p:8,carb:20,f:8},unit:"bowl"},
  {name:"Moong dal",cat:"🍲 Dals",emoji:"🍲",
    variants:[{l:"Small bowl (100g)",c:100},{l:"Medium bowl (150g)",c:150},{l:"Large bowl (250g)",c:250}],
    extras:[{l:"With ghee (+40 kcal)",d:40},{l:"Plain",d:0}],
    macros:{p:7,carb:16,f:2},unit:"bowl"},
  {name:"Chana dal",cat:"🍲 Dals",emoji:"🍲",
    variants:[{l:"Small bowl (100g)",c:130},{l:"Medium bowl (150g)",c:195},{l:"Large bowl (250g)",c:325}],
    extras:[{l:"With ghee (+40 kcal)",d:40},{l:"Plain",d:0}],
    macros:{p:8,carb:22,f:3},unit:"bowl"},
  {name:"Rajma (kidney beans)",cat:"🍲 Dals",emoji:"🫘",
    variants:[{l:"Small bowl (100g)",c:140},{l:"Medium bowl (150g)",c:210},{l:"Large bowl (250g)",c:350}],
    extras:[{l:"With rice",d:0},{l:"Plain",d:0}],
    macros:{p:9,carb:22,f:3},unit:"bowl"},
  {name:"Chole (chickpeas)",cat:"🍲 Dals",emoji:"🫘",
    variants:[{l:"Small bowl (100g)",c:150},{l:"Medium bowl (150g)",c:225},{l:"Large bowl (250g)",c:375}],
    extras:[{l:"With bhatura",d:0},{l:"Plain",d:0},{l:"With puri",d:0}],
    macros:{p:8,carb:25,f:5},unit:"bowl"},

  // Curries
  {name:"Egg curry",cat:"🍛 Curries",emoji:"🍛",
    variants:[{l:"1 egg curry",c:180},{l:"2 egg curry",c:320},{l:"3 egg curry",c:460}],
    extras:[{l:"With gravy",d:0},{l:"Dry style (-30 kcal)",d:-30},{l:"Extra gravy (+20 kcal)",d:20}],
    macros:{p:12,carb:8,f:12},unit:"serve"},
  {name:"Chicken curry",cat:"🍛 Curries",emoji:"🍛",
    variants:[{l:"Small serve (100g)",c:165},{l:"Medium serve (150g)",c:248},{l:"Large serve (200g)",c:330}],
    extras:[{l:"With bone",d:0},{l:"Boneless (+10 kcal)",d:10},{l:"Light gravy (-20 kcal)",d:-20}],
    macros:{p:18,carb:6,f:10},unit:"serve"},
  {name:"Mutton curry",cat:"🍛 Curries",emoji:"🍛",
    variants:[{l:"Small serve (100g)",c:230},{l:"Medium serve (150g)",c:345},{l:"Large serve (200g)",c:460}],
    extras:[{l:"Bone-in",d:0},{l:"Boneless (+20 kcal)",d:20}],
    macros:{p:20,carb:5,f:16},unit:"serve"},
  {name:"Palak paneer",cat:"🍛 Curries",emoji:"🥬",
    variants:[{l:"Small (100g)",c:160},{l:"Medium (150g)",c:240},{l:"Large (200g)",c:320}],
    extras:[{l:"Regular",d:0},{l:"Extra paneer (+50 kcal)",d:50},{l:"Light cream (-20 kcal)",d:-20}],
    macros:{p:9,carb:6,f:12},unit:"serve"},
  {name:"Paneer butter masala",cat:"🍛 Curries",emoji:"🧀",
    variants:[{l:"Small (100g)",c:220},{l:"Medium (150g)",c:330},{l:"Large (200g)",c:440}],
    extras:[{l:"With cream",d:0},{l:"Light (-40 kcal)",d:-40}],
    macros:{p:10,carb:10,f:16},unit:"serve"},
  {name:"Aloo gobi",cat:"🍛 Curries",emoji:"🥔",
    variants:[{l:"Small (100g)",c:110},{l:"Medium (150g)",c:165},{l:"Large (200g)",c:220}],
    extras:[{l:"Regular oil",d:0},{l:"Light (-20 kcal)",d:-20}],
    macros:{p:3,carb:16,f:5},unit:"serve"},
  {name:"Bhindi masala",cat:"🍛 Curries",emoji:"🥗",
    variants:[{l:"Small (100g)",c:100},{l:"Medium (150g)",c:150},{l:"Large (200g)",c:200}],
    extras:[{l:"Regular",d:0},{l:"Light oil (-15 kcal)",d:-15}],
    macros:{p:3,carb:12,f:5},unit:"serve"},
  {name:"Shahi paneer",cat:"🍛 Curries",emoji:"🧀",
    variants:[{l:"Small (100g)",c:250},{l:"Medium (150g)",c:375},{l:"Large (200g)",c:500}],
    extras:[{l:"With cream",d:0},{l:"Light (-50 kcal)",d:-50}],
    macros:{p:10,carb:12,f:18},unit:"serve"},
  {name:"Fish curry",cat:"🍛 Curries",emoji:"🐟",
    variants:[{l:"Small serve (100g)",c:160},{l:"Medium serve (150g)",c:240},{l:"Large serve (200g)",c:320}],
    extras:[{l:"Coconut-based",d:0},{l:"Tomato-based (-20 kcal)",d:-20}],
    macros:{p:18,carb:5,f:8},unit:"serve"},
  {name:"Keema (mince)",cat:"🍛 Curries",emoji:"🍖",
    variants:[{l:"Small serve (100g)",c:200},{l:"Medium serve (150g)",c:300},{l:"Large serve (200g)",c:400}],
    extras:[{l:"Chicken mince",d:0},{l:"Mutton mince (+30 kcal)",d:30},{l:"With peas",d:0}],
    macros:{p:20,carb:5,f:13},unit:"serve"},

  // Snacks & Street food
  {name:"Samosa",cat:"🥟 Snacks",emoji:"🥟",
    variants:[{l:"Small",c:130},{l:"Medium",c:180},{l:"Large",c:250}],
    extras:[{l:"Plain",d:0},{l:"With green chutney (+20 kcal)",d:20},{l:"With tamarind chutney (+25 kcal)",d:25}],
    macros:{p:4,carb:22,f:8},unit:"piece"},
  {name:"Pakora",cat:"🥟 Snacks",emoji:"🥟",
    variants:[{l:"3 pieces",c:150},{l:"5 pieces",c:250},{l:"8 pieces",c:400}],
    extras:[{l:"Onion pakora",d:0},{l:"Paneer pakora (+30 kcal)",d:30},{l:"Spinach pakora (-10 kcal)",d:-10}],
    macros:{p:4,carb:20,f:8},unit:"serve"},
  {name:"Dhokla",cat:"🥟 Snacks",emoji:"🟡",
    variants:[{l:"2 pieces",c:120},{l:"4 pieces",c:240},{l:"6 pieces",c:360}],
    extras:[{l:"Regular",d:0},{l:"With tempering",d:0}],
    macros:{p:6,carb:20,f:2},unit:"serve"},
  {name:"Poha",cat:"🥟 Snacks",emoji:"🍽",
    variants:[{l:"Small bowl (100g)",c:130},{l:"Medium bowl (150g)",c:195},{l:"Large bowl (250g)",c:325}],
    extras:[{l:"Regular",d:0},{l:"With peanuts (+40 kcal)",d:40}],
    macros:{p:3,carb:26,f:3},unit:"bowl"},
  {name:"Upma",cat:"🥟 Snacks",emoji:"🍽",
    variants:[{l:"Small bowl (100g)",c:140},{l:"Medium bowl (150g)",c:210},{l:"Large bowl (250g)",c:350}],
    extras:[{l:"Regular",d:0},{l:"With cashews (+30 kcal)",d:30}],
    macros:{p:4,carb:24,f:5},unit:"bowl"},
  {name:"Vada pav",cat:"🥟 Snacks",emoji:"🥙",
    variants:[{l:"Small",c:250},{l:"Regular",c:320}],
    extras:[{l:"With chutney",d:20},{l:"Plain",d:0}],
    macros:{p:6,carb:40,f:12},unit:"piece"},
  {name:"Pav bhaji",cat:"🥟 Snacks",emoji:"🥙",
    variants:[{l:"1 pav + bhaji",c:350},{l:"2 pav + bhaji",c:520}],
    extras:[{l:"With butter",d:0},{l:"Extra butter (+60 kcal)",d:60},{l:"Light butter (-30 kcal)",d:-30}],
    macros:{p:8,carb:48,f:14},unit:"serve"},
  {name:"Chaat (papdi/bhel)",cat:"🥟 Snacks",emoji:"🥗",
    variants:[{l:"Small plate",c:180},{l:"Medium plate",c:280},{l:"Large plate",c:380}],
    extras:[{l:"With all chutneys",d:0},{l:"Less chutney",d:0}],
    macros:{p:5,carb:35,f:6},unit:"plate"},

  // Breakfast / South Indian
  {name:"Idli",cat:"🥞 South Indian",emoji:"🍚",
    variants:[{l:"1 piece",c:40},{l:"2 pieces",c:80},{l:"4 pieces",c:160}],
    extras:[{l:"Plain",d:0},{l:"With sambar (+50 kcal)",d:50},{l:"With coconut chutney (+35 kcal)",d:35}],
    macros:{p:2,carb:8,f:0},unit:"piece"},
  {name:"Dosa",cat:"🥞 South Indian",emoji:"🥞",
    variants:[{l:"Plain dosa",c:120},{l:"Masala dosa",c:210},{l:"Rava dosa",c:180}],
    extras:[{l:"Plain",d:0},{l:"With ghee (+40 kcal)",d:40},{l:"With sambar (+50 kcal)",d:50},{l:"With chutney (+35 kcal)",d:35}],
    macros:{p:4,carb:22,f:4},unit:"piece"},
  {name:"Uttapam",cat:"🥞 South Indian",emoji:"🥞",
    variants:[{l:"Small",c:150},{l:"Medium",c:220},{l:"Large",c:300}],
    extras:[{l:"Onion",d:0},{l:"Mixed veg",d:10},{l:"With ghee (+30 kcal)",d:30}],
    macros:{p:5,carb:28,f:5},unit:"piece"},
  {name:"Medu vada",cat:"🥞 South Indian",emoji:"🍩",
    variants:[{l:"1 piece",c:120},{l:"2 pieces",c:240}],
    extras:[{l:"Plain",d:0},{l:"With sambar (+50 kcal)",d:50},{l:"With chutney (+35 kcal)",d:35}],
    macros:{p:4,carb:14,f:7},unit:"piece"},

  // Sweets & Desserts
  {name:"Moong dal halwa",cat:"🍮 Indian Sweets",emoji:"🍮",
    variants:[{l:"Small serve (50g)",c:180},{l:"Medium serve (80g)",c:290},{l:"Large serve (100g)",c:360}],
    extras:[{l:"Regular",d:0},{l:"Extra ghee (+50 kcal)",d:50},{l:"Less sweet (-20 kcal)",d:-20}],
    macros:{p:4,carb:35,f:16},unit:"serve"},
  {name:"Gulab jamun",cat:"🍮 Indian Sweets",emoji:"🟤",
    variants:[{l:"1 piece (small)",c:125},{l:"1 piece (large)",c:175},{l:"2 pieces",c:300}],
    extras:[{l:"In syrup",d:0},{l:"Less syrup (-20 kcal)",d:-20}],
    macros:{p:3,carb:22,f:6},unit:"piece"},
  {name:"Kheer",cat:"🍮 Indian Sweets",emoji:"🥛",
    variants:[{l:"Small bowl (100g)",c:150},{l:"Medium bowl (150g)",c:225},{l:"Large bowl (200g)",c:300}],
    extras:[{l:"Full fat milk",d:0},{l:"Reduced fat (-30 kcal)",d:-30},{l:"With dry fruits (+40 kcal)",d:40}],
    macros:{p:5,carb:25,f:7},unit:"bowl"},
  {name:"Gajar halwa",cat:"🍮 Indian Sweets",emoji:"🥕",
    variants:[{l:"Small serve (80g)",c:200},{l:"Medium serve (120g)",c:300},{l:"Large serve (160g)",c:400}],
    extras:[{l:"Regular",d:0},{l:"With khoya (+40 kcal)",d:40}],
    macros:{p:4,carb:30,f:10},unit:"serve"},
  {name:"Rasgulla",cat:"🍮 Indian Sweets",emoji:"⚪",
    variants:[{l:"1 piece",c:100},{l:"2 pieces",c:200}],
    extras:[{l:"In syrup",d:0},{l:"Less syrup (-15 kcal)",d:-15}],
    macros:{p:3,carb:20,f:2},unit:"piece"},
  {name:"Jalebi",cat:"🍮 Indian Sweets",emoji:"🟠",
    variants:[{l:"2 pieces (50g)",c:150},{l:"4 pieces (100g)",c:300}],
    extras:[{l:"Regular",d:0},{l:"With rabri (+120 kcal)",d:120}],
    macros:{p:2,carb:30,f:6},unit:"serve"},
  {name:"Ladoo",cat:"🍮 Indian Sweets",emoji:"🟡",
    variants:[{l:"Small ladoo (30g)",c:130},{l:"Medium ladoo (50g)",c:215},{l:"Large ladoo (70g)",c:300}],
    extras:[{l:"Besan",d:0},{l:"Motichoor",d:10},{l:"Rava (-10 kcal)",d:-10},{l:"Coconut (-15 kcal)",d:-15}],
    macros:{p:3,carb:28,f:10},unit:"piece"},

  // Beverages
  {name:"Chai (masala tea)",cat:"☕ Drinks",emoji:"☕",
    variants:[{l:"Small cup (150ml)",c:60},{l:"Regular cup (200ml)",c:80},{l:"Large cup (300ml)",c:120}],
    extras:[{l:"Full fat milk",d:0},{l:"Reduced fat (-10 kcal)",d:-10},{l:"With sugar (+30 kcal)",d:30},{l:"No sugar",d:0}],
    macros:{p:2,carb:8,f:3},unit:"cup"},
  {name:"Lassi",cat:"☕ Drinks",emoji:"🥛",
    variants:[{l:"Small glass (200ml)",c:140},{l:"Regular glass (300ml)",c:210},{l:"Large glass (400ml)",c:280}],
    extras:[{l:"Sweet lassi",d:0},{l:"Salted lassi (-20 kcal)",d:-20},{l:"Mango lassi (+40 kcal)",d:40},{l:"Rose lassi (+20 kcal)",d:20}],
    macros:{p:5,carb:22,f:5},unit:"glass"},
  {name:"Nimbu pani (lemonade)",cat:"☕ Drinks",emoji:"🍋",
    variants:[{l:"Small glass (200ml)",c:40},{l:"Regular glass (300ml)",c:60}],
    extras:[{l:"With sugar",d:0},{l:"With honey (+10 kcal)",d:10},{l:"No sugar (-30 kcal)",d:-30}],
    macros:{p:0,carb:10,f:0},unit:"glass"},
  {name:"Buttermilk (chaas)",cat:"☕ Drinks",emoji:"🥛",
    variants:[{l:"Small glass (200ml)",c:40},{l:"Regular glass (300ml)",c:60}],
    extras:[{l:"With salt & cumin",d:0},{l:"Sweet (+20 kcal)",d:20}],
    macros:{p:2,carb:5,f:1},unit:"glass"},

  // Eggs
  {name:"Egg",cat:"🥚 Eggs",emoji:"🥚",
    variants:[{l:"Small",c:54},{l:"Medium",c:63},{l:"Large",c:78},{l:"Extra large",c:90}],
    extras:[{l:"Boiled",d:0},{l:"Fried (+35 kcal)",d:35},{l:"Scrambled (+20 kcal)",d:20},{l:"Poached",d:0},{l:"Half fry (+25 kcal)",d:25}],
    macros:{p:6,carb:0,f:5},unit:"egg"},
  {name:"Egg bhurji (scrambled)",cat:"🥚 Eggs",emoji:"🥚",
    variants:[{l:"2 egg serve",c:200},{l:"3 egg serve",c:280},{l:"4 egg serve",c:360}],
    extras:[{l:"With onion & tomato",d:0},{l:"With butter (+40 kcal)",d:40},{l:"Spicy masala",d:0}],
    macros:{p:14,carb:5,f:14},unit:"serve"},

  // Australian foods
  {name:"Avocado",cat:"🥑 Australian",emoji:"🥑",
    variants:[{l:"¼ avocado",c:58},{l:"½ avocado",c:115},{l:"Whole avocado",c:230}],
    extras:[{l:"Mashed",d:0},{l:"Sliced",d:0},{l:"With lemon & salt",d:0}],
    macros:{p:1,carb:3,f:11},unit:"serve"},
  {name:"Bread / Toast",cat:"🍞 Australian",emoji:"🍞",
    variants:[{l:"1 slice",c:79},{l:"2 slices",c:158}],
    extras:[{l:"Sourdough (+5 kcal)",d:5},{l:"Multigrain",d:0},{l:"White bread",d:0},{l:"Wholemeal",d:0},{l:"Rye (-5 kcal)",d:-5},{l:"Gluten-free",d:0}],
    macros:{p:3,carb:15,f:1},unit:"slice"},
  {name:"Flat white",cat:"☕ Coffee",emoji:"☕",
    variants:[{l:"Small 6oz",c:100},{l:"Regular 8oz",c:135},{l:"Large 12oz",c:180}],
    extras:[{l:"Full cream milk",d:0},{l:"Skim milk (-20 kcal)",d:-20},{l:"Oat milk (-10 kcal)",d:-10},{l:"Almond milk (-30 kcal)",d:-30},{l:"Extra shot",d:0}],
    macros:{p:6,carb:10,f:5},unit:"cup"},
  {name:"Long black",cat:"☕ Coffee",emoji:"☕",
    variants:[{l:"Single shot",c:5},{l:"Double shot",c:10}],
    extras:[{l:"Plain",d:0},{l:"With sugar (+30 kcal)",d:30}],
    macros:{p:0,carb:0,f:0},unit:"cup"},
  {name:"Meat pie",cat:"🥧 Australian",emoji:"🥧",
    variants:[{l:"Party pie (60g)",c:160},{l:"Regular pie (175g)",c:450},{l:"Large pie (220g)",c:580}],
    extras:[{l:"Plain",d:0},{l:"With sauce (+20 kcal)",d:20},{l:"Mushy peas (+80 kcal)",d:80}],
    macros:{p:12,carb:32,f:24},unit:"pie"},
  {name:"Sausage roll",cat:"🥧 Australian",emoji:"🌭",
    variants:[{l:"Mini (party)",c:130},{l:"Regular",c:280},{l:"Large",c:400}],
    extras:[{l:"Plain",d:0},{l:"With sauce (+20 kcal)",d:20}],
    macros:{p:8,carb:22,f:16},unit:"piece"},
  {name:"Tim Tams",cat:"🍫 Snacks",emoji:"🍫",
    variants:[{l:"1 biscuit",c:95},{l:"2 biscuits",c:190},{l:"3 biscuits",c:285}],
    extras:[{l:"Original",d:0},{l:"Dark choc (+5 kcal)",d:5},{l:"White choc (+8 kcal)",d:8}],
    macros:{p:1,carb:13,f:5},unit:"piece"},
  {name:"Lamington",cat:"🎂 Australian",emoji:"🎂",
    variants:[{l:"Small piece",c:180},{l:"Regular piece",c:250}],
    extras:[{l:"Plain",d:0},{l:"With jam (+30 kcal)",d:30},{l:"With cream (+60 kcal)",d:60}],
    macros:{p:3,carb:38,f:8},unit:"piece"},
  {name:"Vegemite",cat:"🍞 Australian",emoji:"🫙",
    variants:[{l:"Light spread (5g)",c:11},{l:"Normal spread (10g)",c:22}],
    extras:[{l:"On toast",d:0},{l:"With butter (+35 kcal)",d:35}],
    macros:{p:1,carb:2,f:0},unit:"serve"},

  // Proteins
  {name:"Chicken breast",cat:"🍗 Protein",emoji:"🍗",
    variants:[{l:"Small (100g)",c:165},{l:"Medium (150g)",c:248},{l:"Large (200g)",c:330}],
    extras:[{l:"Grilled",d:0},{l:"Baked",d:0},{l:"Pan fried (+30 kcal)",d:30},{l:"Poached (-10 kcal)",d:-10}],
    macros:{p:31,carb:0,f:4},unit:"serve"},
  {name:"Salmon fillet",cat:"🐟 Protein",emoji:"🐟",
    variants:[{l:"Small (100g)",c:208},{l:"Medium (150g)",c:312},{l:"Large (200g)",c:416}],
    extras:[{l:"Baked",d:0},{l:"Pan fried (+40 kcal)",d:40},{l:"Smoked (+10 kcal)",d:10}],
    macros:{p:20,carb:0,f:13},unit:"fillet"},
  {name:"Tuna (canned)",cat:"🐟 Protein",emoji:"🐟",
    variants:[{l:"Small can 95g",c:87},{l:"Large can 185g",c:170}],
    extras:[{l:"In spring water",d:0},{l:"In oil (+50 kcal)",d:50}],
    macros:{p:20,carb:0,f:1},unit:"can"},

  // Dairy
  {name:"Greek yogurt",cat:"🥛 Dairy",emoji:"🥛",
    variants:[{l:"Small (100g)",c:59},{l:"Medium (150g)",c:88},{l:"Large (200g)",c:118}],
    extras:[{l:"Full fat",d:30},{l:"Low fat",d:0},{l:"Non-fat (-15 kcal)",d:-15}],
    macros:{p:10,carb:4,f:1},unit:"serve"},
  {name:"Paneer",cat:"🧀 Dairy",emoji:"🧀",
    variants:[{l:"Small (50g)",c:145},{l:"Medium (100g)",c:290},{l:"Large (150g)",c:435}],
    extras:[{l:"Fresh",d:0},{l:"Fried (+80 kcal)",d:80},{l:"Grilled (+20 kcal)",d:20}],
    macros:{p:11,carb:2,f:23},unit:"serve"},
  {name:"Milk",cat:"🥛 Dairy",emoji:"🥛",
    variants:[{l:"Small glass 150ml",c:92},{l:"Medium glass 250ml",c:153},{l:"Large glass 350ml",c:214}],
    extras:[{l:"Full cream",d:30},{l:"Reduced fat",d:0},{l:"Skim (-30 kcal)",d:-30},{l:"Oat milk (-20 kcal)",d:-20},{l:"Almond milk (-80 kcal)",d:-80}],
    macros:{p:5,carb:12,f:4},unit:"glass"},

  // Fruits & Veg
  {name:"Banana",cat:"🍌 Fruit",emoji:"🍌",
    variants:[{l:"Small",c:72},{l:"Medium",c:89},{l:"Large",c:121}],
    extras:[{l:"Fresh",d:0},{l:"Overripe (+5 kcal)",d:5}],
    macros:{p:1,carb:23,f:0},unit:"piece"},
  {name:"Apple",cat:"🍎 Fruit",emoji:"🍎",
    variants:[{l:"Small",c:55},{l:"Medium",c:95},{l:"Large",c:130}],
    extras:[{l:"With skin",d:0},{l:"Peeled (-5 kcal)",d:-5}],
    macros:{p:0,carb:25,f:0},unit:"piece"},
  {name:"Oats",cat:"🥣 Grains",emoji:"🥣",
    variants:[{l:"Small 40g dry",c:150},{l:"Medium 60g dry",c:225},{l:"Large 80g dry",c:300}],
    extras:[{l:"With water",d:0},{l:"With milk (+60 kcal)",d:60},{l:"With honey (+45 kcal)",d:45}],
    macros:{p:5,carb:27,f:3},unit:"serve"},
  {name:"Peanut butter",cat:"🥜 Spreads",emoji:"🥜",
    variants:[{l:"1 tsp (7g)",c:42},{l:"1 tbsp (16g)",c:96}],
    extras:[{l:"Smooth",d:0},{l:"Crunchy",d:0},{l:"Natural",d:0}],
    macros:{p:4,carb:3,f:8},unit:"serve"},
];

// ─── COMPLETE MEAL DATABASE ───────────────────────────────────────────────────
const COMPLETE_MEALS = [
  // Indian Breakfast
  {name:"Dal chawal",emoji:"🍲",cat:"Indian Meals",cal:520,time:"30 min",tags:["vegetarian","high-fiber","budget"],
    ingredients:["Dal tadka (medium bowl)","Steamed rice (medium bowl)","Chapati (2 medium)"],
    macros:{p:17,c:88,f:10},tip:"A complete protein meal. Go easy on ghee to keep it light."},
  {name:"Chole bhature",emoji:"🫘",cat:"Indian Meals",cal:680,time:"40 min",tags:["vegetarian","indulgent"],
    ingredients:["Chole medium bowl","Bhatura (1 large)","Onion & pickle"],
    macros:{p:18,c:95,f:22},tip:"High calorie — enjoy as an occasional treat and skip dinner rice."},
  {name:"Poha breakfast",emoji:"🍽",cat:"Indian Breakfast",cal:350,time:"15 min",tags:["light","quick","vegetarian"],
    ingredients:["Poha (medium bowl)","Peanuts","Lemon, coriander"],
    macros:{p:8,c:55,f:8},tip:"Great light breakfast. Add a boiled egg for extra protein."},
  {name:"Idli sambar",emoji:"🍚",cat:"Indian Breakfast",cal:280,time:"5 min",tags:["low-fat","high-fiber","vegetarian"],
    ingredients:["Idli (4 pieces)","Dal tadka/sambar (small bowl)","Coconut chutney"],
    macros:{p:10,c:48,f:5},tip:"One of the lowest calorie South Indian breakfasts. Excellent choice!"},
  {name:"Masala dosa",emoji:"🥞",cat:"Indian Breakfast",cal:380,time:"10 min",tags:["vegetarian","filling"],
    ingredients:["Dosa (masala)","Sambar (small)","2 chutneys"],
    macros:{p:9,c:55,f:12},tip:"Skip the extra ghee and coconut chutney to shave off 80 calories."},
  {name:"Aloo paratha breakfast",emoji:"🫓",cat:"Indian Breakfast",cal:480,time:"20 min",tags:["vegetarian","filling"],
    ingredients:["Paratha (aloo stuffed, 2 medium)","Curd/yogurt","Pickle"],
    macros:{p:11,c:68,f:18},tip:"Filling but calorie-dense. Have 1 paratha + extra yogurt to reduce calories."},
  {name:"Egg bhurji with roti",emoji:"🥚",cat:"Indian Breakfast",cal:440,time:"15 min",tags:["high-protein","quick"],
    ingredients:["Egg bhurji (3 egg)","Chapati (2 medium)","Chai"],
    macros:{p:22,c:42,f:20},tip:"High protein start to the day. Skip the chai sugar to save 30 calories."},
  {name:"Upma breakfast",emoji:"🍽",cat:"Indian Breakfast",cal:310,time:"20 min",tags:["light","vegetarian","budget"],
    ingredients:["Upma (medium bowl)","Coconut chutney","Chai"],
    macros:{p:7,c:50,f:8},tip:"Light and filling. Add peanuts for protein and healthy fats."},

  // Indian Mains
  {name:"Egg curry with rice",emoji:"🍛",cat:"Indian Mains",cal:580,time:"30 min",tags:["high-protein","budget"],
    ingredients:["Egg curry (2 eggs)","Steamed rice (medium)","Chapati (1)"],
    macros:{p:22,c:68,f:18},tip:"Great protein meal. Use just 1 chapati and extra veg on the side."},
  {name:"Chicken biryani full plate",emoji:"🍛",cat:"Indian Mains",cal:650,time:"60 min",tags:["high-protein","indulgent"],
    ingredients:["Chicken biryani (large plate)","Raita","Salad"],
    macros:{p:28,c:72,f:18},tip:"Have a medium plate instead of large to save 160 calories."},
  {name:"Mutton biryani plate",emoji:"🍛",cat:"Indian Mains",cal:760,time:"90 min",tags:["high-protein","indulgent"],
    ingredients:["Mutton biryani (large plate)","Raita","Salad"],
    macros:{p:32,c:68,f:26},tip:"Very calorie dense. Enjoy occasionally and skip dessert on this day."},
  {name:"Rajma chawal",emoji:"🫘",cat:"Indian Mains",cal:560,time:"40 min",tags:["vegetarian","high-protein","budget"],
    ingredients:["Rajma (medium bowl)","Steamed rice (medium)","Onion salad","Pickle"],
    macros:{p:18,c:90,f:8},tip:"Excellent plant-based protein. Skip the ghee on rice to save 40 calories."},
  {name:"Palak paneer with roti",emoji:"🥬",cat:"Indian Mains",cal:520,time:"30 min",tags:["vegetarian","calcium-rich"],
    ingredients:["Palak paneer (medium)","Chapati (2 medium)","Raita (small)"],
    macros:{p:18,c:42,f:22},tip:"Iron and calcium rich. Choose lower-fat paneer to reduce calories."},
  {name:"Dal makhani roti",emoji:"🍲",cat:"Indian Mains",cal:480,time:"45 min",tags:["vegetarian","protein"],
    ingredients:["Dal makhani (medium)","Chapati (2 medium)","Salad"],
    macros:{p:15,c:58,f:14},tip:"Classic comfort food. Skip cream topping to save 50 calories."},
  {name:"Chicken curry with chapati",emoji:"🍛",cat:"Indian Mains",cal:560,time:"40 min",tags:["high-protein"],
    ingredients:["Chicken curry (medium)","Chapati (2 medium)","Raita"],
    macros:{p:28,c:42,f:18},tip:"High protein, moderate carb. Perfect for weight loss goals."},
  {name:"Aloo gobi sabzi roti",emoji:"🥔",cat:"Indian Mains",cal:390,time:"25 min",tags:["vegetarian","light","budget"],
    ingredients:["Aloo gobi (medium)","Chapati (2 medium)","Dal (small)"],
    macros:{p:10,c:58,f:10},tip:"Light vegetarian meal. Add a small bowl of dal to boost protein."},
  {name:"Fish curry rice",emoji:"🐟",cat:"Indian Mains",cal:520,time:"35 min",tags:["high-protein","omega-3"],
    ingredients:["Fish curry (medium)","Steamed rice (medium)","Salad"],
    macros:{p:26,c:55,f:12},tip:"Excellent omega-3 meal. Choose brown rice for extra fiber."},
  {name:"Keema pav",emoji:"🍖",cat:"Indian Mains",cal:580,time:"30 min",tags:["high-protein"],
    ingredients:["Keema (medium)","Bhatura/pav (2 pieces)","Onion & lemon"],
    macros:{p:28,c:52,f:22},tip:"High protein but also high fat. Balance with a large salad."},
  {name:"Veg biryani with raita",emoji:"🍛",cat:"Indian Mains",cal:480,time:"45 min",tags:["vegetarian","filling"],
    ingredients:["Veg biryani (medium plate)","Raita (medium)","Papad"],
    macros:{p:10,c:72,f:12},tip:"Lighter than meat biryani. Add paneer or tofu for more protein."},
  {name:"Paneer butter masala naan",emoji:"🧀",cat:"Indian Mains",cal:720,time:"35 min",tags:["vegetarian","indulgent"],
    ingredients:["Paneer butter masala (medium)","Butter naan (1 large)","Raita"],
    macros:{p:20,c:68,f:28},tip:"Restaurant-style indulgence. Share the naan or swap for 2 rotis to save 100 calories."},
  {name:"Sambar rice",emoji:"🍲",cat:"Indian Mains",cal:380,time:"10 min",tags:["vegetarian","light","budget"],
    ingredients:["Steamed rice (medium)","Dal tadka/sambar (large)","Papad","Pickle"],
    macros:{p:12,c:62,f:5},tip:"Simple and light. Add a vegetable side to get more nutrients."},

  // Indian Sweets & Snacks
  {name:"Moong dal halwa serve",emoji:"🍮",cat:"Indian Sweets",cal:360,time:"45 min",tags:["sweet","indulgent"],
    ingredients:["Moong dal halwa (large serve)"],
    macros:{p:7,c:45,f:18},tip:"Rich in protein from moong dal but very high in ghee and sugar. Small serve is plenty."},
  {name:"Gulab jamun 2 piece",emoji:"🟤",cat:"Indian Sweets",cal:300,time:"5 min",tags:["sweet","occasional"],
    ingredients:["Gulab jamun (2 large)"],
    macros:{p:5,c:45,f:12},tip:"Very high in sugar. Enjoy occasionally and log it — awareness is key!"},
  {name:"Gajar halwa serve",emoji:"🥕",cat:"Indian Sweets",cal:350,time:"40 min",tags:["sweet","winter"],
    ingredients:["Gajar halwa (large serve)"],
    macros:{p:5,c:42,f:14},tip:"Carrots add nutrition but it's still calorie-dense. Smaller serves are fine."},
  {name:"Samosa chaat plate",emoji:"🥟",cat:"Indian Snacks",cal:480,time:"10 min",tags:["snack","street-food"],
    ingredients:["Samosa (2 medium)","Chaat toppings","Chutneys","Curd"],
    macros:{p:10,c:62,f:18},tip:"High calorie street snack. Great as a meal replacement, not an addition."},
  {name:"Pakora plate with chai",emoji:"🥟",cat:"Indian Snacks",cal:420,time:"20 min",tags:["snack","rainy-day"],
    ingredients:["Pakora (8 pieces)","Chai (regular)","Chutney"],
    macros:{p:9,c:52,f:18},tip:"Classic rainy day snack. Deep fried — enjoy occasionally and count calories."},
  {name:"Vada pav snack",emoji:"🥙",cat:"Indian Snacks",cal:370,time:"5 min",tags:["snack","street-food","budget"],
    ingredients:["Vada pav (regular)","Green chutney","Fried chilli"],
    macros:{p:8,c:50,f:15},tip:"Filling street snack. Have with a buttermilk instead of chai to keep it lighter."},

  // Australian meals
  {name:"Avo toast with eggs",emoji:"🥑",cat:"Aussie Breakfast",cal:460,time:"12 min",tags:["high-protein","healthy-fat","aussie"],
    ingredients:["Bread/toast (2 slices sourdough)","½ avocado (mashed)","Egg (2 large poached)","Lemon & chilli flakes"],
    macros:{p:20,c:35,f:20},tip:"Protein-rich and filling. One of the best breakfasts for weight loss."},
  {name:"Overnight oats",emoji:"🥣",cat:"Aussie Breakfast",cal:380,time:"5 min",tags:["high-fiber","meal-prep","quick"],
    ingredients:["Oats (medium serve with milk)","Banana (medium)","Peanut butter (1 tbsp)","Greek yogurt (small)"],
    macros:{p:14,c:55,f:9},tip:"Prep the night before — perfect for busy mornings with a toddler!"},
  {name:"Flat white & Tim Tams",emoji:"☕",cat:"Aussie Snacks",cal:285,time:"2 min",tags:["snack","coffee"],
    ingredients:["Flat white (regular, oat milk)","Tim Tams (2 biscuits)"],
    macros:{p:5,c:32,f:14},tip:"The classic Aussie afternoon treat. Swap to skim milk and 1 Tim Tam to save 80 calories."},
  {name:"Meat pie lunch",emoji:"🥧",cat:"Aussie Lunch",cal:540,time:"5 min",tags:["aussie","quick","indulgent"],
    ingredients:["Meat pie (regular)","Sauce","Side salad"],
    macros:{p:18,c:48,f:28},tip:"High in saturated fat. A lighter lunch today means more room for dinner."},
  {name:"Tuna salad bowl",emoji:"🥗",cat:"Aussie Lunch",cal:320,time:"8 min",tags:["high-protein","low-carb","quick"],
    ingredients:["Tuna in spring water (large can)","Mixed greens","Avocado (¼)","Cherry tomatoes","Lemon dressing"],
    macros:{p:28,c:10,f:10},tip:"Excellent low-calorie, high-protein meal. One of your best options for weight loss."},
  {name:"Chicken salad sandwich",emoji:"🥪",cat:"Aussie Lunch",cal:420,time:"8 min",tags:["high-protein","aussie"],
    ingredients:["Bread (2 slices multigrain)","Chicken breast (small, grilled)","Avocado (¼)","Salad greens","Mustard"],
    macros:{p:28,c:32,f:14},tip:"Great balanced lunch. Swap one bread slice for extra salad to cut 80 calories."},
  {name:"Salmon & veg dinner",emoji:"🐟",cat:"Aussie Dinner",cal:480,time:"25 min",tags:["omega-3","low-carb","high-protein"],
    ingredients:["Salmon fillet (medium, baked)","Sweet potato (medium, roasted)","Broccoli (large)"],
    macros:{p:28,c:35,f:16},tip:"Perfect weight loss dinner — high protein, omega-3, and loads of veg."},
  {name:"Chicken stir fry",emoji:"🥘",cat:"Aussie Dinner",cal:420,time:"20 min",tags:["high-protein","low-carb","quick"],
    ingredients:["Chicken breast (medium, diced)","Mixed veg (capsicum, broccoli)","Soy sauce & ginger","Steamed rice (small)"],
    macros:{p:32,c:38,f:8},tip:"Quick and protein-rich. Skip the rice and double the veg to save 130 calories."},
];

const ALL_TAGS_LIST = [...new Set(COMPLETE_MEALS.flatMap(m=>m.tags))];
const MEAL_CATS = [...new Set(COMPLETE_MEALS.map(m=>m.cat))];

// ─── AI helpers ───────────────────────────────────────────────────────────────
async function getAISuggestion(profile, remaining, mealType) {
  const prompt = `You are a friendly nutritionist. The user wants to lose weight.
Profile: ${profile.age}y ${profile.sex}, ${profile.weight}kg, target ${profile.targetWeight}kg.
They have ${remaining} calories remaining today. Suggest ONE ${mealType} meal under ${Math.round(remaining*0.6)} calories that fits an Indian-Australian lifestyle.
Reply ONLY in this JSON (nothing else): {"name":"meal name","cal":number,"time":"X min","emoji":"single emoji","recipe":"2-3 sentence recipe","tip":"1 sentence weight loss tip"}`;
  const res = await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:350,messages:[{role:"user",content:prompt}]})
  });
  const data = await res.json();
  const text = data.content?.find(b=>b.type==="text")?.text||"";
  return JSON.parse(text.replace(/```json|```/g,"").trim());
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("home");
  const [profile, setProfile] = useState(null);
  const [pForm, setPForm] = useState({name:"",weight:"",height:"",age:"",sex:"female",targetWeight:""});
  const [meals, setMeals] = useState([]);
  const [weightLog, setWeightLog] = useState([]);
  const [newWeight, setNewWeight] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Smart logger state
  const [loggerIngredients, setLoggerIngredients] = useState([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [mealLabel, setMealLabel] = useState("");
  const searchRef = useRef(null);

  // Meal DB state
  const [dbSearch, setDbSearch] = useState("");
  const [dbCat, setDbCat] = useState("All");
  const [dbTag, setDbTag] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMealType, setAiMealType] = useState("lunch");

  useEffect(()=>{
    (async()=>{
      const p=await load("nm_profile"),m=await load("nm_meals"),w=await load("nm_weights");
      if(p)setProfile(p);if(m)setMeals(m);if(w)setWeightLog(w);
      setLoaded(true);
    })();
  },[]);

  // search
  useEffect(()=>{
    if(!searchQ.trim()){setSearchResults([]);return;}
    const q=searchQ.toLowerCase();
    setSearchResults(INGREDIENT_DB.filter(f=>f.name.toLowerCase().includes(q)||f.cat.toLowerCase().includes(q)).slice(0,7));
  },[searchQ]);

  const saveProfile = async()=>{
    const p={...pForm,weight:+pForm.weight,height:+pForm.height,age:+pForm.age,targetWeight:+pForm.targetWeight};
    setProfile(p);await save("nm_profile",p);
    const wl=[{date:todayStr(),weight:p.weight}];
    setWeightLog(wl);await save("nm_weights",wl);
    setTab("home");
  };

  const addIngredient = food=>{
    setSearchQ("");setSearchResults([]);
    if(loggerIngredients.find(i=>i.name===food.name))return;
    setLoggerIngredients(prev=>[...prev,{
      name:food.name,food,
      variant:food.variants[Math.floor(food.variants.length/2)],
      extra:food.extras.find(e=>e.d===0)||food.extras[0],
      qty:1
    }]);
  };

  const updateIngredient = (name,key,val)=>{
    setLoggerIngredients(prev=>prev.map(i=>i.name===name?{...i,[key]:val}:i));
  };

  const removeIngredient = name=>setLoggerIngredients(prev=>prev.filter(i=>i.name!==name));

  const calcIngCal = ing=>Math.round((ing.variant.c+ing.extra.d)*ing.qty);
  const totalCal = loggerIngredients.reduce((s,i)=>s+calcIngCal(i),0);
  const totalP = loggerIngredients.reduce((s,i)=>s+Math.round(i.food.macros.p*i.qty),0);
  const totalCarb = loggerIngredients.reduce((s,i)=>s+Math.round(i.food.macros.carb*i.qty),0);
  const totalF = loggerIngredients.reduce((s,i)=>s+Math.round(i.food.macros.f*i.qty),0);

  const logCustomMeal = async()=>{
    if(!loggerIngredients.length)return;
    const name=mealLabel||`Meal ${(meals.filter(m=>m.date===todayStr()).length)+1}`;
    const ingDesc=loggerIngredients.map(i=>`${i.qty}× ${i.name} (${i.variant.l}, ${i.extra.l})`).join(", ");
    const updated=[...meals,{name,calories:totalCal,ingredients:ingDesc,date:todayStr(),id:Date.now()}];
    setMeals(updated);await save("nm_meals",updated);
    setLoggerIngredients([]);setMealLabel("");
  };

  const logMealFromDB = async m=>{
    const updated=[...meals,{name:m.name,calories:m.cal,ingredients:m.ingredients.join(", "),date:todayStr(),id:Date.now()}];
    setMeals(updated);await save("nm_meals",updated);
  };

  const removeMeal = async id=>{
    const updated=meals.filter(x=>x.id!==id);
    setMeals(updated);await save("nm_meals",updated);
  };

  const logWeight = async()=>{
    if(!newWeight)return;
    const wl=[...weightLog,{date:todayStr(),weight:+newWeight}];
    setWeightLog(wl);await save("nm_weights",wl);setNewWeight("");
  };

  const getAI = async()=>{
    setAiLoading(true);setAiSuggestion(null);
    try{const s=await getAISuggestion(profile,remaining,aiMealType);setAiSuggestion(s);}
    catch{setAiSuggestion({name:"Error",cal:0,emoji:"⚠️",recipe:"Couldn't load suggestion. Try again.",tip:""});}
    setAiLoading(false);
  };

  if(!loaded)return<div style={S.splash}>🌿 Loading…</div>;

  // Onboarding
  if(!profile)return(
    <div style={S.root}>
      <div style={S.onboard}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:50}}>🌿</div>
          <h1 style={S.onboardTitle}>NourishMe</h1>
          <p style={S.onboardSub}>Your personal weight loss companion</p>
        </div>
        <div style={S.fields}>
          {[["Your name","name","text","e.g. Priya"],["Current weight (kg)","weight","number","e.g. 85"],
            ["Target weight (kg)","targetWeight","number","e.g. 65"],["Height (cm)","height","number","e.g. 165"],
            ["Age","age","number","e.g. 30"]].map(([l,k,t,ph])=>(
            <div key={k}>
              <div style={S.fieldLabel}>{l}</div>
              <input style={S.input} type={t} placeholder={ph} value={pForm[k]}
                onChange={e=>setPForm(f=>({...f,[k]:e.target.value}))}/>
            </div>
          ))}
          <div>
            <div style={S.fieldLabel}>Biological sex</div>
            <div style={S.toggle}>
              {["female","male"].map(s=>(
                <button key={s} style={{...S.toggleBtn,...(pForm.sex===s?S.toggleActive:{})}}
                  onClick={()=>setPForm(f=>({...f,sex:s}))}>
                  {s==="female"?"♀ Female":"♂ Male"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button style={S.btn} onClick={saveProfile}
          disabled={!pForm.name||!pForm.weight||!pForm.height||!pForm.age||!pForm.targetWeight}>
          Begin my journey →
        </button>
      </div>
    </div>
  );

  const bmi=profile.weight/((profile.height/100)**2);
  const bmr=calcBMR(profile);
  const tdee=calcTDEE(bmr);
  const dailyGoal=calcGoal(tdee);
  const todayMeals=meals.filter(m=>m.date===todayStr());
  const todayKcal=todayMeals.reduce((s,m)=>s+m.calories,0);
  const remaining=dailyGoal-todayKcal;
  const pct=Math.min((todayKcal/dailyGoal)*100,100);
  const bmiInfo=getBMIInfo(bmi);
  const latestW=weightLog.length?weightLog[weightLog.length-1].weight:profile.weight;
  const lostSoFar=+(profile.weight-latestW).toFixed(1);
  const weeksLeft=Math.max(0,Math.ceil((latestW-profile.targetWeight)/1));

  const filteredMealDB=COMPLETE_MEALS.filter(m=>{
    const matchCat=dbCat==="All"||m.cat===dbCat;
    const matchTag=!dbTag||m.tags.includes(dbTag);
    const matchQ=!dbSearch||m.name.toLowerCase().includes(dbSearch.toLowerCase())||m.cat.toLowerCase().includes(dbSearch.toLowerCase());
    return matchCat&&matchTag&&matchQ;
  });

  const TABS=[
    {id:"home",icon:"🏠",label:"Home"},
    {id:"log",icon:"✏️",label:"Log"},
    {id:"meals",icon:"📖",label:"Meals"},
    {id:"suggest",icon:"✨",label:"Ideas"},
    {id:"progress",icon:"📈",label:"Progress"},
  ];

  return(
    <div style={S.root}>
      <div style={S.app}>

        {/* Header */}
        <div style={S.header}>
          <div>
            <div style={S.hi}>{greeting()}, {profile.name.split(" ")[0]} 👋</div>
            <div style={S.headerSub}>{new Date().toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long"})}</div>
          </div>
          <div style={S.bmiChip}>
            <span style={{color:bmiInfo.color,fontWeight:700}}>{bmiInfo.label}</span>
            <span style={{color:"#4a7a4a"}}> · {bmi.toFixed(1)}</span>
          </div>
        </div>

        {/* Content */}
        <div style={S.content}>

          {/* ── HOME ── */}
          {tab==="home"&&<>
            <div style={S.card}>
              <div style={S.cardTitle}>Today's Calories</div>
              <div style={S.ringRow}>
                <svg width={150} height={150} viewBox="0 0 150 150">
                  <circle cx={75} cy={75} r={60} fill="none" stroke="#1c2e1c" strokeWidth={13}/>
                  <circle cx={75} cy={75} r={60} fill="none"
                    stroke={remaining<0?"#fca5a5":"#6ee7b7"} strokeWidth={13} strokeLinecap="round"
                    strokeDasharray={`${2*Math.PI*60}`}
                    strokeDashoffset={`${2*Math.PI*60*(1-pct/100)}`}
                    transform="rotate(-90 75 75)" style={{transition:"stroke-dashoffset .7s ease"}}/>
                  <text x={75} y={67} textAnchor="middle" style={{fill:"#f0faf0",fontSize:26,fontWeight:700,fontFamily:"Georgia"}}>{todayKcal}</text>
                  <text x={75} y={85} textAnchor="middle" style={{fill:"#6ee7b7",fontSize:11,fontFamily:"Georgia"}}>of {dailyGoal} kcal</text>
                  <text x={75} y={103} textAnchor="middle" style={{fill:remaining<0?"#fca5a5":"#a7f3d0",fontSize:10,fontFamily:"Georgia"}}>
                    {remaining<0?`${Math.abs(Math.round(remaining))} over`:`${Math.round(remaining)} remaining`}
                  </text>
                </svg>
                <div style={{flex:1}}>
                  <StatRow label="Daily goal" val={`${dailyGoal} kcal`} color="#6ee7b7"/>
                  <StatRow label="Consumed" val={`${todayKcal} kcal`} color="#fcd34d"/>
                  <StatRow label="Meals today" val={todayMeals.length} color="#a5b4fc"/>
                  <StatRow label="BMR" val={`${Math.round(bmr)} kcal`} color="#f9a8d4"/>
                </div>
              </div>
            </div>
            <div style={S.journeyRow}>
              <JCard icon="⚖️" label="Lost" val={`${lostSoFar} kg`} col="#6ee7b7"/>
              <JCard icon="🎯" label="To go" val={`${(latestW-profile.targetWeight).toFixed(1)} kg`} col="#fcd34d"/>
              <JCard icon="📅" label="~Weeks" val={weeksLeft||"🎉"} col="#a5b4fc"/>
            </div>
            <div style={S.card}>
              <div style={S.cardTitle}>BMI · {bmi.toFixed(1)}</div>
              <div style={{display:"flex",gap:5,marginBottom:6}}>
                {[["<18.5","#7dd3fc"],["18.5–25","#6ee7b7"],["25–30","#fcd34d"],["30+","#fca5a5"]].map(([l,c],i)=>(
                  <div key={i} style={{flex:1,textAlign:"center"}}>
                    <div style={{height:8,background:c,opacity:bmiInfo.band===i?1:0.25,borderRadius:4,marginBottom:4}}/>
                    <div style={{color:"#4a6a4a",fontSize:9}}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{color:bmiInfo.color,fontWeight:700,fontSize:14}}>{bmiInfo.label} — you've got this! 💪</div>
            </div>
            {todayMeals.length>0&&(
              <div style={S.card}>
                <div style={S.cardTitle}>Today's meals</div>
                {todayMeals.map(m=>(
                  <div key={m.id} style={S.mealRowSmall}>
                    <div>
                      <div style={{color:"#d0ead0",fontSize:13}}>🍴 {m.name}</div>
                      {m.ingredients&&<div style={{color:"#3a5a3a",fontSize:10,marginTop:2}}>{m.ingredients.slice(0,60)}{m.ingredients.length>60?"...":""}</div>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{color:"#6ee7b7",fontWeight:700,fontSize:13}}>{m.calories}</span>
                      <button style={{background:"none",border:"none",color:"#fca5a5",cursor:"pointer",fontSize:12}} onClick={()=>removeMeal(m.id)}>✕</button>
                    </div>
                  </div>
                ))}
                <div style={{color:"#6ee7b7",fontSize:12,marginTop:8,textAlign:"right"}}>Total: {todayKcal} kcal</div>
              </div>
            )}
          </>}

          {/* ── LOG ── */}
          {tab==="log"&&<>
            <div style={S.card}>
              <div style={S.cardTitle}>🔍 Smart Ingredient Logger</div>
              <div style={{color:"#6b9e6b",fontSize:12,marginBottom:12}}>Type any food — chapati, egg, dal, avocado, coffee…</div>
              <div style={{position:"relative"}}>
                <input ref={searchRef} style={S.input} placeholder="Search food..." value={searchQ}
                  onChange={e=>setSearchQ(e.target.value)}/>
                {searchResults.length>0&&(
                  <div style={S.dropdown}>
                    {searchResults.map(f=>(
                      <div key={f.name} style={S.dropItem} onClick={()=>addIngredient(f)}>
                        <span style={{fontSize:16}}>{f.emoji}</span>
                        <div style={{flex:1}}>
                          <div style={{color:"#f0faf0",fontSize:13}}>{f.name}</div>
                          <div style={{color:"#4a7a4a",fontSize:10}}>{f.cat}</div>
                        </div>
                        <span style={{color:"#6ee7b7",fontSize:11}}>{f.variants[1]?.c||f.variants[0]?.c} kcal</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {loggerIngredients.length>0&&<>
              {loggerIngredients.map(ing=>(
                <div key={ing.name} style={S.ingCard}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{color:"#f0faf0",fontWeight:700,fontSize:14}}>{ing.food.emoji} {ing.name}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{color:"#6ee7b7",fontWeight:700,fontSize:14}}>{calcIngCal(ing)} kcal</span>
                      <button style={{background:"none",border:"none",color:"#fca5a5",cursor:"pointer",fontSize:16}} onClick={()=>removeIngredient(ing.name)}>×</button>
                    </div>
                  </div>
                  <div style={{color:"#4a7a4a",fontSize:11,marginBottom:6}}>Size / Portion</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
                    {ing.food.variants.map(v=>(
                      <button key={v.l} style={{...S.optBtn,...(ing.variant.l===v.l?S.optActive:{})}}
                        onClick={()=>updateIngredient(ing.name,"variant",v)}>{v.l}</button>
                    ))}
                  </div>
                  <div style={{color:"#4a7a4a",fontSize:11,marginBottom:6}}>Preparation</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
                    {ing.food.extras.map(e=>(
                      <button key={e.l} style={{...S.optBtn,...(ing.extra.l===e.l?S.optActive:{})}}
                        onClick={()=>updateIngredient(ing.name,"extra",e)}>{e.l}</button>
                    ))}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{color:"#4a7a4a",fontSize:11}}>Quantity:</span>
                    <button style={S.qtyBtn} onClick={()=>updateIngredient(ing.name,"qty",Math.max(1,ing.qty-1))}>−</button>
                    <span style={{color:"#f0faf0",fontWeight:700,minWidth:20,textAlign:"center"}}>{ing.qty}</span>
                    <button style={S.qtyBtn} onClick={()=>updateIngredient(ing.name,"qty",Math.min(10,ing.qty+1))}>+</button>
                  </div>
                </div>
              ))}

              <div style={{...S.card,textAlign:"center"}}>
                <div style={{color:"#6ee7b7",fontSize:22,fontWeight:700,marginBottom:4}}>{totalCal} kcal</div>
                <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:12}}>
                  <MacroPill label="Protein" val={`${totalP}g`}/>
                  <MacroPill label="Carbs" val={`${totalCarb}g`}/>
                  <MacroPill label="Fat" val={`${totalF}g`}/>
                </div>
                <input style={{...S.input,marginBottom:10,textAlign:"center"}} placeholder="Name this meal (e.g. Lunch)" value={mealLabel}
                  onChange={e=>setMealLabel(e.target.value)}/>
                <button style={S.btn} onClick={logCustomMeal}>✓ Log this meal</button>
              </div>
            </>}

            {todayMeals.length>0&&<>
              <div style={S.cardTitle}>Today's log</div>
              {todayMeals.map(m=>(
                <div key={m.id} style={S.mealRow}>
                  <div style={{flex:1}}>
                    <div style={{color:"#f0faf0",fontSize:14,fontWeight:600}}>{m.name}</div>
                    {m.ingredients&&<div style={{color:"#3a5a3a",fontSize:10,marginTop:2,lineHeight:1.4}}>{m.ingredients}</div>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:8}}>
                    <span style={{color:"#6ee7b7",fontWeight:700}}>{m.calories}</span>
                    <button style={{background:"none",border:"none",color:"#fca5a5",cursor:"pointer"}} onClick={()=>removeMeal(m.id)}>✕</button>
                  </div>
                </div>
              ))}
              <div style={S.totalBanner}>
                {todayKcal} / {dailyGoal} kcal
                {remaining>=0?<span style={{color:"#6ee7b7"}}> · {Math.round(remaining)} remaining</span>
                  :<span style={{color:"#fca5a5"}}> · {Math.abs(Math.round(remaining))} over limit</span>}
              </div>
            </>}
          </>}

          {/* ── MEAL DATABASE ── */}
          {tab==="meals"&&<>
            <div style={S.card}>
              <div style={S.cardTitle}>📖 Meal Database</div>
              <input style={S.input} placeholder="Search meals... (egg curry, biryani, avo toast)" value={dbSearch}
                onChange={e=>setDbSearch(e.target.value)}/>
            </div>

            {/* Category filter */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
              {["All",...MEAL_CATS].map(c=>(
                <button key={c} style={{...S.catBtn,...(dbCat===c?S.catActive:{})}}
                  onClick={()=>setDbCat(c)}>{c}</button>
              ))}
            </div>

            {/* Tag filter */}
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
              {ALL_TAGS_LIST.slice(0,10).map(t=>(
                <button key={t} style={{...S.tagBtn,...(dbTag===t?S.tagActive:{})}}
                  onClick={()=>setDbTag(dbTag===t?null:t)}>{t}</button>
              ))}
            </div>

            {filteredMealDB.length===0&&<div style={{color:"#3a5a3a",textAlign:"center",padding:"20px 0"}}>No meals found</div>}
            {filteredMealDB.map(m=>(
              <div key={m.name} style={S.suggestCard}>
                <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                  <span style={{fontSize:26}}>{m.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{color:"#f0faf0",fontWeight:700,fontSize:15}}>{m.name}</div>
                    <div style={{color:"#4a7a4a",fontSize:11,marginTop:2}}>{m.cat} · {m.time}</div>
                    <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                      <Tag color="#6ee7b7">{m.cal} kcal</Tag>
                      <Tag color="#f9a8d4">P: {m.macros.p}g</Tag>
                      <Tag color="#fcd34d">C: {m.macros.c}g</Tag>
                      <Tag color="#a5b4fc">F: {m.macros.f}g</Tag>
                    </div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:6}}>
                      {m.tags.map(t=><span key={t} style={{background:"#1a2e1a",color:"#6b9e6b",fontSize:10,padding:"2px 7px",borderRadius:10}}>{t}</span>)}
                    </div>
                  </div>
                  <button style={S.logSmallBtn} onClick={()=>logMealFromDB(m)}>+ Log</button>
                </div>
                <div style={{marginTop:10,padding:"8px 10px",background:"#0a150a",borderRadius:8}}>
                  <div style={{color:"#4a7a4a",fontSize:10,marginBottom:4}}>Ingredients</div>
                  {m.ingredients.map((ing,i)=><div key={i} style={{color:"#6b9e6b",fontSize:11,lineHeight:1.6}}>• {ing}</div>)}
                </div>
                {m.tip&&<div style={{marginTop:8,padding:"7px 10px",background:"#142814",borderRadius:8,color:"#6ee7b7",fontSize:11}}>💡 {m.tip}</div>}
              </div>
            ))}
          </>}

          {/* ── AI SUGGESTIONS ── */}
          {tab==="suggest"&&<>
            <div style={S.aiBox}>
              <div style={{color:"#f0faf0",fontWeight:700,fontSize:16,marginBottom:4}}>✨ AI Meal Suggestion</div>
              <div style={{color:"#6b9e6b",fontSize:12,marginBottom:12}}>
                You have <span style={{color:"#6ee7b7",fontWeight:700}}>{Math.round(remaining)} kcal</span> remaining today. Get a personalised suggestion.
              </div>
              <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                {["breakfast","lunch","dinner","snack"].map(t=>(
                  <button key={t} style={{...S.catBtn,...(aiMealType===t?S.catActive:{})}}
                    onClick={()=>setAiMealType(t)}>{{"breakfast":"🌅","lunch":"☀️","dinner":"🌙","snack":"🍎"}[t]} {t}</button>
                ))}
              </div>
              <button style={{...S.btn,background:"linear-gradient(135deg,#166534,#15803d)"}} onClick={getAI} disabled={aiLoading}>
                {aiLoading?"🔄 Finding a meal for you…":"🤖 Suggest a meal for me"}
              </button>
              {aiSuggestion&&(
                <div style={{marginTop:14,padding:14,background:"#0a150a",borderRadius:12,border:"1px solid #1e3a1e",textAlign:"center"}}>
                  <div style={{fontSize:32,marginBottom:6}}>{aiSuggestion.emoji}</div>
                  <div style={{color:"#f0faf0",fontWeight:700,fontSize:17,marginBottom:6}}>{aiSuggestion.name}</div>
                  <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:10,flexWrap:"wrap"}}>
                    <Tag color="#6ee7b7">{aiSuggestion.cal} kcal</Tag>
                    <Tag color="#fcd34d">⏱ {aiSuggestion.time}</Tag>
                  </div>
                  <div style={{background:"#142814",borderRadius:8,padding:10,color:"#a0c8a0",fontSize:12,lineHeight:1.6,textAlign:"left",marginBottom:8}}>
                    <strong style={{color:"#6ee7b7"}}>Recipe: </strong>{aiSuggestion.recipe}
                  </div>
                  {aiSuggestion.tip&&<div style={{background:"#0f2a0f",borderRadius:8,padding:9,color:"#6ee7b7",fontSize:12,textAlign:"left",marginBottom:10}}>
                    💡 {aiSuggestion.tip}
                  </div>}
                  <button style={{...S.btn,fontSize:13,padding:"9px"}}
                    onClick={()=>{const updated=[...meals,{name:aiSuggestion.name,calories:aiSuggestion.cal,ingredients:"AI suggested meal",date:todayStr(),id:Date.now()}];setMeals(updated);save("nm_meals",updated);}}>
                    + Log this meal
                  </button>
                </div>
              )}
            </div>

            {/* Meal tips by calorie budget */}
            <div style={S.card}>
              <div style={S.cardTitle}>💡 Smart picks for today</div>
              <div style={{color:"#6b9e6b",fontSize:12,marginBottom:12}}>Meals under {Math.round(remaining)} kcal that fit your budget</div>
              {COMPLETE_MEALS.filter(m=>m.cal<=remaining).slice(0,5).map(m=>(
                <div key={m.name} style={{...S.mealRowSmall,alignItems:"center"}}>
                  <span style={{fontSize:18,marginRight:8}}>{m.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{color:"#d0ead0",fontSize:13}}>{m.name}</div>
                    <div style={{color:"#3a5a3a",fontSize:10}}>{m.cat} · {m.time}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{color:"#6ee7b7",fontSize:13,fontWeight:700}}>{m.cal} kcal</span>
                    <button style={S.logSmallBtn} onClick={()=>logMealFromDB(m)}>+ Log</button>
                  </div>
                </div>
              ))}
              {COMPLETE_MEALS.filter(m=>m.cal<=remaining).length===0&&
                <div style={{color:"#3a5a3a",textAlign:"center",fontSize:13}}>You've hit your calorie goal for today! 🎉</div>}
            </div>
          </>}

          {/* ── PROGRESS ── */}
          {tab==="progress"&&<>
            <div style={S.card}>
              <div style={S.cardTitle}>Log today's weight</div>
              <input style={S.input} type="number" placeholder="Your weight today (kg)" value={newWeight}
                onChange={e=>setNewWeight(e.target.value)}/>
              <button style={{...S.btn,marginTop:10}} onClick={logWeight} disabled={!newWeight}>Save</button>
            </div>
            {weightLog.length>1&&(
              <div style={S.card}>
                <div style={S.cardTitle}>Weight trend</div>
                <div style={{display:"flex",gap:3,alignItems:"flex-end",minHeight:120,padding:"0 0 4px"}}>
                  {weightLog.slice(-12).map((w,i,arr)=>{
                    const max=Math.max(...arr.map(x=>x.weight));
                    const min=Math.min(...arr.map(x=>x.weight));
                    const h=20+((w.weight-min)/(max-min||1))*90;
                    const isLowest=w.weight===Math.min(...arr.map(x=>x.weight));
                    return(
                      <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1,gap:3}}>
                        <div style={{color:"#86efac",fontSize:8}}>{w.weight}</div>
                        <div style={{width:"80%",height:h,background:isLowest?"#4ade80":"#166534",borderRadius:"3px 3px 0 0"}}/>
                        <div style={{color:"#4a6a4a",fontSize:7,transform:"rotate(-40deg)",transformOrigin:"center",whiteSpace:"nowrap"}}>{w.date.slice(5)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div style={S.journeyRow}>
              <JCard icon="🏁" label="Start" val={`${profile.weight} kg`} col="#a5b4fc"/>
              <JCard icon="📍" label="Now" val={`${latestW} kg`} col="#6ee7b7"/>
              <JCard icon="🏆" label="Goal" val={`${profile.targetWeight} kg`} col="#fcd34d"/>
            </div>
            {lostSoFar>0&&<div style={{...S.card,textAlign:"center",border:"1px solid #4ade80"}}>
              <div style={{fontSize:22,marginBottom:4}}>🎉</div>
              <div style={{color:"#86efac",fontSize:16,fontWeight:700}}>Lost {lostSoFar} kg so far!</div>
              <div style={{color:"#6b9e6b",fontSize:12,marginTop:4}}>Keep going — {weeksLeft} weeks to goal</div>
            </div>}
            <div style={S.card}>
              <div style={S.cardTitle}>Your profile & calorie science</div>
              {[["Height",`${profile.height} cm`],["Starting weight",`${profile.weight} kg`],["Target weight",`${profile.targetWeight} kg`],
                ["BMI",`${bmi.toFixed(1)} (${bmiInfo.label})`],["BMR",`${Math.round(bmr)} kcal/day`],
                ["TDEE (sedentary)",`${Math.round(tdee)} kcal/day`],["Daily goal",`${dailyGoal} kcal/day`],
                ["Daily deficit","500 kcal → 1 kg/week"]].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #1e3a1e"}}>
                  <span style={{color:"#6b9e6b",fontSize:13}}>{l}</span>
                  <span style={{color:"#f0faf0",fontSize:13,fontWeight:600}}>{v}</span>
                </div>
              ))}
              <div style={{background:"#0a150a",borderRadius:10,padding:12,color:"#6b9e6b",fontSize:12,lineHeight:1.7,marginTop:12}}>
                At 1 kg/week you'll reach {profile.targetWeight} kg in ~{weeksLeft} weeks — around <strong style={{color:"#a5b4fc"}}>{new Date(Date.now()+weeksLeft*7*86400000).toLocaleDateString("en-AU",{month:"long",year:"numeric"})}</strong>. You've got this! 💪
              </div>
            </div>
          </>}

        </div>

        {/* Nav */}
        <div style={S.nav}>
          {TABS.map(t=>(
            <button key={t.id} style={{...S.navBtn,...(tab===t.id?S.navActive:{})}} onClick={()=>setTab(t.id)}>
              <span style={{fontSize:16}}>{t.icon}</span>
              <span style={{fontSize:9,marginTop:1}}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Small components ─────────────────────────────────────────────────────────
const StatRow=({label,val,color})=>(
  <div style={{marginBottom:10}}>
    <div style={{color:"#4a6a4a",fontSize:10,marginBottom:1}}>{label}</div>
    <div style={{color,fontWeight:700,fontSize:14}}>{val}</div>
  </div>
);
const JCard=({icon,label,val,col})=>(
  <div style={{flex:1,background:"#14290f",border:"1px solid #2d4a2d",borderRadius:12,padding:"12px 8px",textAlign:"center"}}>
    <div style={{fontSize:18,marginBottom:4}}>{icon}</div>
    <div style={{color:col,fontWeight:700,fontSize:14}}>{val}</div>
    <div style={{color:"#4a6a4a",fontSize:10,marginTop:2}}>{label}</div>
  </div>
);
const Tag=({color,children})=>(
  <span style={{background:"rgba(255,255,255,.07)",border:`1px solid ${color}44`,color,borderRadius:6,padding:"2px 7px",fontSize:10}}>{children}</span>
);
const MacroPill=({label,val})=>(
  <div style={{background:"#1a2e1a",borderRadius:8,padding:"5px 10px",textAlign:"center"}}>
    <div style={{color:"#6b9e6b",fontSize:10}}>{label}</div>
    <div style={{color:"#f0faf0",fontWeight:700,fontSize:13}}>{val}</div>
  </div>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const S={
  root:{minHeight:"100vh",background:"#080f08",display:"flex",justifyContent:"center",fontFamily:"'Georgia',serif"},
  splash:{color:"#6ee7b7",padding:40,fontFamily:"Georgia",fontSize:18},
  app:{width:"100%",maxWidth:430,background:"#0c160c",minHeight:"100vh",display:"flex",flexDirection:"column"},
  header:{padding:"16px 16px 12px",background:"linear-gradient(160deg,#112211,#1a2e1a)",borderBottom:"1px solid #1e3a1e",display:"flex",justifyContent:"space-between",alignItems:"center"},
  hi:{color:"#f0faf0",fontSize:17,fontWeight:700},
  headerSub:{color:"#4a7a4a",fontSize:10,marginTop:2},
  bmiChip:{background:"#0c160c",border:"1px solid #2d4a2d",borderRadius:20,padding:"4px 10px",fontSize:11},
  content:{flex:1,padding:"14px 14px 80px",overflowY:"auto"},
  nav:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"#080f08",borderTop:"1px solid #1e3a1e",display:"flex"},
  navBtn:{flex:1,background:"none",border:"none",padding:"9px 0 7px",cursor:"pointer",color:"#4a6a4a",display:"flex",flexDirection:"column",alignItems:"center",gap:1,fontFamily:"Georgia"},
  navActive:{background:"#112211",color:"#6ee7b7"},
  card:{background:"#112211",border:"1px solid #1e3a1e",borderRadius:16,padding:16,marginBottom:14},
  cardTitle:{color:"#6ee7b7",fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:12},
  ringRow:{display:"flex",gap:12,alignItems:"center"},
  journeyRow:{display:"flex",gap:10,marginBottom:14},
  mealRowSmall:{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #1e3a1e"},
  mealRow:{background:"#112211",border:"1px solid #1e3a1e",borderRadius:10,padding:"11px 12px",marginBottom:7,display:"flex",justifyContent:"space-between",alignItems:"flex-start"},
  totalBanner:{background:"#0a1a0a",borderRadius:10,padding:"10px 12px",color:"#d0ead0",fontSize:12,textAlign:"center",marginTop:4},
  // Logger
  dropdown:{position:"absolute",top:"100%",left:0,right:0,background:"#112211",border:"1px solid #2d4a2d",borderRadius:10,zIndex:50,maxHeight:250,overflowY:"auto"},
  dropItem:{display:"flex",gap:10,alignItems:"center",padding:"10px 12px",cursor:"pointer",borderBottom:"1px solid #1a2e1a"},
  ingCard:{background:"#112211",border:"1px solid #1e3a1e",borderRadius:14,padding:14,marginBottom:10},
  optBtn:{background:"#0a150a",border:"1px solid #1e3a1e",borderRadius:20,padding:"4px 10px",color:"#4a7a4a",cursor:"pointer",fontSize:11,fontFamily:"Georgia"},
  optActive:{background:"#166534",border:"1px solid #4ade80",color:"#f0faf0"},
  qtyBtn:{width:28,height:28,borderRadius:"50%",background:"#1a2e1a",border:"1px solid #2d4a2d",color:"#f0faf0",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"},
  // Meal DB
  catBtn:{background:"#112211",border:"1px solid #1e3a1e",borderRadius:20,padding:"5px 10px",color:"#4a7a4a",cursor:"pointer",fontSize:11,fontFamily:"Georgia"},
  catActive:{background:"#15803d",border:"1px solid #4ade80",color:"#f0faf0"},
  tagBtn:{background:"#112211",border:"1px solid #1e3a1e",borderRadius:20,padding:"3px 8px",color:"#4a7a4a",cursor:"pointer",fontSize:10,fontFamily:"Georgia"},
  tagActive:{background:"#166534",border:"1px solid #4ade80",color:"#f0faf0"},
  suggestCard:{background:"#112211",border:"1px solid #1e3a1e",borderRadius:14,padding:14,marginBottom:10},
  logSmallBtn:{background:"#15803d",border:"none",borderRadius:7,padding:"5px 9px",color:"#f0faf0",cursor:"pointer",fontSize:10,fontFamily:"Georgia",whiteSpace:"nowrap"},
  aiBox:{background:"linear-gradient(135deg,#0c1f0c,#142814)",border:"1px solid #2d5a2d",borderRadius:16,padding:16,marginBottom:14},
  // Onboarding
  onboard:{width:"100%",maxWidth:430,padding:"32px 24px",margin:"0 auto"},
  onboardTitle:{color:"#f0faf0",fontSize:28,fontWeight:700,textAlign:"center",margin:"8px 0 4px"},
  onboardSub:{color:"#4a7a4a",fontSize:13,textAlign:"center",marginBottom:28},
  fields:{display:"flex",flexDirection:"column",gap:14,marginBottom:24},
  fieldLabel:{color:"#6ee7b7",fontSize:11,textTransform:"uppercase",letterSpacing:.5,marginBottom:4},
  input:{background:"#080f08",border:"1px solid #1e3a1e",borderRadius:10,padding:"11px 14px",color:"#f0faf0",fontSize:14,fontFamily:"Georgia",outline:"none",width:"100%",boxSizing:"border-box"},
  toggle:{display:"flex",gap:10},
  toggleBtn:{flex:1,background:"#112211",border:"1px solid #1e3a1e",borderRadius:10,padding:10,color:"#4a7a4a",cursor:"pointer",fontFamily:"Georgia",fontSize:14},
  toggleActive:{background:"#15803d",border:"1px solid #4ade80",color:"#f0faf0"},
  btn:{background:"#15803d",border:"none",borderRadius:10,padding:"12px",color:"#f0faf0",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"Georgia",width:"100%"},
};
