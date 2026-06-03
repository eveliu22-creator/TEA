import { Drink } from './types';

export const INITIAL_DRINKS: Drink[] = [
  // 蜜果四季青 Group
  {
    id: 'sijichun-pineapple',
    name: '同燈慢熬鳳梨四季青茶',
    category: '蜜果四季青',
    description: '招牌！溫火慢熬出早茶味',
    price: 55,
    isAvailable: true,
    tags: ['招牌', '推薦'],
    hasSizeM: true,
    hasSizeL: true
  },
  {
    id: 'sijichun-plum',
    name: '露梅四季青',
    category: '蜜果四季青',
    description: '青梅蜜漬慢熬加入三顆梅',
    price: 60,
    isAvailable: true,
    tags: ['清爽'],
    hasSizeM: true,
    hasSizeL: true
  },
  {
    id: 'sijichun-sugarcane',
    name: '鮮甘蔗四季青',
    category: '蜜果四季青',
    description: '甘蔗鮮榨汁與青茶1:1比例',
    price: 65,
    isAvailable: true,
    tags: ['人氣'],
    hasSizeM: true,
    hasSizeL: true
  },
  {
    id: 'sijichun-tangerine',
    name: '蜜柑四季青',
    category: '蜜果四季青',
    description: '茂谷柑果汁與濃縮還原果汁',
    price: 70,
    isAvailable: true,
    tags: [],
    hasSizeM: true,
    hasSizeL: true
  },
  {
    id: 'sijichun-orange-passion',
    name: '百香鮮橙四季青',
    category: '蜜果四季青',
    description: '埔里百香果與新鮮橙組合',
    price: 70,
    isAvailable: true,
    tags: ['酸甜'],
    hasSizeM: true,
    hasSizeL: true
  },
  {
    id: 'sijichun-lemon-winter',
    name: '有機檸冬四季青',
    category: '蜜果四季青',
    description: '古法熬煮有機冬瓜',
    price: 70,
    isAvailable: true,
    tags: [],
    hasSizeM: true,
    hasSizeL: true
  },

  // 港港好無咖啡因 Group
  {
    id: 'no-caffeine-pineapple-tea',
    name: '阿嬤慢熬鳳梨冰茶',
    category: '港港好無咖啡因',
    description: '招牌！溫火慢熬出古早味鳳梨冰茶',
    price: 50,
    isAvailable: true,
    tags: ['招牌', '無咖啡因'],
    hasSizeM: true,
    hasSizeL: true
  },
  {
    id: 'no-caffeine-pineapple-milk',
    name: '阿嬤慢熬鳳梨醇奶',
    category: '港港好無咖啡因',
    description: '鮮奶搭配慢熬鳳梨蜜，醇香不膩口',
    price: 70,
    isAvailable: true,
    tags: ['醇奶'],
    hasSizeM: true,
    hasSizeL: true
  },
  {
    id: 'no-caffeine-brown-sugar-bubble',
    name: '黑糖珍珠醇奶',
    category: '港港好無咖啡因',
    description: '溫熱手作黑糖珍珠搭配香醇鮮奶，甜度黃金比例',
    price: 70,
    priceLarge: 80,
    isAvailable: true,
    tags: ['經典', '人氣'],
    hasSizeM: true,
    hasSizeL: true
  },
  {
    id: 'no-caffeine-lemon-juice',
    name: '有機小農檸檬汁',
    category: '港港好無咖啡因',
    description: '有機檸檬原汁鮮榨，酸爽解渴',
    price: 65,
    isAvailable: true,
    tags: ['酸爽'],
    hasSizeM: true,
    hasSizeL: true
  },
  {
    id: 'no-caffeine-pineapple-jelly',
    name: '有機檸綠鳳梨凍',
    category: '港港好無咖啡因',
    description: '有機檸檬搭配特色自製手作鳳梨茶凍',
    price: 70,
    isAvailable: true,
    tags: ['口感'],
    hasSizeM: true,
    hasSizeL: true
  },
  {
    id: 'no-caffeine-rooibos-latte',
    name: '南非國寶茶那堤',
    category: '港港好無咖啡因',
    description: '南非紅寶石茶配香醇鮮奶，純天然無咖啡因',
    price: 70,
    isAvailable: true,
    tags: ['推薦'],
    hasSizeM: true,
    hasSizeL: true
  },
  {
    id: 'no-caffeine-rooibos-lemon',
    name: '南非國寶茶有機檸',
    category: '港港好無咖啡因',
    description: '南非國寶茶搭配新鮮有機檸檬汁，清爽解渴',
    price: 70,
    isAvailable: true,
    tags: [],
    hasSizeM: true,
    hasSizeL: true
  }
];

export const CATEGORIES_LIST = [
  '蜜果四季青',
  '港港好無咖啡因'
];
