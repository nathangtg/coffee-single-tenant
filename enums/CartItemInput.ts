export interface CartItemInput {
    itemId: string;
    quantity: number;
    notes?: string;
    options: { optionId: string }[];
}
