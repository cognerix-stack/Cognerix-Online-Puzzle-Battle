import React, { useState, useEffect, useRef } from 'react';
import { 
  Gamepad2, User, ShoppingBag, Trophy, Smile, Settings as SettingsIcon, ShieldAlert,
  Coins, Gem, Award, Volume2, VolumeX, Info, Check, Menu, Mail, LogOut, RotateCw, Copy, Users, Star, UserPlus,
  Globe, FileText
} from 'lucide-react';
import { PuzzleType, RankName } from '@puzzle-verse/shared';
import { useGame } from './context/GameContext';
import { LANGUAGE_DISPLAY_NAMES, LANGUAGE_CONFIGS, translate } from './utils/translations';
import SlidingPuzzle from './components/SlidingPuzzle';
import TriviaQuiz from './components/TriviaQuiz';
import WordPuzzle from './components/WordPuzzle';
import SudokuPuzzle from './components/SudokuPuzzle';
import LogicPuzzle from './components/LogicPuzzle';
import JigsawPuzzle from './components/JigsawPuzzle';
import PhysicsPuzzle from './components/PhysicsPuzzle';
import BlockBluster from './components/BlockBluster';
import WordSearch from './components/WordSearch';
import TowerBloxx from './components/TowerBloxx';
import { MentalMathChallenge } from './components/MentalMathChallenge';
import { Room } from 'colyseus.js';
import { MultiplayerService, BACKEND_HTTP_URL, colyseusClient } from './services/multiplayer';
import { StorePopup } from './components/StorePopup';

const EMOJI_LIST = ["😊", "😂", "🤣", "😍", "😒", "👌", "😁", "👍", "🤦‍♀️", "🤦‍♂️", "🤷‍♀️", "🤷‍♂️", "✌️", "🤞", "😉", "😎", "😢", "😋", "😅", "😚", "😶", "😶‍🌫️", "🤐", "😫", "🥱", "😴", "🙄", "🤯", "😨", "👻", "🤖"];

const AVAILABLE_AVATARS = [
  { id: 'av_default', char: '👤', label: 'Default Client', costCoins: 0, costGems: 0 },
  { id: 'av_cyberfox', char: '🦊', label: 'Cyber Fox', costCoins: 100, costGems: 0 },
  { id: 'av_bot', char: '🤖', label: 'Logic Bot', costCoins: 100, costGems: 0 },
  { id: 'av_alien', char: '👾', label: 'Retro Alien', costCoins: 120, costGems: 0 },
  { id: 'av_cat', char: '🐱', label: 'Lucky Cat', costCoins: 80, costGems: 0 },
  { id: 'av_lion', char: '🦁', label: 'Puzzle Lion', costCoins: 150, costGems: 2 },
  { id: 'av_unicorn', char: '🦄', label: 'Magic Unicorn', costCoins: 200, costGems: 5 },
  { id: 'av_panda', char: '🐼', label: 'Zen Panda', costCoins: 150, costGems: 0 },
  { id: 'av_owl', char: '🦉', label: 'Wise Owl', costCoins: 120, costGems: 0 },
  { id: 'av_dragon', char: '🐉', label: 'Mythic Dragon', costCoins: 200, costGems: 10 },
  { id: 'av_ufo', char: '🛸', label: 'Cosmic UFO', costCoins: 180, costGems: 4 },
  { id: 'av_astro', char: '🚀', label: 'Astro Explorer', costCoins: 180, costGems: 3 },
  { id: 'av_brain', char: '🧠', label: 'Mega Brain', costCoins: 200, costGems: 8 },
  { id: 'av_diamond', char: '💎', label: 'Diamond Solver', costCoins: 200, costGems: 12 },
  { id: 'av_wizard', char: '🧙‍♂️', label: 'Anagram Wizard', costCoins: 160, costGems: 2 },
  { id: 'av_ninja', char: '🥷', label: 'Stealth Ninja', costCoins: 140, costGems: 2 },
  { id: 'av_bear', char: '🐻', label: 'Grizzly Bear', costCoins: 130, costGems: 0 },
  { id: 'av_koala', char: '🐨', label: 'Sleepy Koala', costCoins: 100, costGems: 0 },
  { id: 'av_tiger', char: '🐯', label: 'Jungle Tiger', costCoins: 150, costGems: 2 },
  { id: 'av_piggy', char: '🐷', label: 'Golden Piggy', costCoins: 90, costGems: 0 },
  { id: 'av_monkey', char: '🐵', label: 'Cheeky Monkey', costCoins: 100, costGems: 0 },
  { id: 'av_rooster', char: '🐔', label: 'Rooster Master', costCoins: 80, costGems: 0 },
  { id: 'av_penguin', char: '🐧', label: 'Chill Penguin', costCoins: 110, costGems: 0 },
  { id: 'av_eagle', char: '🦅', label: 'Sky Eagle', costCoins: 140, costGems: 1 },
  { id: 'av_duck', char: '🦆', label: 'Detective Duck', costCoins: 100, costGems: 0 },
  { id: 'av_bat', char: '🦇', label: 'Midnight Bat', costCoins: 130, costGems: 2 },
  { id: 'av_wolf', char: '🐺', label: 'Alpha Wolf', costCoins: 160, costGems: 3 },
  { id: 'av_boar', char: '🐗', label: 'Wild Boar', costCoins: 120, costGems: 0 },
  { id: 'av_horse', char: '🐴', label: 'Chess Knight', costCoins: 130, costGems: 0 },
  { id: 'av_bee', char: '🐝', label: 'Busy Bee', costCoins: 80, costGems: 0 },
  { id: 'av_spider', char: '🕷️', label: 'Web Crawler', costCoins: 150, costGems: 4 },
  { id: 'av_octopus', char: '🐙', label: 'Kraken Solver', costCoins: 180, costGems: 5 },
  { id: 'av_trex', char: '🦖', label: 'T-Rex Solver', costCoins: 200, costGems: 8 },
  { id: 'av_frog', char: '🐸', label: 'Hop Coder', costCoins: 90, costGems: 0 },
  { id: 'av_whale', char: '🐋', label: 'Ocean Whale', costCoins: 150, costGems: 2 },
  { id: 'av_cheetah', char: '🐆', label: 'Speed Cheetah', costCoins: 170, costGems: 3 },
  { id: 'av_dolphin', char: '🐬', label: 'Smart Dolphin', costCoins: 140, costGems: 1 },
  { id: 'av_sloth', char: '🦥', label: 'Lazy Sloth', costCoins: 100, costGems: 0 },
  { id: 'av_beaver', char: '🦫', label: 'Builder Beaver', costCoins: 120, costGems: 1 },
  { id: 'av_peacock', char: '🦚', label: 'Royal Peacock', costCoins: 160, costGems: 4 },
  { id: 'av_parrot', char: '🦜', label: 'Talkative Parrot', costCoins: 110, costGems: 0 },

  // --- NEW MASCOT ICONS ---
  { id: 'av_gm_king', char: '👑', label: 'Grandmaster King', costCoins: 500, costGems: 20 },
  { id: 'av_royal_emblem', char: '⚜️', label: 'Royal Emblem', costCoins: 600, costGems: 25 },
  { id: 'av_oni_warlord', char: '👹', label: 'Oni Warlord', costCoins: 700, costGems: 30 },
  { id: 'av_shadow_demon', char: '😈', label: 'Shadow Demon', costCoins: 750, costGems: 35 },
  { id: 'av_phantom_spirit', char: '👻', label: 'Phantom Spirit', costCoins: 650, costGems: 25 },
  { id: 'av_skull_conqueror', char: '☠️', label: 'Skull Conqueror', costCoins: 800, costGems: 40 },
  { id: 'av_phoenix_flame', char: '🔥', label: 'Phoenix Flame', costCoins: 900, costGems: 50 },
  { id: 'av_frost_guardian', char: '❄️', label: 'Frost Guardian', costCoins: 900, costGems: 50 },
  { id: 'av_lava_titan', char: '🌋', label: 'Lava Titan', costCoins: 1000, costGems: 60 },
  { id: 'av_storm_lord', char: '⚡', label: 'Storm Lord', costCoins: 1000, costGems: 60 },
  { id: 'av_moon_guardian', char: '🌙', label: 'Moon Guardian', costCoins: 850, costGems: 40 },
  { id: 'av_solar_champion', char: '☀️', label: 'Solar Champion', costCoins: 850, costGems: 40 },
  { id: 'av_galaxy_wanderer', char: '🌌', label: 'Galaxy Wanderer', costCoins: 1200, costGems: 80 },
  { id: 'av_planet_guardian', char: '🪐', label: 'Planet Guardian', costCoins: 1300, costGems: 90 },
  { id: 'av_cosmic_legend', char: '🌠', label: 'Cosmic Legend', costCoins: 1500, costGems: 100 },
  { id: 'av_celestial_dragon', char: '🐲', label: 'Celestial Dragon', costCoins: 2000, costGems: 150 },
  { id: 'av_golden_phoenix', char: '🦅', label: 'Golden Phoenix', costCoins: 2000, costGems: 150 },
  { id: 'av_divine_angel', char: '🪽', label: 'Divine Angel', costCoins: 2200, costGems: 180 },
  { id: 'av_heavenly_sage', char: '😇', label: 'Heavenly Sage', costCoins: 2500, costGems: 200 },
  { id: 'av_eternal_reaper', char: '💀', label: 'Eternal Reaper', costCoins: 2800, costGems: 220 },
  { id: 'av_all_seeing_eye', char: '👁️', label: 'All-Seeing Eye', costCoins: 3000, costGems: 250 },
  { id: 'av_arcane_oracle', char: '🔮', label: 'Arcane Oracle', costCoins: 3200, costGems: 275 },
  { id: 'av_starborn_hero', char: '🌟', label: 'Starborn Hero', costCoins: 3500, costGems: 300 },
  { id: 'av_chess_emperor', char: '♟️', label: 'Chess Emperor', costCoins: 4000, costGems: 350 },
  { id: 'av_puzzle_overlord', char: '🧩', label: 'Puzzle Overlord', costCoins: 4500, costGems: 400 },
  { id: 'av_pv_legend', char: '👑', label: 'Cognerix Legend', costCoins: 5000, costGems: 500 }
];

const AVAILABLE_FRAMES = [
  { id: 'none', label: 'No Frame', border: undefined, boxShadow: undefined, animation: undefined, costCoins: 0, costGems: 0 },
  
  // --- COMMON (50–150 Coins) ---
  { id: 'fr_forest_bloom', label: 'Forest Bloom', border: '3px solid #22c55e', boxShadow: '0 0 10px #22c55e', animation: undefined, costCoins: 50, costGems: 0 },
  { id: 'fr_aqua_ring', label: 'Aqua Ring', border: '3px solid #06b6d4', boxShadow: '0 0 10px #06b6d4', animation: undefined, costCoins: 60, costGems: 0 },
  { id: 'fr_arctic_glow', label: 'Arctic Glow', border: '3px solid #7dd3fc', boxShadow: '0 0 10px #7dd3fc', animation: undefined, costCoins: 70, costGems: 0 },
  { id: 'fr_moon_dust', label: 'Moon Dust', border: '3px solid #cbd5e1', boxShadow: '0 0 10px #cbd5e1', animation: undefined, costCoins: 80, costGems: 0 },
  { id: 'fr_coral_wave', label: 'Coral Wave', border: '3px solid #fb7185', boxShadow: '0 0 10px #fb7185', animation: undefined, costCoins: 90, costGems: 0 },
  { id: 'fr_emerald_edge', label: 'Emerald Edge', border: '3px solid #10b981', boxShadow: '0 0 10px #10b981', animation: undefined, costCoins: 100, costGems: 0 },
  { id: 'fr_golden_leaf', label: 'Golden Leaf', border: '3px solid #eab308', boxShadow: '0 0 10px #eab308', animation: undefined, costCoins: 110, costGems: 0 },
  { id: 'fr_blue_mist', label: 'Blue Mist', border: '3px solid #3b82f6', boxShadow: '0 0 10px #3b82f6', animation: undefined, costCoins: 120, costGems: 0 },
  { id: 'fr_crystal_ring', label: 'Crystal Ring', border: '3px double #a855f7', boxShadow: '0 0 10px #a855f7', animation: undefined, costCoins: 130, costGems: 0 },
  { id: 'fr_mystic_moss', label: 'Mystic Moss', border: '3px solid #84cc16', boxShadow: '0 0 10px #84cc16', animation: undefined, costCoins: 140, costGems: 0 },
  { id: 'fr_silver_pulse', label: 'Silver Pulse', border: '3px solid #94a3b8', boxShadow: '0 0 12px #94a3b8', animation: undefined, costCoins: 150, costGems: 0 },
  { id: 'fr_soft_aurora', label: 'Soft Aurora', border: '3px solid #38bdf8', boxShadow: '0 0 12px #c084fc', animation: undefined, costCoins: 150, costGems: 0 },

  // --- RARE (150–300 Coins + 1–5 💎) ---
  { id: 'fr_crimson_halo', label: 'Crimson Halo', border: '3px solid #ef4444', boxShadow: '0 0 14px #ef4444', animation: undefined, costCoins: 160, costGems: 1 },
  { id: 'fr_royal_violet', label: 'Royal Violet', border: '3px solid #8b5cf6', boxShadow: '0 0 14px #8b5cf6', animation: undefined, costCoins: 170, costGems: 1 },
  { id: 'fr_cyber_pulse', label: 'Cyber Pulse', border: '3px solid #06b6d4', boxShadow: '0 0 14px #06b6d4', animation: undefined, costCoins: 180, costGems: 2 },
  { id: 'fr_arctic_storm', label: 'Arctic Storm', border: '3px solid #38bdf8', boxShadow: '0 0 14px #0284c7', animation: undefined, costCoins: 190, costGems: 2 },
  { id: 'fr_inferno_ring', label: 'Inferno Ring', border: '3px solid #f97316', boxShadow: '0 0 14px #dc2626', animation: undefined, costCoins: 200, costGems: 2 },
  { id: 'fr_lunar_halo', label: 'Lunar Halo', border: '3px solid #e2e8f0', boxShadow: '0 0 14px #94a3b8', animation: undefined, costCoins: 210, costGems: 3 },
  { id: 'fr_emerald_spark', label: 'Emerald Spark', border: '3px dashed #10b981', boxShadow: '0 0 14px #059669', animation: undefined, costCoins: 220, costGems: 3 },
  { id: 'fr_sapphire_glow', label: 'Sapphire Glow', border: '3px solid #2563eb', boxShadow: '0 0 14px #1d4ed8', animation: undefined, costCoins: 230, costGems: 3 },
  { id: 'fr_storm_ring', label: 'Storm Ring', border: '3px solid #6366f1', boxShadow: '0 0 14px #4f46e5', animation: undefined, costCoins: 240, costGems: 4 },
  { id: 'fr_solar_eclipse', label: 'Solar Eclipse', border: '3px solid #f59e0b', boxShadow: '0 0 14px #d97706', animation: undefined, costCoins: 250, costGems: 4 },
  { id: 'fr_toxic_mist', label: 'Toxic Mist', border: '3px solid #84cc16', boxShadow: '0 0 14px #65a30d', animation: undefined, costCoins: 260, costGems: 4 },
  { id: 'fr_frozen_core', label: 'Frozen Core', border: '3px double #7dd3fc', boxShadow: '0 0 14px #0284c7', animation: undefined, costCoins: 270, costGems: 5 },
  { id: 'fr_neon_flash', label: 'Neon Flash', border: '3px solid #f43f5e', boxShadow: '0 0 16px #f43f5e', animation: undefined, costCoins: 280, costGems: 5 },
  { id: 'fr_electric_wave', label: 'Electric Wave', border: '3px solid #a855f7', boxShadow: '0 0 16px #38bdf8', animation: undefined, costCoins: 290, costGems: 5 },
  { id: 'fr_twilight_aura', label: 'Twilight Aura', border: '3px solid #c084fc', boxShadow: '0 0 16px #ec4899', animation: undefined, costCoins: 300, costGems: 5 },

  // --- EPIC (300–700 Coins + 5–20 💎) ---
  { id: 'fr_galaxy_core', label: 'Galaxy Core', border: '3px double #a855f7', boxShadow: '0 0 18px #a855f7', animation: undefined, costCoins: 320, costGems: 6 },
  { id: 'fr_plasma_ring', label: 'Plasma Ring', border: '3px solid #ec4899', boxShadow: '0 0 18px #38bdf8', animation: undefined, costCoins: 350, costGems: 7 },
  { id: 'fr_dragon_flame', label: 'Dragon Flame', border: '3px solid #ef4444', boxShadow: '0 0 18px #f97316', animation: undefined, costCoins: 380, costGems: 8 },
  { id: 'fr_celestial_light', label: 'Celestial Light', border: '3px solid #fef08a', boxShadow: '0 0 18px #38bdf8', animation: undefined, costCoins: 400, costGems: 10 },
  { id: 'fr_aurora_nova', label: 'Aurora Nova', border: '3px dashed #10b981', boxShadow: '0 0 18px #38bdf8', animation: undefined, costCoins: 420, costGems: 11 },
  { id: 'fr_phantom_glow', label: 'Phantom Glow', border: '3px solid #a855f7', boxShadow: '0 0 18px #6366f1', animation: undefined, costCoins: 450, costGems: 12 },
  { id: 'fr_mystic_eclipse', label: 'Mystic Eclipse', border: '3px double #c084fc', boxShadow: '0 0 18px #4c1d95', animation: undefined, costCoins: 480, costGems: 13 },
  { id: 'fr_cosmic_pulse', label: 'Cosmic Pulse', border: '3px solid #8b5cf6', boxShadow: '0 0 20px #ec4899', animation: undefined, costCoins: 500, costGems: 14 },
  { id: 'fr_stardust_orbit', label: 'Stardust Orbit', border: '3px dotted #ffffff', boxShadow: '0 0 20px #a855f7', animation: 'spin 12s linear infinite', costCoins: 530, costGems: 15 },
  { id: 'fr_quantum_ring', label: 'Quantum Ring', border: '3px double #06b6d4', boxShadow: '0 0 20px #3b82f6', animation: undefined, costCoins: 560, costGems: 16 },
  { id: 'fr_thunder_nova', label: 'Thunder Nova', border: '3px solid #38bdf8', boxShadow: '0 0 20px #eab308', animation: undefined, costCoins: 600, costGems: 17 },
  { id: 'fr_obsidian_halo', label: 'Obsidian Halo', border: '3px solid #1e293b', boxShadow: '0 0 20px #64748b', animation: undefined, costCoins: 620, costGems: 18 },
  { id: 'fr_crystal_nova', label: 'Crystal Nova', border: '3px solid #e0f2fe', boxShadow: '0 0 20px #38bdf8', animation: undefined, costCoins: 650, costGems: 19 },
  { id: 'fr_infinity_loop', label: 'Infinity Loop', border: '3px double #ec4899', boxShadow: '0 0 22px #8b5cf6', animation: undefined, costCoins: 680, costGems: 20 },
  { id: 'fr_gravity_well', label: 'Gravity Well', border: '3px solid #4c1d95', boxShadow: '0 0 22px #8b5cf6', animation: undefined, costCoins: 700, costGems: 20 },

  // --- LEGENDARY (700–1500 Coins + 20–60 💎) ---
  { id: 'fr_eternal_flame', label: 'Eternal Flame', border: '3px solid #dc2626', boxShadow: '0 0 24px #f97316', animation: undefined, costCoins: 750, costGems: 22 },
  { id: 'fr_celestial_crown', label: 'Celestial Crown', border: '3px double #fbbf24', boxShadow: '0 0 24px #fef08a', animation: undefined, costCoins: 800, costGems: 25 },
  { id: 'fr_divine_halo', label: 'Divine Halo', border: '3px solid #fef08a', boxShadow: '0 0 24px #ffffff', animation: undefined, costCoins: 850, costGems: 28 },
  { id: 'fr_void_rift', label: 'Void Rift', border: '3px solid #7c3aed', boxShadow: '0 0 24px #4c1d95', animation: undefined, costCoins: 900, costGems: 30 },
  { id: 'fr_astral_pulse', label: 'Astral Pulse', border: '3px solid #38bdf8', boxShadow: '0 0 24px #a855f7', animation: undefined, costCoins: 950, costGems: 32 },
  { id: 'fr_cosmic_rift', label: 'Cosmic Rift', border: '3px double #c084fc', boxShadow: '0 0 24px #ec4899', animation: undefined, costCoins: 1000, costGems: 35 },
  { id: 'fr_supernova', label: 'Supernova', border: '3px solid #f59e0b', boxShadow: '0 0 26px #ef4444', animation: undefined, costCoins: 1050, costGems: 38 },
  { id: 'fr_black_hole', label: 'Black Hole', border: '3px solid #0f172a', boxShadow: '0 0 26px #a855f7', animation: undefined, costCoins: 1100, costGems: 40 },
  { id: 'fr_solar_nova', label: 'Solar Nova', border: '3px solid #fef08a', boxShadow: '0 0 26px #f59e0b', animation: undefined, costCoins: 1150, costGems: 42 },
  { id: 'fr_nebula_crown', label: 'Nebula Crown', border: '3px double #ec4899', boxShadow: '0 0 26px #8b5cf6', animation: undefined, costCoins: 1200, costGems: 45 },
  { id: 'fr_titan_core', label: 'Titan Core', border: '3px solid #b45309', boxShadow: '0 0 26px #f59e0b', animation: undefined, costCoins: 1250, costGems: 48 },
  { id: 'fr_infinity_crown', label: 'Infinity Crown', border: '3px double #fbbf24', boxShadow: '0 0 28px #ec4899', animation: undefined, costCoins: 1300, costGems: 50 },
  { id: 'fr_omega_ring', label: 'Omega Ring', border: '3px solid #0284c7', boxShadow: '0 0 28px #38bdf8', animation: undefined, costCoins: 1350, costGems: 52 },
  { id: 'fr_ancient_relic', label: 'Ancient Relic', border: '3px double #d97706', boxShadow: '0 0 28px #b45309', animation: undefined, costCoins: 1400, costGems: 55 },
  { id: 'fr_time_rift', label: 'Time Rift', border: '3px solid #10b981', boxShadow: '0 0 28px #06b6d4', animation: undefined, costCoins: 1500, costGems: 60 },

  // --- MYTHIC (1500–5000 Coins + 60–300 💎) ---
  { id: 'fr_creators_aura', label: "Creator's Aura", border: '3px solid #ffffff', boxShadow: '0 0 30px #fef08a', animation: undefined, costCoins: 1600, costGems: 70 },
  { id: 'fr_universe_core', label: 'Universe Core', border: '3px double #8b5cf6', boxShadow: '0 0 30px #38bdf8', animation: undefined, costCoins: 1800, costGems: 85 },
  { id: 'fr_eternal_galaxy', label: 'Eternal Galaxy', border: '3px solid #ec4899', boxShadow: '0 0 30px #a855f7', animation: undefined, costCoins: 2000, costGems: 100 },
  { id: 'fr_cosmic_throne', label: 'Cosmic Throne', border: '3px double #fbbf24', boxShadow: '0 0 32px #8b5cf6', animation: undefined, costCoins: 2200, costGems: 120 },
  { id: 'fr_divine_eclipse', label: 'Divine Eclipse', border: '3px solid #fef08a', boxShadow: '0 0 32px #ef4444', animation: undefined, costCoins: 2500, costGems: 140 },
  { id: 'fr_infinity_cosmos', label: 'Infinity Cosmos', border: '3px double #38bdf8', boxShadow: '0 0 32px #a855f7', animation: undefined, costCoins: 2800, costGems: 160 },
  { id: 'fr_celestial_throne', label: 'Celestial Throne', border: '3px double #fbbf24', boxShadow: '0 0 34px #ffffff', animation: undefined, costCoins: 3000, costGems: 180 },
  { id: 'fr_primordial_ring', label: 'Primordial Ring', border: '3px solid #dc2626', boxShadow: '0 0 34px #7c3aed', animation: undefined, costCoins: 3200, costGems: 200 },
  { id: 'fr_stellar_genesis', label: 'Stellar Genesis', border: '3px double #06b6d4', boxShadow: '0 0 34px #fef08a', animation: undefined, costCoins: 3500, costGems: 220 },
  { id: 'fr_omni_halo', label: 'Omni Halo', border: '3px solid #ffffff', boxShadow: '0 0 36px #a855f7', animation: undefined, costCoins: 3800, costGems: 240 },
  { id: 'fr_godlight_frame', label: 'Godlight Frame', border: '3px double #fef08a', boxShadow: '0 0 36px #38bdf8', animation: undefined, costCoins: 4000, costGems: 250 },
  { id: 'fr_dimension_break', label: 'Dimension Break', border: '3px dashed #ec4899', boxShadow: '0 0 36px #06b6d4', animation: undefined, costCoins: 4200, costGems: 265 },
  { id: 'fr_eternal_nebula', label: 'Eternal Nebula', border: '3px double #a855f7', boxShadow: '0 0 38px #ec4899', animation: undefined, costCoins: 4500, costGems: 280 },
  { id: 'fr_cosmic_ascension', label: 'Cosmic Ascension', border: '3px solid #fbbf24', boxShadow: '0 0 38px #38bdf8', animation: undefined, costCoins: 4800, costGems: 290 },
  { id: 'fr_pv_legend_frame', label: 'Cognerix Legend', border: '3px double #fef08a', boxShadow: '0 0 40px #fbbf24', animation: undefined, costCoins: 5000, costGems: 300 }
];

const renderAvatar = (avatar: string = '👤', frame: string = 'none', size: number = 64) => {
  const selectedFrame = AVAILABLE_FRAMES.find(f => f.id === frame) || AVAILABLE_FRAMES[0];
  
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${size * 0.55}px`,
      background: 'rgba(255, 255, 255, 0.05)',
      position: 'relative',
      border: selectedFrame.border || '2px solid rgba(255, 255, 255, 0.1)',
      boxShadow: selectedFrame.boxShadow || 'none',
      animation: selectedFrame.animation || 'none',
      flexShrink: 0
    }}>
      {avatar}
    </div>
  );
};

// 🎵 Ambient Background Music Engine (Procedural - No external files needed)
class AmbientMusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isPlaying = false;
  private intervalIds: ReturnType<typeof setInterval>[] = [];
  private oscillators: OscillatorNode[] = [];
  private gains: GainNode[] = [];

  // Calm puzzle-game chord progressions in C major / A minor
  private chords = [
    [261.63, 329.63, 392.00], // C major
    [220.00, 277.18, 329.63], // A minor
    [293.66, 349.23, 440.00], // D minor
    [246.94, 311.13, 392.00], // B dim → G
    [261.63, 311.13, 392.00], // C sus
    [220.00, 261.63, 329.63], // Am
    [349.23, 440.00, 523.25], // F major (high)
    [329.63, 392.00, 493.88], // E minor (high)
  ];

  start(volume: number = 0.3) {
    if (this.isPlaying) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(volume * 0.5, this.ctx.currentTime);

      // Create a dynamics compressor to act as a limiter to prevent any clipping/distortion
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-16, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      // Connect: Signal -> Compressor -> Master Gain -> Destination
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.isPlaying = true;
      this.playPadLayer();
      this.playArpLayer();
      this.playSubBass();
    } catch (e) {
      console.warn('[AmbientMusic] Failed to start:', e);
    }
  }

  stop() {
    this.isPlaying = false;
    this.intervalIds.forEach(id => clearInterval(id));
    this.intervalIds = [];
    this.oscillators.forEach(osc => { try { osc.stop(); } catch {} });
    this.oscillators = [];
    this.gains.forEach(g => { try { g.disconnect(); } catch {} });
    this.gains = [];
    if (this.ctx) {
      try { this.ctx.close(); } catch {}
      this.ctx = null;
    }
    this.masterGain = null;
    this.compressor = null;
  }

  setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(volume * 0.5, this.ctx.currentTime);
    }
  }

  get playing() { return this.isPlaying; }

  // Slow evolving pad chords
  private playPadLayer() {
    if (!this.ctx || !this.compressor) return;
    let chordIdx = 0;

    const playChord = () => {
      if (!this.ctx || !this.compressor || !this.isPlaying) return;
      const chord = this.chords[chordIdx % this.chords.length];
      chordIdx++;

      chord.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.value = freq * 0.5; // One octave lower for warmth
        // Slight detuning for richness
        osc.detune.value = (i - 1) * 4;

        filter.type = 'lowpass';
        filter.frequency.value = 600;
        filter.Q.value = 1;

        // Establish a clean initial state anchor to avoid pop click distortion
        gain.gain.setValueAtTime(0, this.ctx!.currentTime);
        // Slow fade in (gain 0.08 per voice to guarantee headroom)
        gain.gain.linearRampToValueAtTime(0.08, this.ctx!.currentTime + 2.0);
        // Sustain
        gain.gain.setValueAtTime(0.08, this.ctx!.currentTime + 5.0);
        // Slow fade out before the 8.0 second mark
        gain.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + 7.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.compressor!);

        osc.start();
        osc.stop(this.ctx!.currentTime + 8);

        this.oscillators.push(osc);
        this.gains.push(gain);

        // Cleanup
        osc.onended = () => {
          const oi = this.oscillators.indexOf(osc);
          if (oi > -1) this.oscillators.splice(oi, 1);
          const gi = this.gains.indexOf(gain);
          if (gi > -1) this.gains.splice(gi, 1);
        };
      });
    };

    playChord();
    const id = setInterval(() => {
      if (!this.isPlaying) return;
      playChord();
    }, 8000); // New chord every 8 seconds
    this.intervalIds.push(id);
  }

  // Gentle arpeggio sparkles
  private playArpLayer() {
    if (!this.ctx || !this.compressor) return;
    const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    let noteIdx = 0;

    const playNote = () => {
      if (!this.ctx || !this.compressor || !this.isPlaying) return;

      // Only play ~40% of the time for sparse sparkle effect
      if (Math.random() > 0.4) return;

      const freq = pentatonic[noteIdx % pentatonic.length] * (Math.random() > 0.5 ? 1 : 2);
      noteIdx++;

      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      // Safe anchor starting volume
      const targetVolume = 0.04 + Math.random() * 0.03;
      gain.gain.setValueAtTime(0, this.ctx!.currentTime);
      gain.gain.linearRampToValueAtTime(targetVolume, this.ctx!.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 1.5 + Math.random() * 1.0);

      osc.connect(gain);
      gain.connect(this.compressor!);

      osc.start();
      osc.stop(this.ctx!.currentTime + 2.5);

      this.oscillators.push(osc);
      this.gains.push(gain);

      osc.onended = () => {
        const oi = this.oscillators.indexOf(osc);
        if (oi > -1) this.oscillators.splice(oi, 1);
        const gi = this.gains.indexOf(gain);
        if (gi > -1) this.gains.splice(gi, 1);
      };
    };

    const id = setInterval(() => {
      if (!this.isPlaying) return;
      playNote();
    }, 1200 + Math.random() * 800); // Every ~1.2-2s
    this.intervalIds.push(id);
  }

  // Deep subtle sub-bass pulse
  private playSubBass() {
    if (!this.ctx || !this.compressor) return;
    const bassNotes = [65.41, 55.00, 73.42, 61.74]; // C2, A1, D2, B1
    let bassIdx = 0;

    const playBass = () => {
      if (!this.ctx || !this.compressor || !this.isPlaying) return;
      const freq = bassNotes[bassIdx % bassNotes.length];
      bassIdx++;

      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.value = freq;

      filter.type = 'lowpass';
      filter.frequency.value = 150;

      // Safe, deep sub volume (0.06 to avoid overdrive distortion)
      gain.gain.setValueAtTime(0, this.ctx!.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, this.ctx!.currentTime + 3.0);
      gain.gain.setValueAtTime(0.06, this.ctx!.currentTime + 10.0);
      gain.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + 15.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor!);

      osc.start();
      osc.stop(this.ctx!.currentTime + 16);

      this.oscillators.push(osc);
      this.gains.push(gain);

      osc.onended = () => {
        const oi = this.oscillators.indexOf(osc);
        if (oi > -1) this.oscillators.splice(oi, 1);
        const gi = this.gains.indexOf(gain);
        if (gi > -1) this.gains.splice(gi, 1);
      };
    };

    playBass();
    const id = setInterval(() => {
      if (!this.isPlaying) return;
      playBass();
    }, 16000); // New bass note every 16 seconds
    this.intervalIds.push(id);
  }
}

const ambientMusic = new AmbientMusicEngine();

// Synthesized Audio Engine (No external sound files required)
const synthSound = (type: 'click' | 'success' | 'fail' | 'levelUp' | 'correct' | 'search' | 'slide' | 'sudoku' | 'logic' | 'jigsaw' | 'slingshot' | 'bluster' | 'block_place' | 'wind' | 'wind_alert' | 'check' | 'victory' | 'defeat', isMuted: boolean, volume: number = 0.5) => {
  if (isMuted) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    if (type === 'click') {
      // 🌟 Clean high-quality soft pop click
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.06 * volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'slide') {
      // 🌟 Authentic wood tap (chess move)
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
      
      gainNode.gain.setValueAtTime(0.3 * volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'sudoku') {
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.50, ctx.currentTime); // C6
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, ctx.currentTime); // E6
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      gain1.gain.setValueAtTime(0.06 * volume, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0.04 * volume, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      
      osc1.start();
      osc1.stop(ctx.currentTime + 0.15);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.15);
    } else if (type === 'logic') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08 * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'jigsaw') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12 * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'slingshot') {
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(200, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.02);
      osc1.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
      gain1.gain.setValueAtTime(0.14 * volume, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(600, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.18);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      gain2.gain.setValueAtTime(0.08 * volume, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.2);
    } else if (type === 'bluster') {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      const noteDelay = 0.04;
      notes.forEach((freq, index) => {
        const time = ctx.currentTime + index * noteDelay;
        const noteOsc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        noteOsc.connect(noteGain);
        noteGain.connect(ctx.destination);
        noteOsc.type = index % 2 === 0 ? 'sine' : 'triangle';
        noteOsc.frequency.setValueAtTime(freq, time);
        noteOsc.frequency.exponentialRampToValueAtTime(freq * 1.5, time + 0.12);
        noteGain.gain.setValueAtTime(0.0, time);
        noteGain.gain.linearRampToValueAtTime(0.08 * volume, time + 0.01);
        noteGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        noteOsc.start(time);
        noteOsc.stop(time + 0.16);
      });
    } else if (type === 'block_place') {
      // 🌟 Authentic wood block strike (chess capture)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(450, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.06);
      
      gain1.gain.setValueAtTime(0.3 * volume, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(350, ctx.currentTime + 0.02);
      osc2.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.08);
      
      gain2.gain.setValueAtTime(0.25 * volume, ctx.currentTime + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc1.start();
      osc1.stop(ctx.currentTime + 0.07);
      
      osc2.start(ctx.currentTime + 0.02);
      osc2.stop(ctx.currentTime + 0.09);
    } else if (type === 'success') {
      // 🌟 Warm clean triad chime
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const time = ctx.currentTime + idx * 0.06;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, time);
        g.gain.setValueAtTime(0.0, time);
        g.gain.linearRampToValueAtTime(0.06 * volume, time + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(time);
        o.stop(time + 0.4);
      });
    } else if (type === 'correct') {
      // 🌟 Soft high chime arpeggio
      const notes = [783.99, 1046.50]; // G5, C6
      notes.forEach((freq, idx) => {
        const time = ctx.currentTime + idx * 0.05;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, time);
        g.gain.setValueAtTime(0.0, time);
        g.gain.linearRampToValueAtTime(0.06 * volume, time + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(time);
        o.stop(time + 0.25);
      });
    } else if (type === 'fail') {
      // 🌟 Gentle double alert beep
      const notes = [370, 370];
      notes.forEach((freq, idx) => {
        const time = ctx.currentTime + idx * 0.10;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, time);
        g.gain.setValueAtTime(0.0, time);
        g.gain.linearRampToValueAtTime(0.05 * volume, time + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(time);
        o.stop(time + 0.09);
      });
    } else if (type === 'check') {
      // 🌟 High-pitched bright check warning chime (chess) - single chord
      const notes = [659.25, 987.77]; // E5, B5
      notes.forEach((freq) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, ctx.currentTime);
        g.gain.setValueAtTime(0.1 * volume, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.26);
      });
    } else if (type === 'levelUp') {
      const scale = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      scale.forEach((freq, idx) => {
        const time = ctx.currentTime + idx * 0.07;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, time);
        
        g.gain.setValueAtTime(0.0, time);
        g.gain.linearRampToValueAtTime(0.1 * volume, time + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        
        o.connect(g);
        g.connect(ctx.destination);
        o.start(time);
        o.stop(time + 0.7);
      });
    } else if (type === 'search') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.05 * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } else if (type === 'wind') {
      // 🌟 Premium howling wind gust (White noise + dynamic Bandpass filter sweeps)
      const bufferSize = ctx.sampleRate * 2.5; // 2.5 seconds of wind
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      // Dual filter sweep to simulate multi-layered gust dynamics
      const filter1 = ctx.createBiquadFilter();
      filter1.type = 'bandpass';
      filter1.Q.setValueAtTime(12, ctx.currentTime);
      filter1.frequency.setValueAtTime(250, ctx.currentTime);
      filter1.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.4);
      filter1.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 1.2);
      filter1.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 1.8);
      filter1.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 2.5);

      const filter2 = ctx.createBiquadFilter();
      filter2.type = 'bandpass';
      filter2.Q.setValueAtTime(8, ctx.currentTime);
      filter2.frequency.setValueAtTime(300, ctx.currentTime);
      filter2.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.5);
      filter2.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 1.3);
      filter2.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 1.7);
      filter2.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 2.5);
      
      const windGain = ctx.createGain();
      windGain.gain.setValueAtTime(0.0, ctx.currentTime);
      windGain.gain.linearRampToValueAtTime(0.24 * volume, ctx.currentTime + 0.3);
      windGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
      
      noise.connect(filter1);
      filter1.connect(windGain);
      noise.connect(filter2);
      filter2.connect(windGain);
      windGain.connect(ctx.destination);
      noise.start();
      noise.stop(ctx.currentTime + 2.5);
    } else if (type === 'wind_alert') {
      const alarmNotes = [880, 880];
      alarmNotes.forEach((freq, idx) => {
        const time = ctx.currentTime + idx * 0.12;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(freq, time);
        g.gain.setValueAtTime(0.0, time);
        g.gain.linearRampToValueAtTime(0.06 * volume, time + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.10);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(time);
        o.stop(time + 0.11);
      });

      const bufferSize = ctx.sampleRate * 2.0;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(10, ctx.currentTime);
      filter.frequency.setValueAtTime(150, ctx.currentTime + 0.2);
      filter.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.6);
      filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 1.2);
      filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 2.0);
      
      const windGain = ctx.createGain();
      windGain.gain.setValueAtTime(0.0, ctx.currentTime);
      windGain.gain.linearRampToValueAtTime(0.20 * volume, ctx.currentTime + 0.4);
      windGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
      
      noise.connect(filter);
      filter.connect(windGain);
      windGain.connect(ctx.destination);
      
      noise.start(ctx.currentTime + 0.2);
      noise.stop(ctx.currentTime + 2.2);
    } else if (type === 'victory') {
      // 🏆 Celebratory major scale arpeggio chime with high accent shimmer
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        const time = ctx.currentTime + idx * 0.08;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, time);
        o.detune.setValueAtTime(idx * 2, time);
        g.gain.setValueAtTime(0.0, time);
        g.gain.linearRampToValueAtTime(0.12 * volume, time + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(time);
        o.stop(time + 0.6);
      });
      // Shimmer accent note at the end
      const shimmerTime = ctx.currentTime + notes.length * 0.08;
      const shimmerOsc = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmerOsc.type = 'triangle';
      shimmerOsc.frequency.setValueAtTime(1318.51, shimmerTime); // E6
      shimmerGain.gain.setValueAtTime(0.0, shimmerTime);
      shimmerGain.gain.linearRampToValueAtTime(0.06 * volume, shimmerTime + 0.01);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, shimmerTime + 0.4);
      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      shimmerOsc.start(shimmerTime);
      shimmerOsc.stop(shimmerTime + 0.5);
    } else if (type === 'defeat') {
      // 💀 Descending, calm minor chord progression (not too negative or harsh)
      const notes = [392.00, 311.13, 261.63, 196.00]; // G4, Eb4, C4, G3 descending minor chime
      notes.forEach((freq, idx) => {
        const time = ctx.currentTime + idx * 0.15;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, time);
        g.gain.setValueAtTime(0.0, time);
        g.gain.linearRampToValueAtTime(0.1 * volume, time + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(time);
        o.stop(time + 0.7);
      });
    }
  } catch (e) {
    console.error("Audio Context playback failed", e);
  }
};

function App() {
  const { 
    userProfile, leaderboard, storeItems, 
    recordGameWin, recordGamePlay,
    buyStoreItem, equipCosmetic, updateStatus, updateAvatarAndFrame, buyAvatarOrFrame, spendGems, changeUsername, refreshLeaderboard,
    language, setLanguage, saveProfile, isProfileLoaded, getLastLocalMutationTime
  } = useGame();

  const t = (key: string) => translate(key, language);
  const isAdmin = userProfile?.id === '101698362403' || userProfile?.email?.toLowerCase() === 'admin.cognerix@gmail.com';

  const getPuzzleName = (pType: string | null | undefined): string => {
    if (!pType) return 'Puzzle Arena';
    if (pType === PuzzleType.SLIDING) return t('sliding_name');
    if (pType === PuzzleType.WORD) return t('word_name');
    if (pType === PuzzleType.EIGHT_BALL_QUIZ) return t('trivia_name');
    if (pType === PuzzleType.SUDOKU) return t('sudoku_name');
    if (pType === PuzzleType.LOGIC) return t('logic_name');
    if (pType === PuzzleType.JIGSAW) return t('jigsaw_name');
    if (pType === PuzzleType.PHYSICS) return t('physics_name');
    if (pType === PuzzleType.BLOCK_BLUSTER) return t('block_bluster_name');
    if (pType === PuzzleType.WORD_SEARCH) return t('word_search_name');
    if (pType === PuzzleType.TOWER_BLOXX) return t('tower_bloxx_name');
    if (pType === PuzzleType.MENTAL_MATH) return t('mental_math_name');
    return 'Puzzle Arena';
  };

  const [playerEmojiBubble, setPlayerEmojiBubble] = useState<string | null>(null);
  const [opponentEmojiBubble, setOpponentEmojiBubble] = useState<string | null>(null);
  const playerEmojiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opponentEmojiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botReactedThresholds = useRef<Record<number, boolean>>({});

  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'store' | 'leaderboard' | 'avatars' | 'battlepass' | 'settings' | 'friends'>('home');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [shopConfirm, setShopConfirm] = useState<{
    itemName: string;
    costCoins: number;
    costGems: number;
    onConfirm: () => void;
  } | null>(null);
  const [genericConfirm, setGenericConfirm] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const { activeEntranceAnimation } = useGame();
  const [appliedEntranceClass, setAppliedEntranceClass] = useState<string>('');

  const prevTabRef = useRef(activeTab);
  const prevActiveAnimRef = useRef(activeEntranceAnimation);

  useEffect(() => {
    const tabChanged = prevTabRef.current !== activeTab;
    const animTriggered = activeEntranceAnimation !== '' && prevActiveAnimRef.current !== activeEntranceAnimation;

    prevTabRef.current = activeTab;
    prevActiveAnimRef.current = activeEntranceAnimation;

    if (tabChanged || animTriggered) {
      const anim = activeEntranceAnimation || userProfile.lobbyEntranceAnimation || 'animate-fade-in';
      setAppliedEntranceClass(anim);
      const timer = setTimeout(() => {
        setAppliedEntranceClass('');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, activeEntranceAnimation, userProfile.lobbyEntranceAnimation]);

  const entranceClass = appliedEntranceClass;
  const [showLevelUpModal, setShowLevelUpModal] = useState<number | null>(null);
  const [activeGame, setActiveGame] = useState<PuzzleType | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [soundVolume, setSoundVolume] = useState<number>(0.5);
  const [isMusicOn, setIsMusicOn] = useState<boolean>(true);
  const [customStatusInput, setCustomStatusInput] = useState<string>(userProfile.status || '');

  // Manage ambient music lifecycle
  useEffect(() => {
    if (isMusicOn && !isMuted) {
      ambientMusic.start(soundVolume);
    } else {
      ambientMusic.stop();
    }
    return () => { ambientMusic.stop(); };
  }, [isMusicOn, isMuted]);

  // Sync music volume when soundVolume changes
  useEffect(() => {
    if (isMusicOn && !isMuted) {
      ambientMusic.setVolume(soundVolume);
    }
  }, [soundVolume]);
  const [isEditingStatus, setIsEditingStatus] = useState<boolean>(false);
  const [newNameInput, setNewNameInput] = useState<string>(userProfile.username);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);

  // Responsive Drawer and Game Menu states
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isGameMenuOpen, setIsGameMenuOpen] = useState<boolean>(false);
  const [isGameHidden, setIsGameHidden] = useState<boolean>(false);
  const [playerProgress, setPlayerProgress] = useState<number>(0);
  const [gameSeed, setGameSeed] = useState<string>('');
  const [botTriviaCorrect, setBotTriviaCorrect] = useState<number>(0);
  const [playerCorrectCount, setPlayerCorrectCount] = useState<number>(0);

  // 3-Round Physics Match tracking
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [playerRoundWins, setPlayerRoundWins] = useState<number>(0);
  const [opponentRoundWins, setOpponentRoundWins] = useState<number>(0);
  const [, setRoundWinnerMessage] = useState<string | null>(null);

  // Light/Dark Theme State
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('puzzle_verse_light_mode');
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
    localStorage.setItem('puzzle_verse_light_mode', String(isLightMode));
  }, [isLightMode]);

  // Reset grid size when active game changes or is closed
  useEffect(() => {
    setCurrentSlidingGridSize(3);
  }, [activeGame]);

  // Real Online Matchmaking
  const [matchmakingState, setMatchmakingState] = useState<'idle' | 'searching' | 'found' | 'playing' | 'waiting_opponent'>('idle');
  const [triviaPauseTimerLeft, setTriviaPauseTimerLeft] = useState<number>(-1);
  const [opponentInfo, setOpponentInfo] = useState<{ id?: string; username: string; rank: RankName; progress: number; correctAnswers?: number; nameColor?: string; badges?: string[]; aiMode?: string; avatar?: string; frame?: string } | null>(null);
  const [currentSlidingGridSize, setCurrentSlidingGridSize] = useState<number>(3);
  const [matchmakingTimer, setMatchmakingTimer] = useState<number>(0);
  const [queuedPuzzle, setQueuedPuzzle] = useState<PuzzleType | null>(null);
  const searchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const matchSolveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roomRef = useRef<Room<any> | null>(null);
  const isIntentionalLeaveRef = useRef<boolean>(false);
  const playerHasWonBotMatchRef = useRef<boolean>(false);
  const gameStartedRef = useRef<boolean>(false);
  const opponentNameRef = useRef<string>('Opponent');
  const opponentIdRef = useRef<string>('');
  const lastPlayedMatchResultRef = useRef<any>(null);
  const [difficultyModal, setDifficultyModal] = useState<{ puzzleType: PuzzleType } | null>(null);
  const selectedDifficultyRef = useRef<'online' | 'easy' | 'medium' | 'hard' | 'private_create' | 'private_join' | 'solo'>('online');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportNickname, setReportNickname] = useState<string>('');
  const [reportReason, setReportReason] = useState<'Nickname Violation' | 'Violence in Chat' | 'Other'>('Violence in Chat');
  const [reportDescription, setReportDescription] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);

  useEffect(() => {
    if (isReportModalOpen && userProfile?.username) {
      setReportNickname(userProfile.username);
    }
  }, [isReportModalOpen, userProfile]);
  const [privatePin, setPrivatePin] = useState<string | null>(null);
  const [isFriendChallengeDuel, setIsFriendChallengeDuel] = useState<boolean>(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState<boolean>(false);
  const [isMenuPopupOpen, setIsMenuPopupOpen] = useState<boolean>(false);
  const [idCopied, setIdCopied] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<{ senderId: string; username: string; text: string; timestamp: number }[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [lobbyCountdown, setLobbyCountdown] = useState<number>(10);
  const [isInGameChatOpen, setIsInGameChatOpen] = useState<boolean>(false);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const [inGameChatPosition, setInGameChatPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isInGameChatDragging = useRef<boolean>(false);
  const inGameChatDragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [friendsList, setFriendsList] = useState<{ id: string; username: string; avatar: string; frame: string; rank: string; status: 'online' | 'in_game' | 'offline' }[]>([]);
  const [friendSearchInput, setFriendSearchInput] = useState<string>('');
  const [challengeTargetFriend, setChallengeTargetFriend] = useState<{ id: string; username: string } | null>(null);
  const [incomingChallenge, setIncomingChallenge] = useState<{ sender: string; senderId: string; puzzleType: PuzzleType; pin: string } | null>(null);
  const [friendRequests, setFriendRequests] = useState<{ senderId: string; senderUsername: string }[]>([]);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [activeChatFriend, setActiveChatFriend] = useState<{ id: string; username: string } | null>(null);
  const [chatHistory, setChatHistory] = useState<{ senderId: string; senderUsername: string; text: string; timestamp: number }[]>([]);
  const [friendChatInput, setFriendChatInput] = useState<string>('');
  const [unreadChats, setUnreadChats] = useState<Record<string, boolean>>({});
  const lastReadTimestamps = useRef<Record<string, number>>(
    (() => {
      try {
        const saved = localStorage.getItem('puzzle_verse_last_read_chats');
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    })()
  );

  const saveLastReadTimestamps = (updated: Record<string, number>) => {
    lastReadTimestamps.current = updated;
    localStorage.setItem('puzzle_verse_last_read_chats', JSON.stringify(updated));
  };

  const [roomBlocks, setRoomBlocks] = useState<Record<string, string[]>>({});
  const roomBlocksRef = useRef<Record<string, string[]>>({});
  const [isMailboxOpen, setIsMailboxOpen] = useState<boolean>(false);
  const [isUserBanned, setIsUserBanned] = useState<boolean>(false);
  const [isFreeRewardOpen, setIsFreeRewardOpen] = useState<boolean>(false);
  const [isWatchingAd, setIsWatchingAd] = useState<boolean>(false);
  const [adTimeLeft, setAdTimeLeft] = useState<number>(0);
  const [showRewardCollectScreen, setShowRewardCollectScreen] = useState<boolean>(false);
  const [isStorePopupOpen, setIsStorePopupOpen] = useState<boolean>(false);
  const [storePopupTab, setStorePopupTab] = useState<'coins' | 'gems'>('coins');
  const [lastRewardClaimedTime, setLastRewardClaimedTime] = useState<number>(() => {
    const saved = localStorage.getItem('pv_last_reward_claimed');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [cooldownTick, setCooldownTick] = useState<number>(0);

  useEffect(() => {
    let timer: any;
    if (isWatchingAd && adTimeLeft > 0) {
      timer = setTimeout(() => {
        setAdTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isWatchingAd && adTimeLeft === 0) {
      setIsWatchingAd(false);
      // Give reward
      const newCoins = 700;
      const newGems = 100;
      const updatedProfile = {
        ...userProfile,
        coins: userProfile.coins + newCoins,
        gems: userProfile.gems + newGems
      };
      saveProfile(updatedProfile);
      
      // Persist cooldown
      const now = Date.now();
      setLastRewardClaimedTime(now);
      localStorage.setItem('pv_last_reward_claimed', now.toString());
      triggerSound('success');
      setShowRewardCollectScreen(true);
    }
    return () => clearTimeout(timer);
  }, [isWatchingAd, adTimeLeft]);

  useEffect(() => {
    let interval: any;
    const checkCooldown = () => {
      const elapsed = Date.now() - lastRewardClaimedTime;
      if (elapsed < 30000) {
        setCooldownTick(prev => prev + 1);
      }
    };
    
    checkCooldown();
    
    if (Date.now() - lastRewardClaimedTime < 30000) {
      interval = setInterval(() => {
        const elapsed = Date.now() - lastRewardClaimedTime;
        if (elapsed >= 30000) {
          clearInterval(interval);
        }
        setCooldownTick(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lastRewardClaimedTime]);

  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [unreadMailCount, setUnreadMailCount] = useState<number>(2);
  const [mailboxItems, setMailboxItems] = useState<{ id: string; type: 'announcement' | 'gift'; title: string; content: string; rewardCoins?: number; rewardGems?: number; claimed: boolean; date: string }[]>(() => [
    {
      id: 'mail_01',
      type: 'announcement',
      title: '📢 System Update v1.2',
      content: 'Welcome to PuzzleVerse! Enjoy our new real-time multiplayer 1v1 arenas, customizer store, and mutual friends list. Let the match begin!',
      claimed: false,
      date: 'July 15, 2026'
    },
    {
      id: 'mail_02',
      type: 'gift',
      title: '💎 Admin Welcome Gift',
      content: 'Claim your free gems and coins package to start purchasing frames and name colors!',
      rewardCoins: 1000,
      rewardGems: 100,
      claimed: false,
      date: 'July 15, 2026'
    }
  ]);
  const [adminMailTitle, setAdminMailTitle] = useState<string>('');
  const [adminMailContent, setAdminMailContent] = useState<string>('');
  const [adminGiftCoins, setAdminGiftCoins] = useState<number>(0);
  const [adminGiftGems, setAdminGiftGems] = useState<number>(0);
  const [adminMailType, setAdminMailType] = useState<'announcement' | 'gift'>('announcement');
  const [adminMailTargetId, setAdminMailTargetId] = useState<string>('');
  const [adminPopupText, setAdminPopupText] = useState<string>('');
  const [adminPopupTargets, setAdminPopupTargets] = useState<string>('');
  const [adminAnnouncementHistory, setAdminAnnouncementHistory] = useState<any[]>([]);
  const [currentDisplayPopup, setCurrentDisplayPopup] = useState<any | null>(null);
  const [matchmakingQueues, setMatchmakingQueues] = useState<Record<string, number>>({});
  const lobbyRoomRef = useRef<any>(null);
  const [adminBanPlayerId, setAdminBanPlayerId] = useState<string>('');
  const [adminBanReason, setAdminBanReason] = useState<string>('');
  const [userBanReason, setUserBanReason] = useState<string>('');
  const [bannedPlayersList, setBannedPlayersList] = useState<{ bannedProfileIds: string[], bannedUserIds: string[], bannedIps: string[] }>({ bannedProfileIds: [], bannedUserIds: [], bannedIps: [] });
  const [adminUsersList, setAdminUsersList] = useState<any[]>([]);
  const [selectedAdminUser, setSelectedAdminUser] = useState<any | null>(null);
  const [isAdminFriendsModalOpen, setIsAdminFriendsModalOpen] = useState<boolean>(false);
  const [adminFriendsList, setAdminFriendsList] = useState<any[]>([]);
  const [adminFriendsLoading, setAdminFriendsLoading] = useState<boolean>(false);
  const [isOnboardingLangDropdownOpen, setIsOnboardingLangDropdownOpen] = useState<boolean>(false);
  const [isSettingsLangDropdownOpen, setIsSettingsLangDropdownOpen] = useState<boolean>(false);

  const fetchAdminFriends = async (targetUserId: string) => {
    setAdminFriendsLoading(true);
    setAdminFriendsList([]);
    try {
      const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
      const token = btoa(JSON.stringify(payload));
      const res = await fetch(`${BACKEND_HTTP_URL}/profile/friends/admin?userId=${targetUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminFriendsList(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('[AdminFriends] Failed to fetch player friends:', e);
    } finally {
      setAdminFriendsLoading(false);
    }
  };

  const [adminSearchProfileId, setAdminSearchProfileId] = useState<string>('');
  const [isUserViewBoxOpen, setIsUserViewBoxOpen] = useState<boolean>(false);
  const [adminSearchHistoryId, setAdminSearchHistoryId] = useState<string>('');
  const [adminPlayerHistory, setAdminPlayerHistory] = useState<any[]>([]);
  const [adminHistoryLoading, setAdminHistoryLoading] = useState<boolean>(false);
  const [adminHistorySearched, setAdminHistorySearched] = useState<boolean>(false);
  const [copiedProfileId, setCopiedProfileId] = useState<boolean>(false);
  const [copiedIpAddress, setCopiedIpAddress] = useState<boolean>(false);

  const copyToClipboard = (text: string, type: 'id' | 'ip') => {
    navigator.clipboard.writeText(text);
    try { triggerSound('click'); } catch (e) {}
    if (type === 'id') {
      setCopiedProfileId(true);
      setTimeout(() => setCopiedProfileId(false), 1500);
    } else {
      setCopiedIpAddress(true);
      setTimeout(() => setCopiedIpAddress(false), 1500);
    }
  };

  const fetchPlayerHistory = async (playerId: string) => {
    if (!playerId.trim()) return;
    setAdminHistoryLoading(true);
    setAdminHistorySearched(true);
    try {
      const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
      const token = btoa(JSON.stringify(payload));
      const res = await fetch(`${BACKEND_HTTP_URL}/profile/history?userId=${encodeURIComponent(playerId.trim())}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminPlayerHistory(data);
      } else {
        setAdminPlayerHistory([]);
        showToast('Failed to load player history.', 'error');
      }
    } catch (e) {
      console.error('Error loading history:', e);
      setAdminPlayerHistory([]);
      showToast('Error connecting to backend for player history.', 'error');
    } finally {
      setAdminHistoryLoading(false);
    }
  };

  // Help & Support Form states
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);
  const [supportName, setSupportName] = useState<string>('');
  const [supportEmail, setSupportEmail] = useState<string>('');
  const [supportSubject, setSupportSubject] = useState<string>('');
  const [supportDescription, setSupportDescription] = useState<string>('');
  const [supportCaptchaChecked, setSupportCaptchaChecked] = useState<boolean>(false);
  const [isSubmittingSupport, setIsSubmittingSupport] = useState<boolean>(false);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => localStorage.getItem('pv_logged_in') === 'true');
  const [onboardingStep, setOnboardingStep] = useState<'none' | 'language' | 'terms'>(() => {
    const accepted = localStorage.getItem('pv_terms_accepted') === 'true';
    const loggedIn = localStorage.getItem('pv_logged_in') === 'true';
    if (loggedIn && !accepted) {
      return 'language';
    }
    return 'none';
  });
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [guestUser, setGuestUser] = useState(() => `PuzzleNovice_${Math.floor(100 + Math.random() * 900)}`);
  const [googleClientId, setGoogleClientId] = useState<string>('461095575207-2ljt296ann8tcomc4orbfagp74okh1qu.apps.googleusercontent.com');
  const [googleLoginLoading, setGoogleLoginLoading] = useState(false);
  const [isLiveDuelHubExpanded, setIsLiveDuelHubExpanded] = useState<boolean>(true);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const { loginUser, logoutUser } = useGame();

  useEffect(() => {
    if (isSupportOpen && userProfile) {
      setSupportName(userProfile.username || '');
      setSupportEmail(userProfile.email || '');
      setSupportSubject('');
      setSupportDescription('');
      setSupportCaptchaChecked(false);
    }
  }, [isSupportOpen, userProfile]);

  useEffect(() => {
    if (isMailboxOpen && isAdmin) {
      const fetchBanned = async () => {
        try {
          const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
          const token = btoa(JSON.stringify(payload));
          const res = await fetch(`${BACKEND_HTTP_URL}/profile/banned`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setBannedPlayersList(data);
          }
        } catch (e) {
          console.warn('[Mailbox] Failed to fetch banned players:', e);
        }
      };

      const fetchUsers = async () => {
        try {
          const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
          const token = btoa(JSON.stringify(payload));
          const res = await fetch(`${BACKEND_HTTP_URL}/profile/users`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setAdminUsersList(data);
          }
        } catch (e) {
          console.warn('[Mailbox] Failed to fetch users:', e);
        }
      };

      const fetchAnnouncementHistory = async () => {
        try {
          const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
          const token = btoa(JSON.stringify(payload));
          const res = await fetch(`${BACKEND_HTTP_URL}/profile/popup-announcements/all`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setAdminAnnouncementHistory(Array.isArray(data) ? data : []);
          }
        } catch (e) {
          console.warn('[Mailbox] Failed to fetch announcement history:', e);
        }
      };

      fetchBanned();
      fetchUsers();
      fetchAnnouncementHistory();
    }
  }, [isMailboxOpen, isAdmin]);

  useEffect(() => {
    if (!isProfileLoaded || !userProfile?.id) return;
    const checkBanStatus = async () => {
      try {
        const res = await fetch(`${BACKEND_HTTP_URL}/profile/banned`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.bannedProfileIds && Array.isArray(data.bannedProfileIds)) {
            if (data.bannedProfileIds.includes(userProfile.id)) {
              setIsUserBanned(true);
              const reason = (data.banReasons && data.banReasons[userProfile.id]) || 'No reason specified.';
              setUserBanReason(reason);

              // Locally inject a ban notification in mailbox so they see it
              const personalKey = `puzzle_verse_mailbox_${userProfile.id}`;
              const savedPersonal = localStorage.getItem(personalKey);
              let localMails: any[] = [];
              if (savedPersonal) {
                try {
                  localMails = JSON.parse(savedPersonal);
                } catch (e) {
                  localMails = [];
                }
              }
              const banMailId = `ban_mail_${userProfile.id}`;
              if (!localMails.some((m: any) => m.id === banMailId)) {
                const newMail = {
                  id: banMailId,
                  type: 'announcement',
                  title: '📢 Account Suspended / Banned',
                  content: `Your account has been banned. Reason: ${reason}`,
                  claimed: false,
                  date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                };
                localMails.unshift(newMail);
                localStorage.setItem(personalKey, JSON.stringify(localMails));
                setMailboxItems(localMails);
                setUnreadMailCount(localMails.filter((m: any) => !m.claimed).length);
              }
            } else {
              setIsUserBanned(false);
              setUserBanReason('');
            }
          }
        }
      } catch (e) {
        console.warn('Failed to check ban status on server:', e);
      }
    };
    checkBanStatus();
    const interval = setInterval(checkBanStatus, 30000);
    return () => clearInterval(interval);
  }, [isProfileLoaded, userProfile?.id]);

  useEffect(() => {
    if (!isProfileLoaded || !userProfile?.id) return;
    const personalKey = `puzzle_verse_mailbox_${userProfile.id}`;
    const savedPersonal = localStorage.getItem(personalKey);
    let personalItems: any[] = [];
    if (savedPersonal) {
      try {
        personalItems = JSON.parse(savedPersonal);
      } catch (e) {
        personalItems = [];
      }
    } else {
      personalItems = [
        {
          id: 'mail_01',
          type: 'announcement',
          title: '📢 System Update v1.2',
          content: 'Welcome to PuzzleVerse! Enjoy our new real-time multiplayer 1v1 arenas, customizer store, and mutual friends list. Let the match begin!',
          claimed: false,
          date: 'July 15, 2026'
        },
        {
          id: 'mail_02',
          type: 'gift',
          title: '💎 Admin Welcome Gift',
          content: 'Claim your free gems and coins package to start purchasing frames and name colors!',
          rewardCoins: 1000,
          rewardGems: 100,
          claimed: false,
          date: 'July 15, 2026'
        }
      ];
    }

    const savedGlobal = localStorage.getItem('puzzle_verse_global_mailbox');
    let globalItems: any[] = [];
    if (savedGlobal) {
      try {
        globalItems = JSON.parse(savedGlobal);
      } catch (e) {
        globalItems = [];
      }
    }

    let modified = false;
    globalItems.forEach(globalItem => {
      if (!personalItems.some(item => item.id === globalItem.id)) {
        personalItems.unshift(globalItem);
        modified = true;
      }
    });

    if (modified || !savedPersonal) {
      localStorage.setItem(personalKey, JSON.stringify(personalItems));
    }

    setMailboxItems(personalItems);
    const unclaimedCount = personalItems.filter(item => !item.claimed).length;
    setUnreadMailCount(unclaimedCount);

    // Poll server-side mailbox
    const checkMailbox = async () => {
      try {
        const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
        const token = btoa(JSON.stringify(payload));
        const res = await fetch(`${BACKEND_HTTP_URL}/profile/mailbox`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.status === 401) {
          const errData = await res.json().catch(() => ({}));
          if (errData.message && errData.message.includes('deleted')) {
            showToast("⚠️ Your account has been deleted by an administrator.", 'error');
            localStorage.removeItem('pv_logged_in');
            localStorage.removeItem('pv_terms_accepted');
            setIsLoggedIn(false);
            logoutUser();
            return;
          }
        }
        if (res.ok) {
          const data = await res.json();
          setMailboxItems(data);
          const newUnclaimedCount = data.filter((item: any) => !item.claimed).length;
          setUnreadMailCount(newUnclaimedCount);
          localStorage.setItem(personalKey, JSON.stringify(data));
        }
      } catch (e) {
        console.warn('[Mailbox] Backend pull failed, using local storage:', e);
      }
    };

    const checkPopupAnnouncements = async () => {
      try {
        const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
        const token = btoa(JSON.stringify(payload));
        const res = await fetch(`${BACKEND_HTTP_URL}/profile/popup-announcements`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            const savedDismissed = localStorage.getItem('puzzle_verse_dismissed_announcements');
            const dismissedIds: string[] = savedDismissed ? JSON.parse(savedDismissed) : [];
            const active = list.find(ann => !dismissedIds.includes(ann.id));
            if (active) {
              setCurrentDisplayPopup(active);
            } else {
              setCurrentDisplayPopup(null);
            }
          }
        }
      } catch (e) {
        console.warn('[PopupAnnouncements] Failed to fetch:', e);
      }
    };

    checkMailbox();
    checkPopupAnnouncements();
    const interval = setInterval(() => {
      checkMailbox();
      checkPopupAnnouncements();
    }, 3000);
    return () => clearInterval(interval);
  }, [userProfile?.id, isProfileLoaded]);

  // Real-time Matchmaking Queues connection
  useEffect(() => {
    if (!isLoggedIn || !userProfile?.id) {
      if (lobbyRoomRef.current) {
        lobbyRoomRef.current.leave();
        lobbyRoomRef.current = null;
      }
      return;
    }

    let isSubscribed = true;
    let reconnectTimeout: any = null;

    const fetchInitialQueues = async () => {
      try {
        const res = await fetch(`${BACKEND_HTTP_URL}/profile/matchmaking/queues`);
        if (res.ok) {
          const counts = await res.json();
          if (isSubscribed && counts) {
            setMatchmakingQueues(counts);
          }
        }
      } catch (e) {
        console.warn("[Lobby] Failed to fetch initial queues:", e);
      }
    };

    const connectLobby = async () => {
      try {
        console.log("[Lobby] Connecting to lobby_room...");
        const room = await colyseusClient.joinOrCreate("lobby_room", {
          userId: userProfile.id
        });
        
        if (!isSubscribed) {
          room.leave();
          return;
        }

        lobbyRoomRef.current = room;
        console.log("[Lobby] Connected to lobby_room:", room.roomId);

        room.onMessage("queue_update", (counts: Record<string, number>) => {
          if (isSubscribed && counts) {
            console.log("[Lobby] Queue count update received:", counts);
            setMatchmakingQueues(counts);
          }
        });

        room.onLeave((code) => {
          console.log("[Lobby] Left lobby_room. Code:", code);
          lobbyRoomRef.current = null;
          if (isSubscribed) {
            reconnectTimeout = setTimeout(connectLobby, 5000);
          }
        });

      } catch (e) {
        console.warn("[Lobby] Lobby connection failed:", e);
        if (isSubscribed) {
          reconnectTimeout = setTimeout(connectLobby, 5000);
        }
      }
    };

    fetchInitialQueues();
    connectLobby();

    return () => {
      isSubscribed = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (lobbyRoomRef.current) {
        lobbyRoomRef.current.leave();
        lobbyRoomRef.current = null;
      }
    };
  }, [isLoggedIn, userProfile?.id]);

  const handleGuestLogin = () => {
    if (!guestUser.trim()) {
      showToast(t('error_username_empty'), 'error');
      return;
    }
    triggerSound('success');
    const guestId = '20' + Math.floor(1000000000 + Math.random() * 9000000000);
    loginUser(guestId, guestUser.trim());
    localStorage.setItem('pv_logged_in', 'true');
    setIsLoggedIn(true);
    if (localStorage.getItem('pv_terms_accepted') !== 'true') {
      setLanguage('English');
      setOnboardingStep('language');
    } else {
      setOnboardingStep('none');
    }
  };

  // --- Real Google Sign-In: Fetch client ID and load GIS script ---
  useEffect(() => {
    fetch(`${BACKEND_HTTP_URL}/auth/google-client-id`)
      .then(r => r.json())
      .then(data => {
        const cid = data.googleClientId || '';
        setGoogleClientId(cid);
        if (cid) {
          // Dynamically load Google Identity Services script
          const existingScript = document.getElementById('google-gsi-script');
          if (!existingScript) {
            const script = document.createElement('script');
            script.id = 'google-gsi-script';
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => {
              initializeGoogleButton(cid);
            };
            document.head.appendChild(script);
          } else {
            // Script already loaded (e.g. hot reload)
            initializeGoogleButton(cid);
          }
        }
      })
      .catch(() => setGoogleClientId(''));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeGoogleButton = (clientId: string) => {
    const g = (window as any).google;
    if (!g || !g.accounts || !googleButtonRef.current) {
      // GIS not ready yet, retry in 200ms
      setTimeout(() => initializeGoogleButton(clientId), 200);
      return;
    }
    g.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredentialResponse,
    });
    g.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'outline',
      size: 'large',
      width: googleButtonRef.current.offsetWidth || 300,
      text: 'signin_with',
      shape: 'pill',
    });
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response.credential) {
      showToast('Google Sign-In failed. Please try again.', 'error');
      return;
    }
    setGoogleLoginLoading(true);
    try {
      const res = await fetch(`${BACKEND_HTTP_URL}/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential }),
      });
      if (res.ok) {
        const data = await res.json();
        triggerSound('success');
        loginUser(data.userId, data.profile.username, data.profile.email, data.profile);
        localStorage.setItem('pv_logged_in', 'true');
        setIsLoggedIn(true);
        if (localStorage.getItem('pv_terms_accepted') !== 'true') {
          setLanguage('English');
          setOnboardingStep('language');
        } else {
          setOnboardingStep('none');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.message || 'Google Sign-In failed. Please try again.', 'error');
      }
    } catch (e: any) {
      console.error('[GoogleLogin] Real Google Sign-In failed:', e);
      showToast(t('error_network_backend'), 'error');
    } finally {
      setGoogleLoginLoading(false);
    }
  };


  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNickname.trim()) {
      showToast("Nickname is required.", 'error');
      return;
    }
    if (reportReason === 'Other' && !reportDescription.trim()) {
      showToast("Detailed description is required when 'Other' is selected.", 'error');
      return;
    }

    setIsSubmittingReport(true);
    try {
      const payload = {
        reportingProfileId: userProfile?.id || 'unknown',
        opponentProfileId: matchResult?.opponentId || 'unknown',
        opponentNickname: matchResult?.opponentName || 'unknown',
        nickname: reportNickname.trim(),
        reason: reportReason,
        description: reportReason === 'Other' ? reportDescription.trim() : undefined,
        sessionId: roomRef.current?.roomId || undefined
      };

      const authPayload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
      const token = btoa(JSON.stringify(authPayload));

      console.log('[Report] Submitting report to:', `${BACKEND_HTTP_URL}/profile/report`);
      const res = await fetch(`${BACKEND_HTTP_URL}/profile/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast("Report Submitted. Thank you for helping keep Cognerix safe.", 'success');
        setIsReportModalOpen(false);
        setReportDescription('');
        setReportReason('Violence in Chat');
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(`Failed to submit report: ${errData.message || 'Server error'}`, 'error');
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      showToast("Failed to submit report. Please check your network connection and try again.", 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const triggerPlayerEmoji = (emoji: string) => {
    if (opponentInfo) {
      const oppId = opponentInfo.id || '';
      const isBlocked = oppId && (
        (roomBlocksRef.current[userProfile.id] || []).includes(oppId) ||
        (roomBlocksRef.current[oppId] || []).includes(userProfile.id)
      );
      if (isBlocked) {
        showToast("Emojis are disabled because one of you has blocked the other.", 'error');
        return;
      }
    }

    if (roomRef.current) {
      MultiplayerService.sendEmoji(roomRef.current, emoji);
    } else {
      setPlayerEmojiBubble(emoji);
      if (playerEmojiTimeoutRef.current) clearTimeout(playerEmojiTimeoutRef.current);
      playerEmojiTimeoutRef.current = setTimeout(() => {
        setPlayerEmojiBubble(null);
      }, 2500);

      if (opponentInfo && Math.random() > 0.5) {
        setTimeout(() => {
          const reactions = ["😊", "😂", "🤣", "😒", "👍", "🤷‍♂️", "🤷‍♀️", "😉", "😎", "🤖"];
          const botEmoji = reactions[Math.floor(Math.random() * reactions.length)];
          triggerOpponentEmoji(botEmoji);
        }, 1000);
      }
    }
  };

  const triggerOpponentEmoji = (emoji: string) => {
    if (opponentInfo) {
      const oppId = opponentInfo.id || '';
      const isBlocked = oppId && (
        (roomBlocksRef.current[userProfile.id] || []).includes(oppId) ||
        (roomBlocksRef.current[oppId] || []).includes(userProfile.id)
      );
      if (isBlocked) return;
    }
    setOpponentEmojiBubble(emoji);
    if (opponentEmojiTimeoutRef.current) clearTimeout(opponentEmojiTimeoutRef.current);
    opponentEmojiTimeoutRef.current = setTimeout(() => {
      setOpponentEmojiBubble(null);
    }, 2500);
  };

  useEffect(() => {
    if (activeGame && opponentInfo && selectedDifficultyRef.current !== 'online') {
      if (playerProgress >= 40 && !botReactedThresholds.current[40]) {
        botReactedThresholds.current[40] = true;
        triggerOpponentEmoji(Math.random() > 0.5 ? "😒" : "🤦‍♂️");
      } else if (playerProgress >= 75 && !botReactedThresholds.current[75]) {
        botReactedThresholds.current[75] = true;
        triggerOpponentEmoji(Math.random() > 0.5 ? "😨" : "🤷‍♂️");
      } else if (playerProgress >= 90 && !botReactedThresholds.current[90]) {
        botReactedThresholds.current[90] = true;
        triggerOpponentEmoji(Math.random() > 0.5 ? "🤯" : "😢");
      }
    }
  }, [playerProgress, activeGame, opponentInfo]);

  const [matchResult, setMatchResult] = useState<{ isWinner: boolean; winnerName: string; opponentName?: string; opponentNameColor?: string; opponentBadges?: string[]; opponentId?: string; forfeit?: boolean; isSolo?: boolean; isDisconnect?: boolean; bothDefeated?: boolean; triviaDetails?: { playerCorrect: number; opponentCorrect: number } } | null>(null);
  const [delayedMatchResult, setDelayedMatchResult] = useState<any>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Confetti Launcher Effect & Match Result Sounds
  useEffect(() => {
    if (matchResult) {
      if (matchResult !== lastPlayedMatchResultRef.current) {
        lastPlayedMatchResultRef.current = matchResult;
        triggerSound(matchResult.isWinner ? 'victory' : 'defeat');
      }
    } else {
      lastPlayedMatchResultRef.current = null;
    }

    if (matchResult && matchResult.isWinner && confettiCanvasRef.current) {
      const canvasEl = confettiCanvasRef.current;
      const ctx = canvasEl.getContext('2d');
      if (!ctx) return;
      canvasEl.width = window.innerWidth;
      canvasEl.height = window.innerHeight;

      const particles: Array<{
        x: number;
        y: number;
        size: number;
        color: string;
        speedX: number;
        speedY: number;
        rotation: number;
        rotationSpeed: number;
      }> = [];

      const colors = ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

      for (let i = 0; i < 150; i++) {
        particles.push({
          x: Math.random() * canvasEl.width,
          y: Math.random() * canvasEl.height - canvasEl.height,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          speedX: Math.random() * 4 - 2,
          speedY: Math.random() * 5 + 3,
          rotation: Math.random() * 360,
          rotationSpeed: Math.random() * 4 - 2
        });
      }

      let animationFrameId: number;

      const update = () => {
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        let active = false;

        particles.forEach(p => {
          p.y += p.speedY;
          p.x += p.speedX;
          p.rotation += p.rotationSpeed;

          if (p.y < canvasEl.height) {
            active = true;
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        });

        if (active) {
          animationFrameId = requestAnimationFrame(update);
        }
      };

      update();

      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    }
  }, [matchResult]);

  // Accessibility States
  const [colorBlindMode, setColorBlindMode] = useState<'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'>('none');

  // Watch profile changes for leveling up sounds and notification modal
  const prevLevelRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isProfileLoaded) return;

    if (prevLevelRef.current === null) {
      prevLevelRef.current = userProfile.level;
      return;
    }

    if (userProfile.level > prevLevelRef.current) {
      synthSound('levelUp', isMuted, soundVolume);
      setShowLevelUpModal(userProfile.level);
      prevLevelRef.current = userProfile.level;
    } else if (userProfile.level < prevLevelRef.current) {
      prevLevelRef.current = userProfile.level;
    }
  }, [userProfile.level, isProfileLoaded, isMuted, soundVolume]);

  // Audio helper local wrapper
  const triggerSound = (type: 'click' | 'success' | 'fail' | 'levelUp' | 'correct' | 'search' | 'slide' | 'sudoku' | 'logic' | 'jigsaw' | 'slingshot' | 'bluster' | 'block_place' | 'wind' | 'wind_alert' | 'check' | 'victory' | 'defeat') => {
    synthSound(type, isMuted, soundVolume);
  };

  const handleTabChange = (tab: typeof activeTab) => {
    triggerSound('click');
    setActiveTab(tab);
    setIsSidebarOpen(false);
    if (tab === 'home' && activeGame) {
      setIsGameHidden(false);
    }
    if (tab === 'leaderboard') {
      refreshLeaderboard();
    }
  };

  const sendFriendRequestToServer = async (friendUsername?: string, friendId?: string) => {
    if (!userProfile) return { success: false };
    try {
      const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
      const token = btoa(JSON.stringify(payload));
      const res = await fetch(`${BACKEND_HTTP_URL}/profile/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ friendUsername, friendId })
      });

      if (res.ok) {
        triggerSound('success');
        if (friendId) {
          setSentRequests(prev => {
            const next = new Set(prev);
            next.add(friendId);
            return next;
          });
        }
        return { success: true };
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Failed to send friend request.');
      }
    } catch (e: any) {
      console.error('[Friends] Send request failed:', e);
      showToast(e.message || 'Server error sending friend request.', 'error');
      return { success: false, error: e.message };
    }
  };

  const handleCloseChat = async () => {
    if (!activeChatFriend || !userProfile) return;
    const friendId = activeChatFriend.id;
    triggerSound('click');
    setActiveChatFriend(null);
    setChatHistory([]);
    setFriendChatInput('');

    try {
      const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
      const token = btoa(JSON.stringify(payload));
      await fetch(`${BACKEND_HTTP_URL}/profile/friends/chat/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ friendId })
      });
    } catch (e) {
      console.error('[Friends] Clear chat failed on close:', e);
    }
  };


  // Close active puzzle board
  // skipRoomLeave: when called from game_over handler, we leave the room separately
  //                to avoid onLeave racing with state updates
  const closeGame = (skipRoomLeave = false, isQuit = false, skipMatchResult = false) => {
    triggerSound('click');
    setRoomBlocks({});
    roomBlocksRef.current = {};
    const endedGame = activeGame;

    if (matchmakingState === 'playing' && !skipRoomLeave && roomRef.current) {
      if (delayedMatchResult) {
        if (!skipMatchResult) {
          setMatchResult(delayedMatchResult);
        }
        setDelayedMatchResult(null);
        roomRef.current.leave();
        roomRef.current = null;
        setMatchmakingState('idle');
        setActiveGame(null);
        setIsGameHidden(false);
        return;
      }

      if (!skipMatchResult) {
        setMatchResult({
          isWinner: false,
          winnerName: opponentNameRef.current,
          opponentName: opponentNameRef.current,
          opponentNameColor: opponentInfo?.nameColor,
          opponentBadges: opponentInfo?.badges,
          opponentId: opponentIdRef.current,
          forfeit: true
        });
      }
      roomRef.current.leave();
      roomRef.current = null;
      setMatchmakingState('idle');
      setActiveGame(null);
      setIsGameHidden(false);
      return;
    }

    if (delayedMatchResult) {
      if (!skipMatchResult) {
        setMatchResult(delayedMatchResult);
      }
      setDelayedMatchResult(null);
    } else if (!roomRef.current && !matchResult) {
      if (isQuit) {
        // Do not set matchResult, just return player to Choose Game Mode screen.
      } else if (opponentInfo) {
        // Local AI Bot game results closure
        if (!skipMatchResult) {
          setMatchResult({
            isWinner: playerHasWonBotMatchRef.current,
            winnerName: playerHasWonBotMatchRef.current ? userProfile.username : opponentInfo.username,
            opponentName: opponentInfo.username,
            opponentNameColor: opponentInfo.nameColor,
            opponentBadges: opponentInfo.badges,
            opponentId: opponentIdRef.current || opponentInfo.id
          });
        }
      } else if (playerHasWonBotMatchRef.current) {
        // Practice/Solo win for any puzzle type
        if (!skipMatchResult) {
          setMatchResult({
            isWinner: true,
            winnerName: userProfile.username,
            isSolo: true
          });
        }
      }
    }

    setActiveGame(null);
    setIsGameHidden(false);
    if (!skipRoomLeave && roomRef.current) {
      roomRef.current.leave();
      roomRef.current = null;
    }
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
    }
    if (matchSolveIntervalRef.current) {
      clearInterval(matchSolveIntervalRef.current);
      matchSolveIntervalRef.current = null;
    }
    setMatchmakingState('idle');
    setOpponentInfo(null);
    setQueuedPuzzle(null);
    setPlayerProgress(0);
    setPlayerCorrectCount(0);
    setPrivatePin(null);
    gameStartedRef.current = false;
    playerHasWonBotMatchRef.current = false;
    setCurrentRound(1);
    setPlayerRoundWins(0);
    setOpponentRoundWins(0);
    setRoundWinnerMessage(null);

    setPlayerEmojiBubble(null);
    setOpponentEmojiBubble(null);
    setChatMessages([]);
    setIsInGameChatOpen(false);
    setUnreadChatCount(0);
    setInGameChatPosition({ x: 0, y: 0 });
    if (playerEmojiTimeoutRef.current) clearTimeout(playerEmojiTimeoutRef.current);
    if (opponentEmojiTimeoutRef.current) clearTimeout(opponentEmojiTimeoutRef.current);
    botReactedThresholds.current = {};

    if (endedGame) {
      setDifficultyModal({ puzzleType: endedGame });
    }
  };

  const handleInGameChatMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isInGameChatDragging.current = true;
    inGameChatDragStart.current = {
      x: e.clientX - inGameChatPosition.x,
      y: e.clientY - inGameChatPosition.y
    };
  };

  const getBotSpeedConfig = (puzzleType: PuzzleType, mode: string) => {
    // Default values
    let tickRate = 1500;
    let solveMin = 3;
    let solveMax = 6;

    switch (puzzleType) {
      case PuzzleType.SUDOKU:
        if (mode === 'easy') {
          // Target: 200s (avgIncrement: 1.5, tickRate: 3000ms => 100/1.5 = 66 ticks * 3s = 198s)
          tickRate = 3000;
          solveMin = 1;
          solveMax = 2;
        } else if (mode === 'hard') {
          // Target: 90s (avgIncrement: 2.5, tickRate: 2200ms => 100/2.5 = 40 ticks * 2.2s = 88s)
          tickRate = 2200;
          solveMin = 2;
          solveMax = 3;
        } else { // medium
          // Target: 135s (avgIncrement: 2.0, tickRate: 2700ms => 100/2.0 = 50 ticks * 2.7s = 135s)
          tickRate = 2700;
          solveMin = 1;
          solveMax = 3;
        }
        break;

      case PuzzleType.JIGSAW:
        if (mode === 'easy') {
          // Target: 135s
          tickRate = 2700;
          solveMin = 1;
          solveMax = 3;
        } else if (mode === 'hard') {
          // Target: 60s
          tickRate = 1800;
          solveMin = 2;
          solveMax = 4;
        } else {
          // Target: 90s
          tickRate = 2200;
          solveMin = 2;
          solveMax = 3;
        }
        break;

      case PuzzleType.SLIDING:
        if (mode === 'easy') {
          // Target: 100s
          tickRate = 2500;
          solveMin = 2;
          solveMax = 3;
        } else if (mode === 'hard') {
          // Target: 45s
          tickRate = 1500;
          solveMin = 3;
          solveMax = 4;
        } else {
          // Target: 70s
          tickRate = 2100;
          solveMin = 2;
          solveMax = 4;
        }
        break;

      case PuzzleType.WORD_SEARCH:
        if (mode === 'easy') {
          // Target: 125s
          tickRate = 2500;
          solveMin = 1;
          solveMax = 3;
        } else if (mode === 'hard') {
          // Target: 52s
          tickRate = 1800;
          solveMin = 3;
          solveMax = 4;
        } else {
          // Target: 80s
          tickRate = 2000;
          solveMin = 2;
          solveMax = 3;
        }
        break;

      case PuzzleType.TOWER_BLOXX:
        if (mode === 'easy') {
          // Target: 120s
          tickRate = 2400;
          solveMin = 1;
          solveMax = 3;
        } else if (mode === 'hard') {
          // Target: 60s
          tickRate = 1800;
          solveMin = 2;
          solveMax = 4;
        } else {
          // Target: 85s
          tickRate = 2100;
          solveMin = 2;
          solveMax = 3;
        }
        break;

      case PuzzleType.BLOCK_BLUSTER:
        if (mode === 'easy') {
          // Target: 135s
          tickRate = 2700;
          solveMin = 1;
          solveMax = 3;
        } else if (mode === 'hard') {
          // Target: 65s
          tickRate = 1900;
          solveMin = 2;
          solveMax = 4;
        } else {
          // Target: 95s
          tickRate = 2300;
          solveMin = 2;
          solveMax = 3;
        }
        break;

      case PuzzleType.WORD:
      case PuzzleType.LOGIC:
        if (mode === 'easy') {
          // Target: 95s
          tickRate = 2300;
          solveMin = 2;
          solveMax = 3;
        } else if (mode === 'hard') {
          // Target: 45s
          tickRate = 1500;
          solveMin = 3;
          solveMax = 4;
        } else {
          // Target: 65s
          tickRate = 1900;
          solveMin = 2;
          solveMax = 4;
        }
        break;

      case PuzzleType.EIGHT_BALL_QUIZ:
        if (mode === 'easy') {
          // Target: 50s
          tickRate = 2000;
          solveMin = 3;
          solveMax = 5;
        } else if (mode === 'hard') {
          // Target: 30s
          tickRate = 1500;
          solveMin = 4;
          solveMax = 6;
        } else {
          // Target: 40s
          tickRate = 1600;
          solveMin = 3;
          solveMax = 5;
        }
        break;

      case PuzzleType.PHYSICS:
        if (mode === 'easy') {
          // Target: 60s per round (avgIncrement: 4.0, tickRate: 2400ms)
          tickRate = 2400;
          solveMin = 3;
          solveMax = 5;
        } else if (mode === 'hard') {
          // Target: 25s per round (avgIncrement: 6.0, tickRate: 1500ms)
          tickRate = 1500;
          solveMin = 5;
          solveMax = 7;
        } else {
          // Target: 40s per round (avgIncrement: 5.0, tickRate: 2000ms)
          tickRate = 2000;
          solveMin = 4;
          solveMax = 6;
        }
        break;

      case PuzzleType.MENTAL_MATH:
        if (mode === 'easy') {
          // Target: 22s
          tickRate = 1100;
          solveMin = 4;
          solveMax = 6;
        } else if (mode === 'hard') {
          // Target: 12s
          tickRate = 900;
          solveMin = 6;
          solveMax = 9;
        } else {
          // Target: 17s
          tickRate = 1000;
          solveMin = 5;
          solveMax = 7;
        }
        break;

      default:
        if (mode === 'easy') {
          tickRate = 1800;
          solveMin = 1;
          solveMax = 4;
        } else if (mode === 'hard') {
          tickRate = 1500;
          solveMin = 4;
          solveMax = 8;
        } else {
          tickRate = 1500;
          solveMin = 3;
          solveMax = 6;
        }
    }

    return { tickRate, solveMin, solveMax };
  };

  const startOnlineFallbackBotSolver = (
    botName: string, 
    botCorrectCount: number, 
    pType: PuzzleType,
    passedSolveMin?: number,
    passedSolveMax?: number,
    passedTickRate?: number
  ) => {
    if (matchSolveIntervalRef.current) {
      clearInterval(matchSolveIntervalRef.current);
    }

    const diffMode = selectedDifficultyRef.current || 'medium';
    const config = getBotSpeedConfig(pType, diffMode);

    let tickRate = 1000;
    let avgIncrement = 1;
    let isOnlineFallback = diffMode === 'online';

    let solveMin = passedSolveMin !== undefined ? passedSolveMin : config.solveMin;
    let solveMax = passedSolveMax !== undefined ? passedSolveMax : config.solveMax;

    if (isOnlineFallback) {
      // AI Solve duration config: target random duration between 30 and 90 seconds
      const targetSeconds = Math.floor(Math.random() * (90 - 30 + 1)) + 30; // 30 to 90 seconds
      tickRate = 1000; // 1 second ticks
      avgIncrement = 100 / targetSeconds;
    } else {
      // Use config from getBotSpeedConfig
      tickRate = passedTickRate !== undefined ? passedTickRate : config.tickRate;
    }

    let botProgress = 0;
    matchSolveIntervalRef.current = setInterval(() => {
      const oldProg = botProgress;
      
      if (isOnlineFallback) {
        // Calculate random increment around avgIncrement to feel more human
        const variation = avgIncrement * 0.4;
        const increment = avgIncrement + (Math.random() * (variation * 2) - variation);
        botProgress += increment;
      } else {
        // Use standard range-based random increment
        botProgress += Math.floor(Math.random() * (solveMax - solveMin + 1)) + solveMin;
      }

      if (oldProg < 30 && botProgress >= 30) {
        const reactions = ["😂", "🤣", "😋", "✌️", "👌"];
        triggerOpponentEmoji(reactions[Math.floor(Math.random() * reactions.length)]);
      } else if (oldProg < 65 && botProgress >= 65) {
        const reactions = ["😎", "😁", "👍", "😉"];
        triggerOpponentEmoji(reactions[Math.floor(Math.random() * reactions.length)]);
      } else if (oldProg < 90 && botProgress >= 90) {
        const reactions = ["🤣", "😋", "🤖", "😎"];
        triggerOpponentEmoji(reactions[Math.floor(Math.random() * reactions.length)]);
      }

      if (botProgress >= 100) {
        botProgress = 100;
        clearInterval(matchSolveIntervalRef.current!);

        if (pType === PuzzleType.PHYSICS) {
          // Three rounds mode for online fallback bot
          setOpponentRoundWins(prevWins => {
            const newWins = prevWins + 1;
            if (newWins >= 2) {
              setMatchResult({
                isWinner: false,
                winnerName: botName,
                opponentId: opponentIdRef.current
              });
              closeGame();
            } else {
              setRoundWinnerMessage(`${botName} won this round!`);
              setCurrentRound(prevRound => prevRound + 1);
              setTimeout(() => {
                setRoundWinnerMessage(null);
                setGameSeed(Math.random().toString(36).substring(2, 10));
                setPlayerProgress(0);
                startOnlineFallbackBotSolver(botName, botCorrectCount, pType, solveMin, solveMax, tickRate);
              }, 3000);
            }
            return newWins;
          });
        } else if (pType === PuzzleType.MENTAL_MATH) {
          // Do not close the board immediately. The player has a 10s countdown to solve it.
        } else {
          setMatchResult({
            isWinner: false,
            winnerName: botName,
            opponentId: opponentIdRef.current
          });
          closeGame();
        }
      }

      setOpponentInfo(prev => prev ? { 
        ...prev, 
        progress: Math.min(100, Math.floor(botProgress)),
        correctAnswers: Math.min(botCorrectCount, Math.floor((Math.min(100, botProgress) / 100) * 5))
      } : null);
    }, tickRate);
  };

  const syncProfileWithServer = async (overrideProfile?: typeof userProfile) => {
    const profileToSync = overrideProfile || userProfile;
    if (!profileToSync || profileToSync.id.startsWith('90')) return;
    try {
      const payload = { userId: profileToSync.id, username: profileToSync.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
      const token = btoa(JSON.stringify(payload));
      
      const lastMutationTime = getLastLocalMutationTime ? getLastLocalMutationTime() : 0;
      const wasMutatedRecently = Date.now() - lastMutationTime < 5000;

      if (wasMutatedRecently || overrideProfile) {
        // --- PUSH LOCAL STATE TO SERVER ---
        // Calculate global score to sync as points (pts)
        const globalScore = leaderboard
          .filter(e => e.userId === profileToSync.id && e.puzzleType !== 'GLOBAL')
          .reduce((sum, entry) => sum + entry.score, 0);

        const res = await fetch(`${BACKEND_HTTP_URL}/profile/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...profileToSync,
            score: globalScore
          })
        });

        if (res.status === 401) {
          const errData = await res.json().catch(() => ({}));
          if (errData.message && errData.message.includes('deleted')) {
            showToast("⚠️ Your account has been deleted by an administrator.", 'error');
            localStorage.removeItem('pv_logged_in');
            localStorage.removeItem('pv_terms_accepted');
            setIsLoggedIn(false);
            logoutUser();
            return;
          }
        }

        if (res.ok) {
          const data = await res.json();
          if (data.deleted) {
            showToast("⚠️ Your account has been deleted by an administrator.", 'error');
            localStorage.removeItem('pv_logged_in');
            localStorage.removeItem('pv_terms_accepted');
            setIsLoggedIn(false);
            logoutUser();
            return;
          }
        }
      } else {
        // --- PULL SERVER STATE TO LOCAL ---
        const res = await fetch(`${BACKEND_HTTP_URL}/profile/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const serverProfile = await res.json();
          if (serverProfile) {
            const isDifferent = 
              serverProfile.coins !== profileToSync.coins ||
              serverProfile.gems !== profileToSync.gems ||
              serverProfile.level !== profileToSync.level ||
              serverProfile.xp !== profileToSync.xp ||
              serverProfile.avatar !== profileToSync.avatar ||
              serverProfile.frame !== profileToSync.frame ||
              serverProfile.status !== profileToSync.status ||
              serverProfile.nameColor !== profileToSync.nameColor ||
              JSON.stringify(serverProfile.inventory) !== JSON.stringify(profileToSync.inventory) ||
              JSON.stringify(serverProfile.badges) !== JSON.stringify(profileToSync.badges);

            if (isDifferent) {
              console.log("[Sync] Stale local profile detected; applying server profile states.");
              saveProfile({
                ...profileToSync,
                ...serverProfile
              });
            }
          }
        }
      }
    } catch (e) {
      console.error('[Friends] Profile sync failed:', e);
    }
  };

  const handleStorePurchaseSuccess = (type: 'coins' | 'gems', amount: number) => {
    const nextProfile = {
      ...userProfile,
      coins: userProfile.coins + (type === 'coins' ? amount : 0),
      gems: userProfile.gems + (type === 'gems' ? amount : 0)
    };
    saveProfile(nextProfile);
    syncProfileWithServer(nextProfile);
  };

  const fetchFriendsList = async () => {
    if (!userProfile) return;
    try {
      const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
      const token = btoa(JSON.stringify(payload));
      const response = await fetch(`${BACKEND_HTTP_URL}/profile/friends`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFriendsList(data);
      }
    } catch (e) {
      console.error('[Friends] Fetch failed:', e);
    }
  };

  useEffect(() => {
    if (isProfileLoaded && isLoggedIn && !userProfile.id.startsWith('90')) {
      syncProfileWithServer();
    }
  }, [userProfile, isProfileLoaded, isLoggedIn]);

  useEffect(() => {
    if (!userProfile) return;
    const checkIncomingChallenges = async () => {
      try {
        const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
        const token = btoa(JSON.stringify(payload));
        const res = await fetch(`${BACKEND_HTTP_URL}/profile/friends/challenges`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const challenge = data[0];
            setIncomingChallenge({
              sender: challenge.senderUsername,
              senderId: challenge.senderId,
              puzzleType: challenge.puzzleType,
              pin: challenge.pin
            });
          } else {
            setIncomingChallenge(null);
          }
        }
      } catch (e) {
        console.error('[Friends] Check incoming challenges failed:', e);
      }
    };

    const checkIncomingFriendRequests = async () => {
      try {
        const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
        const token = btoa(JSON.stringify(payload));
        const res = await fetch(`${BACKEND_HTTP_URL}/profile/friends/requests`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data)) {
            setFriendRequests(data);
          }
        }
      } catch (e) {
        console.error('[Friends] Check incoming friend requests failed:', e);
      }
    };

    checkIncomingChallenges();
    checkIncomingFriendRequests();
    const interval = setInterval(() => {
      checkIncomingChallenges();
      checkIncomingFriendRequests();
    }, 3000);
    return () => clearInterval(interval);
  }, [userProfile]);

  useEffect(() => {
    if (matchmakingState !== 'searching' || !privatePin || !userProfile) return;

    const checkSentChallengeStatus = async () => {
      try {
        const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
        const token = btoa(JSON.stringify(payload));
        const res = await fetch(`${BACKEND_HTTP_URL}/profile/friends/challenge/status?pin=${privatePin}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.status === 'declined') {
            showToast('Your duel challenge was declined by the opponent.', 'error');
            
            // Clean/delete backend challenge record
            fetch(`${BACKEND_HTTP_URL}/profile/friends/challenge/clear`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ senderId: userProfile.id })
            }).catch(e => console.error('[Friends] Clean challenge failed:', e));

            cancelMatchmaking();
          }
        }
      } catch (e) {
        console.error('[Friends] Check sent challenge status failed:', e);
      }
    };

    const interval = setInterval(checkSentChallengeStatus, 2000);
    return () => clearInterval(interval);
  }, [matchmakingState, privatePin, userProfile]);

  useEffect(() => {
    if (!activeChatFriend || !userProfile) return;

    const fetchChatHistory = async () => {
      try {
        const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
        const token = btoa(JSON.stringify(payload));
        const res = await fetch(`${BACKEND_HTTP_URL}/profile/friends/chat?friendId=${activeChatFriend.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setChatHistory(data);
        }
      } catch (e) {
        console.error('[Friends] Chat fetch failed:', e);
      }
    };

    fetchChatHistory();
    const interval = setInterval(fetchChatHistory, 2000);
    return () => clearInterval(interval);
  }, [activeChatFriend, userProfile]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isInGameChatDragging.current) return;
      setInGameChatPosition({
        x: e.clientX - inGameChatDragStart.current.x,
        y: e.clientY - inGameChatDragStart.current.y
      });
    };

    const handleMouseUp = () => {
      isInGameChatDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (activeChatFriend && activeTab === 'friends' && chatHistory.length > 0) {
      const maxTs = Math.max(...chatHistory.map(m => m.timestamp || 0));
      if (maxTs > (lastReadTimestamps.current[activeChatFriend.id] || 0)) {
        const updated = { ...lastReadTimestamps.current, [activeChatFriend.id]: maxTs };
        saveLastReadTimestamps(updated);
        setUnreadChats(prev => {
          if (prev[activeChatFriend.id]) {
            return { ...prev, [activeChatFriend.id]: false };
          }
          return prev;
        });
      }
    }
  }, [activeChatFriend, activeTab, chatHistory]);

  // Background check for unread messages from all friends
  useEffect(() => {
    if (!userProfile) return;

    const checkNewMessages = async () => {
      let currentFriends = friendsList;
      try {
        const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
        const token = btoa(JSON.stringify(payload));
        
        const fRes = await fetch(`${BACKEND_HTTP_URL}/profile/friends`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (fRes.ok) {
          const data = await fRes.json();
          currentFriends = data;
          setFriendsList(data);
        }
      } catch (e) {
        console.error('[Friends] Background fetch friends failed:', e);
      }

      for (const friend of currentFriends) {
        if (activeChatFriend && activeChatFriend.id === friend.id && activeTab === 'friends') {
          continue;
        }

        try {
          const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
          const token = btoa(JSON.stringify(payload));
          const res = await fetch(`${BACKEND_HTTP_URL}/profile/friends/chat?friendId=${friend.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              const maxTs = Math.max(...data.map((m: any) => m.timestamp || 0));
              const lastRead = lastReadTimestamps.current[friend.id] || 0;
              
              const latestMsg = data.reduce((latest: any, current: any) => 
                (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest, data[0]
              );
              
              if (maxTs > lastRead && latestMsg.senderId !== userProfile.id) {
                setUnreadChats(prev => {
                  if (!prev[friend.id]) {
                    return { ...prev, [friend.id]: true };
                  }
                  return prev;
                });
              }
            }
          }
        } catch (e) {
          console.error(`[Friends] Background chat check failed for ${friend.username}:`, e);
        }
      }
    };

    const interval = setInterval(checkNewMessages, 4000);
    checkNewMessages();
    return () => clearInterval(interval);
  }, [userProfile, activeChatFriend, activeTab, friendsList.length]);

  useEffect(() => {
    if (!userProfile) return;
    syncProfileWithServer();
    const interval = setInterval(syncProfileWithServer, 3000);
    return () => clearInterval(interval);
  }, [userProfile]);

  useEffect(() => {
    if (activeTab === 'friends' && userProfile) {
      fetchFriendsList();
      const interval = setInterval(fetchFriendsList, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab, userProfile]);

  // Matchmaking process connecting to Colyseus WebSocket Server
  const startMatchmaking = async (
    puzzleType: PuzzleType, 
    mode: 'online' | 'easy' | 'medium' | 'hard' | 'private_create' | 'private_join' = 'online',
    customPin?: string,
    isFriendChallenge = false
  ) => {
    triggerSound('click');
    setIsFriendChallengeDuel(isFriendChallenge);
    selectedDifficultyRef.current = mode;
    setQueuedPuzzle(puzzleType);
    setPlayerProgress(0);
    gameStartedRef.current = false;
    setCurrentRound(1);
    setPlayerRoundWins(0);
    setOpponentRoundWins(0);
    setRoundWinnerMessage(null);

    if (mode !== 'online' && mode !== 'private_create' && mode !== 'private_join') {
      // Instant Bot Match
      setMatchmakingState('playing');
      setActiveGame(puzzleType);
      recordGamePlay(puzzleType);
      setGameSeed(Math.random().toString(36).substring(2, 10));
      
      let botCorrect = 3;
      if (mode === 'easy') {
        botCorrect = Math.floor(Math.random() * 3) + 1; // 1-3
      } else if (mode === 'medium') {
        botCorrect = Math.floor(Math.random() * 3) + 2; // 2-4
      } else if (mode === 'hard') {
        botCorrect = Math.floor(Math.random() * 3) + 3; // 3-5
      }
      setBotTriviaCorrect(botCorrect);
      triggerSound('success');

      const bots = ['LogicSage', 'ViteFast', 'GridMaster9', 'SudokuDemon'];
      const botName = `${bots[Math.floor(Math.random() * bots.length)]} (${mode.toUpperCase()})`;
      const ranks = [RankName.BRONZE, RankName.SILVER, RankName.GOLD, RankName.PLATINUM, RankName.DIAMOND, RankName.MASTER];
      const botRank = ranks[Math.floor(Math.random() * ranks.length)];

      let aiMode = undefined;
      if (puzzleType === PuzzleType.SLIDING || puzzleType === PuzzleType.JIGSAW) {
        if (mode === 'easy') {
          aiMode = Math.random() < 0.5 ? '3x3' : '4x4';
        } else if (mode === 'medium') {
          const rand = Math.random();
          if (rand < 0.33) {
            aiMode = '3x3';
          } else if (rand < 0.66) {
            aiMode = '4x4';
          } else {
            aiMode = '6x6';
          }
        } else if (mode === 'hard') {
          aiMode = '6x6';
        }
      }

      const botId = `bot_${botName.replace(/\s/g, '_').toLowerCase()}_${Math.floor(Math.random() * 10000)}`;
      opponentIdRef.current = botId;
      opponentNameRef.current = botName;
      setOpponentInfo({ id: botId, username: botName, rank: botRank, progress: 0, aiMode });

      setTimeout(() => {
        const starts = ["🤖", "😎", "😊", "👍", "😁", "😉"];
        triggerOpponentEmoji(starts[Math.floor(Math.random() * starts.length)]);
      }, 2000);

      // Bot speed scaling depending on difficulty
      let tickRate = 1500;
      let solveMin = 3;
      let solveMax = 6;
      if (mode === 'easy') {
        tickRate = 1800;
        solveMin = 1;
        solveMax = 4;
      } else if (mode === 'hard') {
        tickRate = 1500;
        solveMin = 4;
        solveMax = 8;
      }

      startOnlineFallbackBotSolver(botName, botCorrect, puzzleType, solveMin, solveMax, tickRate);

      return;
    }

    // Otherwise, real online matchmaking
    setMatchmakingState('searching');
    setMatchmakingTimer(0);
    
    // Play radar sweeping sounds
    let searchTick = 0;
    searchIntervalRef.current = setInterval(() => {
      searchTick += 1;
      setMatchmakingTimer(searchTick);
      if (searchTick % 2 === 0) triggerSound('search');
    }, 1000);

    try {
      let room: any;
      if (mode === 'private_create') {
        const pin = customPin || Math.floor(1000 + Math.random() * 9000).toString();
        setPrivatePin(pin);
        room = await MultiplayerService.joinPrivateRoom(userProfile.id, userProfile.username, puzzleType, pin, true, userProfile.nameColor, userProfile.badges, userProfile.rank, userProfile.avatar, userProfile.frame);
      } else if (mode === 'private_join') {
        const pin = customPin || "";
        setPrivatePin(pin);
        room = await MultiplayerService.joinPrivateRoom(userProfile.id, userProfile.username, undefined, pin, false, userProfile.nameColor, userProfile.badges, userProfile.rank, userProfile.avatar, userProfile.frame);
      } else {
        room = await MultiplayerService.joinDuel(userProfile.id, userProfile.username, puzzleType, userProfile.nameColor, userProfile.badges, userProfile.rank, userProfile.avatar, userProfile.frame);
      }
      roomRef.current = room;

      room.onLeave((code: number) => {
        console.log("Left matchmaking room. Code:", code);
        roomRef.current = null;
        
        if (isIntentionalLeaveRef.current) {
          isIntentionalLeaveRef.current = false;
          console.log("[Lobby] Intentional fallback leave. Skipping error handler.");
          return;
        }
        
        // If we are currently playing or waiting for opponent, and the match hasn't resolved yet:
        // this is an unexpected disconnection!
        setMatchmakingState((current) => {
          if (current === 'playing' || current === 'waiting_opponent') {
            setMatchResult({
              isWinner: false,
              winnerName: opponentNameRef.current,
              opponentName: opponentNameRef.current,
              opponentId: opponentIdRef.current,
              isDisconnect: true
            });
            // Reset active board view without calling room.leave() again
            closeGame(true);
          }
          return 'idle';
        });
      });

      // Handle room events
      room.onStateChange((state: any) => {
        try {
          // Find opponent in state players map safely
          let opponent: any = null;
          if (state && state.players) {
            const players = state.players;
            if (typeof players.forEach === 'function') {
              players.forEach((player: any, sessionId: string) => {
                if (sessionId !== room.sessionId) {
                  opponent = player;
                }
              });
            } else if (typeof players.keys === 'function') {
              for (const key of (Array.from(players.keys()) as any[])) {
                if (key !== room.sessionId) {
                  opponent = typeof players.get === 'function' ? players.get(key) : (players as any)[key];
                }
              }
            } else {
              for (const key of Object.keys(players)) {
                if (key !== room.sessionId) {
                  opponent = (players as any)[key];
                }
              }
            }
          }

          if (opponent) {
            setOpponentInfo({
              id: opponent.id || '',
              username: opponent.username,
              rank: opponent.rank || RankName.BRONZE,
              progress: opponent.progress,
              nameColor: opponent.nameColor || undefined,
              badges: opponent.badges ? opponent.badges.split(',') : []
            });
          }

          if (state) {
            if (state.triviaPauseTimerLeft !== undefined) {
              setTriviaPauseTimerLeft(state.triviaPauseTimerLeft);
            }
            if (state.currentRound !== undefined) {
              setCurrentRound(state.currentRound);
            }
            
            let me: any = null;
            if (state.players && typeof state.players.get === 'function') {
              me = state.players.get(room.sessionId);
            } else if (state.players) {
              me = state.players[room.sessionId];
            }
            if (me && me.roundWins !== undefined) {
              setPlayerRoundWins(me.roundWins);
            }
            if (opponent && opponent.roundWins !== undefined) {
              setOpponentRoundWins(opponent.roundWins);
            }
          }

          if (state.status === "PLAYING" && roomRef.current && !gameStartedRef.current) {
            // Only handle this if puzzle_start hasn't already started the game.
            // This is a fallback for edge cases; the authoritative start is via puzzle_start message.
            gameStartedRef.current = true;
            if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
            setGameSeed(state.puzzleSeed || roomRef.current.roomId);
            setMatchmakingState('playing');
            setActiveGame(state.puzzleType as PuzzleType);
            recordGamePlay(state.puzzleType as PuzzleType);
            triggerSound('success');
          }
        } catch (err) {
          console.error("[Colyseus] Error in onStateChange callback:", err);
        }
      });

      room.onMessage("emoji_receive", (data: { senderId: string, username: string, emoji: string }) => {
        // Block check
        const isBlocked = (roomBlocksRef.current[userProfile.id] || []).includes(data.senderId) ||
                          (roomBlocksRef.current[data.senderId] || []).includes(userProfile.id);
        if (isBlocked) return;

        if (data.senderId === userProfile.id) {
          setPlayerEmojiBubble(data.emoji);
          if (playerEmojiTimeoutRef.current) clearTimeout(playerEmojiTimeoutRef.current);
          playerEmojiTimeoutRef.current = setTimeout(() => setPlayerEmojiBubble(null), 2500);
        } else {
          setOpponentEmojiBubble(data.emoji);
          if (opponentEmojiTimeoutRef.current) clearTimeout(opponentEmojiTimeoutRef.current);
          opponentEmojiTimeoutRef.current = setTimeout(() => setOpponentEmojiBubble(null), 2500);
        }
      });

      room.onMessage("round_over", (data: { winnerId: string; winnerName: string; round: number }) => {
        const isWinner = data.winnerId === userProfile.id;
        triggerSound(isWinner ? 'success' : 'fail');
        setRoundWinnerMessage(isWinner ? "You won this round!" : `${data.winnerName} won this round!`);
        if (isWinner) {
          setPlayerRoundWins(prev => prev + 1);
        } else {
          setOpponentRoundWins(prev => prev + 1);
        }
      });

      room.onMessage("new_round", (data: { seed: string; round: number }) => {
        setRoundWinnerMessage(null);
        setGameSeed(data.seed);
        setCurrentRound(data.round);
        setPlayerProgress(0);
      });

      room.onMessage("game_over", (data: { winnerId: string; winnerName: string; forfeit?: boolean; scores?: any[]; bothDefeated?: boolean }) => {
        const isWinner = !data.bothDefeated && data.winnerId === userProfile.id;

        // Capture opponent name from ref
        const savedOpponentName = opponentNameRef.current;

        let triviaDetails = undefined;
        // Use `puzzleType` (the startMatchmaking parameter) instead of `activeGame`/`queuedPuzzle`
        // state variables, which are stale closures from when the room was created.
        if (puzzleType === PuzzleType.EIGHT_BALL_QUIZ) {
          const myScore = data.scores?.find(s => s.userId === userProfile.id);
          const opScore = data.scores?.find(s => s.userId !== userProfile.id);
          
          triviaDetails = {
            playerCorrect: myScore ? myScore.correctAnswers : 0,
            opponentCorrect: opScore ? opScore.correctAnswers : 0
          };
        }

        const resultPayload = {
          isWinner,
          winnerName: data.winnerName,
          opponentName: savedOpponentName,
          opponentNameColor: opponentInfo?.nameColor,
          opponentBadges: opponentInfo?.badges,
          opponentId: opponentIdRef.current,
          forfeit: data.forfeit,
          triviaDetails,
          bothDefeated: data.bothDefeated
        };

        if (puzzleType === PuzzleType.MENTAL_MATH && !data.forfeit) {
          setDelayedMatchResult(resultPayload);
          if (isWinner) {
            // Standard online rewards (+50 coins, +5 Gems, +50 XP)
            recordGameWin(PuzzleType.MENTAL_MATH, 60, 150, 50, 5, 50);
          }
          return;
        }

        setMatchResult(resultPayload);
        
        if (isWinner) {
          // Standard online rewards (+50 coins, +5 Gems, +50 XP)
          recordGameWin(puzzleType, 60, 150, 50, 5, 50);
        }

        // Close the game board but skip room.leave() to avoid onLeave race;
        // then leave the room separately after state is settled
        closeGame(true);
        setTimeout(() => {
          if (roomRef.current) {
            roomRef.current.leave();
            roomRef.current = null;
          }
        }, 100);
      });

      room.onMessage("match_found", (data: { opponent: any; countdown: number }) => {
        console.log("Match Found! Opponent:", data.opponent?.username);
        if (searchIntervalRef.current) {
          clearInterval(searchIntervalRef.current);
          searchIntervalRef.current = null;
        }
        if (data.opponent) {
          opponentNameRef.current = data.opponent.username;
          opponentIdRef.current = data.opponent.id || '';
          setOpponentInfo({
            id: data.opponent.id,
            username: data.opponent.username,
            rank: data.opponent.rank || RankName.BRONZE,
            progress: 0,
            nameColor: data.opponent.nameColor,
            badges: data.opponent.badges,
            avatar: data.opponent.avatar,
            frame: data.opponent.frame
          });
        }
        setLobbyCountdown(data.countdown);
        setChatMessages([]);
        setMatchmakingState('found');
      });

      room.onMessage("lobby_countdown", (data: { countdown: number }) => {
        setLobbyCountdown(data.countdown);
      });

      room.onMessage("chat_receive", (data: { senderId: string; username: string; text: string; timestamp: number }) => {
        // Block check
        const isBlocked = (roomBlocksRef.current[userProfile.id] || []).includes(data.senderId) ||
                          (roomBlocksRef.current[data.senderId] || []).includes(userProfile.id);
        if (isBlocked) return;

        setChatMessages(prev => [...prev, data]);
        triggerSound('click');
        setIsInGameChatOpen(open => {
          if (!open && data.senderId !== userProfile.id) {
            setUnreadChatCount(c => c + 1);
          }
          return open;
        });
      });

      room.onMessage("opponent_blocked_status", (data: { blockerId: string; blockedId: string; isBlocked: boolean }) => {
        setRoomBlocks(prev => {
          const currentList = prev[data.blockerId] || [];
          let updatedList;
          if (data.isBlocked) {
            updatedList = [...new Set([...currentList, data.blockedId])];
          } else {
            updatedList = currentList.filter(id => id !== data.blockedId);
          }
          const nextVal = {
            ...prev,
            [data.blockerId]: updatedList
          };
          roomBlocksRef.current = nextVal;
          return nextVal;
        });
      });

      room.onMessage("puzzle_start", (data: { seed: string; puzzleType?: string; opponent?: any }) => {
        console.log("✅ Match found! Opponent:", data.opponent?.username, "Seed:", data.seed);
        
        // Stop searching
        if (searchIntervalRef.current) {
          clearInterval(searchIntervalRef.current);
          searchIntervalRef.current = null;
        }

        // Set opponent info from server message
        if (data.opponent) {
          opponentNameRef.current = data.opponent.username;
          opponentIdRef.current = data.opponent.id || '';
          setOpponentInfo({
            id: data.opponent.id,
            username: data.opponent.username,
            rank: data.opponent.rank || RankName.BRONZE,
            progress: 0,
            nameColor: data.opponent.nameColor,
            badges: data.opponent.badges,
            avatar: data.opponent.avatar,
            frame: data.opponent.frame
          });
        }

        // Transition to playing state
        const activePuzzle = (data.puzzleType || queuedPuzzle || PuzzleType.SLIDING) as PuzzleType;
        setGameSeed(data.seed);
        setCurrentRound(1);
        setPlayerRoundWins(0);
        setOpponentRoundWins(0);
        setRoundWinnerMessage(null);
        gameStartedRef.current = true;
        setMatchmakingState('playing');
        setActiveGame(activePuzzle);
        recordGamePlay(activePuzzle);
        triggerSound('success');
      });

      // Handle live opponent progress relay from server
      room.onMessage("opponent_progress", (data: { progress: number; correctAnswers?: number }) => {
        setOpponentInfo(prev => prev ? { 
          ...prev, 
          progress: data.progress,
          correctAnswers: data.correctAnswers !== undefined ? data.correctAnswers : prev.correctAnswers
        } : null);
      });

    } catch (e) {
      console.error("Matchmaking connect error:", e);
      // Wait for AI fallback to kick in if server is disconnected
    }
  };

  const cancelMatchmaking = () => {
    triggerSound('click');
    setRoomBlocks({});
    roomBlocksRef.current = {};
    if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    if (matchSolveIntervalRef.current) clearInterval(matchSolveIntervalRef.current);
    if (roomRef.current) {
      roomRef.current.leave();
      roomRef.current = null;
    }

    if (privatePin && userProfile) {
      try {
        const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
        const token = btoa(JSON.stringify(payload));
        fetch(`${BACKEND_HTTP_URL}/profile/friends/challenge/clear`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ senderId: userProfile.id })
        }).catch(err => console.warn('[Friends] Failed to clear challenge on cancel:', err));
      } catch (e) {
        // Fallback
      }
    }

    setMatchmakingState('idle');
    setOpponentInfo(null);
    setQueuedPuzzle(null);
    setPrivatePin(null);
    setIsFriendChallengeDuel(false);
    setPlayerCorrectCount(0);

    setPlayerEmojiBubble(null);
    setOpponentEmojiBubble(null);
    if (playerEmojiTimeoutRef.current) clearTimeout(playerEmojiTimeoutRef.current);
    if (opponentEmojiTimeoutRef.current) clearTimeout(opponentEmojiTimeoutRef.current);
    botReactedThresholds.current = {};
  };

  const renderHeaderActions = () => {
    return (
      <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', marginLeft: '12px', position: 'relative' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEmojiPickerOpen(!isEmojiPickerOpen);
          }}
          style={{
            background: isLightMode ? '#f1f5f9' : 'rgba(255,255,255,0.06)',
            cursor: 'pointer',
            padding: '6px 10px',
            borderRadius: '12px',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-glass)',
            transition: 'background 0.2s',
            outline: 'none'
          }}
          title="Send Emoji Reaction"
        >
          🤩
        </button>
        {roomRef.current && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerSound('click');
              setIsInGameChatOpen(!isInGameChatOpen);
              setUnreadChatCount(0);
            }}
            style={{
              background: isLightMode ? '#f1f5f9' : 'rgba(255,255,255,0.06)',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '12px',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-glass)',
              position: 'relative',
              transition: 'background 0.2s',
              outline: 'none'
            }}
            title="Game Chat"
          >
            💬
            {unreadChatCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-1px',
                right: '-1px',
                background: 'var(--color-danger)',
                borderRadius: '50%',
                width: '8px',
                height: '8px'
              }} />
            )}
          </button>
        )}

        {isEmojiPickerOpen && (
          <div 
            className="emoji-picker-container"
            style={{
              position: 'absolute',
              top: '40px',
              left: 0,
              background: isLightMode ? '#ffffff' : 'rgba(15, 10, 36, 0.98)',
              border: isLightMode ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.15)',
              padding: '10px',
              borderRadius: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '4px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
              zIndex: 9999,
              width: '240px',
              maxHeight: '160px',
              overflowY: 'auto',
              scrollbarWidth: 'none'
            }}
          >
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  triggerPlayerEmoji(emoji);
                  setIsEmojiPickerOpen(false);
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '8px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // When player wins during a multiplayer session
  const handleGameWin = (puzzleType: PuzzleType, timeInSec: number, score: number) => {
    triggerSound('success');

    if (puzzleType === PuzzleType.MENTAL_MATH) {
      if (opponentInfo) {
        if (opponentInfo.progress >= 100) {
          // Bot finished first, so the player lost!
          playerHasWonBotMatchRef.current = false;
        } else {
          // Player won!
          playerHasWonBotMatchRef.current = true;
          const diff = selectedDifficultyRef.current;
          let coinReward = 30;
          let gemReward = 1;
          let xpReward = 15;
          if (diff === 'easy') {
            coinReward = 10;
            gemReward = 0;
            xpReward = 5;
          } else if (diff === 'hard') {
            coinReward = 60;
            gemReward = 3;
            xpReward = 30;
          }
          recordGameWin(puzzleType, timeInSec, score, coinReward, gemReward, xpReward);
        }
      } else {
        // Practice/Solo win
        playerHasWonBotMatchRef.current = true;
        recordGameWin(puzzleType, timeInSec, score, 5, 0, 10);
      }
      return;
    }
    
    if (roomRef.current) {
      // Real multiplayer finish broadcast
      MultiplayerService.sendSolved(roomRef.current, score);
    } else if (opponentInfo) {
      // Local AI Bot victory trigger
      if (matchSolveIntervalRef.current) clearInterval(matchSolveIntervalRef.current);
      
      if (puzzleType === PuzzleType.PHYSICS) {
        setPlayerRoundWins(prevWins => {
          const newWins = prevWins + 1;
          if (newWins >= 2) {
            playerHasWonBotMatchRef.current = true;
            setMatchResult({
              isWinner: true,
              winnerName: userProfile.username,
              opponentId: opponentIdRef.current
            });
            
            // Scale reward based on difficulty choice
            const diff = selectedDifficultyRef.current;
            let coinReward = 30;
            let gemReward = 1;
            let xpReward = 15;
            if (diff === 'easy') {
              coinReward = 10;
              gemReward = 0;
              xpReward = 5;
            } else if (diff === 'hard') {
              coinReward = 60;
              gemReward = 3;
              xpReward = 30;
            }
            
            recordGameWin(puzzleType, timeInSec, score, coinReward, gemReward, xpReward);
            closeGame();
          } else {
            setRoundWinnerMessage("You won this round!");
            setCurrentRound(prevRound => prevRound + 1);
            setTimeout(() => {
              setRoundWinnerMessage(null);
              setGameSeed(Math.random().toString(36).substring(2, 10));
              setPlayerProgress(0);
              // Restart bot solver loop with appropriate settings
              const botName = opponentInfo.username;
              const isEasy = selectedDifficultyRef.current === 'easy';
              const isHard = selectedDifficultyRef.current === 'hard';
              const solveMin = isEasy ? 1 : (isHard ? 4 : 3);
              const solveMax = isEasy ? 4 : (isHard ? 8 : 7);
              const tickRate = isEasy ? 1800 : (isHard ? 1500 : 1500);
              startOnlineFallbackBotSolver(botName, botTriviaCorrect, puzzleType, solveMin, solveMax, tickRate);
            }, 3000);
          }
          return newWins;
        });
      } else {
        playerHasWonBotMatchRef.current = true;
        setMatchResult({
          isWinner: true,
          winnerName: userProfile.username,
          opponentId: opponentIdRef.current
        });

        // Scale reward based on difficulty choice
        const diff = selectedDifficultyRef.current;
        let coinReward = 30;
        let gemReward = 1;
        let xpReward = 15;
        if (diff === 'easy') {
          coinReward = 10;
          gemReward = 0;
          xpReward = 5;
        } else if (diff === 'hard') {
          coinReward = 60;
          gemReward = 3;
          xpReward = 30;
        }
        
        recordGameWin(puzzleType, timeInSec, score, coinReward, gemReward, xpReward);
        closeGame();
      }
    } else {
      // Practice/Solo mode win (Grants +5 Coins and +10 XP)
      playerHasWonBotMatchRef.current = true;
      recordGameWin(puzzleType, timeInSec, score, 5, 0, 10);
      setMatchResult({
        isWinner: true,
        winnerName: userProfile.username,
        isSolo: true
      });
      closeGame();
    }
  };

  const handleTriviaGameWin = (score: number, playerCorrect: number) => {
    if (matchSolveIntervalRef.current) clearInterval(matchSolveIntervalRef.current);
    
    if (roomRef.current) {
      // Online multiplayer Trivia: send score and correct answers to server and wait
      MultiplayerService.sendSolved(roomRef.current, score, playerCorrect);
      setMatchmakingState('waiting_opponent');
      return;
    }

    if (!opponentInfo) {
      // Singleplayer practice/solo mode (Grants +5 Coins and +10 XP)
      recordGameWin(PuzzleType.EIGHT_BALL_QUIZ, 60, score, 5, 0, 10);
      setMatchResult({
        isWinner: true,
        winnerName: userProfile.username,
        isSolo: true
      });
      closeGame();
      return;
    }

    // Determine winner based on trivia rules
    const botCorrect = botTriviaCorrect;
    const isWinner = playerCorrect > botCorrect || (playerCorrect === botCorrect && score >= 250);
    const rivalName = opponentInfo ? opponentInfo.username : 'Rival Bot';

    setMatchResult({
      isWinner,
      winnerName: isWinner ? userProfile.username : rivalName,
      opponentId: opponentIdRef.current,
      triviaDetails: {
        playerCorrect,
        opponentCorrect: botCorrect
      }
    });

    if (isWinner) {
      const diff = selectedDifficultyRef.current;
      let coinReward = 30;
      let gemReward = 1;
      let xpReward = 15;
      if (diff === 'easy') {
        coinReward = 10;
        gemReward = 0;
        xpReward = 5;
      } else if (diff === 'hard') {
        coinReward = 60;
        gemReward = 3;
        xpReward = 30;
      }
      recordGameWin(PuzzleType.EIGHT_BALL_QUIZ, 60, score, coinReward, gemReward, xpReward);
    } else {
      // Record lower reward for defeat
      recordGameWin(PuzzleType.EIGHT_BALL_QUIZ, 60, score, 2, 0, 2);
    }
    
    closeGame();
  };

  // Update bio/status text
  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSound('click');
    updateStatus(customStatusInput);
    setIsEditingStatus(false);
  };

  // Combine all accessibility filters natively using CSS filters
  const getAccessibilityStyle = () => {
    let filterValues = [];
    if (colorBlindMode === 'protanopia') filterValues.push('grayscale(50%) hue-rotate(15deg)');
    if (colorBlindMode === 'deuteranopia') filterValues.push('grayscale(30%) hue-rotate(30deg)');
    if (colorBlindMode === 'tritanopia') filterValues.push('contrast(125%) hue-rotate(270deg)');
    
    return filterValues.length > 0 ? { filter: filterValues.join(' ') } : {};
  };

  if (!isLoggedIn) {
    return (
      <div 
        className="app-container"
        style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '24px',
          background: isLightMode ? '#f0f4f8' : 'radial-gradient(circle at top left, #0e0720, #040209)',
          fontFamily: 'var(--font-sans)',
          ...getAccessibilityStyle()
        }}
      >
        <div 
          className="glass-panel animate-fade-in"
          style={{
            width: '100%',
            maxWidth: '850px',
            padding: '40px',
            borderRadius: '24px',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            border: '1px solid var(--border-glass-active)',
            background: isLightMode ? '#ffffff' : 'rgba(10, 6, 26, 0.95)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <div className="animate-pulse-scale" style={{ display: 'inline-flex', padding: '16px', borderRadius: '20px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', marginBottom: '16px', boxShadow: 'var(--glow-primary)' }}>
              <Gamepad2 size={40} color="#ffffff" />
            </div>
            <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              COGNERIX
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
              {t('cognerix_welcome_subtitle')}
            </p>
          </div>

          {/* Grid Options */}
          <div className="login-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            
            {/* Column 1: Google Account Login */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid var(--border-glass-active)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)' }}>
                  <Mail size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{t('google_linked_account')}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 'bold' }}>{t('preserved_progress')}</span>
                </div>
              </div>
              
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {t('google_desc')}
              </p>

              {/* Real Google Sign-In Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                <div
                  ref={googleButtonRef}
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', minHeight: '44px' }}
                />
                {!googleClientId && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <div className="processing-spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(34,197,94,0.2)', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Connecting to Google...</span>
                  </div>
                )}
                {googleLoginLoading && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Signing in...
                  </p>
                )}
              </div>
            </div>

            {/* Column 2: Guest Login */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--color-primary)' }}>
                  <Gamepad2 size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{t('guest_solve_arena')}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('no_password_required')}</span>
                </div>
              </div>
              
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {t('guest_desc')}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>{t('guest_username_label')}</label>
                <input 
                  type="text" 
                  value={guestUser}
                  onChange={(e) => setGuestUser(e.target.value)}
                  placeholder={t('guest_placeholder')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-glass)',
                    background: 'rgba(0,0,0,0.15)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                onClick={handleGuestLogin}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
              >
                {t('continue_guest_btn')}
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (isUserBanned) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(circle at center, #1e0a0a 0%, #0a0202 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999999,
        fontFamily: "'Inter', sans-serif",
        color: '#fff',
        padding: '24px',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        {/* Animated Background Glow */}
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          pointerEvents: 'none'
        }} />

        <div style={{
          background: 'rgba(20, 10, 10, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '24px',
          padding: '48px 32px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(239, 68, 68, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Top Danger Bar Accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '6px',
            background: 'linear-gradient(90deg, #ef4444, #b91c1c)'
          }} />

          {/* Danger Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid #ef4444',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#ef4444', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Access Suspended
            </h2>
            <p style={{ fontSize: '15px', color: '#e5e7eb', margin: 0, lineHeight: '1.6' }}>
              Your account has been permanently suspended by administration for violating community guidelines.
            </p>
          </div>

          {/* Account Details Box */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '16px',
            width: '100%',
            boxSizing: 'border-box',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#9ca3af' }}>Target Profile ID:</span>
              <span style={{ color: '#f3f4f6', fontWeight: 'bold', fontFamily: 'monospace' }}>{userProfile?.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#9ca3af' }}>Username:</span>
              <span style={{ color: '#f3f4f6', fontWeight: 'bold' }}>{userProfile?.username}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#9ca3af' }}>Ban Status:</span>
              <span style={{ color: '#ef4444', fontWeight: 'bold', textTransform: 'uppercase' }}>PERMANENT</span>
            </div>
            {userBanReason && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px', marginTop: '4px' }}>
                <span style={{ color: '#9ca3af', fontSize: '12px' }}>Reason:</span>
                <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '12px', wordBreak: 'break-word' }}>{userBanReason}</span>
              </div>
            )}
          </div>

          <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.5' }}>
            If you believe this suspension is an error, please report at 'cognerix.report@gmail.com' with your Profile ID.
          </div>
        </div>
      </div>
    );
  }

  if (onboardingStep !== 'none') {
    return (
      <div 
        className="app-container animate-fade-in"
        style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '24px',
          background: isLightMode ? '#f0f4f8' : 'radial-gradient(circle at top left, #0e0720, #040209)',
          fontFamily: 'var(--font-sans)',
          ...getAccessibilityStyle()
        }}
      >
        <div 
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: '520px',
            padding: '36px',
            borderRadius: '24px',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            border: isLightMode ? '1px solid #e2e8f0' : '1px solid var(--border-glass-active)',
            background: isLightMode ? '#ffffff' : 'rgba(10, 6, 26, 0.95)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            textAlign: 'center'
          }}
        >
          {onboardingStep === 'language' ? (
            <>
              {/* Language Selection Step */}
              <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--color-primary)', margin: '0 auto', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                <Globe size={40} />
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                  {t('choose_language')}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                  {t('choose_language_desc')}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', marginTop: '12px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>{t('language').toUpperCase()}</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  {/* Trigger Button */}
                  <div
                    onClick={() => {
                      triggerSound('click');
                      setIsOnboardingLangDropdownOpen(!isOnboardingLangDropdownOpen);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 18px',
                      fontSize: '14px',
                      background: isLightMode ? '#f8fafc' : 'rgba(0,0,0,0.25)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      userSelect: 'none'
                    }}
                  >
                    <span>{LANGUAGE_DISPLAY_NAMES[language] || language}</span>
                    <span style={{ fontSize: '12px', opacity: 0.7 }}>
                      {isOnboardingLangDropdownOpen ? '▲' : '▼'}
                    </span>
                  </div>

                  {/* Dropdown Menu List */}
                  {isOnboardingLangDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      width: '100%',
                      maxHeight: '260px',
                      overflowY: 'auto',
                      background: isLightMode ? '#ffffff' : 'rgba(20, 18, 45, 0.98)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '12px',
                      marginTop: '6px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                      zIndex: 100,
                      padding: '6px'
                    }}>
                      {LANGUAGE_CONFIGS.map((config) => {
                        const isSelected = language === config.name;
                        return (
                          <div
                            key={config.name}
                            onClick={() => {
                              if (!config.enabled) return;
                              triggerSound('click');
                              setLanguage(config.name);
                              setIsOnboardingLangDropdownOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              cursor: config.enabled ? 'pointer' : 'not-allowed',
                              background: isSelected 
                                ? 'rgba(139, 92, 246, 0.15)' 
                                : 'transparent',
                              color: config.enabled 
                                ? 'var(--text-primary)' 
                                : isLightMode ? '#94a3b8' : 'rgba(255, 255, 255, 0.35)',
                              opacity: config.enabled ? 1 : 0.65,
                              transition: 'all 0.15s ease',
                              marginBottom: '2px'
                            }}
                            onMouseEnter={(e) => {
                              if (config.enabled && !isSelected) {
                                e.currentTarget.style.background = isLightMode ? '#f1f5f9' : 'rgba(255,255,255,0.05)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (config.enabled && !isSelected) {
                                e.currentTarget.style.background = 'transparent';
                              }
                            }}
                            title={!config.enabled ? 'This language will be available soon.' : undefined}
                          >
                            <span style={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
                              {config.name} — {config.nativeName} {isSelected && ' ✓'}
                            </span>
                            {!config.enabled && (
                              <span style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: isLightMode ? '#e2e8f0' : 'rgba(255,255,255,0.08)',
                                color: isLightMode ? '#64748b' : 'rgba(255,255,255,0.5)',
                                fontWeight: 'bold'
                              }}>
                                {config.comingSoonText}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  triggerSound('click');
                  setOnboardingStep('terms');
                }}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', borderRadius: '12px', marginTop: '12px' }}
              >
                {t('next_label')}
              </button>
            </>
          ) : (
            <>
              {/* Terms and Conditions Step */}
              <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', margin: '0 auto', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <FileText size={40} />
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                  {t('terms_conditions')}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                  {t('terms_review_desc')}
                </p>
              </div>

              <div style={{
                background: isLightMode ? '#f8fafc' : 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                textAlign: 'left',
                maxHeight: '120px',
                overflowY: 'auto',
                marginTop: '8px'
              }}>
                {t('terms_text_summary')}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => {
                      triggerSound('click');
                      setTermsAccepted(e.target.checked);
                    }}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: 'var(--color-primary)'
                    }}
                  />
                  {t('terms_agree_label')}
                </label>
                <button
                  onClick={() => window.open('https://cognerix-stack.github.io/cognerix-legal', '_blank')}
                  className="btn btn-glass"
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-glass-active)',
                    color: 'var(--color-primary)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    background: 'transparent'
                  }}
                >
                  {t('view_label')}
                </button>
              </div>

              <button
                disabled={!termsAccepted}
                onClick={() => {
                  triggerSound('success');
                  localStorage.setItem('pv_terms_accepted', 'true');
                  setOnboardingStep('none');
                }}
                className="btn btn-success"
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '12px',
                  marginTop: '12px',
                  background: termsAccepted
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: termsAccepted ? '#ffffff' : 'var(--text-muted)',
                  cursor: termsAccepted ? 'pointer' : 'not-allowed'
                }}
              >
                {t('continue_label')}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="app-container"
      style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        position: 'relative',
        ...getAccessibilityStyle()
      }}
    >
      
      {/* 🧭 SIDEBAR NAVIGATION PANEL */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', boxShadow: 'var(--glow-primary)' }}>
              <Gamepad2 size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                PuzzleVerse
              </h1>
              <span style={{ fontSize: '10px', color: 'var(--color-secondary)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Platform v1.0
              </span>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="btn btn-glass"
            style={{ padding: '6px 10px', fontSize: '14px', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-primary)' }}
            title="Close Drawer"
          >
            ✕
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {[
            { id: 'home', label: t('play_arena'), icon: Gamepad2 },
            { id: 'profile', label: t('my_profile'), icon: User },
            { id: 'store', label: t('cosmetic_store'), icon: ShoppingBag },
            { id: 'leaderboard', label: t('leaderboards'), icon: Trophy },
            { id: 'avatars', label: 'Change Avatar & Frame', icon: Smile },
            { id: 'mail', label: 'Mailbox', icon: Mail },
            { id: 'settings', label: t('system_settings'), icon: SettingsIcon },
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'mail') {
                    triggerSound('click');
                    setIsMailboxOpen(true);
                    setUnreadMailCount(0);
                    setIsSidebarOpen(false);
                  } else {
                    handleTabChange(item.id as any);
                  }
                }}
                className={`btn ${isActive ? 'btn-primary' : 'btn-glass'}`}
                style={{
                  justifyContent: 'flex-start',
                  width: '100%',
                  padding: '12px 16px',
                  background: isActive ? undefined : 'transparent',
                  border: isActive ? undefined : '1px solid transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  opacity: isActive ? 1 : 0.85
                }}
              >
                <Icon size={18} />
                <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                {item.id === 'mail' && unreadMailCount > 0 && (
                  <span style={{
                    background: 'var(--color-danger)',
                    color: '#fff',
                    borderRadius: '20px',
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    marginLeft: '8px',
                    boxShadow: '0 0 8px var(--color-danger)'
                  }}>
                    {unreadMailCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info & audio controls */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('mute_sounds')}</span>
            <button 
              onClick={() => { triggerSound('click'); setIsMuted(!isMuted); }}
              className="btn btn-glass" 
              style={{ padding: '6px', borderRadius: '50%' }}
            >
              {isMuted ? <VolumeX size={16} color="var(--color-danger)" /> : <Volume2 size={16} color="var(--color-secondary)" />}
            </button>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Info size={12} /> {t('server_connected')}
          </div>
        </div>
      </aside>

      {/* 🖥️ MAIN SCREEN PORTAL */}
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* 🏆 TOP STATS HUD */}
        <header className="glass-panel header-hud" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div className="header-profile" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="avatar-wrapper" style={{ position: 'relative' }}>
              {renderAvatar(userProfile.avatar, userProfile.frame, 48)}
              {userProfile.lobbyEntranceAnimation && (
                <span 
                  style={{ position: 'absolute', top: -4, right: -4, background: 'var(--color-accent)', width: '12px', height: '12px', borderRadius: '50%', border: '2px solid var(--bg-primary)' }}
                  title="Animation Equipped"
                />
              )}
            </div>
            <div className="header-profile-details">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 
                  className={userProfile.nameColor?.startsWith('name-fx-') ? userProfile.nameColor : ''}
                  style={{ 
                    fontSize: '18px', 
                    color: userProfile.nameColor?.startsWith('name-fx-') ? undefined : (userProfile.nameColor || 'var(--text-primary)'), 
                    fontFamily: 'var(--font-display)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {userProfile.username}
                  <span className="header-profile-badge" style={{ display: 'inline-flex', gap: '3px' }}>
                    {userProfile.badges.map((badge, idx) => (
                      <span key={idx} style={{ fontSize: '12px' }} title="Equipped Badge">{badge}</span>
                    ))}
                  </span>
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
                  {t('level')} {userProfile.level}
                </span>
                <span style={{ fontSize: '11px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', padding: '2px 6px', borderRadius: '10px', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                  {t('rank')}: {userProfile.rank}
                </span>
              </div>
            </div>
          </div>

          <div className="header-right-hud" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {/* 🎁 FREE REWARD BUTTON */}
            <button
              onClick={() => { triggerSound('click'); setIsFreeRewardOpen(true); }}
              className="btn header-free-reward"
              style={{
                position: 'relative',
                padding: '10px 16px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '13px',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                transition: 'all 0.2s ease',
                outline: 'none',
                height: '42px'
              }}
              title="Get Free Reward!"
            >
              <span>🎁<span className="reward-btn-text"> Free Reward!</span></span>
              {Date.now() - lastRewardClaimedTime > 60000 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--color-danger)',
                  color: '#ffffff',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse 1.5s infinite'
                }}>
                  !
                </span>
              )}
            </button>

            <div className="header-stat-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(245,158,11,0.08)', padding: '6px 10px 6px 14px', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.15)' }}>
              <Coins size={16} color="var(--color-warning)" />
              <div>
                <p className="header-stat-label" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{t('coins_label')}</p>
                <h4 style={{ fontSize: '16px', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{userProfile.coins}</h4>
              </div>
              <button 
                onClick={() => { triggerSound('click'); setStorePopupTab('coins'); setIsStorePopupOpen(true); }}
                className="header-stat-add-btn"
                style={{
                  background: 'rgba(245,158,11,0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#f59e0b',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginLeft: '4px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >+</button>
            </div>
            <div className="header-stat-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(6,182,212,0.08)', padding: '6px 10px 6px 14px', borderRadius: '12px', border: '1px solid rgba(6,182,212,0.15)' }}>
              <Gem size={16} color="var(--color-secondary)" />
              <div>
                <p className="header-stat-label" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{t('gems_label')}</p>
                <h4 style={{ fontSize: '16px', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{userProfile.gems}</h4>
              </div>
              <button 
                onClick={() => { triggerSound('click'); setStorePopupTab('gems'); setIsStorePopupOpen(true); }}
                className="header-stat-add-btn"
                style={{
                  background: 'rgba(6,182,212,0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#06b6d4',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginLeft: '4px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >+</button>
            </div>

            {/* ☰ Hamburger Button to open Menu Popup */}
            <button 
              onClick={() => { triggerSound('click'); setIsMenuPopupOpen(true); }}
              className="btn btn-glass header-menu-btn"
              style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border-glass)', cursor: 'pointer', position: 'relative' }}
              title="Open Menu"
            >
              <Menu size={20} color="var(--text-primary)" />
              {(Object.values(unreadChats).some(v => v) || unreadMailCount > 0) && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  boxShadow: '0 0 8px #ef4444'
                }} />
              )}
            </button>
          </div>
        </header>

        {/* 🎮 FLOATING ACTIVE GAME MODAL SCREEN */}
        {activeGame && (
          <div className="active-game-modal" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: isLightMode ? 'rgba(240, 244, 248, 0.98)' : 'rgba(4, 2, 9, 0.95)', zIndex: 1000, display: isGameHidden ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(8px)' }}>
            
            {/* Sticky Header Bar containing Menu Button and Live Duel Hub */}
            <div className="active-game-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', zIndex: 2000 }}>

              {/* ☰ Floating Top Left Game Menu Button */}
              <div className="active-game-menu-btn-wrapper" style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 2000 }}>
              <button
                onClick={() => { triggerSound('click'); setIsGameMenuOpen(!isGameMenuOpen); }}
                className="btn btn-glass"
                style={{ 
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  fontSize: '18px',
                  cursor: 'pointer',
                  background: isLightMode ? '#ffffff' : 'rgba(255,255,255,0.05)',
                  border: isLightMode ? '1px solid #000000' : '1px solid var(--border-glass)'
                }}
                title="Game Menu"
              >
                <Menu size={18} color="var(--text-primary)" />
              </button>

              {/* Dropdown Menu Container */}
              {isGameMenuOpen && (
                <div 
                  className="glass-panel animate-fade-in active-game-menu-dropdown"
                  style={{ 
                    position: 'absolute', 
                    top: '50px', 
                    left: 0, 
                    width: '180px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px', 
                    padding: '12px', 
                    background: isLightMode ? '#ffffff' : 'rgba(10, 6, 26, 0.95)', 
                    border: isLightMode ? '1px solid #000000' : '1px solid var(--border-glass-active)',
                    boxShadow: 'var(--shadow-card)',
                    zIndex: 1020
                  }}
                >
                  <button
                    onClick={() => {
                      triggerSound('click');
                      setIsGameMenuOpen(false);
                      setIsGameHidden(true);
                      setActiveTab('profile');
                    }}
                    className="btn btn-glass"
                    style={{ justifyContent: 'flex-start', width: '100%', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px', border: 'none', background: 'transparent' }}
                  >
                    👤 Profile
                  </button>

                  <button
                    onClick={() => {
                      triggerSound('click');
                      setIsGameMenuOpen(false);
                      setIsGameHidden(true);
                      setActiveTab('settings');
                    }}
                    className="btn btn-glass"
                    style={{ justifyContent: 'flex-start', width: '100%', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px', border: 'none', background: 'transparent' }}
                  >
                    ⚙️ Settings
                  </button>

                  <button
                    onClick={() => {
                      triggerSound('click');
                      setIsGameMenuOpen(false);
                      closeGame();
                    }}
                    className="btn btn-glass"
                    style={{ justifyContent: 'flex-start', width: '100%', padding: '8px 12px', color: 'var(--color-danger)', fontSize: '13px', border: 'none', background: 'transparent' }}
                  >
                    🚪 Leave Game
                  </button>
                </div>
              )}
            </div>
            
            {/* Realtime progress bar if in Multiplayer playing mode */}
            {matchmakingState === 'playing' && opponentInfo && (
              isLiveDuelHubExpanded ? (
                /* EXPANDED STATE (A button to collapse) */
                <div className="live-duel-hub-panel live-duel-hub-expanded" style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '600px', display: 'flex', gap: '20px', background: isLightMode ? '#ffffff' : 'rgba(10, 6, 26, 0.95)', padding: '16px 20px', borderRadius: '16px', border: isLightMode ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)', boxShadow: isLightMode ? '0 4px 12px rgba(0, 0, 0, 0.05)' : 'none', zIndex: 1010 }}>
                  
                  {/* Left Side: Stats and Parallel Progress Bars */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="ldh-title" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>LIVE DUEL HUB</span>
                        <button
                          onClick={() => {
                            triggerSound('click');
                            setIsLiveDuelHubExpanded(false);
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            triggerSound('click');
                            setIsLiveDuelHubExpanded(false);
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid var(--border-glass)',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            fontFamily: 'monospace',
                            boxSizing: 'border-box',
                            outline: 'none',
                            padding: 0
                          }}
                          title="Collapse Panel"
                        >
                          ▲
                        </button>
                      </div>
                      {(activeGame === PuzzleType.PHYSICS || activeGame?.toUpperCase() === 'PHYSICS') && (
                        <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                          Round {currentRound} of 3 ({playerRoundWins} - {opponentRoundWins})
                        </span>
                      )}
                      <span className="ldh-badge-competitive" style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '2px 6px', borderRadius: '10px', color: 'var(--color-danger)', fontWeight: 'bold' }}>COMPETITIVE</span>
                    </div>

                    {/* Player Progress */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
                          <span className={userProfile.nameColor?.startsWith('name-fx-') ? userProfile.nameColor : ''} style={{ color: userProfile.nameColor?.startsWith('name-fx-') ? undefined : (userProfile.nameColor || 'var(--text-primary)'), fontWeight: 'bold' }}>You</span>
                          {opponentInfo && (roomBlocks[opponentInfo.id || ''] || []).includes(userProfile.id) && (
                            <span style={{ color: 'var(--color-danger)', fontWeight: 'bold', fontSize: '15px', marginLeft: '2px' }} title="You are blocked by your opponent">⊘</span>
                          )}
                          {userProfile.badges && userProfile.badges.length > 0 && (
                            <span style={{ display: 'inline-flex', gap: '3px', marginRight: '4px' }}>
                              {userProfile.badges.map((badge, bIdx) => (
                                <span key={bIdx} title="Equipped Badge" style={{ fontSize: '14px' }}>{badge}</span>
                              ))}
                            </span>
                          )}
                          {activeGame === PuzzleType.EIGHT_BALL_QUIZ && selectedDifficultyRef.current === 'online' && (
                            <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 'bold' }}>({playerCorrectCount}/5 Correct)</span>
                          )}
                          {playerEmojiBubble && (
                            <div style={{
                              position: 'absolute',
                              bottom: '22px',
                              left: '10px',
                              background: isLightMode ? '#ffffff' : '#1e1b4b',
                              border: isLightMode ? '2px solid #cbd5e1' : '2px solid #a78bfa',
                              borderRadius: '16px 16px 16px 0px',
                              padding: '6px 10px',
                              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 1050,
                              animation: 'emojiBubblePop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                            }}>
                              <span style={{ fontSize: '24px', display: 'inline-block', animation: 'emojiBounce 1s infinite alternate ease-in-out', lineHeight: 1 }}>
                                {playerEmojiBubble}
                              </span>
                              <div style={{
                                position: 'absolute',
                                bottom: '-6px',
                                left: '6px',
                                width: '0',
                                height: '0',
                                borderStyle: 'solid',
                                borderWidth: '6px 6px 0 0',
                                borderColor: `${isLightMode ? '#cbd5e1' : '#a78bfa'} transparent transparent transparent`
                              }} />
                              <div style={{
                                position: 'absolute',
                                bottom: '-4px',
                                left: '7px',
                                width: '0',
                                height: '0',
                                borderStyle: 'solid',
                                borderWidth: '5px 5px 0 0',
                                borderColor: `${isLightMode ? '#ffffff' : '#1e1b4b'} transparent transparent transparent`
                              }} />
                            </div>
                          )}
                        </div>
                        <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{playerProgress}%</span>
                      </div>
                      <div className="ldh-progress-bar-container" style={{ width: '100%', height: '8px', background: isLightMode ? '#e2e8f0' : 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div className="ldh-progress-bar-fill" style={{ width: `${playerProgress}%`, height: '100%', background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }} />
                      </div>
                    </div>

                    {/* Opponent Progress */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
                          <span className={(opponentInfo.nameColor?.startsWith('name-fx-') ? opponentInfo.nameColor : '') + " ldh-player-name"} style={{ color: opponentInfo.nameColor?.startsWith('name-fx-') ? undefined : (opponentInfo.nameColor || 'var(--color-accent)'), fontWeight: 'bold' }}>
                            {opponentInfo.username} ({opponentInfo.rank})
                            {opponentInfo.aiMode && ` [${opponentInfo.aiMode}]`}
                          </span>
                          {(roomBlocks[userProfile.id] || []).includes(opponentInfo.id || '') && (
                            <span style={{ color: 'var(--color-danger)', fontWeight: 'bold', fontSize: '15px', marginLeft: '2px' }} title="Opponent is blocked">⊘</span>
                          )}
                          {opponentInfo.badges && opponentInfo.badges.length > 0 && (
                            <span style={{ display: 'inline-flex', gap: '3px', marginRight: '4px' }}>
                              {opponentInfo.badges.map((badge, bIdx) => (
                                <span key={bIdx} title="Equipped Badge" style={{ fontSize: '14px' }}>{badge}</span>
                              ))}
                            </span>
                          )}
                          {!opponentInfo.aiMode && (
                            <button
                              className="ldh-block-btn"
                              onClick={() => {
                                triggerSound('click');
                                const oppId = opponentInfo.id || '';
                                const currentlyBlocked = (roomBlocks[userProfile.id] || []).includes(oppId);
                                roomRef.current?.send("block_opponent", {
                                  blockerId: userProfile.id,
                                  blockedId: oppId,
                                  isBlocked: !currentlyBlocked
                                });
                              }}
                              style={{
                                background: (roomBlocks[userProfile.id] || []).includes(opponentInfo.id || '') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.06)',
                                color: (roomBlocks[userProfile.id] || []).includes(opponentInfo.id || '') ? 'var(--color-danger)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '2px 6px',
                                fontSize: '11px',
                                borderRadius: '6px',
                                marginLeft: '6px',
                                fontWeight: 'bold',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                border: (roomBlocks[userProfile.id] || []).includes(opponentInfo.id || '') ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border-glass)',
                                outline: 'none'
                              }}
                              title={(roomBlocks[userProfile.id] || []).includes(opponentInfo.id || '') ? "Unblock Opponent" : "Block Opponent Messages/Emojis"}
                            >
                              {(roomBlocks[userProfile.id] || []).includes(opponentInfo.id || '') ? "🔒 Blocked" : "⊘ Block"}
                            </button>
                          )}
                          {activeGame === PuzzleType.EIGHT_BALL_QUIZ && selectedDifficultyRef.current === 'online' && (
                            <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 'bold' }}>({opponentInfo.correctAnswers || 0}/5 Correct)</span>
                          )}
                          {opponentEmojiBubble && (
                            <div style={{
                              position: 'absolute',
                              bottom: '22px',
                              left: '10px',
                              background: isLightMode ? '#ffffff' : '#1e1b4b',
                              border: isLightMode ? '2px solid #cbd5e1' : '2px solid #a78bfa',
                              borderRadius: '16px 16px 16px 0px',
                              padding: '6px 10px',
                              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 1050,
                              animation: 'emojiBubblePop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                            }}>
                              <span style={{ fontSize: '24px', display: 'inline-block', animation: 'emojiBounce 1s infinite alternate ease-in-out', lineHeight: 1 }}>
                                {opponentEmojiBubble}
                              </span>
                              <div style={{
                                position: 'absolute',
                                bottom: '-6px',
                                left: '6px',
                                width: '0',
                                height: '0',
                                borderStyle: 'solid',
                                borderWidth: '6px 6px 0 0',
                                borderColor: `${isLightMode ? '#cbd5e1' : '#a78bfa'} transparent transparent transparent`
                              }} />
                              <div style={{
                                position: 'absolute',
                                bottom: '-4px',
                                left: '7px',
                                width: '0',
                                height: '0',
                                borderStyle: 'solid',
                                borderWidth: '5px 5px 0 0',
                                borderColor: `${isLightMode ? '#ffffff' : '#1e1b4b'} transparent transparent transparent`
                              }} />
                            </div>
                          )}
                        </div>
                        <span style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>{opponentInfo.progress}%</span>
                      </div>
                      <div className="ldh-progress-bar-container" style={{ width: '100%', height: '8px', background: isLightMode ? '#e2e8f0' : 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div className="ldh-progress-bar-fill" style={{ width: `${opponentInfo.progress}%`, height: '100%', background: 'var(--color-accent)' }} />
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Visual Miniature Board Spec Cam */}
                  <div className="ldh-rival-board-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--border-glass)', paddingLeft: '16px', minWidth: '90px' }}>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      Rival Board {opponentInfo.aiMode ? `(${opponentInfo.aiMode})` : ''}
                    </span>
                    {(() => {
                      const progress = opponentInfo.progress;
                      if (activeGame === PuzzleType.SLIDING || activeGame === PuzzleType.JIGSAW) {
                        let boardCols = 3;
                        let boardSize = 9;
                        let tileSize = 16;

                        if (opponentInfo.aiMode) {
                          const match = opponentInfo.aiMode.match(/^(\d+)x\d+$/);
                          if (match) {
                            boardCols = parseInt(match[1]);
                            boardSize = boardCols * boardCols;
                            if (boardCols === 4) tileSize = 12;
                            else if (boardCols === 6) tileSize = 8;
                          }
                        } else {
                          boardCols = currentSlidingGridSize;
                          boardSize = boardCols * boardCols;
                          if (boardCols === 4) tileSize = 12;
                          else if (boardCols === 6) tileSize = 8;
                        }

                        return (
                          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${boardCols}, ${tileSize}px)`, gap: '2px', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '4px' }}>
                            {Array.from({ length: boardSize }).map((_, idx) => {
                              const isCorrect = (idx / boardSize) * 100 < progress;
                              return (
                                <div key={idx} style={{ width: `${tileSize}px`, height: `${tileSize}px`, borderRadius: '2px', background: isCorrect ? 'var(--color-success)' : 'rgba(255,255,255,0.1)' }} />
                              );
                            })}
                          </div>
                        );
                      }
                      if (activeGame === PuzzleType.SUDOKU) {
                        return (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 16px)', gap: '2px', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '4px' }}>
                            {Array.from({ length: 9 }).map((_, idx) => {
                              const isCorrect = (idx / 9) * 100 < progress;
                              return (
                                <div key={idx} style={{ width: '16px', height: '16px', borderRadius: '2px', background: isCorrect ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                              );
                            })}
                          </div>
                        );
                      }
                      if (activeGame === PuzzleType.WORD) {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {Array.from({ length: 5 }).map((_, rIdx) => {
                              const isRowSolved = (rIdx / 5) * 100 < progress;
                              return (
                                <div key={rIdx} style={{ display: 'flex', gap: '2px' }}>
                                  {Array.from({ length: 5 }).map((_, cIdx) => (
                                    <div key={cIdx} style={{ width: '8px', height: '8px', borderRadius: '1px', background: isRowSolved ? 'var(--color-success)' : 'rgba(255,255,255,0.1)' }} />
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        );
                      }
                      if (activeGame === PuzzleType.EIGHT_BALL_QUIZ && selectedDifficultyRef.current === 'online') {
                        return (
                          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: '8px' }}>
                            {Array.from({ length: 5 }).map((_, idx) => {
                              const isQAnswered = (idx / 5) * 100 < progress;
                              const correctCount = opponentInfo.correctAnswers || 0;
                              const totalAnswered = Math.floor((progress / 100) * 5);
                              let dotColor = 'rgba(255,255,255,0.1)';
                              if (isQAnswered || idx < totalAnswered) {
                                dotColor = idx < correctCount ? 'var(--color-success)' : 'var(--color-danger)';
                              }
                              return (
                                <div key={idx} style={{ width: '10px', height: '10px', borderRadius: '50%', background: dotColor, boxShadow: dotColor !== 'rgba(255,255,255,0.1)' ? `0 0 6px ${dotColor}` : 'none' }} />
                              );
                            })}
                          </div>
                        );
                      }
                      return (
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.05)', borderTop: '4px solid var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: 'var(--color-accent)' }}>
                          {progress}%
                        </div>
                      );
                    })()}
                    <span style={{ fontSize: '8px', color: 'var(--color-success)', marginTop: '4px' }}>● LIVE STREAM</span>
                  </div>
                </div>
              ) : (
                /* COLLAPSED STATE (V button to expand) */
                <div className="live-duel-hub-panel live-duel-hub-collapsed" style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '600px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isLightMode ? '#ffffff' : 'rgba(10, 6, 26, 0.95)', padding: '10px 20px', borderRadius: '16px', border: isLightMode ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)', boxShadow: isLightMode ? '0 4px 12px rgba(0, 0, 0, 0.05)' : 'none', zIndex: 1010 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>LIVE DUEL HUB</span>
                    <button
                      onClick={() => {
                        triggerSound('click');
                        setIsLiveDuelHubExpanded(true);
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        triggerSound('click');
                        setIsLiveDuelHubExpanded(true);
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        boxSizing: 'border-box',
                        outline: 'none',
                        padding: 0
                      }}
                      title="Expand Panel"
                    >
                      ▼
                    </button>
                  </div>

                  {(activeGame === PuzzleType.PHYSICS || activeGame?.toUpperCase() === 'PHYSICS') && (
                    <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                      Round {currentRound} of 3
                    </span>
                  )}

                  <div style={{ display: 'flex', gap: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                    <span style={{ color: 'var(--color-primary)' }}>You: {playerProgress}%</span>
                    <span style={{ color: 'var(--color-accent)' }}>Rival: {opponentInfo.progress}%</span>
                  </div>
                </div>
              )
            )}

            </div>

            <div className="active-game-body" style={{ width: '100%', maxWidth: '650px', background: 'transparent', margin: 'auto', position: 'relative' }}>
              {activeGame === PuzzleType.SLIDING && (
                <SlidingPuzzle 
                  onGameWin={handleGameWin} 
                  onClose={(isQuit) => closeGame(false, isQuit)} 
                  onProgress={(progress) => {
                    setPlayerProgress(progress);
                    if (roomRef.current) {
                      MultiplayerService.sendProgress(roomRef.current, progress);
                    }
                  }}
                  onGridSizeChange={setCurrentSlidingGridSize}
                  room={roomRef.current}
                  username={userProfile.username}
                  headerActions={renderHeaderActions()}
                  onPlaySound={triggerSound}
                />
              )}
              {activeGame === PuzzleType.WORD && (
                <WordPuzzle 
                  onGameWin={handleGameWin}
                  onClose={(isQuit) => closeGame(false, isQuit)} 
                  onProgress={(progress) => {
                    setPlayerProgress(progress);
                    if (roomRef.current) {
                      MultiplayerService.sendProgress(roomRef.current, progress);
                    }
                  }}
                  room={roomRef.current}
                  headerActions={renderHeaderActions()}
                  isBotMatch={opponentInfo !== null && !roomRef.current}
                  onPlaySound={triggerSound}
                />
              )}
              {activeGame === PuzzleType.EIGHT_BALL_QUIZ && (
                <TriviaQuiz 
                  onGameWin={(_, __, score, correctCount) => {
                    handleTriviaGameWin(score, correctCount);
                  }}
                  onClose={(isQuit) => closeGame(false, isQuit)} 
                  onProgress={(progress, correctAnswers) => {
                    setPlayerProgress(progress);
                    if (correctAnswers !== undefined) {
                      setPlayerCorrectCount(correctAnswers);
                    }
                    if (roomRef.current) {
                      MultiplayerService.sendProgress(roomRef.current, progress, correctAnswers);
                    }
                  }}
                  seed={gameSeed}
                  isOnline={selectedDifficultyRef.current === 'online' || selectedDifficultyRef.current === 'private_create' || selectedDifficultyRef.current === 'private_join'}
                  room={roomRef.current}
                  headerActions={renderHeaderActions()}
                  onPlaySound={triggerSound}
                />
              )}
              {activeGame === PuzzleType.SUDOKU && (
                <SudokuPuzzle 
                  onGameWin={handleGameWin}
                  onClose={(isQuit) => closeGame(false, isQuit)} 
                  onProgress={(progress) => {
                    setPlayerProgress(progress);
                    if (roomRef.current) {
                      MultiplayerService.sendProgress(roomRef.current, progress);
                    }
                  }}
                  room={roomRef.current}
                  headerActions={renderHeaderActions()}
                  onPlaySound={triggerSound}
                />
              )}
              {activeGame === PuzzleType.LOGIC && (
                <LogicPuzzle 
                  onGameWin={handleGameWin}
                  onClose={(isQuit) => closeGame(false, isQuit)} 
                  onProgress={(progress) => {
                    setPlayerProgress(progress);
                    if (roomRef.current) {
                      MultiplayerService.sendProgress(roomRef.current, progress);
                    }
                  }}
                  room={roomRef.current}
                  headerActions={renderHeaderActions()}
                  isOnline={selectedDifficultyRef.current === 'online' || selectedDifficultyRef.current === 'private_create' || selectedDifficultyRef.current === 'private_join'}
                  onPlaySound={triggerSound}
                  seed={gameSeed}
                />
              )}
              {activeGame === PuzzleType.JIGSAW && (
                <JigsawPuzzle 
                  onGameWin={handleGameWin}
                  onClose={(isQuit) => closeGame(false, isQuit)} 
                  onProgress={(progress) => {
                    setPlayerProgress(progress);
                    if (roomRef.current) {
                      MultiplayerService.sendProgress(roomRef.current, progress);
                    }
                  }}
                  room={roomRef.current}
                  username={userProfile.username}
                  headerActions={renderHeaderActions()}
                  isOnline={selectedDifficultyRef.current === 'online' || selectedDifficultyRef.current === 'private_create' || selectedDifficultyRef.current === 'private_join'}
                  onPlaySound={triggerSound}
                />
              )}
              {activeGame === PuzzleType.PHYSICS && (
                <PhysicsPuzzle 
                  key={`${gameSeed}_${currentRound}`}
                  onGameWin={handleGameWin}
                  onClose={(isQuit) => closeGame(false, isQuit)} 
                  onProgress={(progress) => {
                    setPlayerProgress(progress);
                    if (roomRef.current) {
                      MultiplayerService.sendProgress(roomRef.current, progress);
                    }
                  }}
                  seed={selectedDifficultyRef.current === 'solo' ? undefined : gameSeed}
                  room={roomRef.current}
                  headerActions={renderHeaderActions()}
                  isOnline={selectedDifficultyRef.current === 'online' || selectedDifficultyRef.current === 'private_create' || selectedDifficultyRef.current === 'private_join'}
                  onPlaySound={triggerSound}
                />
              )}
              {activeGame === PuzzleType.BLOCK_BLUSTER && (
                <BlockBluster 
                  onGameWin={handleGameWin}
                  onClose={(isQuit) => closeGame(false, isQuit)} 
                  onProgress={(progress) => {
                    setPlayerProgress(progress);
                    if (roomRef.current) {
                      MultiplayerService.sendProgress(roomRef.current, progress);
                    }
                  }}
                  room={roomRef.current}
                  headerActions={renderHeaderActions()}
                  onPlaySound={triggerSound}
                />
              )}
              {activeGame === PuzzleType.WORD_SEARCH && (
                <WordSearch 
                  onGameWin={handleGameWin}
                  onClose={(isQuit) => closeGame(false, isQuit)} 
                  onProgress={(progress) => {
                    setPlayerProgress(progress);
                    if (roomRef.current) {
                      MultiplayerService.sendProgress(roomRef.current, progress);
                    }
                  }}
                  room={roomRef.current}
                  headerActions={renderHeaderActions()}
                  onPlaySound={triggerSound}
                />
              )}
              {activeGame === PuzzleType.TOWER_BLOXX && (
                <TowerBloxx 
                  onGameWin={handleGameWin}
                  onClose={(isQuit) => closeGame(false, isQuit)} 
                  onProgress={(progress) => {
                    setPlayerProgress(progress);
                    if (roomRef.current) {
                      MultiplayerService.sendProgress(roomRef.current, progress);
                    }
                  }}
                  room={roomRef.current}
                  headerActions={renderHeaderActions()}
                  onPlaySound={triggerSound}
                />
              )}

              {activeGame === PuzzleType.MENTAL_MATH && (
                <MentalMathChallenge 
                  onGameWin={handleGameWin}
                  onClose={(isQuit) => closeGame(false, isQuit)} 
                  onProgress={(progress) => {
                    setPlayerProgress(progress);
                    if (roomRef.current) {
                      MultiplayerService.sendProgress(roomRef.current, progress);
                    }
                  }}
                  seed={gameSeed}
                  isOnline={selectedDifficultyRef.current === 'online' || selectedDifficultyRef.current === 'private_create' || selectedDifficultyRef.current === 'private_join'}
                  room={roomRef.current}
                  headerActions={renderHeaderActions()}
                  onPlaySound={triggerSound}
                />
              )}
              {/* In-game Chat pop-up overlay */}
              {isInGameChatOpen && (
                <div style={{
                  position: 'absolute',
                  bottom: '24px',
                  right: '24px',
                  width: '340px',
                  height: '420px',
                  background: isLightMode ? 'rgba(255, 255, 255, 0.82)' : 'rgba(15, 23, 42, 0.82)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '20px',
                  border: '1px solid var(--border-glass)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                  zIndex: 2000,
                  display: 'flex',
                  flexDirection: 'column',
                  fontFamily: "'Outfit', sans-serif",
                  transform: `translate(${inGameChatPosition.x}px, ${inGameChatPosition.y}px)`
                }}>
                  {/* Drawer Header */}
                  <div 
                    onMouseDown={handleInGameChatMouseDown}
                    title="Drag to reposition chat"
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'grab',
                      userSelect: 'none'
                    }}
                  >
                    <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: 0 }}>Game Chat</h3>
                    <button
                      onClick={() => { triggerSound('click'); setIsInGameChatOpen(false); }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '16px',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Messages Feed */}
                  <div 
                    style={{
                      flex: 1,
                      padding: '16px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                    ref={(el) => {
                      if (el) {
                        el.scrollTop = el.scrollHeight;
                      }
                    }}
                  >
                    {chatMessages.length === 0 ? (
                      <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                        No messages yet.
                        <div style={{ fontSize: '11px', marginTop: '6px', fontWeight: 'bold' }}>
                          Please keep it friendly and civil!
                        </div>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => {
                        const isMe = msg.senderId === userProfile.id;
                        return (
                          <div 
                            key={idx} 
                            style={{
                              alignSelf: isMe ? 'flex-end' : 'flex-start',
                              maxWidth: '85%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: isMe ? 'flex-end' : 'flex-start'
                            }}
                          >
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', padding: '0 4px' }}>
                              {msg.username}
                            </span>
                            <div style={{
                              background: isMe 
                                  ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' 
                                  : (isLightMode ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)'),
                              color: isMe ? '#ffffff' : 'var(--text-primary)',
                              padding: '8px 12px',
                              borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                              fontSize: '13px',
                              lineHeight: '1.4',
                              border: isMe ? 'none' : '1px solid var(--border-glass)',
                              wordBreak: 'break-word'
                            }}>
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Chat Input form */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!chatInput.trim()) return;
                      
                      // Block check
                      if (opponentInfo) {
                        const oppId = opponentInfo.id || '';
                        const isBlocked = oppId && (
                          (roomBlocksRef.current[userProfile.id] || []).includes(oppId) ||
                          (roomBlocksRef.current[oppId] || []).includes(userProfile.id)
                        );
                        if (isBlocked) {
                          showToast("Chat is disabled because one of you has blocked the other.", 'error');
                          return;
                        }
                      }

                      if (roomRef.current) {
                        MultiplayerService.sendChatMessage(roomRef.current, chatInput.trim());
                        setChatInput('');
                      }
                    }}
                    style={{
                      display: 'flex',
                      borderTop: '1px solid var(--border-glass)',
                      padding: '8px',
                      background: 'rgba(0,0,0,0.1)'
                    }}
                  >
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a message..."
                      maxLength={100}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        padding: '8px 12px',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      style={{
                        padding: '6px 16px',
                        fontSize: '12px',
                        borderRadius: '8px'
                      }}
                    >
                      Send
                    </button>
                  </form>
                </div>
              )}
            </div>

          </div>
        )}

        {/* 🎛️ TAB VIEW DISPATCHER */}
        
        {/* ========================================================
            TAB 1: LOBBY ARENA (PLAY HOME)
            ======================================================== */}
        {activeTab === 'home' && (
          <section className={entranceClass} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Matchmaking Queue Banner */}
            {matchmakingState !== 'idle' && (
              <div 
                className="glass-panel" 
                style={{ 
                  padding: '20px', 
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.15))',
                  border: '1px solid rgba(139,92,246,0.3)',
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}
              >
                <div>
                  <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {matchmakingState === 'searching' && <span className="animate-float">🛰️</span>}
                    {matchmakingState === 'searching' 
                      ? (privatePin 
                        ? (isFriendChallengeDuel 
                          ? `🔑 Private Friend Duel Room [${getPuzzleName(queuedPuzzle)}]`
                          : `🔑 Private Friend Duel Room (PIN: ${privatePin}) [${getPuzzleName(queuedPuzzle)}]`
                          )
                        : `Searching for opponents in ${getPuzzleName(queuedPuzzle)}...`
                        )
                      : 'Opponent Found! Connecting...'}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                    {matchmakingState === 'searching' 
                      ? (privatePin 
                        ? (isFriendChallengeDuel
                          ? 'Waiting for your friend to start.'
                          : `Waiting for your friend to enter PIN: ${privatePin} to start. Share the PIN with them!`
                          )
                        : `Queue time: ${matchmakingTimer}s | Mode: 1v1 Competitive | Match Seed: Syncing...`
                        )
                      : `Preparing board. Rival: ${opponentInfo?.username} (${opponentInfo?.rank})`
                    }
                  </p>
                </div>
                {matchmakingState === 'searching' && (
                  <button className="btn btn-danger" onClick={cancelMatchmaking}>
                    Cancel Search
                  </button>
                )}
              </div>
            )}

            {/* Main Battle Arena Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '8px 4px' }}>
                <h3 style={{ fontSize: '22px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Gamepad2 size={24} color="var(--color-primary)" />
                  {t('online_battle')}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                  {t('select_category')}
                </p>
              </div>

              <div className="battle-arena-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {[
                  { 
                    type: PuzzleType.SLIDING, 
                    name: t('sliding_name'), 
                    desc: t('sliding_desc'), 
                    badge: 'SPEED & GRID', 
                    color: '#3b82f6' 
                  },
                  { 
                    type: PuzzleType.WORD, 
                    name: t('word_name'), 
                    desc: t('word_desc'), 
                    badge: 'LOGIC & LETTERS', 
                    color: '#ec4899' 
                  },
                  { 
                    type: PuzzleType.EIGHT_BALL_QUIZ, 
                    name: t('trivia_name'), 
                    desc: t('trivia_desc'), 
                    badge: 'KNOWLEDGE & SPEED', 
                    color: '#10b981' 
                  },
                  { 
                    type: PuzzleType.SUDOKU, 
                    name: t('sudoku_name'), 
                    desc: t('sudoku_desc'), 
                    badge: 'DEDUCTION & NUMBERS', 
                    color: '#eab308' 
                  },
                  { 
                    type: PuzzleType.LOGIC, 
                    name: t('logic_name'), 
                    desc: t('logic_desc'), 
                    badge: 'LOGIC & REASONING', 
                    color: '#4f46e5' 
                  },
                  { 
                    type: PuzzleType.PHYSICS, 
                    name: t('physics_name'), 
                    desc: t('physics_desc'), 
                    badge: 'PHYSICS & VECTORS', 
                    color: '#06b6d4' 
                  },
                  { 
                    type: PuzzleType.BLOCK_BLUSTER, 
                    name: t('block_bluster_name'), 
                    desc: t('block_bluster_desc'), 
                    badge: 'BLOCKS & COMBOS', 
                    color: '#d946ef' 
                  },
                  { 
                    type: PuzzleType.WORD_SEARCH, 
                    name: t('word_search_name'), 
                    desc: t('word_search_desc'), 
                    badge: 'SPATIAL & WORDS', 
                    color: '#f43f5e' 
                  },
                  { 
                    type: PuzzleType.TOWER_BLOXX, 
                    name: t('tower_bloxx_name'), 
                    desc: t('tower_bloxx_desc'), 
                    badge: 'TIMING & PHYSICS', 
                    color: '#14b8a6' 
                  },
                  {
                    type: PuzzleType.MENTAL_MATH,
                    name: t('mental_math_name'),
                    desc: t('mental_math_desc'),
                    badge: 'ARITHMETIC & MEMORY',
                    color: '#f97316'
                  }
                ].map(puzzle => (
                  <div 
                    key={puzzle.type} 
                    className="glass-panel" 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between', 
                      gap: '20px',
                      borderTop: `3px solid ${puzzle.color}`,
                      background: 'var(--bg-glass)',
                      padding: '24px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '9px', background: `${puzzle.color}20`, border: `1px solid ${puzzle.color}50`, color: puzzle.color, fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {puzzle.badge}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>1v1 Ranked</span>
                          {(() => {
                            const count = matchmakingQueues[puzzle.type] || 0;
                            if (count > 0) {
                              return (
                                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  🟢 {count} Searching
                                </span>
                              );
                            } else {
                              return (
                                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  ⚪ No Players Searching
                                </span>
                              );
                            }
                          })()}
                        </div>
                      </div>
                      <h4 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '14px', fontFamily: 'var(--font-display)' }}>
                        {puzzle.name}
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.5' }}>
                        {puzzle.desc}
                      </p>
                    </div>

                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%', gap: '8px', background: `linear-gradient(to right, ${puzzle.color}, rgba(0,0,0,0.1))` }}
                      onClick={() => setDifficultyModal({ puzzleType: puzzle.type })}
                      disabled={matchmakingState !== 'idle'}
                    >
                      <Gamepad2 size={16} />
                      {t('play_match')}
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-glass)', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '10px', alignItems: 'center', marginTop: '8px' }}>
                <ShieldAlert size={18} color="var(--color-primary)" />
                <span>Fair play active: disconnecting or forfeiting during active multiplayer duels registers as a rating drop.</span>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================
            TAB 2: PLAYER PROFILE
            ======================================================== */}
        {activeTab === 'profile' && (
          <section className={`${entranceClass} ${activeGame && isGameHidden ? 'active-game-overlay-tab' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
              {renderAvatar(userProfile.avatar, userProfile.frame, 90)}

              <div style={{ flex: 1 }}>
                {isEditingName ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px', background: 'var(--bg-glass)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-glass)', maxWidth: '400px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('enter_new_username')}:</label>
                    <input 
                      type="text" 
                      value={newNameInput}
                      onChange={e => setNewNameInput(e.target.value)}
                      className="btn btn-glass"
                      style={{ textAlign: 'left', width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.15)', fontSize: '14px', color: 'var(--text-primary)' }}
                      maxLength={20}
                      placeholder={t('new_username_placeholder')}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button 
                        className="btn btn-primary"
                        style={{ fontSize: '12px', padding: '6px 12px', flex: 1 }}
                        onClick={() => {
                          const res = changeUsername(newNameInput, 'coins');
                          if (res.success) {
                            triggerSound('success');
                            setIsEditingName(false);
                          } else {
                            triggerSound('fail');
                            showToast(res.error || '', 'error');
                          }
                        }}
                      >
                        🪙 650 Coins
                      </button>
                      <button 
                        className="btn btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px', flex: 1 }}
                        onClick={() => {
                          const res = changeUsername(newNameInput, 'gems');
                          if (res.success) {
                            triggerSound('success');
                            setIsEditingName(false);
                          } else {
                            triggerSound('fail');
                            showToast(res.error || '', 'error');
                          }
                        }}
                      >
                        💎 150 Gems
                      </button>
                    </div>
                    <button 
                      className="btn btn-glass"
                      style={{ fontSize: '11px', padding: '4px 8px', marginTop: '4px' }}
                      onClick={() => setIsEditingName(false)}
                    >
                      {t('cancel')}
                    </button>
                  </div>
                ) : (
                  <h3 
                    className={userProfile.nameColor?.startsWith('name-fx-') ? userProfile.nameColor : ''}
                    style={{ 
                      fontSize: '22px', 
                      color: userProfile.nameColor?.startsWith('name-fx-') ? undefined : (userProfile.nameColor || 'var(--text-primary)'), 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px' 
                    }}
                  >
                    {userProfile.username}
                    {userProfile.badges.map((badge, idx) => (
                      <span key={idx} style={{ fontSize: '16px' }}>{badge}</span>
                    ))}
                    <button 
                      onClick={() => { triggerSound('click'); setNewNameInput(userProfile.username); setIsEditingName(true); }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', marginLeft: '6px' }}
                      title="Change Name"
                    >
                      ✏️
                    </button>
                  </h3>
                )}
                
                {/* Editing status bio */}
                <div style={{ marginTop: '8px' }}>
                  {isEditingStatus ? (
                    <form onSubmit={handleStatusSubmit} style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        value={customStatusInput}
                        onChange={e => setCustomStatusInput(e.target.value)}
                        className="btn btn-glass"
                        style={{ textAlign: 'left', flex: 1, padding: '6px 12px', background: 'rgba(0,0,0,0.2)', fontSize: '13px' }}
                        maxLength={60}
                        autoFocus
                      />
                      <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}>{t('save')}</button>
                      <button type="button" className="btn btn-glass" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => setIsEditingStatus(false)}>{t('cancel')}</button>
                    </form>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      "{userProfile.status || 'No status bio set.'}"
                      <button 
                        onClick={() => { triggerSound('click'); setIsEditingStatus(true); }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer', fontSize: '12px' }}
                      >
                        [{t('edit_bio')}]
                      </button>
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-glass)', padding: '3px 8px', borderRadius: '8px', border: '1px solid var(--border-glass)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    🆔 ID: <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--text-primary)' }}>{userProfile.id}</span>
                  </span>
                  <button
                    onClick={() => {
                      triggerSound('click');
                      navigator.clipboard.writeText(userProfile.id);
                      setIdCopied(true);
                      setTimeout(() => setIdCopied(false), 2000);
                    }}
                    style={{
                      background: 'var(--bg-glass)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      color: idCopied ? '#10b981' : 'var(--text-secondary)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    title="Copy ID"
                  >
                    {idCopied ? <Check size={12} /> : <Copy size={12} />}
                    {idCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <span>{t('games_played')}: <strong style={{ color: 'var(--text-primary)' }}>{userProfile.statistics.gamesPlayed}</strong></span>
                  <span>{t('games_won')}: <strong style={{ color: 'var(--text-primary)' }}>{userProfile.statistics.gamesWon}</strong></span>
                  <span>{t('level_progress')}: <strong style={{ color: 'var(--text-primary)' }}>{Math.floor((userProfile.xp / (userProfile.level * 100)) * 100)}%</strong></span>
                </div>

                <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.15)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Level up in the arena to unlock premium cosmetics and coin drops.</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', borderTop: '1px solid rgba(139, 92, 246, 0.1)', paddingTop: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Pass Tier Progress: <strong style={{ color: 'var(--text-primary)' }}>Level {userProfile.level}</strong></span>
                    <span style={{ color: 'var(--text-muted)' }}>XP: <strong style={{ color: 'var(--text-primary)' }}>{userProfile.xp} / {userProfile.level * 100}</strong></span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginTop: '4px',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: `${Math.max(0, Math.min(100, (userProfile.xp / (userProfile.level * 100)) * 100))}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease-out'
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Puzzle specific statistics */}
            <div>
              <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '14px' }}>{t('puzzle_stats')}</h3>
              <div className="grid-3">
                {[
                  { name: t('sliding_name'), stats: userProfile.statistics.puzzleSpecificStats[PuzzleType.SLIDING], color: '#3b82f6' },
                  { name: t('word_name'), stats: userProfile.statistics.puzzleSpecificStats[PuzzleType.WORD], color: '#ec4899' },
                  { name: t('trivia_name'), stats: userProfile.statistics.puzzleSpecificStats[PuzzleType.EIGHT_BALL_QUIZ], color: '#10b981' },
                  { name: t('sudoku_name'), stats: userProfile.statistics.puzzleSpecificStats[PuzzleType.SUDOKU], color: '#eab308' },
                  { name: t('logic_name'), stats: userProfile.statistics.puzzleSpecificStats[PuzzleType.LOGIC], color: '#4f46e5' },
                  { name: t('jigsaw_name'), stats: userProfile.statistics.puzzleSpecificStats[PuzzleType.JIGSAW], color: '#ef4444' },
                  { name: t('physics_name'), stats: userProfile.statistics.puzzleSpecificStats[PuzzleType.PHYSICS], color: '#06b6d4' },
                  { name: t('block_bluster_name'), stats: userProfile.statistics.puzzleSpecificStats[PuzzleType.BLOCK_BLUSTER], color: '#d946ef' },
                  { name: t('word_search_name'), stats: userProfile.statistics.puzzleSpecificStats[PuzzleType.WORD_SEARCH], color: '#f43f5e' },
                  { name: t('tower_bloxx_name'), stats: userProfile.statistics.puzzleSpecificStats[PuzzleType.TOWER_BLOXX], color: '#14b8a6' },
                  { name: t('mental_math_name'), stats: userProfile.statistics.puzzleSpecificStats[PuzzleType.MENTAL_MATH], color: '#f97316' }
                ].map((item, idx) => (
                  <div key={idx} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', borderTop: `3px solid ${item.color}` }}>
                    <h4 style={{ color: item.color, fontSize: '14px' }}>{item.name}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Solved:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.stats?.solved || 0} / {item.stats?.played || 0}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Best Time:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.stats?.bestTime ? `${item.stats.bestTime}s` : 'N/A'}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================
            TAB 3: COSMETIC SHOP & INVENTORY
            ======================================================== */}
        {activeTab === 'store' && (
          <section className={entranceClass} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div>
              <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '4px' }}>{t('lobby_shop_title')}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '18px' }}>
                {t('lobby_shop_subtitle')}
              </p>

              <div className="grid-3">
                {storeItems.map(item => {
                  const isOwned = userProfile.inventory.includes(item.id);
                  let isEquipped = false;

                  if (item.type === 'NAME_COLOR') isEquipped = userProfile.nameColor === item.value;
                  else if (item.type === 'BADGE') isEquipped = userProfile.badges.includes(item.value);
                  else if (item.type === 'LOBBY_ANIMATION') isEquipped = userProfile.lobbyEntranceAnimation === item.value;

                  return (
                    <div 
                      key={item.id} 
                      className="glass-panel store-shiny-card"
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '12px',
                        borderColor: isEquipped ? 'var(--border-glass-active)' : undefined,
                        boxShadow: isEquipped ? 'var(--glow-primary)' : undefined
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: '10px', color: 'var(--color-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {item.type.replace('_', ' ')}
                          </span>
                          <h4 style={{ fontSize: '16px', color: 'var(--text-primary)', marginTop: '2px' }}>{item.name}</h4>
                        </div>
                        {item.type === 'BADGE' && (
                          <div className="badge-icon badge-royal" style={{ animation: 'none' }}>
                            {item.value}
                          </div>
                        )}
                        {item.type === 'NAME_COLOR' && (
                          item.value.startsWith('name-fx-') ? (
                            <span className={item.value} style={{ fontSize: '14px', fontWeight: 'bold' }}>
                              Sample Name
                            </span>
                          ) : (
                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: item.value, border: '1px solid rgba(255,255,255,0.2)' }} />
                          )
                        )}
                      </div>

                      <p style={{ color: 'var(--text-muted)', fontSize: '13px', flex: 1 }}>{item.description}</p>

                      <div style={{ display: 'flex', justifySelf: 'flex-end', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '10px', marginTop: '6px' }}>
                        
                        {!isOwned && (
                          <div style={{ display: 'flex', gap: '6px', fontSize: '14px', fontWeight: 'bold' }}>
                            {item.costCoins > 0 && (
                              <span style={{ color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <Coins size={14} /> {item.costCoins}
                              </span>
                            )}
                            {item.costGems > 0 && (
                              <span style={{ color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <Gem size={14} /> {item.costGems}
                              </span>
                            )}
                          </div>
                        )}

                        {isOwned ? (
                          <button 
                            className={`btn ${isEquipped ? 'btn-secondary' : 'btn-glass'}`}
                            style={{ width: '100%', padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => { triggerSound('click'); equipCosmetic(item.id, item.type as any); }}
                          >
                            {isEquipped ? <Check size={12} /> : null}
                            {isEquipped ? t('equipped') : t('equip_item')}
                          </button>
                        ) : (
                          <button 
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => {
                              const res = buyStoreItem(item.id);
                              if (res.success) {
                                triggerSound('success');
                                showToast("Item purchased successfully!", 'success');
                              } else {
                                triggerSound('fail');
                                showToast(`Buy Failed: ${res.error}`, 'error');
                              }
                            }}
                          >
                            {t('buy_item')}
                          </button>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================
            TAB 4: LEADERBOARDS
            ======================================================== */}
        {activeTab === 'leaderboard' && (
          <section className={entranceClass} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', margin: 0 }}>{t('leaderboard_title')}</h3>
                <button 
                  onClick={() => {
                    triggerSound('click');
                    refreshLeaderboard();
                  }}
                  className="btn btn-glass"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-glass)',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCw size={14} /> Refresh Ranks
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '12px 16px' }}>Rank</th>
                      <th style={{ padding: '12px 16px' }}>Player</th>
                      <th style={{ padding: '12px 16px' }}>League</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Rating Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Deduplicate: keep only the highest score per unique userId for GLOBAL entries
                      const globalEntries = leaderboard.filter(e => e.puzzleType === 'GLOBAL');
                      const bestByUser = new Map<string, typeof leaderboard[0]>();
                      globalEntries.forEach(entry => {
                        const existing = bestByUser.get(entry.userId);
                        if (!existing || entry.score > existing.score) {
                          bestByUser.set(entry.userId, entry);
                        }
                      });
                      const sortedLeaderboard = Array.from(bestByUser.values())
                        .sort((a, b) => b.score - a.score);

                      const rows = sortedLeaderboard.slice(0, 20).map((entry, idx) => {
                        const isMe = entry.userId === userProfile.id;
                        return (
                          <tr 
                            key={entry.userId} 
                            style={{ 
                              borderBottom: '1px solid rgba(255,255,255,0.02)', 
                              background: isMe ? 'rgba(139,92,246,0.06)' : undefined 
                            }}
                          >
                            <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: '500' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {renderAvatar(isMe ? userProfile.avatar : (entry.avatar || '👤'), isMe ? (userProfile.frame || 'none') : (entry.frame || 'none'), 28)}
                                <span 
                                  className={entry.nameColor?.startsWith('name-fx-') ? entry.nameColor : (isMe && userProfile.nameColor?.startsWith('name-fx-') ? userProfile.nameColor : '')}
                                  style={{ 
                                    color: (entry.nameColor?.startsWith('name-fx-') || (isMe && userProfile.nameColor?.startsWith('name-fx-')))
                                      ? undefined 
                                      : (entry.nameColor || (isMe ? userProfile.nameColor : undefined) || (isMe ? 'var(--color-secondary)' : 'var(--text-primary)')),
                                    cursor: isAdmin ? 'pointer' : 'default',
                                    textDecoration: isAdmin ? 'underline' : 'none'
                                  }}
                                  onClick={() => {
                                    if (isAdmin) {
                                      const found = adminUsersList.find(u => u.id === entry.userId || u.username.toLowerCase() === entry.username.toLowerCase());
                                      if (found) {
                                        setSelectedAdminUser(found);
                                        setIsUserViewBoxOpen(true);
                                        triggerSound('click');
                                      } else {
                                        // Construct fallback stub profile from leaderboard stats
                                        const stubUser = {
                                          id: entry.userId,
                                          username: entry.username,
                                          avatar: entry.avatar || '👤',
                                          frame: entry.frame || 'none',
                                          rank: entry.rank || 'BRONZE',
                                          nameColor: entry.nameColor || '',
                                          coins: 0,
                                          gems: 0,
                                          level: 1,
                                          xp: 0,
                                          badges: entry.badges ? entry.badges.split(',') : [],
                                          inventory: [],
                                          status: 'Leaderboard Profile Details',
                                          statistics: {
                                            gamesPlayed: 0,
                                            gamesWon: 0,
                                            totalSolveTime: 0,
                                            highestStreak: 0,
                                            puzzleSpecificStats: {}
                                          }
                                        };
                                        setSelectedAdminUser(stubUser);
                                        setIsUserViewBoxOpen(true);
                                        triggerSound('click');
                                      }
                                    }
                                  }}
                                  title={isAdmin ? "Click to view user profile details" : undefined}
                                >
                                  {entry.username}
                                </span>
                              </div>
                              {isMe && <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '4px', fontWeight: 'normal' }}>(You)</span>}
                              {(() => {
                                const entryBadges = entry.badges ? entry.badges.split(',') : (isMe ? userProfile.badges : []);
                                if (entryBadges && entryBadges.length > 0) {
                                  return (
                                    <span style={{ marginLeft: '6px', display: 'inline-flex', gap: '3px' }}>
                                      {entryBadges.map((badge, bIdx) => (
                                        <span key={bIdx} title="Equipped Badge" style={{ fontSize: '14px' }}>{badge}</span>
                                      ))}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                                {entry.rank}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
                              {entry.score} pts
                            </td>
                          </tr>
                        );
                      });

                      const showMyRowAtBottom = userProfile.id.startsWith('10') && 
                        sortedLeaderboard.findIndex(entry => entry.userId === userProfile.id) >= 20;
                      
                      const showMyRowIfNotFound = userProfile.id.startsWith('10') && 
                        sortedLeaderboard.findIndex(entry => entry.userId === userProfile.id) === -1;

                      if (showMyRowAtBottom) {
                        const myIdx = sortedLeaderboard.findIndex(entry => entry.userId === userProfile.id);
                        const myEntry = sortedLeaderboard[myIdx];
                        rows.push(
                          <React.Fragment key="separator">
                            <tr style={{ height: '8px' }}>
                              <td colSpan={4} style={{ borderBottom: '1px dashed var(--border-glass)' }} />
                            </tr>
                            <tr style={{ background: 'rgba(139,92,246,0.12)', borderTop: '2px solid var(--color-primary)' }}>
                              <td style={{ padding: '12px 16px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                #{myIdx + 1}
                              </td>
                              <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  {renderAvatar(userProfile.avatar, userProfile.frame, 28)}
                                  <span className={userProfile.nameColor?.startsWith('name-fx-') ? userProfile.nameColor : ''} style={{ color: userProfile.nameColor?.startsWith('name-fx-') ? undefined : (userProfile.nameColor || 'var(--color-secondary)') }}>
                                    {userProfile.username}
                                  </span>
                                </div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '4px', fontWeight: 'normal' }}>(You)</span>
                                {userProfile.badges && userProfile.badges.length > 0 && (
                                  <span style={{ marginLeft: '6px', display: 'inline-flex', gap: '3px' }}>
                                    {userProfile.badges.map((badge, bIdx) => (
                                      <span key={bIdx} title="Equipped Badge" style={{ fontSize: '14px' }}>{badge}</span>
                                    ))}
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                                  {myEntry.rank}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
                                {myEntry.score} pts
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      } else if (showMyRowIfNotFound) {
                        const myRank = sortedLeaderboard.length + 1;
                        rows.push(
                          <React.Fragment key="separator">
                            <tr style={{ height: '8px' }}>
                              <td colSpan={4} style={{ borderBottom: '1px dashed var(--border-glass)' }} />
                            </tr>
                            <tr style={{ background: 'rgba(139,92,246,0.12)', borderTop: '2px solid var(--color-primary)' }}>
                              <td style={{ padding: '12px 16px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                #{myRank}
                              </td>
                              <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  {renderAvatar(userProfile.avatar, userProfile.frame, 28)}
                                  <span className={userProfile.nameColor?.startsWith('name-fx-') ? userProfile.nameColor : ''} style={{ color: userProfile.nameColor?.startsWith('name-fx-') ? undefined : (userProfile.nameColor || 'var(--color-secondary)') }}>
                                    {userProfile.username}
                                  </span>
                                </div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '4px', fontWeight: 'normal' }}>(You)</span>
                                {userProfile.badges && userProfile.badges.length > 0 && (
                                  <span style={{ marginLeft: '6px', display: 'inline-flex', gap: '3px' }}>
                                    {userProfile.badges.map((badge, bIdx) => (
                                      <span key={bIdx} title="Equipped Badge" style={{ fontSize: '14px' }}>{badge}</span>
                                    ))}
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                                  {userProfile.rank}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
                                0 pts
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      }

                      return rows;
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================
            TAB 5: TOURNAMENTS
            ======================================================= */}
        {/* ========================================================
            TAB 5: CHANGE AVATAR & FRAME
            ======================================================= */}
        {activeTab === 'avatars' && (
          <section className={entranceClass} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Live Preview Card */}
            <div className="glass-panel" style={{ display: 'flex', gap: '24px', alignItems: 'center', background: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.25)' }}>
              {renderAvatar(userProfile.avatar, userProfile.frame, 80)}
              <div>
                <h3 className={userProfile.nameColor?.startsWith('name-fx-') ? userProfile.nameColor : ''} style={{ fontSize: '22px', color: userProfile.nameColor?.startsWith('name-fx-') ? undefined : (userProfile.nameColor || 'var(--text-primary)'), fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {userProfile.username}
                  {userProfile.badges.map((badge, idx) => (
                    <span key={idx} style={{ fontSize: '14px' }} title="Equipped Badge">{badge}</span>
                  ))}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                  Level {userProfile.level} • {userProfile.rank} Rank
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic', marginTop: '6px' }}>
                  "{userProfile.status || 'Ready to solve the universe.'}"
                </p>
              </div>
            </div>

            {/* Selector Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Avatar Options */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '18px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Select Avatar</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Choose a profile mascot icon.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                  {AVAILABLE_AVATARS.map(av => {
                    const isSelected = userProfile.avatar === av.char;
                    const isOwned = (av.costCoins === 0 && av.costGems === 0) || userProfile.inventory.includes(av.id);
                    return (
                      <div 
                        key={av.id}
                        onClick={() => {
                          if (isOwned) {
                            triggerSound('click');
                            updateAvatarAndFrame(av.char, userProfile.frame || 'none');
                          } else {
                            setShopConfirm({
                              itemName: av.label,
                              costCoins: av.costCoins,
                              costGems: av.costGems,
                              onConfirm: () => {
                                const res = buyAvatarOrFrame(av.id, av.costCoins, av.costGems, av.char, String(userProfile.frame || ''));
                                if (res.success) {
                                  triggerSound('success');
                                  showToast("Item purchased successfully!", 'success');
                                } else {
                                  triggerSound('fail');
                                  showToast(res.error || '', 'error');
                                }
                              }
                            });
                          }
                        }}
                        style={{
                          background: isSelected 
                            ? (isLightMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.2)') 
                            : (isLightMode ? '#ffffff' : 'rgba(255, 255, 255, 0.03)'),
                          border: isSelected 
                            ? '2px solid var(--color-primary)' 
                            : (isLightMode ? '1px solid #e2e8f0' : '1px solid var(--border-glass)'),
                          boxShadow: isLightMode ? '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' : undefined,
                          borderRadius: '12px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <span style={{ fontSize: '32px' }}>{av.char}</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', textAlign: 'center', width: '100%', wordBreak: 'break-word' }}>
                          {av.label}
                        </span>
                        {!isOwned && (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px', 
                            fontSize: '12px', 
                            background: isLightMode ? '#f1f5f9' : 'rgba(0,0,0,0.6)', 
                            border: isLightMode ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.08)',
                            color: isLightMode ? '#334155' : '#ffffff',
                            padding: '4px 8px', 
                            borderRadius: '6px', 
                            marginTop: '4px' 
                          }}>
                            <span style={{ fontSize: '12px' }}>🔒</span>
                            {av.costCoins > 0 && <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{av.costCoins}🪙</span>}
                            {av.costGems > 0 && <span style={{ color: '#0ea5e9', fontWeight: 'bold' }}>{av.costGems}💎</span>}
                          </div>
                        )}
                        {isOwned && isSelected && (
                          <div style={{ 
                            position: 'absolute', 
                            top: '6px', 
                            right: '6px', 
                            width: '20px', 
                            height: '20px', 
                            borderRadius: '50%', 
                            background: '#22c55e', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            zIndex: 2
                          }}>
                            <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold', lineHeight: 1 }}>✓</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Frame Options */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '18px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Select Frame</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Choose a glowing cosmic border.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                  {AVAILABLE_FRAMES.map(fr => {
                    const isSelected = userProfile.frame === fr.id;
                    const isOwned = (fr.costCoins === 0 && fr.costGems === 0) || userProfile.inventory.includes(fr.id);
                    return (
                      <div 
                        key={fr.id}
                        onClick={() => {
                          if (isOwned) {
                            triggerSound('click');
                            updateAvatarAndFrame(userProfile.avatar || '👤', fr.id);
                          } else {
                            setShopConfirm({
                              itemName: fr.label,
                              costCoins: fr.costCoins,
                              costGems: fr.costGems,
                              onConfirm: () => {
                                const res = buyAvatarOrFrame(fr.id, fr.costCoins, fr.costGems, String(userProfile.avatar || ''), fr.id);
                                if (res.success) {
                                  triggerSound('success');
                                  showToast("Item purchased successfully!", 'success');
                                } else {
                                  triggerSound('fail');
                                  showToast(res.error || '', 'error');
                                }
                              }
                            });
                          }
                        }}
                        style={{
                          background: isSelected 
                            ? (isLightMode ? 'rgba(6, 182, 212, 0.12)' : 'rgba(6, 182, 212, 0.15)') 
                            : (isLightMode ? '#ffffff' : 'rgba(255, 255, 255, 0.03)'),
                          border: isSelected 
                            ? '2px solid var(--color-secondary)' 
                            : (isLightMode ? '1px solid #e2e8f0' : '1px solid var(--border-glass)'),
                          boxShadow: isLightMode ? '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' : undefined,
                          borderRadius: '12px',
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        {renderAvatar(userProfile.avatar, fr.id, 44)}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 'bold', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {fr.label}
                          </span>
                          {!isOwned && (
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              fontSize: '12px', 
                              background: isLightMode ? '#f1f5f9' : 'rgba(0,0,0,0.6)', 
                              border: isLightMode ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.08)',
                              color: isLightMode ? '#334155' : '#ffffff',
                              padding: '3px 6px', 
                              borderRadius: '5px', 
                              width: 'fit-content' 
                            }}>
                              <span style={{ fontSize: '11px' }}>🔒</span>
                              {fr.costCoins > 0 && <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{fr.costCoins}🪙</span>}
                              {fr.costGems > 0 && <span style={{ color: '#0ea5e9', fontWeight: 'bold' }}>{fr.costGems}💎</span>}
                            </div>
                          )}
                        </div>
                        {isOwned && isSelected && (
                          <div style={{ 
                            position: 'absolute', 
                            top: '6px', 
                            right: '6px', 
                            width: '20px', 
                            height: '20px', 
                            borderRadius: '50%', 
                            background: '#22c55e', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            zIndex: 2
                          }}>
                            <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold', lineHeight: 1 }}>✓</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </section>
        )}

        {/* ========================================================
            TAB 6: BATTLE PASS
            ======================================================= */}
        {activeTab === 'battlepass' && (
          <section className={entranceClass} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.05), rgba(139,92,246,0.05))', border: '1px solid rgba(236,72,153,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '22px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {t('puzzle_pass')}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                    Level up in the arena to unlock premium cosmetics and coin drops.
                  </p>
                </div>
                <div style={{ background: 'rgba(236,72,153,0.15)', border: '1px solid var(--color-accent)', padding: '6px 12px', borderRadius: '10px', fontSize: '13px', color: 'var(--color-accent)', fontWeight: 'bold' }}>
                  Premium Active
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <span>{t('pass_tier')}: <strong>Level {userProfile.level}</strong></span>
                  <span>XP: {userProfile.xp} / {userProfile.level * 100}</span>
                </div>
                <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${(userProfile.xp / (userProfile.level * 100)) * 100}%`, height: '100%', background: 'linear-gradient(to right, var(--color-accent), var(--color-primary))' }} />
                </div>
              </div>
            </div>

            <div className="glass-panel">
              <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '16px' }}>{t('tier_roadmaps')}</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { tier: 1, name: 'Welcome Bonus Drop', reward: '🪙 150 Coins', levelRequired: 1 },
                  { tier: 2, name: 'Grandmaster Avatar Color', reward: '🎨 Electric Violet Name', levelRequired: 2 },
                  { tier: 3, name: 'Gem Pile Drop', reward: '💎 5 Gems', levelRequired: 3 },
                  { tier: 4, name: 'Beginner Badge', reward: '⚡ Speed Demon Badge', levelRequired: 5 },
                  { tier: 5, name: 'Victory Champion Crown Badge', reward: '👑 Puzzle Master Badge', levelRequired: 8 }
                ].map(tierItem => {
                  const isUnlocked = userProfile.level >= tierItem.levelRequired;
                  return (
                    <div 
                      key={tierItem.tier}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 20px',
                        background: isUnlocked ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.01)',
                        border: `1px solid ${isUnlocked ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-glass)'}`,
                        borderRadius: '12px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>TIER {tierItem.tier}</span>
                          <span style={{ fontSize: '11px', color: isUnlocked ? 'var(--color-success)' : 'var(--text-secondary)' }}>
                            {isUnlocked ? '✓ Unlocked' : `Requires Level ${tierItem.levelRequired}`}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', marginTop: '4px' }}>{tierItem.name}</h4>
                      </div>

                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-secondary)' }}>
                        {tierItem.reward}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================
            TAB 7: ACCESSIBILITY & AUDIO SETTINGS
            ======================================================= */}
        {activeTab === 'settings' && (
          <section className={`${entranceClass} ${activeGame && isGameHidden ? 'active-game-overlay-tab' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel">
              <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '16px' }}>{t('accessibility_display')}</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Language Selection Selector */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>{t('language')}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                      {t('select_language')}
                    </p>
                  </div>
                  <div>
                    <div style={{ position: 'relative', width: '220px' }}>
                      {/* Trigger Button */}
                      <div
                        onClick={() => {
                          triggerSound('click');
                          setIsSettingsLangDropdownOpen(!isSettingsLangDropdownOpen);
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 16px',
                          fontSize: '13px',
                          background: 'var(--bg-glass)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          userSelect: 'none'
                        }}
                      >
                        <span>{LANGUAGE_DISPLAY_NAMES[language] || language}</span>
                        <span style={{ fontSize: '10px', opacity: 0.7, marginLeft: '8px' }}>
                          {isSettingsLangDropdownOpen ? '▲' : '▼'}
                        </span>
                      </div>

                      {/* Dropdown Menu List */}
                      {isSettingsLangDropdownOpen && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          width: '240px',
                          maxHeight: '260px',
                          overflowY: 'auto',
                          background: isLightMode ? '#ffffff' : 'rgba(20, 18, 45, 0.98)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '12px',
                          marginTop: '6px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                          zIndex: 100,
                          padding: '6px'
                        }}>
                          {LANGUAGE_CONFIGS.map((config) => {
                            const isSelected = language === config.name;
                            return (
                              <div
                                key={config.name}
                                onClick={() => {
                                  if (!config.enabled) return;
                                  triggerSound('click');
                                  setLanguage(config.name);
                                  setIsSettingsLangDropdownOpen(false);
                                }}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  cursor: config.enabled ? 'pointer' : 'not-allowed',
                                  background: isSelected 
                                    ? 'rgba(139, 92, 246, 0.15)' 
                                    : 'transparent',
                                  color: config.enabled 
                                    ? 'var(--text-primary)' 
                                    : isLightMode ? '#94a3b8' : 'rgba(255, 255, 255, 0.35)',
                                  opacity: config.enabled ? 1 : 0.65,
                                  transition: 'all 0.15s ease',
                                  marginBottom: '2px'
                                }}
                                onMouseEnter={(e) => {
                                  if (config.enabled && !isSelected) {
                                    e.currentTarget.style.background = isLightMode ? '#f1f5f9' : 'rgba(255,255,255,0.05)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (config.enabled && !isSelected) {
                                    e.currentTarget.style.background = 'transparent';
                                  }
                                }}
                                title={!config.enabled ? 'This language will be available soon.' : undefined}
                              >
                                <span style={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
                                  {config.name} — {config.nativeName} {isSelected && ' ✓'}
                                </span>
                                {!config.enabled && (
                                  <span style={{
                                    fontSize: '9px',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    background: isLightMode ? '#e2e8f0' : 'rgba(255,255,255,0.08)',
                                    color: isLightMode ? '#64748b' : 'rgba(255,255,255,0.5)',
                                    fontWeight: 'bold'
                                  }}>
                                    {config.comingSoonText}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ width: '100%', height: '1px', background: 'var(--border-glass)' }} />

                {/* Theme Settings (Light/Dark Mode Toggle) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>{t('color_theme')}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                      {t('color_theme_desc')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => { triggerSound('click'); setIsLightMode(false); }}
                      className={`btn ${!isLightMode ? 'btn-primary' : 'btn-glass'}`}
                      style={{ fontSize: '13px', padding: '8px 16px', cursor: 'pointer' }}
                    >
                      {t('dark_mode')}
                    </button>
                    <button
                      onClick={() => { triggerSound('click'); setIsLightMode(true); }}
                      className={`btn ${isLightMode ? 'btn-primary' : 'btn-glass'}`}
                      style={{ fontSize: '13px', padding: '8px 16px', cursor: 'pointer' }}
                    >
                      {t('light_mode')}
                    </button>
                  </div>
                </div>

                <div style={{ width: '100%', height: '1px', background: 'var(--border-glass)' }} />

                {/* Audio & Sound Controller */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Audio & Sound Effects</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                      Toggle game sounds on/off and adjust the synthesizer volume.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        const newMute = !isMuted;
                        setIsMuted(newMute);
                        if (!newMute) {
                          synthSound('click', false, soundVolume);
                        }
                      }}
                      className={`btn ${isMuted ? 'btn-glass' : 'btn-primary'}`}
                      style={{ fontSize: '13px', padding: '8px 16px', cursor: 'pointer' }}
                    >
                      {isMuted ? '🔇 Muted' : '🔊 Sound On'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Volume:</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={soundVolume}
                        onChange={(e) => {
                          const vol = parseFloat(e.target.value);
                          setSoundVolume(vol);
                          synthSound('click', false, vol);
                        }}
                        style={{
                          accentColor: 'var(--color-primary)',
                          cursor: 'pointer',
                          width: '120px'
                        }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 'bold', width: '30px', display: 'inline-block', textAlign: 'right' }}>
                        {Math.round(soundVolume * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* 🎵 Background Music Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🎵 Background Music
                    </h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                      Play calm ambient music while you puzzle. Respects the mute toggle above.
                    </p>
                  </div>
                  <div
                    onClick={() => {
                      triggerSound('click');
                      setIsMusicOn(!isMusicOn);
                    }}
                    style={{
                      width: '52px',
                      height: '28px',
                      borderRadius: '14px',
                      background: isMusicOn
                        ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
                        : isLightMode ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.3s ease',
                      boxShadow: isMusicOn ? '0 0 12px rgba(139, 92, 246, 0.4)' : 'none',
                      flexShrink: 0
                    }}
                  >
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: '#fff',
                      position: 'absolute',
                      top: '3px',
                      left: isMusicOn ? '27px' : '3px',
                      transition: 'left 0.3s ease',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                </div>

                <div style={{ width: '100%', height: '1px', background: 'var(--border-glass)' }} />
                
                
                <div>
                  <h4 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{t('color_blind')}</h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { id: 'none', label: 'Default Theme (Normal)' },
                      { id: 'protanopia', label: 'Protanopia (Red-Green Shift)' },
                      { id: 'deuteranopia', label: 'Deuteranopia (Green Weakness)' },
                      { id: 'tritanopia', label: 'Tritanopia (Blue-Yellow Shift)' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => { triggerSound('click'); setColorBlindMode(mode.id as any); }}
                        className={`btn ${colorBlindMode === mode.id ? 'btn-primary' : 'btn-glass'}`}
                        style={{ fontSize: '13px', padding: '8px 12px' }}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 🙋 Help & Support */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Help & Support</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                      Experiencing issues? Open a support ticket to contact our help desk.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      triggerSound('click');
                      setIsSupportOpen(true);
                    }}
                    className="btn btn-glass"
                    style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Contact Support
                  </button>
                </div>

                <div style={{ width: '100%', height: '1px', background: 'var(--border-glass)' }} />

                {/* 📝 Terms & Conditions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Terms & Conditions</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                      Read our rules and guidelines. If viewing on mobile, please switch to desktop mode.
                    </p>
                  </div>
                  <a 
                    href="https://cognerix-stack.github.io/cognerix-legal/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => triggerSound('click')}
                    className="btn btn-glass"
                    style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                  >
                    View
                  </a>
                </div>

                <div style={{ width: '100%', height: '1px', background: 'var(--border-glass)' }} />

                {/* 🔒 Privacy Policy */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Privacy Policy</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                      Learn how we handle your data. If viewing on mobile, please switch to desktop mode.
                    </p>
                  </div>
                  <a 
                    href="https://cognerix-stack.github.io/cognerix-legal/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => triggerSound('click')}
                    className="btn btn-glass"
                    style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                  >
                    View
                  </a>
                </div>

                <div style={{ width: '100%', height: '1px', background: 'var(--border-glass)' }} />

                <div>
                  <h4 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Account</h4>
                  
                  {/* Account Login Details Display */}
                  <div style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxWidth: '400px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Login Method:</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                        {userProfile.email ? 'Google Account' : 'Guest Account'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {userProfile.email ? 'Gmail Address:' : 'Guest ID:'}
                      </span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontFamily: 'monospace' }}>
                        {userProfile.email || userProfile.id}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => {
                        triggerSound('click');
                        setGenericConfirm({
                          message: 'Are you sure you want to sign out? You will be taken back to the login screen.',
                          onConfirm: () => {
                            logoutUser();
                            localStorage.removeItem('pv_logged_in');
                            localStorage.removeItem('pv_terms_accepted');
                            setIsLoggedIn(false);
                          }
                        });
                      }}
                      className="btn btn-glass"
                      style={{ fontSize: '13px', padding: '10px 16px', color: 'var(--text-primary)', border: '1px solid var(--border-glass)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <LogOut size={14} /> Sign Out Account
                    </button>
                  </div>
                </div>

                {/* 👑 Admin Console: Player History */}
                {isAdmin && (
                  <div style={{ borderTop: '1px dashed rgba(139, 92, 246, 0.2)', paddingTop: '20px', marginTop: '10px' }}>
                    <h4 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      👑 Admin Control: Player History
                    </h4>
                    
                    <div style={{
                      background: 'rgba(139, 92, 246, 0.05)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      maxWidth: '600px'
                    }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                        Search by player ID to view their complete game history, including co-players (ID & name), timestamps, and room details.
                      </p>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text"
                          value={adminSearchHistoryId}
                          onChange={(e) => setAdminSearchHistoryId(e.target.value)}
                          placeholder="Enter Player ID (e.g. 10921736433)..."
                          style={{
                            flex: 1,
                            background: isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.1)',
                            border: isLightMode ? '1px solid #d1d5db' : '1px solid var(--border-glass)',
                            color: 'var(--text-primary)',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        />
                        <button
                          onClick={() => {
                            triggerSound('click');
                            fetchPlayerHistory(adminSearchHistoryId);
                          }}
                          disabled={adminHistoryLoading}
                          className="btn-hover-bright"
                          style={{
                            background: 'var(--color-primary)',
                            border: 'none',
                            color: 'white',
                            padding: '8px 20px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            opacity: adminHistoryLoading ? 0.6 : 1
                          }}
                        >
                          {adminHistoryLoading ? 'Searching...' : 'View'}
                        </button>
                      </div>

                      {adminHistorySearched && (
                        <div style={{ marginTop: '10px' }}>
                          <h5 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Results for ID: <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 'bold' }}>{adminSearchHistoryId}</span>
                          </h5>
                          {adminPlayerHistory.length === 0 ? (
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                              No game history found for this player.
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '260px', overflowY: 'auto' }}>
                              {adminPlayerHistory.map((game, idx) => {
                                const formattedDate = (() => {
                                  const d = new Date(game.timestamp);
                                  const dd = String(d.getDate()).padStart(2, '0');
                                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                                  const yyyy = d.getFullYear();
                                  let hrs = d.getHours();
                                  const mins = String(d.getMinutes()).padStart(2, '0');
                                  const secs = String(d.getSeconds()).padStart(2, '0');
                                  const ampm = hrs >= 12 ? 'PM' : 'AM';
                                  hrs = hrs % 12;
                                  hrs = hrs ? hrs : 12;
                                  const hrsStr = String(hrs).padStart(2, '0');
                                  return `${dd}/${mm}/${yyyy}, ${hrsStr}:${mins}:${secs} ${ampm}`;
                                })();
                                const isWinner = game.winnerId === adminSearchHistoryId;
                                
                                return (
                                  <div key={idx} style={{
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--border-glass)',
                                    borderRadius: '10px',
                                    padding: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px'
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                        🎮 {game.puzzleType} ({game.mode})
                                      </span>
                                      <span style={{
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        background: game.winnerId === "" ? 'rgba(255,255,255,0.1)' : (isWinner ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                                        color: game.winnerId === "" ? 'var(--text-muted)' : (isWinner ? '#10b981' : '#ef4444')
                                      }}>
                                        {game.winnerId === "" ? 'DRAW' : (isWinner ? 'WON' : 'LOST')}
                                      </span>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                      <div>📅 <strong>Time:</strong> {formattedDate}</div>
                                      <div>🔑 <strong>Room ID:</strong> <span style={{ fontFamily: 'monospace' }}>{game.roomId}</span></div>
                                      <div>🏆 <strong>Winner:</strong> {game.winnerName} {game.winnerId ? `(ID: ${game.winnerId})` : ''}</div>
                                      <div>
                                        👥 <strong>Co-Players:</strong> {game.players.map((p: any, pIdx: number) => (
                                          <span key={pIdx}>
                                            {p.username} (ID: <span style={{ fontFamily: 'monospace' }}>{p.id}</span>)
                                            {pIdx < game.players.length - 1 ? ', ' : ''}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </section>
        )}

        {/* ========================================================
            TAB 8: FRIENDS & PRIVATE DUELS
            ======================================================= */}
        {activeTab === 'friends' && (
          <section className={entranceClass} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Add Friend Row */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={24} color="var(--color-primary)" />
                Add a Friend
              </h3>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const targetName = friendSearchInput.trim();
                  if (!targetName) return;
                  if (targetName.toLowerCase() === userProfile.username.toLowerCase()) {
                    showToast(t('error_self_add'), 'error');
                    return;
                  }
                  if (friendsList.some(f => f.username.toLowerCase() === targetName.toLowerCase())) {
                    showToast(t('error_already_friends'), 'error');
                    return;
                  }
                  
                  sendFriendRequestToServer(targetName).then((res) => {
                    if (res && res.success) {
                      showToast(t('friend_request_sent_success').replace('{name}', targetName), 'success');
                    }
                  });
                  setFriendSearchInput('');
                }}
                style={{ display: 'flex', gap: '12px' }}
              >
                <input 
                  type="text" 
                  value={friendSearchInput}
                  onChange={(e) => setFriendSearchInput(e.target.value)}
                  placeholder="Enter opponent's username..."
                  maxLength={20}
                  style={{
                    flex: 1,
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '14px' }}>
                  Add Friend
                </button>
              </form>
            </div>

            {/* Friends List Container */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '16px' }}>
                My Friends
              </h3>
              
              {friendsList.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic' }}>
                  No friends added yet. Enter a username above to connect!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {friendsList.map((friend) => (
                    <div 
                      key={friend.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '16px',
                        gap: '12px'
                      }}
                    >
                      {/* Left: Avatar & Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {renderAvatar(friend.avatar, friend.frame, 44)}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--text-primary)' }}>
                            {friend.username}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                            <span>{friend.rank}</span>
                            <span>•</span>
                            <span style={{ 
                              color: friend.status === 'online' ? 'var(--color-success)' :
                                     friend.status === 'in_game' ? 'var(--color-secondary)' : 'var(--text-muted)',
                              fontWeight: 'bold'
                            }}>
                              {friend.status === 'online' ? '🟢 Online' :
                               friend.status === 'in_game' ? '🔴 In-game' : '⚫ Offline'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            triggerSound('click');
                            setActiveChatFriend({ id: friend.id, username: friend.username });
                            setChatHistory([]);
                            setFriendChatInput('');
                          }}
                          className="btn btn-glass"
                          style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}
                          title="Direct Message Chat"
                        >
                          💬 Chat
                          {unreadChats[friend.id] && (
                            <span style={{
                              position: 'absolute',
                              top: '-3px',
                              right: '-3px',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: '#ef4444',
                              boxShadow: '0 0 6px #ef4444'
                            }} />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            triggerSound('click');
                            setChallengeTargetFriend(friend);
                          }}
                          className="btn btn-primary"
                          style={{ 
                            padding: '8px 16px', 
                            borderRadius: '10px', 
                            fontSize: '12px',
                            opacity: (friend.status === 'offline' || activeGame !== null) ? 0.5 : 1,
                            cursor: (friend.status === 'offline' || activeGame !== null) ? 'not-allowed' : 'pointer'
                          }}
                          title={activeGame !== null ? "Cannot challenge while in a game" : "Invite to Private Duel"}
                          disabled={friend.status === 'offline' || activeGame !== null}
                        >
                          Challenge
                        </button>
                        <button
                          onClick={() => {
                            triggerSound('click');
                            setGenericConfirm({
                              message: `Remove ${friend.username} from your friends list?`,
                              onConfirm: () => {
                                const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
                                const token = btoa(JSON.stringify(payload));
                                fetch(`${BACKEND_HTTP_URL}/profile/friends/remove`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                  },
                                  body: JSON.stringify({ friendId: friend.id })
                                }).then((res) => {
                                  if (res.ok) {
                                    triggerSound('success');
                                    setFriendsList(prev => prev.filter(f => f.id !== friend.id));
                                  }
                                });
                              }
                            });
                          }}
                          className="btn btn-glass"
                          style={{ padding: '8px 12px', borderRadius: '10px', fontSize: '12px', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                          title="Remove Friend"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* ⏳ WAITING FOR OPPONENT OVERLAY */}
      {matchmakingState === 'waiting_opponent' && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(5, 3, 10, 0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel animate-float" style={{ padding: '32px', textAlign: 'center', maxWidth: '360px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderLeftColor: 'var(--color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
            {triviaPauseTimerLeft > 0 ? (
              <>
                <h3 style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-display)', fontSize: '20px', margin: 0 }}>Game Paused</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                  Opponent hasn't started the game yet.
                </p>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  Auto-victory in <span style={{ fontSize: 'clamp(16px, 4vw, 18px)', color: '#ff3333' }}>{triviaPauseTimerLeft}</span> seconds
                </div>
              </>
            ) : (
              <>
                <h3 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: 'clamp(18px, 4vw, 20px)', margin: 0 }}>Puzzle Completed!</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>Waiting for opponent to finish their quiz...</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* 🤝 PRE-MATCH LOBBY LOBBY/COUNTDOWN OVERLAY */}
      {matchmakingState === 'found' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.65)',
          zIndex: 1500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          fontFamily: "'Outfit', sans-serif"
        }}>
          <div className="animate-scale-up" style={{
            width: '520px',
            maxWidth: '90%',
            padding: '36px',
            borderRadius: '24px',
            background: isLightMode ? '#e2e8f0' : 'linear-gradient(135deg, #0c0824, #030107)',
            border: isLightMode ? '1px solid #cbd5e1' : '1px solid rgba(139, 92, 246, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
            boxShadow: isLightMode ? '0 20px 40px rgba(0, 0, 0, 0.15)' : '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(139, 92, 246, 0.15)',
            backdropFilter: 'blur(12px)',
            textAlign: 'center'
          }}>
            {/* Header: Match Found and Countdown */}
            <div>
              <div style={{
                color: isLightMode ? '#475569' : '#8b5cf6',
                fontSize: '13px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: '6px',
                textShadow: isLightMode ? 'none' : '0 0 8px rgba(139, 92, 246, 0.4)'
              }}>
                Match Found
              </div>
              <h2 style={{ fontSize: 'clamp(20px, 5.5vw, 32px)', color: isLightMode ? '#1e293b' : '#ffffff', margin: 0, fontWeight: '800' }}>
                Starting in <span style={{ color: '#06b6d4', textShadow: isLightMode ? 'none' : '0 0 10px rgba(6, 182, 212, 0.4)' }}>{lobbyCountdown}s</span>
              </h2>
            </div>

            {/* Players Comparison Layout */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: isLightMode ? '#cbd5e1' : 'rgba(255, 255, 255, 0.03)',
              border: isLightMode ? '1px solid #94a3b8' : '1px solid rgba(255, 255, 255, 0.08)',
              padding: 'clamp(12px, 4vw, 24px) clamp(10px, 5vw, 32px)',
              borderRadius: '20px',
              gap: '12px'
            }}>
              {/* Player 1 (You) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  {renderAvatar(userProfile.avatar, userProfile.frame, 64)}
                </div>
                <span className={userProfile.nameColor?.startsWith('name-fx-') ? userProfile.nameColor : ''} style={{ fontWeight: 'bold', fontSize: '16px', color: userProfile.nameColor?.startsWith('name-fx-') ? undefined : (userProfile.nameColor || (isLightMode ? '#1e293b' : '#ffffff')), textAlign: 'center', wordBreak: 'break-all' }}>
                  {userProfile.username}
                </span>
                <span style={{ fontSize: '10px', color: isLightMode ? '#475569' : 'rgba(255,255,255,0.5)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {userProfile.rank}
                </span>
              </div>

              {/* VS Label */}
              <div style={{
                fontSize: '18px',
                fontWeight: '900',
                fontStyle: 'italic',
                color: isLightMode ? '#475569' : '#a78bfa',
                padding: '10px 14px',
                border: isLightMode ? '1px solid #94a3b8' : '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '50%',
                background: isLightMode ? '#cbd5e1' : 'rgba(139, 92, 246, 0.15)',
                boxShadow: isLightMode ? '0 2px 6px rgba(0,0,0,0.05)' : '0 0 12px rgba(139, 92, 246, 0.25)',
                userSelect: 'none'
              }}>
                VS
              </div>

              {/* Opponent */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  {renderAvatar(opponentInfo?.avatar || '👤', opponentInfo?.frame || 'none', 64)}
                </div>
                <span className={opponentInfo?.nameColor?.startsWith('name-fx-') ? opponentInfo.nameColor : ''} style={{ fontWeight: 'bold', fontSize: '16px', color: opponentInfo?.nameColor?.startsWith('name-fx-') ? undefined : (opponentInfo?.nameColor || (isLightMode ? '#1e293b' : '#ffffff')), textAlign: 'center', wordBreak: 'break-all' }}>
                  {opponentInfo?.username || 'Rival'}
                </span>
                <span style={{ fontSize: '10px', color: isLightMode ? '#475569' : 'rgba(255,255,255,0.5)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {opponentInfo?.rank || 'BRONZE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🎮 CHALLENGE GAME SELECTION MODAL */}
      {challengeTargetFriend && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.75)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          fontFamily: "'Outfit', sans-serif"
        }}>
          <div className="glass-panel animate-scale-up" style={{
            width: '100%',
            maxWidth: '540px',
            padding: '28px',
            borderRadius: '24px',
            border: '1px solid var(--border-glass)',
            background: isLightMode ? '#ffffff' : '#0f172a',
            color: 'var(--text-primary)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', textAlign: 'center' }}>
              Challenge {challengeTargetFriend.username}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', textAlign: 'center' }}>
              Select a game category to issue a private duel challenge:
            </p>

            {/* Grid layout of games */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              maxHeight: '360px',
              overflowY: 'auto',
              padding: '4px'
            }}>
              {[
                { type: PuzzleType.SLIDING, label: 'Sliding Block Arena', desc: 'Solve matching slide grids' },
                { type: PuzzleType.WORD, label: 'Word Anagram Arena', desc: 'Unscramble letters quickly' },
                { type: PuzzleType.EIGHT_BALL_QUIZ, label: 'Trivia Logic Duel', desc: 'Multi-category speed quiz' },
                { type: PuzzleType.SUDOKU, label: 'Sudoku Battle Arena', desc: 'Classic grid number clash' },
                { type: PuzzleType.LOGIC, label: 'Logic Grid Duel', desc: 'Mind-bending grid logic' },
                { type: PuzzleType.PHYSICS, label: t('physics_name'), desc: t('physics_desc') },
                { type: PuzzleType.BLOCK_BLUSTER, label: t('block_bluster_name'), desc: t('block_bluster_desc') },
                { type: PuzzleType.WORD_SEARCH, label: t('word_search_name'), desc: t('word_search_desc') },
                { type: PuzzleType.TOWER_BLOXX, label: t('tower_bloxx_name'), desc: t('tower_bloxx_desc') },

                { type: PuzzleType.MENTAL_MATH, label: t('mental_math_name'), desc: t('mental_math_desc') }
              ].map((game) => (
                <button
                  key={game.type}
                  onClick={async () => {
                    triggerSound('click');
                    
                    try {
                      const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
                      const token = btoa(JSON.stringify(payload));
                      const checkRes = await fetch(`${BACKEND_HTTP_URL}/profile/friends/check-block?targetId=${challengeTargetFriend.id}`, {
                        headers: {
                          'Authorization': `Bearer ${token}`
                        }
                      });
                      if (checkRes.ok) {
                        const check = await checkRes.json();
                        if (check.blocked) {
                          showToast(`❌ ${challengeTargetFriend.username} is currently declining challenges. Try again in ${check.remainingSec} seconds.`, 'error');
                          setChallengeTargetFriend(null);
                          return;
                        }
                      }
                    } catch (e) {
                      console.error('[Friends] Block check failed:', e);
                    }

                    const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
                    
                    // Start matchmaking private create room
                    startMatchmaking(game.type, 'private_create', generatedPin, true);
                    
                    const targetFriendId = challengeTargetFriend.id;
                    setChallengeTargetFriend(null);
                    setActiveTab('home');

                    // Post the challenge to the backend server so the opponent B receives it!
                    try {
                      const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
                      const token = btoa(JSON.stringify(payload));
                      await fetch(`${BACKEND_HTTP_URL}/profile/friends/challenge`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                          targetId: targetFriendId,
                          puzzleType: game.type,
                          pin: generatedPin
                        })
                      });
                    } catch (e) {
                      console.error('[Friends] Post challenge failed:', e);
                    }
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '16px',
                    padding: '16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.background = 'rgba(139,92,246,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-glass)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }}
                >
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{game.label}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{game.desc}</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => { triggerSound('click'); setChallengeTargetFriend(null); }}
                className="btn btn-glass"
                style={{ padding: '8px 18px', borderRadius: '10px', fontSize: '13px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔔 INCOMING CHALLENGE NOTIFICATION BANNER */}
      {incomingChallenge && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '2px solid #22c55e',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          zIndex: 9999,
          padding: '16px',
          color: '#ffffff',
          fontFamily: "'Outfit', sans-serif",
          animation: 'fadeIn 0.3s ease-out',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🔔</span>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>Incoming Challenge!</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                <strong style={{ color: '#22c55e' }}>{incomingChallenge.sender}</strong> has challenged you to a{' '}
                <strong>{getPuzzleName(incomingChallenge.puzzleType)}</strong> match!
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={async () => {
                triggerSound('click');
                try {
                  const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
                  const token = btoa(JSON.stringify(payload));
                  await fetch(`${BACKEND_HTTP_URL}/profile/friends/challenge/decline`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ senderId: incomingChallenge.senderId })
                  });
                } catch (e) {
                  console.error('[Friends] Decline challenge failed:', e);
                }
                setIncomingChallenge(null);
              }}
              className="btn btn-glass"
              style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Decline
            </button>
            <button
              onClick={async () => {
                triggerSound('click');
                try {
                  const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
                  const token = btoa(JSON.stringify(payload));
                  
                  // Block challenger
                  await fetch(`${BACKEND_HTTP_URL}/profile/friends/block`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ challengerId: incomingChallenge.senderId, durationSec: 300 })
                  });

                  // Decline challenge
                  await fetch(`${BACKEND_HTTP_URL}/profile/friends/challenge/decline`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ senderId: incomingChallenge.senderId })
                  });

                  showToast(`Challenges from ${incomingChallenge.sender} will be declined for 5 minutes.`, 'info');
                } catch (e) {
                  console.error('[Friends] Block/Decline challenge failed:', e);
                }
                setIncomingChallenge(null);
              }}
              className="btn btn-glass"
              style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
            >
              Decline for 5m
            </button>
            <button
              onClick={async () => {
                triggerSound('success');
                
                // If currently in a game, forfeit it automatically
                if (activeGame !== null) {
                  closeGame(false, false, true);
                }
                setMatchResult(null);
                
                // Clear challenge
                try {
                  const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
                  const token = btoa(JSON.stringify(payload));
                  await fetch(`${BACKEND_HTTP_URL}/profile/friends/challenge/clear`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ senderId: incomingChallenge.senderId })
                  });
                } catch (e) {
                  console.error('[Friends] Clear challenge failed:', e);
                }

                // Connect to the opponent's private room using the custom PIN!
                startMatchmaking(incomingChallenge.puzzleType, 'private_join', incomingChallenge.pin, true);
                setIncomingChallenge(null);
              }}
              className="btn btn-primary"
              style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', background: '#22c55e', border: 'none' }}
            >
              Accept Challenge
            </button>
          </div>
        </div>
      )}

      {/* 🤝 INCOMING FRIEND REQUEST NOTIFICATION BANNER */}
      {friendRequests && friendRequests.length > 0 && (() => {
        const request = friendRequests[0];
        return (
          <div style={{
            position: 'fixed',
            top: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '420px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '2px solid #8b5cf6',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            zIndex: 9999,
            padding: '16px',
            color: '#ffffff',
            fontFamily: "'Outfit', sans-serif",
            animation: 'fadeIn 0.3s ease-out',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>🤝</span>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>{t('friend_invitation')}</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  {t('friend_sent_request').replace('{sender}', request.senderUsername)}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={async () => {
                  triggerSound('click');
                  try {
                    const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
                    const token = btoa(JSON.stringify(payload));
                    const res = await fetch(`${BACKEND_HTTP_URL}/profile/friends/request/decline`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({ senderId: request.senderId })
                    });
                    if (res.ok) {
                      setFriendRequests(prev => prev.filter(r => r.senderId !== request.senderId));
                    }
                  } catch (e) {
                    console.error('[Friends] Decline friend request failed:', e);
                  }
                }}
                className="btn btn-glass"
                style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {t('decline')}
              </button>
              <button
                onClick={async () => {
                  triggerSound('click');
                  try {
                    const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
                    const token = btoa(JSON.stringify(payload));
                    const res = await fetch(`${BACKEND_HTTP_URL}/profile/friends/request/accept`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({ senderId: request.senderId })
                    });
                    if (res.ok) {
                      const updatedFriends = await res.json();
                      setFriendsList(updatedFriends);
                      setFriendRequests(prev => prev.filter(r => r.senderId !== request.senderId));
                      triggerSound('success');
                      showToast(t('now_friends_with').replace('{name}', request.senderUsername), 'success');
                    }
                  } catch (e) {
                    console.error('[Friends] Accept friend request failed:', e);
                  }
                }}
                className="btn btn-primary"
                style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '12px', background: 'linear-gradient(to right, #8b5cf6, #a78bfa)', border: 'none', color: '#ffffff', fontWeight: 'bold' }}
              >
                {t('accept')}
              </button>
            </div>
          </div>
        );
      })()}

      {/* 🎁 FREE REWARD MODAL */}
      {isFreeRewardOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.75)',
          zIndex: 9000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          fontFamily: "'Outfit', sans-serif",
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-panel animate-scale-up" style={{
            width: '100%',
            maxWidth: '480px',
            padding: '28px',
            borderRadius: '24px',
            border: '1px solid var(--border-glass)',
            background: isLightMode ? '#ffffff' : '#0f172a',
            color: 'var(--text-primary)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            position: 'relative',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Close Button */}
            {!isWatchingAd && (
              <button 
                onClick={() => { triggerSound('click'); setIsFreeRewardOpen(false); setShowRewardCollectScreen(false); }}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isLightMode ? '#f1f5f9' : 'rgba(255,255,255,0.08)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            )}

            {showRewardCollectScreen ? (
              // 🎁 CLAIMED SUCCESSFULLY SCREEN
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px', animation: 'bounce 1s infinite' }}>🎉</div>
                <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: '#22c55e' }}>
                  Reward Claimed!
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                  Thank you for supporting Cognerix! Your rewards have been added to your profile.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '28px' }}>
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    padding: '16px 24px',
                    borderRadius: '16px',
                    minWidth: '100px'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>🪙</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#f59e0b' }}>+700</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Coins</div>
                  </div>
                  <div style={{
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    padding: '16px 24px',
                    borderRadius: '16px',
                    minWidth: '100px'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>💎</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#06b6d4' }}>+100</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Gems</div>
                  </div>
                </div>

                <button
                  onClick={() => { triggerSound('click'); setShowRewardCollectScreen(false); setIsFreeRewardOpen(false); }}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                  }}
                >
                  Awesome!
                </button>
              </div>
            ) : isWatchingAd ? (
              // 📺 SIMULATED AD PLAYER SCREEN
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="animate-pulse">📺</span> Watching Sponsored Video...
                </h3>

                {/* Simulated Google Ads SDK Player container */}
                <div 
                  id="google-adsense-rewarded-video-player"
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16/9',
                    background: '#090d16',
                    border: '2px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    margin: '16px 0',
                    padding: '20px',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
                    animation: 'pulse 2s infinite'
                  }} />

                  <span style={{ fontSize: '48px', zIndex: 1, marginBottom: '8px', animation: 'spin 4s linear infinite' }}>🧩</span>
                  
                  <div style={{ zIndex: 1, textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0 0', lineHeight: '1.4', maxWidth: '320px' }}>
                      Google AdSense Rewarded Slot. Later, you can mount your GPT/AdSense script inside this div.
                    </p>
                  </div>

                  {/* Absolute positioned ad progress bar */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '4px',
                    width: `${((5 - adTimeLeft) / 5) * 100}%`,
                    background: 'var(--color-primary)',
                    transition: 'width 1s linear'
                  }} />
                </div>

                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '16px 0 24px 0', fontWeight: '500' }}>
                  Reward unlocks in <strong style={{ color: 'var(--color-primary)', fontSize: '15px' }}>{adTimeLeft}</strong> seconds
                </div>

                <button
                  disabled
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-muted)',
                    cursor: 'not-allowed'
                  }}
                >
                  Please watch the full ad...
                </button>
              </div>
            ) : (
              // 🎫 HOME/OFFER SCREEN
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  🎁 Free Rewards
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '4px 0 16px 0', lineHeight: '1.5' }}>
                  Support Cognerix by watching a quick sponsored video. You will claim free Coins and Gems instantly!
                </p>

                {/* GOOGLE ADSENSE PLACEHOLDER SLOT */}
                <div 
                  id="google-adsense-rewarded-slot"
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    background: isLightMode ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                    border: '2px dashed var(--border-glass)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '16px',
                    boxSizing: 'border-box'
                  }}
                >
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '1px' }}>
                    Google AdSense Banner Slot
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '340px' }}>
                    Standard Google Ads layout container. Ad unit placement can be loaded dynamically.
                  </span>
                </div>

                <div style={{
                  background: isLightMode ? '#f1f5f9' : 'rgba(255, 255, 255, 0.03)',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-glass)',
                  marginTop: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>Ad Reward:</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-primary)' }}>🪙 700 + 💎 100</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>Ad Cooldown:</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-secondary)' }}>30 Seconds</span>
                  </div>
                </div>

                {Date.now() - lastRewardClaimedTime < 30000 ? (
                  // ⏳ DISABLED COOLDOWN BUTTON
                  <div style={{ marginTop: '20px' }}>
                    <button
                      disabled
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        fontSize: '15px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-glass)',
                        color: 'var(--text-muted)',
                        cursor: 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>⏳ Cooldown Active ({Math.ceil(Math.max(0, 30000 - (Date.now() - lastRewardClaimedTime + cooldownTick * 0)) / 1000)}s)</span>
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Rewarded ads are available once every 30 seconds. Please wait for the cooldown.
                    </p>
                  </div>
                ) : (
                  // 🚀 ACTIVE WATCH AD BUTTON
                  <button
                    onClick={() => {
                      triggerSound('click');
                      setIsWatchingAd(true);
                      setAdTimeLeft(5);
                    }}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      fontSize: '15px',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      border: 'none',
                      color: '#ffffff',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                      marginTop: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <span>📺 Watch Ad to Claim!</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🏬 IN-GAME STORE & BILLING POPUP */}
      <StorePopup
        isOpen={isStorePopupOpen}
        onClose={() => setIsStorePopupOpen(false)}
        initialTab={storePopupTab}
        userProfile={userProfile}
        onPurchaseSuccess={handleStorePurchaseSuccess}
        onPlaySound={triggerSound}
        isLightMode={isLightMode}
      />

      {/* 📬 MAILBOX & ANNOUNCEMENTS MODAL */}
      {isMailboxOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.75)',
          zIndex: 9000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          fontFamily: "'Outfit', sans-serif",
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-panel animate-scale-up" style={{
            width: '100%',
            maxWidth: '580px',
            padding: '28px',
            borderRadius: '24px',
            border: '1px solid var(--border-glass)',
            background: isLightMode ? '#ffffff' : '#0f172a',
            color: 'var(--text-primary)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            position: 'relative',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => { triggerSound('click'); setIsMailboxOpen(false); }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isLightMode ? '#f1f5f9' : 'rgba(255,255,255,0.08)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>

            {/* Title */}
            <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📬 Mailbox & Announcements
            </h3>

            {/* Content Container (Scrollable) */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px' }}>
              
              {/* Admin Compose Section */}
              {isAdmin && (
                <div style={{
                  background: 'rgba(139, 92, 246, 0.05)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-primary)', margin: 0 }}>
                    👑 Admin Console (Compose Announcement / Gift)
                  </h4>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="mailType" 
                        checked={adminMailType === 'announcement'} 
                        onChange={() => setAdminMailType('announcement')} 
                      />
                      Announcement
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="mailType" 
                        checked={adminMailType === 'gift'} 
                        onChange={() => setAdminMailType('gift')} 
                      />
                      Gift Package
                    </label>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                      Target Player ID (Leave blank to send to ALL players):
                    </span>
                    <input 
                      type="text" 
                      value={adminMailTargetId}
                      onChange={(e) => setAdminMailTargetId(e.target.value)}
                      placeholder="e.g. PuzzleNovice_123 or user-uuid (blank = ALL players)..."
                      style={{
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--border-glass)',
                        color: 'var(--text-primary)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <input 
                    type="text" 
                    value={adminMailTitle}
                    onChange={(e) => setAdminMailTitle(e.target.value)}
                    placeholder="Enter mail / gift title..."
                    style={{
                      background: 'var(--bg-glass)',
                      border: '1px solid var(--border-glass)',
                      color: 'var(--text-primary)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />

                  <textarea 
                    value={adminMailContent}
                    onChange={(e) => setAdminMailContent(e.target.value)}
                    placeholder="Enter message details..."
                    rows={2}
                    style={{
                      background: 'var(--bg-glass)',
                      border: '1px solid var(--border-glass)',
                      color: 'var(--text-primary)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />

                  {adminMailType === 'gift' && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Gift Coins:</span>
                        <input 
                          type="number" 
                          value={adminGiftCoins}
                          onChange={(e) => setAdminGiftCoins(parseInt(e.target.value) || 0)}
                          style={{
                            background: 'var(--bg-glass)',
                            border: '1px solid var(--border-glass)',
                            color: 'var(--text-primary)',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Gift Gems:</span>
                        <input 
                          type="number" 
                          value={adminGiftGems}
                          onChange={(e) => setAdminGiftGems(parseInt(e.target.value) || 0)}
                          style={{
                            background: 'var(--bg-glass)',
                            border: '1px solid var(--border-glass)',
                            color: 'var(--text-primary)',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={async () => {
                      const title = adminMailTitle.trim();
                      const content = adminMailContent.trim();
                      const targetId = adminMailTargetId.trim();
                      if (!title || !content) {
                        showToast("Please specify a title and content message!", 'error');
                        return;
                      }
                      triggerSound('success');
                      
                      const newItem = {
                        id: 'mail_' + Date.now(),
                        type: adminMailType,
                        title: adminMailType === 'announcement' ? `📢 ${title}` : `🎁 ${title}`,
                        content,
                        rewardCoins: adminMailType === 'gift' ? adminGiftCoins : undefined,
                        rewardGems: adminMailType === 'gift' ? adminGiftGems : undefined,
                        claimed: false,
                        date: 'Just now'
                      };

                      // Sync with server backend
                      try {
                        const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
                        const token = btoa(JSON.stringify(payload));
                        const res = await fetch(`${BACKEND_HTTP_URL}/profile/mailbox/send`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            targetId: targetId || undefined,
                            mailType: adminMailType,
                            title,
                            content,
                            rewardCoins: adminMailType === 'gift' ? adminGiftCoins : undefined,
                            rewardGems: adminMailType === 'gift' ? adminGiftGems : undefined
                          })
                        });
                        
                        if (res.ok) {
                          const data = await res.json();
                          if (data.success && data.item) {
                            if (!targetId || targetId === userProfile.id) {
                              setMailboxItems(prev => [data.item, ...prev]);
                              setUnreadMailCount(c => c + 1);
                            }
                          }
                        }
                      } catch (e) {
                        console.error('[Mailbox] Backend send failed:', e);
                      }

                      if (targetId) {
                        // Send to specific player. Save it to their mailbox storage
                        const personalKey = `puzzle_verse_mailbox_${targetId}`;
                        const savedPersonal = localStorage.getItem(personalKey);
                        let targetMailbox: any[] = [];
                        if (savedPersonal) {
                          try {
                            targetMailbox = JSON.parse(savedPersonal);
                          } catch (e) {
                            targetMailbox = [];
                          }
                        } else {
                          // Default initial mailbox items
                          targetMailbox = [
                            {
                              id: 'mail_01',
                              type: 'announcement',
                              title: '📢 System Update v1.2',
                              content: 'Welcome to PuzzleVerse! Enjoy our new real-time multiplayer 1v1 arenas, customizer store, and mutual friends list. Let the match begin!',
                              claimed: false,
                              date: 'July 15, 2026'
                            },
                            {
                              id: 'mail_02',
                              type: 'gift',
                              title: '💎 Admin Welcome Gift',
                              content: 'Claim your free gems and coins package to start purchasing frames and name colors!',
                              rewardCoins: 1000,
                              rewardGems: 100,
                              claimed: false,
                              date: 'July 15, 2026'
                            }
                          ];
                        }
                        targetMailbox.unshift(newItem);
                        localStorage.setItem(personalKey, JSON.stringify(targetMailbox));

                        // If target is the logged-in admin themselves, also update state
                        if (userProfile?.id === targetId) {
                          setMailboxItems(targetMailbox);
                          setUnreadMailCount(c => c + 1);
                        }
                        
                        showToast(`Message & Gifts sent to user "${targetId}" successfully!`, 'success');
                      } else {
                        // Send to ALL players: save in global mailbox
                        const savedGlobal = localStorage.getItem('puzzle_verse_global_mailbox');
                        let globalMailbox: any[] = [];
                        if (savedGlobal) {
                          try {
                            globalMailbox = JSON.parse(savedGlobal);
                          } catch (e) {
                            globalMailbox = [];
                          }
                        }
                        globalMailbox.unshift(newItem);
                        localStorage.setItem('puzzle_verse_global_mailbox', JSON.stringify(globalMailbox));

                        // Also add it to currently logged in admin's mailbox for immediate viewing
                        setMailboxItems(prev => [newItem, ...prev]);
                        setUnreadMailCount(c => c + 1);
                        if (userProfile?.id) {
                          const adminKey = `puzzle_verse_mailbox_${userProfile.id}`;
                          const savedAdmin = localStorage.getItem(adminKey);
                          let adminMailbox = savedAdmin ? JSON.parse(savedAdmin) : [];
                          adminMailbox.unshift(newItem);
                          localStorage.setItem(adminKey, JSON.stringify(adminMailbox));
                        }

                        showToast("Global announcement & gift shared successfully to ALL players!", 'success');
                      }

                      setAdminMailTitle('');
                      setAdminMailContent('');
                      setAdminGiftCoins(0);
                      setAdminGiftGems(0);
                      setAdminMailTargetId('');
                    }}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '13px', alignSelf: 'flex-end' }}
                  >
                    Send Announcement & Gift
                  </button>

                  {/* Moderation / Ban Panel */}
                  <div style={{ borderTop: '1px dashed rgba(139, 92, 246, 0.2)', paddingTop: '12px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h5 style={{ fontSize: '12px', fontWeight: 'bold', color: '#ef4444', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🚫 Moderation Control (Ban / Unban Players)
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input 
                        type="text" 
                        value={adminBanPlayerId}
                        onChange={(e) => setAdminBanPlayerId(e.target.value)}
                        placeholder="Enter Profile ID or User ID to Ban/Unban..."
                        style={{
                          background: 'rgba(0,0,0,0.1)',
                          border: '1px solid var(--border-glass)',
                          color: 'var(--text-primary)',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                      <input 
                        type="text" 
                        value={adminBanReason}
                        onChange={(e) => setAdminBanReason(e.target.value)}
                        placeholder="Enter Ban Reason (e.g. Inappropriate behavior)..."
                        style={{
                          background: 'rgba(0,0,0,0.1)',
                          border: '1px solid var(--border-glass)',
                          color: 'var(--text-primary)',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={async () => {
                            const targetId = adminBanPlayerId.trim();
                            if (!targetId) return;
                            setGenericConfirm({
                              message: `Are you sure you want to ban profile/user ID: ${targetId}?`,
                              onConfirm: async () => {
                                try {
                                  const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
                                  const token = btoa(JSON.stringify(payload));
                                  const res = await fetch(`${BACKEND_HTTP_URL}/profile/ban`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ profileId: targetId, reason: adminBanReason.trim() })
                                  });
                                  if (res.ok) {
                                    const data = await res.json();
                                    showToast(`Successfully banned player: ${data.username || targetId}`, 'success');
                                    setAdminBanPlayerId('');
                                    setAdminBanReason('');
                                    // Refresh list
                                    const listRes = await fetch(`${BACKEND_HTTP_URL}/profile/banned`, {
                                      headers: { 'Authorization': `Bearer ${token}` }
                                    });
                                    if (listRes.ok) {
                                      setBannedPlayersList(await listRes.json());
                                    }
                                  } else {
                                    const err = await res.json();
                                    showToast(`Error: ${err.message || 'Failed to ban user'}`, 'error');
                                  }
                                } catch (e) {
                                  showToast('Failed to connect to server', 'error');
                                }
                              }
                            });
                          }}
                          style={{
                            background: '#ef4444',
                            border: 'none',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          Ban
                        </button>
                        <button
                          onClick={async () => {
                            const targetId = adminBanPlayerId.trim();
                            if (!targetId) return;
                            try {
                              const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
                              const token = btoa(JSON.stringify(payload));
                              const res = await fetch(`${BACKEND_HTTP_URL}/profile/unban`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({ profileId: targetId })
                              });
                              if (res.ok) {
                                showToast(`Successfully unbanned profile ID: ${targetId}`, 'success');
                                setAdminBanPlayerId('');
                                // Refresh list
                                const listRes = await fetch(`${BACKEND_HTTP_URL}/profile/banned`, {
                                  headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (listRes.ok) {
                                    setBannedPlayersList(await listRes.json());
                                }
                              }
                            } catch (e) {
                              showToast('Failed to connect to server', 'error');
                            }
                          }}
                          style={{
                            background: '#10b981',
                            border: 'none',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          Unban
                        </button>
                      </div>
                    </div>
                    {bannedPlayersList.bannedProfileIds && bannedPlayersList.bannedProfileIds.length > 0 && (
                      <div style={{ marginTop: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                          Banned Profile IDs ({bannedPlayersList.bannedProfileIds.length}):
                        </span>
                        <div style={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: '6px', 
                          marginTop: '4px',
                          maxHeight: '80px',
                          overflowY: 'auto',
                          background: 'rgba(0,0,0,0.15)',
                          padding: '6px',
                          borderRadius: '6px'
                        }}>
                          {bannedPlayersList.bannedProfileIds.map(pid => (
                            <span 
                              key={pid} 
                              onClick={() => setAdminBanPlayerId(pid)}
                              style={{ 
                                fontSize: '10px', 
                                background: 'rgba(239, 68, 68, 0.15)', 
                                color: '#ef4444', 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                cursor: 'pointer'
                              }}
                              title="Click to select ID"
                            >
                              {pid.length > 15 ? `${pid.substring(0, 12)}...` : pid} ✕
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {bannedPlayersList.bannedIps && bannedPlayersList.bannedIps.length > 0 && (
                      <div style={{ marginTop: '6px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                          Banned IP Addresses ({bannedPlayersList.bannedIps.length}):
                        </span>
                        <div style={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: '6px', 
                          marginTop: '4px',
                          maxHeight: '80px',
                          overflowY: 'auto',
                          background: 'rgba(0,0,0,0.15)',
                          padding: '6px',
                          borderRadius: '6px'
                        }}>
                          {bannedPlayersList.bannedIps.map(ip => (
                            <span 
                              key={ip} 
                              onClick={() => setAdminBanPlayerId(ip)}
                              style={{ 
                                fontSize: '10px', 
                                background: 'rgba(239, 68, 68, 0.15)', 
                                color: '#ef4444', 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                cursor: 'pointer'
                              }}
                              title="Click to select IP"
                            >
                              {ip} ✕
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Registered Users Section */}
                  <div style={{ borderTop: '1px dashed rgba(139, 92, 246, 0.2)', paddingTop: '12px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h5 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      👥 Registered Profiles (Click name to view details)
                      <span style={{ fontSize: '11px', background: 'rgba(139, 92, 246, 0.1)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-secondary)' }}>
                        {adminUsersList.length}
                      </span>
                    </h5>

                    {/* Look up input */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={adminSearchProfileId}
                        onChange={(e) => setAdminSearchProfileId(e.target.value)}
                        placeholder="Enter Profile ID or Nickname..."
                        style={{
                          flex: 1,
                          background: isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.1)',
                          border: isLightMode ? '1px solid #d1d5db' : '1px solid var(--border-glass)',
                          color: 'var(--text-primary)',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={() => {
                          const inputId = adminSearchProfileId.trim();
                          if (!inputId) return;
                          // Find in list
                          const found = adminUsersList.find(u => u.id === inputId || u.username.toLowerCase() === inputId.toLowerCase());
                          if (found) {
                            setSelectedAdminUser(found);
                            setIsUserViewBoxOpen(true);
                            triggerSound('click');
                          } else {
                            showToast(`Profile ID or Nickname "${inputId}" not found in currently registered profiles.`, 'error');
                          }
                        }}
                        style={{
                          background: 'rgba(139, 92, 246, 0.15)',
                          border: '1px solid rgba(139, 92, 246, 0.25)',
                          color: 'var(--text-primary)',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        className="btn-hover-bright"
                      >
                        View
                      </button>
                    </div>
                    {adminUsersList.length === 0 ? (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No profiles registered yet.
                      </span>
                    ) : (() => {
                      const googleUsers = adminUsersList.filter(u => u.id.startsWith('10') || u.email);
                      const guestUsers = adminUsersList.filter(u => !u.id.startsWith('10') && !u.email);
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                          {/* Google Users Sub-section */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              🟢 Google Accounts ({googleUsers.length})
                            </div>
                            {googleUsers.length === 0 ? (
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '8px' }}>
                                No Google accounts registered.
                              </span>
                            ) : (
                              <div style={{ 
                                display: 'flex', 
                                flexWrap: 'wrap', 
                                gap: '6px', 
                                maxHeight: '90px',
                                overflowY: 'auto',
                                background: 'rgba(0,0,0,0.15)',
                                padding: '8px',
                                borderRadius: '8px'
                              }}>
                                {googleUsers.map(usr => (
                                  <span 
                                    key={usr.id} 
                                    onClick={() => {
                                      setSelectedAdminUser(usr);
                                      setIsUserViewBoxOpen(true);
                                    }}
                                    style={{ 
                                      fontSize: '11px', 
                                      background: 'rgba(139, 92, 246, 0.1)', 
                                      color: 'var(--text-primary)', 
                                      padding: '4px 8px', 
                                      borderRadius: '6px',
                                      border: '1px solid rgba(139, 92, 246, 0.2)',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      transition: 'all 0.2s'
                                    }}
                                    className="badge-hover"
                                    title="Click to view details"
                                  >
                                    <span>{usr.avatar || '👤'}</span>
                                    <span style={{ fontWeight: 'bold' }}>{usr.username}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Guest Users Sub-section */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              🟡 Guest Accounts ({guestUsers.length})
                            </div>
                            {guestUsers.length === 0 ? (
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '8px' }}>
                                No Guest accounts registered.
                              </span>
                            ) : (
                              <div style={{ 
                                display: 'flex', 
                                flexWrap: 'wrap', 
                                gap: '6px', 
                                maxHeight: '90px',
                                overflowY: 'auto',
                                background: 'rgba(0,0,0,0.15)',
                                padding: '8px',
                                borderRadius: '8px'
                              }}>
                                {guestUsers.map(usr => (
                                  <span 
                                    key={usr.id} 
                                    onClick={() => {
                                      setSelectedAdminUser(usr);
                                      setIsUserViewBoxOpen(true);
                                    }}
                                    style={{ 
                                      fontSize: '11px', 
                                      background: 'rgba(139, 92, 246, 0.1)', 
                                      color: 'var(--text-primary)', 
                                      padding: '4px 8px', 
                                      borderRadius: '6px',
                                      border: '1px solid rgba(139, 92, 246, 0.2)',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      transition: 'all 0.2s'
                                    }}
                                    className="badge-hover"
                                    title="Click to view details"
                                  >
                                    <span>{usr.avatar || '👤'}</span>
                                    <span style={{ fontWeight: 'bold' }}>{usr.username}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Send Popup Announcement Section */}
                  <div style={{ borderTop: '1px dashed rgba(139, 92, 246, 0.2)', paddingTop: '12px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h5 style={{ fontSize: '12px', fontWeight: 'bold', color: '#f59e0b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      📣 Broadcast Game Popup Announcement
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input 
                        type="text" 
                        value={adminPopupTargets}
                        onChange={(e) => setAdminPopupTargets(e.target.value)}
                        placeholder="Target Player IDs (e.g. 10921736433, 208480549137) or leave blank for ALL..."
                        style={{
                          background: isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.1)',
                          border: isLightMode ? '1px solid #d1d5db' : '1px solid var(--border-glass)',
                          color: 'var(--text-primary)',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                      <textarea 
                        value={adminPopupText}
                        onChange={(e) => setAdminPopupText(e.target.value)}
                        placeholder="Enter the announcement message to overlay on players' screens..."
                        rows={2}
                        style={{
                          background: isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.1)',
                          border: isLightMode ? '1px solid #d1d5db' : '1px solid var(--border-glass)',
                          color: 'var(--text-primary)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          outline: 'none',
                          resize: 'none'
                        }}
                      />
                      <button
                        onClick={async () => {
                          const text = adminPopupText.trim();
                          if (!text) {
                            showToast("Please enter message text for the popup!", 'error');
                            return;
                          }
                          triggerSound('success');
                          
                          try {
                            const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
                            const token = btoa(JSON.stringify(payload));
                            const res = await fetch(`${BACKEND_HTTP_URL}/profile/popup-announcements`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({
                                text,
                                targetUserIds: adminPopupTargets.trim() || undefined
                              })
                            });
                            
                            if (res.ok) {
                              const result = await res.json();
                              showToast("Popup announcement sent successfully!", 'success');
                              setAdminPopupText('');
                              setAdminPopupTargets('');
                              // Refresh history
                              if (result.announcement) {
                                setAdminAnnouncementHistory(prev => [...prev, result.announcement]);
                              }
                            } else {
                              const err = await res.json();
                              showToast(`Failed to send: ${err.message || 'Error occurred'}`, 'error');
                            }
                          } catch (e) {
                            console.error('[PopupAnnouncements] Post failed:', e);
                            showToast("Failed to connect to the server.", 'error');
                          }
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          border: 'none',
                          color: 'white',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          alignSelf: 'flex-end',
                          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
                        }}
                      >
                        Send Popup
                      </button>
                    </div>

                    {/* 📋 Announcement History */}
                    {adminAnnouncementHistory.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                        <h6 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', margin: 0, letterSpacing: '0.5px' }}>
                          📋 SENT ANNOUNCEMENTS ({adminAnnouncementHistory.length})
                        </h6>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                          {[...adminAnnouncementHistory].reverse().map((ann: any) => (
                            <div
                              key={ann.id}
                              style={{
                                background: isLightMode ? 'rgba(245, 158, 11, 0.06)' : 'rgba(245, 158, 11, 0.08)',
                                border: isLightMode ? '1px solid rgba(245, 158, 11, 0.15)' : '1px solid rgba(245, 158, 11, 0.15)',
                                borderRadius: '10px',
                                padding: '10px 12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <p style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0, lineHeight: '1.5', flex: 1, wordBreak: 'break-word' }}>
                                  {ann.text}
                                </p>
                                <button
                                  onClick={async () => {
                                    triggerSound('click');
                                    setGenericConfirm({
                                      message: 'Delete this announcement? It will be removed for all players.',
                                      onConfirm: async () => {
                                        try {
                                          const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
                                          const token = btoa(JSON.stringify(payload));
                                          const res = await fetch(`${BACKEND_HTTP_URL}/profile/popup-announcements/${ann.id}`, {
                                            method: 'DELETE',
                                            headers: { 'Authorization': `Bearer ${token}` }
                                          });
                                          if (res.ok) {
                                            setAdminAnnouncementHistory(prev => prev.filter(a => a.id !== ann.id));
                                          } else {
                                            const err = await res.json();
                                            showToast(`Delete failed: ${err.message || 'Error'}`, 'error');
                                          }
                                        } catch (e) {
                                          console.error('[PopupAnnouncements] Delete failed:', e);
                                          showToast('Failed to connect to the server.', 'error');
                                        }
                                      }
                                    });
                                  }}
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    color: '#ef4444',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    marginLeft: '8px',
                                    transition: 'all 0.2s'
                                  }}
                                  title="Delete this announcement"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'var(--text-muted)' }}>
                                <span>
                                  {ann.targetUserIds && ann.targetUserIds.length > 0
                                    ? `🎯 Targeted: ${ann.targetUserIds.join(', ')}`
                                    : '🌐 All Players'}
                                </span>
                                <span>
                                  {ann.timestamp ? new Date(ann.timestamp).toLocaleString() : 'Unknown'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Player History Section */}
                  <div style={{ borderTop: '1px dashed rgba(139, 92, 246, 0.2)', paddingTop: '12px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h5 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-primary)', margin: 0 }}>
                      📜 Player Game History
                    </h5>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={adminSearchHistoryId}
                        onChange={(e) => setAdminSearchHistoryId(e.target.value)}
                        placeholder="Enter Player ID (e.g. 10921736433)..."
                        style={{
                          flex: 1,
                          background: isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.1)',
                          border: isLightMode ? '1px solid #d1d5db' : '1px solid var(--border-glass)',
                          color: 'var(--text-primary)',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={() => {
                          triggerSound('click');
                          fetchPlayerHistory(adminSearchHistoryId);
                        }}
                        disabled={adminHistoryLoading}
                        style={{
                          background: 'rgba(139, 92, 246, 0.15)',
                          border: '1px solid rgba(139, 92, 246, 0.25)',
                          color: 'var(--text-primary)',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        className="btn-hover-bright"
                      >
                        {adminHistoryLoading ? '...' : 'View'}
                      </button>
                    </div>

                    {adminHistorySearched && (
                      <div style={{ marginTop: '6px', background: 'rgba(0,0,0,0.1)', padding: '8px', borderRadius: '8px' }}>
                        <h6 style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 6px 0' }}>
                          History for ID: <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{adminSearchHistoryId}</span>
                        </h6>
                        {adminPlayerHistory.length === 0 ? (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            No game history found for this player.
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                            {adminPlayerHistory.map((game, idx) => {
                              const formattedDate = (() => {
                                const d = new Date(game.timestamp);
                                const dd = String(d.getDate()).padStart(2, '0');
                                const mm = String(d.getMonth() + 1).padStart(2, '0');
                                const yyyy = d.getFullYear();
                                let hrs = d.getHours();
                                const mins = String(d.getMinutes()).padStart(2, '0');
                                const secs = String(d.getSeconds()).padStart(2, '0');
                                const ampm = hrs >= 12 ? 'PM' : 'AM';
                                hrs = hrs % 12;
                                hrs = hrs ? hrs : 12;
                                const hrsStr = String(hrs).padStart(2, '0');
                                return `${dd}/${mm}/${yyyy}, ${hrsStr}:${mins}:${secs} ${ampm}`;
                              })();
                              const isWinner = game.winnerId === adminSearchHistoryId;
                              return (
                                <div key={idx} style={{
                                  background: 'rgba(255,255,255,0.02)',
                                  border: '1px solid var(--border-glass)',
                                  borderRadius: '8px',
                                  padding: '8px',
                                  fontSize: '10px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                      {game.puzzleType} ({game.mode})
                                    </span>
                                    <span style={{
                                      fontWeight: 'bold',
                                      color: game.winnerId === "" ? 'var(--text-muted)' : (isWinner ? '#10b981' : '#ef4444')
                                    }}>
                                      {game.winnerId === "" ? 'DRAW' : (isWinner ? 'WON' : 'LOST')}
                                    </span>
                                  </div>
                                  <div style={{ color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div>Date: {formattedDate}</div>
                                    <div>Room ID: <span style={{ fontFamily: 'monospace' }}>{game.roomId}</span></div>
                                    <div>Winner: {game.winnerName}</div>
                                    <div>
                                      Co-Players: {game.players.map((p: any, pIdx: number) => (
                                        <span key={pIdx}>
                                          {p.username} ({p.id})
                                          {pIdx < game.players.length - 1 ? ', ' : ''}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Mailbox List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px', margin: '8px 0 0 0' }}>
                  Inbox Messages
                </h4>
                {mailboxItems.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', padding: '16px' }}>
                    No messages in your mailbox.
                  </p>
                ) : (
                  mailboxItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '16px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        opacity: item.claimed ? 0.7 : 1
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>
                          {item.title}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {item.date}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                        {item.content}
                      </p>

                      {item.type === 'gift' && (
                        <div style={{
                          marginTop: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255,255,255,0.02)',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-glass)'
                        }}>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                            {item.rewardCoins ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-warning)', fontWeight: 'bold' }}>
                                🪙 {item.rewardCoins} Coins
                              </span>
                            ) : null}
                            {item.rewardGems ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-secondary)', fontWeight: 'bold' }}>
                                💎 {item.rewardGems} Gems
                              </span>
                            ) : null}
                          </div>
                          
                          <button
                            onClick={async () => {
                              if (item.claimed) return;
                              triggerSound('success');
                              
                              // Claim rewards locally
                              const updatedProfile = {
                                ...userProfile,
                                coins: userProfile.coins + (item.rewardCoins || 0),
                                gems: userProfile.gems + (item.rewardGems || 0)
                              };
                              // Add frame cosmetic to inventory if needed
                              if (item.title.includes('Frame') && !updatedProfile.inventory.includes('fr_emerald')) {
                                updatedProfile.inventory.push('fr_emerald');
                              }
                              saveProfile(updatedProfile);

                              // Sync with server backend
                              try {
                                const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
                                const token = btoa(JSON.stringify(payload));
                                await fetch(`${BACKEND_HTTP_URL}/profile/mailbox/claim`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                  },
                                  body: JSON.stringify({ mailId: item.id })
                                });
                              } catch (e) {
                                console.error('[Mailbox] Backend claim failed:', e);
                              }

                              // Mark item as claimed
                              setMailboxItems(prev => {
                                const updated = prev.map(m => m.id === item.id ? { ...m, claimed: true } : m);
                                if (userProfile?.id) {
                                  localStorage.setItem(`puzzle_verse_mailbox_${userProfile.id}`, JSON.stringify(updated));
                                }
                                const unclaimedCount = updated.filter(m => !m.claimed).length;
                                setUnreadMailCount(unclaimedCount);
                                return updated;
                              });
                              showToast(`Claimed rewards successfully!`, 'success');
                            }}
                            className={`btn ${item.claimed ? 'btn-glass' : 'btn-primary'}`}
                            style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px' }}
                            disabled={item.claimed}
                          >
                            {item.claimed ? 'Claimed ✓' : 'Claim Gift'}
                          </button>
                        </div>
                      )}

                      {item.type === 'announcement' && !item.claimed && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                          <button
                            onClick={async () => {
                              triggerSound('success');

                              // Sync with server backend
                              try {
                                const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
                                const token = btoa(JSON.stringify(payload));
                                await fetch(`${BACKEND_HTTP_URL}/profile/mailbox/claim`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                  },
                                  body: JSON.stringify({ mailId: item.id })
                                });
                              } catch (e) {
                                console.error('[Mailbox] Backend claim failed:', e);
                              }

                              setMailboxItems(prev => {
                                const updated = prev.map(m => m.id === item.id ? { ...m, claimed: true } : m);
                                if (userProfile?.id) {
                                  localStorage.setItem(`puzzle_verse_mailbox_${userProfile.id}`, JSON.stringify(updated));
                                }
                                const unclaimedCount = updated.filter(m => !m.claimed).length;
                                setUnreadMailCount(unclaimedCount);
                                return updated;
                              });
                            }}
                            className="btn btn-glass"
                            style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px' }}
                          >
                            Mark as Read
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

            </div>

            {/* Footer buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
              <button
                onClick={() => { triggerSound('click'); setIsMailboxOpen(false); }}
                className="btn btn-glass"
                style={{ padding: '8px 18px', borderRadius: '10px', fontSize: '13px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 ADMIN USER DETAILS VIEW BOX MODAL */}
      {isUserViewBoxOpen && selectedAdminUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.8)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          fontFamily: "'Outfit', sans-serif",
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div className="glass-panel animate-scale-up" style={{
            width: '100%',
            maxWidth: '420px',
            padding: '24px',
            borderRadius: '24px',
            border: isLightMode ? '1px solid #e5e7eb' : '1px solid rgba(139, 92, 246, 0.3)',
            background: isLightMode ? 'linear-gradient(135deg, #ffffff, #f9fafb)' : 'linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(15, 12, 40, 0.95))',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: isLightMode ? '0 20px 40px rgba(0, 0, 0, 0.06)' : '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 50px rgba(139, 92, 246, 0.15)',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isLightMode ? '1px solid #e5e7eb' : '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                👤 Profile Inspector
              </h3>
              <button 
                onClick={() => { triggerSound('click'); setIsUserViewBoxOpen(false); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1,
                  transition: 'color 0.2s'
                }}
                className="close-hover"
              >
                ✕
              </button>
            </div>

            {/* Profile Avatar and Frame Display */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px 0' }}>
              <div 
                className={`avatar-frame-showcase ${selectedAdminUser.frame || 'none'}`}
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  background: isLightMode ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.05)',
                  border: isLightMode ? '2px solid rgba(0, 0, 0, 0.08)' : '2px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {selectedAdminUser.avatar || '👤'}
              </div>
              <span style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: selectedAdminUser.nameColor || 'var(--text-primary)',
                textShadow: selectedAdminUser.nameColor ? '0 0 10px rgba(255,255,255,0.1)' : 'none'
              }}>
                {selectedAdminUser.username}
              </span>
            </div>

            {/* Detailed Properties Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Profile ID</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '60%' }}>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px', wordBreak: 'break-all', textAlign: 'right' }}>
                    {selectedAdminUser.id}
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedAdminUser.id, 'id')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copiedProfileId ? '#10b981' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.2s'
                    }}
                    title="Copy Profile ID"
                  >
                    {copiedProfileId ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Login Method</span>
                <span style={{ 
                  color: selectedAdminUser.id.startsWith('10') ? '#3b82f6' : '#10b981', 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {selectedAdminUser.id.startsWith('10') ? '🌐 Google Account' : '👤 Guest Player'}
                </span>
              </div>

              {/* IP Address */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>IP Address</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#f59e0b', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px' }}>
                    {selectedAdminUser.ipAddress || 'N/A'}
                  </span>
                  {selectedAdminUser.ipAddress && (
                    <button
                      onClick={() => copyToClipboard(selectedAdminUser.ipAddress, 'ip')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedIpAddress ? '#10b981' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'color 0.2s'
                      }}
                      title="Copy IP Address"
                    >
                      {copiedIpAddress ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Location (State & Country) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Location (State & Country)</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  📍 {selectedAdminUser.region || 'Delhi'}, {selectedAdminUser.country || 'India'}
                </span>
              </div>

              {/* Gmail / Email */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: isLightMode ? 'rgba(59,130,246,0.04)' : 'rgba(59,130,246,0.08)', border: isLightMode ? '1px solid rgba(59,130,246,0.12)' : '1px solid rgba(59,130,246,0.15)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Gmail</span>
                <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '11px', wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%' }}>
                  {selectedAdminUser.email || 'N/A'}
                </span>
              </div>

              {/* Last Seen Date & Time */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Last Seen</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '11px', textAlign: 'right' }}>
                  🕒 {selectedAdminUser.lastSeen ? (() => {
                    const date = new Date(selectedAdminUser.lastSeen);
                    const dd = String(date.getDate()).padStart(2, '0');
                    const mm = String(date.getMonth() + 1).padStart(2, '0');
                    const yyyy = date.getFullYear();
                    const time = date.toLocaleTimeString();
                    return `${dd}/${mm}/${yyyy}, ${time}`;
                  })() : 'N/A'}
                </span>
              </div>

              {/* Active Duration */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Active Duration</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '11px', textAlign: 'right' }}>
                  ⏱️ {(() => {
                    if (!selectedAdminUser.sessionStart || !selectedAdminUser.lastSeen) return 'N/A';
                    const durationMs = selectedAdminUser.lastSeen - selectedAdminUser.sessionStart;
                    if (durationMs < 0) return '0s';
                    const totalSecs = Math.floor(durationMs / 1000);
                    const mins = Math.floor(totalSecs / 60);
                    const hrs = Math.floor(mins / 60);
                    if (hrs > 0) {
                      return `${hrs} hr${hrs > 1 ? 's' : ''} ${mins % 60} min${(mins % 60) !== 1 ? 's' : ''}`;
                    } else if (mins > 0) {
                      return `${mins} min${mins !== 1 ? 's' : ''} ${totalSecs % 60} sec${(totalSecs % 60) !== 1 ? 's' : ''}`;
                    } else {
                      return `${totalSecs} sec${totalSecs !== 1 ? 's' : ''}`;
                    }
                  })()}
                </span>
              </div>

              {/* Friends Count (clickable to view list of friends) */}
              <div 
                onClick={() => {
                  triggerSound('click');
                  fetchAdminFriends(selectedAdminUser.id);
                  setIsAdminFriendsModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: isLightMode ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.1)',
                  border: '1px dashed rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                className="badge-hover"
                title="Click to view all friends"
              >
                <span style={{ color: 'var(--text-muted)' }}>Friends</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  👥 {selectedAdminUser.friendsCount !== undefined ? selectedAdminUser.friendsCount : 0} (Click to View)
                </span>
              </div>

              {/* Level & XP Progress */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px', background: isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Level</span>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
                    Level {selectedAdminUser.level || 1}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  <span>XP Progress</span>
                  <span>{selectedAdminUser.xp || 0} / {(selectedAdminUser.level || 1) * 100} XP ({Math.floor(((selectedAdminUser.xp || 0) / ((selectedAdminUser.level || 1) * 100)) * 100)}%)</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: isLightMode ? '#e2e8f0' : 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.max(0, Math.min(100, ((selectedAdminUser.xp || 0) / ((selectedAdminUser.level || 1) * 100)) * 100))}%`, 
                    height: '100%', 
                    background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' 
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Rank Tier</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
                  🏆 {selectedAdminUser.rank || 'BRONZE'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Points (pts)</span>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                  ⭐ {selectedAdminUser.score || 0} pts
                </span>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: isLightMode ? 'rgba(234, 179, 8, 0.04)' : 'rgba(234, 179, 8, 0.08)', border: isLightMode ? '1px solid rgba(234, 179, 8, 0.15)' : '1px solid rgba(234, 179, 8, 0.2)', borderRadius: '8px' }}>
                  <span style={{ color: isLightMode ? 'rgba(150, 100, 0, 0.85)' : 'rgba(234, 179, 8, 0.8)' }}>Coins</span>
                  <span style={{ color: '#eab308', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    🪙 {selectedAdminUser.coins || 0}
                  </span>
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: isLightMode ? 'rgba(168, 85, 247, 0.04)' : 'rgba(168, 85, 247, 0.08)', border: isLightMode ? '1px solid rgba(168, 85, 247, 0.15)' : '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '8px' }}>
                  <span style={{ color: isLightMode ? 'rgba(110, 30, 180, 0.85)' : 'rgba(168, 85, 247, 0.8)' }}>Gems</span>
                  <span style={{ color: '#a855f7', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    💎 {selectedAdminUser.gems || 0}
                  </span>
                </div>
              </div>

              {/* 🎮 GAME STATISTICS: Best Times & Time Spent */}
              {selectedAdminUser.statistics?.puzzleSpecificStats && (
                <div style={{ marginTop: '6px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🎮 Game Statistics
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {Object.entries(selectedAdminUser.statistics.puzzleSpecificStats as Record<string, any>).map(([gameKey, stats]: [string, any]) => {
                      const gameName = gameKey.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                      const played = stats?.played || 0;
                      if (played === 0) return null;
                      const bestTime = stats?.bestTime;
                      const timeSpent = stats?.timeSpent;
                      return (
                        <div key={gameKey} style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr auto auto',
                          gap: '8px',
                          padding: '6px 10px',
                          background: isLightMode ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                          borderRadius: '6px',
                          alignItems: 'center',
                          fontSize: '11px'
                        }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{gameName}</span>
                          <span style={{ color: '#10b981', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            🏆 {bestTime != null ? `${bestTime.toFixed(1)}s` : '—'}
                          </span>
                          <span style={{ color: '#8b5cf6', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            ⏱ {timeSpent != null ? (timeSpent >= 60 ? `${Math.floor(timeSpent / 60)}m ${Math.round(timeSpent % 60)}s` : `${Math.round(timeSpent)}s`) : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* Footer Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => { triggerSound('click'); setIsUserViewBoxOpen(false); }}
                style={{
                  flex: 1,
                  background: isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                  border: isLightMode ? '1px solid #d1d5db' : '1px solid var(--border-glass)',
                  color: isLightMode ? '#1f2937' : 'var(--text-primary)',
                  padding: '10px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
                className="btn-hover-bright"
              >
                Close Inspector
              </button>
              <button
                onClick={async () => {
                  triggerSound('click');
                  setGenericConfirm({
                    message: `⚠️ Are you sure you want to permanently delete "${selectedAdminUser.username}" (${selectedAdminUser.id})?\n\nThis action cannot be undone.`,
                    onConfirm: async () => {
                      try {
                        const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
                        const token = btoa(JSON.stringify(payload));
                        const res = await fetch(`${BACKEND_HTTP_URL}/profile/delete`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({ userId: selectedAdminUser.id })
                        });
                        if (res.ok) {
                          showToast(`Player "${selectedAdminUser.username}" has been deleted.`, 'success');
                          setAdminUsersList((prev: any[]) => prev.filter((u: any) => u.id !== selectedAdminUser.id));
                          setIsUserViewBoxOpen(false);
                        } else {
                          showToast('Failed to delete player record.', 'error');
                        }
                      } catch (e) {
                        console.error('[Admin] Delete profile failed:', e);
                        showToast('Network error while deleting profile.', 'error');
                      }
                    }
                  });
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👥 ADMIN VIEW FRIENDS MODAL */}
      {isAdminFriendsModalOpen && selectedAdminUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          animation: 'fadeIn 0.2s ease'
        }}>
          <div className="glass-panel animate-scale-up" style={{
            width: '380px',
            maxWidth: '90%',
            padding: '24px',
            borderRadius: '24px',
            border: isLightMode ? '1px solid #e5e7eb' : '1px solid rgba(139, 92, 246, 0.3)',
            background: isLightMode ? 'linear-gradient(135deg, #ffffff, #f9fafb)' : 'linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(15, 12, 40, 0.95))',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: isLightMode ? '0 20px 40px rgba(0, 0, 0, 0.06)' : '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 50px rgba(139, 92, 246, 0.15)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isLightMode ? '1px solid #e5e7eb' : '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                👥 Friends of {selectedAdminUser.username}
              </h3>
              <button 
                onClick={() => { triggerSound('click'); setIsAdminFriendsModalOpen(false); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
              {adminFriendsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '24px 0' }}>
                  <div className="processing-spinner" style={{ width: '30px', height: '30px', border: '3px solid rgba(139,92,246,0.2)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading friends...</span>
                </div>
              ) : adminFriendsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                  No friends added yet.
                </div>
              ) : (
                adminFriendsList.map((friend: any) => (
                  <div 
                    key={friend.id} 
                    onClick={() => {
                      triggerSound('click');
                      const found = adminUsersList.find(u => u.id === friend.id);
                      if (found) {
                        setSelectedAdminUser(found);
                      } else {
                        setSelectedAdminUser({
                          ...friend,
                          friendsCount: friend.friendsCount !== undefined ? friend.friendsCount : 0
                        });
                      }
                      setIsAdminFriendsModalOpen(false);
                      setIsUserViewBoxOpen(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      background: isLightMode ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
                      border: isLightMode ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    className="badge-hover"
                    title={`Click to inspect ${friend.username}'s profile`}
                  >
                    <div style={{ fontSize: '24px' }}>{friend.avatar || '👤'}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <span style={{ fontWeight: 'bold', color: friend.nameColor || 'var(--text-primary)', fontSize: '13px' }}>
                        {friend.username}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Level {friend.level || 1} • {friend.rank || 'BRONZE'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: isLightMode ? '1px solid #e5e7eb' : '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '12px', marginTop: '4px' }}>
              <button 
                onClick={() => { triggerSound('click'); setIsAdminFriendsModalOpen(false); }}
                className="btn btn-glass"
                style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '12px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🙋 HELP & SUPPORT DIALOG MODAL */}
      {isSupportOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.8)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          fontFamily: "'Outfit', sans-serif",
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div className="glass-panel animate-scale-up" style={{
            width: '100%',
            maxWidth: '420px',
            padding: '24px',
            borderRadius: '24px',
            border: isLightMode ? '1px solid #e5e7eb' : '1px solid rgba(139, 92, 246, 0.3)',
            background: isLightMode ? 'linear-gradient(135deg, #ffffff, #f9fafb)' : 'linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(15, 12, 40, 0.95))',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: isLightMode ? '0 20px 40px rgba(0, 0, 0, 0.06)' : '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 50px rgba(139, 92, 246, 0.15)',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => { triggerSound('click'); setIsSupportOpen(false); }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isLightMode ? '#f1f5f9' : 'rgba(255,255,255,0.08)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              ✕
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                Get in Touch
              </h3>
            </div>

            {/* Form */}
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!supportName.trim() || !supportEmail.trim() || !supportSubject.trim() || !supportDescription.trim()) {
                  showToast("Please fill out all fields.", 'error');
                  return;
                }
                if (!supportCaptchaChecked) {
                  showToast("Please complete the 'I am human' verification check.", 'error');
                  return;
                }
                setIsSubmittingSupport(true);
                try {
                  const authPayload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
                  const token = btoa(JSON.stringify(authPayload));

                  const res = await fetch(`${BACKEND_HTTP_URL}/profile/support`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      name: supportName.trim(),
                      email: supportEmail.trim(),
                      userId: userProfile.id,
                      subject: supportSubject.trim(),
                      description: supportDescription.trim()
                    })
                  });

                  if (res.ok) {
                    triggerSound('success');
                    showToast("Support Ticket Submitted successfully! We will get back to you soon.", 'success');
                    setIsSupportOpen(false);
                  } else {
                    const err = await res.json().catch(() => ({}));
                    showToast(`Failed to submit support request: ${err.message || 'Server error'}`, 'error');
                  }
                } catch (err) {
                  console.error('Support ticket error:', err);
                  showToast("Connection error. Support ticket simulation logged.", 'error');
                } finally {
                  setIsSubmittingSupport(false);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {/* Your Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Your Name</label>
                <input 
                  type="text" 
                  value={supportName}
                  onChange={(e) => setSupportName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  style={{
                    background: isLightMode ? '#f1f5f9' : 'rgba(0, 0, 0, 0.25)',
                    border: isLightMode ? '1px solid #cbd5e1' : '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Email Address */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Email Address</label>
                <input 
                  type="email" 
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  style={{
                    background: isLightMode ? '#f1f5f9' : 'rgba(0, 0, 0, 0.25)',
                    border: isLightMode ? '1px solid #cbd5e1' : '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Your ID */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Your ID</label>
                <input 
                  type="text" 
                  value={userProfile?.id || ''}
                  readOnly
                  style={{
                    background: isLightMode ? '#e2e8f0' : 'rgba(255, 255, 255, 0.05)',
                    border: isLightMode ? '1px solid #cbd5e1' : '1px solid var(--border-glass)',
                    color: 'var(--text-muted)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    outline: 'none',
                    cursor: 'not-allowed'
                  }}
                />
              </div>

              {/* Subject */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Subject</label>
                <input 
                  type="text" 
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  placeholder="What is this regarding?"
                  required
                  style={{
                    background: isLightMode ? '#f1f5f9' : 'rgba(0, 0, 0, 0.25)',
                    border: isLightMode ? '1px solid #cbd5e1' : '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Describe the Issue */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Describe the Issue</label>
                <textarea 
                  value={supportDescription}
                  onChange={(e) => setSupportDescription(e.target.value)}
                  placeholder="Tell us what's happening..."
                  required
                  rows={4}
                  style={{
                    background: isLightMode ? '#f1f5f9' : 'rgba(0, 0, 0, 0.25)',
                    border: isLightMode ? '1px solid #cbd5e1' : '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Captcha Placeholder Box */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: isLightMode ? '#f8fafc' : 'rgba(0, 0, 0, 0.25)',
                border: isLightMode ? '1px solid #cbd5e1' : '1px solid var(--border-glass)',
                borderRadius: '8px',
                marginTop: '4px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer', margin: 0 }}>
                  <input 
                    type="checkbox" 
                    checked={supportCaptchaChecked}
                    onChange={(e) => {
                      triggerSound('check');
                      setSupportCaptchaChecked(e.target.checked);
                    }}
                    style={{
                      width: '20px',
                      height: '20px',
                      accentColor: 'var(--color-primary)',
                      cursor: 'pointer'
                    }}
                  />
                  <span>I am human</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
                    <span style={{ fontSize: '14px' }}>✋</span>
                    <span>hCaptcha</span>
                  </div>
                  <span style={{ fontSize: '7px', color: 'var(--text-muted)' }}>Privacy - Terms</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmittingSupport}
                style={{
                  background: 'var(--color-primary)',
                  color: '#ffffff',
                  padding: '12px',
                  borderRadius: '12px',
                  cursor: isSubmittingSupport ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: 'none',
                  transition: 'all 0.2s',
                  marginTop: '6px',
                  opacity: isSubmittingSupport ? 0.7 : 1
                }}
                className="btn-hover-bright"
              >
                {isSubmittingSupport ? 'Sending...' : 'Send Message'}
              </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              We'll get back to you as soon as possible!
            </div>
          </div>
        </div>
      )}

      {/* 📣 GAME POPUP ANNOUNCEMENT OVERLAY */}
      {currentDisplayPopup !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.85)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          fontFamily: "'Outfit', sans-serif",
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div className="glass-panel animate-scale-up" style={{
            width: '100%',
            maxWidth: '450px',
            padding: '32px',
            borderRadius: '24px',
            border: '2px solid rgba(245, 158, 11, 0.4)',
            background: isLightMode 
              ? 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)' 
              : 'linear-gradient(135deg, #0f172a 0%, #451a03 100%)',
            color: 'var(--text-primary)',
            boxShadow: '0 25px 50px -12px rgba(245, 158, 11, 0.3)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)',
              fontSize: '36px',
              marginBottom: '4px'
            }}>
              📢
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0, background: 'linear-gradient(to right, #fbbf24, #f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Announcement
            </h2>

            <p style={{ 
              fontSize: '15px', 
              color: 'var(--text-primary)', 
              lineHeight: '1.6', 
              margin: '8px 0 16px 0',
              whiteSpace: 'pre-wrap', 
              textAlign: 'center',
              maxHeight: '200px',
              overflowY: 'auto',
              paddingRight: '4px'
            }}>
              {currentDisplayPopup.text}
            </p>

            <button
              onClick={() => {
                triggerSound('click');
                const savedDismissed = localStorage.getItem('puzzle_verse_dismissed_announcements');
                const dismissedIds = savedDismissed ? JSON.parse(savedDismissed) : [];
                dismissedIds.push(currentDisplayPopup.id);
                localStorage.setItem('puzzle_verse_dismissed_announcements', JSON.stringify(dismissedIds));
                setCurrentDisplayPopup(null);
              }}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* 👑 LEVEL UP CONGRATULATIONS MODAL */}
      {showLevelUpModal !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.85)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(12px)',
          fontFamily: "'Outfit', sans-serif",
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div className="glass-panel animate-scale-up" style={{
            width: '100%',
            maxWidth: '420px',
            padding: '40px 32px',
            borderRadius: '28px',
            border: '2px solid rgba(139, 92, 246, 0.4)',
            background: isLightMode 
              ? 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)' 
              : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            color: 'var(--text-primary)',
            boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.5)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Animated Celebration Icon */}
            <div style={{
              width: '88px',
              height: '88px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
              fontSize: '44px',
              animation: 'pulse 2s infinite',
              marginBottom: '8px'
            }}>
              👑
            </div>

            <h2 style={{ fontSize: '28px', fontWeight: '900', margin: 0, background: 'linear-gradient(to right, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              🎊 Congratulations!
            </h2>
            
            <h3 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
              🎉 Level Up!
            </h3>

            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '8px 0 16px 0' }}>
              You've reached <strong style={{ color: 'var(--color-primary)', fontSize: '18px' }}>Level {showLevelUpModal}</strong>. Keep playing to earn more rewards and climb the rankings!
            </p>

            <button
              onClick={() => { triggerSound('click'); setShowLevelUpModal(null); }}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px 28px',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                cursor: 'pointer'
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* 💬 DIRECT FRIEND CHAT MODAL */}
      {activeChatFriend && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.75)',
          zIndex: 9100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          fontFamily: "'Outfit', sans-serif",
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-panel animate-scale-up" style={{
            width: '100%',
            maxWidth: '460px',
            padding: '24px',
            borderRadius: '24px',
            border: '1px solid var(--border-glass)',
            background: isLightMode ? '#ffffff' : '#0f172a',
            color: 'var(--text-primary)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            position: 'relative',
            height: '520px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Close button */}
            <button 
              onClick={handleCloseChat}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isLightMode ? '#f1f5f9' : 'rgba(255,255,255,0.08)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>

            {/* Header */}
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💬 Chat with {activeChatFriend.username}
            </h3>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px', fontStyle: 'italic', opacity: 0.85, fontWeight: 'bold' }}>
              Keep the chat friendly and respectful. Only the latest 5 messages are displayed.
            </div>

            {/* Messages Body */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              background: 'rgba(0,0,0,0.08)',
              border: '1px solid var(--border-glass)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '16px'
            }}>
              {chatHistory.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                  No messages yet. Say hello to start chatting!
                </div>
              ) : (
                chatHistory.map((msg, idx) => {
                  const isMe = msg.senderId === userProfile.id;
                  return (
                    <div 
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        alignSelf: isMe ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', marginLeft: '4px', marginRight: '4px' }}>
                        {isMe ? 'You' : msg.senderUsername}
                      </span>
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: '14px',
                        borderTopRightRadius: isMe ? '2px' : '14px',
                        borderTopLeftRadius: isMe ? '14px' : '2px',
                        background: isMe ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)',
                        color: isMe ? '#ffffff' : 'var(--text-primary)',
                        fontSize: '13px',
                        lineHeight: '1.4',
                        wordBreak: 'break-word',
                        border: isMe ? 'none' : '1px solid var(--border-glass)'
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input Deck */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const text = friendChatInput.trim();
                if (!text) return;

                const words = text.split(/\s+/).filter(w => w.length > 0);
                if (words.length > 30) {
                  showToast("Chat limit: Messages are limited to 30 words maximum.", 'error');
                  return;
                }
                for (let i = 0; i < words.length; i++) {
                  if (words[i].length > 20) {
                    showToast(`Word limit: Each word can be a maximum of 20 characters ("${words[i].substring(0, 10)}...").`, 'error');
                    return;
                  }
                }
                
                triggerSound('click');
                setFriendChatInput('');

                // Append local copy instantly for fast UI feedback
                const newMsg = {
                  senderId: userProfile.id,
                  senderUsername: userProfile.username,
                  text,
                  timestamp: Date.now()
                };
                setChatHistory(prev => [...prev, newMsg].slice(-5));

                // Send message to server
                try {
                  const payload = { userId: userProfile.id, username: userProfile.username, exp: Date.now() + 1000 * 60 * 60 * 24 };
                  const token = btoa(JSON.stringify(payload));
                  await fetch(`${BACKEND_HTTP_URL}/profile/friends/chat/send`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      friendId: activeChatFriend.id,
                      text
                    })
                  });
                } catch (err) {
                  console.error('[Friends] Send message failed:', err);
                }
              }}
              style={{ display: 'flex', gap: '8px' }}
            >
              <input 
                type="text"
                value={friendChatInput}
                onChange={(e) => setFriendChatInput(e.target.value)}
                placeholder="Type a message..."
                maxLength={100}
                style={{
                  flex: 1,
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <button 
                type="submit"
                className="btn btn-primary"
                style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '13px' }}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🧭 SUBWAY SURFERS STYLE MENU POPUP */}
      {isMenuPopupOpen && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          background: isLightMode ? 'rgba(15, 23, 42, 0.4)' : 'rgba(5, 3, 10, 0.75)', 
          zIndex: 10000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: isLightMode ? '#ffffff' : '#0f172a',
            border: isLightMode ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.15)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '400px',
            padding: '28px 24px',
            position: 'relative',
            boxShadow: isLightMode 
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
              : '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
            fontFamily: "'Outfit', sans-serif",
            animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            {/* Close Button: clean circular slate/white button */}
            <button 
              onClick={() => { triggerSound('click'); setIsMenuPopupOpen(false); }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isLightMode ? '#f1f5f9' : 'rgba(255,255,255,0.08)',
                border: isLightMode ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.15)',
                color: isLightMode ? '#475569' : '#94a3b8',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.2s ease'
              }}
              title="Close Menu"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isLightMode ? '#e2e8f0' : 'rgba(255,255,255,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isLightMode ? '#f1f5f9' : 'rgba(255,255,255,0.08)';
              }}
            >
              ✕
            </button>

            {/* Header: Clean Elegant Menu title */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{
                fontSize: '24px',
                color: isLightMode ? '#0f172a' : '#ffffff',
                margin: 0,
                fontWeight: '800',
                letterSpacing: '-0.5px'
              }}>
                Menu
              </h2>
            </div>

            {/* Bubbly navigation button list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { 
                  id: 'home', 
                  label: t('play_arena'), 
                  icon: Gamepad2, 
                  bgLight: 'linear-gradient(to bottom, #fef3c7, #fde68a)', 
                  borderLight: '1px solid #f59e0b',
                  colorLight: '#b45309',
                  bgDark: 'rgba(245, 158, 11, 0.15)',
                  borderDark: '1px solid rgba(245, 158, 11, 0.4)',
                  colorDark: '#f59e0b'
                },
                { 
                  id: 'profile', 
                  label: t('my_profile'), 
                  icon: User, 
                  bgLight: 'linear-gradient(to bottom, #d1fae5, #a7f3d0)', 
                  borderLight: '1px solid #10b981',
                  colorLight: '#047857',
                  bgDark: 'rgba(16, 185, 129, 0.15)',
                  borderDark: '1px solid rgba(16, 185, 129, 0.4)',
                  colorDark: '#10b981'
                },
                { 
                  id: 'store', 
                  label: t('cosmetic_store'), 
                  icon: ShoppingBag, 
                  bgLight: 'linear-gradient(to bottom, #fce7f3, #fbcfe8)', 
                  borderLight: '1px solid #ec4899',
                  colorLight: '#be185d',
                  bgDark: 'rgba(236, 72, 153, 0.15)',
                  borderDark: '1px solid rgba(236, 72, 153, 0.4)',
                  colorDark: '#ec4899'
                },
                { 
                  id: 'leaderboard', 
                  label: t('leaderboards'), 
                  icon: Trophy, 
                  bgLight: 'linear-gradient(to bottom, #fef9c3, #fef08a)', 
                  borderLight: '1px solid #eab308',
                  colorLight: '#a16207',
                  bgDark: 'rgba(234, 179, 8, 0.15)',
                  borderDark: '1px solid rgba(234, 179, 8, 0.4)',
                  colorDark: '#eab308'
                },
                { 
                  id: 'avatars', 
                  label: 'Change Avatar & Frame', 
                  icon: Smile, 
                  bgLight: 'linear-gradient(to bottom, #ede9fe, #ddd6fe)', 
                  borderLight: '1px solid #8b5cf6',
                  colorLight: '#6d28d9',
                  bgDark: 'rgba(139, 92, 246, 0.15)',
                  borderDark: '1px solid rgba(139, 92, 246, 0.4)',
                  colorDark: '#8b5cf6'
                },

                { 
                  id: 'friends', 
                  label: 'Friends & Duels', 
                  icon: Users, 
                  bgLight: 'linear-gradient(to bottom, #f0fdf4, #dcfce7)', 
                  borderLight: '1px solid #22c55e',
                  colorLight: '#15803d',
                  bgDark: 'rgba(34, 197, 94, 0.15)',
                  borderDark: '1px solid rgba(34, 197, 94, 0.4)',
                  colorDark: '#22c55e'
                },
                { 
                  id: 'mail', 
                  label: 'Mailbox', 
                  icon: Mail, 
                  bgLight: 'linear-gradient(to bottom, #eff6ff, #dbeafe)', 
                  borderLight: '1px solid #3b82f6',
                  colorLight: '#1d4ed8',
                  bgDark: 'rgba(59, 130, 246, 0.15)',
                  borderDark: '1px solid rgba(59, 130, 246, 0.4)',
                  colorDark: '#3b82f6'
                },
                { 
                  id: 'settings', 
                  label: t('system_settings'), 
                  icon: SettingsIcon, 
                  bgLight: 'linear-gradient(to bottom, #f1f5f9, #e2e8f0)', 
                  borderLight: '1px solid #94a3b8',
                  colorLight: '#475569',
                  bgDark: 'rgba(148, 163, 184, 0.15)',
                  borderDark: '1px solid rgba(148, 163, 184, 0.4)',
                  colorDark: '#94a3b8'
                },
                { 
                  id: 'rate_us', 
                  label: t('rate_us'), 
                  icon: Star, 
                  bgLight: 'linear-gradient(to bottom, #fffbeb, #fef3c7)', 
                  borderLight: '1px solid #f59e0b',
                  colorLight: '#d97706',
                  bgDark: 'rgba(245, 158, 11, 0.12)',
                  borderDark: '1px solid rgba(245, 158, 11, 0.35)',
                  colorDark: '#fbbf24'
                },
              ].map(item => {
                const Icon = item.icon;
                const bg = isLightMode ? item.bgLight : item.bgDark;
                const border = isLightMode ? item.borderLight : item.borderDark;
                const color = isLightMode ? item.colorLight : item.colorDark;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      triggerSound('click');
                      setIsMenuPopupOpen(false);
                      if (item.id === 'mail') {
                        setIsMailboxOpen(true);
                        setUnreadMailCount(0);
                      } else if (item.id === 'rate_us') {
                        window.open('https://play.google.com/store', '_blank');
                      } else {
                        handleTabChange(item.id as any);
                      }
                    }}
                    style={{
                      width: '100%',
                      background: bg,
                      border: border,
                      color: color,
                      borderRadius: '14px',
                      padding: '12px 18px',
                      fontWeight: '700',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                      boxShadow: isLightMode ? '0 2px 4px rgba(0,0,0,0.02)' : 'none',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = isLightMode ? '0 4px 6px rgba(0,0,0,0.05)' : 'none';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = isLightMode ? '0 2px 4px rgba(0,0,0,0.02)' : 'none';
                    }}
                  >
                    <Icon size={18} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.id === 'friends' && Object.values(unreadChats).some(v => v) && (
                      <span style={{
                        position: 'absolute',
                        top: '12px',
                        right: '16px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        boxShadow: '0 0 8px #ef4444'
                      }} />
                    )}
                    {item.id === 'mail' && unreadMailCount > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '12px',
                        right: '16px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        boxShadow: '0 0 8px #ef4444'
                      }} />
                    )}
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* 🏆 MATCH RESULT GLASS MODAL OVERLAY */}
      {matchResult && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: isLightMode ? 'rgba(240, 244, 248, 0.98)' : 'rgba(5, 3, 10, 0.95)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(10px)' }}>
          {matchResult.isWinner && (
            <canvas 
              ref={confettiCanvasRef} 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} 
            />
          )}
          
          <div className="glass-panel" style={{ position: 'relative', zIndex: 2, maxWidth: '480px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', padding: '32px', border: isLightMode ? '1px solid #000000' : '1px solid var(--border-glass)', background: isLightMode ? '#ffffff' : 'var(--bg-glass)' }}>
            
            {/* Top Right Actions (Report & Add Friend) */}
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'flex-end',
              zIndex: 10
            }}>
              {/* Report Button */}
              {!matchResult.isSolo && matchResult.opponentId && !matchResult.opponentId.startsWith('bot_') && (
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <ShieldAlert size={14} />
                  Report
                </button>
              )}

              {/* Add Friend Button */}
              {!matchResult.isSolo && matchResult.opponentId && !matchResult.opponentId.startsWith('bot_') && !friendsList.some(f => f.id === matchResult.opponentId) && (
                <button
                  disabled={sentRequests.has(matchResult.opponentId)}
                  onClick={() => {
                    if (sentRequests.has(matchResult.opponentId!)) return;
                    triggerSound('click');
                    if (matchResult.opponentId!.startsWith('bot_')) {
                      // Mock successful friend request to bot
                      triggerSound('success');
                      setSentRequests(prev => {
                        const next = new Set(prev);
                        next.add(matchResult.opponentId!);
                        return next;
                      });
                    } else {
                      sendFriendRequestToServer(undefined, matchResult.opponentId).then((res) => {
                        if (res && res.success) {
                          showToast(`Friend request successfully sent to ${matchResult.opponentName || 'Opponent'}!`, 'success');
                        }
                      });
                    }
                  }}
                  style={{
                    background: sentRequests.has(matchResult.opponentId) 
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(139, 92, 246, 0.1)',
                    border: sentRequests.has(matchResult.opponentId)
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: sentRequests.has(matchResult.opponentId) ? '#10b981' : '#8b5cf6',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: sentRequests.has(matchResult.opponentId) ? 'default' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (sentRequests.has(matchResult.opponentId!)) return;
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (sentRequests.has(matchResult.opponentId!)) return;
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <UserPlus size={14} />
                  {sentRequests.has(matchResult.opponentId) ? 'Request Sent' : 'Add Friend'}
                </button>
              )}
            </div>

            <div style={{ 
              padding: '20px', 
              borderRadius: '50%', 
              background: matchResult.isDisconnect 
                ? 'rgba(245, 158, 11, 0.15)' 
                : matchResult.isWinner 
                  ? 'rgba(16, 185, 129, 0.15)' 
                  : 'rgba(239, 68, 68, 0.15)', 
              border: `1px solid ${
                matchResult.isDisconnect 
                  ? 'rgba(245, 158, 11, 0.4)' 
                  : matchResult.isWinner 
                    ? 'rgba(16, 185, 129, 0.4)' 
                    : 'rgba(239, 68, 68, 0.4)'
              }`, 
              boxShadow: matchResult.isDisconnect 
                ? '0 0 20px rgba(245, 158, 11, 0.3)' 
                : matchResult.isWinner 
                  ? '0 0 20px rgba(16, 185, 129, 0.3)' 
                  : '0 0 20px rgba(239, 68, 68, 0.3)', 
              margin: '0 auto', 
              animation: 'float 3s ease-in-out infinite' 
            }}>
              <Award size={48} color={
                matchResult.isDisconnect 
                  ? '#f59e0b' 
                  : matchResult.isWinner 
                    ? 'var(--color-success)' 
                    : 'var(--color-danger)'
              } />
            </div>

            <div>
              <h2 style={{ 
                fontSize: '28px', 
                color: matchResult.isDisconnect 
                  ? '#f59e0b' 
                  : matchResult.isWinner 
                    ? 'var(--color-success)' 
                    : 'var(--color-danger)', 
                fontFamily: 'var(--font-display)', 
                textTransform: 'uppercase', 
                letterSpacing: '1px' 
              }}>
                {matchResult.isDisconnect ? t('connection_lost') : (matchResult.isWinner ? t('victory') : t('defeat'))}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '8px' }}>
                {matchResult.isSolo 
                  ? t('solo_win_desc')
                  : matchResult.isDisconnect
                    ? t('connection_lost_desc')
                    : matchResult.bothDefeated
                      ? t('both_players_incorrect')
                      : matchResult.isWinner 
                        ? (matchResult.forfeit 
                            ? t('victory_forfeit_desc').replace('{opponent}', matchResult.opponentName || t('opponent_label'))
                            : t('victory_desc').replace('{opponent}', matchResult.opponentName || t('opponent_label')))
                        : (matchResult.forfeit
                            ? t('forfeit_desc')
                            : (matchResult.triviaDetails 
                                ? t('accuracy_loss_desc').replace('{winner}', matchResult.winnerName || t('opponent_label')) 
                                : t('speed_loss_desc').replace('{winner}', matchResult.winnerName || t('opponent_label'))))
                }
              </p>
              {matchResult.triviaDetails && (
                <div style={{ marginTop: '16px', background: isLightMode ? '#f1f5f9' : 'rgba(255,255,255,0.02)', padding: '12px 18px', borderRadius: '12px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>{t('you')}</span>
                    <strong style={{ color: 'var(--color-primary)' }}>{matchResult.triviaDetails.playerCorrect} / 5 {t('correct')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>{matchResult.opponentName || t('opponent_label')}</span>
                    <strong style={{ color: 'var(--color-accent)' }}>{matchResult.triviaDetails.opponentCorrect} / 5 {t('correct')}</strong>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center' }}>
                    {matchResult.triviaDetails.playerCorrect > matchResult.triviaDetails.opponentCorrect 
                      ? t('higher_accuracy_win') 
                      : matchResult.triviaDetails.playerCorrect < matchResult.triviaDetails.opponentCorrect 
                        ? t('opponent_accuracy_win') 
                        : t('tie_breaker_speed')
                    }
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '24px', background: isLightMode ? '#f1f5f9' : 'rgba(255,255,255,0.02)', padding: '14px 24px', borderRadius: '12px', border: '1px solid var(--border-glass)', justifyContent: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('league_rating').toUpperCase()}</span>
                <h4 style={{ fontSize: '18px', color: 'var(--color-secondary)', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                  {matchResult.isSolo ? (
                    t('practice')
                  ) : matchResult.isDisconnect ? (
                    t('disconnected')
                  ) : matchResult.isWinner ? (
                    (() => {
                      const diff = selectedDifficultyRef.current;
                      if (diff === 'easy') return '+20 pts';
                      if (diff === 'medium') return '+50 pts';
                      if (diff === 'hard') return '+80 pts';
                      return '+100 pts';
                    })()
                  ) : (
                    selectedDifficultyRef.current === 'online' ? '-50 pts' : '-20 pts'
                  )}
                </h4>
              </div>
              <div style={{ width: '1px', background: 'var(--border-glass)' }} />
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('rewards').toUpperCase()}</span>
                <h4 style={{ fontSize: '18px', color: 'var(--color-primary)', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                  {matchResult.isSolo || matchResult.isDisconnect ? (
                    matchResult.isDisconnect ? '0 ' + t('rewards') : '+5 Coins, +10 XP'
                  ) : matchResult.isWinner ? (
                    (() => {
                      const diff = selectedDifficultyRef.current;
                      if (diff === 'easy') return '+10 Coins';
                      if (diff === 'medium') return '+30 Coins, +1 Gem';
                      if (diff === 'hard') return '+60 Coins, +3 Gems';
                      return '+50 Coins';
                    })()
                  ) : (
                    '+2 Coins'
                  )}
                </h4>
              </div>
            </div>



            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px' }}
              onClick={() => {
                triggerSound('click');
                setMatchResult(null);
                setMatchmakingState('idle');
                setOpponentInfo(null);
              }}
            >
              {t('return_to_arena')}
            </button>
          </div>
        </div>
      )}

      {/* 🚨 REPORT PLAYER MODAL OVERLAY */}
      {isReportModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(5, 3, 10, 0.85)', zIndex: 2500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '28px', border: isLightMode ? '1px solid #000000' : '1px solid rgba(255,255,255,0.15)', background: isLightMode ? '#ffffff' : 'var(--bg-glass)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                🚨 Report Player
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Help keep Cognerix safe by reporting players who violate our community guidelines.
              </p>
            </div>

            <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Nickname input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                  YOUR NICKNAME
                </label>
                <input 
                  type="text" 
                  value={reportNickname}
                  onChange={(e) => setReportNickname(e.target.value)}
                  placeholder="Enter your nickname..."
                  required
                  style={{
                    background: 'rgba(0,0,0,0.15)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Reason dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                  REASON FOR REPORT
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as any)}
                  style={{
                    background: isLightMode ? '#ffffff' : '#110c22',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Nickname Violation">Nickname Violation</option>
                  <option value="Violence in Chat">Violence in Chat</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Free-text description input (Visible if Other is selected) */}
              {reportReason === 'Other' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', animation: 'fadeIn 0.2s ease-out' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                    DESCRIPTION
                  </label>
                  <textarea 
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Describe the issue in detail..."
                    required
                    rows={4}
                    style={{
                      background: 'rgba(0,0,0,0.15)',
                      border: '1px solid var(--border-glass)',
                      color: 'var(--text-primary)',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    triggerSound('click');
                    setIsReportModalOpen(false);
                    setReportDescription('');
                  }}
                  className="btn btn-glass"
                  style={{ flex: 1, padding: '10px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px', fontSize: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >
                  {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⚔️ CHOOSE GAME DIFFICULTY MODAL OVERLAY */}
      {difficultyModal && !matchResult && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(5, 3, 10, 0.85)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '28px', border: isLightMode ? '1px solid #000000' : '1px solid rgba(255,255,255,0.15)', background: isLightMode ? '#ffffff' : 'var(--bg-glass)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                ⚔️ {t('choose_game_mode')}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                {t('choose_game_mode_desc')}
              </p>
              <div style={{ marginTop: '8px' }}>
                <button
                  onClick={() => {
                    triggerSound('click');
                    setIsRulesModalOpen(true);
                  }}
                  style={{
                    background: 'rgba(139,92,246,0.1)',
                    color: 'var(--color-primary)',
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    border: '1px solid rgba(139,92,246,0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    outline: 'none',
                    transition: 'background 0.2s'
                  }}
                >
                  📜 {t('rules_how_to_play')}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Solo Play Mode */}
              <button 
                className="glass-panel"
                style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  border: '1px solid rgba(6,182,212,0.4)',
                  background: 'rgba(6,182,212,0.1)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  width: '100%'
                }}
                onClick={() => {
                  triggerSound('click');
                  selectedDifficultyRef.current = 'solo';
                  setActiveGame(difficultyModal.puzzleType);
                  setMatchmakingState('playing');
                  setOpponentInfo(null); // No opponent
                  recordGamePlay(difficultyModal.puzzleType);
                  setDifficultyModal(null);
                }}
              >
                <div>
                  <div style={{ color: isLightMode ? '#000000' : '#ffffff', fontWeight: 'bold', fontSize: '14px' }}>🧘 {t('solo_play')}</div>
                  <div style={{ fontSize: '11px', color: isLightMode ? '#334155' : 'rgba(255,255,255,0.7)', marginTop: '2px' }}>{t('solo_play_desc')}</div>
                </div>
                <span style={{ fontSize: '11px', background: isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', color: isLightMode ? '#000000' : '#ffffff', fontWeight: 'bold' }}>{t('solo')}</span>
              </button>

              <div style={{ margin: '4px 0', borderTop: isLightMode ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.05)' }} />

              <button 
                className="glass-panel"
                style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  border: '1px solid rgba(139,92,246,0.4)',
                  background: 'rgba(139,92,246,0.1)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  width: '100%'
                }}
                onClick={() => {
                  startMatchmaking(difficultyModal.puzzleType, 'online');
                  setDifficultyModal(null);
                }}
              >
                <div>
                  <div style={{ color: isLightMode ? '#000000' : '#ffffff', fontWeight: 'bold', fontSize: '14px' }}>🛰️ {t('online_arena_1v1')}</div>
                  <div style={{ fontSize: '11px', color: isLightMode ? '#334155' : 'rgba(255,255,255,0.7)', marginTop: '2px' }}>{t('online_arena_1v1_desc')}</div>
                </div>
                <span style={{ fontSize: '11px', background: isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', color: isLightMode ? '#000000' : '#ffffff', fontWeight: 'bold' }}>{t('queue')}</span>
              </button>

              <div style={{ marginTop: '8px', borderTop: isLightMode ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>{t('challenge_ai_bot')}</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { diff: 'easy', labelKey: 'easy_ai', speed: 'slow', coin: 10, gem: 0, color: '#10b981', bgLight: '#f4fbf7', prefix: '🟢' },
                    { diff: 'medium', labelKey: 'medium_ai', speed: 'medium', coin: 30, gem: 1, color: '#f59e0b', bgLight: '#fffaf0', prefix: '🟡' },
                    { diff: 'hard', labelKey: 'hard_ai', speed: 'fast', coin: 60, gem: 3, color: '#ef4444', bgLight: '#fff5f5', prefix: '🔴' }
                  ].map(level => (
                    <button
                      key={level.diff}
                      className="btn"
                      style={{ 
                        background: isLightMode ? level.bgLight : 'rgba(255,255,255,0.03)', 
                        border: 'none',
                        borderLeft: `4px solid ${level.color}`,
                        boxShadow: isLightMode ? '0 4px 12px rgba(0, 0, 0, 0.05)' : undefined,
                        borderRadius: '12px',
                        color: 'var(--text-primary)',
                        padding: '12px 16px',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        startMatchmaking(difficultyModal.puzzleType, level.diff as any);
                        setDifficultyModal(null);
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600' }}>{level.prefix} {t(level.labelKey)}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{t(level.labelKey + '_desc')}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>+{level.coin} Coins</div>
                        {level.gem > 0 && <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 'bold' }}>+{level.gem} Gems</div>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '12px', borderTop: isLightMode ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>{t('play_with_friend')}</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Create Private Room */}
                  <button
                    className="btn"
                    style={{ 
                      background: isLightMode ? '#f0fdf4' : 'rgba(16,185,129,0.05)', 
                      border: '1px solid rgba(16,185,129,0.2)',
                      borderRadius: '12px',
                      color: 'var(--text-primary)',
                      padding: '12px 16px',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (userProfile.gems < 10) {
                        triggerSound('fail');
                        showToast("You need at least 10 Gems to host a private friend duel room!", 'error');
                        return;
                      }
                      spendGems(10);
                      startMatchmaking(difficultyModal.puzzleType, 'private_create');
                      setDifficultyModal(null);
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-success)', textAlign: 'left' }}>🔑 {t('create_private_room')}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', textAlign: 'left' }}>{t('create_private_room_desc')}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: 'var(--color-secondary)', fontWeight: 'bold' }}>💎 10 Gems</div>
                    </div>
                  </button>

                  {/* Join Private Room */}
                  <div 
                    style={{ 
                      background: isLightMode ? '#f8fafc' : 'rgba(255,255,255,0.02)', 
                      border: '1px solid var(--border-glass)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', textAlign: 'left' }}>🔗 {t('join_friend_room')}</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        maxLength={4}
                        placeholder="4-Digit PIN"
                        id="private-room-pin-input"
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-glass)',
                          background: isLightMode ? '#ffffff' : 'rgba(0,0,0,0.2)',
                          color: 'var(--text-primary)',
                          fontSize: '13px',
                          textAlign: 'center',
                          letterSpacing: '2px',
                          fontWeight: 'bold'
                        }}
                      />
                      <button
                        className="btn btn-primary"
                        style={{ padding: '8px 16px', fontSize: '12px' }}
                        onClick={() => {
                          const inputEl = document.getElementById('private-room-pin-input') as HTMLInputElement;
                          const pin = inputEl?.value?.trim();
                          if (!pin || pin.length !== 4 || isNaN(Number(pin))) {
                            triggerSound('fail');
                            showToast("Please enter a valid 4-digit room PIN.", 'error');
                            return;
                          }
                          startMatchmaking(difficultyModal.puzzleType, 'private_join', pin);
                          setDifficultyModal(null);
                        }}
                      >
                        {t('join')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              className="btn btn-glass" 
              style={{ padding: '10px', width: '100%', marginTop: '4px', color: 'var(--text-primary)', border: isLightMode ? '1px solid #000000' : undefined }}
              onClick={() => {
                triggerSound('click');
                setDifficultyModal(null);
              }}
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {/* 📖 RULES / HOW TO PLAY MODAL OVERLAY */}
      {isRulesModalOpen && difficultyModal && (() => {
        const getPuzzleRules = (type: PuzzleType) => {
          switch (type) {
            case PuzzleType.SLIDING:
              return {
                title: "Sliding Block Challenge",
                desc: "Slide the numbered blocks horizontally or vertically into the empty space to sort them in ascending order.",
                clues: [
                  "🧩 The tiles must be sorted sequentially from left-to-right, top-to-bottom.",
                  "🔢 A standard 3x3 grid contains numbers 1 through 8 (with 1 blank space).",
                  "⌨️ Use the Arrow keys on your keyboard, or click adjacent blocks, to slide them.",
                  "💡 Plan your moves ahead! Solve faster to get higher score multiplier ratings."
                ]
              };
            case PuzzleType.SUDOKU:
              return {
                title: "Sudoku Arena",
                desc: "Fill the 9x9 grid with digits so that every column, row, and 3x3 region contains all digits from 1 to 9.",
                clues: [
                  "🚫 You cannot repeat any digit (1-9) within the same row, column, or 3x3 box grid.",
                  "✏️ Use Note Mode to pencil in possible numbers for cells you aren't sure about.",
                  "❌ Making incorrect entries registers errors. Be careful not to make conflicts!",
                  "🖱️ Click on a cell, then select a number from the digit pad to enter it."
                ]
              };
            case PuzzleType.WORD:
              return {
                title: "Word Anagram Arena",
                desc: "Guess the hidden 5-letter target puzzle word in 6 attempts or less using color-coded hints.",
                clues: [
                  "🟢 GREEN indicates the letter is in the correct position.",
                  "🟡 YELLOW indicates the letter is in the word but in a different position.",
                  "🔴 GREY/ABSENT indicates the letter is not in the hidden word at all.",
                  "⌨️ Type letters with your keyboard, then press Enter to submit your guess."
                ]
              };
            case PuzzleType.LOGIC:
              return {
                title: "Logic Grid Duel",
                desc: "Use logical deduction rules and a set of text clues to solve who holds which badge rank and favorite game.",
                clues: [
                  "📋 Read the clues carefully! Each clue points to true or false matching constraints.",
                  "❌ Eliminate wrong options using the selection selectors for Alice, Bob, and Charlie.",
                  "🔑 Ensure each entity has unique values (no two players can share the same rank badge/game).",
                  "✨ Double check your choices before clicking submit to verify the complete grid."
                ]
              };
            case PuzzleType.JIGSAW:
              return {
                title: "Jigsaw Grid Snapper",
                desc: "Drag the scrambled gradient image tiles into their correct slots to complete the photo scene.",
                clues: [
                  "🖼️ Look at the source image template to understand the gradient transitions.",
                  "🧩 Drag pieces from the tray and snap them into correct grid coordinates.",
                  "⏱️ Both players solve the same grid seed. First to finish snaps the game win!",
                  "🔄 Dragging a tile onto an occupied slot will swap the placements."
                ]
              };
            case PuzzleType.PHYSICS:
              return {
                title: "Slingshot Vector Arena",
                desc: "Launch the coordinate ball using coordinates and pull-back mechanics to trigger target beacons.",
                clues: [
                  "🎯 Pull back the ball from its origin coordinates to build up vector velocity.",
                  "📐 Angle your launch vector to bounce off wall coordinates and bypass obstacles.",
                  "💡 Reach target coordinates in as few attempts as possible.",
                  "⚡ Speed and accuracy determine your round rating multiplier!"
                ]
              };
            case PuzzleType.EIGHT_BALL_QUIZ:
              return {
                title: "Logic Trivia Duel",
                desc: "Answer 5 multiple choice logic questions as fast as possible under time constraints.",
                clues: [
                  "⏱️ You have exactly 15 seconds to submit your answer for each question.",
                  "🧠 Questions cover computer science, mathematics, current affairs, and logical patterns.",
                  "🌟 Score is determined by both answer accuracy and speed.",
                  "👑 The player with the highest total correct count wins the trivia duel!"
                ]
              };
            case PuzzleType.BLOCK_BLUSTER:
              return {
                title: "Block Bluster",
                desc: "Fill rows & columns to blast blocks and score big combos!",
                clues: [
                  "🧩 Drag and release block shapes from the bottom tray onto the 8x8 grid.",
                  "💥 Fill entire horizontal rows or vertical columns to blast blocks away and earn points.",
                  "⚡ Clear multiple lines simultaneously to score DOUBLE and TRIPLE BLAST combos!",
                  "🚫 If none of the available shapes fit on the grid, the game ends. Maximize your score!"
                ]
              };
            case PuzzleType.WORD_SEARCH:
              return {
                title: "Word Search",
                desc: "Locate hidden words across horizontal, vertical, and diagonal paths!",
                clues: [
                  "🔍 Click and drag your cursor across adjacent letter cells to select words.",
                  "↔️ Words can be hidden horizontally, vertically, or diagonally (forwards and backwards).",
                  "✅ Found words get highlighted with permanent glowing colors and crossed off the word bank.",
                  "🏆 Uncover all hidden target words to win the match!"
                ]
              };
            case PuzzleType.TOWER_BLOXX:
              return {
                title: "Tower Bloxx",
                desc: "Stack swinging animal house modules precisely to construct the tallest skyscraper!",
                clues: [
                  "🏗️ Tap the canvas or press SPACEBAR to release the swinging animal house block from the crane hook.",
                  "✨ Land blocks directly in the center to earn PERFECT STACK combo multipliers and extra score points!",
                  "🏡 Each floor module features a cute resident animal (Puppies, Kittens, Bunnies, Bears) peeking out and waving 👋!",
                  "💨 Activate the WIND GUST special attack (costs 750🪙 & 150💎) to unleash a 3-second violent sway storm on your opponent's tower!"
                ]
              };

            case PuzzleType.MENTAL_MATH:
              return {
                title: "Mental Math Challenge",
                desc: "Fast-paced arithmetic memory! Add up numbers quickly after they disappear.",
                clues: [
                  "🔢 Pick number counts (5 or 10) and digits count per number (1 to 6).",
                  "⏱️ Memorize the numbers shown simultaneously during the fixed 3-second display phase.",
                  "💡 Add up the numbers and enter your answer during the 10-second countdown.",
                  "⚡ Buy extra time (+5s, up to 2 times) using Coins and Gems if you need more time."
                ]
              };
            default:
              return {
                title: "PuzzleVerse Rules",
                desc: "Compete head-to-head in real time across unique puzzle categories.",
                clues: [
                  "🏆 Real-time updates let you monitor your opponent's progress.",
                  "💬 Use inline chat drawer buttons to communicate.",
                  "🤩 Tap inline reaction emoji bubbles to express your feelings.",
                  "⊘ Toggle block flags anytime if you wish to block opponent alerts."
                ]
              };
          }
        };

        const rules = getPuzzleRules(difficultyModal.puzzleType);

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(5, 3, 10, 0.9)', zIndex: 2200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(10px)' }}>
            <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '28px', border: isLightMode ? '1px solid #000000' : '1px solid rgba(255,255,255,0.15)', background: isLightMode ? '#ffffff' : 'var(--bg-glass)', display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'Outfit', sans-serif" }}>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  📖 {t('how_to_play_title')}
                </h3>
                <h4 style={{ fontSize: '15px', color: 'var(--color-primary)', marginTop: '8px', fontWeight: 'bold' }}>
                  {t((difficultyModal.puzzleType === PuzzleType.EIGHT_BALL_QUIZ ? 'trivia' : difficultyModal.puzzleType.toLowerCase()) + '_name')}
                </h4>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.5' }}>
                  {t((difficultyModal.puzzleType === PuzzleType.EIGHT_BALL_QUIZ ? 'trivia' : difficultyModal.puzzleType.toLowerCase()) + '_desc')}
                </p>
              </div>

              <div style={{ width: '100%', height: '1px', background: 'var(--border-glass)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {rules.clues.map((clue, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5', textAlign: 'left' }}>
                    <div style={{ marginTop: '2px' }}>{clue.split(' ')[0]}</div>
                    <div>{clue.split(' ').slice(1).join(' ')}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  triggerSound('click');
                  setIsRulesModalOpen(false);
                }}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', marginTop: '10px' }}
              >
                {t('got_it_lets_play')}
              </button>
            </div>
          </div>
        );
      })()}
      {/* Floating pulsing Return to Game widget */}
      {activeGame && isGameHidden && (
        <div 
          onClick={() => { triggerSound('click'); setIsGameHidden(false); setActiveTab('home'); }}
          className="animate-pulse-scale"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '30px',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold',
            fontFamily: 'var(--font-display)'
          }}
        >
          <Gamepad2 size={18} />
          Back to Active Game
        </div>
      )}

      {/* Custom Toast Notification System */}
      {toast && (
        <div 
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: toast.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            zIndex: 10000,
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeInUp 0.2s ease-out'
          }}
        >
          {toast.type === 'success' ? '✅' : 'ℹ️'} {toast.message}
        </div>
      )}

      {/* Custom Shop Unlock Confirm Modal */}
      {shopConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10010,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-panel" style={{
            width: '90%',
            maxWidth: '400px',
            padding: '24px',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            color: 'var(--text-primary)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            animation: 'scaleIn 0.2s ease-out'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', textAlign: 'center', fontFamily: 'var(--font-display)' }}>
              Confirm Unlock
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.5' }}>
              Unlock <strong style={{ color: 'var(--color-primary)' }}>{shopConfirm.itemName}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '8px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '18px' }}>🪙</span>
                <span style={{ fontWeight: 'bold' }}>{shopConfirm.costCoins}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '18px' }}>💎</span>
                <span style={{ fontWeight: 'bold' }}>{shopConfirm.costGems}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }} 
                onClick={() => { triggerSound('click'); setShopConfirm(null); }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }} 
                onClick={() => {
                  triggerSound('click');
                  shopConfirm.onConfirm();
                  setShopConfirm(null);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Generic Confirmation Modal */}
      {genericConfirm && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10010,
            padding: '16px'
          }}
        >
          <div 
            className="glass-panel" 
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
              borderRadius: '16px',
              border: '1px solid var(--border-glass)',
              animation: 'fade-in 0.2s ease-out'
            }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', textAlign: 'center', fontFamily: 'var(--font-display)' }}>
              Confirm Action
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.5' }}>
              {genericConfirm.message}
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }} 
                onClick={() => { triggerSound('click'); setGenericConfirm(null); }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }} 
                onClick={() => {
                  triggerSound('click');
                  genericConfirm.onConfirm();
                  setGenericConfirm(null);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
