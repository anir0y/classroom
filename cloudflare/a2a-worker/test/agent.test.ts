import { describe, expect, it } from "vitest";

import {
  InvalidAgentInputError,
  executeAgentRequest,
  parseAgentAction,
} from "../src/agent";

const posts = [
  {
    title: "Nmap Basics",
    summary: null,
    content: "Learn network discovery with Nmap.",
    permalink: "https://classroom.anir0y.in/post/nmap/",
  },
  {
    title: "Phishing Analysis",
    summary: "Analyze suspicious messages.",
    content: "Email investigation",
    permalink: "https://classroom.anir0y.in/post/phishing/",
  },
];

describe("parseAgentAction", () => {
  it("parses search text and clamps the configured limit", () => {
    expect(parseAgentAction([{ text: "search: nmap" }], 99)).toEqual({
      action: "search",
      query: "nmap",
      limit: 10,
    });
  });

  it("parses a structured recent request", () => {
    expect(
      parseAgentAction([{ data: { action: "recent", limit: 1 } }]),
    ).toEqual({
      action: "recent",
      limit: 1,
    });
  });

  it("recognizes a natural-language latest-post request", () => {
    expect(parseAgentAction([{ text: "Show the latest articles" }])).toEqual({
      action: "recent",
      limit: 5,
    });
  });

  it("rejects empty or invalid parts", () => {
    expect(() => parseAgentAction([])).toThrow(InvalidAgentInputError);
    expect(() => parseAgentAction([{ text: "  " }])).toThrow(
      InvalidAgentInputError,
    );
  });
});

describe("executeAgentRequest", () => {
  it("searches current posts and derives a summary when summary is null", () => {
    const result = executeAgentRequest(
      { action: "search", query: "nmap", limit: 5 },
      posts,
    );

    expect(result.results).toEqual([
      {
        title: "Nmap Basics",
        url: "https://classroom.anir0y.in/post/nmap/",
        summary: "Learn network discovery with Nmap.",
      },
    ]);
  });

  it("lists recent posts in index order", () => {
    expect(
      executeAgentRequest({ action: "recent", limit: 1 }, posts).results,
    ).toEqual([
      {
        title: "Nmap Basics",
        url: "https://classroom.anir0y.in/post/nmap/",
        summary: "Learn network discovery with Nmap.",
      },
    ]);
  });

  it("normalizes fallbacks and ignores entries without a permalink", () => {
    const result = executeAgentRequest(
      { action: "recent", limit: 5 },
      [
        { title: null, content: "  A   useful\npost  ", permalink: "/post/a/" },
        { title: "Missing URL", content: "Ignored" },
      ],
    );

    expect(result.results).toEqual([
      {
        title: "Untitled post",
        url: "/post/a/",
        summary: "A useful post",
      },
    ]);
  });
});
