import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  UserProfile, 
  PlayerStats, 
  PuzzleType, 
  RankName, 
  StoreItem, 
  LeaderboardEntry, 
  Tournament 
} from '@puzzle-verse/shared';
import { BACKEND_HTTP_URL } from '../services/multiplayer';

interface GameContextType {
  userProfile: UserProfile;
  leaderboard: LeaderboardEntry[];
  tournaments: Tournament[];
  storeItems: StoreItem[];
  isProfileLoaded: boolean;
  saveProfile: (updated: UserProfile) => void;
  getLastLocalMutationTime: () => number;
  activeEntranceAnimation: string;
  triggerEntranceAnimation: (animation: string) => void;
  recordGameWin: (puzzleType: PuzzleType, timeInSec: number, score: number, customCoins?: number, customGems?: number, customXp?: number) => void;
  recordGamePlay: (puzzleType: PuzzleType) => void;
  resetProfileStats: () => void;
  resetEntireAccount: () => void;
  buyStoreItem: (itemId: string) => { success: boolean; error?: string };
  equipCosmetic: (itemId: string, type: 'NAME_COLOR' | 'BADGE' | 'LOBBY_ANIMATION') => void;
  updateStatus: (status: string) => void;
  updateAvatarAndFrame: (avatar: string, frame: string) => void;
  buyAvatarOrFrame: (itemId: string, costCoins: number, costGems: number, equipAvatar?: string, equipFrame?: string) => { success: boolean; error?: string };
  refreshTournaments: () => void;
  spendGems: (amount: number) => boolean;
  changeUsername: (newUsername: string, paymentType: 'coins' | 'gems') => { success: boolean; error?: string };
  loginUser: (id: string, username: string, email?: string, existingProfile?: UserProfile) => void;
  logoutUser: () => void;
  refreshLeaderboard: () => Promise<void>;
  language: string;
  setLanguage: (lang: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Initial store items
const INITIAL_STORE_ITEMS: StoreItem[] = [
  // --- NAME COLORS ---
  {
    id: 'nc_violet',
    name: 'Electric Violet Name',
    description: 'Vibrant neon purple name in lobby and leaderboards.',
    costCoins: 250,
    costGems: 0,
    type: 'NAME_COLOR',
    value: '#a78bfa'
  },
  {
    id: 'nc_amber',
    name: 'Golden Amber Name',
    description: 'Prestigious golden amber name highlighting your style.',
    costCoins: 400,
    costGems: 5,
    type: 'NAME_COLOR',
    value: '#fbbf24'
  },
  {
    id: 'nc_cyan',
    name: 'Neon Cyan Name',
    description: 'Cool blue cybernetic name styling.',
    costCoins: 250,
    costGems: 0,
    type: 'NAME_COLOR',
    value: '#22d3ee'
  },
  {
    id: 'nc_pink',
    name: 'Hot Pink Name',
    description: 'Flares of hot pink for a stylish player name.',
    costCoins: 300,
    costGems: 2,
    type: 'NAME_COLOR',
    value: '#f472b6'
  },
  {
    id: 'nc_emerald',
    name: 'Imperial Emerald Name',
    description: 'Exquisite neon emerald green color reserved for top strategists.',
    costCoins: 1200,
    costGems: 20,
    type: 'NAME_COLOR',
    value: '#10b981'
  },
  {
    id: 'nc_crimson',
    name: 'Crimson Inferno Name',
    description: 'Fiery crimson red styling that commands attention in lobbies.',
    costCoins: 2500,
    costGems: 40,
    type: 'NAME_COLOR',
    value: '#ef4444'
  },
  {
    id: 'nc_gold',
    name: 'Solar Flare Gold Name',
    description: 'Pure radiant gold name styling reflecting ultimate mastery.',
    costCoins: 4500,
    costGems: 75,
    type: 'NAME_COLOR',
    value: '#f59e0b'
  },
  {
    id: 'nc_cosmic',
    name: 'Cosmic Void Name',
    description: 'Mystical ultra-deep violet for legend-tier puzzle solvers.',
    costCoins: 7500,
    costGems: 120,
    type: 'NAME_COLOR',
    value: '#8b5cf6'
  },

  // --- ANIMATED NAME EFFECTS ---
  {
    id: 'nc_fx_fire',
    name: 'Fire Blaze Name Animation',
    description: 'Animated molten fire flickering style with radiant heat aura.',
    costCoins: 3500,
    costGems: 60,
    type: 'NAME_COLOR',
    value: 'name-fx-fire'
  },
  {
    id: 'nc_fx_lightning',
    name: 'Lightning Bolt Name Animation',
    description: 'Electric high-voltage cyan lightning flash with electric sparks.',
    costCoins: 4500,
    costGems: 80,
    type: 'NAME_COLOR',
    value: 'name-fx-lightning'
  },
  {
    id: 'nc_fx_rainbow',
    name: 'Rainbow Spectrum Name Animation',
    description: 'Continuous smooth rainbow gradient flow cycling across your name.',
    costCoins: 6000,
    costGems: 100,
    type: 'NAME_COLOR',
    value: 'name-fx-rainbow'
  },
  {
    id: 'nc_fx_gold',
    name: 'Royal Gold Shimmer Name Animation',
    description: 'Metallic gold background sweep with a bright glinting highlight.',
    costCoins: 8000,
    costGems: 140,
    type: 'NAME_COLOR',
    value: 'name-fx-gold'
  },
  {
    id: 'nc_fx_cosmic',
    name: 'Cosmic Void Name Animation',
    description: 'Deep cosmic galaxy void with pulsating star dust aura.',
    costCoins: 10000,
    costGems: 180,
    type: 'NAME_COLOR',
    value: 'name-fx-cosmic'
  },
  {
    id: 'nc_fx_ice',
    name: 'Frost Glacial Name Animation',
    description: 'Icy diamond blue freeze effect with glowing frosted crystal reflections.',
    costCoins: 4000,
    costGems: 70,
    type: 'NAME_COLOR',
    value: 'name-fx-ice'
  },
  {
    id: 'nc_fx_glitch',
    name: 'Cyber Toxic Glitch Name Animation',
    description: 'Acidic neon green cyber-glitch animation with rapid high-tech jitter.',
    costCoins: 5500,
    costGems: 95,
    type: 'NAME_COLOR',
    value: 'name-fx-glitch'
  },
  {
    id: 'nc_fx_neon_pink',
    name: 'Synthwave Neon Pink FX',
    description: 'Vibrant synthwave hot pink neon glow that pulses with bright aura.',
    costCoins: 3000,
    costGems: 50,
    type: 'NAME_COLOR',
    value: 'name-fx-neon-pink'
  },

  // --- BADGES ---
  {
    id: 'badge_speed',
    name: 'Speed Demon Badge',
    description: 'Show off your fast solving speeds with this badge.',
    costCoins: 150,
    costGems: 0,
    type: 'BADGE',
    value: '⚡'
  },
  {
    id: 'badge_master',
    name: 'Puzzle Master Badge',
    description: 'A glowing crown for true logical masterminds.',
    costCoins: 500,
    costGems: 10,
    type: 'BADGE',
    value: '👑'
  },
  {
    id: 'badge_vip',
    name: 'VIP Club Badge',
    description: 'Exclusive ticket proving your VIP status in the Verse.',
    costCoins: 0,
    costGems: 25,
    type: 'BADGE',
    value: '🎟️'
  },
  {
    id: 'badge_trophy',
    name: 'Grandmaster Trophy Badge',
    description: 'Golden trophy badge showcasing elite competitive victories.',
    costCoins: 1500,
    costGems: 30,
    type: 'BADGE',
    value: '🏆'
  },
  {
    id: 'badge_phoenix',
    name: 'Phoenix Flame Badge',
    description: 'Blazing phoenix flame signifying unstoppable win streaks.',
    costCoins: 3000,
    costGems: 50,
    type: 'BADGE',
    value: '🔥'
  },
  {
    id: 'badge_star',
    name: 'Diamond Star Badge',
    description: 'Shining diamond star badge for high-ranking Verse champions.',
    costCoins: 5000,
    costGems: 90,
    type: 'BADGE',
    value: '⭐'
  },
  {
    id: 'badge_dragon',
    name: 'Mystic Dragon Badge',
    description: 'Mythic dragon badge awarded to masterminds of logic.',
    costCoins: 8500,
    costGems: 150,
    type: 'BADGE',
    value: '🐉'
  },

  // --- LOBBY ANIMATIONS ---
  {
    id: 'anim_float_entrance',
    name: 'Floating Cloud Entrance',
    description: 'Subtle levitation entrance animation.',
    costCoins: 300,
    costGems: 0,
    type: 'LOBBY_ANIMATION',
    value: 'animate-entrance-float'
  },
  {
    id: 'anim_vip_entrance',
    name: 'VIP Rainbow Glow Entrance',
    description: 'A spectacular VIP entrance animation whenever you open a panel.',
    costCoins: 800,
    costGems: 15,
    type: 'LOBBY_ANIMATION',
    value: 'animate-entrance-vip'
  },
  {
    id: 'anim_cyber_pulse',
    name: 'Cyber Pulse Entrance',
    description: 'Futuristic neon cybernetic pulse grid entrance animation.',
    costCoins: 2000,
    costGems: 35,
    type: 'LOBBY_ANIMATION',
    value: 'animate-entrance-cyber'
  },
  {
    id: 'anim_supernova',
    name: 'Supernova Flare Entrance',
    description: 'Radiant star explosion entrance lighting up panel openings.',
    costCoins: 4500,
    costGems: 80,
    type: 'LOBBY_ANIMATION',
    value: 'animate-entrance-supernova'
  },
  {
    id: 'anim_vortex',
    name: 'Shadow Vortex Entrance',
    description: 'Dark cosmic portal entrance animation for supreme prestige.',
    costCoins: 9500,
    costGems: 160,
    type: 'LOBBY_ANIMATION',
    value: 'animate-entrance-vortex'
  }
];

// Initial leaderboard entries
const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { userId: 'bot1', username: 'SpeedRunner99', rank: RankName.LEGEND, score: 980, puzzleType: 'GLOBAL' },
  { userId: 'bot2', username: 'LogicWizard', rank: RankName.GRANDMASTER, score: 850, puzzleType: 'GLOBAL' },
  { userId: 'bot3', username: 'GridMaster', rank: RankName.MASTER, score: 710, puzzleType: 'GLOBAL' },
  { userId: 'bot4', username: 'SudokuSlayer', rank: RankName.DIAMOND, score: 620, puzzleType: 'GLOBAL' },
  { userId: 'bot5', username: 'ViteFast', rank: RankName.PLATINUM, score: 550, puzzleType: 'GLOBAL' },
  { userId: 'bot1', username: 'SpeedRunner99', rank: RankName.LEGEND, score: 32, puzzleType: PuzzleType.SLIDING },
  { userId: 'bot3', username: 'GridMaster', rank: RankName.MASTER, score: 54, puzzleType: PuzzleType.SLIDING },
  { userId: 'bot2', username: 'LogicWizard', rank: RankName.GRANDMASTER, score: 180, puzzleType: PuzzleType.WORD },
  { userId: 'bot5', username: 'ViteFast', rank: RankName.PLATINUM, score: 240, puzzleType: PuzzleType.WORD },
  { userId: 'bot2', username: 'LogicWizard', rank: RankName.GRANDMASTER, score: 480, puzzleType: PuzzleType.EIGHT_BALL_QUIZ },
  { userId: 'bot4', username: 'SudokuSlayer', rank: RankName.DIAMOND, score: 350, puzzleType: PuzzleType.EIGHT_BALL_QUIZ }
];

// Initial active tournaments
const INITIAL_TOURNAMENTS = (): Tournament[] => {
  const now = new Date();
  const end1 = new Date(now.getTime() + 1000 * 60 * 60 * 2.5); // 2.5 hours
  const end2 = new Date(now.getTime() + 1000 * 60 * 60 * 24); // 24 hours
  const start3 = new Date(now.getTime() + 1000 * 60 * 60 * 4); // starts in 4 hours
  const end3 = new Date(start3.getTime() + 1000 * 60 * 60 * 12);

  return [
    {
      id: 'tour_sliding',
      title: 'Summer Sliding Speedrun',
      puzzleType: PuzzleType.SLIDING,
      startTime: now.toISOString(),
      endTime: end1.toISOString(),
      rewardCoins: 500,
      rewardGems: 10,
      playersCount: 42,
      status: 'ACTIVE'
    },
    {
      id: 'tour_word',
      title: 'Anagram Arena Cup',
      puzzleType: PuzzleType.WORD,
      startTime: now.toISOString(),
      endTime: end2.toISOString(),
      rewardCoins: 800,
      rewardGems: 15,
      playersCount: 128,
      status: 'ACTIVE'
    },
    {
      id: 'tour_logic',
      title: 'Trivia Logic Masters',
      puzzleType: PuzzleType.EIGHT_BALL_QUIZ,
      startTime: start3.toISOString(),
      endTime: end3.toISOString(),
      rewardCoins: 1200,
      rewardGems: 30,
      playersCount: 0,
      status: 'UPCOMING'
    }
  ];
};

const DEFAULT_STATS = (): PlayerStats => ({
  gamesPlayed: 0,
  gamesWon: 0,
  totalSolveTime: 0,
  highestStreak: 0,
  puzzleSpecificStats: {
    [PuzzleType.SLIDING]: { played: 0, solved: 0 },
    [PuzzleType.SUDOKU]: { played: 0, solved: 0 },
    [PuzzleType.WORD]: { played: 0, solved: 0 },
    [PuzzleType.LOGIC]: { played: 0, solved: 0 },
    [PuzzleType.JIGSAW]: { played: 0, solved: 0 },
    [PuzzleType.PHYSICS]: { played: 0, solved: 0 },
    [PuzzleType.EIGHT_BALL_QUIZ]: { played: 0, solved: 0 },
    [PuzzleType.BLOCK_BLUSTER]: { played: 0, solved: 0 },
    [PuzzleType.WORD_SEARCH]: { played: 0, solved: 0 },
    [PuzzleType.TOWER_BLOXX]: { played: 0, solved: 0 },
    [PuzzleType.MENTAL_MATH]: { played: 0, solved: 0 }
  }
});

const DEFAULT_PROFILE = (): UserProfile => {
  const randNum = Math.floor(100000000 + Math.random() * 900000000);
  const randNameNum = Math.floor(100 + Math.random() * 900);
  return {
    id: '90' + randNum,
    username: `PuzzleNovice_${randNameNum}`,
    level: 1,
    xp: 0,
    coins: 100,
    gems: 10,
    rank: RankName.BRONZE,
    nameColor: undefined,
    status: 'Ready to solve the universe.',
    lobbyEntranceAnimation: undefined,
    badges: [],
    inventory: [],
    avatar: '👤',
    frame: 'none',
    statistics: DEFAULT_STATS()
  };
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeEntranceAnimation, setActiveEntranceAnimation] = useState<string>('');
  const [language, setLanguageState] = useState<string>('English');
  const [isProfileLoaded, setIsProfileLoaded] = useState<boolean>(false);

  // Load language from local storage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('puzzle_verse_lang');
    if (savedLanguage) {
      // Map legacy lowercase options to capitalized correct names
      const normalized = savedLanguage.toLowerCase();
      if (normalized === 'english') setLanguageState('English');
      else if (normalized === 'spanish') setLanguageState('Spanish');
      else if (normalized === 'spanish(latine america)' || normalized === 'spanish (latin america)') setLanguageState('Spanish (Latin America)');
      else if (normalized === 'portuguese(brazil)' || normalized === 'portuguese (brazil)') setLanguageState('Portuguese (Brazil)');
      else if (normalized === 'portugues(portugul)' || normalized === 'portuguese (portugal)') setLanguageState('Portuguese (Portugal)');
      else if (normalized === 'france' || normalized === 'french') setLanguageState('French');
      else if (normalized === 'alemao' || normalized === 'german') setLanguageState('German');
      else if (normalized === 'italiano' || normalized === 'italian') setLanguageState('Italian');
      else if (normalized === 'neerlandes' || normalized === 'dutch') setLanguageState('Dutch');
      else if (normalized === 'indonesio' || normalized === 'indonesian') setLanguageState('Indonesian');
      else if (normalized === 'russo' || normalized === 'russian (russo)' || normalized === 'russian') setLanguageState('Russian');
      else if (normalized === 'turco' || normalized === 'turkish') setLanguageState('Turkish');
      else if (normalized === 'japones' || normalized === 'japanese') setLanguageState('Japanese');
      else if (normalized === 'coreano' || normalized === 'korean') setLanguageState('Korean');
      else if (normalized === 'mandarim' || normalized === 'chinese (simplified)') setLanguageState('Chinese (Simplified)');
      else if (normalized === 'mandarim(hong kong)' || normalized === 'chinese (traditional - hong kong)') setLanguageState('Chinese (Traditional - Hong Kong)');
      else if (normalized === 'romana' || normalized === 'romanian') setLanguageState('Romanian');
      else if (normalized === 'hindi') setLanguageState('Hindi');
      else setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('puzzle_verse_lang', lang);
  };

  // Load from local storage on mount
  useEffect(() => {
    const currentAuthUserId = localStorage.getItem('pv_auth_user_id');
    const cachedProfile = localStorage.getItem('puzzle_verse_profile');
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        if (currentAuthUserId && parsed.id !== currentAuthUserId) {
          localStorage.removeItem('puzzle_verse_profile');
        }
      } catch (e) {}
    }

    const savedProfile = localStorage.getItem('puzzle_verse_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        // Merge with DEFAULT_STATS in case structure changed
        if (!parsed.statistics) parsed.statistics = DEFAULT_STATS();
        if (!parsed.statistics.puzzleSpecificStats) parsed.statistics.puzzleSpecificStats = DEFAULT_STATS().puzzleSpecificStats;
        
        // Regenerate legacy ID formats to avoid collision in matchmaking and enforce purely numeric IDs
        let migrated = false;
        if (parsed.id === 'user_player_1' || parsed.id.startsWith('user_')) {
          parsed.id = '90' + Math.floor(100000000 + Math.random() * 900000000);
          parsed.username = `PuzzleNovice_${Math.floor(100 + Math.random() * 900)}`;
          migrated = true;
        } else if (parsed.id.startsWith('guest_')) {
          parsed.id = '20' + Math.floor(1000000000 + Math.random() * 9000000000);
          migrated = true;
        } else if (parsed.id.startsWith('google_')) {
          const email = parsed.email || '';
          const cleanEmail = email.trim().toLowerCase();
          let hash = 0;
          for (let i = 0; i < cleanEmail.length; i++) {
            const char = cleanEmail.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
          }
          parsed.id = '10' + Math.abs(hash);
          migrated = true;
        }
        if (migrated) {
          localStorage.setItem('puzzle_verse_profile', JSON.stringify(parsed));
        }
        setUserProfile(parsed);
      } catch (e) {
        console.error("Failed to parse saved user profile, resetting to default.", e);
        const newProfile = DEFAULT_PROFILE();
        localStorage.setItem('puzzle_verse_profile', JSON.stringify(newProfile));
        setUserProfile(newProfile);
      }
    } else {
      const newProfile = DEFAULT_PROFILE();
      localStorage.setItem('puzzle_verse_profile', JSON.stringify(newProfile));
      setUserProfile(newProfile);
    }

    const savedLeaderboard = localStorage.getItem('puzzle_verse_leaderboard');
    if (savedLeaderboard) {
      try {
        setLeaderboard(JSON.parse(savedLeaderboard));
      } catch {
        setLeaderboard(INITIAL_LEADERBOARD);
      }
    }

    setTournaments(INITIAL_TOURNAMENTS());
    setIsProfileLoaded(true);
  }, []);

  const lastLocalMutationTimeRef = useRef<number>(0);

  // Save profile helper
  const saveProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    localStorage.setItem('puzzle_verse_profile', JSON.stringify(updated));
    lastLocalMutationTimeRef.current = Date.now();
    
    // Sync profile cosmetics/username to local leaderboard
    const savedLeaderboard = localStorage.getItem('puzzle_verse_leaderboard');
    if (savedLeaderboard) {
      try {
        const board = JSON.parse(savedLeaderboard) as LeaderboardEntry[];
        const updatedBoard = board.map(entry => {
          if (entry.userId === updated.id) {
            return {
              ...entry,
              username: updated.username,
              rank: updated.rank,
              nameColor: updated.nameColor || undefined,
              badges: updated.badges ? updated.badges.join(',') : '',
              avatar: updated.avatar || '👤',
              frame: updated.frame || 'none'
            };
          }
          return entry;
        });
        setLeaderboard(updatedBoard);
        localStorage.setItem('puzzle_verse_leaderboard', JSON.stringify(updatedBoard));
      } catch (e) {
        console.error("Failed to sync profile changes with local leaderboard", e);
      }
    }
  };

  const saveLeaderboard = (updated: LeaderboardEntry[]) => {
    setLeaderboard(updated);
    localStorage.setItem('puzzle_verse_leaderboard', JSON.stringify(updated));
  };

  // Determine Rank Name based on levels
  const getRankFromLevel = (level: number): RankName => {
    if (level >= 30) return RankName.LEGEND;
    if (level >= 25) return RankName.GRANDMASTER;
    if (level >= 20) return RankName.MASTER;
    if (level >= 15) return RankName.DIAMOND;
    if (level >= 10) return RankName.PLATINUM;
    if (level >= 7) return RankName.GOLD;
    if (level >= 4) return RankName.SILVER;
    return RankName.BRONZE;
  };

  // Trigger entrance animation for display
  const triggerEntranceAnimation = (animationName: string) => {
    setActiveEntranceAnimation('');
    setTimeout(() => {
      setActiveEntranceAnimation(animationName);
    }, 50);
    // Clear the active temporary animation after it finishes playing (3 seconds)
    setTimeout(() => {
      setActiveEntranceAnimation('');
    }, 3050);
  };

  // Record a Win and grant rewards
  const recordGameWin = (
    puzzleType: PuzzleType, 
    timeInSec: number, 
    score: number,
    customCoins?: number,
    customGems?: number,
    customXp?: number
  ) => {
    const xpReward = customXp !== undefined ? customXp : Math.min(100, Math.max(10, Math.floor(score / 5)));
    const coinReward = customCoins !== undefined ? customCoins : Math.min(150, Math.max(10, Math.floor(score / 3)));
    const gemReward = customGems !== undefined ? customGems : 0;

    setUserProfile(prev => {
      const nextXP = prev.xp + xpReward;
      let nextLevel = prev.level;
      let nextCoins = prev.coins + coinReward;
      let nextGems = prev.gems + gemReward;

      const xpRequired = nextLevel * 100;
      let leveledUp = false;
      
      if (nextXP >= xpRequired) {
        nextLevel += 1;
        nextCoins += nextLevel * 50; // Level up coin bonus
        nextGems += 2;              // Level up gem bonus
        leveledUp = true;
      }

      const currentStats = prev.statistics || DEFAULT_STATS();
      const currentPuzzleStats = currentStats.puzzleSpecificStats[puzzleType] || { played: 0, solved: 0 };
      
      const updatedPuzzleStats = {
        ...currentPuzzleStats,
        solved: currentPuzzleStats.solved + 1,
        bestTime: currentPuzzleStats.bestTime ? Math.min(currentPuzzleStats.bestTime, timeInSec) : timeInSec,
        timeSpent: (currentPuzzleStats.timeSpent || 0) + timeInSec
      };

      const updatedStats: PlayerStats = {
        ...currentStats,
        gamesWon: currentStats.gamesWon + 1,
        totalSolveTime: currentStats.totalSolveTime + timeInSec,
        highestStreak: Math.max(currentStats.highestStreak, 1), // Simplistic streak tracking
        puzzleSpecificStats: {
          ...currentStats.puzzleSpecificStats,
          [puzzleType]: updatedPuzzleStats
        }
      };

      const nextProfile: UserProfile = {
        ...prev,
        level: nextLevel,
        xp: leveledUp ? nextXP - xpRequired : nextXP,
        coins: nextCoins,
        gems: nextGems,
        rank: getRankFromLevel(nextLevel),
        statistics: updatedStats
      };

      lastLocalMutationTimeRef.current = Date.now();
      localStorage.setItem('puzzle_verse_profile', JSON.stringify(nextProfile));

      // Save to Leaderboard

      const existingEntryIndex = leaderboard.findIndex(
        entry => entry.userId === prev.id && entry.puzzleType === puzzleType
      );

      let newLeaderboard = [...leaderboard];
      const currentScore = existingEntryIndex !== -1 ? leaderboard[existingEntryIndex].score : 0;
      const newScore = currentScore + score;

      const newEntry: LeaderboardEntry = {
        userId: nextProfile.id,
        username: nextProfile.username,
        rank: nextProfile.rank,
        score: newScore,
        puzzleType: puzzleType,
        avatar: nextProfile.avatar || '👤',
        frame: nextProfile.frame || 'none'
      };

      if (existingEntryIndex !== -1) {
        newLeaderboard[existingEntryIndex] = newEntry;
      } else {
        newLeaderboard.push(newEntry);
      }

      // Also update global score (sum of all puzzle best scores)
      const existingGlobalIndex = newLeaderboard.findIndex(
        entry => entry.userId === prev.id && entry.puzzleType === 'GLOBAL'
      );

      // Recalculate global score by summing all non-GLOBAL categories for this user
      const globalScore = newLeaderboard
        .filter(e => e.userId === prev.id && e.puzzleType !== 'GLOBAL')
        .reduce((sum: number, entry: LeaderboardEntry) => sum + entry.score, 0);

      const newGlobalEntry: LeaderboardEntry = {
        userId: nextProfile.id,
        username: nextProfile.username,
        rank: nextProfile.rank,
        score: globalScore,
        puzzleType: 'GLOBAL',
        avatar: nextProfile.avatar || '👤',
        frame: nextProfile.frame || 'none'
      };

      if (existingGlobalIndex !== -1) {
        newLeaderboard[existingGlobalIndex] = newGlobalEntry;
      } else {
        newLeaderboard.push(newGlobalEntry);
      }

      // Sort leaderboard desc
      newLeaderboard.sort((a, b) => b.score - a.score);
      saveLeaderboard(newLeaderboard);

      // Trigger animations if leveled up
      if (leveledUp) {
        triggerEntranceAnimation('animate-entrance-vip');
      }

      return nextProfile;
    });
  };

  // Record a Game Play (on game start)
  const recordGamePlay = (puzzleType: PuzzleType) => {
    setUserProfile(prev => {
      const currentStats = prev.statistics || DEFAULT_STATS();
      const currentPuzzleStats = currentStats.puzzleSpecificStats[puzzleType] || { played: 0, solved: 0 };
      
      const updatedPuzzleStats = {
        ...currentPuzzleStats,
        played: currentPuzzleStats.played + 1
      };

      const updatedStats: PlayerStats = {
        ...currentStats,
        gamesPlayed: currentStats.gamesPlayed + 1,
        puzzleSpecificStats: {
          ...currentStats.puzzleSpecificStats,
          [puzzleType]: updatedPuzzleStats
        }
      };

      const nextProfile: UserProfile = {
        ...prev,
        statistics: updatedStats
      };

      lastLocalMutationTimeRef.current = Date.now();
      localStorage.setItem('puzzle_verse_profile', JSON.stringify(nextProfile));
      return nextProfile;
    });
  };

  // Reset profile statistics only
  const resetProfileStats = () => {
    setUserProfile(prev => {
      const nextProfile: UserProfile = {
        ...prev,
        level: 1,
        xp: 0,
        rank: RankName.BRONZE,
        statistics: DEFAULT_STATS()
      };
      lastLocalMutationTimeRef.current = Date.now();
      localStorage.setItem('puzzle_verse_profile', JSON.stringify(nextProfile));
      return nextProfile;
    });
  };

  // Reset entire account to default
  const resetEntireAccount = () => {
    const nextProfile = DEFAULT_PROFILE();
    setUserProfile(nextProfile);
    lastLocalMutationTimeRef.current = Date.now();
    localStorage.setItem('puzzle_verse_profile', JSON.stringify(nextProfile));
  };

  // Buy a store item
  const buyStoreItem = (itemId: string): { success: boolean; error?: string } => {
    const item = INITIAL_STORE_ITEMS.find(i => i.id === itemId);
    if (!item) return { success: false, error: 'Item not found.' };

    if (userProfile.inventory.includes(itemId)) {
      return { success: false, error: 'You already own this item.' };
    }

    if (userProfile.coins < item.costCoins) {
      return { success: false, error: 'Insufficient coins.' };
    }

    if (userProfile.gems < item.costGems) {
      return { success: false, error: 'Insufficient gems.' };
    }

    const nextProfile: UserProfile = {
      ...userProfile,
      coins: userProfile.coins - item.costCoins,
      gems: userProfile.gems - item.costGems,
      inventory: [...userProfile.inventory, itemId]
    };

    saveProfile(nextProfile);
    return { success: true };
  };

  // Equip a cosmetic item
  const equipCosmetic = (itemId: string, type: 'NAME_COLOR' | 'BADGE' | 'LOBBY_ANIMATION') => {
    if (!userProfile.inventory.includes(itemId)) return;

    const item = INITIAL_STORE_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    let nextProfile: UserProfile = { ...userProfile };

    if (type === 'NAME_COLOR') {
      if (userProfile.nameColor === item.value) {
        nextProfile.nameColor = undefined; // Unequip (revert to default)
      } else {
        nextProfile.nameColor = item.value; // Equip
      }
    } else if (type === 'BADGE') {
      // Toggle badge
      const hasBadge = userProfile.badges.includes(item.value);
      if (hasBadge) {
        nextProfile.badges = userProfile.badges.filter(b => b !== item.value);
      } else {
        // limit to 3 badges displayed
        nextProfile.badges = [...userProfile.badges.slice(-2), item.value];
      }
    } else if (type === 'LOBBY_ANIMATION') {
      if (userProfile.lobbyEntranceAnimation === item.value) {
        nextProfile.lobbyEntranceAnimation = undefined; // Unequip (revert to default fade-in)
      } else {
        nextProfile.lobbyEntranceAnimation = item.value; // Equip
        triggerEntranceAnimation(item.value);
      }
    }

    saveProfile(nextProfile);
    
    // Update matching entries in Leaderboard so they show correct styles immediately
    const updatedLeaderboard = leaderboard.map(entry => {
      if (entry.userId === userProfile.id) {
        return {
          ...entry,
          // Since the leaderboard lists username and rank, styling is read from active profile variables
        };
      }
      return entry;
    });
    setLeaderboard(updatedLeaderboard);
  };

  // Update status message
  const updateStatus = (status: string) => {
    saveProfile({
      ...userProfile,
      status: status.slice(0, 100) // limit length
    });
  };

  const updateAvatarAndFrame = async (avatar: string, frame: string) => {
    saveProfile({
      ...userProfile,
      avatar,
      frame
    });

    if (userProfile.id.startsWith('10') || userProfile.id.startsWith('20')) {
      try {
        const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
        const token = btoa(JSON.stringify(payload));
        await fetch(`${BACKEND_HTTP_URL}/profile/avatar-frame`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ avatar, frame })
        });
      } catch (e) {
        console.error('Failed to sync avatar/frame to server:', e);
      }
    }
  };

  const buyAvatarOrFrame = (
    itemId: string, 
    costCoins: number, 
    costGems: number,
    equipAvatar?: string,
    equipFrame?: string
  ): { success: boolean; error?: string } => {
    if (userProfile.coins < costCoins) {
      return { success: false, error: `Insufficient coins. You need ${costCoins} coins.` };
    }
    if (userProfile.gems < costGems) {
      return { success: false, error: `Insufficient diamonds. You need ${costGems} diamonds.` };
    }
    if (userProfile.inventory.includes(itemId)) {
      return { success: true };
    }
    const nextProfile: UserProfile = {
      ...userProfile,
      coins: userProfile.coins - costCoins,
      gems: userProfile.gems - costGems,
      inventory: [...userProfile.inventory, itemId],
      avatar: equipAvatar !== undefined ? equipAvatar : userProfile.avatar,
      frame: equipFrame !== undefined ? equipFrame : userProfile.frame
    };
    saveProfile(nextProfile);
    return { success: true };
  };

  const changeUsername = (newUsername: string, paymentType: 'coins' | 'gems') => {
    if (!newUsername || newUsername.trim() === '') {
      return { success: false, error: 'Username cannot be empty.' };
    }
    if (newUsername.length > 20) {
      return { success: false, error: 'Username must be 20 characters or less.' };
    }

    const nextProfile = { ...userProfile };
    if (paymentType === 'coins') {
      if (nextProfile.coins < 650) {
        return { success: false, error: 'Insufficient coins. You need 650 coins.' };
      }
      nextProfile.coins -= 650;
    } else {
      if (nextProfile.gems < 150) {
        return { success: false, error: 'Insufficient diamonds. You need 150 diamonds.' };
      }
      nextProfile.gems -= 150;
    }

    nextProfile.username = newUsername.trim();
    saveProfile(nextProfile);

    // Update username in leaderboard entries so it syncs immediately
    const updatedLeaderboard = leaderboard.map(entry => {
      if (entry.userId === userProfile.id) {
        return {
          ...entry,
          username: newUsername.trim()
        };
      }
      return entry;
    });
    saveLeaderboard(updatedLeaderboard);

    return { success: true };
  };

  const spendGems = (amount: number): boolean => {
    if (userProfile.gems < amount) return false;
    const nextProfile = {
      ...userProfile,
      gems: userProfile.gems - amount
    };
    saveProfile(nextProfile);
    return true;
  };

  // Tick tournament timers/join simulations
  const refreshTournaments = () => {
    setTournaments(prev => {
      return prev.map(tour => {
        if (tour.status === 'ACTIVE') {
          // Simulate dynamic increase in players count
          const increase = Math.random() > 0.7 ? 1 : 0;
          return {
            ...tour,
            playersCount: tour.playersCount + increase
          };
        }
        return tour;
      });
    });
  };

  useEffect(() => {
    const interval = setInterval(refreshTournaments, 15000);
    return () => clearInterval(interval);
  }, []);

  const loginUser = (id: string, username: string, email?: string, existingProfile?: UserProfile) => {
    if (existingProfile) {
      const merged = {
        ...DEFAULT_PROFILE(),
        ...existingProfile,
        statistics: {
          ...DEFAULT_STATS(),
          ...(existingProfile.statistics || {}),
          puzzleSpecificStats: {
            ...DEFAULT_STATS().puzzleSpecificStats,
            ...((existingProfile.statistics && existingProfile.statistics.puzzleSpecificStats) || {})
          }
        }
      };
      saveProfile(merged);
    } else {
      const nextProfile = {
        ...DEFAULT_PROFILE(),
        id,
        username,
        email
      };
      saveProfile(nextProfile);
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('pv_auth_user_id');
    const newProfile = DEFAULT_PROFILE();
    saveProfile(newProfile);
  };

  const syncLocalScoresToServer = async (userId: string, username: string) => {
    if (!userId.startsWith('10') && !userId.startsWith('20')) return;
    try {
      const payload = { userId, username, exp: Date.now() + 1000 * 60 * 60 * 24 };
      const token = btoa(JSON.stringify(payload));

      // Always sync current avatar & frame to the server during score synchronization
      try {
        await fetch(`${BACKEND_HTTP_URL}/profile/avatar-frame`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            avatar: userProfile.avatar || '👤',
            frame: userProfile.frame || 'none'
          })
        });
      } catch (err) {
        console.error('Failed to sync avatar/frame on sync:', err);
      }

      // Find all non-GLOBAL entries in the local leaderboard for this user
      const userEntries = leaderboard.filter(
        e => e.userId === userId && e.puzzleType !== 'GLOBAL' && e.puzzleType
      );
      
      for (const entry of userEntries) {
        await fetch(`${BACKEND_HTTP_URL}/profile/win`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            puzzleType: entry.puzzleType,
            time: 60,
            score: entry.score,
            rank: userProfile.rank,
            avatar: userProfile.avatar || '👤',
            frame: userProfile.frame || 'none',
            nameColor: userProfile.nameColor || undefined,
            badges: userProfile.badges ? userProfile.badges.join(',') : undefined
          })
        });
      }
    } catch (e) {
      console.error('Failed to sync local scores to server:', e);
    }
  };

  const refreshLeaderboard = async () => {
    if (userProfile.id.startsWith('10') || userProfile.id.startsWith('20')) {
      await syncLocalScoresToServer(userProfile.id, userProfile.username);
    }
    try {
      const response = await fetch(`${BACKEND_HTTP_URL}/leaderboard/global`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          // Merge local higher scores with server scores so they never drop or flicker
          const merged = [...data];
          leaderboard.forEach(localEntry => {
            if (localEntry.userId === userProfile.id) {
              const serverEntryIdx = merged.findIndex(
                s => s.userId === localEntry.userId && s.puzzleType === localEntry.puzzleType
              );
              if (serverEntryIdx !== -1) {
                merged[serverEntryIdx] = {
                  ...merged[serverEntryIdx],
                  avatar: localEntry.avatar || merged[serverEntryIdx].avatar,
                  frame: localEntry.frame || merged[serverEntryIdx].frame,
                  score: Math.max(localEntry.score, merged[serverEntryIdx].score)
                };
              } else {
                merged.push(localEntry);
              }
            }
          });
          // Sort merged desc
          merged.sort((a, b) => b.score - a.score);
          setLeaderboard(merged);
        }
      }
    } catch (e) {
      // Fallback silently if offline
    }
  };

  // Periodic sync of global leaderboard from backend
  useEffect(() => {
    refreshLeaderboard();
    const interval = setInterval(refreshLeaderboard, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <GameContext.Provider value={{
      userProfile,
      leaderboard,
      tournaments,
      storeItems: INITIAL_STORE_ITEMS,
      isProfileLoaded,
      saveProfile,
      getLastLocalMutationTime: () => lastLocalMutationTimeRef.current,
      activeEntranceAnimation,
      triggerEntranceAnimation,
      recordGameWin,
      recordGamePlay,
      resetProfileStats,
      resetEntireAccount,
      buyStoreItem,
      equipCosmetic,
      updateStatus,
      updateAvatarAndFrame,
      buyAvatarOrFrame,
      refreshTournaments,
      spendGems,
      changeUsername,
      loginUser,
      logoutUser,
      refreshLeaderboard,
      language,
      setLanguage
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
