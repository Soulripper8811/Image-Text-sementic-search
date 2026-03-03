"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

// ────────────────────────────────────────────────
type TableInfo = { name: string; rowCount?: number };

export default function DatabasePage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("tables");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch list of tables once
  useEffect(() => {
    async function fetchTables() {
      try {
        setLoadingTables(true);
        const res = await fetch("/api/db/tables");
        if (!res.ok) throw new Error("Failed to load tables");
        const data = await res.json();
        setTables(data.tables || []);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Could not load table list";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoadingTables(false);
      }
    }
    fetchTables();
  }, []);

  // Fetch selected table data
  useEffect(() => {
    if (!selectedTable) {
      setTableData([]);
      return;
    }

    async function loadTableData() {
      setLoadingData(true);
      setError(null);
      try {
        const res = await fetch(`/api/db/tables/${selectedTable}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to load data");
        }
        const data = await res.json();
        setTableData(data.rows || []);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to load table data";
        setError(msg);
        toast.error(msg);
        setTableData([]);
      } finally {
        setLoadingData(false);
      }
    }

    loadTableData();
  }, [selectedTable]);

  const handleDangerousAction = async (
    action: "truncate" | "delete",
    table: string,
    requiresPassword: boolean = false,
  ) => {
    const isTruncate = action === "truncate";

    let password: string | undefined = undefined;

    if (requiresPassword) {
      const input = prompt(
        `Enter password to ${isTruncate ? "TRUNCATE" : action} table "${table}"\n` +
          "This action is irreversible!",
      );

      if (!input) {
        toast.info("Action cancelled");
        return;
      }

      password = input.trim();
      if (!password) {
        toast.error("Password cannot be empty");
        return;
      }
    }

    const message = isTruncate
      ? `TRUNCATE "${table}"? ALL DATA WILL BE PERMANENTLY DELETED!`
      : `DELETE TABLE "${table}"? This cannot be undone.`;

    if (!confirm(message)) return;

    setActionLoading(table);

    try {
      const endpoint = isTruncate ? "truncate" : "delete";

      const fetchOptions: RequestInit = {
        method: "POST",
      };

      if (password) {
        fetchOptions.headers = { "Content-Type": "application/json" };
        fetchOptions.body = JSON.stringify({ password });
      }

      const res = await fetch(`/api/db/${endpoint}/${table}`, fetchOptions);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to ${action} table`);
      }

      const result = await res.json();
      toast.success(result.message || `Table ${table} ${action}d`);

      if (selectedTable === table) {
        setTableData([]);
      }

      // Optional: refresh table list / counts
      // fetchTables();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : `Failed to ${action} table`;
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const refreshCurrentTable = () => {
    if (selectedTable) setSelectedTable(selectedTable); // re-triggers useEffect
  };

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Database Manager</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshCurrentTable}
          disabled={loadingData}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="actions">Danger Zone</TabsTrigger>
        </TabsList>

        {/* TABLES TAB */}
        <TabsContent value="tables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Tables</CardTitle>
              <CardDescription>
                Click a table to view its records (admin only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTables ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-destructive text-center py-8">{error}</div>
              ) : tables.length === 0 ? (
                <div className="text-muted-foreground text-center py-10">
                  No tables found
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {tables.map((t) => (
                    <Button
                      key={t.name}
                      variant={selectedTable === t.name ? "default" : "outline"}
                      onClick={() => setSelectedTable(t.name)}
                      className="min-w-32.5"
                      disabled={loadingData}
                    >
                      {t.name}
                      {t.rowCount !== undefined && (
                        <span className="ml-1.5 text-xs opacity-70">
                          ({t.rowCount})
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedTable && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-4">
                  <span>
                    Table:{" "}
                    <code className="text-primary bg-muted px-1.5 py-0.5 rounded">
                      {selectedTable}
                    </code>
                  </span>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {tableData.length} record{tableData.length !== 1 ? "s" : ""}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={refreshCurrentTable}
                      disabled={loadingData}
                      title="Refresh table"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent>
                {loadingData ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-10 w-10 animate-spin text-primary/70" />
                  </div>
                ) : error ? (
                  <div className="text-destructive text-center py-12">
                    {error}
                  </div>
                ) : tableData.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground border border-dashed rounded-lg">
                    This table is empty
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(tableData[0] || {}).map((key) => (
                              <TableHead
                                key={key}
                                className="capitalize whitespace-nowrap"
                              >
                                {key.replace(/_/g, " ")}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tableData.map((row, idx) => (
                            <TableRow key={idx}>
                              {Object.values(row).map((value: any, i) => (
                                <TableCell
                                  key={i}
                                  className="whitespace-nowrap"
                                >
                                  {value === null || value === undefined
                                    ? "—"
                                    : typeof value === "object"
                                      ? JSON.stringify(value)
                                      : String(value)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!selectedTable && !loadingTables && (
            <div className="text-center py-20 text-muted-foreground bg-muted/40 rounded-xl border border-dashed">
              Select a table above to view its contents
            </div>
          )}
        </TabsContent>

        {/* DANGER ZONE TAB */}
        <TabsContent value="actions">
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-destructive/80">
                These actions are irreversible. Use extreme caution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-2">
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Table Operations</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tables.map((t) => (
                    <div
                      key={t.name}
                      className="flex flex-col gap-2 p-4 border rounded-lg bg-destructive/5"
                    >
                      <div className="font-medium">{t.name}</div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleDangerousAction("truncate", t.name, true)
                          }
                          disabled={actionLoading === t.name || loadingTables}
                        >
                          {actionLoading === t.name ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1.5" />
                          )}
                          Truncate
                        </Button>

                        {/* If you later implement DROP TABLE endpoint: */}
                        {/* <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDangerousAction("delete", t.name, false)}
                        >
                          <Trash2 className="h-4 w-4 mr-1.5" />
                          Delete Table
                        </Button> */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
