/**
 * AI Engineering Tracker — Storage Engine
 * Manages all localStorage operations for progress, gamification, and settings
 */

const STORAGE_KEY = 'ai-engineering-tracker';

function getDefaultState() {
  return {
    // Video completion tracking: { "python-1": true, "ml-5": true, ... }
    completedVideos: {},
    // Gamification
    xp: 0,
    gold: 0,
    goldSpent: 0,
    // Achievements unlocked: { "first-blood": "2024-01-15T10:30:00Z", ... }
    achievements: {},
    // Purchased rewards: { "theme-hacker": true, ... }
    purchasedRewards: {},
    // Active theme
    activeTheme: 'default',
    // Pomodoro stats
    pomodoroStats: {
      totalSessions: 0,
      todaySessions: 0,
      lastSessionDate: null,
    },
    // Streak
    streak: {
      current: 0,
      best: 0,
      lastActiveDate: null,
    },
    // Daily tasks completion: { "2024-01-15": { "watch-1": true } }
    dailyTasks: {},
    // Custom daily tasks
    customDailyTasks: [],
    // Settings
    settings: {
      pomodoroWork: 25,
      pomodoroShortBreak: 5,
      pomodoroLongBreak: 15,
      soundEnabled: true,
      userName: 'Engineer',
    },
    // Activity log for recent activity
    activityLog: [],
  };
}

/** Load full state from localStorage */
export function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to handle new properties
      return { ...getDefaultState(), ...parsed };
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return getDefaultState();
}

/** Save full state to localStorage */
export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

/** Toggle a video completion */
export function toggleVideo(videoId) {
  const state = loadState();
  if (state.completedVideos[videoId]) {
    delete state.completedVideos[videoId];
  } else {
    state.completedVideos[videoId] = true;
    // Add XP and gold
    state.xp += 10;
    state.gold += 5;
    // Log activity
    state.activityLog.unshift({
      type: 'video',
      videoId,
      timestamp: new Date().toISOString(),
    });
    if (state.activityLog.length > 50) state.activityLog = state.activityLog.slice(0, 50);
  }
  updateStreak(state);
  saveState(state);
  return state;
}

/** Mark all videos up to a certain index as complete */
export function markUpTo(playlistId, upToIndex, videos) {
  const state = loadState();
  for (let i = 0; i <= upToIndex; i++) {
    const vid = videos[i];
    if (!state.completedVideos[vid.id]) {
      state.completedVideos[vid.id] = true;
      state.xp += 10;
      state.gold += 5;
    }
  }
  updateStreak(state);
  saveState(state);
  return state;
}

/** Get completion count for a playlist */
export function getPlaylistProgress(playlistId, videos) {
  const state = loadState();
  let completed = 0;
  for (const v of videos) {
    if (state.completedVideos[v.id]) completed++;
  }
  return completed;
}

/** Get total completion count across all playlists */
export function getTotalCompleted() {
  const state = loadState();
  return Object.keys(state.completedVideos).length;
}

/** Check if a video is completed */
export function isVideoCompleted(videoId) {
  const state = loadState();
  return !!state.completedVideos[videoId];
}

/** Update streak logic */
function updateStreak(state) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  if (state.streak.lastActiveDate === today) return;
  
  if (state.streak.lastActiveDate === yesterday) {
    state.streak.current += 1;
  } else if (state.streak.lastActiveDate !== today) {
    state.streak.current = 1;
  }
  
  state.streak.lastActiveDate = today;
  if (state.streak.current > state.streak.best) {
    state.streak.best = state.streak.current;
  }
}

/** Get current level from XP */
export function getLevel(xp) {
  const thresholds = [
    0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800,
    4700, 5700, 6800, 8000, 9500, 11000, 13000, 15000, 17500, 20000,
  ];
  let level = 1;
  for (let i = 1; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i + 1;
    else break;
  }
  return level;
}

/** Get XP progress within current level */
export function getLevelProgress(xp) {
  const thresholds = [
    0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800,
    4700, 5700, 6800, 8000, 9500, 11000, 13000, 15000, 17500, 20000,
  ];
  const level = getLevel(xp);
  const currentThreshold = thresholds[level - 1] || 0;
  const nextThreshold = thresholds[level] || thresholds[thresholds.length - 1] + 5000;
  const progress = ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return Math.min(progress, 100);
}

/** Get level title */
export function getLevelTitle(level) {
  const titles = [
    'Newbie', 'Beginner', 'Apprentice', 'Student', 'Learner',
    'Developer', 'Practitioner', 'Engineer', 'Specialist', 'Expert',
    'Master', 'Guru', 'Wizard', 'Sage', 'Legend',
    'Architect', 'Visionary', 'Pioneer', 'Titan', 'AI God',
  ];
  return titles[Math.min(level - 1, titles.length - 1)];
}

/** Purchase a reward */
export function purchaseReward(rewardId, cost) {
  const state = loadState();
  if (state.gold < cost) return { success: false, message: 'Not enough gold!' };
  if (state.purchasedRewards[rewardId]) return { success: false, message: 'Already purchased!' };
  
  state.gold -= cost;
  state.goldSpent += cost;
  state.purchasedRewards[rewardId] = true;
  
  if (rewardId.startsWith('theme-')) {
    state.activeTheme = rewardId.replace('theme-', '');
  }
  
  saveState(state);
  return { success: true, state };
}

/** Complete a pomodoro session */
export function completePomodoroSession() {
  const state = loadState();
  const today = new Date().toISOString().split('T')[0];
  
  if (state.pomodoroStats.lastSessionDate !== today) {
    state.pomodoroStats.todaySessions = 0;
  }
  
  state.pomodoroStats.totalSessions += 1;
  state.pomodoroStats.todaySessions += 1;
  state.pomodoroStats.lastSessionDate = today;
  state.xp += 15;
  state.gold += 10;
  
  updateStreak(state);
  
  state.activityLog.unshift({
    type: 'pomodoro',
    timestamp: new Date().toISOString(),
  });
  if (state.activityLog.length > 50) state.activityLog = state.activityLog.slice(0, 50);
  
  saveState(state);
  return state;
}

/** Complete a daily task */
export function completeDailyTask(taskId, xp, gold) {
  const state = loadState();
  const today = new Date().toISOString().split('T')[0];
  
  if (!state.dailyTasks[today]) state.dailyTasks[today] = {};
  if (state.dailyTasks[today][taskId]) return state;
  
  state.dailyTasks[today][taskId] = true;
  state.xp += xp;
  state.gold += gold;
  updateStreak(state);
  saveState(state);
  return state;
}

/** Check if daily task is done today */
export function isDailyTaskDone(taskId) {
  const state = loadState();
  const today = new Date().toISOString().split('T')[0];
  return !!(state.dailyTasks[today] && state.dailyTasks[today][taskId]);
}

/** Check and unlock achievements */
export function checkAchievements(playlists) {
  const state = loadState();
  const newAchievements = [];
  const totalCompleted = Object.keys(state.completedVideos).length;
  
  // Helper to check playlist completion
  const isPlaylistDone = (pid) => {
    const pl = playlists.find(p => p.id === pid);
    if (!pl) return false;
    return pl.videos.every(v => state.completedVideos[v.id]);
  };
  
  const checks = {
    'firstVideo': totalCompleted >= 1,
    'playlistComplete-python': isPlaylistDone('python'),
    'playlistComplete-ml': isPlaylistDone('ml'),
    'playlistComplete-dl': isPlaylistDone('dl'),
    'playlistComplete-langchain': isPlaylistDone('langchain'),
    'playlistComplete-langgraph': isPlaylistDone('langgraph'),
    'playlistComplete-mcp': isPlaylistDone('mcp'),
    'playlistComplete-fastapi': isPlaylistDone('fastapi'),
    'streak-7': state.streak.current >= 7,
    'streak-30': state.streak.current >= 30,
    'totalProgress-50': totalCompleted >= 164,
    'pomodoros-50': state.pomodoroStats.totalSessions >= 50,
    'videosWatched-100': totalCompleted >= 100,
    'allComplete': playlists.every(p => isPlaylistDone(p.id)),
    'goldSpent-1000': state.goldSpent >= 1000,
    'level-10': getLevel(state.xp) >= 10,
  };
  
  // Import achievements from data
  const allAchievements = [
    { id: 'first-blood', condition: 'firstVideo' },
    { id: 'python-tamer', condition: 'playlistComplete-python' },
    { id: 'ml-master', condition: 'playlistComplete-ml' },
    { id: 'dl-destroyer', condition: 'playlistComplete-dl' },
    { id: 'chain-linker', condition: 'playlistComplete-langchain' },
    { id: 'agent-smith', condition: 'playlistComplete-langgraph' },
    { id: 'protocol-master', condition: 'playlistComplete-mcp' },
    { id: 'speed-demon', condition: 'playlistComplete-fastapi' },
    { id: 'week-warrior', condition: 'streak-7' },
    { id: 'month-master', condition: 'streak-30' },
    { id: 'halfway-there', condition: 'totalProgress-50' },
    { id: 'pomodoro-pro', condition: 'pomodoros-50' },
    { id: 'centurion', condition: 'videosWatched-100' },
    { id: 'ai-engineer', condition: 'allComplete' },
    { id: 'big-spender', condition: 'goldSpent-1000' },
    { id: 'level-10', condition: 'level-10' },
  ];
  
  for (const ach of allAchievements) {
    if (!state.achievements[ach.id] && checks[ach.condition]) {
      state.achievements[ach.id] = new Date().toISOString();
      newAchievements.push(ach.id);
    }
  }
  
  if (newAchievements.length > 0) {
    saveState(state);
  }
  
  return newAchievements;
}

/** Update settings */
export function updateSettings(newSettings) {
  const state = loadState();
  state.settings = { ...state.settings, ...newSettings };
  saveState(state);
  return state;
}

/** Reset all data */
export function resetAllData() {
  localStorage.removeItem(STORAGE_KEY);
  return getDefaultState();
}
