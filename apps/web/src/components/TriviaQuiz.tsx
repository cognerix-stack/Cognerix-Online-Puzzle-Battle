import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HelpCircle, Clock, Award, AlertTriangle, PlayCircle } from 'lucide-react';
import { PuzzleType } from '@puzzle-verse/shared';
import { useGame } from '../context/GameContext';
import { translate } from '../utils/translations';

interface TriviaQuizProps {
  onClose?: (isQuit?: boolean) => void;
  onProgress?: (progress: number, correctAnswers?: number) => void;
  onGameWin?: (puzzleType: PuzzleType, timeInSec: number, score: number, correctAnswersCount: number) => void;
  seed?: string;
  isOnline?: boolean;
  room?: any;
  headerActions?: React.ReactNode;
}

interface Question {
  question: string;
  options: string[];
  answerIndex: number;
  category: 'current_affairs' | 'computer' | 'math' | 'science' | 'geography' | 'history';
}

const QUESTION_POOL: Question[] = [
  // 🛰️ Current Affairs
  {
    question: "Which country officially launched the world's first fully digital central bank currency (CBDC) named Sand Dollar?",
    options: ["Bahamas", "China", "Sweden", "Marshall Islands"],
    answerIndex: 0,
    category: "current_affairs"
  },
  {
    question: "As of recent climate agreements, which country is the world's largest producer of solar energy components?",
    options: ["United States", "China", "Germany", "India"],
    answerIndex: 1,
    category: "current_affairs"
  },
  {
    question: "Which international organization hosted the AI for Good Global Summit to discuss artificial intelligence ethics?",
    options: ["ITU (International Telecommunication Union)", "UNESCO", "World Economic Forum", "OECD"],
    answerIndex: 0,
    category: "current_affairs"
  },
  {
    question: "Which space agency launched the James Webb Space Telescope to replace Hubble?",
    options: ["NASA", "ESA", "Roscosmos", "CNSA"],
    answerIndex: 0,
    category: "current_affairs"
  },
  {
    question: "Which global agreement aims to limit global warming to well below 2, preferably to 1.5 degrees Celsius?",
    options: ["Kyoto Protocol", "Paris Agreement", "Copenhagen Accord", "Montreal Protocol"],
    answerIndex: 1,
    category: "current_affairs"
  },
  {
    question: "Which European country officially adopted the Euro as its currency on January 1, 2023?",
    options: ["Croatia", "Bulgaria", "Romania", "Slovenia"],
    answerIndex: 0,
    category: "current_affairs"
  },
  {
    question: "Which nation hosted the COP28 UN Climate Change Conference in 2023?",
    options: ["United Arab Emirates", "Egypt", "United Kingdom", "Saudi Arabia"],
    answerIndex: 0,
    category: "current_affairs"
  },
  {
    question: "Which company developed the generative AI model known as Gemini?",
    options: ["Google", "OpenAI", "Microsoft", "Meta"],
    answerIndex: 0,
    category: "current_affairs"
  },
  {
    question: "Who was elected as the Prime Minister of the United Kingdom in July 2024?",
    options: ["Keir Starmer", "Rishi Sunak", "Boris Johnson", "Liz Truss"],
    answerIndex: 0,
    category: "current_affairs"
  },
  {
    question: "Which country is the newest member to officially join NATO in March 2024?",
    options: ["Sweden", "Finland", "Ukraine", "Georgia"],
    answerIndex: 0,
    category: "current_affairs"
  },
  {
    question: "Which country hosted the 2024 Summer Olympic Games?",
    options: ["France", "Japan", "United States", "Australia"],
    answerIndex: 0,
    category: "current_affairs"
  },
  {
    question: "What is the name of the NASA mission aiming to land the next humans on the Moon?",
    options: ["Artemis", "Apollo II", "Orion", "Gateway"],
    answerIndex: 0,
    category: "current_affairs"
  },
  {
    question: "Which African country recently declared the completion of the Grand Ethiopian Renaissance Dam (GERD) reservoir filling?",
    options: ["Ethiopia", "Egypt", "Sudan", "Kenya"],
    answerIndex: 0,
    category: "current_affairs"
  },
  {
    question: "Which country became the first to land a spacecraft near the south pole of the Moon in 2023?",
    options: ["India", "Russia", "United States", "China"],
    answerIndex: 0,
    category: "current_affairs"
  },
  {
    question: "Which global organization officially declared the end of the COVID-19 global health emergency in May 2023?",
    options: ["World Health Organization", "United Nations", "CDC", "Red Cross"],
    answerIndex: 0,
    category: "current_affairs"
  },

  // 💻 Computer
  {
    question: "Which data structure operates on a Last In, First Out (LIFO) basis?",
    options: ["Queue", "Stack", "Binary Tree", "Heap"],
    answerIndex: 1,
    category: "computer"
  },
  {
    question: "What is the time complexity of searching a sorted array using Binary Search?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    answerIndex: 1,
    category: "computer"
  },
  {
    question: "Which protocol is primarily used to securely transfer files over a network connection?",
    options: ["SFTP", "HTTP", "SMTP", "UDP"],
    answerIndex: 0,
    category: "computer"
  },
  {
    question: "In database systems, what does the 'A' in ACID stand for?",
    options: ["Availability", "Atomicity", "Authority", "Algorithm"],
    answerIndex: 1,
    category: "computer"
  },
  {
    question: "Which programming language was originally designed by Brendan Eich in just 10 days?",
    options: ["Python", "Java", "JavaScript", "C++"],
    answerIndex: 2,
    category: "computer"
  },
  {
    question: "What does HTTP stand for in web browsing?",
    options: ["Hypertext Transfer Protocol", "High Transfer Text Protocol", "Hyper Transfer Text Protocol", "Home Tool Transfer Protocol"],
    answerIndex: 0,
    category: "computer"
  },
  {
    question: "Which CSS property is used to control the text size?",
    options: ["font-size", "text-size", "font-style", "size"],
    answerIndex: 0,
    category: "computer"
  },
  {
    question: "What is the standard port number for secure web traffic (HTTPS)?",
    options: ["443", "80", "8080", "22"],
    answerIndex: 0,
    category: "computer"
  },
  {
    question: "Which SQL keyword is used to sort the result-set in descending or ascending order?",
    options: ["ORDER BY", "SORT BY", "GROUP BY", "ARRANGE BY"],
    answerIndex: 0,
    category: "computer"
  },
  {
    question: "In Git, which command is used to record changes to the local repository?",
    options: ["git commit", "git push", "git save", "git add"],
    answerIndex: 0,
    category: "computer"
  },
  {
    question: "Which sorting algorithm has the best-case time complexity of O(n) when the array is already sorted?",
    options: ["Bubble Sort", "Quick Sort", "Merge Sort", "Selection Sort"],
    answerIndex: 0,
    category: "computer"
  },
  {
    question: "What is the main purpose of DNS in networking?",
    options: ["Translate domain names to IP addresses", "Secure network connections", "Manage database queries", "Route local data packets"],
    answerIndex: 0,
    category: "computer"
  },
  {
    question: "Which HTML5 element is used to display graphics or drawings on the fly via scripting?",
    options: ["canvas", "svg", "draw", "art"],
    answerIndex: 0,
    category: "computer"
  },
  {
    question: "In computer memory, how many bits make up one single byte?",
    options: ["8", "16", "32", "64"],
    answerIndex: 0,
    category: "computer"
  },
  {
    question: "Which of the following is a non-relational (NoSQL) database?",
    options: ["MongoDB", "MySQL", "PostgreSQL", "SQLite"],
    answerIndex: 0,
    category: "computer"
  },

  // 📐 Math
  {
    question: "What is the sum of angles in a convex hexagon?",
    options: ["360 degrees", "540 degrees", "720 degrees", "900 degrees"],
    answerIndex: 2,
    category: "math"
  },
  {
    question: "If a fair coin is flipped 3 times, what is the probability of getting exactly 2 heads?",
    options: ["1/4", "3/8", "1/2", "5/8"],
    answerIndex: 1,
    category: "math"
  },
  {
    question: "What is the next prime number after 31?",
    options: ["33", "35", "37", "39"],
    answerIndex: 2,
    category: "math"
  },
  {
    question: "Solve for x: 3x - 7 = 5x + 9.",
    options: ["x = -8", "x = 8", "x = -1", "x = 1"],
    answerIndex: 0,
    category: "math"
  },
  {
    question: "What is the mathematical term for a line segment that joins two points on a curve?",
    options: ["Secant", "Tangent", "Chord", "Radius"],
    answerIndex: 2,
    category: "math"
  },
  {
    question: "What is the value of Pi (π) rounded to four decimal places?",
    options: ["3.1416", "3.1415", "3.1420", "3.1412"],
    answerIndex: 0,
    category: "math"
  },
  {
    question: "What is the derivative of x^2 with respect to x?",
    options: ["2x", "x", "2", "x^2"],
    answerIndex: 0,
    category: "math"
  },
  {
    question: "What is the square root of 225?",
    options: ["15", "13", "25", "17"],
    answerIndex: 0,
    category: "math"
  },
  {
    question: "In a right-angled triangle, if the legs are 6 cm and 8 cm, what is the length of the hypotenuse?",
    options: ["10 cm", "12 cm", "14 cm", "9 cm"],
    answerIndex: 0,
    category: "math"
  },
  {
    question: "What is the formula for the area of a circle with radius r?",
    options: ["πr^2", "2πr", "πd", "2πr^2"],
    answerIndex: 0,
    category: "math"
  },
  {
    question: "If f(x) = 2x + 5, what is the value of f(3)?",
    options: ["11", "8", "13", "10"],
    answerIndex: 0,
    category: "math"
  },
  {
    question: "What is the value of log10(1000)?",
    options: ["3", "2", "4", "10"],
    answerIndex: 0,
    category: "math"
  },
  {
    question: "What is the value of 5 factorial (5!)?",
    options: ["120", "60", "24", "100"],
    answerIndex: 0,
    category: "math"
  },
  {
    question: "What is the Roman numeral for 90?",
    options: ["XC", "XL", "LX", "CX"],
    answerIndex: 0,
    category: "math"
  },
  {
    question: "What is the sum of the first 10 positive integers?",
    options: ["55", "50", "45", "60"],
    answerIndex: 0,
    category: "math"
  },

  // 🔬 Science
  {
    question: "What is the most abundant gas in Earth's atmosphere?",
    options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Argon"],
    answerIndex: 1,
    category: "science"
  },
  {
    question: "Which subatomic particle carries a negative electrical charge?",
    options: ["Proton", "Neutron", "Electron", "Quark"],
    answerIndex: 2,
    category: "science"
  },
  {
    question: "What is the approximate speed of light in a vacuum?",
    options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"],
    answerIndex: 0,
    category: "science"
  },
  {
    question: "Which organ in the human body is responsible for producing insulin?",
    options: ["Liver", "Pancreas", "Kidney", "Gallbladder"],
    answerIndex: 1,
    category: "science"
  },
  {
    question: "What is the chemical symbol for Gold?",
    options: ["Ag", "Au", "Fe", "Gd"],
    answerIndex: 1,
    category: "science"
  },
  {
    question: "Which planet in our solar system is known as the Red Planet?",
    options: ["Mars", "Venus", "Jupiter", "Mercury"],
    answerIndex: 0,
    category: "science"
  },
  {
    question: "What is the boiling point of water in Celsius at standard atmospheric pressure?",
    options: ["100 degrees C", "0 degrees C", "50 degrees C", "212 degrees C"],
    answerIndex: 0,
    category: "science"
  },
  {
    question: "Which light color has the longest wavelength in the visible spectrum?",
    options: ["Red", "Blue", "Violet", "Green"],
    answerIndex: 0,
    category: "science"
  },
  {
    question: "What is the primary unit of heredity in living organisms?",
    options: ["Gene", "Cell", "Chromosome", "Protein"],
    answerIndex: 0,
    category: "science"
  },
  {
    question: "What is the force that pulls objects toward the center of the Earth?",
    options: ["Gravity", "Friction", "Magnetism", "Inertia"],
    answerIndex: 0,
    category: "science"
  },
  {
    question: "What is the chemical formula for common table salt?",
    options: ["NaCl", "HCl", "NaOH", "H2O"],
    answerIndex: 0,
    category: "science"
  },
  {
    question: "Which vitamin is synthesized in the human skin when exposed to sunlight?",
    options: ["Vitamin D", "Vitamin C", "Vitamin A", "Vitamin B12"],
    answerIndex: 0,
    category: "science"
  },
  {
    question: "What is the study of plants called?",
    options: ["Botany", "Zoology", "Mycology", "Ecology"],
    answerIndex: 0,
    category: "science"
  },
  {
    question: "Which gas do plants absorb from the atmosphere for photosynthesis?",
    options: ["Carbon Dioxide", "Oxygen", "Nitrogen", "Hydrogen"],
    answerIndex: 0,
    category: "science"
  },
  {
    question: "Which celestial body is at the center of our solar system?",
    options: ["The Sun", "Earth", "The Moon", "Milky Way"],
    answerIndex: 0,
    category: "science"
  },

  // 🗺️ Geography
  {
    question: "Which is the largest ocean on Earth by surface area?",
    options: ["Atlantic Ocean", "Indian Ocean", "Southern Ocean", "Pacific Ocean"],
    answerIndex: 3,
    category: "geography"
  },
  {
    question: "What is the capital city of Australia?",
    options: ["Sydney", "Melbourne", "Canberra", "Brisbane"],
    answerIndex: 2,
    category: "geography"
  },
  {
    question: "Which river is the longest in the world?",
    options: ["Amazon River", "Nile River", "Yangtze River", "Mississippi River"],
    answerIndex: 1,
    category: "geography"
  },
  {
    question: "Which mountain is the tallest in the world above sea level?",
    options: ["K2", "Mount Kilimanjaro", "Mount Everest", "Mount Fuji"],
    answerIndex: 2,
    category: "geography"
  },
  {
    question: "Which country has the most natural lakes in the world?",
    options: ["Canada", "United States", "Brazil", "Russia"],
    answerIndex: 0,
    category: "geography"
  },
  {
    question: "What is the capital of Japan?",
    options: ["Tokyo", "Kyoto", "Osaka", "Seoul"],
    answerIndex: 0,
    category: "geography"
  },
  {
    question: "Which is the smallest country in the world by land area?",
    options: ["Vatican City", "Monaco", "San Marino", "Liechtenstein"],
    answerIndex: 0,
    category: "geography"
  },
  {
    question: "In which country is the famous historic landmark Machu Picchu located?",
    options: ["Peru", "Chile", "Colombia", "Mexico"],
    answerIndex: 0,
    category: "geography"
  },
  {
    question: "Which desert is the largest hot desert in the world?",
    options: ["Sahara Desert", "Gobi Desert", "Kalahari Desert", "Atacama Desert"],
    answerIndex: 0,
    category: "geography"
  },
  {
    question: "Which country shares the longest international land border with the United States?",
    options: ["Canada", "Mexico", "Russia", "Cuba"],
    answerIndex: 0,
    category: "geography"
  },
  {
    question: "What is the capital city of Canada?",
    options: ["Ottawa", "Toronto", "Vancouver", "Montreal"],
    answerIndex: 0,
    category: "geography"
  },
  {
    question: "Which island is the largest island in the world?",
    options: ["Greenland", "New Guinea", "Borneo", "Madagascar"],
    answerIndex: 0,
    category: "geography"
  },
  {
    question: "Through which country does the Equator NOT pass?",
    options: ["Egypt", "Ecuador", "Kenya", "Indonesia"],
    answerIndex: 0,
    category: "geography"
  },
  {
    question: "Which European city is built on a series of 118 small islands separated by canals?",
    options: ["Venice", "Amsterdam", "Bruges", "Stockholm"],
    answerIndex: 0,
    category: "geography"
  },
  {
    question: "Which is the most populous country in Africa?",
    options: ["Nigeria", "Egypt", "Ethiopia", "South Africa"],
    answerIndex: 0,
    category: "geography"
  },

  // 🏛️ History
  {
    question: "In which year did the Titanic sink during its voyage?",
    options: ["1908", "1912", "1915", "1920"],
    answerIndex: 1,
    category: "history"
  },
  {
    question: "Who was the first President of the United States?",
    options: ["Thomas Jefferson", "Abraham Lincoln", "George Washington", "John Adams"],
    answerIndex: 2,
    category: "history"
  },
  {
    question: "Which ancient civilization built the Colosseum in Rome?",
    options: ["Ancient Greeks", "Ancient Egyptians", "Ancient Romans", "Persians"],
    answerIndex: 2,
    category: "history"
  },
  {
    question: "In which century did the Black Death bubonic plague ravage Europe?",
    options: ["12th Century", "13th Century", "14th Century", "15th Century"],
    answerIndex: 2,
    category: "history"
  },
  {
    question: "Who was the prime minister of the United Kingdom during most of World War II?",
    options: ["Neville Chamberlain", "Winston Churchill", "Clement Attlee", "Anthony Eden"],
    answerIndex: 1,
    category: "history"
  },
  {
    question: "Who was the first female Prime Minister of the United Kingdom?",
    options: ["Margaret Thatcher", "Theresa May", "Angela Merkel", "Indira Gandhi"],
    answerIndex: 0,
    category: "history"
  },
  {
    question: "In which year did World War I end?",
    options: ["1918", "1914", "1939", "1945"],
    answerIndex: 0,
    category: "history"
  },
  {
    question: "Which French military leader crowned himself Emperor of the French in 1804?",
    options: ["Napoleon Bonaparte", "Louis XIV", "Charles de Gaulle", "Charlemagne"],
    answerIndex: 0,
    category: "history"
  },
  {
    question: "Who was the main author of the United States Declaration of Independence?",
    options: ["Thomas Jefferson", "Benjamin Franklin", "John Adams", "George Washington"],
    answerIndex: 0,
    category: "history"
  },
  {
    question: "The fall of which wall in 1989 symbolized the approaching end of the Cold War?",
    options: ["Berlin Wall", "Great Wall of China", "Western Wall", "Hadrian's Wall"],
    answerIndex: 0,
    category: "history"
  },
  {
    question: "In which year did Christopher Columbus first land in the Americas?",
    options: ["1492", "1488", "1502", "1517"],
    answerIndex: 0,
    category: "history"
  },
  {
    question: "Who was the civil rights leader famous for his 'I Have a Dream' speech in 1963?",
    options: ["Martin Luther King Jr.", "Malcolm X", "Nelson Mandela", "Rosa Parks"],
    answerIndex: 0,
    category: "history"
  },
  {
    question: "Which treaty officially ended World War I in 1919?",
    options: ["Treaty of Versailles", "Treaty of Paris", "Treaty of Ghent", "Treaty of Utrecht"],
    answerIndex: 0,
    category: "history"
  },
  {
    question: "Which empire was ruled by Julius Caesar?",
    options: ["Roman Empire", "Greek Empire", "Ottoman Empire", "Persian Empire"],
    answerIndex: 0,
    category: "history"
  },
  {
    question: "Which pilot made the first solo non-stop flight across the Atlantic Ocean in 1927?",
    options: ["Charles Lindbergh", "Amelia Earhart", "Wright Brothers", "Chuck Yeager"],
    answerIndex: 0,
    category: "history"
  }
];

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return function() {
    let t = h += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function decodeHTMLEntities(text: string): string {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
}

interface TriviaQuizProps {
  onClose?: (isQuit?: boolean) => void;
  onProgress?: (progress: number, correctAnswers?: number) => void;
  onGameWin?: (puzzleType: PuzzleType, timeInSec: number, score: number, correctAnswersCount: number) => void;
  seed?: string;
  isOnline?: boolean;
  room?: any;
  headerActions?: React.ReactNode;
  onPlaySound?: (type: 'click' | 'success' | 'fail' | 'correct') => void;
}

interface Question {
  question: string;
  options: string[];
  answerIndex: number;
  category: 'current_affairs' | 'computer' | 'math' | 'science' | 'geography' | 'history';
}

function getOpenTdbCategoryId(cat: string): number | null {
  switch (cat) {
    case 'current_affairs': return 9; // General Knowledge
    case 'computer': return 18; // Science: Computers
    case 'math': return 19; // Science: Mathematics
    case 'science': return 17; // Science & Nature
    case 'geography': return 22; // Geography
    case 'history': return 23; // History
    default: return null; // Mixed
  }
}

export const TriviaQuiz: React.FC<TriviaQuizProps> = ({ onClose, onProgress, onGameWin, seed, isOnline, room: _room, headerActions, onPlaySound }) => {
  const { recordGameWin, language } = useGame();
  const t = (key: string) => translate(key, language);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(15); // 15 seconds per question
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('mixed');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pauseTimer, setPauseTimer] = useState<number>(-1);

  useEffect(() => {
    if (isOnline && _room) {
      const handleStateChange = (state: any) => {
        if (state && state.triviaPauseTimerLeft !== undefined) {
          setPauseTimer(state.triviaPauseTimerLeft);
        }
      };
      _room.onStateChange(handleStateChange);
      if (_room.state && _room.state.triviaPauseTimerLeft !== undefined) {
        setPauseTimer(_room.state.triviaPauseTimerLeft);
      }
    }
  }, [isOnline, _room]);

  const startQuiz = async () => {
    setIsLoading(true);
    if (isOnline && _room) {
      _room.send("puzzle_started");
    }
    
    // We fetch from web OpenTDB API for practice & bot matches
    if (!isOnline) {
      try {
        const catId = getOpenTdbCategoryId(selectedCategory);
        const url = `https://opentdb.com/api.php?amount=5&type=multiple${catId ? `&category=${catId}` : ''}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('API request failed');
        
        const data = await response.json();
        if (data.response_code === 0 && data.results && data.results.length >= 5) {
          const apiQuestions = data.results.map((res: any) => {
            const decodedQuestion = decodeHTMLEntities(res.question);
            const correctOpt = decodeHTMLEntities(res.correct_answer);
            const incorrectOpts = res.incorrect_answers.map(decodeHTMLEntities);
            
            const allOpts = [correctOpt, ...incorrectOpts];
            // Shuffle choices locally
            const shuffledOpts = [...allOpts].sort(() => 0.5 - Math.random());
            const correctIndex = shuffledOpts.indexOf(correctOpt);
            
            return {
              question: decodedQuestion,
              options: shuffledOpts,
              answerIndex: correctIndex === -1 ? 0 : correctIndex,
              category: selectedCategory
            };
          });
          
          setQuestions(apiQuestions);
          setCurrentIndex(0);
          setSelectedOption(null);
          setIsAnswered(false);
          setTimeLeft(15);
          setCorrectAnswers(0);
          setScore(0);
          setIsPlaying(true);
          setShowResults(false);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Failed fetching from OpenTDB, falling back to local pool:", err);
      }
    }

    // Fallback or Seeded Local Pool (for online duels and offline fallbacks)
    let pool = [...QUESTION_POOL];
    if (selectedCategory !== 'mixed') {
      pool = pool.filter(q => q.category === selectedCategory);
    }
    if (pool.length < 5) {
      pool = [...QUESTION_POOL];
    }

    // Seeded random shuffle
    const matchSeed = seed || Math.random().toString(36).substring(2, 10);
    const prng = seededRandom(matchSeed);
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }

    setQuestions(shuffled.slice(0, 5));
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeLeft(15);
    setCorrectAnswers(0);
    setScore(0);
    setIsPlaying(true);
    setShowResults(false);
    setIsLoading(false);
  };

  const handleNextQuestion = useCallback(() => {
    if (currentIndex < 4) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(15);
      if (onProgress) onProgress(Math.floor(((currentIndex + 1) / 5) * 100), correctAnswers);
    } else {
      setIsPlaying(false);
      setShowResults(true);
      if (correctAnswers >= 3) {
        onPlaySound?.('success');
      } else {
        onPlaySound?.('fail');
      }
      // Log win
      if (onGameWin) {
        onGameWin(PuzzleType.EIGHT_BALL_QUIZ, 60, score, correctAnswers);
      } else {
        recordGameWin(PuzzleType.EIGHT_BALL_QUIZ, 60, score);
      }
      if (onProgress) onProgress(100, correctAnswers);
    }
  }, [currentIndex, score, recordGameWin, onProgress, onGameWin, correctAnswers, onPlaySound]);

  // Timer Effect
  useEffect(() => {
    if (isPlaying && !isAnswered && !showResults) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsAnswered(true);
            setSelectedOption(-1); // Timed out
            onPlaySound?.('fail');
            setTimeout(handleNextQuestion, 2000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isAnswered, showResults, handleNextQuestion, onPlaySound]);

  const selectOption = (optIndex: number) => {
    if (isAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);
    
    setSelectedOption(optIndex);
    setIsAnswered(true);
    
    const isCorrect = optIndex === questions[currentIndex].answerIndex;
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      // Score increases by 50 pts base plus remaining time bonus (x5)
      setScore(prev => prev + 50 + timeLeft * 5);
      onPlaySound?.('correct');
    } else {
      onPlaySound?.('fail');
    }

    // Auto proceed after 2 seconds
    setTimeout(handleNextQuestion, 2000);
  };

  const getOptionStyle = (optIndex: number) => {
    if (!isAnswered) {
      return selectedOption === optIndex 
        ? { borderColor: 'var(--color-primary)', background: 'rgba(139,92,246,0.1)' }
        : {};
    }

    const currentQuestion = questions[currentIndex];
    if (optIndex === currentQuestion.answerIndex) {
      return { borderColor: 'var(--color-success)', background: 'rgba(16,185,129,0.15)', color: isLight ? 'var(--color-success)' : '#fff', fontWeight: 'bold' };
    }
    if (optIndex === selectedOption) {
      return { borderColor: 'var(--color-danger)', background: 'rgba(239,68,68,0.15)', color: isLight ? 'var(--color-danger)' : '#fff', fontWeight: 'bold' };
    }
    return { opacity: 0.5 };
  };

  const isLight = document.documentElement.classList.contains('light-theme');

  return (
    <div className="glass-panel animate-fade-in" style={{ maxWidth: '550px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      {!isPlaying && !showResults ? (
        // Start screen
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '24px 10px', textAlign: 'center' }}>
          {isOnline && pauseTimer > 0 && (
            <div style={{
              width: '100%',
              maxWidth: '360px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              padding: '12px',
              color: '#ef4444',
              fontSize: '13px',
              fontWeight: 'bold',
              textAlign: 'center',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.2)',
              marginBottom: '10px'
            }}>
              {t('match_active_warning').split('{time}')[0]}
              <span style={{ fontSize: '18px', color: '#ff3333' }}>{pauseTimer}</span>
              {t('match_active_warning').split('{time}')[1]}
            </div>
          )}
          <div style={{ padding: '16px', borderRadius: '50%', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', boxShadow: 'var(--glow-secondary)' }}>
            <HelpCircle size={44} color="var(--color-secondary)" />
          </div>
          <div>
            <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {t('trivia_name')}
              {headerActions}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '360px', marginTop: '6px' }}>
              {t('trivia_desc')}
            </p>
          </div>

          <div style={{ width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left', margin: '4px 0' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '0.5px' }}>{t('select_category_label')}</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="btn btn-glass"
              style={{ width: '100%', padding: '10px 14px', background: isLight ? '#ffffff' : 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-glass)', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}
            >
              <option value="mixed">🌌 {t('mixed_categories')}</option>
              <option value="current_affairs">🛰️ {t('current_affairs')}</option>
              <option value="computer">💻 {t('computer_science')}</option>
              <option value="math">📐 {t('mathematics')}</option>
              <option value="science">🔬 {t('science_nature')}</option>
              <option value="geography">🗺️ {t('geography_earth')}</option>
              <option value="history">🏛️ {t('history_culture')}</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '280px' }}>
            <button className="btn btn-primary" onClick={startQuiz} disabled={isLoading} style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}>
              {isLoading ? (
                <>⏳ {t('fetching_web')}</>
              ) : (
                <><PlayCircle size={18} /> {t('start_duel')}</>
              )}
            </button>
            {onClose && !isOnline && (
              <button className="btn btn-glass" onClick={() => onClose(true)} disabled={isLoading} style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                {t('cancel')}
              </button>
            )}
          </div>
        </div>
      ) : isPlaying && questions.length > 0 ? (
        // Quiz Screen
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              {t('question_count').split('{count}')[0]}
              <strong style={{ color: 'var(--color-primary)', marginLeft: '3px', marginRight: '3px' }}>{currentIndex + 1}</strong>
              {t('question_count').split('{count}')[1].replace('{total}', '5')}
              {headerActions}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
              <Clock size={16} color="var(--color-secondary)" />
              <span style={{ color: timeLeft <= 5 ? 'var(--color-danger)' : 'var(--text-secondary)', fontWeight: 'bold' }}>
                {timeLeft}s
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${(timeLeft / 15) * 100}%`, 
                background: timeLeft <= 5 ? 'var(--color-danger)' : 'linear-gradient(to right, var(--color-secondary), var(--color-primary))',
                transition: 'width 1s linear'
              }}
            />
          </div>

          <div style={{ margin: '10px 0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', lineHeight: '1.5', color: 'var(--text-primary)' }}>
              {questions[currentIndex].question}
            </h3>
          </div>

          {/* Options grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {questions[currentIndex].options.map((opt, optIdx) => (
              <button
                key={optIdx}
                className="btn btn-glass"
                disabled={isAnswered}
                style={{
                  justifyContent: 'flex-start',
                  padding: '14px 18px',
                  fontSize: '15px',
                  width: '100%',
                  textAlign: 'left',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.2s ease',
                  ...getOptionStyle(optIdx)
                }}
                onClick={() => selectOption(optIdx)}
              >
                <span style={{ 
                  marginRight: '12px', 
                  fontSize: '13px', 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '1px solid var(--border-glass)'
                }}>
                  {String.fromCharCode(65 + optIdx)}
                </span>
                {opt}
              </button>
            ))}
          </div>

          {selectedOption === -1 && (
            <div style={{ color: 'var(--color-danger)', fontSize: '14px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <AlertTriangle size={16} /> Time is up! Moving to next question.
            </div>
          )}

          {onClose && !isOnline && (
            <button 
              className="btn btn-glass" 
              style={{ width: '100%', padding: '12px', marginTop: '16px' }} 
              onClick={() => onClose(true)}
            >
              Close Board
            </button>
          )}
        </>
      ) : (
        // Results screen
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '24px 10px', textAlign: 'center' }}>
          <div style={{ padding: '20px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)', animation: 'float 3s ease-in-out infinite' }}>
            <Award size={48} color="var(--color-success)" />
          </div>
          <div>
            <h2 style={{ fontSize: '24px', color: 'var(--color-success)', fontFamily: 'var(--font-display)' }}>
              Duel Completed!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '6px' }}>
              You got <strong style={{ color: 'var(--text-primary)' }}>{correctAnswers} / 5</strong> correct answers.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '24px', background: 'rgba(255,255,255,0.02)', padding: '12px 24px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>FINAL SCORE</span>
              <h4 style={{ fontSize: '24px', color: 'var(--color-secondary)', fontFamily: 'var(--font-display)' }}>{score}</h4>
            </div>
            <div style={{ width: '1px', background: 'var(--border-glass)' }} />
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>REWARDS</span>
              <h4 style={{ fontSize: '24px', color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}>+{Math.floor(score / 5)} XP</h4>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '320px', marginTop: '10px' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={startQuiz}>
              Duel Again
            </button>
            {onClose && (
              <button className="btn btn-glass" style={{ flex: 1 }} onClick={() => onClose(false)}>
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TriviaQuiz;
