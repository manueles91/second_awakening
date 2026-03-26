import type { StateDelta } from "@/lib/types/state-delta";

interface ParsedResponse {
  narrative: string;
  stateDelta: StateDelta;
}

export function parseAIResponse(content: string): ParsedResponse {
  // Extract the state_delta block
  const deltaMatch = content.match(/<state_delta>\s*([\s\S]*?)\s*<\/state_delta>/);

  let narrative = content;
  let stateDelta: StateDelta = {};

  if (deltaMatch) {
    // Remove the state_delta block from narrative
    narrative = content.replace(/<state_delta>[\s\S]*?<\/state_delta>/, "").trim();

    try {
      stateDelta = JSON.parse(deltaMatch[1]);
    } catch (e) {
      console.error("Failed to parse state_delta JSON:", e);
      console.error("Raw delta:", deltaMatch[1]);
    }
  }

  return { narrative, stateDelta };
}

// For onboarding responses, extract additional fields
export interface OnboardingDelta extends StateDelta {
  onboarding_complete?: boolean;
  player_name?: string;
  hunter_name?: string;
  preferences?: {
    primary_genre?: string;
    story_tone?: string;
    goals?: Array<{
      description: string;
      domain: string;
      measurable: boolean;
      target?: string;
      motivation?: string;
    }>;
    fitness_level?: string;
    physical_limitations?: string[];
    difficulty?: string;
    work_days?: string[];
    rest_days?: string[];
  };
}

export function parseOnboardingResponse(content: string): {
  narrative: string;
  delta: OnboardingDelta;
} {
  const deltaMatch = content.match(/<state_delta>\s*([\s\S]*?)\s*<\/state_delta>/);

  let narrative = content;
  let delta: OnboardingDelta = {};

  if (deltaMatch) {
    narrative = content.replace(/<state_delta>[\s\S]*?<\/state_delta>/, "").trim();
    try {
      delta = JSON.parse(deltaMatch[1]);
    } catch (e) {
      console.error("Failed to parse onboarding delta:", e);
    }
  }

  return { narrative, delta };
}
