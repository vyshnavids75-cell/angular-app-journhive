export interface Trip {
    id: string;
    destination: string;
    startDate: Date | null;
    endDate: Date | null;
    coverPhoto?: File| string| null;
    creatorId?: string;
    skipImage: boolean;
    postsCount?: number;
}