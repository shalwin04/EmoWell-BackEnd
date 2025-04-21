import { GraphState } from "./graphState.js";
import { getYouTubeVideos } from "../utils/fetchYoutubeVideos.js";
import { Document } from "@langchain/core/documents";

interface YouTubeVideo {
  type: "video";
  title: string;
  description: string;
  url: string;
  thumbnail: string;
}

export async function blogsAgent(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("---BLOGS AGENT RUNNING---");

  try {
    const keyword = state?.mood_keyword || "mental health"; // Add fallback value

    if (!keyword || keyword.trim() === "") {
      console.warn("No mood keyword found. Cannot fetch videos.");
      return {
        youtubeResults: [],
      };
    }

    const { videos: rawResults } = await getYouTubeVideos(keyword);

    const docs = rawResults.map(
      (video: YouTubeVideo) =>
        new Document({
          pageContent: `${video.title}\n${video.description}`,
          metadata: {
            type: "youtube",
            title: video.title,
            description: video.description,
            url: video.url,
            thumbnail: video.thumbnail,
          },
        })
    );

    return {
      youtubeResults: docs,
    };
  } catch (error) {
    console.error("Error in blogsAgent:", error);
    return {
      youtubeResults: [],
    };
  }
}
