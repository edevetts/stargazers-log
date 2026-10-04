fetch("events.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
  })
  .then((events) => {
    const list = document.querySelector("#starred");

    if (!list) {
      throw new Error('Could not find the "#starred" list.');
    }
    if (!Array.isArray(events)) {
      throw new Error("The events data must be an array.");
    }

    events.forEach((event) => {
      const item = document.createElement("li");
      item.textContent = `${event.name} — starred ${event.starred}`;
      list.appendChild(item);
    });
  })
  .catch((error) => {
    console.error("Could not load starred repositories:", error);

    const list = document.querySelector("#starred");
    if (list) {
      list.textContent = "Unable to load starred repositories.";
    }
  });