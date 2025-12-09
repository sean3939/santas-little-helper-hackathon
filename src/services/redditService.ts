import { performDeepResearch } from './researchService';

export const fetchRedditActivity = async (username: string): Promise<string> => {
  const cleanUsername = username.replace('u/', '').trim();

  try {
    // Reddit allows .json appended to profile URLs.
    // limit=100 is a safe amount for a demo.
    // Note: This often fails in client-side browsers due to CORS, but is kept for environments where it might work.
    const response = await fetch(`https://www.reddit.com/user/${cleanUsername}/overview.json?limit=100`);
    
    if (!response.ok) {
        throw new Error(`Reddit API Error: ${response.status}`);
    }

    const data = await response.json();
    const children = data.data?.children || [];

    // Prune Data
    const activity = children.map((child: any) => {
      const item = child.data;
      const isComment = item.name.startsWith('t1_');
      
      return {
        type: isComment ? 'Comment' : 'Post',
        subreddit: item.subreddit_name_prefixed,
        title: item.title || null, // Comments don't have titles
        body: item.body || item.selftext || "(Link/Image Post)", // Comments have body, Posts have selftext
        score: item.score,
        created_utc: new Date(item.created_utc * 1000).toISOString(),
        is_stickied: item.stickied
      };
    });

    return JSON.stringify({
      source: "Reddit",
      username: cleanUsername,
      recent_activity: activity
    }, null, 2);

  } catch (error) {
    console.warn("Direct Reddit Fetch failed (likely CORS). Falling back to Gemini Research...", error);
    
    // Fallback: Use Gemini with Google Search to analyze the user
    // We pass a specific query to the research service to target Reddit history
    try {
        const researchResult = await performDeepResearch(`Reddit user u/${cleanUsername} post history, comments, and reputation`);
        return researchResult;
    } catch (fallbackError) {
        console.error("Reddit Fallback Error:", fallbackError);
        throw new Error("Could not check the karma score. Is the username correct?");
    }
  }
};