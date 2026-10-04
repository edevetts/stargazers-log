const GITHUB_USERNAME = "edevetts";
const GITHUB_STARRED_URL = `https://api.github.com/users/${encodeURIComponent(GITHUB_USERNAME)}/starred`;

function getRateLimitMessage(response) {
  const retryAfter = response.headers.get("retry-after");
  const resetAt = response.headers.get("x-ratelimit-reset");
  let retryTime;

  if (retryAfter) {
    const delaySeconds = Number(retryAfter);
    retryTime = Number.isFinite(delaySeconds)
      ? new Date(Date.now() + delaySeconds * 1000)
      : new Date(retryAfter);
  } else if (resetAt) {
    retryTime = new Date(Number(resetAt) * 1000);
  }

  if (retryTime && !Number.isNaN(retryTime.getTime())) {
    return `GitHub API rate limit reached. Try again after ${retryTime.toLocaleTimeString()}.`;
  }

  return "GitHub API rate limit reached. Please try again later.";
}

async function fetchStarredRepositories() {
  const stars = [];
  let page = 1;

  while (true) {
    const response = await fetch(`${GITHUB_STARRED_URL}?per_page=100&page=${page}`, {
      headers: {
        Accept: "application/vnd.github.star+json"
      }
    });
    const isRateLimited = response.status === 429 || (
      response.status === 403 && (
        response.headers.get("x-ratelimit-remaining") === "0" ||
        response.headers.has("retry-after")
      )
    );

    if (isRateLimited) {
      throw new Error(getRateLimitMessage(response));
    }
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    const pageOfStars = await response.json();
    if (!Array.isArray(pageOfStars)) {
      throw new Error("The GitHub response must be an array.");
    }

    stars.push(...pageOfStars);
    if (pageOfStars.length < 100) {
      break;
    }

    page += 1;
  }

  return stars.map((star) => ({
    name: star?.repo?.full_name,
    starred: typeof star?.starred_at === "string" ? star.starred_at.slice(0, 10) : ""
  }));
}

fetchStarredRepositories()
  .then((events) => {
    const list = document.querySelector("#starred");
    const status = document.querySelector("#status");

    if (!list) {
      throw new Error('Could not find the "#starred" list.');
    }
    if (!status) {
      throw new Error('Could not find the "#status" message.');
    }
    if (!events.every((event) =>
      event &&
      typeof event.name === "string" &&
      event.name.trim() !== "" &&
      typeof event.starred === "string" &&
      event.starred.trim() !== ""
    )) {
      throw new Error("Each event must include a name and starred date.");
    }

    events.forEach((event) => {
      const item = document.createElement("li");
      item.textContent = `${event.name} — starred ${event.starred}`;
      list.appendChild(item);
    });
    status.textContent = events.length === 0
      ? "No starred repositories found."
      : `${events.length} starred ${events.length === 1 ? "repository" : "repositories"} loaded.`;
  })
  .catch((error) => {
    console.error("Could not load starred repositories:", error);

    const list = document.querySelector("#starred");
    const status = document.querySelector("#status");
    if (list) {
      list.replaceChildren();
    }
    if (status) {
      status.textContent = error instanceof Error && error.message.startsWith("GitHub API rate limit reached.")
        ? error.message
        : "Unable to load starred repositories.";
    }
  });