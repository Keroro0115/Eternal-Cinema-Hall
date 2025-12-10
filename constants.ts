
import { MovieArt } from './types';

export const TOTAL_MOVIES = 16;
export const RADIUS = 8; // Radius of the gallery circle

// Fallback data ensures the app works immediately even without API key or during loading
export const FALLBACK_MOVIES: MovieArt[] = [
  {
    id: 1,
    title_zh: "花样年华",
    title_en: "In the Mood for Love",
    year: 2000,
    director_zh: "王家卫",
    director_en: "Wong Kar-wai",
    core_emotion: { zh: "隐忍", en: "Restraint" },
    visual_metaphor: { zh: "缭绕在幽暗路灯下的香烟烟雾", en: "Cigarette smoke curling under a dim streetlamp" },
    key_element: { zh: "旗袍", en: "Qipao" },
    haiku: {
      zh: "花期终将尽\n秘密藏于树洞中\n背影不仅是离别",
      en: "Blossoms fade away\nSecrets hidden in the tree\nParting is silent"
    },
    color_palette: ["#A63737", "#2C3E50", "#D4AC0D"],
    art_note: {
      zh: "色彩浓郁而压抑，仿佛时间在琥珀中凝固，捕捉了那段无法言说的爱情。",
      en: "Rich and oppressive colors, as if time is frozen in amber, capturing that unspeakable love."
    }
  },
  {
    id: 2,
    title_zh: "2001太空漫游",
    title_en: "2001: A Space Odyssey",
    year: 1968,
    director_zh: "斯坦利·库布里克",
    director_en: "Stanley Kubrick",
    core_emotion: { zh: "敬畏", en: "Awe" },
    visual_metaphor: { zh: "漂浮在无尽虚空中的黑色巨石", en: "A black monolith floating in infinite void" },
    key_element: { zh: "黑石", en: "Monolith" },
    haiku: {
      zh: "星海寂无声\n巨石指引向未来\n人神终相遇",
      en: "Silent sea of stars\nMonolith guides to future\nMan and god shall meet"
    },
    color_palette: ["#000000", "#FFFFFF", "#FF0000"],
    art_note: {
      zh: "极简的几何形态与强烈的对比，象征着人类理性的边界与宇宙的未知。",
      en: "Minimalist geometry and strong contrast symbolize the boundary of human reason and the unknown universe."
    }
  },
  {
    id: 3,
    title_zh: "千与千寻",
    title_en: "Spirited Away",
    year: 2001,
    director_zh: "宫崎骏",
    director_en: "Hayao Miyazaki",
    core_emotion: { zh: "成长", en: "Growth" },
    visual_metaphor: { zh: "行驶在茫茫大海上的水上列车", en: "A train traveling on the surface of an endless ocean" },
    key_element: { zh: "面具", en: "Mask" },
    haiku: {
      zh: "名字由于忘\n海上列车去何方\n记得即归途",
      en: "Names lost in the mist\nWhere does the ocean train go\nMemory is home"
    },
    color_palette: ["#4682B4", "#FF6347", "#FFFFFF"],
    art_note: {
      zh: "水与倒影的意象贯穿始终，象征着潜意识的净化与自我身份的找回。",
      en: "The imagery of water and reflection pervades, symbolizing the purification of the subconscious and the retrieval of self-identity."
    }
  },
  {
    id: 4,
    title_zh: "银翼杀手2049",
    title_en: "Blade Runner 2049",
    year: 2017,
    director_zh: "丹尼斯·维伦纽瓦",
    director_en: "Denis Villeneuve",
    core_emotion: { zh: "孤独", en: "Loneliness" },
    visual_metaphor: { zh: "橙色沙尘暴中屹立的巨大全息投影", en: "A giant hologram standing amidst an orange dust storm" },
    key_element: { zh: "木马", en: "Horse" },
    haiku: {
      zh: "如雨中之泪\n虚幻记忆亦真实\n寻找生之义",
      en: "Like tears in the rain\nFalse memories are real too\nSeeking life's meaning"
    },
    color_palette: ["#FF8C00", "#008080", "#111111"],
    art_note: {
      zh: "浓重的橙色与冷冽的青色对比，构建了一个既荒凉又充满赛博朋克美感的未来废土。",
      en: "The contrast between heavy orange and cold teal constructs a future wasteland that is both desolate and full of cyberpunk aesthetics."
    }
  },
  {
    id: 5,
    title_zh: "布达佩斯大饭店",
    title_en: "The Grand Budapest Hotel",
    year: 2014,
    director_zh: "韦斯·安德森",
    director_en: "Wes Anderson",
    core_emotion: { zh: "怀旧", en: "Nostalgia" },
    visual_metaphor: { zh: "雪山之巅粉色的玩具屋般的建筑", en: "A pink dollhouse-like structure atop a snowy mountain" },
    key_element: { zh: "蛋糕", en: "Cake" },
    haiku: {
      zh: "昨日之世界\n粉色废墟梦一场\n文明的余晖",
      en: "World of yesterday\nA pink ruin, just a dream\nCivilization's glow"
    },
    color_palette: ["#FFC0CB", "#800080", "#8B4513"],
    art_note: {
      zh: "通过极致对称的构图与糖果般的色彩，讲述了一个关于逝去时代的成人童话。",
      en: "Through perfectly symmetrical composition and candy-like colors, it tells an adult fairy tale about a bygone era."
    }
  },
  {
    id: 6,
    title_zh: "英雄",
    title_en: "Hero",
    year: 2002,
    director_zh: "张艺谋",
    director_en: "Zhang Yimou",
    core_emotion: { zh: "天下", en: "Under Heaven" },
    visual_metaphor: { zh: "漫天黄叶中两位剑客的对决", en: "Two swordsmen dueling amidst falling yellow leaves" },
    key_element: { zh: "残剑", en: "Sword" },
    haiku: {
      zh: "十步杀一人\n心中无剑天地宽\n红蓝皆是空",
      en: "Ten steps, one life end\nNo sword in heart, world is wide\nRed and blue are void"
    },
    color_palette: ["#FF0000", "#0000FF", "#FFFFFF"],
    art_note: {
      zh: "色彩不仅是视觉元素，更是叙事工具，分别代表了谎言、想象与真实。",
      en: "Color is not just visual, but a narrative tool, representing lies, imagination, and truth respectively."
    }
  },
   {
    id: 7,
    title_zh: "星际穿越",
    title_en: "Interstellar",
    year: 2014,
    director_zh: "克里斯托弗·诺兰",
    director_en: "Christopher Nolan",
    core_emotion: { zh: "爱与时间", en: "Love & Time" },
    visual_metaphor: { zh: "巨大的书架连接着过去与未来", en: "A massive bookshelf connecting past and future" },
    key_element: { zh: "手表", en: "Watch" },
    haiku: {
      zh: "时间如浪潮\n爱是唯一可穿越\n幽灵在低语",
      en: "Time comes like a wave\nLove alone can cross the void\nGhost whispers softly"
    },
    color_palette: ["#0B3D91", "#000000", "#D2B48C"],
    art_note: {
      zh: "五维空间的视觉化尝试，将抽象的时间实体化，表达了爱超越维度的力量。",
      en: "An attempt to visualize five-dimensional space, solidifying abstract time to express the power of love transcending dimensions."
    }
  },
  {
    id: 8,
    title_zh: "黑客帝国",
    title_en: "The Matrix",
    year: 1999,
    director_zh: "沃卓斯基姐妹",
    director_en: "The Wachowskis",
    core_emotion: { zh: "觉醒", en: "Awakening" },
    visual_metaphor: { zh: "如雨般落下的绿色数字代码", en: "Green digital code falling like rain" },
    key_element: { zh: "红药丸", en: "Red Pill" },
    haiku: {
      zh: "世界是虚幻\n吞下红色药丸后\n直面真荒原",
      en: "World is illusion\nSwallow the red pill and see\nTruth's desert revealed"
    },
    color_palette: ["#00FF00", "#000000", "#333333"],
    art_note: {
      zh: "绿色的数字雨与黑色的皮革，定义了赛博朋克的视觉标准，象征着虚幻与现实的边界。",
      en: "Green digital rain and black leather defined the visual standard of cyberpunk, symbolizing the boundary between illusion and reality."
    }
  },
  {
    id: 9,
    title_zh: "爱乐之城",
    title_en: "La La Land",
    year: 2016,
    director_zh: "达米恩·查泽雷",
    director_en: "Damien Chazelle",
    core_emotion: { zh: "遗憾", en: "Regret" },
    visual_metaphor: { zh: "紫色夜空下两盏孤独的路灯", en: "Two lonely streetlights under a purple night sky" },
    key_element: { zh: "钢琴", en: "Piano" },
    haiku: {
      zh: "繁星城之中\n梦想是否只为你\n一曲终离散",
      en: "City of the stars\nAre you shining just for me\nSong ends, we part ways"
    },
    color_palette: ["#6A0DAD", "#FFD700", "#000080"],
    art_note: {
      zh: "高饱和度的原色与梦幻的紫色调，致敬了好莱坞黄金时代的歌舞片，同时烘托了梦想与现实的落差。",
      en: "High-saturation primary colors and dreamy purple tones pay homage to Hollywood's Golden Age musicals while highlighting the gap between dream and reality."
    }
  },
  {
    id: 10,
    title_zh: "寄生虫",
    title_en: "Parasite",
    year: 2019,
    director_zh: "奉俊昊",
    director_en: "Bong Joon-ho",
    core_emotion: { zh: "阶级", en: "Class" },
    visual_metaphor: { zh: "暴雨中无尽向下的阶梯", en: "Endless stairs going down in a heavy rainstorm" },
    key_element: { zh: "山水石", en: "Scholar Stone" },
    haiku: {
      zh: "气味越界线\n依附宿主求生存\n雨夜洗不净",
      en: "Scent crosses the line\nClinging to host to survive\nRain won't wash it clean"
    },
    color_palette: ["#4A4A4A", "#8B4513", "#2F4F4F"],
    art_note: {
      zh: "垂直空间的运用（半地下室与豪宅）视觉化了阶级差异，那块石头则是虚幻希望的象征。",
      en: "The use of vertical space (semi-basement vs. mansion) visualizes class disparity, while the stone symbolizes illusory hope."
    }
  },
  {
    id: 11,
    title_zh: "瞬息全宇宙",
    title_en: "Everything Everywhere All At Once",
    year: 2022,
    director_zh: "关家永 & 丹尼尔·沙伊纳特",
    director_en: "Daniels",
    core_emotion: { zh: "虚无与爱", en: "Nihilism & Love" },
    visual_metaphor: { zh: "一切都坍缩进黑色的贝果", en: "Everything collapsing into a black bagel" },
    key_element: { zh: "贝果", en: "Bagel" },
    haiku: {
      zh: "万事皆虚无\n在多重宇宙尽头\n哪怕做石头",
      en: "Nothing matters now\nAt the end of multiverse\nJust be a rock there"
    },
    color_palette: ["#000000", "#FFFFFF", "#FF69B4"],
    art_note: {
      zh: "极繁主义的视觉轰炸与虚无主义的内核形成对比，最终回归到最简单的一块石头。",
      en: "Maximalist visual bombardment contrasts with a nihilistic core, ultimately returning to the simplicity of a rock."
    }
  },
  {
    id: 12,
    title_zh: "霸王别姬",
    title_en: "Farewell My Concubine",
    year: 1993,
    director_zh: "陈凯歌",
    director_en: "Chen Kaige",
    core_emotion: { zh: "痴迷", en: "Obsession" },
    visual_metaphor: { zh: "后台破碎的镜子映出京剧脸谱", en: "A broken mirror backstage reflecting a Peking Opera mask" },
    key_element: { zh: "宝剑", en: "Sword" },
    haiku: {
      zh: "真虞姬假霸王\n不疯魔便不成活\n戏里戏外生",
      en: "True Yu, False King here\nNo life without madness deep\nStage and life depend"
    },
    color_palette: ["#A52A2A", "#FFD700", "#000000"],
    art_note: {
      zh: "红与金的传统配色在历史的灰烬中显得格外刺眼，象征着艺术的永恒与个人的毁灭。",
      en: "Traditional red and gold colors stand out piercingly amidst the ashes of history, symbolizing the eternity of art and personal destruction."
    }
  },
  {
    id: 13,
    title_zh: "阿基拉",
    title_en: "Akira",
    year: 1988,
    director_zh: "大友克洋",
    director_en: "Katsuhiro Otomo",
    core_emotion: { zh: "毁灭与重生", en: "Destruction" },
    visual_metaphor: { zh: "新东京爆炸产生的巨大白色光球", en: "A massive white sphere of light from the Neo-Tokyo explosion" },
    key_element: { zh: "摩托", en: "Bike" },
    haiku: {
      zh: "红色尾灯流\n钢铁都市在崩塌\n力量即诅咒",
      en: "Red tail lights streaming\nSteel city is collapsing\nPower is a curse"
    },
    color_palette: ["#FF0000", "#050505", "#00FFFF"],
    art_note: {
      zh: "其标志性的红色摩托车与高楼林立的赛博都市，定义了日本动画的赛博朋克美学。",
      en: "Its iconic red motorcycle and skyscraper-filled cyber city defined the cyberpunk aesthetic of Japanese animation."
    }
  },
  {
    id: 14,
    title_zh: "盗梦空间",
    title_en: "Inception",
    year: 2010,
    director_zh: "克里斯托弗·诺兰",
    director_en: "Christopher Nolan",
    core_emotion: { zh: "困惑", en: "Confusion" },
    visual_metaphor: { zh: "城市街道像纸一样折叠起来", en: "City streets folding up like paper" },
    key_element: { zh: "陀螺", en: "Totem" },
    haiku: {
      zh: "梦中还有梦\n陀螺旋转未曾停\n醒来或是真",
      en: "Dream within a dream\nThe spinning top never stops\nIs waking up real"
    },
    color_palette: ["#708090", "#A9A9A9", "#DAA520"],
    art_note: {
      zh: "通过对物理规则的打破（如折叠的城市），视觉化了潜意识的无限可能性。",
      en: "By breaking physical rules (like folding cities), it visualizes the infinite possibilities of the subconscious."
    }
  },
  {
    id: 15,
    title_zh: "楚门的世界",
    title_en: "The Truman Show",
    year: 1998,
    director_zh: "彼得·威尔",
    director_en: "Peter Weir",
    core_emotion: { zh: "自由", en: "Freedom" },
    visual_metaphor: { zh: "船头撞破了画着蓝天的墙壁", en: "A boat bow crashing through a wall painted with blue sky" },
    key_element: { zh: "出口", en: "Exit Door" },
    haiku: {
      zh: "早安与晚安\n虚假天空终破裂\n鞠躬向自由",
      en: "Good morning, good night\nFalse blue sky finally cracks\nBow to liberty"
    },
    color_palette: ["#87CEEB", "#FFFFFF", "#000000"],
    art_note: {
      zh: "完美的人造蓝天与尽头的黑色出口形成强烈对比，象征着虚幻的安逸与未知的自由之间的选择。",
      en: "The contrast between the perfect artificial blue sky and the black exit door symbolizes the choice between illusory comfort and unknown freedom."
    }
  },
  {
    id: 16,
    title_zh: "死侍与金刚狼",
    title_en: "Deadpool & Wolverine",
    year: 2024,
    director_zh: "肖恩·利维",
    director_en: "Shawn Levy",
    core_emotion: { zh: "混乱中的救赎", en: "Redemption in Chaos" },
    visual_metaphor: { zh: "破碎的红色玻璃拼凑成的心脏", en: "A heart pieced together from shattered red glass" },
    key_element: { zh: "钢爪", en: "Claws" },
    haiku: {
      zh: "红黑交织影\n不死的荒诞独舞\n破碎中重生",
      en: "Red and black intertwine\nAbsurd solo dance of undying\nRebirth in the shards"
    },
    color_palette: ["#880000", "#F1C40F", "#1A1A1A"],
    art_note: {
      zh: "这件作品通过冲突的色彩与破碎的几何体，表现了反英雄内心的混乱与渴望连接的矛盾。",
      en: "This piece uses conflicting colors and fractured geometry to represent the anti-hero's internal chaos and contradictory longing for connection."
    }
  }
];
