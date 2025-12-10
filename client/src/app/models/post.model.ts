export interface Post {
    id: string; //postId
    title: string;
    caption: string;
    image?: File| string| null;
    creatorId?: string;
    skipImage: boolean;
    value: string;
    date: Date | null;
    tripId?: string;
}
