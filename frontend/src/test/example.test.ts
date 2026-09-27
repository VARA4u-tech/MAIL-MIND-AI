import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Playground from "../components/Playground";

describe("Playground auth flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("mailmind:playground:email", "user@example.com");
    window.localStorage.setItem("mailmind:playground:token", "fake-token");
  });

  it("includes the bearer token when sending a Gmail reply", async () => {
    const fetchMock = vi.fn((url: string, options?: RequestInit) => {
      if (url === "/api/gmail/inbox?email=user%40example.com") {
        return Promise.resolve(new Response(JSON.stringify({
          emails: [{
            id: "email-1",
            subject: "Project update",
            from: "Jane Doe <jane@example.com>",
            date: "Mon, 01 Jan 2024 10:00:00 +0000",
            snippet: "Hello team, just a quick update.",
            body: "Hello team, just a quick update.",
          }],
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }));
      }

      if (url === "/api/ai/reply") {
        return Promise.resolve(new Response(JSON.stringify({ reply: "Thanks for the update." }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }));
      }

      if (url === "/api/gmail/send") {
        return Promise.resolve(new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }));
      }

      return Promise.resolve(new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }));
    });

    global.fetch = fetchMock as typeof fetch;

    render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(Playground)
      )
    );

    await waitFor(() => {
      expect(screen.getByText(/Project update/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /generate reply/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/ai/reply",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer fake-token",
          }),
        })
      );
    });

    fireEvent.click(await screen.findByRole("button", { name: /send reply/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/gmail/send",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer fake-token",
            "Content-Type": "application/json",
          }),
        })
      );
    });
  });
});
