import React, { useState, useEffect } from 'react';
import { PuzzleType } from '@puzzle-verse/shared';
import { Info } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { translate } from '../utils/translations';

let globalAudioContext: AudioContext | null = null;
const getAudioContext = () => {
  if (!globalAudioContext) {
    globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return globalAudioContext;
};

const playInstantLogicSound = (isMuted?: boolean) => {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 400;
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.06);
};

interface LogicQuestion {
  names: string[];
  category1Label: { en: string; hi: string };
  category2Label: { en: string; hi: string };
  category1Placeholder: { en: string; hi: string };
  category2Placeholder: { en: string; hi: string };
  category1Options: { value: string; label: { en: string; hi: string } }[];
  category2Options: { value: string; label: { en: string; hi: string } }[];
  clues: { en: string; hi: string }[];
  solution: {
    [name: string]: { category1: string; category2: string };
  };
}

const QUESTIONS: LogicQuestion[] = [
  {
    names: ['Alice', 'Bob', 'Charlie'],
    category1Label: { en: 'Rank Badge', hi: 'रैंक बैज' },
    category2Label: { en: 'Favorite Puzzle', hi: 'पसंदीदा पहेली' },
    category1Placeholder: { en: 'Match Rank', hi: 'रैंक मिलान करें' },
    category2Placeholder: { en: 'Match Puzzle', hi: 'पहेली मिलान करें' },
    category1Options: [
      { value: 'Gold', label: { en: 'Gold Badge', hi: 'गोल्ड बैज' } },
      { value: 'Silver', label: { en: 'Silver Badge', hi: 'सिल्वर बैज' } },
      { value: 'Bronze', label: { en: 'Bronze Badge', hi: 'ब्रॉन्ज़ बैज' } }
    ],
    category2Options: [
      { value: 'Sliding', label: { en: 'Sliding Block', hi: 'स्लाइडिंग ब्लॉक' } },
      { value: 'Word', label: { en: 'Word Anagram', hi: 'शब्द एनाग्राम' } },
      { value: 'Trivia', label: { en: 'Trivia Logic', hi: 'सामान्य ज्ञान तर्क' } }
    ],
    clues: [
      { en: '💡 Clue 1: The player who loves Word Anagrams is Silver rank.', hi: '💡 सुराग 1: वह खिलाड़ी जिसे शब्द एनाग्राम पसंद है वह सिल्वर रैंक का है।' },
      { en: '💡 Clue 2: Alice is Bronze rank.', hi: '💡 सुराग 2: एलिस ब्रॉन्ज़ रैंक की है।' },
      { en: '💡 Clue 3: Charlie loves the Sliding block puzzle.', hi: '💡 सुराग 3: चार्ली को स्लाइडिंग ब्लॉक पहेली पसंद है।' }
    ],
    solution: {
      Alice: { category1: 'Bronze', category2: 'Trivia' },
      Bob: { category1: 'Silver', category2: 'Word' },
      Charlie: { category1: 'Gold', category2: 'Sliding' }
    }
  },
  {
    names: ['Commander Leo', 'Dr. Sarah', 'Pilot Jax'],
    category1Label: { en: 'Spacecraft', hi: 'अंतरिक्ष यान' },
    category2Label: { en: 'Destination Planet', hi: 'गंतव्य ग्रह' },
    category1Placeholder: { en: 'Select Spacecraft', hi: 'अंतरिक्ष यान चुनें' },
    category2Placeholder: { en: 'Select Planet', hi: 'ग्रह चुनें' },
    category1Options: [
      { value: 'Nebula', label: { en: 'Nebula-X', hi: 'नेबुला-X' } },
      { value: 'Odyssey', label: { en: 'Odyssey-9', hi: 'ओडिसी-9' } },
      { value: 'Zenith', label: { en: 'Zenith-1', hi: 'जेनिथ-1' } }
    ],
    category2Options: [
      { value: 'Mars', label: { en: 'Mars', hi: 'मंगल' } },
      { value: 'Titan', label: { en: 'Titan', hi: 'टाइटन' } },
      { value: 'Europa', label: { en: 'Europa', hi: 'यूरोपा' } }
    ],
    clues: [
      { en: '💡 Clue 1: The pilot who flies the Zenith-1 is traveling to Mars.', hi: '💡 सुराग 1: जो पायलट जेनिथ-1 उड़ाता है वह मंगल ग्रह की यात्रा कर रहा है।' },
      { en: '💡 Clue 2: Commander Leo commands the Nebula-X spacecraft.', hi: '💡 सुराग 2: कमांडर लियो नेबुला-X अंतरिक्ष यान की कमान संभालते हैं।' },
      { en: '💡 Clue 3: Dr. Sarah\'s destination is Europa.', hi: '💡 सुराग 3: डॉ. सारा का गंतव्य यूरोपा है।' }
    ],
    solution: {
      'Commander Leo': { category1: 'Nebula', category2: 'Titan' },
      'Dr. Sarah': { category1: 'Odyssey', category2: 'Europa' },
      'Pilot Jax': { category1: 'Zenith', category2: 'Mars' }
    }
  },
  {
    names: ['Sherlock', 'Poirot', 'Dupin'],
    category1Label: { en: 'Clue Item', hi: 'सुराग वस्तु' },
    category2Label: { en: 'Primary Suspect', hi: 'मुख्य संदिग्ध' },
    category1Placeholder: { en: 'Select Clue Item', hi: 'सुराग वस्तु चुनें' },
    category2Placeholder: { en: 'Select Suspect', hi: 'संदिग्ध चुनें' },
    category1Options: [
      { value: 'Magnifying Glass', label: { en: 'Magnifying Glass', hi: 'आवर्धक लेंस' } },
      { value: 'Pocket Watch', label: { en: 'Pocket Watch', hi: 'जेबी घड़ी' } },
      { value: 'Gold Ring', label: { en: 'Gold Ring', hi: 'सोने की अंगूठी' } }
    ],
    category2Options: [
      { value: 'Butler', label: { en: 'The Butler', hi: 'खानसामा' } },
      { value: 'Butler\'s Wife', label: { en: 'Butler\'s Wife', hi: 'खानसामा की पत्नी' } },
      { value: 'Chef', label: { en: 'The Chef', hi: 'रसोइया' } }
    ],
    clues: [
      { en: '💡 Clue 1: The detective searching for the Pocket Watch suspects the Chef.', hi: '💡 सुराग 1: जेबी घड़ी की तलाश करने वाले जासूस को रसोइया पर संदेह है।' },
      { en: '💡 Clue 2: Sherlock suspects the Butler.', hi: '💡 सुराग 2: शर्लक को खानसामा पर संदेह है।' },
      { en: '💡 Clue 3: Dupin found the Magnifying Glass.', hi: '💡 सुराग 3: डुपिन को आवर्धक लेंस मिला।' }
    ],
    solution: {
      Sherlock: { category1: 'Gold Ring', category2: 'Butler' },
      Poirot: { category1: 'Pocket Watch', category2: 'Chef' },
      Dupin: { category1: 'Magnifying Glass', category2: 'Butler\'s Wife' }
    }
  },
  {
    names: ['Arthur the Knight', 'Merlin the Mage', 'Legolas the Elf'],
    category1Label: { en: 'Weapon Class', hi: 'हथियार श्रेणी' },
    category2Label: { en: 'Dungeon Vault', hi: 'तहखाना तिजोरी' },
    category1Placeholder: { en: 'Select Weapon', hi: 'हथियार चुनें' },
    category2Placeholder: { en: 'Select Dungeon', hi: 'तहखाना चुनें' },
    category1Options: [
      { value: 'Sword', label: { en: 'Excalibur Sword', hi: 'एक्सकैलिबर तलवार' } },
      { value: 'Staff', label: { en: 'Arcane Staff', hi: 'रहस्यमयी छड़ी' } },
      { value: 'Bow', label: { en: 'Recurve Bow', hi: 'रिकर्व धनुष' } }
    ],
    category2Options: [
      { value: 'Fire Cave', label: { en: 'Fire Cave', hi: 'अग्नि गुफा' } },
      { value: 'Ice Castle', label: { en: 'Ice Castle', hi: 'बर्फ का महल' } },
      { value: 'Shadow Maze', label: { en: 'Shadow Maze', hi: 'छाया भूलभुलैया' } }
    ],
    clues: [
      { en: '💡 Clue 1: The hero wielding the Arcane Staff is raiding the Ice Castle.', hi: '💡 सुराग 1: रहस्यमयी छड़ी रखने वाला नायक बर्फ के महल पर छापा मार रहा है।' },
      { en: '💡 Clue 2: Arthur the Knight wields the Excalibur Sword.', hi: '💡 सुराग 2: आर्थर द नाइट एक्सकैलिबर तलवार चलाते हैं।' },
      { en: '💡 Clue 3: Legolas the Elf is raiding the Shadow Maze.', hi: '💡 सुराग 3: लेगोलास द एल्फ छाया भूलभुलैया पर छापा मार रहे हैं।' }
    ],
    solution: {
      'Arthur the Knight': { category1: 'Sword', category2: 'Fire Cave' },
      'Merlin the Mage': { category1: 'Staff', category2: 'Ice Castle' },
      'Legolas the Elf': { category1: 'Bow', category2: 'Shadow Maze' }
    }
  },
  {
    names: ['Chef Gordon', 'Chef Julia', 'Chef Marco'],
    category1Label: { en: 'Signature Dish', hi: 'हस्ताक्षर व्यंजन' },
    category2Label: { en: 'Secret Ingredient', hi: 'गुप्त सामग्री' },
    category1Placeholder: { en: 'Select Dish', hi: 'व्यंजन चुनें' },
    category2Placeholder: { en: 'Select Ingredient', hi: 'सामग्री चुनें' },
    category1Options: [
      { value: 'Beef Wellington', label: { en: 'Beef Wellington', hi: 'बीफ वेलिंगटन' } },
      { value: 'Souffle', label: { en: 'Souffle', hi: 'सूपले' } },
      { value: 'Risotto', label: { en: 'Mushroom Risotto', hi: 'मशरूम रिसोट्टो' } }
    ],
    category2Options: [
      { value: 'Truffle', label: { en: 'Truffle Oil', hi: 'ट्रफल तेल' } },
      { value: 'Saffron', label: { en: 'Pure Saffron', hi: 'शुद्ध केसर' } },
      { value: 'Vanilla', label: { en: 'Vanilla Bean', hi: 'वैनिला बीन' } }
    ],
    clues: [
      { en: '💡 Clue 1: The chef preparing Mushroom Risotto uses Pure Saffron as the secret ingredient.', hi: '💡 सुराग 1: मशरूम रिसोट्टो तैयार करने वाला रसोइया गुप्त सामग्री के रूप में शुद्ध केसर का उपयोग करता है।' },
      { en: '💡 Clue 2: Chef Gordon makes Beef Wellington.', hi: '💡 सुराग 2: शेफ गॉर्डन बीफ वेलिंगटन बनाते हैं।' },
      { en: '💡 Clue 3: Chef Marco uses Vanilla Bean in his recipe.', hi: '💡 सुराग 3: शेफ मार्को अपने नुस्खे में वैनिला बीन का उपयोग करते हैं।' }
    ],
    solution: {
      'Chef Gordon': { category1: 'Beef Wellington', category2: 'Truffle' },
      'Chef Julia': { category1: 'Risotto', category2: 'Saffron' },
      'Chef Marco': { category1: 'Souffle', category2: 'Vanilla' }
    }
  },
  {
    names: ['Alexander', 'Julius Caesar', 'Cleopatra'],
    category1Label: { en: 'Ancient Empire', hi: 'प्राचीन साम्राज्य' },
    category2Label: { en: 'Legacy Monument', hi: 'विरासत स्मारक' },
    category1Placeholder: { en: 'Select Empire', hi: 'साम्राज्य चुनें' },
    category2Placeholder: { en: 'Select Monument', hi: 'स्मारक चुनें' },
    category1Options: [
      { value: 'Greek', label: { en: 'Greek Empire', hi: 'यूनानी साम्राज्य' } },
      { value: 'Roman', label: { en: 'Roman Empire', hi: 'रोमन साम्राज्य' } },
      { value: 'Egyptian', label: { en: 'Egyptian Empire', hi: 'मिस्र का साम्राज्य' } }
    ],
    category2Options: [
      { value: 'Library', label: { en: 'Alexandria Library', hi: 'अलेक्जेंड्रिया पुस्तकालय' } },
      { value: 'Colosseum', label: { en: 'Colosseum', hi: 'कोलोसियम' } },
      { value: 'Pyramid', label: { en: 'Giza Pyramid', hi: 'गीज़ा पिरामिड' } }
    ],
    clues: [
      { en: '💡 Clue 1: The ruler of the Roman Empire is famous for building the Colosseum.', hi: '💡 सुराग 1: रोमन साम्राज्य का शासक कोलोसियम के निर्माण के लिए प्रसिद्ध है।' },
      { en: '💡 Clue 2: Alexander ruled the Greek Empire.', hi: '💡 सुराग 2: अलेक्जेंडर ने यूनानी साम्राज्य पर शासन किया।' },
      { en: '💡 Clue 3: Cleopatra\'s legacy monument is the Giza Pyramid.', hi: '💡 सुराग 3: क्लियोपेट्रा का विरासत स्मारक गीज़ा पिरामिड है।' }
    ],
    solution: {
      Alexander: { category1: 'Greek', category2: 'Library' },
      'Julius Caesar': { category1: 'Roman', category2: 'Colosseum' },
      Cleopatra: { category1: 'Egyptian', category2: 'Pyramid' }
    }
  },
  {
    names: ['John', 'Paul', 'Ringo'],
    category1Label: { en: 'Instrument', hi: 'वाद्य यंत्र' },
    category2Label: { en: 'Favorite Genre', hi: 'पसंदीदा शैली' },
    category1Placeholder: { en: 'Select Instrument', hi: 'वाद्य यंत्र चुनें' },
    category2Placeholder: { en: 'Select Genre', hi: 'शैली चुनें' },
    category1Options: [
      { value: 'Guitar', label: { en: 'Guitar', hi: 'गिटार' } },
      { value: 'Bass', label: { en: 'Bass Guitar', hi: 'बास गिटार' } },
      { value: 'Drums', label: { en: 'Drums', hi: 'ड्रम' } }
    ],
    category2Options: [
      { value: 'Rock', label: { en: 'Rock', hi: 'रॉक' } },
      { value: 'Jazz', label: { en: 'Jazz', hi: 'जैज़' } },
      { value: 'Blues', label: { en: 'Blues', hi: 'ब्लूज़' } }
    ],
    clues: [
      { en: '💡 Clue 1: The band member playing Bass Guitar loves Jazz.', hi: '💡 सुराग 1: बास गिटार बजाने वाले बैंड सदस्य को जैज़ पसंद है।' },
      { en: '💡 Clue 2: John plays Guitar.', hi: '💡 सुराग 2: जॉन गिटार बजाते हैं।' },
      { en: '💡 Clue 3: Ringo\'s favorite genre is Blues.', hi: '💡 सुराग 3: रिंगो की पसंदीदा शैली ब्लूज़ है।' }
    ],
    solution: {
      John: { category1: 'Guitar', category2: 'Rock' },
      Paul: { category1: 'Bass', category2: 'Jazz' },
      Ringo: { category1: 'Drums', category2: 'Blues' }
    }
  },
  {
    names: ['AlphaNode', 'ByteCore', 'CyberGrid'],
    category1Label: { en: 'AI Model Class', hi: 'एआई मॉडल वर्ग' },
    category2Label: { en: 'Core Language', hi: 'मुख्य भाषा' },
    category1Placeholder: { en: 'Select AI Model', hi: 'एआई मॉडल चुनें' },
    category2Placeholder: { en: 'Select Language', hi: 'भाषा चुनें' },
    category1Options: [
      { value: 'Neural Net', label: { en: 'Neural Net', hi: 'तंत्रिका नेटवर्क' } },
      { value: 'LLM', label: { en: 'LLM Agent', hi: 'एलएलएम एजेंट' } },
      { value: 'Deep Agent', label: { en: 'Deep RL Agent', hi: 'डीप आरएल एजेंट' } }
    ],
    category2Options: [
      { value: 'Python', label: { en: 'Python', hi: 'पायथन' } },
      { value: 'TypeScript', label: { en: 'TypeScript', hi: 'टाइपस्क्रिप्ट' } },
      { value: 'Rust', label: { en: 'Rust Lang', hi: 'रस्ट भाषा' } }
    ],
    clues: [
      { en: '💡 Clue 1: The system running the LLM Agent uses TypeScript.', hi: '💡 सुराग 1: एलएलएम एजेंट चलाने वाला सिस्टम टाइपस्क्रिप्ट का उपयोग करता है।' },
      { en: '💡 Clue 2: AlphaNode runs the Neural Net model.', hi: '💡 सुराग 2: अल्फानेोड तंत्रिका नेटवर्क मॉडल चलाता है।' },
      { en: '💡 Clue 3: CyberGrid uses Rust Lang.', hi: '💡 सुराग 3: साइबरग्रिड रस्ट भाषा का उपयोग करता है।' }
    ],
    solution: {
      AlphaNode: { category1: 'Neural Net', category2: 'Python' },
      ByteCore: { category1: 'LLM', category2: 'TypeScript' },
      CyberGrid: { category1: 'Deep Agent', category2: 'Rust' }
    }
  },
  {
    names: ['Alex the Lion', 'Penny the Penguin', 'Milo the Monkey'],
    category1Label: { en: 'Habitats', hi: 'प्राकृतिक वास' },
    category2Label: { en: 'Feeding Time', hi: 'भोजन का समय' },
    category1Placeholder: { en: 'Select Habitat', hi: 'प्राकृतिक वास चुनें' },
    category2Placeholder: { en: 'Select Time', hi: 'समय चुनें' },
    category1Options: [
      { value: 'Savanna', label: { en: 'Savanna plains', hi: 'सवाना के मैदान' } },
      { value: 'Iceberg', label: { en: 'Iceberg coast', hi: 'हिमशैल तट' } },
      { value: 'Jungle', label: { en: 'Deep Jungle', hi: 'गहरा जंगल' } }
    ],
    category2Options: [
      { value: 'Morning', label: { en: 'Morning 8 AM', hi: 'सुबह 8 बजे' } },
      { value: 'Noon', label: { en: 'Noon 12 PM', hi: 'दोपहर 12 बजे' } },
      { value: 'Night', label: { en: 'Night 8 PM', hi: 'रात 8 बजे' } }
    ],
    clues: [
      { en: '💡 Clue 1: The animal on the Iceberg coast is fed at Noon 12 PM.', hi: '💡 सुराग 1: हिमशैल तट पर रहने वाले जानवर को दोपहर 12 बजे भोजन दिया जाता है।' },
      { en: '💡 Clue 2: Alex the Lion lives in the Savanna plains.', hi: '💡 सुराग 2: एलेक्स द लायन सवाना के मैदान में रहता है।' },
      { en: '💡 Clue 3: Milo the Monkey is fed at Night 8 PM.', hi: '💡 सुराग 3: मिलो द मंकी को रात 8 बजे भोजन दिया जाता है।' }
    ],
    solution: {
      'Alex the Lion': { category1: 'Savanna', category2: 'Morning' },
      'Penny the Penguin': { category1: 'Iceberg', category2: 'Noon' },
      'Milo the Monkey': { category1: 'Jungle', category2: 'Night' }
    }
  },
  {
    names: ['Columbus', 'Marco Polo', 'Magellan'],
    category1Label: { en: 'Voyage Route', hi: 'यात्रा मार्ग' },
    category2Label: { en: 'Discovered Resource', hi: 'खोजा गया संसाधन' },
    category1Placeholder: { en: 'Select Route', hi: 'मार्ग चुनें' },
    category2Placeholder: { en: 'Select Resource', hi: 'संसाधन चुनें' },
    category1Options: [
      { value: 'Santa Maria', label: { en: 'Santa Maria Ship', hi: 'सांता मारिया जहाज' } },
      { value: 'Silk Route', label: { en: 'Silk Route Land', hi: 'रेशम मार्ग भूमि' } },
      { value: 'Victoria', label: { en: 'Victoria Ship', hi: 'विक्टोरिया जहाज' } }
    ],
    category2Options: [
      { value: 'Spices', label: { en: 'Spices', hi: 'मसाले' } },
      { value: 'Silk', label: { en: 'Silk', hi: 'रेशम' } },
      { value: 'Gold', label: { en: 'Gold treasures', hi: 'सोने के खजाने' } }
    ],
    clues: [
      { en: '💡 Clue 1: The explorer traveling the Silk Route Land discovered Silk.', hi: '💡 सुराग 1: रेशम मार्ग भूमि की यात्रा करने वाले खोजकर्ता ने रेशम की खोज की।' },
      { en: '💡 Clue 2: Columbus sailed the Santa Maria Ship.', hi: '💡 सुराग 2: कोलंबस ने सांता मारिया जहाज से यात्रा की।' },
      { en: '💡 Clue 3: Magellan discovered Gold treasures.', hi: '💡 सुराग 3: मैगलन ने सोने के खजाने की खोज की।' }
    ],
    solution: {
      Columbus: { category1: 'Santa Maria', category2: 'Spices' },
      'Marco Polo': { category1: 'Silk Route', category2: 'Silk' },
      Magellan: { category1: 'Victoria', category2: 'Gold' }
    }
  },
  {
    names: ['Michael', 'Serena', 'Usain'],
    category1Label: { en: 'Sport Discipline', hi: 'खेल विधा' },
    category2Label: { en: 'Gold Medals', hi: 'स्वर्ण पदक' },
    category1Placeholder: { en: 'Select Sport', hi: 'खेल चुनें' },
    category2Placeholder: { en: 'Select Medal Count', hi: 'पदक संख्या चुनें' },
    category1Options: [
      { value: 'Basketball', label: { en: 'Basketball', hi: 'बास्केटबॉल' } },
      { value: 'Tennis', label: { en: 'Tennis', hi: 'टेनिस' } },
      { value: 'Sprinting', label: { en: 'Sprinting track', hi: 'दौड़ ट्रैक' } }
    ],
    category2Options: [
      { value: '6 Gold', label: { en: '6 Olympic Gold', hi: '6 ओलंपिक स्वर्ण' } },
      { value: '23 Gold', label: { en: '23 Grand Slam Gold', hi: '23 ग्रैंड स्लैम स्वर्ण' } },
      { value: '8 Gold', label: { en: '8 Olympic Gold', hi: '8 ओलंपिक स्वर्ण' } }
    ],
    clues: [
      { en: '💡 Clue 1: The athlete playing Tennis has won 23 Grand Slam Gold medals.', hi: '💡 सुराग 1: टेनिस खेलने वाले एथलीट ने 23 ग्रैंड स्लैम स्वर्ण पदक जीते हैं।' },
      { en: '💡 Clue 2: Michael plays Basketball.', hi: '💡 सुराग 2: माइकल बास्केटबॉल खेलते हैं।' },
      { en: '💡 Clue 3: Usain has won 8 Olympic Gold medals.', hi: '💡 सुराग 3: उसेन ने 8 ओलंपिक स्वर्ण पदक जीते हैं।' }
    ],
    solution: {
      Michael: { category1: 'Basketball', category2: '6 Gold' },
      Serena: { category1: 'Tennis', category2: '23 Gold' },
      Usain: { category1: 'Sprinting', category2: '8 Gold' }
    }
  }
];

// Simple seed to index hashing helper
const getQuestionIndex = (seedStr: string | undefined) => {
  if (!seedStr) {
    return Math.floor(Math.random() * QUESTIONS.length);
  }
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % QUESTIONS.length;
};

interface LogicPuzzleProps {
  isMuted?: boolean;
  onGameWin: (puzzleType: PuzzleType, timeInSec: number, score: number) => void;
  onClose?: (isQuit?: boolean) => void;
  onProgress?: (progress: number) => void;
  room?: any;
  headerActions?: React.ReactNode;
  isOnline?: boolean;
  onPlaySound?: (type: 'click' | 'success' | 'fail' | 'logic' | 'victory' | 'defeat') => void;
  seed?: string;
}

export const LogicPuzzle: React.FC<LogicPuzzleProps> = ({ 
  onGameWin, onClose, onProgress, room: _room, headerActions, isOnline, onPlaySound, seed 
}) => {
  const { language } = useGame();
  const t = (key: string) => translate(key, language);

  const questionIndex = getQuestionIndex(seed);
  const q = QUESTIONS[questionIndex];

  const getTranslation = (obj: { en: string; hi: string }) => {
    return language === 'hi' ? obj.hi : obj.en;
  };

  const [selections, setSelections] = useState<{
    [name: string]: { category1: string; category2: string };
  }>(() => {
    const initial: any = {};
    q.names.forEach(name => {
      initial[name] = { category1: '', category2: '' };
    });
    return initial;
  });

  const [errors, setErrors] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(0);

  useEffect(() => {
    const initial: any = {};
    q.names.forEach(name => {
      initial[name] = { category1: '', category2: '' };
    });
    setSelections(initial);
    setErrors(null);
  }, [seed, questionIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSelect = (name: string, type: 'category1' | 'category2', val: string) => {
    onPlaySound?.('logic');
    setSelections(prev => {
      const next = {
        ...prev,
        [name]: {
          ...prev[name],
          [type]: val,
        },
      };

      // Calculate progress percentage (6 correct properties maximum)
      let correctMatches = 0;
      Object.keys(q.solution).forEach(n => {
        const sol = (q.solution as any)[n];
        const sel = next[n];
        if (sel && sel.category1 === sol.category1) correctMatches++;
        if (sel && sel.category2 === sol.category2) correctMatches++;
      });
      const progressPercent = Math.floor((correctMatches / 6) * 100);
      if (onProgress) onProgress(progressPercent);

      return next;
    });
  };

  const handleVerify = () => {
    let hasEmpty = false;
    let isCorrect = true;

    q.names.forEach(name => {
      const current = selections[name];
      const sol = q.solution[name];

      if (!current || !current.category1 || !current.category2) {
        hasEmpty = true;
      }
      if (!current || current.category1 !== sol.category1 || current.category2 !== sol.category2) {
        isCorrect = false;
      }
    });

    if (hasEmpty) {
      setErrors(t('fill_dropdown_fields_error'));
      onPlaySound?.('fail');
      return;
    }

    if (isCorrect) {
      setErrors(null);
      const score = Math.max(50, 300 - Math.floor(timer / 1.5));
      onGameWin(PuzzleType.LOGIC, timer, score);
      onPlaySound?.('success');
    } else {
      setErrors(t('mismatch_error'));
      onPlaySound?.('fail');
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center' }}>
            {t('logic_name')}
            {headerActions}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('logic_desc')}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('time_elapsed').toUpperCase()}</p>
          <h4 style={{ fontSize: '18px', color: 'var(--color-secondary)', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
            {formatTime(timer)}
          </h4>
        </div>
      </div>

      {/* Clues Panel */}
      <div style={{ 
        background: 'rgba(139,92,246,0.06)', 
        border: '1px solid rgba(139,92,246,0.2)', 
        padding: '16px', 
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <h4 style={{ fontSize: '13px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
          <Info size={14} /> {t('hints_logical_clues')}
        </h4>
        <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: '1.4' }}>
          {q.clues.map((clueObj, idx) => (
            <li key={idx}>{getTranslation(clueObj)}</li>
          ))}
        </ul>
      </div>

      {/* Dropdown selectors */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {q.names.map(name => (
          <div 
            key={name}
            style={{ 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid var(--border-glass)', 
              padding: '16px 20px', 
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <h4 style={{ color: 'var(--color-secondary)', fontFamily: 'var(--font-display)', fontSize: '16px' }}>{name}</h4>
            
            <div className="grid-2" style={{ gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  {getTranslation(q.category1Label)}
                </label>
                <select 
                  className="btn btn-glass"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-glass)' }}
                  value={selections[name]?.category1 || ''}
                  onChange={(e) => handleSelect(name, 'category1', e.target.value)}
                  onTouchStart={() => playInstantLogicSound()}
                >
                  <option value="">{getTranslation(q.category1Placeholder)}</option>
                  {q.category1Options.map(opt => (
                    <option key={opt.value} value={opt.value}>{getTranslation(opt.label)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  {getTranslation(q.category2Label)}
                </label>
                <select 
                  className="btn btn-glass"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-glass)' }}
                  value={selections[name]?.category2 || ''}
                  onChange={(e) => handleSelect(name, 'category2', e.target.value)}
                  onTouchStart={() => playInstantLogicSound()}
                >
                  <option value="">{getTranslation(q.category2Placeholder)}</option>
                  {q.category2Options.map(opt => (
                    <option key={opt.value} value={opt.value}>{getTranslation(opt.label)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {errors && (
        <div style={{ color: 'var(--color-danger)', fontSize: '13px', textAlign: 'center', background: 'rgba(239,68,68,0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
          {errors}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button className="btn btn-primary" style={{ flex: 1, padding: '12px' }} onClick={handleVerify} onTouchStart={() => playInstantLogicSound()}>
          {t('submit_deduction')}
        </button>
        {onClose && !isOnline && (
          <button className="btn btn-glass" style={{ flex: 1, padding: '12px' }} onClick={() => onClose(true)} onTouchStart={() => playInstantLogicSound()}>
            {t('close_board')}
          </button>
        )}
      </div>
    </div>
  );
};

export default LogicPuzzle;
