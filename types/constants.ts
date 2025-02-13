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

export const AgentToEmoji: Record<AgentName, string> = Object.freeze({
  [AgentNames.PLUTO]: '🐶',
  [AgentNames.PETEY]: '🏴‍☠️',
  [AgentNames.PENNY]: '🏨',
  [AgentNames.POLLY]: '🦜',
} as const)

// not so sure this is needed...
export const AgentDetails = Object.freeze({
  [AgentNames.PLUTO]: {
    name: AgentNames.PLUTO,
    emoji: AgentToEmoji[AgentNames.PLUTO],
  },
  [AgentNames.PETEY]: {
    name: AgentNames.PETEY,
    emoji: AgentToEmoji[AgentNames.PETEY],
  },
  [AgentNames.PENNY]: {
    name: AgentNames.PENNY,
    emoji: AgentToEmoji[AgentNames.PENNY],
  },
  [AgentNames.POLLY]: {
    name: AgentNames.POLLY,
    emoji: AgentToEmoji[AgentNames.POLLY],
  },
} as const)
