import { formatDate } from "../utils/format";
import { useState } from "react";
import useResource from "../hooks/useResource";
import {
  PageHeader,
  Panel,
  DataState,
  SearchInput,
  Pagination,
} from "../components/UI";
export default function Audit() {
  const [page, setPage] = useState(1),
    [action, setAction] = useState("");
  const r = useResource(
    `/audit?page=${page}&action=${encodeURIComponent(action)}`,
    30000,
  );
  return (
    <>
      <PageHeader
        title="Audit trail"
        description="A traceable record of who changed what, and when."
      />
      <Panel
        title="Activity log"
        description="Administrator access · events are append-only through the API"
      >
        <div className="toolbar">
          <SearchInput
            value={action}
            onChange={(v) => {
              setAction(v);
              setPage(1);
            }}
            placeholder="Filter action, e.g. DISCHARGED…"
          />
        </div>
        <DataState resource={r}>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Actor</th>
                  <th>Entity</th>
                  <th>Timestamp</th>
                  <th>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {r.data?.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span className="event-label">
                        {a.action.replaceAll("_", " ").toLowerCase()}
                      </span>
                    </td>
                    <td>
                      {a.actor || "System"}
                      <small className="cell-small">{a.role || ""}</small>
                    </td>
                    <td>
                      {a.entity_type} {a.entity_id ? `#${a.entity_id}` : ""}
                    </td>
                    <td>{formatDate(a.created_at)}</td>
                    <td>
                      <details>
                        <summary>Details</summary>
                        <pre className="metadata">
                          {JSON.stringify(a.metadata, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={r.pagination} onPage={setPage} />
        </DataState>
      </Panel>
    </>
  );
}
