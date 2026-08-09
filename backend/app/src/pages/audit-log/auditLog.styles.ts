import * as stylex from "@stylexjs/stylex"

export const styles = stylex.create({
  page: {
    padding: "24px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  title: {
    fontSize: "24px",
    fontWeight: 600,
    margin: 0,
  },
  filters: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
    padding: "16px",
    backgroundColor: "var(--color-surface)",
    borderRadius: "8px",
    border: "1px solid var(--color-border)",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  filterLabel: {
    fontSize: "12px",
    fontWeight: 500,
    color: "var(--color-text-secondary)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "var(--color-surface)",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid var(--color-border)",
  },
  th: {
    padding: "12px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--color-text-secondary)",
    backgroundColor: "var(--color-surface-secondary)",
    borderBottom: "1px solid var(--color-border)",
  },
  td: {
    padding: "12px",
    fontSize: "14px",
    borderBottom: "1px solid var(--color-border)",
  },
  tr: {
    ":hover": {
      backgroundColor: "var(--color-surface-hover)",
    },
  },
  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "16px",
    padding: "12px 0",
  },
  paginationInfo: {
    fontSize: "14px",
    color: "var(--color-text-secondary)",
  },
  paginationButtons: {
    display: "flex",
    gap: "8px",
  },
  badge: {
    display: "inline-block",
    padding: "2px 8px",
    fontSize: "12px",
    fontWeight: 500,
    borderRadius: "4px",
    backgroundColor: "var(--color-surface-secondary)",
    color: "var(--color-text-secondary)",
  },
  emptyState: {
    padding: "48px",
    textAlign: "center",
    color: "var(--color-text-secondary)",
    fontSize: "14px",
  },
  cleanupSection: {
    marginTop: "24px",
    padding: "16px",
    backgroundColor: "var(--color-surface)",
    borderRadius: "8px",
    border: "1px solid var(--color-border)",
  },
  cleanupTitle: {
    fontSize: "16px",
    fontWeight: 600,
    marginBottom: "12px",
  },
  cleanupForm: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
  },
})
