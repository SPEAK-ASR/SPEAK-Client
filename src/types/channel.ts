// src/types/channel.ts
export interface ChannelCard {
    channelId: string;
    topicCategories: string[];
    thumbnailUrl?: string;
    isDeleted?: boolean; // <--- NEW
}
