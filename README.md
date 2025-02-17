<h1 align="center">
  <img src="https://github.com/mikechao/ai-travel-agent/blob/master/public/favicon.ico"/>
  AI Travel Agent
</h1>

<p align="left">
A multi-agent network with human in the loop chat helping user explore various travel destinations.
</p>

<p align="left">
Tokens are streamed to the frontend built with NuxtJS as they are generated by the LLM in the backend.
</p>

<p align="left">
All of the agents in the network have the "ability" to talk to each other and are equipped with tools related to their tasks.
</p>

<p align="center">
Currently live at <a href="https://ai-travel-agent-pied.vercel.app/">https://ai-travel-agent-pied.vercel.app/</a>
</p>

<h2 align="center">
There are 4 agents in this network
</h2>
<ol>
  <li>Pluto the Pup 🐶: General travel agent who is equipped with tools that can search the internet for images(ImageSearchTool), generate search queries related to user's travel interests, execute those search queries on the web(SearchExecutionTool) and provide a summary of specific search results (SearchSummaryTool).</li>
  <li>Petey the Pirate 🏴‍☠️: The weather agent who is equipped with a geocoding tool (GeocodeTool) and a weather forecasting tool (WeatherForecastTool) to provide the weather and clothing recommendations for the user.</li>
  <li>Penny Restmore 🏨: The hotel agent who is equipped with the <strong>HotelSearchTool</strong> to help users find hotels near travel destinations. In additional she has the <strong>HotelDetailsTool</strong> to provide additional details about specific hotels. The <strong>HotelReviewsTool</strong> helps her show reviews of hotels for the user.</li>
  <li>Polly Parrot 🦜: The sightseeing agent who is equipped with the <strong>SightseeingSearchTool</strong> to help users find sights to see or attractions. The <strong>SightsDetailsTool</strong> provides additional details about sights or attractions and the <strong>SightsReviewsTool</strong> provides reviews from other users.</li>
</ol>

<h2 align="center">
Tools and Datasources
</h2>

| Name                  |                                         Source                                          |
| :-------------------- | :-------------------------------------------------------------------------------------: |
| ImageSearchTool       |          [Brave Search API](https://brave.com/search/api/ 'Brave Search API')           |
| SearchExecutionTool   |          [Brave Search API](https://brave.com/search/api/ 'Brave Search API')           |
| GeocodeTool           |             [OpenCage](https://opencagedata.com/ 'OpenCage Geocoding API')              |
| WeatherForecastTool   |                [Weather API](https://www.weatherapi.com/ 'Weather API')                 |
| HotelSearchTool       | [Tripadvisor Content API](https://tripadvisor-content-api.readme.io/reference/overview) |
| HotelDetailsTool      | [Tripadvisor Content API](https://tripadvisor-content-api.readme.io/reference/overview) |
| HotelReviewsTool      | [Tripadvisor Content API](https://tripadvisor-content-api.readme.io/reference/overview) |
| SightseeingSearchTool | [Tripadvisor Content API](https://tripadvisor-content-api.readme.io/reference/overview) |
| SightsDetailsTool     | [Tripadvisor Content API](https://tripadvisor-content-api.readme.io/reference/overview) |
| SightsReviewsTool     | [Tripadvisor Content API](https://tripadvisor-content-api.readme.io/reference/overview) |

## 🛠️ Installation Steps

1. Get an OpenAI API Key
2. Get Weather API Key
3. Get Brave Search API Key
4. Get TripAdvisor API Key
5. Get OpenCage API Key
6. Get Postgres URL
7. Optional get LangSmith API Key for tracing LLM calls
8. Create .env by following [env example](./.env-example) with information from above
9. Install project dependencies

```bash
pnpm install
```

10. Start the development server on `http://localhost:3000`

```bash
pnpm dev
```

## 👷 Built with

| Name       |                                        Link                                        | Usage                                                     |
| :--------- | :--------------------------------------------------------------------------------: | :-------------------------------------------------------- |
| NuxtJS     |      [![My Skills](https://skillicons.dev/icons?i=nuxtjs)](https://nuxt.com/)      | Building pages, interactions and server apis              |
| TypeScript | [![My Skills](https://skillicons.dev/icons?i=ts)](https://www.typescriptlang.org/) | Static typing, better autocompletion                      |
| Pinia      |   [![My Skills](https://skillicons.dev/icons?i=pinia)](https://pinia.vuejs.org/)   | Management of various states like settings, chat messages |
| Pnpm       |       [![My Skills](https://skillicons.dev/icons?i=pnpm)](https://pnpm.io/)        | Manage JavaScript packages                                |
