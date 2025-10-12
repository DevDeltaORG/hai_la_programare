import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Search, Download } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient.ts";

interface TeamData {
    id: string;
    name: string;
    school: string;
    coordinator_name: string; // profesor
    captain_name: string;
    created_at?: string | null;
}

const Admin = () => {
    const { toast } = useToast();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [teams, setTeams] = useState<TeamData[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTeam, setSelectedTeam] = useState<TeamData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) loadTeams();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    const loadTeams = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from<TeamData>("teams")
                .select("id, name, school, coordinator_name, captain_name")

            if (error) {
                console.error("Supabase error:", error);
                toast({
                    title: "Eroare la încărcare",
                    description: "Nu am putut obține lista de echipe (vezi consolă).",
                    variant: "destructive",
                });
                setLoading(false);
                return;
            }

            const items: TeamData[] = (data || []).map((r) => ({
                id: String((r as any).id ?? ""),
                name: (r as any).name ?? "",
                school: (r as any).school ?? "",
                coordinator_name: (r as any).coordinator_name ?? "",
                captain_name: (r as any).captain_name ?? "",
                created_at: (r as any).created_at ?? null,
            }));

            setTeams(items);
        } catch (err) {
            console.error("Unexpected error fetching teams:", err);
            toast({
                title: "Eroare neașteptată",
                description: "A apărut o eroare la obținerea datelor.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = () => {
        const OBFUSCAT3D = String.fromCharCode(97, 100, 109, 105, 110, 49, 50, 51); // "admin123"
        if (password === OBFUSCAT3D) {
            setIsAuthenticated(true);
            toast({
                title: "Autentificare reușită",
                description: "Bun venit în panoul de administrare",
            });
        } else {
            toast({
                title: "Eroare",
                description: "Parolă incorectă",
                variant: "destructive",
            });
        }
    };

    const exportToCSV = () => {
        const headers = ["ID Echipă", "Nume Echipă", "Școală", "Profesor", "Căpitan", "Data Înregistrării"];
        const csvRows = teams.map((t) => {
            const row = [
                t.id,
                (t.name || "").replaceAll('"', '""'),
                (t.school || "").replaceAll('"', '""'),
                (t.coordinator_name || "").replaceAll('"', '""'),
                (t.captain_name || "").replaceAll('"', '""'),
                t.created_at ? new Date(t.created_at).toLocaleString("ro-RO") : "",
            ];
            // wrap fields that may contain commas in quotes
            return row.map((c) => `"${String(c ?? "")}"`).join(",");
        });

        const csvContent = [headers.map((h) => `"${h}"`).join(","), ...csvRows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `echipe_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();

        toast({
            title: "Export reușit",
            description: "Datele au fost exportate în format CSV",
        });
    };

    const filteredTeams = teams.filter((team) =>
        [team.name, team.school, team.coordinator_name]
            .join(" ")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="w-full max-w-md p-8 glow-border">
                    <div className="text-center mb-6">
                        <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
                        <h1 className="text-3xl font-bold">Admin Login</h1>
                        <p className="text-muted-foreground mt-2">Introdu parola pentru acces</p>
                    </div>
                    <div className="space-y-4">
                        <Input
                            type="password"
                            placeholder="Parolă"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                        />
                        <Button onClick={handleLogin} className="w-full">
                            Autentifică-te
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-12 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold glow-text">Admin Dashboard</h1>
                        <p className="text-muted-foreground mt-2">
                            Total echipe înregistrate: {teams.length} {loading && "(se încarcă...)"}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button onClick={loadTeams} className="hover-glow" variant="ghost">
                            Reîncarcă
                        </Button>
                        <Button onClick={exportToCSV} className="hover-glow">
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                <Card className="p-6 glow-border mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Caută după nume echipă, școală sau profesor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </Card>

                <Card className="glow-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nume Echipă</TableHead>
                                    <TableHead>Școală</TableHead>
                                    <TableHead>Profesor</TableHead>
                                    <TableHead>Căpitan</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Acțiuni</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTeams.map((team) => (
                                    <TableRow key={team.id}>
                                        <TableCell className="font-medium">{team.name}</TableCell>
                                        <TableCell>{team.school}</TableCell>
                                        <TableCell>{team.coordinator_name}</TableCell>
                                        <TableCell>{team.captain_name}</TableCell>
                                        <TableCell>{/* lăsat gol intenționat (Data) */}</TableCell>
                                        <TableCell>{/* lăsat gol intenționat (Acțiuni) */}</TableCell>
                                    </TableRow>
                                ))}

                                {filteredTeams.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                            Nu sunt echipe care să corespundă criteriului de căutare.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                <Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{selectedTeam?.name}</DialogTitle>
                            <DialogDescription>Detalii complete echipă</DialogDescription>
                        </DialogHeader>
                        {selectedTeam && (
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">ID Echipă</p>
                                        <p className="font-mono">{selectedTeam.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Școală</p>
                                        <p>{selectedTeam.school}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Profesor</p>
                                        <p>{selectedTeam.coordinator_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Căpitan</p>
                                        <p>{selectedTeam.captain_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Data înregistrării</p>
                                        <p>{selectedTeam.created_at ? new Date(selectedTeam.created_at).toLocaleString("ro-RO") : "-"}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default Admin;
