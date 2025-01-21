<script setup lang="ts">
import WeatherCard from '~/components/weather/WeatherCard.vue'
import type { WeatherData } from '~/schemas/WeatherSchema'
const ChatComponent = defineAsyncComponent(() => import('~/components/ChatComponent.vue'))

const place = ref<WeatherData>({} as WeatherData)
const res:any = getFakeData()
const data:WeatherData = res as WeatherData
place.value = data

function getFakeData() {
  return {
    "location": {
        "name": "London",
        "region": "City of London, Greater London",
        "country": "United Kingdom",
        "lat": 51.5171,
        "lon": -0.1062,
        "tz_id": "Europe/London",
        "localtime_epoch": 1737494931,
        "localtime": "2025-01-21 21:28"
    },
    "current": {
        "last_updated": "2025-01-21 21:15",
        "temp_f": 39.2,
        "is_day": 0,
        "condition": {
            "text": "Mist",
            "icon": "//cdn.weatherapi.com/weather/64x64/night/143.png",
            "code": 1030
        },
        "wind_mph": 3.4,
        "wind_degree": 120,
        "wind_dir": "ESE",
        "precip_in": 0.0,
        "humidity": 87,
        "cloud": 75,
        "feelslike_f": 37.0,
        "windchill_f": 35.8,
        "heatindex_f": 38.1,
        "dewpoint_f": 36.3,
        "vis_miles": 4.0,
        "uv": 0.0,
        "gust_mph": 6.0
    },
    "forecast": {
        "forecastday": [
            {
                "date": "2025-01-21",
                "day": {
                    "maxtemp_f": 42.2,
                    "mintemp_f": 36.1,
                    "avgtemp_f": 38.4,
                    "totalprecip_in": 0.0,
                    "avghumidity": 89,
                    "daily_will_it_rain": 0,
                    "daily_chance_of_rain": 0,
                    "daily_will_it_snow": 0,
                    "daily_chance_of_snow": 0,
                    "condition": {
                        "text": "Partly Cloudy ",
                        "icon": "//cdn.weatherapi.com/weather/64x64/day/116.png",
                        "code": 1003
                    },
                    "uv": 0.1
                }
            },
            {
                "date": "2025-01-22",
                "day": {
                    "maxtemp_f": 39.8,
                    "mintemp_f": 38.0,
                    "avgtemp_f": 39.1,
                    "totalprecip_in": 0.1,
                    "avghumidity": 93,
                    "daily_will_it_rain": 1,
                    "daily_chance_of_rain": 87,
                    "daily_will_it_snow": 0,
                    "daily_chance_of_snow": 0,
                    "condition": {
                        "text": "Patchy rain nearby",
                        "icon": "//cdn.weatherapi.com/weather/64x64/day/176.png",
                        "code": 1063
                    },
                    "uv": 0.0
                }
            },
            {
                "date": "2025-01-23",
                "day": {
                    "maxtemp_f": 45.0,
                    "mintemp_f": 37.3,
                    "avgtemp_f": 41.4,
                    "totalprecip_in": 0.28,
                    "avghumidity": 82,
                    "daily_will_it_rain": 1,
                    "daily_chance_of_rain": 81,
                    "daily_will_it_snow": 0,
                    "daily_chance_of_snow": 0,
                    "condition": {
                        "text": "Moderate rain",
                        "icon": "//cdn.weatherapi.com/weather/64x64/day/302.png",
                        "code": 1189
                    },
                    "uv": 0.1
                }
            },
            {
                "date": "2025-01-24",
                "day": {
                    "maxtemp_f": 52.5,
                    "mintemp_f": 41.8,
                    "avgtemp_f": 46.9,
                    "totalprecip_in": 0.29,
                    "avghumidity": 76,
                    "daily_will_it_rain": 1,
                    "daily_chance_of_rain": 80,
                    "daily_will_it_snow": 0,
                    "daily_chance_of_snow": 0,
                    "condition": {
                        "text": "Moderate rain",
                        "icon": "//cdn.weatherapi.com/weather/64x64/day/302.png",
                        "code": 1189
                    },
                    "uv": 0.0
                }
            },
            {
                "date": "2025-01-25",
                "day": {
                    "maxtemp_f": 43.5,
                    "mintemp_f": 36.2,
                    "avgtemp_f": 40.3,
                    "totalprecip_in": 0.01,
                    "avghumidity": 75,
                    "daily_will_it_rain": 1,
                    "daily_chance_of_rain": 88,
                    "daily_will_it_snow": 0,
                    "daily_chance_of_snow": 0,
                    "condition": {
                        "text": "Patchy rain nearby",
                        "icon": "//cdn.weatherapi.com/weather/64x64/day/176.png",
                        "code": 1063
                    },
                    "uv": 0.1
                }
            },
            {
                "date": "2025-01-26",
                "day": {
                    "maxtemp_f": 46.6,
                    "mintemp_f": 35.3,
                    "avgtemp_f": 40.4,
                    "totalprecip_in": 0.02,
                    "avghumidity": 80,
                    "daily_will_it_rain": 1,
                    "daily_chance_of_rain": 81,
                    "daily_will_it_snow": 0,
                    "daily_chance_of_snow": 0,
                    "condition": {
                        "text": "Patchy rain nearby",
                        "icon": "//cdn.weatherapi.com/weather/64x64/day/176.png",
                        "code": 1063
                    },
                    "uv": 1.0
                }
            },
            {
                "date": "2025-01-27",
                "day": {
                    "maxtemp_f": 53.1,
                    "mintemp_f": 45.3,
                    "avgtemp_f": 49.5,
                    "totalprecip_in": 0.17,
                    "avghumidity": 82,
                    "daily_will_it_rain": 1,
                    "daily_chance_of_rain": 78,
                    "daily_will_it_snow": 0,
                    "daily_chance_of_snow": 0,
                    "condition": {
                        "text": "Patchy rain nearby",
                        "icon": "//cdn.weatherapi.com/weather/64x64/day/176.png",
                        "code": 1063
                    },
                    "uv": 2.0
                }
            }
        ]
    }
}
}
</script>
<template>
  <WeatherCard :place="place"/>
</template>