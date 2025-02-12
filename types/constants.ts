export const DataItemTypes = Object.freeze({
  Weather: 'weather' as const,
  HotelSearch: 'hotel-search' as const,
  SightSearch: 'sight-search' as const,
  SearchQuery: 'search-query' as const,
  SearchExecution: 'search-execution' as const,
  SearchSummary: 'search-summary' as const,
  TransferToHotel: 'transfer-to-hotel' as const,
  TransferToTravel: 'transfer-to-travel' as const,
  TransferToWeather: 'transfer-to-weather' as const,
  TransferToSights: 'transfer-to-sights' as const,
})

export const AgentNames = Object.freeze({
  PLUTO: 'Pluto the Pup',
  PETEY: 'Petey the Pirate',
  PENNY: 'Penny Restmore',
  POLLY: 'Polly Parrot',
} as const)

export type AgentName = typeof AgentNames[keyof typeof AgentNames]
