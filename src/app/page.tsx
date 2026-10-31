import AgentPage from "./agent/page";

// Serve the branded Meeting-to-Execution experience at the root URL.
// The same dashboard remains available at /agent for existing links.
export default function HomePage() {
  return <AgentPage />;
}
