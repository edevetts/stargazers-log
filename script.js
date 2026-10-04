fetch("events.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
  })
  .then((events) => {
    const list = document.querySelector("#starred");
    const status = document.querySelector("#status");

    if (!list) {
      throw new Error('Could not find the "#starred" list.');
    }
    if (!status) {
      throw new Error('Could not find the "#status" message.');
    }
    if (!Array.isArray(events)) {
      throw new Error("The events data must be an array.");
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
    status.textContent = `${events.length} starred ${events.length === 1 ? "repository" : "repositories"} loaded.`;
  })
  .catch((error) => {
    console.error("Could not load starred repositories:", error);

    const list = document.querySelector("#starred");
    const status = document.querySelector("#status");
    if (list) {
      list.replaceChildren();
    }
    if (status) {
      status.textContent = "Unable to load starred repositories.";
    }
  });