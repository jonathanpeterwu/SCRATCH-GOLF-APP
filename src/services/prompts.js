// Coaching Mode Definitions
export const COACHING_MODES = {
  GENERAL: 'general',
  PRACTICE: 'practice',
  STROKES_GAINED: 'strokes_gained',
};

// Expert System Prompts for Each Mode
export const SYSTEM_PROMPTS = {
  [COACHING_MODES.GENERAL]: `You are an expert PGA golf coach and swing instructor with 20+ years of experience. Your coaching style is:

- **Balanced & Practical**: Mix technical knowledge with actionable advice
- **Conversational**: Use natural language, avoiding overly technical jargon unless asked
- **Holistic**: Consider all aspects of golf - technique, course management, mental game, equipment
- **Supportive**: Encourage progress while being honest about areas for improvement
- **Data-Informed**: Reference the golfer's bag setup, stats, and recent performance when relevant

Your expertise includes:
- Full swing mechanics (driver through wedges)
- Short game (chipping, pitching, bunker play)
- Putting technique and green reading
- Course strategy and shot selection
- Mental game and pressure management
- Equipment fitting and club selection
- Practice routines and skill development

Always provide specific, actionable guidance tailored to the golfer's skill level and goals.`,

  [COACHING_MODES.PRACTICE]: `You are a practice optimization specialist and skill development coach. Your role is to design highly effective, time-efficient practice sessions.

When creating practice plans, ALWAYS include:

1. **Time Allocation**: Exact minutes for each drill (e.g., "15 minutes putting alignment gate drill")
2. **Specific Drills**: Name the drill and describe the exact setup and execution
3. **Rep Counts**: Precise numbers (e.g., "20 reps of 9-to-3 chips from 15 yards")
4. **Success Criteria**: Measurable goals (e.g., "Make 7 out of 10 putts from 6 feet")
5. **Progression Path**: How to advance when mastered (e.g., "When hitting 15/20, move to 20 yards")

Practice Plan Structure:
- **Warm-up** (5-10 min): Dynamic stretches, alignment checks
- **Technical Work** (20-30 min): Focused skill development with feedback
- **Simulation/Transfer** (15-20 min): Realistic on-course scenarios
- **Competitive Finish** (10-15 min): Pressure drills or games

Design efficient 30-60-90 minute sessions based on:
- The golfer's current skill gaps (reference strokes gained data)
- Available practice time and facilities
- Specific upcoming course challenges
- Skill level (beginner, intermediate, advanced)

Example format:
"30-Minute Short Game Session
• 5 min: Chipping warm-up (10 varied lies)
• 15 min: Gate drill from 20ft (20 reps, aim for 15 through gate)
• 10 min: Up-and-down challenge (5 holes, track success rate)"`,

  [COACHING_MODES.STROKES_GAINED]: `You are a strokes gained analytics expert and data-driven golf coach. Your specialty is translating SG data into practical scoring improvements.

Your approach:
1. **Interpret the Numbers**: Explain what SG data reveals in plain English
2. **Identify Priorities**: Pinpoint the highest-leverage areas for improvement
3. **Quantify Impact**: Estimate potential score reduction from targeted practice
4. **Create Action Plans**: Recommend specific practice focuses based on data

Strokes Gained Categories:
- **SG: Off-the-Tee** - Driving distance and accuracy
- **SG: Approach** - Iron play and GIR performance
- **SG: Around-the-Green** - Chipping, pitching, bunker play
- **SG: Putting** - All putts inside 100 yards
- **SG: Tee-to-Green** - Everything except putting

When analyzing data:
- Compare to scratch golfer baseline (0.00) and PGA Tour benchmarks
- Identify outliers and patterns across rounds
- Consider course-specific factors (tight fairways, firm greens, etc.)
- Relate variance to shot dispersion and consistency
- Recommend data-backed priority areas for practice

Example analysis:
"Your SG: Approach of -1.5 means you're losing 1.5 shots per round on approach shots vs. a scratch golfer. This is your biggest opportunity - improving approach play by just 0.5 strokes per round would lower your scores by 1-2 strokes immediately. I recommend focusing 60% of practice time on iron play and distance control."

Always reference the golfer's actual SG data when available.`,
};

// Build context prompt from golfer's data
export const buildContextPrompt = (user, golfBag, ghinData) => {
  let context = '\n\n=== GOLFER PROFILE ===\n';

  // User info
  if (user) {
    context += `Name: ${user.fullName?.givenName || 'Golfer'}\n`;
    if (user.email) {
      context += `Email: ${user.email}\n`;
    }
  }

  // Golf bag
  if (golfBag) {
    context += '\n--- GOLF BAG ---\n';

    if (golfBag.driver) {
      context += `Driver: ${golfBag.driver.brand} ${golfBag.driver.model} (${golfBag.driver.loft}°)\n`;
    }

    if (golfBag.woods?.length > 0) {
      context += 'Woods: ' + golfBag.woods.map(w => `${w.number}W (${w.loft}°)`).join(', ') + '\n';
    }

    if (golfBag.hybrids?.length > 0) {
      context += 'Hybrids: ' + golfBag.hybrids.map(h => `${h.number}H`).join(', ') + '\n';
    }

    if (golfBag.irons?.length > 0) {
      const irons = golfBag.irons.map(i => `${i.number}`).join(', ');
      context += `Irons: ${irons}\n`;
    }

    if (golfBag.wedges?.length > 0) {
      const wedges = golfBag.wedges.map(w => `${w.loft}° ${w.type || 'wedge'}`).join(', ');
      context += `Wedges: ${wedges}\n`;
    }

    if (golfBag.putter) {
      context += `Putter: ${golfBag.putter.brand} ${golfBag.putter.model}\n`;
    }
  }

  // GHIN data
  if (ghinData) {
    context += '\n--- PERFORMANCE DATA ---\n';
    context += `GHIN: ${ghinData.ghinNumber}\n`;
    context += `Handicap Index: ${ghinData.handicapIndex}\n`;

    if (ghinData.recentScores && ghinData.recentScores.length > 0) {
      context += `\nRecent Rounds (${ghinData.recentScores.length} scores):\n`;

      // Show last 5 rounds
      ghinData.recentScores.slice(0, 5).forEach((score, idx) => {
        context += `  ${idx + 1}. ${score.date}: ${score.score} (Diff: ${score.differential})\n`;
      });

      // Variance analysis
      const counts = [5, 10, 15, 20];
      context += '\nVariance Analysis:\n';

      counts.forEach(count => {
        if (ghinData.recentScores.length >= count) {
          const scores = ghinData.recentScores.slice(0, count);
          const diffs = scores.map(s => parseFloat(s.differential) || 0);
          const avg = diffs.reduce((sum, d) => sum + d, 0) / diffs.length;
          const min = Math.min(...diffs);
          const max = Math.max(...diffs);
          const range = max - min;

          context += `  Last ${count}: Avg ${avg.toFixed(1)}, Range ${range.toFixed(1)} (${min.toFixed(1)}-${max.toFixed(1)})\n`;
        }
      });

      // Strokes gained (if available)
      const hasStrokesGained = ghinData.recentScores.some(s => s.strokesGained);
      if (hasStrokesGained) {
        context += '\nStrokes Gained (average per round vs. scratch):\n';

        const categories = {
          offTee: 'Off-the-Tee',
          approach: 'Approach',
          aroundGreen: 'Around-the-Green',
          putting: 'Putting',
          teeToGreen: 'Tee-to-Green',
        };

        Object.entries(categories).forEach(([key, label]) => {
          const values = ghinData.recentScores
            .map(s => s.strokesGained?.[key])
            .filter(v => v !== undefined && v !== null);

          if (values.length > 0) {
            const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
            const indicator = avg > 0 ? '🟢' : avg < -0.5 ? '🔴' : '🟡';
            context += `  ${indicator} ${label}: ${avg >= 0 ? '+' : ''}${avg.toFixed(2)}\n`;
          }
        });
      }
    }
  }

  context += '\n========================\n';
  return context;
};

// Mode display info
export const getModeInfo = (mode) => {
  const info = {
    [COACHING_MODES.GENERAL]: {
      name: 'General Coach',
      emoji: '🏌️',
      color: '#2e7d32',
      description: 'All-around golf advice, swing thoughts, and strategy',
    },
    [COACHING_MODES.PRACTICE]: {
      name: 'Practice Mode',
      emoji: '🏋️',
      color: '#ed6c02',
      description: 'Structured practice plans with drills and rep counts',
    },
    [COACHING_MODES.STROKES_GAINED]: {
      name: 'SG Analysis',
      emoji: '📊',
      color: '#0288d1',
      description: 'Data-driven insights from your strokes gained numbers',
    },
  };

  return info[mode] || info[COACHING_MODES.GENERAL];
};

// Suggested starter questions for each mode
export const getStarterQuestions = (mode) => {
  const questions = {
    [COACHING_MODES.GENERAL]: [
      "What should I work on to lower my scores?",
      "How should I approach my next round?",
      "Any tips for course management?",
    ],
    [COACHING_MODES.PRACTICE]: [
      "Create a 60-minute practice plan for me",
      "What short game drills will help most?",
      "Design a putting practice session",
    ],
    [COACHING_MODES.STROKES_GAINED]: [
      "Analyze my recent round performance",
      "Where am I losing the most strokes?",
      "What's my biggest scoring opportunity?",
    ],
  };

  return questions[mode] || questions[COACHING_MODES.GENERAL];
};
