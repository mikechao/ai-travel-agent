<script setup lang="ts">
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'

const json = `{
  "location_id": "80082",
  "name": "Sonesta Select San Ramon",
  "description": "At Sonesta Select, we've designed a space where you can be yourself, one that fits your life on the road. Our generously sized rooms and well-crafted common areas let you spread out in, get work done, and let go when it's time. From a great morning cappuccino to a well-earned evening cocktail or a late-night snack, we have you covered. Jump in the pool with kids, stay in to watch a movie or enjoy fresh air with a book on the patio. Sonesta Select helps make your time away from home personal, and uniquely you. At the Sonesta Select San Ramon, our convenient location and friendly, locally-rooted teams make you feel part of the community. You'll have easy access to Bishop Ranch Business Park, University of San Francisco San Ramon Regional Campus, and San Ramon Regional Medical Center, as well as our inside take on the sites and attractions that suit your interests. All while enjoying the signature personal touch that every Sonesta guest has come to expect.",
  "web_url": "https://www.tripadvisor.com/Hotel_Review-g33038-d80082-Reviews-Sonesta_Select_San_Ramon-San_Ramon_Tri_Valley_California.html?m=66827",
  "address_obj": {
    "street1": "18090 San Ramon Valley Blvd.",
    "street2": "",
    "city": "San Ramon",
    "state": "California",
    "country": "United States",
    "postalcode": "94583",
    "address_string": "18090 San Ramon Valley Blvd., San Ramon, CA 94583"
  },
  "ancestors": [
    {
      "level": "City",
      "name": "San Ramon",
      "location_id": "33038"
    },
    {
      "level": "Region",
      "name": "Tri-Valley",
      "location_id": "12811932"
    },
    {
      "abbrv": "CA",
      "level": "State",
      "name": "California",
      "location_id": "28926"
    },
    {
      "level": "Country",
      "name": "United States",
      "location_id": "191"
    }
  ],
  "latitude": "37.757797",
  "longitude": "-121.96507",
  "timezone": "America/Los_Angeles",
  "phone": "18007663782",
  "write_review": "https://www.tripadvisor.com/UserReview-g33038-d80082-Sonesta_Select_San_Ramon-San_Ramon_Tri_Valley_California.html?m=66827",
  "ranking_data": {
    "geo_location_id": "33038",
    "ranking_string": "#4 of 8 hotels in San Ramon",
    "geo_location_name": "San Ramon",
    "ranking_out_of": "8",
    "ranking": "4"
  },
  "rating": "3.5",
  "rating_image_url": "https://www.tripadvisor.com/img/cdsi/img2/ratings/traveler/3.5-66827-5.svg",
  "num_reviews": "199",
  "review_rating_count": {
    "1": "12",
    "2": "18",
    "3": "40",
    "4": "85",
    "5": "44"
  },
  "subratings": {
    "0": {
      "name": "rate_location",
      "localized_name": "Location",
      "rating_image_url": "https://static.tacdn.com/img2/ratings/traveler/ss4.0.svg",
      "value": "4.0"
    },
    "1": {
      "name": "rate_sleep",
      "localized_name": "Sleep Quality",
      "rating_image_url": "https://static.tacdn.com/img2/ratings/traveler/ss4.0.svg",
      "value": "4.0"
    },
    "2": {
      "name": "rate_room",
      "localized_name": "Rooms",
      "rating_image_url": "https://static.tacdn.com/img2/ratings/traveler/ss4.0.svg",
      "value": "4.0"
    },
    "3": {
      "name": "rate_service",
      "localized_name": "Service",
      "rating_image_url": "https://static.tacdn.com/img2/ratings/traveler/ss4.0.svg",
      "value": "4.0"
    },
    "4": {
      "name": "rate_value",
      "localized_name": "Value",
      "rating_image_url": "https://static.tacdn.com/img2/ratings/traveler/ss3.5.svg",
      "value": "3.5"
    },
    "5": {
      "name": "rate_cleanliness",
      "localized_name": "Cleanliness",
      "rating_image_url": "https://static.tacdn.com/img2/ratings/traveler/ss4.5.svg",
      "value": "4.5"
    }
  },
  "photo_count": "116",
  "see_all_photos": "https://www.tripadvisor.com/Hotel_Review-g33038-d80082-m66827-Reviews-Sonesta_Select_San_Ramon-San_Ramon_Tri_Valley_California.html#photos",
  "price_level": "$$",
  "hours": {
    "periods": [
      {
        "open": {
          "day": 1,
          "time": "0000"
        },
        "close": {
          "day": 1,
          "time": "0000"
        }
      },
      {
        "open": {
          "day": 2,
          "time": "0000"
        },
        "close": {
          "day": 2,
          "time": "0000"
        }
      },
      {
        "open": {
          "day": 3,
          "time": "0000"
        },
        "close": {
          "day": 3,
          "time": "0000"
        }
      },
      {
        "open": {
          "day": 4,
          "time": "0000"
        },
        "close": {
          "day": 4,
          "time": "0000"
        }
      },
      {
        "open": {
          "day": 5,
          "time": "0000"
        },
        "close": {
          "day": 5,
          "time": "0000"
        }
      },
      {
        "open": {
          "day": 6,
          "time": "0000"
        },
        "close": {
          "day": 6,
          "time": "0000"
        }
      },
      {
        "open": {
          "day": 7,
          "time": "0000"
        },
        "close": {
          "day": 7,
          "time": "0000"
        }
      }
    ],
    "weekday_text": [
      "Monday: 00:00 - 00:00",
      "Tuesday: 00:00 - 00:00",
      "Wednesday: 00:00 - 00:00",
      "Thursday: 00:00 - 00:00",
      "Friday: 00:00 - 00:00",
      "Saturday: 00:00 - 00:00",
      "Sunday: 00:00 - 00:00"
    ]
  },
  "amenities": [
    "Internet",
    "Wheelchair access",
    "Wifi",
    "Fitness center",
    "Meeting rooms",
    "Public Wifi",
    "Dry Cleaning",
    "Non-smoking rooms",
    "Business center",
    "Laundry Service",
    "Air conditioning",
    "Self-Serve Laundry",
    "Conference Facilities",
    "Non-smoking hotel",
    "Flatscreen TV",
    "Parking",
    "Facilities for Disabled Guests",
    "Pool",
    "Suites",
    "Restaurant",
    "Banquet Room",
    "Family Rooms",
    "Multilingual Staff",
    "Accessible rooms",
    "Refrigerator in room",
    "Outdoor pool",
    "Breakfast Available",
    "Housekeeping",
    "Baggage Storage",
    "24-Hour Front Desk"
  ],
  "parent_brand": "Sonesta Hotels and Resorts",
  "brand": "Sonesta Select",
  "category": {
    "name": "hotel",
    "localized_name": "Hotel"
  },
  "subcategory": [
    {
      "name": "hotel",
      "localized_name": "Hotel"
    }
  ],
  "styles": [
    "Centrally Located",
    "Modern"
  ],
  "neighborhood_info": [],
  "trip_types": [
    {
      "name": "business",
      "localized_name": "Business",
      "value": "79"
    },
    {
      "name": "couples",
      "localized_name": "Couples",
      "value": "24"
    },
    {
      "name": "solo",
      "localized_name": "Solo travel",
      "value": "15"
    },
    {
      "name": "family",
      "localized_name": "Family",
      "value": "48"
    },
    {
      "name": "friends",
      "localized_name": "Friends getaway",
      "value": "15"
    }
  ],
  "awards": []
}`

const hotel = JSON.parse(json) as Hotel
// eslint-disable-next-line no-console
console.log('here')
</script>

<template>
  <HotelDetails :hotel="hotel" />
  <!-- <Splitter style="height: max-content;" class="splitter">
    <SplitterPanel class="flex items-center justify-center" :size="50" :min-size="25">
      <ResultsPanel class="h-max" />
    </SplitterPanel>
    <SplitterPanel class="flex items-center justify-center" :size="50" :min-size="25">
      <ChatComponent class="h-max" />
    </SplitterPanel>
  </Splitter> -->
</template>

<style scoped>
.splitter {
  width: 100%;
  height: 100%;
  position: relative;
  background-image: url('https://primefaces.org/cdn/primevue/images/dock/window.jpg');
  background-repeat: no-repeat;
  background-size: cover;
}
</style>
