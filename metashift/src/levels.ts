import type { Expr, CharOpts } from './avatars';

export interface Line { who: 'D' | 'E'; text: string; face?: Expr; dface?: Expr; pause?: number }
export interface Level {
  day: number; store: string; title: string; challenge: string; dc: number;
  traffic: number; trafficSpeed: number; weather: 'clear' | 'rain' | 'night' | 'dusk';
  fuel: number; fuelStop: boolean; construction: number; pace: number;
  employee: CharOpts; empName: string; lines: Line[];
}

export const RENT = 1500;
export const BASE_PAY = 150;

export const LEVELS: Level[] = [
  {
    day: 1, store: 'grocery', title: 'Neighborhood Grocery', challenge: 'Easy streets, gentle turns, light traffic.', dc: 0,
    traffic: 8, trafficSpeed: 9, weather: 'clear', fuel: 0.9, fuelStop: false, construction: 0, pace: 5.5,
    empName: 'Greeter_0148', employee: { skin: 0xe0ac69, shirt: 0x3fbf6a, pants: 0x2a2f3a, hair: 0x3b2a1a, hat: 'cap', hatColor: 0x3fbf6a, name: 'Greeter_0148 · FreshLoop', nameColor: '#6dffb6' },
    lines: [
      { who: 'D', text: "Hey. I've got your grocery delivery.", dface: 'neutral' },
      { who: 'E', text: "Finally. The other driver overslept and didn't log into MetaShift this morning.", face: 'annoyed' },
      { who: 'D', text: "Yeah, that'll happen.", dface: 'tired' },
      { who: 'E', text: "We've had players complaining about the empty shelves all day.", face: 'neutral', pause: 0.6 },
      { who: 'E', text: "Funny thing is, I've still gotta go grocery shopping myself when I take this headset off.", face: 'tired' },
      { who: 'D', text: 'Well, at least somebody\'s getting groceries today.', dface: 'smile' },
    ],
  },
  {
    day: 2, store: 'electronics', title: 'Electronics Store', challenge: 'Busier intersections and tighter turns.', dc: 0,
    traffic: 16, trafficSpeed: 10, weather: 'clear', fuel: 0.85, fuelStop: false, construction: 0, pace: 6,
    empName: 'Cashier_3307', employee: { skin: 0xc68642, shirt: 0x3f8cff, pants: 0x1b1d24, hair: 0x111111, hat: 'visor', hatColor: 0x5ff2ff, name: 'Cashier_3307 · Voltage', nameColor: '#5ff2ff' },
    lines: [
      { who: 'D', text: 'Got a trailer full of electronics for you.' },
      { who: 'E', text: "Perfect. There's a new virtual headset going on sale tomorrow. Players have been asking about it all week.", face: 'smile' },
      { who: 'D', text: 'People buy VR headsets inside MetaShift?', dface: 'surprised' },
      { who: 'E', text: "Yeah. Apparently, there's another game you can play inside this one.", face: 'neutral' },
      { who: 'D', text: "You're kidding.", dface: 'surprised' },
      { who: 'E', text: 'Nope.', face: 'neutral', pause: 0.7 },
      { who: 'E', text: 'Anyway, I need the overtime. My actual headset\'s starting to fall apart.', face: 'tired' },
    ],
  },
  {
    day: 3, store: 'clothing', title: 'Clothing Store', challenge: 'Urban streets and a narrow delivery alley.', dc: 1,
    traffic: 16, trafficSpeed: 10, weather: 'clear', fuel: 0.85, fuelStop: false, construction: 0, pace: 6,
    empName: 'Stockroom_Mira', employee: { skin: 0xffdbac, shirt: 0xd64fd0, pants: 0x222244, hair: 0xb04a2a, longHair: true, hat: 'ears', hatColor: 0xff7ad9, jacket: 0x7a2a8a, name: 'Stockroom_Mira · Threadline', nameColor: '#ff7ad9' },
    lines: [
      { who: 'D', text: 'Where do you want the clothing shipment?' },
      { who: 'E', text: "Around back. We've got a big sale happening tonight.", face: 'neutral' },
      { who: 'D', text: 'Keeping you busy?' },
      { who: 'E', text: 'Too busy. Some player spent more on a virtual jacket yesterday than I made working all week.', face: 'annoyed' },
      { who: 'D', text: 'Must be nice.', dface: 'tired' },
      { who: 'E', text: "Yeah.", face: 'sad', pause: 0.8 },
      { who: 'E', text: "I'm saving up to buy my daughter a real winter coat.", face: 'sad' },
    ],
  },
  {
    day: 4, store: 'restaurant', title: 'Restaurant', challenge: 'Heavier traffic and a tight schedule.', dc: 2,
    traffic: 26, trafficSpeed: 11, weather: 'clear', fuel: 0.8, fuelStop: false, construction: 0, pace: 7.5,
    empName: 'LineCook_Dev', employee: { skin: 0x8d5524, shirt: 0xf2f2f2, pants: 0x2a2a2a, hair: 0x111111, hat: 'crown', name: 'LineCook_Dev · Byte\'s Diner', nameColor: '#ffb347' },
    lines: [
      { who: 'D', text: "I've got your food delivery." },
      { who: 'E', text: 'Thank goodness. We were about to run out of ingredients.', face: 'surprised' },
      { who: 'D', text: 'Busy lunch?' },
      { who: 'E', text: "Packed. I've been serving virtual meals for six hours, and I haven't eaten anything in real life.", face: 'tired' },
      { who: 'D', text: 'You should probably take a break.', dface: 'sad' },
      { who: 'E', text: "After the lunch rush. I can't afford to clock out yet.", face: 'tired' },
    ],
  },
  {
    day: 5, store: 'furniture', title: 'Furniture Store', challenge: 'A long haul. Low fuel: refuel on the way.', dc: 2,
    traffic: 16, trafficSpeed: 11, weather: 'clear', fuel: 0.16, fuelStop: true, construction: 0, pace: 7,
    empName: 'Showroom_Pat', employee: { skin: 0xf1c27d, shirt: 0xc9a35a, pants: 0x3a3226, hair: 0x9a9a9a, hat: 'halo', hatColor: 0xffe066, name: 'Showroom_Pat · Nestwell', nameColor: '#ffe066' },
    lines: [
      { who: 'D', text: 'Furniture delivery.' },
      { who: 'E', text: 'Great. A bunch of players bought new apartments this week.', face: 'smile' },
      { who: 'D', text: 'Business must be good.' },
      { who: 'E', text: 'For the company, sure. I spent yesterday arranging furniture in a virtual mansion.', face: 'neutral' },
      { who: 'D', text: 'Sounds relaxing.', dface: 'smile' },
      { who: 'E', text: "Then I took my headset off and sat down on a folding chair in my apartment.", face: 'tired', pause: 0.7 },
      { who: 'E', text: "Couldn't afford a couch.", face: 'sad' },
    ],
  },
  {
    day: 6, store: 'pharmacy', title: 'Pharmacy', challenge: 'Rain: poor visibility and longer braking.', dc: 1,
    traffic: 18, trafficSpeed: 9, weather: 'rain', fuel: 0.8, fuelStop: false, construction: 0, pace: 6.5,
    empName: 'Pharm_Tech_Yun', employee: { skin: 0xffdbac, shirt: 0x4fd6c8, pants: 0x2a3a3a, hair: 0x1a1a1a, hat: 'antenna', hatColor: 0x6dffb6, name: 'Pharm_Tech_Yun · PixelCare', nameColor: '#4fd6c8' },
    lines: [
      { who: 'D', text: "Sorry about the weather. I've got your shipment." },
      { who: 'E', text: "No problem. At least we're not actually getting wet.", face: 'smile' },
      { who: 'D', text: "There's that." },
      { who: 'E', text: 'My headset battery died halfway through my shift yesterday. The system marked me absent.', face: 'annoyed' },
      { who: 'D', text: 'Did they fix your pay?', dface: 'surprised' },
      { who: 'E', text: 'No. They said maintaining my equipment was my responsibility.', face: 'sad' },
      { who: 'D', text: 'Figures.', dface: 'tired' },
    ],
  },
  {
    day: 7, store: 'convenience', title: 'Convenience Store', challenge: 'Night driving on congested streets.', dc: 1,
    traffic: 28, trafficSpeed: 10, weather: 'night', fuel: 0.75, fuelStop: false, construction: 0, pace: 6.5,
    empName: 'NightClerk_Jo', employee: { skin: 0xe0ac69, shirt: 0xffd23f, pants: 0x1a1a2a, hair: 0x2a1a10, hat: 'beanie', hatColor: 0x3f8cff, build: 0.9, name: 'NightClerk_Jo · QuikLog', nameColor: '#ffd23f' },
    lines: [
      { who: 'D', text: 'Late-night delivery.' },
      { who: 'E', text: "You're not the only one working late.", face: 'tired' },
      { who: 'D', text: 'How long have you been on?' },
      { who: 'E', text: "Since I got home from school. I've still got homework to finish after this.", face: 'tired' },
      { who: 'D', text: 'Long day.', dface: 'sad' },
      { who: 'E', text: 'Yeah.', face: 'neutral', pause: 0.8 },
      { who: 'E', text: 'My friends log into MetaShift to hang out. I log in to pay for college.', face: 'sad' },
    ],
  },
  {
    day: 8, store: 'hardware', title: 'Hardware Store', challenge: 'Road construction, detours and tricky turns.', dc: 0,
    traffic: 20, trafficSpeed: 10, weather: 'clear', fuel: 0.8, fuelStop: false, construction: 3, pace: 7,
    empName: 'Builder_6604', employee: { skin: 0xc68642, shirt: 0xff8a3a, pants: 0x2a3a5a, hair: 0x111111, hat: 'cap', hatColor: 0xffd23f, jacket: 0xff8a3a, name: 'Builder_6604 · Blocksmith', nameColor: '#ff8a3a' },
    lines: [
      { who: 'D', text: 'Got your hardware shipment.' },
      { who: 'E', text: "Good. They're building another residential district. Everybody's buying supplies.", face: 'neutral' },
      { who: 'D', text: 'More players moving in?' },
      { who: 'E', text: 'Apparently. My landlord raised my real rent last month, though.', face: 'annoyed' },
      { who: 'D', text: 'Mine too.', dface: 'tired' },
      { who: 'E', text: 'Sometimes I think I spend more time living in here than in my actual apartment.', face: 'sad' },
    ],
  },
  {
    day: 9, store: 'department', title: 'Department Store', challenge: 'Heavy traffic. Back the trailer into the dock.', dc: 1,
    traffic: 34, trafficSpeed: 10, weather: 'clear', fuel: 0.8, fuelStop: false, construction: 0, pace: 7.5,
    empName: 'Associate_Rae', employee: { skin: 0x8d5524, shirt: 0xa77bff, pants: 0x1a1a1a, hair: 0x1a0a0a, longHair: true, hat: 'halo', hatColor: 0xc7a6ff, name: 'Associate_Rae · Grandview', nameColor: '#c7a6ff' },
    lines: [
      { who: 'D', text: 'Delivery for the department store.' },
      { who: 'E', text: "Thanks. Management's been watching our performance scores all week.", face: 'neutral' },
      { who: 'D', text: "They've been doing that to us drivers too.", dface: 'tired' },
      { who: 'E', text: "A customer reported me yesterday because I didn't smile enough.", face: 'annoyed' },
      { who: 'D', text: 'Seriously?', dface: 'surprised' },
      { who: 'E', text: 'Yeah. I was having a bad day in real life.', face: 'sad', pause: 0.7 },
      { who: 'E', text: "Apparently, that's not supposed to affect my avatar.", face: 'smile' },
    ],
  },
  {
    day: 10, store: 'supermarket', title: 'Supermarket', challenge: 'The longest route: dusk rain, detours, low fuel, heavy traffic.', dc: 0,
    traffic: 30, trafficSpeed: 10, weather: 'dusk', fuel: 0.2, fuelStop: true, construction: 2, pace: 7.5,
    empName: 'Receiving_Sam', employee: { skin: 0xf1c27d, shirt: 0xff4f6d, pants: 0x2a2a3a, hair: 0x6a4a2a, hat: 'none', name: 'Receiving_Sam · MegaMart', nameColor: '#ff7a8a' },
    lines: [
      { who: 'D', text: 'Last delivery.' },
      { who: 'E', text: 'Last one for today?', face: 'neutral' },
      { who: 'D', text: 'Yeah. Finally made enough to cover my rent.', dface: 'smile' },
      { who: 'E', text: "That's good. You taking tomorrow off?", face: 'smile' },
      { who: 'D', text: "Probably not. Electricity bill's coming up.", dface: 'tired' },
      { who: 'E', text: 'Yeah. I know how that goes.', face: 'tired', pause: 2.2 },
      { who: 'E', text: 'See you around.', face: 'neutral' },
      { who: 'D', text: 'See you.', dface: 'neutral' },
    ],
  },
];
