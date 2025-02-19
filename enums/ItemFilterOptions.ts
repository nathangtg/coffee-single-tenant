export interface ItemFilterOptions {
    categoryId?: string;
    name?: { contains: string; mode: 'insensitive' };
    isAvailable?: boolean;
}