import type { DataItemTypes } from './constants'
import type { NodeNames } from './enums'

export {}

declare global {

  interface AdvisorTransferResult {
    goto: NodeNames
    agentName: string
  }

  interface SearchQueries {
    queries: string[]
  }

  interface SearchResult {
    query: string
    url: string
    title: string
    description: string
  }

  interface SearchSummary {
    summary: string
  }

  type PaletteShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950

  type ColorPalette = {
    [shade in PaletteShade]: string
  }

  interface ColorDefinition {
    name: string
    palette: ColorPalette
  }

  type DataItemType = typeof DataItemTypes[keyof typeof DataItemTypes]

  interface DataItem {
    id: string
    type: DataItemType
    data: string
  }

  interface Address {
    street1: string
    street2: string
    city: string
    state: string
    country: string
    postalcode: string
    address_string: string
  }

  /**
   * Representation of the response from the TripAdvisor Location Search API
   * @see https://tripadvisor-content-api.readme.io/reference/searchforlocations
   */
  interface Location {
    location_id: string
    name: string
    distance: string
    bearing: string
    address_obj: Address
  }

  interface LocationDetails extends Location {
    description: string
    /**
     * Link to the POI detail page on Tripadvisor. Link is localized to the correct domain if a language other than English is requested.
     */
    web_url: string
    ancestors: Ancestor[]
    latitude?: string
    longitude?: string
    timezone: string
    phone?: string
    write_review: string
    ranking_data?: RankingData
    rating: string
    rating_image_url: string
    num_reviews: string
    review_rating_count: ReviewRatingCount
    subratings?: { [key: string]: Subrating }
    photo_count: string
    see_all_photos: string
    price_level: string
    hours: Hours
    amenities?: string[]
    parent_brand: string
    brand: string
    category: Category
    subcategory: Category[]
    styles: string[]
    neighborhood_info: any[]
    trip_types: TripType[]
    awards: any[]
    website?: string
  }

  /**
   * Ancestors describe where the POI or destination lives within the Tripadvisor destination or geo hierarchy.
   * From this, you can derive the city where a POI is located, as well as state/province/region and country.
   */
  interface Ancestor {
    level: string
    name: string
    location_id: string
    abbrv?: string
  }

  interface RankingData {
    geo_location_id: string
    ranking_string: string
    geo_location_name: string
    ranking_out_of: string
    ranking: string
  }

  interface ReviewRatingCount {
    [key: string]: string
  }

  interface Subrating {
    name: string
    localized_name: string
    rating_image_url: string
    value: string
  }

  interface Period {
    open: {
      day: number
      time: string
    }
    close: {
      day: number
      time: string
    }
  }

  interface Hours {
    periods: Period[]
    weekday_text: string[]
  }

  interface TripType {
    name: string
    localized_name: string
    value: string
  }

  interface Category {
    name: string
    localized_name: string
  }

  interface UserLocation {
    id: string | null
  }

  interface Avatar {
    thumbnail: string
    small: string
    medium: string
    large: string
    original: string
  }

  interface User {
    username: string
    user_location: UserLocation
    avatar: Avatar
  }

  interface Review {
    id: number
    lang: string
    location_id: number
    published_date: string
    rating: number
    helpful_votes: number
    rating_image_url: string
    url: string
    text: string
    title: string
    trip_type: string
    travel_date: string
    user: User
    subratings: { [key: string]: Subrating }
  }
}
