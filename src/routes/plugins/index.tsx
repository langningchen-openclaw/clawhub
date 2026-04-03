import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { BrowseSidebar } from "../../components/BrowseSidebar";
import { fetchPluginCatalog, type PackageListItem } from "../../lib/packageApi";
import { familyLabel } from "../../lib/packageLabels";

type PluginSearchState = {
  q?: string;
  cursor?: string;
  family?: "code-plugin" | "bundle-plugin";
  verified?: boolean;
  executesCode?: boolean;
};

type PluginsLoaderData = {
  items: PackageListItem[];
  nextCursor: string | null;
};

export const Route = createFileRoute("/plugins/")({
  validateSearch: (search): PluginSearchState => ({
    q: typeof search.q === "string" && search.q.trim() ? search.q.trim() : undefined,
    cursor: typeof search.cursor === "string" && search.cursor ? search.cursor : undefined,
    family:
      search.family === "code-plugin" || search.family === "bundle-plugin"
        ? search.family
        : undefined,
    verified:
      search.verified === true || search.verified === "true" || search.verified === "1"
        ? true
        : undefined,
    executesCode:
      search.executesCode === true ||
      search.executesCode === "true" ||
      search.executesCode === "1"
        ? true
        : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    try {
      const data = await fetchPluginCatalog({
        q: deps.q,
        cursor: deps.q ? undefined : deps.cursor,
        family: deps.family,
        isOfficial: deps.verified,
        executesCode: deps.executesCode,
        limit: 50,
      });
      return {
        items: data.items ?? [],
        nextCursor: data.nextCursor ?? null,
      } satisfies PluginsLoaderData;
    } catch {
      return { items: [], nextCursor: null } satisfies PluginsLoaderData;
    }
  },
  component: PluginsIndex,
});

function VerifiedBadge() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Verified publisher"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    >
      <path
        d="M8 0L9.79 1.52L12.12 1.21L12.93 3.41L15.01 4.58L14.42 6.84L15.56 8.82L14.12 10.5L14.12 12.82L11.86 13.41L10.34 15.27L8 14.58L5.66 15.27L4.14 13.41L1.88 12.82L1.88 10.5L0.44 8.82L1.58 6.84L0.99 4.58L3.07 3.41L3.88 1.21L6.21 1.52L8 0Z"
        fill="#3b82f6"
      />
      <path
        d="M5.5 8L7 9.5L10.5 6"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PluginsIndex() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { items, nextCursor } = Route.useLoaderData() as PluginsLoaderData;
  const [query, setQuery] = useState(search.q ?? "");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setQuery(search.q ?? "");
  }, [search.q]);

  const handleFilterToggle = (key: string) => {
    if (key === "verified") {
      void navigate({
        search: (prev) => ({
          ...prev,
          cursor: undefined,
          verified: prev.verified ? undefined : true,
        }),
      });
    } else if (key === "executesCode") {
      void navigate({
        search: (prev) => ({
          ...prev,
          cursor: undefined,
          executesCode: prev.executesCode ? undefined : true,
        }),
      });
    }
  };

  const handleFamilySort = (value: string) => {
    const family =
      value === "code-plugin" || value === "bundle-plugin" ? value : undefined;
    void navigate({
      search: (prev) => ({
        ...prev,
        cursor: undefined,
        family: family as "code-plugin" | "bundle-plugin" | undefined,
      }),
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void navigate({
      search: (prev) => ({
        ...prev,
        cursor: undefined,
        q: query.trim() || undefined,
      }),
    });
  };

  return (
    <main className="browse-page">
      <div className="browse-page-header">
        <h1 className="browse-title">Plugins</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            className="browse-sidebar-toggle"
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle filters"
          >
            Filters
          </button>
          <Link
            className="btn btn-primary"
            to="/publish-plugin"
            search={{
              ownerHandle: undefined,
              name: undefined,
              displayName: undefined,
              family: undefined,
              nextVersion: undefined,
              sourceRepo: undefined,
            }}
          >
            Publish
          </Link>
        </div>
      </div>
      <form className="browse-page-search" onSubmit={handleSearch}>
        <Search size={15} className="navbar-search-icon" aria-hidden="true" />
        <input
          className="browse-search-input"
          placeholder="Search plugins..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </form>
      <div className={`browse-layout${sidebarOpen ? " sidebar-open" : ""}`}>
        <BrowseSidebar
          sortOptions={[
            { value: "all", label: "All types" },
            { value: "code-plugin", label: "Code plugins" },
            { value: "bundle-plugin", label: "Bundle plugins" },
          ]}
          activeSort={search.family ?? "all"}
          onSortChange={handleFamilySort}
          filters={[
            { key: "verified", label: "Verified only", active: search.verified ?? false },
            { key: "executesCode", label: "Executes code", active: search.executesCode ?? false },
          ]}
          onFilterToggle={handleFilterToggle}
        />
        <div className="browse-results">
          <div className="browse-results-toolbar">
            <span className="browse-results-count">
              {items.length} plugin{items.length !== 1 ? "s" : ""}
            </span>
          </div>

          {items.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-title">No plugins found</p>
              <p className="empty-state-body">Try a different search term or remove filters.</p>
            </div>
          ) : (
            <div className="results-list">
              {items.map((item) => (
                <Link
                  key={item.name}
                  to="/plugins/$name"
                  params={{ name: item.name }}
                  className="skill-list-item"
                >
                  <div className="skill-list-item-main">
                    {item.ownerHandle ? (
                      <>
                        <span className="skill-list-item-owner">@{item.ownerHandle}</span>
                        <span className="skill-list-item-sep">/</span>
                      </>
                    ) : null}
                    <span className="skill-list-item-name">{item.displayName}</span>
                    <span className="tag tag-compact">{familyLabel(item.family)}</span>
                    {item.isOfficial ? (
                      <span className="tag tag-compact tag-accent">
                        <VerifiedBadge /> Verified
                      </span>
                    ) : null}
                  </div>
                  {item.summary ? (
                    <p className="skill-list-item-summary">{item.summary}</p>
                  ) : null}
                  <div className="skill-list-item-meta">
                    {item.latestVersion ? (
                      <span className="skill-list-item-meta-item">v{item.latestVersion}</span>
                    ) : null}
                    <span className="skill-list-item-meta-item">
                      {item.ownerHandle ? item.ownerHandle : "community"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!search.q && (search.cursor || nextCursor) ? (
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 22 }}>
              {search.cursor ? (
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    void navigate({
                      search: (prev) => ({ ...prev, cursor: undefined }),
                    });
                  }}
                >
                  First page
                </button>
              ) : null}
              {nextCursor ? (
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => {
                    void navigate({
                      search: (prev) => ({ ...prev, cursor: nextCursor }),
                    });
                  }}
                >
                  Next page
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
