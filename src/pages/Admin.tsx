import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Shield, Search, Download, Eye, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient.ts";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

interface TeamData {
    id: string;
    name: string;
    school: string;
    coordinator_name: string;
    captain_name: string;
    created_at?: string | null;
    members?: string[];
    email?: string;
    phone?: string;
}

const Admin = () => {
    const { toast } = useToast();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [teams, setTeams] = useState<TeamData[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);

    const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);
    const [contestStarted, setContestStarted] = useState<boolean | null>(null);

    // 🔹 Modal pentru subiecte
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<"gimnaziu" | "liceu" | null>(null);
    const [subjectLink, setSubjectLink] = useState("");
    const [existingLinks, setExistingLinks] = useState<{ gimnaziu?: string; liceu?: string }>({});

    // 🔹 Modal pentru vizualizare / ștergere echipă
    const [selectedTeam, setSelectedTeam] = useState<TeamData | null>(null);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            loadTeams();
            loadFlags();
            loadSubjects();
        }
    }, [isAuthenticated]);

    // 🔹 Încarcă toate flag-urile
    const loadFlags = async () => {
        const { data, error } = await supabase
            .from("flags")
            .select("flag, value")
            .in("flag", ["registration", "start"]);

        if (error) {
            toast({
                title: "Eroare",
                description: "Nu s-au putut încărca stările curente.",
                variant: "destructive",
            });
            return;
        }

        data?.forEach((row) => {
            if (row.flag === "registration")
                setRegistrationOpen(row.value === "TRUE" || row.value === true);
            if (row.flag === "start")
                setContestStarted(row.value === "TRUE" || row.value === true);
        });
    };

    // 🔹 Încarcă linkurile de subiecte
    const loadSubjects = async () => {
        const { data, error } = await supabase
            .from("flags")
            .select("flag, value")
            .in("flag", ["subject_gimnaziu", "subject_liceu"]);

        if (error) return;
        const links: any = {};
        data?.forEach((row) => {
            if (row.flag === "subject_gimnaziu") links.gimnaziu = row.value;
            if (row.flag === "subject_liceu") links.liceu = row.value;
        });
        setExistingLinks(links);
    };

    // 🔹 Upload subiecte
    const handleUploadSubject = async () => {
        if (!modalType) return;
        const flagName = modalType === "gimnaziu" ? "subject_gimnaziu" : "subject_liceu";

        const { error } = await supabase
            .from("flags")
            .upsert([{ flag: flagName, value: subjectLink }], { onConflict: "flag" });

        if (error) {
            toast({
                title: "Eroare",
                description: "Nu s-a putut salva linkul subiectului.",
                variant: "destructive",
            });
            return;
        }

        toast({ title: "Succes", description: `Linkul pentru ${modalType} a fost salvat.` });
        setShowModal(false);
        setSubjectLink("");
        loadSubjects();
    };

    // 🔹 Pornește / oprește înscrieri
    const toggleRegistration = async () => {
        if (registrationOpen === null) return;
        const newValue = registrationOpen ? "FALSE" : "TRUE";
        const { error } = await supabase.from("flags").update({ value: newValue }).eq("flag", "registration");
        if (error) {
            toast({
                title: "Eroare",
                description: "Nu s-a putut actualiza starea înscrierilor.",
                variant: "destructive",
            });
            return;
        }
        setRegistrationOpen(newValue === "TRUE");
        toast({
            title: newValue === "TRUE" ? "Înscrierile au fost pornite" : "Înscrierile au fost oprite",
        });
    };

    // 🔹 Pornește / oprește concurs
    const toggleContest = async () => {
        if (contestStarted === null) return;
        const newValue = contestStarted ? "FALSE" : "TRUE";
        const { error } = await supabase.from("flags").update({ value: newValue }).eq("flag", "start");
        if (error) {
            toast({
                title: "Eroare",
                description: "Nu s-a putut actualiza starea concursului.",
                variant: "destructive",
            });
            return;
        }
        setContestStarted(newValue === "TRUE");
        toast({
            title: newValue === "TRUE" ? "Concursul a fost pornit" : "Concursul a fost oprit",
        });
    };

    // 🔹 Încarcă echipele
    const loadTeams = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from<TeamData>("teams")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setTeams(data || []);
        } catch (err) {
            toast({
                title: "Eroare",
                description: "Nu am putut obține lista de echipe.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Vizualizare echipă
    const handleViewTeam = async (teamId: string) => {
        const { data, error } = await supabase.from("teams").select("*").eq("id", teamId).maybeSingle();
        if (error) {
            toast({
                title: "Eroare",
                description: "Nu s-a putut încărca detaliile echipei.",
                variant: "destructive",
            });
            return;
        }
        setSelectedTeam(data);
        setShowTeamModal(true);
    };

    // 🔹 Ștergere echipă
    const handleDeleteTeam = async () => {
        if (!selectedTeam) return;
        const { error } = await supabase.from("teams").delete().eq("id", selectedTeam.id);
        if (error) {
            toast({
                title: "Eroare",
                description: "Nu s-a putut șterge echipa.",
                variant: "destructive",
            });
            return;
        }
        toast({ title: "Echipă ștearsă", description: `${selectedTeam.name} a fost eliminată.` });
        setTeams((prev) => prev.filter((t) => t.id !== selectedTeam.id));
        setShowDeleteConfirm(false);
        setShowTeamModal(false);
    };

    // 🔹 Login admin
    const handleLogin = async () => {
        const res = await supabase.from("flags").select("value").eq("flag", "admin_password").maybeSingle();
        if (password === res.data?.value) {
            setIsAuthenticated(true);
            toast({ title: "Autentificare reușită", description: "Bun venit în panoul de administrare" });
        } else {
            toast({ title: "Eroare", description: "Parolă incorectă", variant: "destructive" });
        }
    };

    // 🔹 Export CSV
    const exportToCSV = () => {
        const headers = ["ID", "Nume", "Școală", "Profesor", "Căpitan", "Data"];
        const csvRows = teams.map((t) =>
            [
                t.id,
                `"${(t.name || "").replaceAll('"', '""')}"`,
                `"${(t.school || "").replaceAll('"', '""')}"`,
                `"${(t.coordinator_name || "").replaceAll('"', '""')}"`,
                `"${(t.captain_name || "").replaceAll('"', '""')}"`,
                t.created_at ? new Date(t.created_at).toLocaleString("ro-RO") : "",
            ].join(",")
        );
        const csvContent = [headers.join(","), ...csvRows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `echipe_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        toast({ title: "Export reușit", description: "Datele au fost exportate în format CSV" });
    };

    const filteredTeams = teams.filter((team) =>
        [team.name, team.school, team.coordinator_name]
            .join(" ")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    // 🔹 Login screen
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
                {/* HEADER */}
                <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold glow-text">Admin Dashboard</h1>
                        <p className="text-muted-foreground mt-2">
                            Total echipe: {teams.length} {loading && "(se încarcă...)"}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <Button onClick={() => window.location.reload()} variant="ghost">Reîncarcă</Button>
                        <Button onClick={exportToCSV}><Download className="w-4 h-4 mr-2" />Export CSV</Button>
                        <Button
                            onClick={toggleRegistration}
                            className={registrationOpen ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                        >
                            {registrationOpen ? "Oprește Înscrierile" : "Pornește Înscrierile"}
                        </Button>
                        <Button
                            onClick={toggleContest}
                            className={contestStarted ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                        >
                            {contestStarted ? "STOP Concurs" : "START Concurs"}
                        </Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => { setModalType("gimnaziu"); setSubjectLink(existingLinks.gimnaziu || ""); setShowModal(true); }}
                        >
                            Upload Gimnaziu
                        </Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => { setModalType("liceu"); setSubjectLink(existingLinks.liceu || ""); setShowModal(true); }}
                        >
                            Upload Liceu
                        </Button>
                    </div>
                </div>

                {/* DOCUMENTAȚIE STATUS */}
                <Card className="p-4 mb-4 border border-muted glow-border">
                    <h2 className="text-lg font-semibold mb-2">📊 Stare Curentă</h2>
                    <p><b>Înscrieri:</b> {registrationOpen ? "ACTIVE" : "INACTIVE"}</p>
                    <p><b>Concurs:</b> {contestStarted ? "STARTED" : "STOPPED"}</p>
                    <p><b>Subiect Gimnaziu:</b> {existingLinks.gimnaziu ? "✅ Setat" : "❌ Lipsă"}</p>
                    <p><b>Subiect Liceu:</b> {existingLinks.liceu ? "✅ Setat" : "❌ Lipsă"}</p>
                </Card>

                {/* SEARCH */}
                <Card className="p-6 mb-6 glow-border">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Caută după nume echipă, școală sau profesor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </Card>

                {/* TABLE */}
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
                                    <TableHead className="text-right">Acțiuni</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTeams.map((team) => (
                                    <TableRow key={team.id}>
                                        <TableCell>{team.name}</TableCell>
                                        <TableCell>{team.school}</TableCell>
                                        <TableCell>{team.coordinator_name}</TableCell>
                                        <TableCell>{team.captain_name}</TableCell>
                                        <TableCell>{team.created_at ? new Date(team.created_at).toLocaleString("ro-RO") : "-"}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button size="sm" variant="secondary" onClick={() => handleViewTeam(team.id)}>
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => { setSelectedTeam(team); setShowDeleteConfirm(true); }}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredTeams.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                            Nu sunt echipe care corespund criteriului de căutare.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>

            {/* MODAL: Subiecte */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>{modalType === "gimnaziu" ? "Upload Subiecte Gimnaziu" : "Upload Subiecte Liceu"}</DialogTitle></DialogHeader>
                    <div className="py-4"><Input placeholder="Introdu linkul Google Drive..." value={subjectLink} onChange={(e) => setSubjectLink(e.target.value)} /></div>
                    <DialogFooter><Button variant="ghost" onClick={() => setShowModal(false)}>Anulează</Button><Button onClick={handleUploadSubject}>Salvează</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL: View Team */}
            <Dialog open={showTeamModal} onOpenChange={setShowTeamModal}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Detalii echipă</DialogTitle></DialogHeader>
                    {selectedTeam ? (
                        <div className="space-y-3 py-2">
                            <p><b>Nume:</b> {selectedTeam.name}</p>
                            <p><b>Școală:</b> {selectedTeam.school}</p>
                            <p><b>Profesor:</b> {selectedTeam.coordinator_name}</p>
                            <p><b>Căpitan:</b> {selectedTeam.captain_name}</p>
                            {selectedTeam.email && <p><b>Email:</b> {selectedTeam.email}</p>}
                            {selectedTeam.phone && <p><b>Telefon:</b> {selectedTeam.phone}</p>}
                            {selectedTeam.members && <p><b>Membri:</b> {selectedTeam.members.join(", ")}</p>}
                            <p><b>Data:</b> {selectedTeam.created_at ? new Date(selectedTeam.created_at).toLocaleString("ro-RO") : "-"}</p>
                        </div>
                    ) : <p>Se încarcă...</p>}
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowTeamModal(false)}>Închide</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL: Confirm Delete */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>Confirmare Ștergere</DialogTitle></DialogHeader>
                    <p>Ești sigur că vrei să ștergi echipa <b>{selectedTeam?.name}</b>? Această acțiune este permanentă.</p>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Anulează</Button>
                        <Button variant="destructive" onClick={handleDeleteTeam}>Șterge</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Admin;
