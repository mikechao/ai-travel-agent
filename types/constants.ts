export const DataItemTypes = Object.freeze({
  Weather: 'weather',
  HotelSearch: 'hotel-search',
  SightSearch: 'sight-search',
  SearchQuery: 'search-query',
  SearchExecution: 'search-execution',
  SearchSummary: 'search-summary',
  TransferToHotel: 'transfer-to-hotel',
  TransferToTravel: 'transfer-to-travel',
  TransferToWeather: 'transfer-to-weather',
  TransferToSights: 'transfer-to-sights',
} as const)

export const AgentNames = Object.freeze({
  PLUTO: 'Pluto the Pup',
  PETEY: 'Petey the Pirate',
  PENNY: 'Penny Restmore',
  POLLY: 'Polly Parrot',
} as const)

export type AgentName = typeof AgentNames[keyof typeof AgentNames]
