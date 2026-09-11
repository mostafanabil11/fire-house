export interface StoreSettings {
  currency: string;
  taxRateBasisPoints: number;
  freeShippingThresholdMinorUnits: number;
  flatShippingRateMinorUnits: number;
  // The restaurant's InstaPay handle. Empty means InstaPay is not offered,
  // and checkout hides the option rather than asking for a transfer to
  // nowhere.
  instapayAddress: string;
}
