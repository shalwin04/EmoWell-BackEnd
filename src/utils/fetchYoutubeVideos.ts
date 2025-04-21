import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

interface YouTubeVideo {
  type: "video";
  title: string;
  description: string;
  url: string;
  thumbnail: string;
}

interface FetchYouTubeVideosResult {
  videos: YouTubeVideo[];
  nextPageToken?: string;
}

export async function getYouTubeVideos(
  query: string,
  pageToken?: string
): Promise<FetchYouTubeVideosResult> {
  try {
    // Retrieve API key from environment variables
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      throw new Error(
        "Google API key is not defined in the environment variables"
      );
    }

    const maxResults = 10; // You can adjust this value as needed

    // Construct the YouTube API URL
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query
    )}&type=video&key=${apiKey}&maxResults=${maxResults}${
      pageToken ? `&pageToken=${pageToken}` : ""
    }`;

    const response = await fetch(url);

    // Check if response is valid
    if (!response.ok) {
      throw new Error(
        `YouTube API request failed with status: ${response.status}`
      );
    }

    const data = await response.json();

    // Handle if no items are returned
    if (!data.items || data.items.length === 0) {
      throw new Error("No videos found");
    }

    // Map YouTube video items to our custom format
    const videos: YouTubeVideo[] = data.items.map((item: any) => ({
      type: "video",
      title: item.snippet.title,
      description: item.snippet.description,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails.high.url,
    }));

    return {
      videos,
      nextPageToken: data.nextPageToken,
    };
  } catch (error) {
    // Log and rethrow the error
    console.error("Error fetching YouTube videos:", error);
    throw error;
  }
}
