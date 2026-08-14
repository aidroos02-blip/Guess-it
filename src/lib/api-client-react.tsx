import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type CategorySummary = { id:string; label:string; icon:string; count:number; accent:string };
export type Question = { id:number; category:string; difficulty:'easy'|'medium'|'hard'; question:string; answers:string[]; correctAnswerIndex:number; explanation:string };
export type Game = { id:number; mode:'quick'|'daily'; category:string|null; questionIds:number[] };
export type GameResult = { id:number; score:number; correctAnswers:number; totalQuestions:number; accuracy:number; currentStreak:number; isNewBest:boolean; timeTaken:number };
export type LeaderboardEntry = { rank:number; name:string; avatar:string; score:number; isCurrentPlayer?:boolean };
export type Profile = { displayName:string; avatar:string; country:string; currentStreak:number; longestStreak:number; bestScore:number; totalGames:number; averageScore:number; darkMode:boolean; soundOn:boolean; musicOn:boolean; notificationsOn:boolean };

const categories:CategorySummary[]=[
 {id:'General Knowledge',label:'General Knowledge',icon:'spark',count:10,accent:'#ff7059'},
 {id:'Movies',label:'Movies',icon:'film',count:10,accent:'#b9dc5a'},
 {id:'Sports',label:'Sports',icon:'bolt',count:10,accent:'#35c8c1'},
 {id:'Music',label:'Music',icon:'music',count:10,accent:'#a78bfa'},
 {id:'India',label:'India',icon:'globe',count:10,accent:'#f2b84b'},
 {id:'Funny',label:'Funny',icon:'smile',count:10,accent:'#ff9d72'},
];
const q=(id:number,category:string,question:string,answers:string[],correctAnswerIndex:number,explanation:string,difficulty:'easy'|'medium'|'hard'='easy'):Question=>({id,category,question,answers,correctAnswerIndex,explanation,difficulty});
const questions:Question[]=[
 q(1,'General Knowledge','What is the largest planet in our solar system?',['Earth','Mars','Jupiter','Venus'],2,'Jupiter is the largest planet in our solar system.'),
 q(2,'General Knowledge','How many continents are there?',['5','6','7','8'],2,'There are seven continents.'),
 q(3,'General Knowledge','What is the chemical symbol for gold?',['Ag','Au','Gd','Go'],1,'Au comes from the Latin word aurum.'),
 q(4,'General Knowledge','Which ocean is the largest?',['Atlantic','Pacific','Indian','Arctic'],1,'The Pacific Ocean is the largest.'),
 q(5,'General Knowledge','What is the fastest land animal?',['Lion','Cheetah','Horse','Leopard'],1,'The cheetah is the fastest land animal.'),
 q(6,'General Knowledge','Which gas do plants absorb?',['Oxygen','Nitrogen','Carbon dioxide','Hydrogen'],2,'Plants absorb carbon dioxide during photosynthesis.'),
 q(7,'General Knowledge','How many sides does a hexagon have?',['5','6','7','8'],1,'A hexagon has six sides.'),
 q(8,'General Knowledge','What is H2O commonly called?',['Salt','Water','Oxygen','Hydrogen'],1,'H2O is water.'),
 q(9,'General Knowledge','Which instrument measures temperature?',['Barometer','Thermometer','Compass','Altimeter'],1,'A thermometer measures temperature.'),
 q(10,'General Knowledge','Which planet is known as the Red Planet?',['Mars','Saturn','Mercury','Neptune'],0,'Iron oxide gives Mars its reddish appearance.'),
 q(11,'Movies','Who directed the movie Titanic?',['James Cameron','Steven Spielberg','Christopher Nolan','Peter Jackson'],0,'James Cameron directed Titanic.'),
 q(12,'Movies','Which film features the character Jack Sparrow?',['Avatar','Pirates of the Caribbean','The Matrix','Gladiator'],1,'Jack Sparrow is the lead pirate in the Pirates of the Caribbean series.'),
 q(13,'Movies','Which movie won Best Picture at the 2020 Oscars?',['1917','Joker','Parasite','Ford v Ferrari'],2,'Parasite won Best Picture at the 92nd Academy Awards.'),
 q(14,'Movies','Who played Iron Man in the Marvel Cinematic Universe?',['Chris Evans','Robert Downey Jr.','Chris Hemsworth','Mark Ruffalo'],1,'Robert Downey Jr. portrayed Tony Stark/Iron Man.'),
 q(15,'Movies','Which movie is about a young wizard named Harry?',['The Hobbit','Harry Potter','Star Wars','Dune'],1,'Harry Potter follows the young wizard Harry.'),
 q(16,'Movies','Which film is set on the fictional planet Pandora?',['Avatar','Interstellar','Gravity','Tenet'],0,'Avatar is set largely on Pandora.'),
 q(17,'Movies','What is the name of the cowboy in Toy Story?',['Buzz','Woody','Andy','Rex'],1,'Woody is the cowboy sheriff.'),
 q(18,'Movies','Which series features the line “May the Force be with you”?',['Star Trek','Star Wars','Matrix','Alien'],1,'The phrase is associated with Star Wars.'),
 q(19,'Movies','Who played the Joker in The Dark Knight?',['Heath Ledger','Joaquin Phoenix','Jack Nicholson','Tom Hardy'],0,'Heath Ledger played the Joker in The Dark Knight.'),
 q(20,'Movies','Which movie features the song Let It Go?',['Frozen','Moana','Tangled','Encanto'],0,'Let It Go is from Disney’s Frozen.'),
 q(21,'Sports','How many players are on a soccer team on the field?',['9','10','11','12'],2,'A soccer team has eleven players on the field.'),
 q(22,'Sports','Which country won the 2011 Cricket World Cup?',['Australia','India','England','Sri Lanka'],1,'India won the 2011 Cricket World Cup.'),
 q(23,'Sports','How many rings are on the Olympic symbol?',['4','5','6','7'],1,'The Olympic symbol has five rings.'),
 q(24,'Sports','In which sport would you perform a slam dunk?',['Tennis','Basketball','Hockey','Golf'],1,'A slam dunk is a basketball move.'),
 q(25,'Sports','How long is a marathon?',['21.1 km','42.195 km','50 km','100 km'],1,'The standard marathon distance is 42.195 kilometres.'),
 q(26,'Sports','Which sport uses a shuttlecock?',['Badminton','Cricket','Squash','Baseball'],0,'Badminton is played with a shuttlecock.'),
 q(27,'Sports','How many Grand Slam tennis tournaments are there each year?',['2','3','4','5'],2,'There are four Grand Slam tournaments.'),
 q(28,'Sports','Which country is famous for sumo wrestling?',['China','Japan','Korea','Thailand'],1,'Sumo is Japan’s traditional national sport.'),
 q(29,'Sports','What color jersey is worn by the Tour de France leader?',['Green','Yellow','Red','Blue'],1,'The overall leader wears the yellow jersey.'),
 q(30,'Sports','How many points is a touchdown worth in American football before the extra point?',['3','5','6','7'],2,'A touchdown is worth six points.'),
 q(31,'Music','Who is known as the King of Pop?',['Elvis Presley','Michael Jackson','Prince','Bruno Mars'],1,'Michael Jackson is widely known as the King of Pop.'),
 q(32,'Music','Which instrument has black and white keys?',['Guitar','Piano','Violin','Flute'],1,'A piano has black and white keys.'),
 q(33,'Music','How many strings does a standard violin have?',['3','4','5','6'],1,'A standard violin has four strings.'),
 q(34,'Music','Which band recorded Bohemian Rhapsody?',['Queen','ABBA','Oasis','Coldplay'],0,'Bohemian Rhapsody was recorded by Queen.'),
 q(35,'Music','Which singer released the album 25?',['Adele','Taylor Swift','Rihanna','Beyonce'],0,'Adele released the album 25.'),
 q(36,'Music','Which musical symbol indicates silence?',['Clef','Rest','Sharp','Flat'],1,'A rest indicates a period of silence.'),
 q(37,'Music','Which instrument is commonly associated with six strings?',['Piano','Guitar','Trumpet','Drum'],1,'A standard guitar has six strings.'),
 q(38,'Music','Which genre originated in Jamaica?',['Reggae','Opera','Blues','Metal'],0,'Reggae developed in Jamaica.'),
 q(39,'Music','Who composed The Four Seasons?',['Mozart','Vivaldi','Bach','Beethoven'],1,'Antonio Vivaldi composed The Four Seasons.'),
 q(40,'Music','What is the highest female singing voice?',['Alto','Tenor','Soprano','Bass'],2,'Soprano is the highest standard female vocal range.'),
 q(41,'India','What is the capital of India?',['Mumbai','New Delhi','Kolkata','Chennai'],1,'New Delhi is the capital of India.'),
 q(42,'India','Which is the national animal of India?',['Lion','Tiger','Elephant','Peacock'],1,'The Bengal tiger is India’s national animal.'),
 q(43,'India','Which river is often called India’s national river?',['Yamuna','Ganga','Godavari','Narmada'],1,'The Ganga is designated as India’s national river.'),
 q(44,'India','What is the currency of India?',['Rupee','Taka','Ringgit','Yen'],0,'India uses the Indian rupee.'),
 q(45,'India','Which city is known as the Pink City?',['Jaipur','Pune','Surat','Mysuru'],0,'Jaipur is known as the Pink City.'),
 q(46,'India','Which festival is known as the festival of lights?',['Holi','Diwali','Eid','Onam'],1,'Diwali is widely known as the festival of lights.'),
 q(47,'India','Which monument is in Agra?',['Gateway of India','Taj Mahal','Charminar','India Gate'],1,'The Taj Mahal is in Agra.'),
 q(48,'India','Which Indian state is famous for tea plantations in the northeast?',['Assam','Goa','Punjab','Gujarat'],0,'Assam is famous for tea production.'),
 q(49,'India','What is India’s national flower?',['Rose','Lotus','Jasmine','Sunflower'],1,'The lotus is India’s national flower.'),
 q(50,'India','Which ocean lies south of India?',['Atlantic','Pacific','Indian','Arctic'],2,'India is bordered to the south by the Indian Ocean.'),
 q(51,'Funny','What do you call a bear with no teeth?',['A gummy bear','A sleepy bear','A soft bear','A toothless tiger'],0,'A classic joke: a gummy bear!'),
 q(52,'Funny','What has hands but cannot clap?',['A clock','A robot','A tree','A chair'],0,'A clock has hands but cannot clap.'),
 q(53,'Funny','What gets wetter the more it dries?',['A towel','A sponge','A cloud','A river'],0,'A towel gets wetter as it dries you.'),
 q(54,'Funny','What has a face and two hands but no arms or legs?',['A clock','A coin','A mirror','A book'],0,'Another classic riddle: a clock.'),
 q(55,'Funny','What kind of room has no doors or windows?',['A mushroom','A bedroom','A classroom','A restroom'],0,'A mushroom is a “room” with no doors or windows.'),
 q(56,'Funny','What can travel around the world while staying in one corner?',['A stamp','A plane','A postcard','A coin'],0,'A stamp stays in the corner of an envelope.'),
 q(57,'Funny','What has many teeth but cannot bite?',['A comb','A shark','A zipper','A fork'],0,'A comb has many teeth.'),
 q(58,'Funny','What has one eye but cannot see?',['A needle','A potato','A camera','A storm'],0,'A needle has an eye.'),
 q(59,'Funny','What goes up but never comes down?',['Rain','Your age','A balloon','Smoke'],1,'Your age goes up and never comes down.'),
 q(60,'Funny','What has a neck but no head?',['A shirt','A bottle','A guitar','All of these'],3,'A shirt, bottle and guitar can all have a neck.'),
];

const key='guess-it-local-v1';
const read=<T,>(k:string,f:T):T=>{try{const v=localStorage.getItem(`${key}:${k}`);return v?JSON.parse(v):f}catch{return f}};
const write=(k:string,v:unknown)=>localStorage.setItem(`${key}:${k}`,JSON.stringify(v));
const today=()=>new Date().toISOString().slice(0,10);
const shuffle=<T,>(a:T[])=>[...a].sort(()=>Math.random()-.5);
const profileDefault:Profile={displayName:'Player',avatar:'',country:'',currentStreak:0,longestStreak:0,bestScore:0,totalGames:0,averageScore:0,darkMode:false,soundOn:true,musicOn:false,notificationsOn:false};

export const getGetProfileQueryKey=()=>['profile'];
export const getListCategoriesQueryKey=()=>['categories'];
export const getListLeaderboardsQueryKey=(p?:unknown)=>['leaderboards',p];
export const getListQuestionsQueryKey=(p?:unknown)=>['questions',p];
export const getGetDailyChallengeQueryKey=()=>['daily'];

const hook=(key:any,fn:any,enabled=true)=>useQuery({queryKey:key,queryFn:fn,enabled});
export const useGetProfile=()=>hook(getGetProfileQueryKey(),async()=>read('profile',profileDefault));
export const useListCategories=()=>hook(getListCategoriesQueryKey(),async()=>categories);
export const useListQuestions=(params:any,opts:any={})=>hook(getListQuestionsQueryKey(params),async()=>{const cat=params?.category;const pool=cat?questions.filter(x=>x.category===cat):questions;return shuffle(pool).slice(0,10)},opts?.query?.enabled!==false);
export const useGetDailyChallenge=()=>hook(getGetDailyChallengeQueryKey(),async()=>{const seed=Array.from(today()).reduce((a,c)=>a+c.charCodeAt(0),0);const pool=questions.filter(x=>x.id%7!==seed%7);return {date:today(),questions:pool.slice(0,10)} });
export const useListLeaderboards=(params:any)=>hook(getListLeaderboardsQueryKey(params),async()=>{const scores=read<GameResult[]>('results',[]);const p=read<Profile>('profile',profileDefault);const own=scores.map(r=>({name:p.displayName||'Player',avatar:p.avatar,score:r.score,isCurrentPlayer:true}));const bots=[{name:'QuizFox',avatar:'Q',score:90},{name:'BrainSpark',avatar:'B',score:80},{name:'Fast Thinker',avatar:'F',score:70},{name:'TriviaAce',avatar:'T',score:60}];return [...own,...bots].sort((a,b)=>b.score-a.score).slice(0,10).map((x,i)=>({...x,rank:i+1}));});
export const useStartGame=()=>useMutation({mutationFn:async({data}:{data:{mode:'quick'|'daily';category?:string|null}})=>{const pool=data.mode==='daily'?questions:questions.filter(x=>!data.category||x.category===data.category);const game:Game={id:Date.now(),mode:data.mode,category:data.category??null,questionIds:shuffle(pool).slice(0,10).map(x=>x.id)};return game;}});
export const useCompleteGame=()=>{const qc=useQueryClient();return useMutation({mutationFn:async({gameId,data}:{gameId:number;data:any})=>{const p=read<Profile>('profile',profileDefault);const results=read<GameResult[]>('results',[]);const score=Number(data.score)||0;const isNewBest=score>p.bestScore;const nextStreak=score>=60?p.currentStreak+1:0;const result:GameResult={id:gameId,score,correctAnswers:data.correctAnswers,totalQuestions:data.totalQuestions,accuracy:Math.round(score),currentStreak:nextStreak,isNewBest,timeTaken:data.timeTaken};write('results',[...results,result]);write('profile',{...p,totalGames:p.totalGames+1,bestScore:Math.max(p.bestScore,score),averageScore:((p.averageScore*p.totalGames)+score)/(p.totalGames+1),currentStreak:nextStreak,longestStreak:Math.max(p.longestStreak,nextStreak)});return result;},onSuccess:()=>{qc.invalidateQueries()}})};
export const useUpdateProfile=()=>{const qc=useQueryClient();return useMutation({mutationFn:async({data}:{data:Partial<Profile>})=>{const next={...read('profile',profileDefault),...data};write('profile',next);return next;},onSuccess:(next)=>qc.setQueryData(getGetProfileQueryKey(),next)});};
export const useTrackAnalyticsEvent=()=>useMutation({mutationFn:async(data:any)=>{const events=read<any[]>('events',[]);write('events',[...events,{...data,timestamp:new Date().toISOString()}]);return true;}});
