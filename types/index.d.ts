export {}

declare global {
  interface DataItem {
    id: string
    type: string
    data: string
  }

  interface Address {
    street1: string
    street2?: string
    city: string
    state: string
    country: string
    postalcode: string
    address_string: string
  }

  interface Location {
    location_id: string
    name: string
    distance: string
    bearing: string
    address_obj: Address
  }
}
