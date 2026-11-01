// Current time, dates and time zones for Iris, from the server's own clock.
//
// Why this exists: the model has no clock. Before this, nothing in her prompt said what time it was, so when a visitor
// asked "现在是北京时间几点?" she made a time up (it looked like UTC labelled as Beijing time). Now:
//   - the current instant is read from the system clock for every message (clock.now(), never cached at startup);
//   - everything is UTC internally and converted with IANA zones through Intl.DateTimeFormat, so daylight saving,
//     dates changing at midnight, half-hour and 45-minute offsets (Kolkata, Kathmandu, Chatham) and the date line all
//     come from the time-zone database, not from arithmetic in this file or in the model;
//   - a plain time question ("what time is it in Tokyo?") is answered here, word for word, with a short in-character
//     line; she does not calculate anything;
//   - a longer message that also asks the time goes to the model with the verified values, and her reply is checked:
//     a clock time or date that disagrees with the verified one replaces the reply with the verified answer;
//   - the visitor's own time zone is never guessed (not from their language either): she asks where they are.
// Pure functions apart from clock.now(), so every rule is tested with fixed instants (tests/time-service.test.ts).

export type Lang = "en" | "zh-Hans" | "zh-Hant" | "ja" | "es" | "ru";
const LANG_INDEX: Record<Lang, number> = { en: 0, "zh-Hans": 1, "zh-Hant": 2, ja: 3, es: 4, ru: 5 };
const LOCALE: Record<Lang, string> = { en: "en-GB", "zh-Hans": "zh-CN", "zh-Hant": "zh-TW", ja: "ja-JP", es: "es-ES", ru: "ru-RU" };
// The language name the rest of the service uses (language.ts), for what is stored with the message
export const LANGUAGE_NAME: Record<Lang, string> = { en: "english", "zh-Hans": "chinese", "zh-Hant": "chinese", ja: "japanese", es: "spanish", ru: "russian" };

// The one source of "now". Tests replace clock.now; production always reads the system clock, per call.
export const clock = { now: (): number => Date.now() };

// ---------------------------------------------------------------- places

export interface Place {
  id: string;
  zone: string;      // IANA zone id
  country?: string;  // ISO code, so "USA, California" is not asked about twice
  city: boolean;     // a city is more specific than its region or country
  labels: string[];  // en | zh-Hans | zh-Hant | ja | es | ru
}
interface Ambiguity { id: string; country?: string; labels: string[]; options: string[] }

const places = new Map<string, Place>();
const names: Array<{ name: string; target: { place: Place } | { ambiguity: Ambiguity } }> = [];

// labels: "English|简体|繁體|日本語|Español|Русский"; every label is also a name. Extra names starting with "~" are
// stems that may take up to three more letters (Russian case endings: Москва, в Москве).
function P(id: string, zone: string, country: string | undefined, city: boolean, labels: string, extra: string[] = []): void {
  const place: Place = { id, zone, country, city, labels: labels.split("|") };
  places.set(id, place);
  for (const name of new Set([...place.labels, ...extra])) names.push({ name, target: { place } });
}
function A(id: string, country: string | undefined, labels: string, options: string[], extra: string[] = []): void {
  const ambiguity: Ambiguity = { id, country, labels: labels.split("|"), options };
  for (const name of new Set([...ambiguity.labels, ...extra])) names.push({ name, target: { ambiguity } });
}

// China, Japan, the UK, India and Nepal each use one zone; countries with several are listed as ambiguous below.
P("beijing", "Asia/Shanghai", "CN", true, "Beijing|北京|北京|北京|Pekín|Пекин", ["peking", "~пекин"]);
P("shanghai", "Asia/Shanghai", "CN", true, "Shanghai|上海|上海|上海|Shanghái|Шанхай", ["~шанха"]);
P("chongqing", "Asia/Shanghai", "CN", true, "Chongqing|重庆|重慶|重慶|Chongqing|Чунцин");
P("guangzhou", "Asia/Shanghai", "CN", true, "Guangzhou|广州|廣州|広州|Cantón|Гуанчжоу");
P("shenzhen", "Asia/Shanghai", "CN", true, "Shenzhen|深圳|深圳|深セン|Shenzhen|Шэньчжэнь");
P("china", "Asia/Shanghai", "CN", false, "China|中国|中國|中国|China|Китай", ["中国大陆", "中國大陸", "中华人民共和国", "~кита"]);
P("hongkong", "Asia/Hong_Kong", "HK", true, "Hong Kong|香港|香港|香港|Hong Kong|Гонконг", ["~гонконг"]);
P("taipei", "Asia/Taipei", "TW", true, "Taipei|台北|臺北|台北|Taipéi|Тайбэй", ["台北", "臺北"]);
P("taiwan", "Asia/Taipei", "TW", false, "Taiwan|台湾|臺灣|台湾|Taiwán|Тайвань", ["台灣", "~тайван"]);
P("tokyo", "Asia/Tokyo", "JP", true, "Tokyo|东京|東京|東京|Tokio|Токио", ["とうきょう"]);
P("osaka", "Asia/Tokyo", "JP", true, "Osaka|大阪|大阪|大阪|Osaka|Осака");
P("japan", "Asia/Tokyo", "JP", false, "Japan|日本|日本|日本|Japón|Япония", ["nippon", "~япони"]);
P("seoul", "Asia/Seoul", "KR", true, "Seoul|首尔|首爾|ソウル|Seúl|Сеул", ["서울", "~сеул"]);
P("korea", "Asia/Seoul", "KR", false, "South Korea|韩国|韓國|韓国|Corea del Sur|Южная Корея", ["korea", "corea", "한국"]);
P("singapore", "Asia/Singapore", "SG", true, "Singapore|新加坡|新加坡|シンガポール|Singapur|Сингапур", ["~сингапур"]);
P("bangkok", "Asia/Bangkok", "TH", true, "Bangkok|曼谷|曼谷|バンコク|Bangkok|Бангкок");
P("manila", "Asia/Manila", "PH", true, "Manila|马尼拉|馬尼拉|マニラ|Manila|Манила");
P("philippines", "Asia/Manila", "PH", false, "Philippines|菲律宾|菲律賓|フィリピン|Filipinas|Филиппины");
P("jakarta", "Asia/Jakarta", "ID", true, "Jakarta|雅加达|雅加達|ジャカルタ|Yakarta|Джакарта");
P("bali", "Asia/Makassar", "ID", true, "Bali|巴厘岛|峇里島|バリ島|Bali|Бали");
P("jayapura", "Asia/Jayapura", "ID", true, "Jayapura|查亚普拉|查亞普拉|ジャヤプラ|Jayapura|Джаяпура");
P("india", "Asia/Kolkata", "IN", false, "India|印度|印度|インド|India|Индия", ["~инди"]);
P("delhi", "Asia/Kolkata", "IN", true, "New Delhi|新德里|新德里|ニューデリー|Nueva Delhi|Нью-Дели", ["delhi"]);
P("mumbai", "Asia/Kolkata", "IN", true, "Mumbai|孟买|孟買|ムンバイ|Bombay|Мумбаи", ["bombay"]);
P("kolkata", "Asia/Kolkata", "IN", true, "Kolkata|加尔各答|加爾各答|コルカタ|Calcuta|Калькутта", ["calcutta"]);
P("kathmandu", "Asia/Kathmandu", "NP", true, "Kathmandu|加德满都|加德滿都|カトマンズ|Katmandú|Катманду");
P("nepal", "Asia/Kathmandu", "NP", false, "Nepal|尼泊尔|尼泊爾|ネパール|Nepal|Непал", ["~непал"]);
P("dubai", "Asia/Dubai", "AE", true, "Dubai|迪拜|杜拜|ドバイ|Dubái|Дубай");
P("tehran", "Asia/Tehran", "IR", true, "Tehran|德黑兰|德黑蘭|テヘラン|Teherán|Тегеран", ["~тегеран"]);
P("iran", "Asia/Tehran", "IR", false, "Iran|伊朗|伊朗|イラン|Irán|Иран", ["~иран"]);
P("tbilisi", "Asia/Tbilisi", "GE", true, "Tbilisi, Georgia|第比利斯（格鲁吉亚）|第比利斯（喬治亞）|トビリシ（ジョージア）|Tiflis, Georgia|Тбилиси (Грузия)", ["tbilisi", "第比利斯", "格鲁吉亚", "格魯吉亞", "~грузи"]);
P("istanbul", "Europe/Istanbul", "TR", true, "Istanbul|伊斯坦布尔|伊斯坦堡|イスタンブール|Estambul|Стамбул", ["~стамбул"]);
P("moscow", "Europe/Moscow", "RU", true, "Moscow|莫斯科|莫斯科|モスクワ|Moscú|Москва", ["~москв"]);
P("stpetersburg", "Europe/Moscow", "RU", true, "Saint Petersburg|圣彼得堡|聖彼得堡|サンクトペテルブルク|San Petersburgo|Санкт-Петербург", ["~петербург"]);
P("yekaterinburg", "Asia/Yekaterinburg", "RU", true, "Yekaterinburg|叶卡捷琳堡|葉卡捷琳堡|エカテリンブルク|Ekaterimburgo|Екатеринбург", ["~екатеринбург"]);
P("novosibirsk", "Asia/Novosibirsk", "RU", true, "Novosibirsk|新西伯利亚|新西伯利亞|ノヴォシビルスク|Novosibirsk|Новосибирск", ["~новосибирск"]);
P("vladivostok", "Asia/Vladivostok", "RU", true, "Vladivostok|符拉迪沃斯托克|海參崴|ウラジオストク|Vladivostok|Владивосток", ["海参崴", "~владивосток"]);
P("kyiv", "Europe/Kyiv", "UA", true, "Kyiv|基辅|基輔|キーウ|Kiev|Киев", ["kiev", "~киев"]);
P("london", "Europe/London", "GB", true, "London|伦敦|倫敦|ロンドン|Londres|Лондон", ["~лондон"]);
P("uk", "Europe/London", "GB", false, "the United Kingdom|英国|英國|イギリス|Reino Unido|Великобритания",
  ["united kingdom", "uk", "u.k.", "britain", "great britain", "england", "英格兰", "英格蘭", "inglaterra", "~великобритани"]);
P("dublin", "Europe/Dublin", "IE", true, "Dublin|都柏林|都柏林|ダブリン|Dublín|Дублин");
P("ireland", "Europe/Dublin", "IE", false, "Ireland|爱尔兰|愛爾蘭|アイルランド|Irlanda|Ирландия", ["~ирланди"]);
P("paris", "Europe/Paris", "FR", true, "Paris|巴黎|巴黎|パリ|París|Париж", ["~париж"]);
P("france", "Europe/Paris", "FR", false, "France|法国|法國|フランス|Francia|Франция", ["~франци"]);
P("berlin", "Europe/Berlin", "DE", true, "Berlin|柏林|柏林|ベルリン|Berlín|Берлин", ["~берлин"]);
P("germany", "Europe/Berlin", "DE", false, "Germany|德国|德國|ドイツ|Alemania|Германия", ["~германи"]);
P("madrid", "Europe/Madrid", "ES", true, "Madrid|马德里|馬德里|マドリード|Madrid|Мадрид", ["~мадрид"]);
P("spain", "Europe/Madrid", "ES", false, "Spain|西班牙|西班牙|スペイン|España|Испания", ["~испани"]);
P("rome", "Europe/Rome", "IT", true, "Rome|罗马|羅馬|ローマ|Roma|Рим", ["~рим"]);
P("italy", "Europe/Rome", "IT", false, "Italy|意大利|義大利|イタリア|Italia|Италия", ["~итали"]);
P("cairo", "Africa/Cairo", "EG", true, "Cairo|开罗|開羅|カイロ|El Cairo|Каир", ["~каир"]);
P("lagos", "Africa/Lagos", "NG", true, "Lagos|拉各斯|拉哥斯|ラゴス|Lagos|Лагос");
P("johannesburg", "Africa/Johannesburg", "ZA", true, "Johannesburg|约翰内斯堡|約翰尼斯堡|ヨハネスブルグ|Johannesburgo|Йоханнесбург");
P("nairobi", "Africa/Nairobi", "KE", true, "Nairobi|内罗毕|奈洛比|ナイロビ|Nairobi|Найроби");
P("sydney", "Australia/Sydney", "AU", true, "Sydney|悉尼|雪梨|シドニー|Sídney|Сидней", ["~сидне"]);
P("melbourne", "Australia/Melbourne", "AU", true, "Melbourne|墨尔本|墨爾本|メルボルン|Melbourne|Мельбурн");
P("brisbane", "Australia/Brisbane", "AU", true, "Brisbane|布里斯班|布里斯本|ブリスベン|Brisbane|Брисбен");
P("adelaide", "Australia/Adelaide", "AU", true, "Adelaide|阿德莱德|阿德雷德|アデレード|Adelaida|Аделаида");
P("perth", "Australia/Perth", "AU", true, "Perth|珀斯|伯斯|パース|Perth|Перт");
P("auckland", "Pacific/Auckland", "NZ", true, "Auckland|奥克兰（新西兰）|奧克蘭（紐西蘭）|オークランド|Auckland|Окленд");
P("newzealand", "Pacific/Auckland", "NZ", false, "New Zealand|新西兰|紐西蘭|ニュージーランド|Nueva Zelanda|Новая Зеландия", ["~новой зеланди"]);
P("chatham", "Pacific/Chatham", "NZ", true, "the Chatham Islands|查塔姆群岛|查塔姆群島|チャタム諸島|las islas Chatham|острова Чатем", ["chatham islands", "chatham"]);
P("kiritimati", "Pacific/Kiritimati", "KI", true, "Kiritimati (Kiribati)|基里蒂马蒂岛（基里巴斯）|聖誕島（吉里巴斯）|キリスィマスィ島|Kiritimati (Kiribati)|Киритимати (Кирибати)", ["kiritimati", "line islands"]);
P("apia", "Pacific/Apia", "WS", true, "Samoa|萨摩亚|薩摩亞|サモア|Samoa|Самоа", ["apia"]);
P("pagopago", "Pacific/Pago_Pago", "AS", true, "American Samoa|美属萨摩亚|美屬薩摩亞|アメリカ領サモア|Samoa Americana|Американское Самоа", ["pago pago"]);
P("honolulu", "Pacific/Honolulu", "US", true, "Honolulu, Hawaii|檀香山（夏威夷）|檀香山（夏威夷）|ホノルル（ハワイ）|Honolulu (Hawái)|Гонолулу (Гавайи)", ["honolulu", "hawaii", "檀香山", "夏威夷", "ハワイ", "ホノルル", "hawai", "~гава"]);
P("anchorage", "America/Anchorage", "US", true, "Anchorage, Alaska|安克雷奇（阿拉斯加）|安克拉治（阿拉斯加）|アンカレッジ（アラスカ）|Anchorage (Alaska)|Анкоридж (Аляска)", ["anchorage", "alaska", "阿拉斯加", "アラスカ", "~аляск"]);
P("losangeles", "America/Los_Angeles", "US", true, "Los Angeles|洛杉矶|洛杉磯|ロサンゼルス|Los Ángeles|Лос-Анджелес", ["l.a.", "~лос-анджелес"]);
P("sanfrancisco", "America/Los_Angeles", "US", true, "San Francisco|旧金山|舊金山|サンフランシスコ|San Francisco|Сан-Франциско", ["三藩市"]);
P("sacramento", "America/Los_Angeles", "US", true, "Sacramento|萨克拉门托|沙加緬度|サクラメント|Sacramento|Сакраменто", ["萨克拉曼多", "薩克拉門托"]);
P("california", "America/Los_Angeles", "US", false, "California|加州|加州|カリフォルニア|California|Калифорния", ["加利福尼亚", "加利福尼亞", "~калифорни"]);
P("sanjoseca", "America/Los_Angeles", "US", true, "San Jose, California|圣何塞（加州）|聖荷西（加州）|サンノゼ（カリフォルニア）|San José (California)|Сан-Хосе (Калифорния)", ["san jose california", "san jose, california", "san jose ca", "サンノゼ"]);
P("seattle", "America/Los_Angeles", "US", true, "Seattle|西雅图|西雅圖|シアトル|Seattle|Сиэтл", ["~сиэтл"]);
P("washingtonstate", "America/Los_Angeles", "US", false, "Washington State|华盛顿州|華盛頓州|ワシントン州|el estado de Washington|штат Вашингтон", ["washington state"]);
P("oregon", "America/Los_Angeles", "US", false, "Oregon|俄勒冈|俄勒岡|オレゴン|Oregón|Орегон");
P("portlandor", "America/Los_Angeles", "US", true, "Portland, Oregon|波特兰（俄勒冈）|波特蘭（俄勒岡）|ポートランド（オレゴン）|Portland (Oregón)|Портленд (Орегон)", ["portland oregon", "portland, oregon", "portland or"]);
P("lasvegas", "America/Los_Angeles", "US", true, "Las Vegas|拉斯维加斯|拉斯維加斯|ラスベガス|Las Vegas|Лас-Вегас");
P("denver", "America/Denver", "US", true, "Denver|丹佛|丹佛|デンバー|Denver|Денвер");
P("phoenix", "America/Phoenix", "US", true, "Phoenix, Arizona|凤凰城（亚利桑那）|鳳凰城（亞利桑那）|フェニックス（アリゾナ）|Phoenix (Arizona)|Финикс (Аризона)", ["phoenix", "arizona", "凤凰城", "鳳凰城", "亚利桑那", "亞利桑那", "アリゾナ", "~аризон"]);
P("chicago", "America/Chicago", "US", true, "Chicago|芝加哥|芝加哥|シカゴ|Chicago|Чикаго");
P("houston", "America/Chicago", "US", true, "Houston|休斯敦|休士頓|ヒューストン|Houston|Хьюстон");
P("dallas", "America/Chicago", "US", true, "Dallas|达拉斯|達拉斯|ダラス|Dallas|Даллас");
P("birminghamal", "America/Chicago", "US", true, "Birmingham, Alabama|伯明翰（阿拉巴马）|伯明罕（阿拉巴馬）|バーミングハム（アラバマ）|Birmingham (Alabama)|Бирмингем (Алабама)", ["birmingham alabama", "birmingham, alabama", "birmingham al"]);
P("birminghamuk", "Europe/London", "GB", true, "Birmingham, England|伯明翰（英国）|伯明罕（英國）|バーミンガム（イギリス）|Birmingham (Inglaterra)|Бирмингем (Англия)", ["birmingham uk", "birmingham, uk", "birmingham england", "birmingham, england"]);
P("newyork", "America/New_York", "US", true, "New York|纽约|紐約|ニューヨーク|Nueva York|Нью-Йорк", ["nyc", "new york city", "~нью-йорк"]);
P("washingtondc", "America/New_York", "US", true, "Washington, D.C.|华盛顿特区|華盛頓特區|ワシントンD.C.|Washington D. C.|Вашингтон (округ Колумбия)", ["washington dc", "washington d.c.", "washington, dc", "washington, d.c."]);
P("boston", "America/New_York", "US", true, "Boston|波士顿|波士頓|ボストン|Boston|Бостон");
P("miami", "America/New_York", "US", true, "Miami|迈阿密|邁阿密|マイアミ|Miami|Майами");
P("atlanta", "America/New_York", "US", true, "Atlanta, Georgia (US)|亚特兰大（佐治亚州）|亞特蘭大（喬治亞州）|アトランタ（ジョージア州）|Atlanta (Georgia, EE. UU.)|Атланта (Джорджия, США)", ["atlanta", "georgia state", "佐治亚", "佐治亞", "亚特兰大", "亞特蘭大"]);
P("maine", "America/New_York", "US", false, "Maine|缅因|緬因|メイン州|Maine|Мэн");
P("portlandme", "America/New_York", "US", true, "Portland, Maine|波特兰（缅因）|波特蘭（緬因）|ポートランド（メイン）|Portland (Maine)|Портленд (Мэн)", ["portland maine", "portland, maine", "portland me"]);
P("toronto", "America/Toronto", "CA", true, "Toronto|多伦多|多倫多|トロント|Toronto|Торонто");
P("montreal", "America/Toronto", "CA", true, "Montreal|蒙特利尔|蒙特婁|モントリオール|Montreal|Монреаль");
P("vancouver", "America/Vancouver", "CA", true, "Vancouver|温哥华|溫哥華|バンクーバー|Vancouver|Ванкувер");
P("stjohns", "America/St_Johns", "CA", true, "St. John's, Newfoundland|圣约翰斯（纽芬兰）|聖約翰斯（紐芬蘭）|セントジョンズ（ニューファンドランド）|San Juan de Terranova|Сент-Джонс (Ньюфаундленд)", ["newfoundland", "st. john's", "st john's", "纽芬兰", "紐芬蘭", "ニューファンドランド", "terranova", "~ньюфаундленд"]);
P("mexicocity", "America/Mexico_City", "MX", true, "Mexico City|墨西哥城|墨西哥城|メキシコシティ|Ciudad de México|Мехико", ["cdmx"]);
P("tijuana", "America/Tijuana", "MX", true, "Tijuana|蒂华纳|提華納|ティフアナ|Tijuana|Тихуана");
P("cancun", "America/Cancun", "MX", true, "Cancún|坎昆|坎昆|カンクン|Cancún|Канкун");
P("sanjosecr", "America/Costa_Rica", "CR", true, "San José, Costa Rica|圣何塞（哥斯达黎加）|聖荷西（哥斯大黎加）|サンホセ（コスタリカ）|San José (Costa Rica)|Сан-Хосе (Коста-Рика)", ["san jose costa rica", "san jose, costa rica", "costa rica", "哥斯达黎加", "哥斯大黎加", "コスタリカ", "~коста-рик"]);
P("saopaulo", "America/Sao_Paulo", "BR", true, "São Paulo|圣保罗|聖保羅|サンパウロ|São Paulo|Сан-Паулу");
P("rio", "America/Sao_Paulo", "BR", true, "Rio de Janeiro|里约热内卢|里約熱內盧|リオデジャネイロ|Río de Janeiro|Рио-де-Жанейро", ["rio"]);
P("manaus", "America/Manaus", "BR", true, "Manaus|马瑙斯|馬瑙斯|マナウス|Manaos|Манаус");
P("buenosaires", "America/Argentina/Buenos_Aires", "AR", true, "Buenos Aires|布宜诺斯艾利斯|布宜諾斯艾利斯|ブエノスアイレス|Buenos Aires|Буэнос-Айрес");
P("argentina", "America/Argentina/Buenos_Aires", "AR", false, "Argentina|阿根廷|阿根廷|アルゼンチン|Argentina|Аргентина", ["~аргентин"]);
P("bogota", "America/Bogota", "CO", true, "Bogotá|波哥大|波哥大|ボゴタ|Bogotá|Богота");
P("colombia", "America/Bogota", "CO", false, "Colombia|哥伦比亚|哥倫比亞|コロンビア|Colombia|Колумбия", ["~колумби"]);
P("lima", "America/Lima", "PE", true, "Lima|利马|利馬|リマ|Lima|Лима");
P("caracas", "America/Caracas", "VE", true, "Caracas|加拉加斯|卡拉卡斯|カラカス|Caracas|Каракас");
P("utc", "Etc/UTC", undefined, true, "UTC|UTC|UTC|UTC|UTC|UTC", ["gmt", "协调世界时", "協調世界時", "協定世界時", "格林尼治", "格林威治", "グリニッジ"]);

// Names that mean more than one zone: she asks which one
A("usa", "US", "the United States|美国|美國|アメリカ|Estados Unidos|США", ["newyork", "chicago", "denver", "losangeles", "anchorage", "honolulu"],
  ["usa", "the us", "u.s.a.", "u.s.", "united states", "america", "the states", "米国", "ee.uu.", "eeuu", "~америк"]);
A("russia", "RU", "Russia|俄罗斯|俄羅斯|ロシア|Rusia|Россия", ["moscow", "yekaterinburg", "novosibirsk", "vladivostok"], ["~росси"]);
A("australia", "AU", "Australia|澳大利亚|澳大利亞|オーストラリア|Australia|Австралия", ["sydney", "brisbane", "adelaide", "perth"], ["澳洲", "~австрали"]);
A("canada", "CA", "Canada|加拿大|加拿大|カナダ|Canadá|Канада", ["vancouver", "toronto", "stjohns"], ["~канад"]);
A("brazil", "BR", "Brazil|巴西|巴西|ブラジル|Brasil|Бразилия", ["saopaulo", "manaus"], ["~бразили"]);
A("mexico", "MX", "Mexico|墨西哥|墨西哥|メキシコ|México|Мексика", ["mexicocity", "tijuana", "cancun"], ["~мексик"]);
A("indonesia", "ID", "Indonesia|印度尼西亚|印尼|インドネシア|Indonesia|Индонезия", ["jakarta", "bali", "jayapura"], ["印度尼西亞", "~индонези"]);
A("portland", undefined, "Portland|波特兰|波特蘭|ポートランド|Portland|Портленд", ["portlandor", "portlandme"]);
A("washington", undefined, "Washington|华盛顿|華盛頓|ワシントン|Washington|Вашингтон", ["washingtondc", "washingtonstate"]);
A("georgia", undefined, "Georgia|乔治亚|喬治亞|ジョージア|Georgia|Джорджия", ["atlanta", "tbilisi"]);
A("sanjose", undefined, "San Jose|圣何塞|聖荷西|サンホセ|San José|Сан-Хосе", ["sanjoseca", "sanjosecr"]);
A("birmingham", undefined, "Birmingham|伯明翰|伯明罕|バーミンガム|Birmingham|Бирмингем", ["birminghamuk", "birminghamal"]);

export const placeById = (id: string): Place | undefined => places.get(id);
export const allPlaces = (): Place[] => [...places.values()];
export const label = (p: { labels: string[] }, lang: Lang): string => p.labels[LANG_INDEX[lang]] || p.labels[0];

// ---------------------------------------------------------------- zones and instants

const formatters = new Map<string, Intl.DateTimeFormat>();
export function isValidZone(zone: string): boolean {
  if (typeof zone !== "string" || !zone || zone.length > 64) return false;
  try { new Intl.DateTimeFormat("en-US", { timeZone: zone }); return true; } catch { return false; }
}
function partsFormatter(zone: string): Intl.DateTimeFormat {
  let f = formatters.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "short",
    });
    formatters.set(zone, f);
  }
  return f;
}

export interface Reading {
  place: Place;
  zone: string;
  year: number; month: number; day: number; hour: number; minute: number;
  weekday: number;        // 0 = Sunday
  offsetMinutes: number;  // local minus UTC, at this instant (daylight saving included)
  dateKey: string;        // YYYY-MM-DD in that zone
  hm: string;             // HH:MM, 24-hour
}
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n: number) => String(n).padStart(2, "0");

// What the wall clock shows in a zone at an instant. Throws RangeError for an invalid zone id.
export function readZone(nowMs: number, place: Place): Reading {
  if (!Number.isFinite(nowMs)) throw new RangeError("invalid instant");
  if (!isValidZone(place.zone)) throw new RangeError(`invalid time zone: ${place.zone}`);
  const get: Record<string, string> = {};
  for (const p of partsFormatter(place.zone).formatToParts(new Date(nowMs))) get[p.type] = p.value;
  const year = +get.year, month = +get.month, day = +get.day, minute = +get.minute, second = +get.second;
  const hour = +get.hour % 24; // some ICU versions print midnight as 24
  const wholeSecond = Math.floor(nowMs / 1000) * 1000;
  const offsetMinutes = Math.round((Date.UTC(year, month - 1, day, hour, minute, second) - wholeSecond) / 60000);
  return {
    place, zone: place.zone, year, month, day, hour, minute, weekday: WEEKDAYS.indexOf(get.weekday), offsetMinutes,
    dateKey: `${year}-${pad(month)}-${pad(day)}`, hm: `${pad(hour)}:${pad(minute)}`,
  };
}

export function offsetLabel(minutes: number): string {
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  return `UTC${sign}${Math.floor(abs / 60)}${abs % 60 ? ":" + pad(abs % 60) : ""}`;
}
function longDate(nowMs: number, zone: string, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALE[lang], { timeZone: zone, weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(new Date(nowMs));
}
const h12 = (r: Reading) => `${r.hour % 12 || 12}:${pad(r.minute)} ${r.hour < 12 ? "AM" : "PM"}`;

// ---------------------------------------------------------------- reading the question

const LATIN_OR_CYRILLIC = /[\p{Script=Latin}\p{Script=Cyrillic}]/u;
// Lower case, accents dropped from Latin letters only (kana voicing marks and Russian й, ё are kept), full-width forms folded
export function fold(text: string): string {
  return text.normalize("NFKC").normalize("NFD")
    .replace(/(\p{Script=Latin})\p{M}+/gu, "$1").normalize("NFC").toLowerCase();
}
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const WORD_CHAR = "\\p{Script=Latin}\\p{Script=Cyrillic}\\p{N}";

interface Matcher { len: number; find: (text: string) => Array<[number, number]>; target: (typeof names)[number]["target"] }
const matchers: Matcher[] = names.map(({ name, target }): Matcher => {
  const stem = name.startsWith("~");
  const folded = fold(stem ? name.slice(1) : name);
  if (!LATIN_OR_CYRILLIC.test(folded)) {
    // Chinese and Japanese: no spaces between words. "西班牙语" is the Spanish language, not Spain.
    return { len: folded.length, target, find: (text: string) => {
      const out: Array<[number, number]> = [];
      for (let i = text.indexOf(folded); i >= 0; i = text.indexOf(folded, i + 1)) {
        if (!/^[语語文]/.test(text.slice(i + folded.length))) out.push([i, i + folded.length]);
      }
      return out;
    } };
  }
  // A word edge is any character that is not a Latin or Cyrillic letter or a digit, so "UTC" and "Tokyo" are found
  // inside Chinese or Japanese text too ("UTCで", "在Tokyo")
  const re = new RegExp(`(?<![${WORD_CHAR}])${escapeRe(folded)}${stem ? `[${WORD_CHAR}]{0,3}` : ""}(?![${WORD_CHAR}])`, "gu");
  return { len: folded.length, target, find: (text: string) => [...text.matchAll(re)].map(m => [m.index!, m.index! + m[0].length] as [number, number]) };
}).sort((a, b) => b.len - a.len);

export type Kind = "time" | "date" | "tomorrow" | "difference";
export interface TimeQuery {
  kind: Kind;
  lang: Lang;
  places: Place[];                 // in the order mentioned, at most four
  ambiguous: { name: string; options: Place[]; labels: string[] } | null;
  unknownPlace: string | null;     // something that looks like a place but is not one we can verify
  hypothetical: boolean;           // the visitor gave a clock time of their own ("if it's 9am in London...")
  simple: boolean;                 // short enough to answer on its own, word for word
}

export function detectLang(text: string): Lang {
  if (/[぀-ヿ]/.test(text)) return "ja";
  if (/[一-鿿]/.test(text)) {
    if (/何時|何日|日付|曜日/.test(text) && !/[么吗几幾点點呢]/.test(text)) return "ja";
    const trad = (text.match(/[點幾現時間號裡這們麼嗎東國灣臺區與還說請個鐘會後來對當際]/g) ?? []).length;
    const simp = (text.match(/[点几现时间号里这们么吗东国湾区与还说请个钟会后来对当际]/g) ?? []).length;
    return trad > simp ? "zh-Hant" : "zh-Hans";
  }
  if (/[Ѐ-ӿ]/.test(text)) return "ru";
  const f = fold(text);
  if (/[¿¡ñ]/.test(text) || (f.match(/\b(?:que|hora|horas|es|en|la|el|hoy|fecha|dia|cual|manana|diferencia|entre|son|ahora|ya)\b/g) ?? []).length >= 2) return "es";
  return "en";
}

const INTENT = {
  difference: [
    /\btime difference\b|\bdifference in time\b|\btime zone difference\b|\bhow many hours\b|\bahead of\b|\bbehind\b/,
    /时差|時差|相差|差几个?小时|差幾個?小時|[早晚快慢]几个?小时|[早晚快慢]幾個?小時/,
    /何時間(?:の差|進|遅)/,
    /diferencia (?:horaria|de horas?|de tiempo)|cuantas horas (?:de diferencia|adelante|atras|por delante|por detras)/,
    /разниц\p{L}* (?:во )?времени|на сколько часов|часов разниц/u,
  ],
  tomorrow: [
    /\b(?:is it|is it already|already) tomorrow\b|\btomorrow (?:already|there|yet)\b|\bis it the next day\b/,
    /(?:是|已经|已經|到了?)\s*明天|明天了/,
    /もう明日|明日(?:ですか|になって|なの)/,
    /ya es manana|es manana (?:ya|en|alli)|ya manana/,
    /уже завтра|завтра уже/,
  ],
  date: [
    /\bwhat(?:'s| is)? (?:the |today'?s )?date\b|\bwhat day is it\b|\btoday'?s date\b|\bdate (?:today |right now )?in\b|\bwhat day of the week\b|\bthe date (?:there|now)\b/,
    /(?:今天|今日|现在|現在|目前|当地|當地)[^。？?！!]{0,8}(?:几号|幾號|几月|幾月|日期|星期几|星期幾|礼拜几|禮拜幾|哪天)/,
    /(?:今日|きょう|今|現在)[^。？?！!]{0,8}(?:何日|日付|何曜日|なんにち)/,
    /que (?:dia|fecha) es|fecha (?:de hoy|actual|es|en)|dia es hoy/,
    /какое (?:сегодня |сейчас )?число|какой (?:сегодня |сейчас )?день|какая (?:сегодня |сейчас )?дата|сегодняшн\p{L}* дат/u,
  ],
  time: [
    /\bwhat time is it\b|\bwhat'?s the time\b|\bwhat is the time\b|\btime is it\b|\bcurrent time\b|\blocal time\b|\bthe time (?:in|there|now|right now)\b|\btime (?:right )?now in\b|^\s*(?:the )?time in\b/,
    /几点了|幾點了|几点钟|幾點鐘|(?:现在|現在|目前|此刻|当前|當前|当地|當地|这会儿|這會兒)[^。？?！!]{0,8}(?:几点|幾點|时间|時間|时刻|時刻)/,
    /(?:今|いま|現在)[^。？?！!]{0,8}(?:何時|なんじ|時刻|時間)|現在時刻/,
    /(?<!\ba )que hora|hora (?:es|actual|local)|la hora en/,
    /котор\p{L}* (?:сейчас )?час|сколько (?:сейчас )?времени|сколько время|как\p{L}* (?:сейчас )?время|местное время|текущее время/u,
  ],
};
// Weaker wording that counts only when a place is named ("东京几点?", "Tokyo time?")
const PLACE_INTENT: Array<[Kind, RegExp]> = [
  ["date", /几号|幾號|日期|星期几|星期幾|何日|日付|何曜日|\bdate\b|\bfecha\b|\bчисло\b|\bдата\b/u],
  ["time", /几点|幾點|时间|時間|何時|時刻|\bwhat time\b|\btime\b|\bhora\b|\bвремя\b|\bчас\b/u],
];

// The word "time" or "date" is not always a clock question: "time complexity", "a time machine", "I had a great time in
// Tokyo", "a date in Paris". The fixed wordings above are specific enough; the weak ones are only taken for a short
// fragment about a place, never for a sentence that merely contains the word.
const NOT_A_CLOCK = /\btime (?:complexity|machine|travel(?:l?er|l?ing)?|series|management|limit|line|lapse|bomb|slot|frame|loop|out|share|sheet|stamp|signature|capsule|trial)\b|\btimeline\b|\b(?:blind|first|hot|double|romantic|release|due|expiry|expiration|launch|birth|start|end|closing) dates?\b|\b(?:a|an|my|our|your|his|her|their) dates?\b/;
const NOT_FOR_ME_TO_ANSWER = /\b(?:a|an|my|our|your|their|great|good|nice|bad|long|short|hard|fun|wonderful|first|last|next|every|same|any|some|free|spare|real|big|lot of|much|more|less) (?:time|date)\b|\b(?:i|i'm|i'd|i've|i'll|me|we)\b|\bwhen\b|[我私僕俺]/;
function weakIntentAllowed(raw: string, folded: string): boolean {
  if (NOT_FOR_ME_TO_ANSWER.test(folded)) return false;
  const cjk = (raw.match(/[぀-ヿ㐀-鿿]/g) ?? []).length;
  const words = raw.replace(/[぀-ヿ㐀-鿿]+/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return words + Math.ceil(cjk / 2) <= 7;
}

// A place-like phrase we could not resolve: "in Ulaanbaatar", "在乌兰巴托", "en Asunción", "в Улан-Баторе"
function unknownPlaceIn(text: string): string | null {
  const zone = /\b[A-Z][A-Za-z_]+\/[A-Z][A-Za-z_\-]+(?:\/[A-Z][A-Za-z_\-]+)?\b/.exec(text);
  if (zone) return zone[0];
  const patterns = [
    /\b(?:in|at)\s+((?:[A-Z][\p{L}'.-]+)(?:\s+[A-Z][\p{L}'.-]+){0,3})/u,
    /\ben\s+((?:[A-ZÁÉÍÓÚÑ][\p{L}'.-]+)(?:\s+(?:de\s+)?[A-ZÁÉÍÓÚÑ][\p{L}'.-]+){0,3})/u,
    /(?:^|\s)[вВ]о?\s+([А-ЯЁ][\p{L}-]+(?:\s+[А-ЯЁ][\p{L}-]+)?)/u,
    /在([一-鿿]{1,8}?)(?:现在|現在|是|的|几|幾|时间|時間|今天|日期)/,
    /^([一-鿿゠-ヿ]{1,8}?)(?:现在|現在|今天|的|は|の)/,
  ];
  for (const re of patterns) {
    const m = re.exec(text.trim());
    const name = m?.[1]?.trim();
    if (name && !/^(?:我|我们|我們|这里|這裡|这边|這邊|那里|那裡|你|你们|你們|今|いま|現在|I|UTC|GMT)$/.test(name)) return name;
  }
  return null;
}

export function analyzeTimeQuestion(text: string): TimeQuery | null {
  if (typeof text !== "string" || !text.trim() || text.length > 2000) return null;
  const f = fold(text);
  if (NOT_A_CLOCK.test(f)) return null;

  // Places, longest names first, never overlapping
  const taken: Array<[number, number]> = [];
  const found: Array<{ at: number; end: number; target: Matcher["target"] }> = [];
  for (const m of matchers) {
    for (const [s, e] of m.find(f)) {
      if (taken.some(([a, b]) => s < b && e > a)) continue;
      taken.push([s, e]);
      found.push({ at: s, end: e, target: m.target });
    }
  }
  // An offset written out: "UTC+8", "GMT-5" (whole hours; IANA's Etc/GMT zones have the sign reversed)
  const offset = /(?:utc|gmt)\s*([+\-−])\s*(\d{1,2})(?::?(\d{2}))?(?!\d)/.exec(f);
  // A zone id typed directly: "Asia/Ulaanbaatar"
  const typedZone = /\b[A-Z][A-Za-z_]+\/[A-Z][A-Za-z_\-]+(?:\/[A-Z][A-Za-z_\-]+)?\b/.exec(text);
  found.sort((a, b) => a.at - b.at);

  let resolved: Array<{ place: Place; at: number; end: number }> = [];
  const ambiguities: Array<{ a: Ambiguity }> = [];
  for (const hit of found) {
    if ("place" in hit.target) resolved.push({ place: hit.target.place, at: hit.at, end: hit.end });
    else ambiguities.push({ a: hit.target.ambiguity });
  }
  if (offset) {
    const hours = +offset[2], minutes = offset[3] ? +offset[3] : 0;
    const sign = offset[1] === "+" ? "+" : "-";
    const zone = `Etc/GMT${sign === "+" ? "-" : "+"}${hours}`;
    if (!minutes && hours <= 14 && isValidZone(zone)) {
      const name = `UTC${sign}${hours}`;
      resolved = resolved.filter(r => r.place.id !== "utc");
      resolved.push({ place: { id: "offset:" + name, zone, city: true, labels: [name] }, at: offset.index, end: offset.index + offset[0].length });
    }
  }
  if (typedZone) {
    if (isValidZone(typedZone[0])) resolved.push({ place: { id: "zone:" + typedZone[0], zone: typedZone[0], city: true, labels: [typedZone[0]] }, at: typedZone.index, end: typedZone.index });
  }

  // "Sacramento, California" / "加州萨克拉门托": one place, the more specific one
  const merged: typeof resolved = [];
  for (const r of resolved) {
    const prev = merged[merged.length - 1];
    if (prev && prev.place.zone === r.place.zone && r.at - prev.end <= 3) {
      if (!prev.place.city && r.place.city) merged[merged.length - 1] = r;
      prev.end = Math.max(prev.end, r.end);
      continue;
    }
    if (!merged.some(m => m.place.id === r.place.id)) merged.push(r);
  }
  const placesFound = merged.map(r => r.place);
  // "美国加州" or "Russia, Moscow": the country is settled by the place in it
  const open = ambiguities.filter(({ a }) => !(a.country && placesFound.some(p => p.country === a.country)));

  const hasPlace = placesFound.length > 0 || open.length > 0;
  let kind: Kind | null = null;
  for (const k of ["difference", "tomorrow", "date", "time"] as const) {
    if (INTENT[k].some(re => re.test(f))) {
      if (k === "difference" && !hasPlace) continue; // "behind" alone is not a time question
      kind = k; break;
    }
  }
  if (!kind && hasPlace && weakIntentAllowed(text, f)) kind = PLACE_INTENT.find(([, re]) => re.test(f))?.[0] ?? null;
  if (!kind) return null;

  const lang = detectLang(text);
  const first = open[0];
  const unknown = placesFound.length || first ? null
    : typedZone && !isValidZone(typedZone[0]) ? typedZone[0] : unknownPlaceIn(text);
  const words = text.trim().split(/\s+/).length;
  return {
    kind, lang, places: placesFound.slice(0, 4),
    ambiguous: first ? { name: label(first.a, lang), options: first.a.options.map(id => places.get(id)!).filter(Boolean), labels: first.a.labels } : null,
    unknownPlace: unknown,
    hypothetical: extractClockTimes(text).length > 0,
    simple: text.length <= 120 && words <= 18 && !/\n/.test(text.trim()) && (text.match(/[?？]/g) ?? []).length <= 1,
  };
}

// ---------------------------------------------------------------- the plan for one message

export type Outcome = "answer" | "ask_local" | "ask_ambiguous" | "ask_unknown";
export interface TimePlan {
  query: TimeQuery;
  nowMs: number;
  utc: Reading;
  readings: Reading[];  // the places asked about, read at nowMs
  outcome: Outcome;
  direct: boolean;      // answered word for word here, without the model
  guard: boolean;       // the model's reply is checked against the verified values
}

// A place the built-in list does not know, found by the place lookup (live/timePlaces.ts): the same verified answer, for
// any place on Earth. The time zone comes from the coordinates, the clock from the server, the conversion from Intl.
export function planWithPlace(plan: TimePlan, place: Place): TimePlan {
  return { ...plan, query: { ...plan.query, places: [place], unknownPlace: null, ambiguous: null }, readings: [readZone(plan.nowMs, place)], outcome: "answer" };
}
export function planAmbiguous(plan: TimePlan, name: string, options: Place[]): TimePlan {
  return { ...plan, query: { ...plan.query, unknownPlace: null, ambiguous: { name, options, labels: [name] } }, outcome: "ask_ambiguous" };
}

export function planTimeAnswer(text: string, nowMs: number = clock.now()): TimePlan | null {
  const query = analyzeTimeQuestion(text);
  if (!query) return null;
  const utc = readZone(nowMs, places.get("utc")!);
  const readings = query.places.filter(p => isValidZone(p.zone)).map(p => readZone(nowMs, p));
  let outcome: Outcome;
  if (query.ambiguous) outcome = "ask_ambiguous";
  else if (query.kind === "difference" ? readings.length >= 2 : readings.length >= 1) outcome = "answer";
  else if (query.unknownPlace && !readings.length) outcome = "ask_unknown";
  else outcome = "ask_local";
  return { query, nowMs, utc, readings, outcome, direct: query.simple && !query.hypothetical, guard: !query.hypothetical };
}

// ---------------------------------------------------------------- answers, in the visitor's language

const REMARKS: Record<Lang, string[]> = {
  en: ["Synced to the District's master clock.", "Straight off the system clock, no guessing.", "Pulled from the network clock just now."],
  "zh-Hans": ["已和区里的主时钟同步。", "直接读的系统时钟，不靠猜。"],
  "zh-Hant": ["已和區裡的主時鐘同步。", "直接讀的系統時鐘，不靠猜。"],
  ja: ["ディストリクトのマスタークロックと同期済み。", "システム時計から直接読んだよ。推測じゃない。"],
  es: ["Sincronizado con el reloj maestro del Distrito.", "Directo del reloj del sistema, sin adivinar."],
  ru: ["Сверено с главными часами Района.", "Прямо с системных часов, без догадок."],
};

function ruPlural(n: number, one: string, few: string, many: string): string {
  const t = n % 10, h = n % 100;
  return t === 1 && h !== 11 ? one : t >= 2 && t <= 4 && (h < 12 || h > 14) ? few : many;
}
function duration(minutes: number, lang: Lang): string {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  const parts: Record<Lang, [string, string, string]> = {
    en: [h ? `${h} hour${h === 1 ? "" : "s"}` : "", m ? `${m} minute${m === 1 ? "" : "s"}` : "", " "],
    "zh-Hans": [h ? `${h}小时` : "", m ? `${m}分钟` : "", ""],
    "zh-Hant": [h ? `${h}小時` : "", m ? `${m}分鐘` : "", ""],
    ja: [h ? `${h}時間` : "", m ? `${m}分` : "", ""],
    es: [h ? `${h} hora${h === 1 ? "" : "s"}` : "", m ? `${m} minuto${m === 1 ? "" : "s"}` : "", " y "],
    ru: [h ? `${h} ${ruPlural(h, "час", "часа", "часов")}` : "", m ? `${m} ${ruPlural(m, "минута", "минуты", "минут")}` : "", " "],
  };
  const [hs, ms, joint] = parts[lang];
  return [hs, ms].filter(Boolean).join(joint);
}

interface Phrases {
  time(L: string, r: Reading, date: string): string;
  date(L: string, r: Reading, date: string): string;
  ahead(A: string, dateA: string, hmA: string, R: string, dateR: string): string;
  same(A: string, dateA: string, hmA: string, R: string): string;
  behindDate(A: string, dateA: string, hmA: string, R: string, dateR: string): string;
  compareMine: string;
  diff(A: string, B: string, dur: string, ahead: boolean, a: [string, string], b: [string, string]): string;
  sameTime(A: string, B: string, hm: string): string;
  askLocal(hm: string, date: string): string;
  askAmbiguous(name: string, options: string[]): string;
  askUnknown(name: string, hm: string): string;
}
// Every time is written right after the place it belongs to, and every date right after its time (or its place),
// so the check below can tell whose time each one is
const PHRASES: Record<Lang, Phrases> = {
  en: {
    time: (L, r, d) => `In ${L} it's ${r.hm} (${h12(r)}) on ${d} (${offsetLabel(r.offsetMinutes)}).`,
    date: (L, r, d) => `In ${L} it's ${d}, ${r.hm} local time (${offsetLabel(r.offsetMinutes)}).`,
    ahead: (A, dA, hA, R, dR) => `Yes. In ${A} it's already ${hA} on ${dA}, while ${R} is still on ${dR}.`,
    same: (A, dA, hA, R) => `No. In ${A} it's ${hA} on ${dA}, the same date as ${R}.`,
    behindDate: (A, dA, hA, R, dR) => `No. In ${A} it's still ${hA} on ${dA}, an earlier date than ${R} (${dR}).`,
    compareMine: "Tell me where you are and I'll compare it with your own date.",
    diff: (A, B, dur, ahead, a, b) => `${A} is ${dur} ${ahead ? "ahead of" : "behind"} ${B} right now. In ${A} it's ${a[0]} on ${a[1]}; in ${B} it's ${b[0]} on ${b[1]}.`,
    sameTime: (A, B, hm) => `${A} and ${B} are on the same time right now: ${hm}.`,
    askLocal: (hm, d) => `I can't see your clock from here, and I won't guess it. Right now it's ${hm} UTC on ${d}. Tell me your city or time zone and I'll give you your local time.`,
    askAmbiguous: (n, o) => `"${n}" could mean more than one place: ${o.join("; ")}. Which one do you mean?`,
    askUnknown: (n, hm) => `I don't have a verified clock for ${n}. Give me the nearest major city or its time zone (like Asia/Tokyo) and I'll check. For reference, it's ${hm} UTC right now.`,
  },
  "zh-Hans": {
    time: (L, r, d) => `${L}现在是${r.hm}，${d}（${offsetLabel(r.offsetMinutes)}）。`,
    date: (L, r, d) => `${L}今天是${d}，当地时间${r.hm}（${offsetLabel(r.offsetMinutes)}）。`,
    ahead: (A, dA, hA, R, dR) => `是的。${A}已经是${hA}（${dA}）了，而${R}还是${dR}。`,
    same: (A, dA, hA, R) => `还没有。${A}现在是${hA}（${dA}），和${R}是同一天。`,
    behindDate: (A, dA, hA, R, dR) => `没有。${A}还是${hA}（${dA}），日期比${R}（${dR}）早。`,
    compareMine: "告诉我你在哪儿，我再跟你那边的日期比。",
    diff: (A, B, dur, ahead, a, b) => `${A}比${B}${ahead ? "快" : "慢"}${dur}。${A}现在是${a[0]}（${a[1]}），${B}是${b[0]}（${b[1]}）。`,
    sameTime: (A, B, hm) => `${A}和${B}现在时间相同：${hm}。`,
    askLocal: (hm, d) => `我看不到你那边的时钟，也不会乱猜。现在是UTC（协调世界时）${hm}，${d}。告诉我你在哪个城市或时区，我帮你换算成当地时间。`,
    askAmbiguous: (n, o) => `“${n}”可能指好几个地方：${o.join("、")}。你说的是哪一个？`,
    askUnknown: (n, hm) => `我这里没有“${n}”的可靠时钟。告诉我离那儿最近的大城市或它的时区（比如 Asia/Tokyo），我再查。顺便说一下，现在是UTC ${hm}。`,
  },
  "zh-Hant": {
    time: (L, r, d) => `${L}現在是${r.hm}，${d}（${offsetLabel(r.offsetMinutes)}）。`,
    date: (L, r, d) => `${L}今天是${d}，當地時間${r.hm}（${offsetLabel(r.offsetMinutes)}）。`,
    ahead: (A, dA, hA, R, dR) => `是的。${A}已經是${hA}（${dA}）了，而${R}還是${dR}。`,
    same: (A, dA, hA, R) => `還沒有。${A}現在是${hA}（${dA}），和${R}是同一天。`,
    behindDate: (A, dA, hA, R, dR) => `沒有。${A}還是${hA}（${dA}），日期比${R}（${dR}）早。`,
    compareMine: "告訴我你在哪裡，我再跟你那邊的日期比。",
    diff: (A, B, dur, ahead, a, b) => `${A}比${B}${ahead ? "快" : "慢"}${dur}。${A}現在是${a[0]}（${a[1]}），${B}是${b[0]}（${b[1]}）。`,
    sameTime: (A, B, hm) => `${A}和${B}現在時間相同：${hm}。`,
    askLocal: (hm, d) => `我看不到你那邊的時鐘，也不會亂猜。現在是UTC（協調世界時）${hm}，${d}。告訴我你在哪個城市或時區，我幫你換算成當地時間。`,
    askAmbiguous: (n, o) => `「${n}」可能指好幾個地方：${o.join("、")}。你說的是哪一個？`,
    askUnknown: (n, hm) => `我這裡沒有「${n}」的可靠時鐘。告訴我離那裡最近的大城市或它的時區（例如 Asia/Tokyo），我再查。順便說，現在是UTC ${hm}。`,
  },
  ja: {
    time: (L, r, d) => `${L}は今${r.hm}、${d}です（${offsetLabel(r.offsetMinutes)}）。`,
    date: (L, r, d) => `${L}は今日${d}、現地時間${r.hm}です（${offsetLabel(r.offsetMinutes)}）。`,
    ahead: (A, dA, hA, R, dR) => `はい。${A}はもう${hA}（${dA}）で、${R}はまだ${dR}です。`,
    same: (A, dA, hA, R) => `いいえ。${A}は今${hA}（${dA}）で、${R}と同じ日付です。`,
    behindDate: (A, dA, hA, R, dR) => `いいえ。${A}はまだ${hA}（${dA}）で、${R}（${dR}）より前の日付です。`,
    compareMine: "どこにいるか教えてくれたら、そっちの日付と比べるよ。",
    diff: (A, B, dur, ahead, a, b) => `${A}は${B}より${dur}${ahead ? "進んでいます" : "遅れています"}。${A}は${a[0]}（${a[1]}）、${B}は${b[0]}（${b[1]}）です。`,
    sameTime: (A, B, hm) => `${A}と${B}は今同じ時刻、${hm}です。`,
    askLocal: (hm, d) => `あなたの時計はここからは見えないし、推測もしない。今はUTCで${hm}、${d}。都市かタイムゾーンを教えてくれたら現地時間を出すよ。`,
    askAmbiguous: (n, o) => `「${n}」は複数の場所を指すかもしれない：${o.join("、")}。どれのこと？`,
    askUnknown: (n, hm) => `「${n}」の確かな時計はここにはない。近くの大都市かタイムゾーン（例：Asia/Tokyo）を教えて。ちなみに今はUTCで${hm}。`,
  },
  es: {
    time: (L, r, d) => `En ${L} son las ${r.hm}, ${d} (${offsetLabel(r.offsetMinutes)}).`,
    date: (L, r, d) => `En ${L} hoy es ${d}, hora local ${r.hm} (${offsetLabel(r.offsetMinutes)}).`,
    ahead: (A, dA, hA, R, dR) => `Sí. En ${A} ya son las ${hA} (${dA}), mientras que en ${R} todavía es ${dR}.`,
    same: (A, dA, hA, R) => `No. En ${A} son las ${hA} (${dA}), la misma fecha que en ${R}.`,
    behindDate: (A, dA, hA, R, dR) => `No. En ${A} todavía son las ${hA} (${dA}), una fecha anterior a la de ${R} (${dR}).`,
    compareMine: "Dime dónde estás y lo comparo con tu fecha.",
    diff: (A, B, dur, ahead, a, b) => `${A} va ${dur} ${ahead ? "por delante de" : "por detrás de"} ${B}. En ${A} son las ${a[0]} (${a[1]}); en ${B}, las ${b[0]} (${b[1]}).`,
    sameTime: (A, B, hm) => `${A} y ${B} tienen ahora la misma hora: ${hm}.`,
    askLocal: (hm, d) => `Desde aquí no veo tu reloj y no voy a adivinarlo. Ahora mismo son las ${hm} UTC (${d}). Dime tu ciudad o zona horaria y te doy la hora local.`,
    askAmbiguous: (n, o) => `"${n}" puede referirse a varios lugares: ${o.join("; ")}. ¿Cuál quieres decir?`,
    askUnknown: (n, hm) => `No tengo un reloj verificado para ${n}. Dime la gran ciudad más cercana o su zona horaria (por ejemplo Asia/Tokyo) y lo compruebo. Como referencia, ahora son las ${hm} UTC.`,
  },
  ru: {
    time: (L, r, d) => `${L}: сейчас ${r.hm}, ${d} (${offsetLabel(r.offsetMinutes)}).`,
    date: (L, r, d) => `${L}: сегодня ${d}, местное время ${r.hm} (${offsetLabel(r.offsetMinutes)}).`,
    ahead: (A, dA, hA, R, dR) => `Да. ${A}: уже ${hA}, ${dA}. ${R}: ещё ${dR}.`,
    same: (A, dA, hA, R) => `Нет. ${A}: ${hA}, ${dA}, та же дата, что и ${R}.`,
    behindDate: (A, dA, hA, R, dR) => `Нет. ${A}: ещё ${hA}, ${dA}, дата раньше, чем ${R} (${dR}).`,
    compareMine: "Скажи, где ты, и я сравню с твоей датой.",
    diff: (A, B, dur, ahead, a, b) => `${A} ${ahead ? "впереди" : "позади"} на ${dur} относительно: ${B}. ${A}: ${a[0]}, ${a[1]}. ${B}: ${b[0]}, ${b[1]}.`,
    sameTime: (A, B, hm) => `${A} и ${B}: сейчас одинаковое время, ${hm}.`,
    askLocal: (hm, d) => `Твои часы мне отсюда не видны, и гадать я не буду. Сейчас ${hm} UTC, ${d}. Назови свой город или часовой пояс, и я скажу местное время.`,
    askAmbiguous: (n, o) => `«${n}» может означать несколько мест: ${o.join("; ")}. Какое именно?`,
    askUnknown: (n, hm) => `Проверенных часов для «${n}» у меня нет. Назови ближайший крупный город или часовой пояс (например, Asia/Tokyo), и я проверю. Для ориентира: сейчас ${hm} UTC.`,
  },
};

const randomPick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];

// The verified facts for an "answer" plan, in one language, without her remark
function verifiedBody(plan: TimePlan, lang: Lang): string {
  const { query: q, nowMs, utc, readings } = plan;
  const t = PHRASES[lang];
  const date = (r: Reading) => longDate(nowMs, r.zone, lang);
  const L = (r: Reading) => label(r.place, lang);
  if (q.kind === "difference") {
    const [a, b] = readings;
    const minutes = a.offsetMinutes - b.offsetMinutes;
    return minutes === 0 ? t.sameTime(L(a), L(b), a.hm)
      : t.diff(L(a), L(b), duration(Math.abs(minutes), lang), minutes > 0, [a.hm, date(a)], [b.hm, date(b)]);
  }
  if (q.kind === "tomorrow") {
    const a = readings[0], ref = readings[1] ?? utc;
    const R = readings[1] ? L(ref) : "UTC";
    const cmp = a.dateKey.localeCompare(ref.dateKey);
    const body = cmp > 0 ? t.ahead(L(a), date(a), a.hm, R, date(ref)) : cmp === 0 ? t.same(L(a), date(a), a.hm, R) : t.behindDate(L(a), date(a), a.hm, R, date(ref));
    return readings[1] ? body : body + " " + t.compareMine;
  }
  const line = q.kind === "date" ? t.date : t.time;
  return readings.map(r => line(L(r), r, date(r))).join(lang === "en" || lang === "es" || lang === "ru" ? " " : "");
}

// The verified answer, word for word. `pick` chooses her one-line remark (tests pass a fixed choice).
export function verifiedReply(plan: TimePlan, pick: <T>(items: T[]) => T = randomPick): string {
  const { query: q, nowMs, utc } = plan;
  const lang = q.lang, t = PHRASES[lang];
  // A question back needs no remark
  if (plan.outcome === "ask_ambiguous") return t.askAmbiguous(q.ambiguous!.name, q.ambiguous!.options.map(p => label(p, lang)));
  if (plan.outcome === "ask_unknown") return t.askUnknown(q.unknownPlace!, utc.hm);
  if (plan.outcome === "ask_local") return t.askLocal(utc.hm, longDate(nowMs, utc.zone, lang));
  return `${pick(REMARKS[lang])} ${verifiedBody(plan, lang)}`;
}

// ---------------------------------------------------------------- what the model is told

const iso = (r: Reading) => `${r.dateKey} ${r.hm}`;
// Always present, so she never needs to guess "now" and never passes UTC off as someone's local time
export function clockPrompt(nowMs: number, plan: TimePlan | null): string {
  const utc = plan?.utc ?? readZone(nowMs, places.get("utc")!);
  const lines = [
    `SERVER CLOCK (read from the system clock for this message): it is ${iso(utc)} UTC, ${longDate(nowMs, "Etc/UTC", "en")}.`,
    "You do not know the visitor's own time zone or location. Never present UTC as their local time and never guess it from their language; if they ask their own time, ask where they are.",
    "If anyone asks the time or date somewhere and no VERIFIED CLOCK for that place is given below, do not convert it yourself: give the UTC time and ask for a major city or time zone.",
  ];
  if (plan?.readings.length) {
    lines.push("VERIFIED CLOCK for the places in this message (exact; copy these values, never calculate, convert or round):");
    for (const r of plan.readings) lines.push(`- ${label(r.place, "en")} (${r.zone}, ${offsetLabel(r.offsetMinutes)}): ${iso(r)}, ${longDate(nowMs, r.zone, "en")}`);
    if (plan.readings.length >= 2) {
      const [a, b] = plan.readings, d = a.offsetMinutes - b.offsetMinutes;
      lines.push(`- Difference: ${label(a.place, "en")} is ${d === 0 ? "on the same time as" : `${duration(Math.abs(d), "en")} ${d > 0 ? "ahead of" : "behind"}`} ${label(b.place, "en")} right now.`);
    }
  }
  return lines.join("\n");
}

// The rule she reads last for a time question that goes to the model
export function timeRule(plan: TimePlan): string {
  const persona = "Keep your own personality in at most one short remark; the facts must be exact.";
  if (plan.outcome === "ask_ambiguous") {
    return `TIME RULE for your next reply: "${plan.query.ambiguous!.name}" could mean ${plan.query.ambiguous!.options.map(p => label(p, "en")).join(" or ")}. Ask which one they mean. Do not give a time or date for it. ${persona}`;
  }
  if (plan.outcome === "ask_local" || plan.outcome === "ask_unknown") {
    return `TIME RULE for your next reply: you have no verified clock for ${plan.outcome === "ask_unknown" ? `"${plan.query.unknownPlace}"` : "the visitor's location"}. Do not guess or convert a local time. You may give the UTC time from SERVER CLOCK exactly, and ask for their city or time zone. ${persona}`;
  }
  if (!plan.guard) {
    return `TIME RULE for your next reply: use the VERIFIED CLOCK values and offsets exactly. ${persona}`;
  }
  return `TIME RULE for your next reply: answer the time and date part ONLY from VERIFIED CLOCK, writing times exactly as listed (24-hour HH:MM) with their dates. Do not calculate, convert or round anything. ${persona}`;
}

// ---------------------------------------------------------------- checking her reply

const CN_DIGITS: Record<string, number> = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 兩: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
function cnNumber(s: string): number | null {
  if (/^\d+$/.test(s)) return +s;
  if (s === "半") return 30;
  if (!/^[零〇一二两兩三四五六七八九十]+$/.test(s)) return null;
  if (!s.includes("十")) return s.length === 1 ? CN_DIGITS[s] : null;
  const [tens, ones] = s.split("十");
  return (tens ? CN_DIGITS[tens] ?? NaN : 1) * 10 + (ones ? CN_DIGITS[ones] ?? NaN : 0);
}
type Period = "am" | "pm" | "noon" | null;
// Every minute-of-day a written time could mean: "9:50" is 09:50 or 21:50 unless AM/PM or 下午 says which
function candidates(h: number, m: number, period: Period): number[] {
  if (h > 24 || m > 59) return [];
  if (h === 24) h = 0;
  if (period === "am") return [(h % 12) * 60 + m];
  if (period === "pm") return [((h % 12) + 12) * 60 + m];
  if (h > 12 || h === 0) return [h * 60 + m];
  return [(h % 12) * 60 + m, ((h % 12) + 12) * 60 + m];
}
const periodOf = (s: string | undefined): Period => {
  if (!s) return null;
  if (/^(?:a\.?m\.?|上午|早上|早晨|凌晨|清晨|午前|朝)$/i.test(s)) return "am";
  if (/^(?:p\.?m\.?|下午|晚上|傍晚|夜里|夜裡|深夜|午后|午後|夜)$/i.test(s)) return "pm";
  if (/^(?:中午|正午)$/.test(s)) return "noon";
  return null;
};

export interface ClockMention { text: string; minutes: number[]; at: number; end: number; twelveHour: boolean }
// Clock times written in a reply, with where they are: 21:50, 9:50 PM, 9 pm, 21点50分, 下午9点半, 九点五十分, 21時50分
export function extractClockTimes(text: string): ClockMention[] {
  const t = text.normalize("NFKC");
  const out: ClockMention[] = [];
  const colon = /(?<![\d+\-−±:])(\d{1,2})\s*[:：]\s*(\d{2})(?![\d:])(?:\s*([ap]\.?\s?m\.?)(?![a-z]))?/gi;
  for (const m of t.matchAll(colon)) {
    // "UTC+5:45" is an offset, not a clock time
    if (/(?:utc|gmt)\s*[+\-−±]\s*$/i.test(t.slice(Math.max(0, m.index! - 6), m.index!))) continue;
    const before = /(上午|下午|早上|晚上|凌晨|中午|傍晚|午前|午後)\s*$/.exec(t.slice(Math.max(0, m.index! - 4), m.index!));
    const at = before ? m.index! - before[0].length : m.index!, end = m.index! + m[0].length;
    out.push({ text: t.slice(at, end), at, end, twelveHour: Boolean(m[3]), minutes: candidates(+m[1], +m[2], periodOf(m[3]?.replace(/\s/g, "")) ?? periodOf(before?.[1])) });
  }
  for (const m of t.matchAll(/(?<![\d:])(\d{1,2})\s*([ap]\.?\s?m\.?)(?![a-z])/gi)) {
    out.push({ text: m[0], at: m.index!, end: m.index! + m[0].length, twelveHour: true, minutes: candidates(+m[1], 0, periodOf(m[2].replace(/\s/g, ""))) });
  }
  const cjk = /(上午|下午|早上|早晨|晚上|凌晨|清晨|中午|傍晚|夜里|夜裡|深夜|午前|午後|夜)?\s*(\d{1,2}|[零〇一二两兩三四五六七八九十]{1,3})\s*(?:点|點|时(?![间間差区區刻])|時(?![間间差区區刻]))(?:\s*(\d{1,2}|[零〇一二两兩三四五六七八九十]{1,3}|半)\s*分?)?/g;
  for (const m of t.matchAll(cjk)) {
    const h = cnNumber(m[2]), mm = m[3] ? cnNumber(m[3]) : 0;
    if (h === null || mm === null || Number.isNaN(h) || Number.isNaN(mm)) continue;
    const at = m.index! + (m[0].length - m[0].trimStart().length);
    out.push({ text: m[0].trim(), at, end: m.index! + m[0].trimEnd().length, twelveHour: false, minutes: candidates(h, mm, periodOf(m[1])) });
  }
  return out.sort((a, b) => a.at - b.at);
}

const MONTHS: Array<[RegExp, number]> = [
  [/^(?:jan|enero|январ)/, 1], [/^(?:feb|febrero|феврал)/, 2], [/^(?:mar(?!t[eé]s)|marzo|март)/, 3], [/^(?:apr|abril|апрел)/, 4],
  [/^(?:may|mayo|ма[яй])/, 5], [/^(?:jun|junio|июн)/, 6], [/^(?:jul|julio|июл)/, 7], [/^(?:aug|agosto|август)/, 8],
  [/^(?:sep|septiembre|setiembre|сентябр)/, 9], [/^(?:oct|octubre|октябр)/, 10], [/^(?:nov|noviembre|ноябр)/, 11], [/^(?:dec|diciembre|декабр)/, 12],
];
const monthOf = (w: string) => MONTHS.find(([re]) => re.test(w.toLowerCase()))?.[1] ?? null;
const MONTH_WORD = "(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept?|oct|nov|dec|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|январ\\p{L}*|феврал\\p{L}*|март\\p{L}*|апрел\\p{L}*|ма[яй]|июн\\p{L}*|июл\\p{L}*|август\\p{L}*|сентябр\\p{L}*|октябр\\p{L}*|ноябр\\p{L}*|декабр\\p{L}*)";
export interface DateMention { key: string; text: string; at: number; end: number }
// Calendar dates written in a reply, as month-day: "1 November", "November 1st", "1 de noviembre", "1 ноября", "11月1日"
export function extractDates(text: string): DateMention[] {
  const t = text.normalize("NFKC");
  const out: DateMention[] = [];
  const add = (m: RegExpMatchArray, month: number | null, day: number) => {
    if (month && day >= 1 && day <= 31) out.push({ key: `${pad(month)}-${pad(day)}`, text: m[0], at: m.index!, end: m.index! + m[0].length });
  };
  for (const m of t.matchAll(new RegExp(`(?<![\\d\\p{L}])(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+|de\\s+)?${MONTH_WORD}(?![\\p{L}])`, "giu"))) add(m, monthOf(m[2]), +m[1]);
  for (const m of t.matchAll(new RegExp(`(?<![\\p{L}])${MONTH_WORD}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?![\\d])`, "giu"))) add(m, monthOf(m[1]), +m[2]);
  for (const m of t.matchAll(/(\d{1,2})\s*月\s*(\d{1,2})\s*[日号號]/g)) add(m, +m[1], +m[2]);
  return out.sort((a, b) => a.at - b.at);
}

// ---------------------------------------------------------------- whose time is it?
//
// A time is only right if it is right FOR THE PLACE IT IS GIVEN FOR. "北京时间13:50" is wrong even though 13:50 is the
// correct UTC time: that is exactly the original bug. So every time and date in her reply is tied to the place written
// next to it (in the same sentence; the nearest name, before or after; a name after a comma belongs to what follows),
// and checked against that place's own clock:
//   - a named place: its verified time (any recognized place, read from the same instant);
//   - "UTC"/"GMT"/"协调世界时" written next to it: UTC (an offset such as "UTC+8" is not a UTC label);
//   - nothing named: the place asked about, if there is exactly one; never UTC;
//   - two different names hard up against the same time ("北京时间13:50 UTC"), the visitor's own place ("你那边"), or an
//     ambiguous name: wrong, because it cannot be verified.

interface Ref { at: number; end: number; zone: string | null; what: "place" | "utc" | "visitor" | "ambiguous" }
const UTC_WORDS = new RegExp(`协调世界时|協調世界時|協定世界時|世界时|世界時|(?<![${WORD_CHAR}])(?:utc|gmt)(?![${WORD_CHAR}])(?!\\s*[+\\-−±]\\s*\\d)`, "gu");
const VISITOR_WORDS = /\byour (?:time|local time|clock|side|time ?zone|place)\b|\bwhere you are\b|\bfor you\b|你那边|你那邊|你那里|你那裡|你那儿|你那兒|你这边|你這邊|你当地|你當地|あなたのところ|あなたの時間|そっち|tu hora|donde estas|у тебя|по-твоему/gu;
// Sentence ends ("p.m.", "D.C.", "St." and the Russian "г." are not)
const SENTENCE_END = /(?<!(?:^|[^\p{L}])\p{L})(?<![ap]\.m)(?<!\bst)[.!?](?=\s|$)|[。！？；;\n]/gu;
// A new clause: a name on the other side of "and", "和", "→" ... labels the time in that clause, not this one
const NEW_CLAUSE = /(?<![a-z])(?:and|while|but|vs|whereas|y|mientras)(?![a-z])|(?<![\p{L}])[иа](?![\p{L}])|和|而|与|與|と|→|->|=>/u;
// A comma also ends what a time is labelled by from behind ("21:50, London 13:50"), but not from in front ("In Beijing, 21:50")
const SOFT_BREAK = /[,，、]/;

function placesNamedIn(t: string): Ref[] {
  const out: Ref[] = [];
  const add = (at: number, end: number, zone: string | null, what: Ref["what"]) => {
    if (!out.some(r => at < r.end && end > r.at)) out.push({ at, end, zone, what });
  };
  for (const m of t.matchAll(UTC_WORDS)) add(m.index!, m.index! + m[0].length, "Etc/UTC", "utc");
  for (const m of t.matchAll(VISITOR_WORDS)) add(m.index!, m.index! + m[0].length, null, "visitor");
  for (const m of matchers) {
    if ("place" in m.target && m.target.place.id === "utc") continue; // only an explicit UTC label counts as UTC
    for (const [s, e] of m.find(t)) {
      if ("place" in m.target) add(s, e, m.target.place.zone, "place");
      else add(s, e, null, "ambiguous");
    }
  }
  return out.sort((a, b) => a.at - b.at);
}

const minutesOf = (r: Reading) => r.hour * 60 + r.minute;
const near = (a: number, b: number) => Math.min(Math.abs(a - b), 1440 - Math.abs(a - b)) <= 1;

interface Issue {
  kind: "time" | "date" | "missing" | "duration";
  reason: string;
  at?: number; end?: number;
  expected?: Reading;   // what it should be, when that is known (then it can be corrected in place)
  twelveHour?: boolean;
}

function audit(reply: string, plan: TimePlan): Issue[] {
  const t = fold(reply);
  const refs = placesNamedIn(t);
  const ends = [...t.matchAll(SENTENCE_END)].map(m => m.index!);
  const sentence = (pos: number) => ends.filter(b => b < pos).length;
  const key = (r: Ref) => r.what === "place" || r.what === "utc" ? r.zone : r.what;
  const zones = new Map(plan.readings.map(r => [r.zone, r]));
  const only = zones.size === 1 ? plan.readings[0] : null;
  const readingFor = (ref: Ref): Reading | null => {
    if (!ref.zone || !isValidZone(ref.zone)) return null;
    if (ref.zone === "Etc/UTC") return plan.utc;
    return zones.get(ref.zone) ?? readZone(plan.nowMs, { id: "named:" + ref.zone, zone: ref.zone, city: true, labels: [ref.zone] });
  };
  const clockSpans = extractClockTimes(t);
  // "北京21:50（UTC 13:50）": a name that opens a bracket holding another time labels that time, not this one
  const labelsBracketedTime = (e: number, r: Ref) =>
    /[(（]/.test(t.slice(e, r.at)) && clockSpans.some(c => c.at >= r.end && !/[)）]/.test(t.slice(r.end, c.at)));
  const ownerOf = (s: number, e: number): Ref | "conflict" | null => {
    const here = refs.filter(r => sentence(r.at) === sentence(s));
    const before = here.filter(r => r.end <= s && !NEW_CLAUSE.test(t.slice(r.end, s))).pop();
    const after = here.find(r => r.at >= e && !SOFT_BREAK.test(t.slice(e, r.at)) && !NEW_CLAUSE.test(t.slice(e, r.at)) && !labelsBracketedTime(e, r));
    if (before && after) {
      const dBefore = s - before.end, dAfter = after.at - e;
      if (dBefore <= 8 && dAfter <= 8 && key(before) !== key(after)) return "conflict";
      return dAfter < dBefore ? after : before;
    }
    return before ?? after ?? null;
  };
  // Who a time or date belongs to, and what it should be
  const resolve = (s: number, e: number): { target: Reading | null; reason: string; free: boolean } => {
    const who = ownerOf(s, e);
    if (who === "conflict") return { target: null, reason: "is labelled with two different places", free: false };
    if (who === null) {
      if (only) return { target: only, reason: "", free: false };
      return { target: null, reason: plan.readings.length ? "is not tied to any place" : "is a local time with no verified place", free: plan.readings.length > 1 };
    }
    if (who.what === "visitor") return { target: null, reason: "guesses the visitor's own time", free: false };
    if (who.what === "ambiguous") return { target: null, reason: "is given for an ambiguous place", free: false };
    return { target: readingFor(who), reason: "", free: false };
  };
  const name = (r: Reading) => r.zone === "Etc/UTC" ? "UTC" : label(r.place, "en");
  const issues: Issue[] = [];

  const times = clockSpans.map(m => {
    const { target, reason, free } = resolve(m.at, m.end);
    // With several places asked about and no name next to it, it must at least be one of theirs
    const chosen = free ? plan.readings.find(r => m.minutes.some(x => near(x, minutesOf(r)))) ?? null : target;
    const ok = Boolean(chosen) && m.minutes.some(x => near(x, minutesOf(chosen!)));
    if (!ok) {
      issues.push({
        kind: "time", at: m.at, end: m.end, expected: free ? undefined : target ?? undefined, twelveHour: m.twelveHour,
        reason: `"${m.text}" ${reason || `is not the time in ${name(target!)} (${target!.hm})`}`,
      });
    }
    return { m, target: chosen, ok };
  });

  for (const d of extractDates(t)) {
    // A date written right after a time (no other name in between) belongs to that time's place
    const lastTime = times.filter(x => x.m.end <= d.at && sentence(x.m.at) === sentence(d.at)).pop();
    let target: Reading | null, reason = "", free = false;
    if (lastTime && !refs.some(r => r.at >= lastTime.m.end && r.end <= d.at)) target = lastTime.target;
    else ({ target, reason, free } = resolve(d.at, d.end));
    const chosen = free ? plan.readings.find(r => r.dateKey.slice(5) === d.key) ?? null : target;
    if (!chosen || chosen.dateKey.slice(5) !== d.key) {
      issues.push({ kind: "date", at: d.at, end: d.end, expected: free ? undefined : target ?? undefined, reason: `date "${d.text}" ${reason || (target ? `is not the date in ${name(target)} (${target.dateKey})` : "cannot be verified")}` });
    }
  }

  if (plan.outcome === "answer" && plan.query.kind === "time") {
    for (const r of zones.values()) {
      if (!times.some(x => x.ok && x.target?.zone === r.zone)) issues.push({ kind: "missing", expected: r, reason: `no verified time for ${name(r)}` });
    }
  }
  if (plan.outcome === "answer" && plan.query.kind === "difference") {
    const [a, b] = plan.readings, want = Math.abs(a.offsetMinutes - b.offsetMinutes);
    const spans = [...t.matchAll(/(\d{1,2})\s*(?:hours?|hrs?|个小时|個小時|小时|小時|時間|horas?|час\p{L}*)(?:\s*(?:and\s+|y\s+)?(\d{1,2})\s*(?:minutes?|mins?|分钟|分鐘|分|minutos?|минут\p{L}*))?/gu)];
    for (const m of spans) {
      const got = +m[1] * 60 + (m[2] ? +m[2] : 0);
      if (got !== want) issues.push({ kind: "duration", reason: `difference "${m[0]}" is not ${duration(want, "en") || "0 minutes"}` });
    }
    if (!spans.length && !times.some(x => x.ok && x.target && zones.has(x.target.zone))) issues.push({ kind: "missing", reason: "no verified difference or time" });
  }
  return issues;
}

export interface Check { ok: boolean; problems: string[] }
// Does her reply agree with the verified values, place by place?
export function checkReply(reply: string, plan: TimePlan): Check {
  if (!plan.guard) return { ok: true, problems: [] };
  const problems = audit(reply, plan).map(i => i.reason);
  return { ok: problems.length === 0, problems };
}

const monthDay = (nowMs: number, zone: string, lang: Lang) =>
  new Intl.DateTimeFormat(LOCALE[lang], { timeZone: zone, month: "long", day: "numeric" }).format(new Date(nowMs));

// Her own words with only the wrong values corrected: a wrong time or date for a known place is swapped for the
// verified one, and a missing time is added after what she said. Anything that cannot be pinned to a place is not
// guessed at: it returns null and the whole verified answer is used instead.
function correctInPlace(reply: string, plan: TimePlan, issues: Issue[]): string | null {
  if (issues.some(i => i.kind === "duration" || ((i.kind === "time" || i.kind === "date") && !i.expected))) return null;
  const edits = issues.filter(i => i.kind === "time" || i.kind === "date");
  if (edits.length && fold(reply).length !== reply.length) return null; // positions would not line up
  const lang = detectLang(reply);
  let out = reply;
  for (const i of edits.sort((a, b) => b.at! - a.at!)) {
    const r = i.expected!;
    const value = i.kind === "time" ? (i.twelveHour ? h12(r) : r.hm) : monthDay(plan.nowMs, r.zone, lang);
    out = out.slice(0, i.at) + value + out.slice(i.end);
  }
  // A place whose wrong time was just corrected is no longer missing
  const fixedZones = new Set(edits.filter(i => i.kind === "time").map(i => i.expected!.zone));
  const missing = issues.filter(i => i.kind === "missing" && !(i.expected && fixedZones.has(i.expected.zone)));
  if (missing.length) {
    const added = plan.query.kind === "difference" ? verifiedBody(plan, lang)
      : missing.map(i => PHRASES[lang].time(label(i.expected!.place, lang), i.expected!, longDate(plan.nowMs, i.expected!.zone, lang))).join(lang === "en" || lang === "es" || lang === "ru" ? " " : "");
    out = out.trimEnd() + (/[぀-ヿ一-鿿。！？]$/.test(out.trimEnd()) ? "" : " ") + added;
  }
  return out;
}

// The safeguard. A reply that agrees with the verified values goes out as she wrote it. One with a wrong or missing
// value is corrected in place when every wrong value can be pinned to a place (her personality stays); otherwise it is
// replaced by the verified answer. Either way, what goes out is checked again and is never wrong.
export function enforceVerifiedTime(reply: string, plan: TimePlan, pick?: <T>(items: T[]) => T): { text: string; replaced: boolean; repaired: boolean; problems: string[] } {
  if (!plan.guard) return { text: reply, replaced: false, repaired: false, problems: [] };
  const issues = audit(reply, plan);
  if (!issues.length) return { text: reply, replaced: false, repaired: false, problems: [] };
  const problems = issues.map(i => i.reason);
  const corrected = correctInPlace(reply, plan, issues);
  if (corrected !== null && audit(corrected, plan).length === 0) return { text: corrected, replaced: true, repaired: true, problems };
  return { text: verifiedReply(plan, pick), replaced: true, repaired: false, problems };
}
