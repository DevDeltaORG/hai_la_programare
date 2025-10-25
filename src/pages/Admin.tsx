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
import { Shield, Search, Download, Eye, Trash2, ExternalLink, CheckCircle2, XCircle, Mail, MessageSquare } from "lucide-react";
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
    coordinator_phone?: string;
    coordinator_email: string;
    captain_name: string;
    captain_email?: string;
    captain_discord?: string;
    member1_name?: string;
    member1_email?: string;
    member1_discord?: string;
    member2_name?: string;
    member2_email?: string;
    member2_discord?: string;
    member3_name?: string;
    member3_email?: string;
    member3_discord?: string;
    created_at?: string | null;
    solution_link?: string | null;
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
            if (row.flag === "registration") setRegistrationOpen(row.value === "TRUE" || row.value === true);
            if (row.flag === "start") setContestStarted(row.value === "TRUE" || row.value === true);
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

        toast({
            title: "Succes",
            description: `Linkul pentru ${modalType} a fost salvat.`,
        });

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
                .from("teams")
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

        toast({
            title: "Echipă ștearsă",
            description: `${selectedTeam.name} a fost eliminată.`,
        });

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

    // 🔹 Numără membri
    const countMembers = (team: TeamData) => {
        let count = 1; // Căpitanul
        if (team.member1_name) count++;
        if (team.member2_name) count++;
        if (team.member3_name) count++;
        return count;
    };

    // 🔹 Export CSV
    const exportToCSV = () => {
        const headers = [
            "ID", "Nume", "Școală", "Profesor", "Email Profesor", "Telefon Profesor",
            "Căpitan", "Email Căpitan", "Discord Căpitan",
            "Membru 1", "Email Membru 1", "Discord Membru 1",
            "Membru 2", "Email Membru 2", "Discord Membru 2",
            "Membru 3", "Email Membru 3", "Discord Membru 3",
            "Link Soluție", "Data"
        ];

        const csvRows = teams.map((t) => [
            t.id,
            `"${(t.name || "").replaceAll('"', '""')}"`,
            `"${(t.school || "").replaceAll('"', '""')}"`,
            `"${(t.coordinator_name || "").replaceAll('"', '""')}"`,
            `"${(t.coordinator_email || "").replaceAll('"', '""')}"`,
            `"${(t.coordinator_phone || "").replaceAll('"', '""')}"`,
            `"${(t.captain_name || "").replaceAll('"', '""')}"`,
            `"${(t.captain_email || "").replaceAll('"', '""')}"`,
            `"${(t.captain_discord || "").replaceAll('"', '""')}"`,
            `"${(t.member1_name || "").replaceAll('"', '""')}"`,
            `"${(t.member1_email || "").replaceAll('"', '""')}"`,
            `"${(t.member1_discord || "").replaceAll('"', '""')}"`,
            `"${(t.member2_name || "").replaceAll('"', '""')}"`,
            `"${(t.member2_email || "").replaceAll('"', '""')}"`,
            `"${(t.member2_discord || "").replaceAll('"', '""')}"`,
            `"${(t.member3_name || "").replaceAll('"', '""')}"`,
            `"${(t.member3_email || "").replaceAll('"', '""')}"`,
            `"${(t.member3_discord || "").replaceAll('"', '""')}"`,
            `"${(t.solution_link || "").replaceAll('"', '""')}"`,
            t.created_at ? new Date(t.created_at).toLocaleString("ro-RO") : "",
        ].join(","));

        const csvContent = [headers.join(","), ...csvRows].join("\n");
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

    // 🔹 Render membru cu detalii
    const renderMemberDetails = (name?: string, email?: string, discord?: string) => {
        if (!name) return null;

        return (
            <div className="bg-muted/50 p-3 rounded-lg space-y-1">
                <p className="font-medium">{name}</p>
                {email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span>{email}</span>
                    </div>
                )}
                {discord && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="w-3 h-3" />
                        <span>{discord}</span>
                    </div>
                )}
            </div>
        );
    };

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
                            onClick={() => {
                                setModalType("gimnaziu");
                                setSubjectLink(existingLinks.gimnaziu || "");
                                setShowModal(true);
                            }}
                        >
                            Upload Gimnaziu
                        </Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => {
                                setModalType("liceu");
                                setSubjectLink(existingLinks.liceu || "");
                                setShowModal(true);
                            }}
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
                                    <TableHead>Membri</TableHead>
                                    <TableHead>Soluție</TableHead>
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
                                        <TableCell>
                                            <span className="text-sm">{countMembers(team)} membri</span>
                                        </TableCell>
                                        <TableCell>
                                            {team.solution_link ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-red-500" />
                                            )}
                                        </TableCell>
                                        <TableCell>{team.created_at ? new Date(team.created_at).toLocaleString("ro-RO") : "-"}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button size="sm" variant="secondary" onClick={() => handleViewTeam(team.id)}>
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => {
                                                    setSelectedTeam(team);
                                                    setShowDeleteConfirm(true);
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredTeams.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
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
                    <DialogHeader>
                        <DialogTitle>
                            {modalType === "gimnaziu" ? "Upload Subiecte Gimnaziu" : "Upload Subiecte Liceu"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="Introdu linkul Google Drive..."
                            value={subjectLink}
                            onChange={(e) => setSubjectLink(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowModal(false)}>Anulează</Button>
                        <Button onClick={handleUploadSubject}>Salvează</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL: View Team */}
            <Dialog open={showTeamModal} onOpenChange={setShowTeamModal}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detalii echipă</DialogTitle>
                    </DialogHeader>
                    {selectedTeam ? (
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <p><b>Nume echipă:</b> {selectedTeam.name}</p>
                                <p><b>Școală:</b> {selectedTeam.school}</p>
                            </div>

                            <div className="pt-2 border-t">
                                <p className="font-semibold mb-2">Profesor Coordonator:</p>
                                <div className="bg-muted/50 p-3 rounded-lg space-y-1">
                                    <p className="font-medium">{selectedTeam.coordinator_name}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="w-3 h-3" />
                                        <span>{selectedTeam.coordinator_email}</span>
                                    </div>
                                    {selectedTeam.coordinator_phone && (
                                        <p className="text-sm text-muted-foreground">📞 {selectedTeam.coordinator_phone}</p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2 border-t">
                                <p className="font-semibold mb-3">Membri echipă:</p>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-semibold text-muted-foreground mb-1">Căpitan</p>
                                        {renderMemberDetails(
                                            selectedTeam.captain_name,
                                            selectedTeam.captain_email,
                                            selectedTeam.captain_discord
                                        )}
                                    </div>

                                    {selectedTeam.member1_name && (
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground mb-1">Membru 1</p>
                                            {renderMemberDetails(
                                                selectedTeam.member1_name,
                                                selectedTeam.member1_email,
                                                selectedTeam.member1_discord
                                            )}
                                        </div>
                                    )}

                                    {selectedTeam.member2_name && (
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground mb-1">Membru 2</p>
                                            {renderMemberDetails(
                                                selectedTeam.member2_name,
                                                selectedTeam.member2_email,
                                                selectedTeam.member2_discord
                                            )}
                                        </div>
                                    )}

                                    {selectedTeam.member3_name && (
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground mb-1">Membru 3</p>
                                            {renderMemberDetails(
                                                selectedTeam.member3_name,
                                                selectedTeam.member3_email,
                                                selectedTeam.member3_discord
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2 border-t">
                                <p className="text-sm text-muted-foreground">
                                    <b>Data înregistrării:</b> {selectedTeam.created_at ? new Date(selectedTeam.created_at).toLocaleString("ro-RO") : "-"}
                                </p>
                            </div>

                            <div className="pt-2 border-t">
                                <p className="font-semibold mb-2">Status Soluție:</p>
                                {selectedTeam.solution_link ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-green-600">
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span className="font-medium">Soluție încărcată</span>
                                        </div>
                                        <a
                                            href={selectedTeam.solution_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            <span>Deschide link-ul soluției</span>
                                        </a>
                                        <p className="text-sm text-muted-foreground break-all">
                                            {selectedTeam.solution_link}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-red-600">
                                        <XCircle className="w-5 h-5" />
                                        <span className="font-medium">Nicio soluție încărcată</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p>Se încarcă...</p>
                    )}
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowTeamModal(false)}>Închide</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL: Confirm Delete */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Confirmare Ștergere</DialogTitle>
                    </DialogHeader>
                    <p>
                        Ești sigur că vrei să ștergi echipa <b>{selectedTeam?.name}</b>? Această acțiune este permanentă.
                    </p>
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