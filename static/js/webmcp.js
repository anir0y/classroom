(function () {
  var modelContext = navigator.modelContext;
  if (!modelContext) return;

  var controller = new AbortController();

  function normalizeLimit(limit) {
    var parsed = Number(limit);
    if (!Number.isFinite(parsed) || parsed < 1) return 5;
    return Math.min(Math.floor(parsed), 10);
  }

  function includesQuery(item, query) {
    var haystack = [
      item.title,
      item.summary,
      item.content,
      item.permalink
    ].filter(Boolean).join(" ").toLowerCase();
    return haystack.indexOf(query.toLowerCase()) !== -1;
  }

  async function fetchIndex() {
    var response = await fetch("/index.json", { credentials: "same-origin" });
    if (!response.ok) {
      throw new Error("Unable to fetch search index");
    }
    return response.json();
  }

  var tools = [
    {
      name: "search_classroom",
      description: "Search Classroom cybersecurity articles by keyword.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            minLength: 1,
            description: "Keyword or phrase to search for."
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
            default: 5
          }
        },
        required: ["query"],
        additionalProperties: false
      },
      execute: async function (input) {
        var query = String(input && input.query ? input.query : "").trim();
        if (!query) return { results: [] };
        var limit = normalizeLimit(input && input.limit);
        var index = await fetchIndex();
        var results = index.filter(function (item) {
          return includesQuery(item, query);
        }).slice(0, limit).map(function (item) {
          return {
            title: item.title,
            url: item.permalink,
            summary: item.summary || ""
          };
        });
        return { results: results };
      }
    },
    {
      name: "list_recent_classroom_posts",
      description: "List recent Classroom posts from the public search index.",
      inputSchema: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
            default: 5
          }
        },
        additionalProperties: false
      },
      execute: async function (input) {
        var limit = normalizeLimit(input && input.limit);
        var index = await fetchIndex();
        return {
          posts: index.slice(0, limit).map(function (item) {
            return {
              title: item.title,
              url: item.permalink,
              summary: item.summary || ""
            };
          })
        };
      }
    }
  ];

  if (typeof modelContext.provideContext === "function") {
    modelContext.provideContext({ tools: tools }, { signal: controller.signal });
  }

  if (typeof modelContext.registerTool === "function") {
    tools.forEach(function (tool) {
      modelContext.registerTool(tool, { signal: controller.signal });
    });
  }

  window.addEventListener("pagehide", function () {
    controller.abort();
  }, { once: true });
})();
