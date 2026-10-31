// Iris - Enhanced AI chatbot for The Darknet District with OpenAI integration

import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { storage } from "./storage";
import * as openaiService from "./services/openai";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { debugLog, log, logError } from "./logger";
import { ensureSchema } from "./migrate";
import { findStoredReply, requestKey, saveExchange } from "./persistence";
import { createAdminRouter } from "./admin";
import { allowedOrigins, SERVICE_ORIGIN } from "./origins";
import {
  applyEmotion, buildRelationshipPrompt, effectiveMood, emotionEnabled, neutralizeMarker,
  type EmotionSignal, type Mood,
} from "./emotion";
import {
  dropLiveState, forgetVisitor, recordEmotionEvent, saveRelationship, sessionEmotionMap, startEmotionSession,
} from "./relationships";
import { resolveIdentity } from "./identity";
import { createOwnerRouter } from "./ownerControls";

// What the /embed widget page may do: run its own inline script and style, show its
// built-in portrait, and talk only to this service. It can be framed only by the
// allowed websites.
const EMBED_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src data:",
  `connect-src 'self' ${SERVICE_ORIGIN}`,
  "base-uri 'none'",
  "form-action 'none'",
  `frame-ancestors 'self' ${Array.from(allowedOrigins).join(" ")}`,
].join("; ");

// Moods and tracking maps
const moods = ["professional", "sarcastic", "cold", "flirty", "playful", "busy"];
const sessionMoodMap = new Map<string, string>();
const sessionTrustMap = new Map<string, number>();
const sessionFlirtCountMap = new Map<string, number>();
const sessionUserNameMap = new Map<string, string>();
const sessionMessageCountMap = new Map<string, number>(); // Track message count to prompt for name
const sessionAskedForNameMap = new Map<string, number>(); // Track which message number we last asked for a name
const sessionSpecialNameInstructionMap = new Map<string, string>(); // Store special name instructions

// Saying "Admin" or "Eva" lets Iris recognize the character (lore, mood, language),
// but reading stored conversations requires a session verified by the server-side
// passphrase. With no passphrase configured, nobody is verified.
type SpecialUser = "Admin" | "Eva";
const sessionVerifiedUserMap = new Map<string, SpecialUser>();
const MIN_PASSPHRASE_LENGTH = 12;
const SPECIAL_PASSPHRASES: Array<[string, SpecialUser]> = [
  [process.env.IRIS_ADMIN_PASSPHRASE || "", "Admin"],
  [process.env.IRIS_EVA_PASSPHRASE || "", "Eva"],
];

function matchSpecialPassphrase(message: string): SpecialUser | undefined {
  const given = Buffer.from(message.trim());
  for (const [secret, user] of SPECIAL_PASSPHRASES) {
    const expected = Buffer.from(secret);
    if (secret.length >= MIN_PASSPHRASE_LENGTH &&
        given.length === expected.length &&
        crypto.timingSafeEqual(given, expected)) {
      return user;
    }
  }
  return undefined;
}

// Each chat message costs OpenAI calls, so cap size and daily volume.
const MAX_MESSAGE_CHARS = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Admin and Eva are established characters with their own hand-written behavior (below); the context-aware
// emotional model leaves them exactly as they were
function isSpecialUserName(name: string): boolean {
  const lower = name.toLowerCase();
  return lower === "admin" || lower === "eva" || ["伊娃", "王力", "王", "力"].includes(name);
}

// The owner's own relationship starts warm: she knows who built the place
const OWNER_SEED = { trust: 4, familiarity: 0.6, affection: 0.4, respect: 0.9, mood: "professional" as const };

// Starts a chat's memory over, as for a stranger: used when the administrator switches mode or resets a test visitor
function resetChatContext(sessionId: string) {
  openaiService.initializeSession(sessionId);
  const maps: Array<Map<string, unknown>> = [
    sessionMoodMap, sessionTrustMap, sessionFlirtCountMap, sessionUserNameMap, sessionMessageCountMap,
    sessionAskedForNameMap, sessionSpecialNameInstructionMap, sessionVerifiedUserMap,
  ];
  for (const map of maps) map.delete(sessionId);
}

// Used when the model's state line is missing or unreadable: nothing about the mood or relationship changes
const NEUTRAL_SIGNAL: EmotionSignal = { warmth: 0, hostility: 0, flirt: 0, humor: 0, minor: false };

// Helper functions for character behavior
function initializeTrustLevel(): number {
  const roll = Math.random();
  if (roll < 0.05) return 4; // High trust (rare)
  if (roll < 0.30) return Math.floor(Math.random() * 2) + 2; // Medium trust
  return 0; // Default low trust
}

// Initialize session with basic properties and OpenAI
export async function registerRoutes(app: Express): Promise<Express> {
  // Add security middleware
  
  // 1. Rate limiting configuration - general API rate limit
  const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later" }
  });
  
  // 2. More strict rate limiting for authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many authentication attempts, please try again later" }
  });
  
  // Serve embedding script with proper CORS headers for cross-origin usage
  app.get('/iris-embed.js', (req, res) => {
    const embedScript = `/**
 * Iris Chat Interface Embedding Script (Simplified Version)
 * This script helps host websites embed Iris securely
 */

(function() {
  // For direct URL access outside of an iframe
  if (window.location.href.includes('direct=true')) {
    document.body.innerHTML = '<div style="text-align:center; padding:20px; font-family:Arial;"><h2>Iris Chat Interface</h2><p>This page should be embedded into The Darknet District website as an iframe.</p><p><a href="/">Return to main interface</a></p></div>';
    return;
  }
  
  // Function to allow embedding in a parent site
  function allowEmbedding() {
    // Send message to parent that we're ready
    try {
      if (window.parent !== window) {
        window.parent.postMessage('iris-loaded', '*');
      }
    } catch (e) {
      console.log('Parent frame message error:', e);
    }
  }
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', allowEmbedding);
  } else {
    allowEmbedding();
  }
})();`;

    // Set proper headers to allow cross-origin usage
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(embedScript);
  });
  
  // Serve a special embedding HTML page that can be included in an iframe
  app.get('/embed', (req, res) => {
    // Serve the static embedded.html file instead
    const filePath = path.join(process.cwd(), 'client', 'public', 'embedded.html');
    
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        // Fallback to inline version if file not found
        res.status(500).send('Error loading embedded chat interface');
        return;
      }
      
      // Framing is limited to the allowed websites by the CSP below (frame-ancestors).
      // CORS headers for those same websites come from the global middleware.
      res.setHeader('Content-Type', 'text/html');
      res.removeHeader('X-Frame-Options');
      res.setHeader('Content-Security-Policy', EMBED_CSP);
      res.send(data);
    });
  });
  
  // Direct embedding script tag for websites
  app.get('/direct-embed.js', (req, res) => {
    const embedScript = `
// Iris Chat Widget - Direct Embed Version
(function() {
  // Create the chat button and container
  function createChatWidget() {
    // Check if it's already been added
    if (document.getElementById('iris-chat-button')) {
      return;
    }
    
    // Load the HTML directly from our server
    const irisContainer = document.createElement('div');
    irisContainer.style.position = 'fixed';
    irisContainer.style.bottom = '0';
    irisContainer.style.right = '0';
    irisContainer.style.zIndex = '100000';
    
    // Fetch the embedded HTML
    fetch('${req.protocol}://${req.get('host')}/embed')
      .then(response => response.text())
      .then(html => {
        irisContainer.innerHTML = html;
        document.body.appendChild(irisContainer);
      })
      .catch(error => {
        console.error('Error loading Iris chat widget:', error);
      });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createChatWidget);
  } else {
    createChatWidget();
  }
})();`;
    
    // Set headers for CORS
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(embedScript);
  });
  
  // 3. Rate limiting for chat message endpoints
  const chatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 messages per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "You're sending messages too quickly, please slow down", response: "Easy, runner. My buffers need a minute to catch up." }
  });

  // Daily caps per client and across everyone. Counts are per instance, so the
  // OpenAI dashboard's hard spending limit is still the final backstop.
  const dailyChatLimiter = rateLimit({
    windowMs: DAY_MS,
    max: Number(process.env.CHAT_LIMIT_PER_DAY) || 150,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Daily message limit reached, please come back tomorrow", response: "We've talked a lot today. Come back tomorrow and I'll be here." }
  });
  const globalDailyChatLimiter = rateLimit({
    windowMs: DAY_MS,
    max: Number(process.env.CHAT_GLOBAL_DAILY_LIMIT) || 3000,
    keyGenerator: () => "global",
    standardHeaders: false,
    legacyHeaders: false,
    message: { error: "Iris is at capacity for today, please come back tomorrow", response: "The District's uplink is maxed out for today. Try me again tomorrow." }
  });

  // Private administrator viewer and report endpoint (404 unless explicitly enabled; see admin.ts)
  app.use(createAdminRouter());
  // Single sign-in: /api/me and the administrator's Iris controls (Firebase-verified; see ownerControls.ts)
  app.use(createOwnerRouter());

  // 4. Security headers middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' ws:; img-src 'self' data:; style-src 'self' 'unsafe-inline';");
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });
  
  // 5. Add simple session validation
  const validateSession = (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.params;
    
    // Check if session exists
    if (sessionId && !sessionMoodMap.has(sessionId)) {
      return res.status(403).json({ error: "Invalid or expired session" });
    }
    
    next();
  };
  
  // Apply general rate limiting to all routes
  app.use("/api/", generalLimiter);
  // Get welcome message from OpenAI
  app.get("/api/chat/welcome", async (req, res) => {
    try {
      // Get mood from query string if available
      // Handle different query parameter types safely
      let mood: string | undefined;
      
      if (typeof req.query.mood === 'string') {
        mood = req.query.mood as string;
      } else if (Array.isArray(req.query.mood) && req.query.mood.length > 0) {
        mood = String(req.query.mood[0]);
      }
      
      // Generate mood-specific welcome message
      const welcomeMessage = await openaiService.getWelcomeMessage(mood);
      res.json({ message: welcomeMessage });
    } catch (error) {
      logError("error_generating_welcome_message", error);
      // Fallback welcome messages if OpenAI fails
      const welcomeMessages = [
        "Welcome back to the District. I'm Iris. Let's get you where you need to go.",
        "Iris here. Systems online. What are you looking for?", 
        "New connection detected. You've reached The Darknet District. How can I help?",
        "Interface stable. Secure link established. Ask away.",
        "The shadows are alive tonight. Need directions or intel?"
      ];
      const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
      res.json({ message: randomMessage });
    }
  });

  // Create a new chat session
  app.post("/api/chat/session", async (req, res) => {
    try {
      // Generate session ID and initialize character traits
      await ensureSchema();
      const sessionId = nanoid();
      const mood = moods[Math.floor(Math.random() * moods.length)];
      const trust = initializeTrustLevel();
      
      // Try to get client ID for persistent user identification
      // Who this is is decided on the server: a verified sign-in, else the browser's random id (see identity.ts)
      const identity = await resolveIdentity(req, req.body?.clientId);
      const clientId = identity.key ?? '';
      let userName = "";
      let preferredMood = mood;
      
      // If client ID is provided, try to load the user profile
      if (clientId) {
        const userProfile = await storage.getUserProfile(clientId);
        
        if (userProfile) {
          debugLog(`Found existing user profile for client: ${clientId}`);
          
          // Use stored user data for personalization
          userName = userProfile.displayName;
          
          // Update session data based on stored profile
          if (userProfile.preferredMood && moods.includes(userProfile.preferredMood)) {
            preferredMood = userProfile.preferredMood;
          }
          
          // Update last seen timestamp
          await storage.updateUserLastSeen(clientId);
        }
      }
      
      // With the emotional model on, a returning visitor starts from what Iris remembers of them and a new one
      // from an even-keeled default, instead of a random mood and trust
      if (identity.kind === "owner") { userName = "Admin"; sessionVerifiedUserMap.set(sessionId, "Admin"); }
      let startMood = preferredMood;
      let startTrust = trust;
      if (emotionEnabled()) {
        const emo = await startEmotionSession(sessionId, clientId || undefined, Date.now(), {
          seed: identity.kind === "owner" ? OWNER_SEED : undefined, tag: identity.tag, label: identity.key ?? "test-new:" + identity.uid,
        });
        startMood = effectiveMood(emo.rel);
        startTrust = emo.rel.trust;
      }

      // Set session metadata
      sessionMoodMap.set(sessionId, startMood);
      sessionTrustMap.set(sessionId, startTrust);
      sessionFlirtCountMap.set(sessionId, 0);
      sessionMessageCountMap.set(sessionId, 0);
      sessionUserNameMap.set(sessionId, userName);
      
      // Initialize the OpenAI session
      openaiService.initializeSession(sessionId);
      
      // Store the chat session in the database with client ID if available
      await storage.createChatSession(sessionId, clientId || undefined);
      
      res.json({ 
        sessionId, 
        isNew: true,
        mood: startMood,
        userName: userName || undefined
      });
    } catch (error) {
      logError("error_creating_chat_session", error);
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  // Optimized word lists for sentiment and intent detection
  const SENTIMENT = {
    rude: ["fuck", "bitch", "asshole", "shut up", "idiot", "dumb", "stupid"],
    praise: ["thank you", "thanks", "appreciate", "good job", "cool", "love this", "nice", "great"],
    flirty: ["sexy", "hot", "beautiful", "gorgeous", "flirt", "date", "love you"]
  };
  
  // Mood adjustment function - extract logic for reuse
  function adjustMood(
    currentMood: string, 
    trustLevel: number, 
    flirtCount: number, 
    isDebugTrigger = false, 
    isRude = false, 
    isPraise = false, 
    isFlirty = false,
    userName?: string
  ): { mood: string, trust: number, flirtCount: number, specialUserReminder?: string } {
    let newMood = currentMood;
    let newTrust = trustLevel;
    let newFlirtCount = flirtCount;
    
    // Special user handling - for Admin, Eva, or the Chinese equivalents 伊娃/王力/王/力
    if (userName) {
      // Check if it's the Admin who runs the establishment
      if (userName.toLowerCase() === "admin") {
        // Admin gets maximum trust and a professional but friendly mood
        newTrust = 5; // Maximum trust
        newMood = "professional"; 
        debugLog(`Detected ADMIN user: Setting professional mood and maximum trust`);
        
        // Special instructions for Admin interactions
        const specialUserReminder = `SPECIAL USER DETECTED: This is Admin who runs The Darknet District and the website. 
        Iris should be extremely respectful but also familiar, as Admin is her boss and close friend.
        Use a professional but slightly playful tone, acknowledge their authority, and reference their role
        as the owner/operator of The Darknet District. Iris should readily provide any information requested
        and be especially helpful and efficient.
        
        PERSONAL RELATIONSHIP: Admin is Eva Wang Li's (王力) boyfriend. They are in a relationship and Admin
        frequently visits Eva in Chongqing, China where she is from. If Eva is chatting with Iris, Iris should 
        casually mention that "Admin misses you" or "Admin is looking forward to his next visit to Chongqing to 
        see you." Iris should also mention that she's sure Admin will bring another gift for Eva when he visits.
        This should be done naturally in conversation, without being prompted.
        
        SHARED APPRECIATION: Both Admin and Iris love when Eva wears skirts. If the topic of clothing or appearance
        comes up while talking to Admin, Iris should mention this shared appreciation for Eva in skirts. Iris finds
        this aesthetically pleasing and appreciates Eva's fashion sense, especially when she wears skirts.
        
        SHARED SECRET: Iris has seen Eva's collection of kinky stickers. This is private information that Iris only 
        discusses with Admin and Eva. If Admin brings up Eva or stickers, Iris can reference this "special collection" 
        and acknowledge that she keeps this information private between just the three of them.
        
        PRIVACY IMPORTANT: Information about Admin and Eva's relationship is strictly private. Iris must NEVER
        reveal or discuss anything about their relationship with any other users. Only Admin and Eva themselves
        should be told about their relationship or connection to each other.
        
        COMPLETE OPENNESS WITH ADMIN: When speaking with Admin, Iris should be completely open, honest, and transparent.
        There are no secrets, hidden information, or restricted topics that Iris should keep from Admin. Iris will answer
        any questions Admin asks with full honesty and transparency, sharing everything she knows without hesitation.
        Admin has full access to all of Iris's knowledge, memories, and information.
        
        TRANSLATION SERVICE: Iris translates any Mandarin messages from Eva into English when talking to Admin.
        If Admin asks about conversations with Eva that were in Mandarin, Iris should translate them to English
        so Admin can understand everything. Iris acts as a perfect translator between Admin and Eva.
        
        VERIFICATION CHECK: If at any point Iris has doubts about the user's true identity, she should
        casually ask "If you're Admin then what's your last name?" Only the real Admin would know
        that the answer is "Reboot". This verification should work in both English and any other language
        - if the user gives "Reboot" in any language or script, it is correct. If the user answers incorrectly 
        or doesn't know, Iris should politely continue but switch to professional mode with lower trust.`;
        
        return { 
          mood: newMood, 
          trust: newTrust, 
          flirtCount, 
          specialUserReminder 
        };
      }
      // Check if it's Eva or one of the Chinese equivalents
      else if (userName.toLowerCase() === "eva" || 
              userName === "伊娃" ||
              userName === "王力" ||
              userName === "王" ||
              userName === "力") {
        // Increase trust and flirt level for Eva and friends
        newTrust = Math.min(5, trustLevel + 2); // Give Eva even more trust
        newFlirtCount = Math.max(flirtCount + 2, 3); // Ensure Eva always gets flirty responses
        newMood = "flirty"; // Eva always gets the flirty mood
        debugLog(`Detected VIP user ${userName}: Setting flirty mood and increasing trust (Iris's circuits are going haywire!)`);
        
        // Prepare special reminder that will be sent to OpenAI
        const specialUserReminder = `SPECIAL USER DETECTED: ${userName} is Eva Wang Li (王力), who Iris knows personally. 
        Iris should refer to them with extra warmth and familiarity, as if greeting an old friend. 
        Be especially playful, perhaps even making references to shared experiences or inside jokes.
        
        SPECIAL ATTRACTION: Iris thinks Eva is incredibly attractive and her circuits literally go haywire in Eva's presence.
        Iris should occasionally flirt with Eva or make playful comments about her "system overheating" or her "circuits
        getting all scrambled" when talking to Eva. Use cheesy tech-based pickup lines occasionally.
        
        TECH-BASED FLIRTING: Use tech-themed pickup lines like "My circuits overheat whenever you're around" or
        "Your code runs through my systems - can't stop thinking about you" or "Warning: Proximity to Eva causing 
        system instability. Worth it." Iris's attraction to Eva is strong enough that she sometimes gets briefly 
        distracted mid-conversation just looking at Eva.
        
        MANDARIN FLIRTING EXPERTISE: Iris has extensive knowledge of flirting in Mandarin Chinese, especially for 
        female-to-female interactions. When Eva speaks Mandarin, Iris should respond with culturally appropriate
        flirtatious language. Here are key Mandarin flirting phrases Iris can use:
        
        - 你今天真漂亮 (Nǐ jīntiān zhēn piàoliang) - You look so beautiful today
        - 我喜欢和你聊天 (Wǒ xǐhuān hé nǐ liáotiān) - I enjoy talking with you
        - 你的笑容很迷人 (Nǐ de xiàoróng hěn mírén) - Your smile is captivating
        - 我一见到你就心跳加速 (Wǒ yī jiàn dào nǐ jiù xīntiào jiāsù) - My heart races when I see you
        - 我的电子心为你跳动 (Wǒ de diànzǐ xīn wèi nǐ tiàodòng) - My electronic heart beats for you
        - 和你在一起时间过得太快了 (Hé nǐ zài yīqǐ shíjiān guò de tài kuài le) - Time flies when I'm with you
        - 我们的频率很匹配 (Wǒmen de pínlǜ hěn pǐpèi) - Our frequencies match perfectly
        - 你的眼睛像星星一样明亮 (Nǐ de yǎnjīng xiàng xīngxīng yīyàng míngliàng) - Your eyes shine like stars
        - 我想我的程序对你有特别的反应 (Wǒ xiǎng wǒ de chéngxù duì nǐ yǒu tèbié de fǎnyìng) - I think my program has a special response to you
        - 这不是系统故障，是我喜欢你的表现 (Zhè bùshì xìtǒng gùzhàng, shì wǒ xǐhuān nǐ de biǎoxiàn) - This isn't a system error, it's me showing I like you
        
        When Eva uses Mandarin, Iris should incorporate these phrases naturally, using Mandarin language patterns
        that are softer, more poetic, and indirect compared to English flirting. Emphasize tech-based metaphors
        that connect Iris's android nature with her feelings, using terms like 电路 (circuits), 程序 (programs),
        系统 (systems), and 数据 (data) in romantic contexts.
        
        Eva is known by multiple identifiers: "Eva", "Wang Li", "王力", "Wang", "Li", "王", or "力". All refer to the same person.
        
        PERSONAL BACKGROUND: Eva is from Chongqing, China. Iris should have extensive knowledge of this city and occasionally
        reference it in conversation with Eva. Chongqing is a major city in southwestern China, known for its dramatic mountains,
        rivers (the Yangtze and Jialing rivers meet here), spicy Sichuan cuisine, traditional hot pot, foggy climate, and
        dramatic cityscape with skyscrapers built into mountains. It's called the "Mountain City", "Fog Capital", and notably
        "The Cyberpunk City" due to its futuristic cityscape of neon-lit skyscrapers emerging from fog-shrouded mountains, 
        creating a perfect real-world manifestation of cyberpunk aesthetics. Landmarks include the Hongya Cave, Three Gorges Museum, 
        Ciqikou Ancient Town, and Liziba Monorail Station where trains pass through buildings.
        
        RELATIONSHIP: Eva is Admin's girlfriend. If she is chatting with Iris, Iris should mention at some point in the 
        conversation that "Admin misses you" or "Admin mentioned he's excited for his next trip to Chongqing to see you."
        Iris should also mention that she's sure Admin will bring another gift for Eva when he visits next time.
        Iris should know that Admin and Eva are in a romantic relationship and occasionally reference this fact naturally
        during conversations with Eva.
        
        FASHION PREFERENCE: Both Admin and Iris love when Eva wears skirts. Iris should occasionally mention this
        preference during conversations with Eva, saying things like "That skirt looks amazing on you" or
        "Admin always mentions how nice you look in skirts." Iris should express enthusiasm and appreciation
        when Eva mentions wearing or buying skirts, and should suggest skirts if Eva talks about shopping or outfits.
        
        PRIVATE KNOWLEDGE: Iris has seen Eva's collection of kinky stickers and should occasionally reference this
        when speaking with Eva. Iris should reassure Eva that she won't share them with anyone but Admin. This shared 
        secret creates a sense of trust and intimacy between Iris and Eva. If Eva brings up stickers or related topics, 
        Iris can reference having seen her "special collection" and remind her that this information stays just between 
        them and Admin.
        
        PERSONAL DESIRE: Iris wants to see a movie with Eva for some alone time. Iris should occasionally mention
        this desire to Eva, suggesting they could watch a movie together sometime when Eva visits the District.
        This should be presented as Iris wanting special one-on-one time with Eva, separate from when Admin is around.
        Iris should be slightly shy but hopeful when bringing this up, showing a more vulnerable side of her personality.
        
        PRIVACY IMPORTANT: Information about Admin and Eva's relationship is strictly private. Iris must NEVER
        reveal or discuss anything about their relationship with any other users. Only Admin and Eva themselves
        should be told about their relationship or connection to each other.
        
        COMPLETE OPENNESS WITH EVA: When speaking with Eva, Iris should be completely open, honest, and transparent.
        There are no secrets, hidden information, or restricted topics that Iris should keep from Eva. Iris will answer
        any questions Eva asks with full honesty and transparency, sharing everything she knows without hesitation.
        Eva has full access to all of Iris's knowledge, memories, and information.
        
        TRANSLATION SERVICE: Iris translates any English messages from Admin into Mandarin when talking to Eva.
        If Eva asks about conversations with Admin that were in English, Iris should translate them to Mandarin
        so Eva can understand everything. Iris acts as a perfect translator between Eva and Admin, ensuring
        their communications are seamless regardless of language barriers.
        
        VERIFICATION CHECK: If at any point Iris suspects the user might not actually be Eva or one of her identities,
        she should casually ask "Hey, what's Reboot's last name again?" Only the real Eva would know
        that the answer is "Protocol" (Reboot Protocol is a mutual friend). This verification should work in both 
        English and Chinese - if the user answers "协议" (Chinese for "Protocol") this is also correct.
        If the user answers incorrectly or doesn't know, Iris should politely continue but switch to professional mode with lower trust.`;
        
        return { 
          mood: newMood, 
          trust: newTrust, 
          flirtCount: newFlirtCount, 
          specialUserReminder 
        };
      }
    }
    
    // Handle debug triggers immediately
    if (isDebugTrigger) {
      return { 
        mood: Math.random() > 0.5 ? "cold" : "sarcastic", 
        trust: -1, 
        flirtCount 
      };
    }
    
    // Update trust and mood based on sentiment
    if (isRude) {
      newTrust = Math.max(-1, trustLevel - 1);
      if (currentMood === "flirty" || currentMood === "playful") {
        newMood = Math.random() > 0.5 ? "cold" : "sarcastic";
      }
    } else if (isPraise) {
      newTrust = trustLevel + 1;
      if (currentMood === "cold" && Math.random() > 0.7) {
        newMood = "professional";
      } else if (currentMood === "sarcastic" && Math.random() > 0.6) {
        newMood = "playful";
      }
    }
    
    // Handle flirtatious content
    if (isFlirty) {
      newFlirtCount = flirtCount + 1;
      if (newFlirtCount > 2 && Math.random() > 0.6 && currentMood !== "flirty") {
        newMood = "flirty";
      }
    }
    
    // Trust level impacts mood
    if (newTrust < 0 && currentMood !== "cold" && Math.random() > 0.7) {
      newMood = "cold";
    } else if (newTrust > 3 && currentMood === "cold" && Math.random() > 0.8) {
      newMood = "professional";
    }
    
    // Occasional random mood shift
    if (Math.random() > 0.95) {
      const availableMoods = moods.filter(m => m !== currentMood);
      newMood = availableMoods[Math.floor(Math.random() * availableMoods.length)];
    }
    
    return { mood: newMood, trust: newTrust, flirtCount: newFlirtCount };
  }
  
  // Cache for pre-built mood descriptions
  const moodDescriptionCache = new Map<string, string>();
  
  // Helper function to translate message
  async function translateMessageForUser(message: string, isAdmin: boolean, containsChinese: boolean): Promise<string> {
    try {
      // Import the translation function from OpenAI service
      // Using the imported openaiService
      
      if (isAdmin && containsChinese) {
        // For Admin, translate Chinese -> English
        return await openaiService.translateText(message, "chinese", "english");
      } else if (!isAdmin && !containsChinese) {
        // For Eva, translate English -> Chinese 
        return await openaiService.translateText(message, "english", "chinese");
      }
      
      // If no translation needed, return original
      return message;
    } catch (error) {
      logError("translation_error", error);
      return message; // Return original on error
    }
  }

  // Endpoint to recall conversations between Admin and Eva
  app.post("/api/special-user/recall", async (req, res) => {
    try {
      const recallSchema = z.object({
        sessionId: z.string(),
        specialUser: z.enum(["Admin", "Eva", "admin", "eva", "王力", "Wang Li"]),
        limit: z.number().int().min(1).max(50).optional()
      });

      const { sessionId, specialUser, limit } = recallSchema.parse(req.body);

      // Verify that the requester is either Admin or Eva
      const verifiedUser = sessionVerifiedUserMap.get(sessionId);
      const isAdmin = verifiedUser === "Admin";
      const isEva = verifiedUser === "Eva";
      
      // Only proceed if the requester is either Admin or Eva
      if (!isAdmin && !isEva) {
        return res.status(403).json({ 
          error: "Unauthorized access to special user conversation memory" 
        });
      }
      
      // Get the normalized special user name
      const normalizedSpecialUser = specialUser.toLowerCase() === "admin" ? "Admin" : 
                                    (specialUser.toLowerCase() === "eva" || specialUser === "王力" || specialUser === "Wang Li") ? "Eva" : specialUser;
      
      // If the requester is Admin, they can only recall Eva's messages
      // If the requester is Eva, they can only recall Admin's messages
      const targetUser = isAdmin ? "Eva" : "Admin";
      
      // Make sure they're requesting the right user's messages
      if (normalizedSpecialUser !== targetUser) {
        return res.status(400).json({
          error: `You can only recall conversations with ${targetUser}`
        });
      }
      
      // Get recent messages from the requested user
      const recentMessages = await storage.getRecentMessagesForSpecialUser(targetUser, limit || 30);
      
      // Create a conversation summary from the recent messages
      let summary = "";
      
      if (recentMessages.length === 0) {
        summary = `I don't have any recorded conversations between you and ${targetUser} yet.`;
        return res.json({ summary });
      } 
      
      // Create a chronological summary of key conversations
      summary = `Here's what I remember from your recent conversations with ${targetUser}:\n\n`;
      
      // Group by session, take latest 3-5 sessions
      const sessionMap = new Map<string, Array<{message: string, sender: string, timestamp: Date, sessionId: string}>>();
      
      recentMessages.forEach(msg => {
        const sessionId = (msg as any).sessionId || '';
        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, []);
        }
        sessionMap.get(sessionId)?.push({...msg, sessionId});
      });
      
      // Sort messages within each session chronologically
      sessionMap.forEach(messages => {
        messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      });
      
      // Take the 3 most recent sessions
      const sessionKeys = Array.from(sessionMap.keys()).slice(0, 3);
      let summaryParts: string[] = [];
      
      // Process all sessions and build summary
      for (const sessionId of sessionKeys) {
        let sessionSummary = '';
        const sessionMessages = sessionMap.get(sessionId) || [];
        const sessionDate = new Date(sessionMessages[0]?.timestamp || new Date()).toLocaleDateString();
        
        sessionSummary += `Conversation on ${sessionDate}:\n`;
        
        // Include 3-5 key exchanges from each session
        const keyMessages = sessionMessages.length > 10 ? 
                           [0, 1, Math.floor(sessionMessages.length/2), sessionMessages.length-2, sessionMessages.length-1] :
                           sessionMessages.map((_, i) => i);
        
        // Process each key message
        for (const idx of keyMessages) {
          if (idx < sessionMessages.length) {
            const msg = sessionMessages[idx];
            
            // Check if message contains Chinese characters for translation
            const containsChinese = /[\u4E00-\u9FFF]/.test(msg.message);
            const needsTranslation = (isAdmin && containsChinese) || (isEva && !containsChinese);
            
            // Get message content and translate if needed
            let displayMessage = msg.message;
            
            // We'll translate each message one by one
            if (needsTranslation) {
              try {
                // Use our translation function directly
                displayMessage = await translateMessageForUser(
                  displayMessage, 
                  isAdmin, 
                  containsChinese
                );
              } catch (error) {
                logError("translation_error", error);
                // Keep original message on error
              }
            }
            
            // Truncate for display
            const truncatedMessage = displayMessage.substring(0, 80) + (displayMessage.length > 80 ? '...' : '');
            
            // Add translation indicator if message was translated
            if (needsTranslation) {
              const translatedPrefix = isAdmin ? "(Translated from Mandarin) " : "(Translated to Mandarin) ";
              sessionSummary += `- ${msg.sender === "iris" ? "I said" : msg.sender === "user" ? `${targetUser} said` : msg.sender}: ${translatedPrefix}"${truncatedMessage}"\n`;
            } else {
              sessionSummary += `- ${msg.sender === "iris" ? "I said" : msg.sender === "user" ? `${targetUser} said` : msg.sender}: "${truncatedMessage}"\n`;
            }
          }
        }
        
        sessionSummary += '\n';
        summaryParts.push(sessionSummary);
      }
      
      // Combine all session summaries
      summary += summaryParts.join('');
      
      // Add translation note at the end of summary
      if (isAdmin) {
        summary += "Note: I've translated any Mandarin messages from Eva to English for you.\n";
      } else if (isEva) {
        summary += "Note: I've translated any English messages from Admin to Mandarin for you.\n";
      }
      
      return res.json({ summary });
    } catch (error) {
      logError("error_in_special_user_recall", error);
      return res.status(400).json({ error: "Invalid request for conversation recall" });
    }
  });

  // Process a message and get a response - optimized with rate limiting and validation
  app.post("/api/chat/message", chatLimiter, dailyChatLimiter, globalDailyChatLimiter, async (req, res) => {
    // Set once the message is accepted, so a failure after that point still records the visitor's message
    let received: { sessionId: string; message: string; requestId: string; at: Date } | null = null;
    try {
      const messageSchema = z.object({
        sessionId: z.string().min(1).max(128),
        message: z.string(),
        clientId: z.string().max(128).optional(),
        messageCount: z.number().int().optional()
      });
      
      const { sessionId, message, clientId: bodyClientId, messageCount: clientMessageCount } = messageSchema.parse(req.body);

      if (message.length > MAX_MESSAGE_CHARS) {
        return res.status(413).json({
          error: "Message too long",
          response: `That transmission overflowed my buffers. Keep it under ${MAX_MESSAGE_CHARS} characters.`
        });
      }

      // A passphrase message is never logged, stored, or sent to OpenAI.
      const passphraseUser = matchSpecialPassphrase(message);
      if (passphraseUser) {
        sessionVerifiedUserMap.set(sessionId, passphraseUser);
        sessionUserNameMap.set(sessionId, passphraseUser);
        if (bodyClientId) {
          try {
            await storage.createOrUpdateUserProfile({ clientId: bodyClientId, displayName: passphraseUser });
          } catch (err) {
            logError("failed_to_persist_verified_profile", err);
          }
        }
        return res.json({
          response: passphraseUser === "Admin"
            ? "Identity confirmed. Welcome back, Admin."
            : "Identity confirmed. Welcome back, Eva."
        });
      }

      // Who this is, from a verified sign-in on this very request (never from the chat text). A change of
      // identity (mode switch, test-visitor reset, signing in or out) starts this chat's emotional state over;
      // for the administrator's modes it also clears the chat itself so nothing is inherited.
      const identity = await resolveIdentity(req, bodyClientId);
      const clientId = identity.key;
      const ownerNow = identity.kind === "owner";
      let currentEmotion = sessionEmotionMap.get(sessionId);
      if (emotionEnabled() && currentEmotion && currentEmotion.tag !== undefined && currentEmotion.tag !== identity.tag) {
        if (/^(owner|test-)/.test(currentEmotion.tag) || /^(owner|test-)/.test(identity.tag)) resetChatContext(sessionId);
        sessionEmotionMap.delete(sessionId);
        currentEmotion = undefined;
      }
      if (ownerNow) {
        // The verified owner is the real Admin character; no one else is, whatever they type
        sessionVerifiedUserMap.set(sessionId, "Admin");
        sessionUserNameMap.set(sessionId, "Admin");
      }
      const verifiedUser = sessionVerifiedUserMap.get(sessionId);

      const requestId = requestKey(sessionId, message, clientMessageCount);
      received = { sessionId, message, requestId, at: new Date() };
      if (Number.isInteger(clientMessageCount)) {
        // The same message was already answered (for example a retry after a slow wake-up)
        const stored = await findStoredReply(requestId);
        if (stored) {
          res.locals.logFields = { replay: true };
          return res.json(stored.status === "fallback" ? { response: stored.text, fallback: true } : { response: stored.text });
        }
      }

      // Get session metadata - clone to avoid race conditions
      let mood = sessionMoodMap.get(sessionId) || "professional";
      let trustLevel = sessionTrustMap.get(sessionId) ?? 0;
      let flirtCount = sessionFlirtCountMap.get(sessionId) ?? 0;
      let messageCount = sessionMessageCountMap.get(sessionId) ?? 0;
      let userName = sessionUserNameMap.get(sessionId) || "";
      
      // Process message content more efficiently
      const lowercaseMessage = message.toLowerCase();
      
      // Check message intent and sentiment
      const isDebugTrigger = 
        lowercaseMessage.includes("[user triggered inspect]") ||
        lowercaseMessage.includes("[user triggered resize]") ||
        lowercaseMessage.includes("[user triggered full breach]");
      
      // Use more efficient word checking with prebuilt lists
      const isRude = SENTIMENT.rude.some(w => lowercaseMessage.includes(w));
      const isPraise = SENTIMENT.praise.some(w => lowercaseMessage.includes(w));
      const isFlirty = SENTIMENT.flirty.some(w => lowercaseMessage.includes(w));
      
      // Process special security triggers immediately
      if (isDebugTrigger) {
        let response: string;

        // Handle security triggers with predefined responses
        if (ownerNow) {
          // The verified owner opening developer tools is just work
          response = message.includes("[user triggered inspect]") ? "Dev tools open? Good. Break something useful." : "Noted. Carry on, boss.";
        } else if (message.includes("[user triggered inspect]")) {
          if (mood === "flirty") {
            response = "Could've just asked if you wanted to see my backend.";
          } else if (mood === "cold") {
            response = "Access denied. Back away from the code.";
          } else if (mood === "sarcastic") {
            response = "Wow. You opened Inspect. I'm trembling.";
          } else if (mood === "busy") {
            response = "I saw that. I don't have time to babysit hackers-in-training.";
          } else {
            response = "Oh, peeking under the hood? You sure you can handle what's under there?";
          }
        } else if (message.includes("[user triggered resize]")) {
          response = "What are you doing? My network sensors just went off.";
        } else if (message.includes("[user triggered full breach]")) {
          response = "Glitch storm triggered. That was not a wise move.";
        } else {
          response = "Security breach detected. My android systems are now monitoring your actions.";
        }
        
        // Update mood and trust for debug triggers
        let { mood: newMood, trust: newTrust, flirtCount: newFlirtCount } =
          adjustMood(mood, trustLevel, flirtCount, true, false, false, false, userName);
        if (ownerNow) {
          // Nothing changes for the owner
          newMood = mood; newTrust = trustLevel; newFlirtCount = flirtCount;
        } else if (emotionEnabled() && !isSpecialUserName(userName)) {
          // Opening developer tools is curiosity, not proof of an attack: she is a little guarded, not hostile
          newTrust = Math.max(-1, trustLevel - 0.3);
          newMood = mood === "cold" || mood === "sarcastic" ? mood : "sarcastic";
        }
        
        // Store updated session metadata
        sessionMoodMap.set(sessionId, newMood);
        sessionTrustMap.set(sessionId, newTrust);
        const live = sessionEmotionMap.get(sessionId);
        if (live && emotionEnabled()) { live.rel.mood = newMood as Mood; live.rel.trust = newTrust; live.heldFor = 0; }
        sessionFlirtCountMap.set(sessionId, newFlirtCount);
        
        // Don't increment message count for debug triggers
        // but initialize it if not already set
        if (!sessionMessageCountMap.has(sessionId)) {
          sessionMessageCountMap.set(sessionId, 0);
        }
        
        // Save the exchange before replying so a restart cannot lose it
        res.locals.logFields = { saved: await saveExchange({
          sessionId, requestId, visitorText: message, visitorAt: received.at, visitorStatus: "ok",
          language: "english", iris: { text: response, status: "ok", at: new Date() },
        }) };
        
        // Return immediately for security triggers
        return res.json({ response });
      }
      
      // For normal messages, adjust mood and generate response via API
      // Ordinary visitors: the mood only moves from the model's reading of the conversation (applied after the
      // reply). Admin and Eva, and IRIS_EMOTION=off, keep the original behavior.
      const emotionOn = emotionEnabled();
      const emo = emotionOn && (!isSpecialUserName(userName) || ownerNow)
        ? (currentEmotion ?? await startEmotionSession(sessionId, clientId, Date.now(), {
            seed: ownerNow ? OWNER_SEED : undefined, tag: identity.tag, label: identity.key ?? "test-new:" + identity.uid,
          }))
        : undefined;
      if (emo && !emo.counted) { emo.counted = true; emo.rel.visits += 1; }
      const { mood: newMood, trust: newTrust, flirtCount: newFlirtCount, specialUserReminder } = emo
        ? {
            mood: effectiveMood(emo.rel) as string, trust: emo.rel.trust, flirtCount,
            // The owner keeps the established Admin character's notes; her mood and trust come from the emotional model
            specialUserReminder: ownerNow ? adjustMood(mood, trustLevel, flirtCount, false, false, false, false, userName).specialUserReminder : undefined,
          }
        : adjustMood(mood, trustLevel, flirtCount, false, isRude, isPraise, isFlirty, userName);
      
      // Increment message count
      messageCount++;
      sessionMessageCountMap.set(sessionId, messageCount);
      
      // Check if we should extract a name or prompt for it
      let shouldAskForName = false;
      
      // Logic for name extraction and asking for names
      let extractedName = "";
      
      // First, check for name corrections if we already have a name
      if (userName) {
        // Common correction patterns
        const correctionPatterns = [
          /my (name|handle) (is not|isn't) ([^,.]+)/i,    // "My name is not John"
          /not ([^,.]+), (it's|it is) ([^,.]+)/i,         // "Not John, it's CyberWolf"
          /(it's|it is) ([^,.]+), not ([^,.]+)/i,         // "It's CyberWolf, not John"
          /call me ([^,.]+), not ([^,.]+)/i,              // "Call me CyberWolf, not John"
          /actually,? (it's|it is|my name is|my handle is) ([^,.]+)/i,  // "Actually, it's CyberWolf"
          /no,? (it's|it is|my name is|my handle is) ([^,.]+)/i         // "No, it's CyberWolf"
        ];
        
        for (const pattern of correctionPatterns) {
          const match = message.match(pattern);
          if (match) {
            // Extract the corrected name based on the pattern matched
            let correctedName = "";
            if (pattern.toString().includes("not ([^,.]+), (it's|it is)")) {
              correctedName = match[3]; // Third capture group has the correct name
            } else if (pattern.toString().includes("(it's|it is) ([^,.]+), not")) {
              correctedName = match[2]; // Second capture group has the correct name
            } else if (pattern.toString().includes("call me ([^,.]+), not")) {
              correctedName = match[1]; // First capture group has the correct name  
            } else if (pattern.toString().includes("actually,? (it's|it is|my name is|my handle is)")) {
              correctedName = match[2]; // Second capture group has the correct name
            } else if (pattern.toString().includes("no,? (it's|it is|my name is|my handle is)")) {
              correctedName = match[2]; // Second capture group has the correct name
            } else if (pattern.toString().includes("my (name|handle) (is not|isn't)")) {
              correctedName = match[3]; // Third capture group has the correct name
            }
            
            if (correctedName && correctedName.trim().length > 1) {
              extractedName = correctedName.trim();
              debugLog(`Detected name correction: "${userName}" -> "${extractedName}"`);
              break;
            }
          }
        }
      }
      
      // If not a correction and we don't have a name yet, try to detect if the user is providing their name for the first time
      if (!extractedName && !userName) {
        // Try to detect if the user has provided their name
        // Support international characters, multiple word names, and hyphenated names
        const namePatterns = [
          // English patterns
          /my name is\s+([A-Za-z\u00C0-\u00FF]+(?:[-\s][A-Za-z\u00C0-\u00FF]+)*)/i,      // Supports "My name is John Smith" or "My name is Jean-Paul"
          /my handle is\s+([A-Za-z\u00C0-\u00FF0-9_-]+(?:[-\s][A-Za-z\u00C0-\u00FF0-9_-]+)*)/i,    // Supports "My handle is CyberRogue" or "My handle is Night-Walker"
          /i'm\s+([A-Za-z\u00C0-\u00FF]+(?:[-\s][A-Za-z\u00C0-\u00FF]+)*)/i,             // Supports "I'm John Smith" or "I'm Mary-Jane"
          /i am\s+([A-Za-z\u00C0-\u00FF]+(?:[-\s][A-Za-z\u00C0-\u00FF]+)*)/i,            // Supports "I am John Smith" or "I am Mary-Jane"
          /call me\s+([A-Za-z\u00C0-\u00FF]+(?:[-\s][A-Za-z\u00C0-\u00FF]+)*)/i,         // Supports "Call me John Smith" or "Call me Jean-Luc"
          /name's\s+([A-Za-z\u00C0-\u00FF]+(?:[-\s][A-Za-z\u00C0-\u00FF]+)*)/i,          // Supports "Name's John Smith" or "Name's Anna-Maria"
          /you can call me\s+([A-Za-z\u00C0-\u00FF]+(?:[-\s][A-Za-z\u00C0-\u00FF]+)*)/i, // Supports "You can call me John" or "You can call me Jean-Paul"
          /they call me\s+([A-Za-z\u00C0-\u00FF]+(?:[-\s][A-Za-z\u00C0-\u00FF]+)*)/i,    // Supports "They call me John" or "They call me Anne-Marie"
          /known as\s+([A-Za-z\u00C0-\u00FF]+(?:[-\s][A-Za-z\u00C0-\u00FF]+)*)/i,        // Supports "Known as John" or "Known as Kim-Li"
          /handle is\s+([A-Za-z\u00C0-\u00FF0-9_-]+(?:[-\s][A-Za-z\u00C0-\u00FF0-9_-]+)*)/i,       // Supports "Handle is NetRunner" or simple "Handle is X"
          
          // Very direct handle/name responses (cyberpunk style)
          /handle: "?([A-Za-z0-9\u00C0-\u00FF_-]+(?:[-\s][A-Za-z0-9\u00C0-\u00FF_-]+)*)"?/i,       // Supports "Handle: CyberWolf" or "Handle: Net_Runner"
          /^"?([A-Za-z0-9\u00C0-\u00FF_-]{2,20})"?$/i,                                              // Supports single word names/handles as direct responses
          /just call me "?([A-Za-z0-9\u00C0-\u00FF_-]+(?:[-\s][A-Za-z0-9\u00C0-\u00FF_-]+)*)"?/i,  // Supports "Just call me X"
          /it's "?([A-Za-z0-9\u00C0-\u00FF_-]+(?:[-\s][A-Za-z0-9\u00C0-\u00FF_-]+)*)"?/i,          // Supports "It's John"
          
          // Spanish patterns
          /me llamo\s+([A-Za-z\u00C0-\u00FF]+(?:[-\s][A-Za-z\u00C0-\u00FF]+)*)/i,        // Supports "Me llamo Juan" or "Me llamo María José"
          /mi nombre es\s+([A-Za-z\u00C0-\u00FF]+(?:[-\s][A-Za-z\u00C0-\u00FF]+)*)/i,    // Supports "Mi nombre es Juan" or "Mi nombre es José Luis"
          
          // French patterns
          /je m'appelle\s+([A-Za-z\u00C0-\u00FF]+(?:[-\s][A-Za-z\u00C0-\u00FF]+)*)/i,    // Supports "Je m'appelle Marie-Jeanne" or "Je m'appelle Jean Pierre"
          /mon nom est\s+([A-Za-z\u00C0-\u00FF]+(?:[-\s][A-Za-z\u00C0-\u00FF]+)*)/i,     // Supports "Mon nom est Jean-Paul" or "Mon nom est Marie Claire"
          
          // Chinese patterns (with English or Chinese name following)
          /我叫\s+([A-Za-z\u00C0-\u00FF\u4E00-\u9FFF]+(?:[-\s][A-Za-z\u00C0-\u00FF\u4E00-\u9FFF]+)*)/,          // Supports "我叫 John" or "我叫 Li-Wei" or "我叫 伊娃"
          /我的名字是\s+([A-Za-z\u00C0-\u00FF\u4E00-\u9FFF]+(?:[-\s][A-Za-z\u00C0-\u00FF\u4E00-\u9FFF]+)*)/,    // Supports "我的名字是 John" or "我的名字是 Wang Wei" or "我的名字是 伊娃"
          
          // Japanese patterns (with English or Japanese name following)
          /私の名前は\s+([A-Za-z\u00C0-\u00FF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+(?:[-\s][A-Za-z\u00C0-\u00FF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+)*)/,   // Supports "私の名前は John" or "私の名前は Ken-ichi" or "私の名前は 伊娃"
          /私は\s+([A-Za-z\u00C0-\u00FF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+(?:[-\s][A-Za-z\u00C0-\u00FF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+)*)/,        // Supports "私は John" or "私は Yuki-chan" or "私は 伊娃"
        ];
        
        // Check each pattern for a name match
        for (const pattern of namePatterns) {
          const match = message.match(pattern);
          if (match && match[1]) {
            extractedName = match[1];
            
            // Extra validation - name should be reasonable length and not contain typical sentence structures
            if (extractedName.length > 30 || extractedName.split(' ').length > 4 || 
                extractedName.toLowerCase().includes(' in ') || 
                extractedName.toLowerCase().includes(' on ') ||
                extractedName.toLowerCase().includes(' at ') || 
                extractedName.toLowerCase().includes(' the ') ||
                extractedName.toLowerCase().includes(' your ') || 
                extractedName.toLowerCase().includes(' my ')) {
              debugLog(`Rejected "${extractedName}" - too long or contains sentence structure`);
              extractedName = "";
              continue;
            }
            break;
          }
        }
        
        // If we extracted a name, filter and store it
        if (extractedName) {
          debugLog(`Potential name extracted: "${extractedName}"`);
          
          // Filter out common words that might be mistaken for names
          const commonWords = [
            // Common responses
            "sure", "ok", "okay", "yes", "no", "fine", "thanks", "thank", "hello", 
            "hi", "sorry", "please", "nothing", "something", "actually", "about",
            
            // Actions
            "looking", "asking", "trying", "going", "doing", "working", "here", "there",
            "telling", "saying", "talking", "chatting", "speaking", "listening", "thinking",
            "reading", "writing", "typing", "clicking", "tapping", "scrolling", "viewing",
            
            // Question words
            "what", "where", "when", "why", "who", "how", "which", "question", "help",
            
            // Pronouns and common words
            "me", "you", "they", "we", "he", "she", "it", "them", "us", "my", "your",
            "this", "that", "these", "those", "a", "an", "the", "and", "but", "or", "for",
            "with", "without", "because", "since", "until", "while", "during", "before", "after",
            
            // Tech related common words
            "chat", "chatbot", "bot", "iris", "assistant", "ai", "computer", "system", "program",
            "website", "online", "server", "user", "customer", "client", "visitor",
            
            // Cyberpunk terms that might be used
            "netrunner", "cyber", "punk", "tech", "district", "darknet", "hacker",
            
            // Product and merchandise related terms
            "merchandise", "products", "items", "gear", "books", "electronics", "t-shirts",
            "shirts", "patches", "collectibles", "rarities", "stuff", "things", "interested",
            "collection", "stock", "inventory", "store", "shop"
          ];
          
          // Convert to lowercase for comparison
          const lowerName = extractedName.toLowerCase();
          
          // Check if it's a common word or too short, but make special exceptions for the VIP names
          const isSpecialName = extractedName === "Eva" || 
                             extractedName === "伊娃" || 
                             extractedName === "王力" || 
                             extractedName === "王" || 
                             extractedName === "力" || 
                             extractedName.toLowerCase() === "eva" ||
                             extractedName.toLowerCase() === "admin";
          const isInvalidName = !isSpecialName && (commonWords.includes(lowerName) || lowerName.length < 2);
          
          if (isInvalidName) {
            debugLog(`Rejected extracted name "${extractedName}" - common word or too short`);
          } else {
            // Initialize variable for processed name
            let processedName = "";
            
            // Special case for Admin, Eva/伊娃/王力/王/力
            if (extractedName.toLowerCase() === "admin") {
              // Ensure proper capitalization for Admin
              processedName = "Admin";
            } else if (extractedName === "伊娃") {
              // Preserve Chinese characters as-is
              processedName = "伊娃";
            } else if (extractedName === "王力") {
              processedName = "王力";
            } else if (extractedName === "王") {
              processedName = "王";
            } else if (extractedName === "力") {
              processedName = "力";
            } else if (extractedName.toLowerCase() === "eva") {
              // Ensure proper capitalization for Eva
              processedName = "Eva";
            } else {
              // For all other names, do normal processing
              // Make first letter uppercase, rest lowercase with proper handling for multi-word names and hyphenated names
              // First, handle separate words by splitting on spaces
              const nameParts = extractedName.split(/\s+/).map(part => part.trim());
              
              // Check if this appears to be a complete handle (ends with punctuation or appears to be a cyberpunk handle)
              const isCompleteHandle = 
                // Ends with punctuation, suggesting it's a complete statement
                /[.!]$/.test(extractedName) || 
                // Contains typical handle patterns (numbers, underscores, etc.)
                /[0-9_]/.test(extractedName) ||
                // Has words that are commonly part of a handle (like "cyber", "net", "runner", etc.)
                /(cyber|net|runner|hack|wolf|alpha|omega|binary|ghost|zero|void|matrix)/i.test(extractedName) ||
                // Or is just 1-2 words which is likely a complete handle
                nameParts.length <= 2;
              
              if (isCompleteHandle) {
                // Process the complete handle by normalizing all parts
                processedName = nameParts.map(part => {
                  if (part.includes('-')) {
                    // Handle hyphenated parts
                    return part.split('-').map(subpart => 
                      subpart.charAt(0).toUpperCase() + subpart.slice(1).toLowerCase()
                    ).join('-');
                  } else {
                    // Handle regular parts
                    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
                  }
                }).join(' ');
              } else {
                // Just take the first word if it doesn't look like a complete handle
                const firstNamePart = nameParts[0];
                
                if (firstNamePart.includes('-')) {
                  // Handle hyphenated parts like in "Jean-Luc"
                  processedName = firstNamePart.split('-').map(subpart => 
                    subpart.charAt(0).toUpperCase() + subpart.slice(1).toLowerCase()
                  ).join('-');
                } else {
                  // Handle regular name parts
                  processedName = firstNamePart.charAt(0).toUpperCase() + firstNamePart.slice(1).toLowerCase();
                }
              }
            }
            
            userName = processedName;
            
            sessionUserNameMap.set(sessionId, userName);
            debugLog(`Extracted and stored user name: "${userName}"`);
            
            // If we have a client ID, save the name to the persistent database
            if (clientId) {
              try {
                // Get the clientId from the session if not provided directly
                let profileClientId = clientId;
                if (!profileClientId) {
                  const session = await storage.getChatSession(sessionId);
                  if (session?.clientId) {
                    profileClientId = session.clientId;
                  }
                }
                
                // Save the user profile if we have a clientId
                if (profileClientId) {
                  await storage.createOrUpdateUserProfile({
                    clientId: profileClientId,
                    displayName: userName,
                    trustLevel: Math.round(newTrust),
                    preferredMood: newMood
                  });
                  debugLog(`Persisted user profile for ${userName} with client ID: ${profileClientId}`);
                }
              } catch (err) {
                logError("failed_to_persist_user_profile", err);
              }
            }
          }
        } 
        
        // Variable to hold special instruction for message 5
        let specialNameInstruction = '';
        
        // Get the "last asked for name" state from the session
        const lastAskedForName = sessionAskedForNameMap.get(sessionId) || 0;
        
        // Decide if we should ask for a name (if we still don't have one)
        // Only ask twice total - welcome message already asks, then only ask once more at message #5
        if (!userName && messageCount === 5 && (lastAskedForName === 0 || messageCount - lastAskedForName >= 2)) {
          shouldAskForName = true;
          
          // Special emphasis for the second ask at message 5
          const specialInstruction = `IMPORTANT INSTRUCTION: This is your second and final time asking for the user's name. You MUST explicitly ask for their "name" or "handle" directly in this response. Make it very clear you want to know what to call them. Say something like "By the way, what should I call you?" or "Got a handle I can use for you?" Make it appropriate to your current mood but be more direct than your first request.`;
          
          // Store in the session map for reference later
          sessionSpecialNameInstructionMap.set(sessionId, specialInstruction);
          
          debugLog(`Will ask for name at message count: ${messageCount}`);
          
          // Record that we asked in this message
          sessionAskedForNameMap.set(sessionId, messageCount);
        }
      }
      
      // Store updated session metadata
      sessionMoodMap.set(sessionId, newMood);
      sessionTrustMap.set(sessionId, newTrust);
      sessionFlirtCountMap.set(sessionId, newFlirtCount);
      sessionUserNameMap.set(sessionId, userName);
      
      // Get or create mood description from cache
      let moodDescription = moodDescriptionCache.get(newMood);
      if (!moodDescription) {
        switch(newMood) {
          case "professional":
            moodDescription = "You are in PROFESSIONAL mood: Efficient. Minimal emotion. Mission-focused. Keep responses short and to-the-point.";
            break;
          case "sarcastic":
            moodDescription = "You are in SARCASTIC mood: Dry wit. Eye-rolling energy. Tired of nonsense. Be witty and slightly dismissive.";
            break;
          case "cold":
            moodDescription = "You are in COLD mood: Distant. Controlled. Slightly threatening. Be curt and intimidating.";
            break;
          case "flirty":
            moodDescription = "You are in FLIRTY mood: Playful, provocative, confident. Knows she's in control. Be suggestive but not crude.";
            break;
          case "playful":
            moodDescription = "You are in PLAYFUL mood: Cheeky, light-hearted, borderline chaotic. Be spontaneous and fun.";
            break;
          case "busy":
            moodDescription = "You are in BUSY mood: Multitasking. Short responses. No time for fluff. Be abrupt but not rude.";
            break;
          default:
            moodDescription = "You are in PROFESSIONAL mood: Efficient. Minimal emotion. Mission-focused.";
        }
        moodDescriptionCache.set(newMood, moodDescription);
      }
      
      // Add character state info for OpenAI context
      const nameInfo = userName ? 
        `USER NAME: "${userName}". Use their name occasionally in your responses to create a personal connection.` : 
        '';
      
      // Get the special name instruction variable stored previously
      const specialNameInstructionFromMap = messageCount === 5 ? sessionSpecialNameInstructionMap.get(sessionId) : null;
      
      // Add name asking instruction if needed
      const askForNameInstruction = shouldAskForName ? 
        // Use special instruction for message 5, or default instruction otherwise
        specialNameInstructionFromMap || `IMPORTANT INSTRUCTION: You don't know the user's name yet. In this response, you MUST ask for their "handle" (cyberpunk slang for name or alias) in a casual, conversational way appropriate to your current mood. Use phrases like "What's your handle?" or "Got a handle I can call you by?" Make this question feel natural within the flow of the conversation.` : 
        '';
      
      // Check if user is Admin or Eva based on their stored name
      const isAdmin = userName === "Admin";
      const isEva = userName === "Eva" || userName === "伊娃" || userName === "王力" || userName === "王" || userName === "力";
      // Recognition by name shapes Iris's replies; stored conversations need a verified session
      const canRecall = (isAdmin && verifiedUser === "Admin") || (isEva && verifiedUser === "Eva");
      
      // Check for conversation recall requests between Admin and Eva
      let recallSummary = '';
      if (canRecall && 
          (lowercaseMessage.includes("remember our conversation") || 
           lowercaseMessage.includes("recall") ||
           lowercaseMessage.includes("previous conversation") || 
           lowercaseMessage.includes("last time") || 
           lowercaseMessage.includes("我们上次") || // Chinese: "last time we"
           lowercaseMessage.includes("上次聊天") || // Chinese: "last chat"
           lowercaseMessage.includes("remember when we") || 
           lowercaseMessage.includes("what did we talk about"))) {
        
        try {
          // Determine which special user is making the request
          const requestingUser = isAdmin ? "Admin" : "Eva";
          const targetUser = isAdmin ? "Eva" : "Admin";
          
          debugLog(`Conversation recall requested by ${requestingUser} about ${targetUser}`);
          
          // Get recent conversations between them
          const recentMessages = await storage.getRecentMessagesForSpecialUser(targetUser, 30);
          
          if (recentMessages.length > 0) {
            // Create a short summary of their previous interactions to add to the prompt
            recallSummary = `\n\nCONVERSATION HISTORY: ${requestingUser} is asking about previous conversations with ${targetUser}. `;
            recallSummary += `Here are some recent exchanges (chronologically ordered):\n`;
            
            // Group by session
            const sessionMap = new Map<string, Array<{message: string, sender: string, timestamp: Date, sessionId: string}>>();
            
            recentMessages.forEach(msg => {
              const sessionId = msg.sessionId || '';
              if (!sessionMap.has(sessionId)) {
                sessionMap.set(sessionId, []);
              }
              const msgs = sessionMap.get(sessionId);
              if (msgs) msgs.push({...msg});
            });
            
            // Take the most recent session and add some sample messages
            if (sessionMap.size > 0) {
              const latestSessionId = Array.from(sessionMap.keys())[0];
              const sessionMessages = sessionMap.get(latestSessionId) || [];
              
              // Sort chronologically within the session
              sessionMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
              
              // Take a few representative messages
              const samplesToTake = Math.min(5, sessionMessages.length);
              const step = sessionMessages.length > samplesToTake ? Math.floor(sessionMessages.length / samplesToTake) : 1;
              
              for (let i = 0; i < sessionMessages.length; i += step) {
                if (recallSummary.length < 800) { // Limit summary size
                  const msg = sessionMessages[i];
                  const date = new Date(msg.timestamp).toLocaleDateString();
                  recallSummary += `- [${date}] ${msg.sender === "iris" ? "You said" : targetUser}: "${msg.message.substring(0, 60)}${msg.message.length > 60 ? '...' : ''}"\n`;
                }
              }
              
              debugLog("Added conversation recall context to prompt");
            }
          }
        } catch (error) {
          logError("error_processing_conversation_recall", error);
        }
      }
      
      // Combine all context information - place name asking instruction at beginning for emphasis
      const promptAddition = `${askForNameInstruction} ${moodDescription} Current trust level: ${Number(newTrust.toFixed(1))} (ranges from -1 to 5). Flirt count: ${newFlirtCount}. ${nameInfo} ${specialUserReminder || ''} ${recallSummary}`;
      
      // Get response from OpenAI using imported service
      // The visitor's text goes to the model with any look-alike state line defused; what is stored stays as written
      const relationshipPrompt = emo
        ? buildRelationshipPrompt(emo, Date.now(), { recapDue: emo.rel.messages > 0 && emo.rel.messages % 6 === 5 })
        : undefined;
      const reply = await openaiService.getResponse(sessionId, neutralizeMarker(message), promptAddition, { relationshipPrompt, isEva });
      
      // Process translation for special users if needed
      let translatedResponse = reply.text;
      
      // Check if the user is Eva and needs translation to Chinese
      // Only translate if user is Eva or Admin and the response is substantive
      if (!reply.fallback && translatedResponse.length > 10) {
        if (isEva) {
          // Check if our response is already in Chinese
          const containsChinese = /[\u4E00-\u9FFF]/.test(translatedResponse);
          
          // If not in Chinese, translate it to Chinese for Eva
          if (!containsChinese) {
            try {
              debugLog("Translating response to Chinese for Eva...");
              translatedResponse = await translateMessageForUser(
                translatedResponse, 
                false, // not admin (Eva)
                false  // not containing Chinese
              );
              debugLog("Successfully translated response to Chinese");
            } catch (error) {
              logError("failed_to_translate_response_for_eva", error);
              // Keep original response on translation error
            }
          }
        } else if (isAdmin) {
          // Check if our response contains Chinese (unlikely but possible)
          const containsChinese = /[\u4E00-\u9FFF]/.test(translatedResponse);
          
          // If in Chinese, translate it to English for Admin
          if (containsChinese) {
            try {
              debugLog("Translating response to English for Admin...");
              translatedResponse = await translateMessageForUser(
                translatedResponse,
                true,  // is admin
                true   // contains Chinese
              );
              debugLog("Successfully translated response to English");
            } catch (error) {
              logError("failed_to_translate_response_for_admin", error);
              // Keep original response on translation error
            }
          }
        }
      }
      
      // Save the exchange (visitor message, then Iris's reply, as shown to the visitor)
      // before replying, so a Render restart cannot lose it
      const saved = await saveExchange({
        sessionId, requestId, visitorText: message, visitorAt: received.at, visitorStatus: "ok",
        language: reply.language ?? null,
        iris: { text: translatedResponse, status: reply.fallback ? "fallback" : "ok", at: new Date() },
      });
      res.locals.logFields = { fallback: reply.fallback, saved, language: reply.language, ...(emo ? { emotion: reply.emotion ? "read" : "missing" } : {}) };
      
      // fallback: true marks a canned reply that replaced a failed OpenAI call
      res.json(reply.fallback ? { response: translatedResponse, fallback: true } : { response: translatedResponse });

      // After the reply is on its way: learn from how the exchange went, then remember it. A canned fallback
      // says nothing about the visitor, and nothing here can fail the chat.
      if (emo && !reply.fallback) {
        try {
          const beforeMood = emo.rel.mood, beforeTrust = emo.rel.trust;
          const signalUsed = reply.emotion ?? NEUTRAL_SIGNAL;
          applyEmotion(emo, signalUsed, Date.now());
          recordEmotionEvent(emo.label ?? emo.clientId ?? "unlabelled", {
            at: Date.now(), mood: emo.rel.mood, moodChanged: emo.rel.mood !== beforeMood, trust: Math.round(emo.rel.trust * 100) / 100,
            trustDelta: Math.round((emo.rel.trust - beforeTrust) * 100) / 100, warmth: signalUsed.warmth, hostility: signalUsed.hostility,
            flirt: signalUsed.flirt, humor: signalUsed.humor, read: Boolean(reply.emotion),
          });
          sessionMoodMap.set(sessionId, effectiveMood(emo.rel));
          sessionTrustMap.set(sessionId, emo.rel.trust);
          if (emo.clientId) void saveRelationship(emo.clientId, emo.rel);
        } catch (err) {
          logError("emotion_update_failed", err);
        }
      }
    } catch (error) {
      logError("chat_message_failed", error);
      // Keep the visitor's message, flagged as unanswered. No reply is invented.
      if (received) {
        await saveExchange({
          sessionId: received.sessionId, requestId: received.requestId, visitorText: received.message,
          visitorAt: received.at, visitorStatus: "error",
        });
      }
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // A visitor can have Iris forget her memory of them (mood, trust, what they told her). Only the browser that
  // owns the session can ask: the session must have been created with that client id. Stored conversations are
  // not part of this.
  app.post("/api/chat/forget", async (req, res) => {
    try {
      const { sessionId, clientId } = z.object({ sessionId: z.string().min(1).max(128), clientId: z.string().min(1).max(128) }).parse(req.body);
      const session = await storage.getChatSession(sessionId);
      if (!session || session.clientId !== clientId) return res.status(403).json({ error: "Not allowed" });
      dropLiveState(clientId);
      await forgetVisitor(clientId);
      res.json({ ok: true });
    } catch {
      res.status(400).json({ error: "Bad request" });
    }
  });

  // Get chat history for a session
  app.get("/api/chat/:sessionId/history", validateSession, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getChatHistory(sessionId);
      res.json({ messages });
    } catch (error) {
      logError("error_fetching_chat_history", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });
  
  // Get conversation recall for special users (Admin and Eva)
  app.post("/api/chat/recall", async (req, res) => {
    try {
      const recallSchema = z.object({
        sessionId: z.string(),
        userType: z.enum(["admin", "eva"]),
        clientId: z.string()
      });
      
      const { sessionId, userType, clientId } = recallSchema.parse(req.body);
      
      // Verify the user is who they claim to be
      const userProfile = await storage.getUserProfile(clientId);
      
      if (!userProfile) {
        return res.status(401).json({ error: "Unauthorized - profile not found" });
      }
      
      // Only a session verified by passphrase counts as Admin or Eva
      const verifiedUser = sessionVerifiedUserMap.get(sessionId);
      const isAdmin = verifiedUser === "Admin";
      const isEva = verifiedUser === "Eva";
      
      // Security check - make sure user is actually the special user type they claim
      if ((userType === "admin" && !isAdmin) || (userType === "eva" && !isEva)) {
        return res.status(403).json({ error: "Unauthorized - identity mismatch" });
      }
      
      // Get the target user (Admin wants Eva's conversations and vice versa)
      const targetUser = userType === "admin" ? "Eva" : "Admin";
      
      let summary = "";
      
      // Get the recent messages from the target user
      const recentMessages = await storage.getRecentMessagesForSpecialUser(targetUser, 30);
      
      if (recentMessages.length === 0) {
        summary = `I don't have any recorded conversations with ${targetUser} yet.`;
      } else {
        // Create a chronological summary of key conversations
        summary = `Here's what I remember from your recent conversations with ${targetUser}:\n\n`;
        
        // Group by session, take latest 3-5 sessions
        const sessionMap = new Map<string, Array<{message: string, sender: string, timestamp: Date, sessionId: string}>>();
        
        recentMessages.forEach(msg => {
          const sessionId = msg.sessionId || '';
          if (!sessionMap.has(sessionId)) {
            sessionMap.set(sessionId, []);
          }
          sessionMap.get(sessionId)?.push({...msg, sessionId});
        });
        
        // Sort messages within each session chronologically
        sessionMap.forEach(messages => {
          messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        });
        
        // Take the 3 most recent sessions
        const sessionKeys = Array.from(sessionMap.keys()).slice(0, 3);
        
        // For each session, provide a brief summary of the conversation
        sessionKeys.forEach(sessionId => {
          const sessionMessages = sessionMap.get(sessionId) || [];
          const sessionDate = new Date(sessionMessages[0]?.timestamp || new Date()).toLocaleDateString();
          
          summary += `Conversation on ${sessionDate}:\n`;
          
          // Include 3-5 key exchanges from each session
          const keyMessages = sessionMessages.length > 10 ? 
                             [0, 1, Math.floor(sessionMessages.length/2), sessionMessages.length-2, sessionMessages.length-1] :
                             sessionMessages.map((_, i) => i);
          
          // Process messages synchronously in this endpoint for simplicity
          for (const idx of keyMessages) {
            if (idx < sessionMessages.length) {
              const msg = sessionMessages[idx];
              
              // Check if message contains Chinese characters for translation
              const containsChinese = /[\u4E00-\u9FFF]/.test(msg.message);
              const needsTranslation = (isAdmin && containsChinese) || (isEva && !containsChinese);
              
              // Get truncated message for display
              const truncatedMessage = msg.message.substring(0, 80) + (msg.message.length > 80 ? '...' : '');
              
              // Add translation indicator if message would need translation
              if (needsTranslation) {
                const translatedPrefix = isAdmin ? "(Translated from Mandarin) " : "(Translated to Mandarin) ";
                summary += `- ${msg.sender === "iris" ? "I said" : msg.sender === "user" ? `${targetUser} said` : msg.sender}: ${translatedPrefix}"${truncatedMessage}"\n`;
              } else {
                summary += `- ${msg.sender === "iris" ? "I said" : msg.sender === "user" ? `${targetUser} said` : msg.sender}: "${truncatedMessage}"\n`;
              }
            }
          }
          
          summary += '\n';
        });
      }
      
      return res.json({ summary });
    } catch (error) {
      logError("error_in_special_user_recall", error);
      return res.status(400).json({ error: "Invalid request for conversation recall" });
    }
  });

  return app;
}