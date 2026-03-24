Q1 — MongoDB Schema Design
Describe the schema/collection structure you chose for storing price data. Why did you design it this way? What trade-offs did you consider (e.g. document size, query patterns, indexing)?

I used a flat collection structure where each document represents a single price snapshot. Since the main requirement is fetching the latest price, this structure allows for a simple "sort by date" query. Added index for symbol, because our main API uses it. I can also add another index for {symbol, created} fields later.

Q2 — Scheduling Approach
What library or mechanism did you use for scheduling the pipeline (e.g. node-cron, setInterval, a job queue, something else)? Why did you pick that over the alternatives? What would you change if this needed to run across multiple instances?
I use setTimeout recursively, because I want the current execution to be finished first. Node scheduler and cron are too heavy for such a simple case. If there are multiple instances of the app, then perhaps I would like to provide separate sets of cryptocurrencies to be handled by each instance, so no lock will be needed in such a case. Otherwise we can use distributed locks of Zookeeper or Redis.

Q3 — Data Quality & Edge Cases
What data quality issues did you anticipate or encounter? How does your code handle them? Give at least two concrete examples.
I encountered rate limiting issues with the CoinGecko API.
API can be changed or deprecated.

Q4 — Hyperswarm RPC - Optional
Had you used Hyperswarm RPC (or any Holepunch libraries) before this task? Describe briefly how you approached learning / integrating it. What surprised you or what would you do differently next time?
The RPC node functions correctly as a standalone process but fails when integrated into the price-aggregator suite. I'm investigating the integration logic now but won't be committing these debug fixes yet. First time using Hyperswarm—the performance is impressive. However, I'm still clarifying the distinction between DHT keys for discovery versus RPC addressing.
Q5 — Testing Strategy
Describe your testing approach. What did you prioritize testing and why? If you had more time, what additional tests would you add?
As the time was limited, I just covered several important cases using jest. Had no time to mock the response of the provider.
Q6 — Production Readiness
If this service were going to production, what would you add or change? Think about: error handling, logging, monitoring, deployment, scaling, security. Adding mocking for the price provider.
Ci/CD, monitoring. If we deploy using ALB, CloudWatch. The app can be containerized.
We can have a Redis in front of DB, response time will be super fast.
Q7 — Dependencies & Tooling
List the key npm packages you used (beyond the ones specified in the requirements). For each one, briefly explain why you chose it over alternatives.
I already have some useful libs for logging, configs, mongoose, utils. I am using express js, but falsify also could work, it is faster than express js. Added also linting and testing libs.


