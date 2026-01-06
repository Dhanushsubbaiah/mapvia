export type Company = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  website?: string;
  careers_url: string;
  tags: string[];
};
