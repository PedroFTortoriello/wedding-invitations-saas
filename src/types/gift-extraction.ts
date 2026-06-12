export type GiftExtractionRequest = {
  url: string;
};

export type GiftExtractionResponse = {
  title: string;
  price: string | null;
  image: string | null;
  url: string;
  source: string;
  description?: string | null;
};
