import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Search, Download, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TeamData {
  teamId: string;
  teamName: string;
  professorName: string;
  professorPhone: string;
  professorEmail: string;
  schoolName: string;
  captainName: string;
  captainDiscord: string;
  student1Name: string;
  student1Discord: string;
  student2Name: string;
  student2Discord: string;
  student3Name: string;
  student3Discord: string;
  diplomaEmail: string;
  createdBy: string;
  createdAt: string;
}

const Admin = () => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<TeamData | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadTeams();
    }
  }, [isAuthenticated]);

  const loadTeams = () => {
    const teamsData = JSON.parse(localStorage.getItem("teams") || "{}");
    const teamsArray = Object.values(teamsData) as TeamData[];
    setTeams(teamsArray);
  };

  const handleLogin = () => {
    // Simple password check - in production, use real authentication
      const OBFUSCAT3D = String.fromCharCode(97,100,109,105,110,49,50,51)
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
    const headers = [
      "ID Echipă",
      "Nume Echipă",
      "Professor",
      "Telefon Professor",
      "Email Professor",
      "Școală",
      "Căpitan",
      "Discord Căpitan",
      "Membru 1",
      "Discord 1",
      "Membru 2",
      "Discord 2",
      "Membru 3",
      "Discord 3",
      "Email Diplomă",
      "Data Înscriere"
    ];

    const csvContent = [
      headers.join(","),
      ...teams.map(team => [
        team.teamId,
        team.teamName,
        team.professorName,
        team.professorPhone,
        team.professorEmail,
        team.schoolName,
        team.captainName,
        team.captainDiscord,
        team.student1Name,
        team.student1Discord,
        team.student2Name,
        team.student2Discord,
        team.student3Name,
        team.student3Discord,
        team.diplomaEmail,
        new Date(team.createdAt).toLocaleDateString('ro-RO')
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `echipe_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Export reușit",
      description: "Datele au fost exportate în format CSV",
    });
  };

  const filteredTeams = teams.filter(team =>
    team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.professorName.toLowerCase().includes(searchTerm.toLowerCase())
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
              Total echipe înregistrate: {teams.length}
            </p>
          </div>
          <Button onClick={exportToCSV} className="hover-glow">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
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
                  <TableRow key={team.teamId}>
                    <TableCell className="font-medium">{team.teamName}</TableCell>
                    <TableCell>{team.schoolName}</TableCell>
                    <TableCell>{team.professorName}</TableCell>
                    <TableCell>{team.captainName}</TableCell>
                    <TableCell>
                      {new Date(team.createdAt).toLocaleDateString('ro-RO')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTeam(team)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTeam?.teamName}</DialogTitle>
              <DialogDescription>Detalii complete echipă</DialogDescription>
            </DialogHeader>
            {selectedTeam && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">ID Echipă</p>
                    <p className="font-mono">{selectedTeam.teamId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Școală</p>
                    <p>{selectedTeam.schoolName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Profesor</p>
                    <p>{selectedTeam.professorName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Telefon Profesor</p>
                    <p>{selectedTeam.professorPhone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email Profesor</p>
                    <p>{selectedTeam.professorEmail || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email Diplomă</p>
                    <p>{selectedTeam.diplomaEmail || "-"}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-2">Membri Echipă</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-accent/10 rounded">
                      <p className="font-semibold">Căpitan: {selectedTeam.captainName}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedTeam.captainDiscord || "Fără Discord"}
                      </p>
                    </div>
                    {[1, 2, 3].map((num) => {
                      const name = selectedTeam[`student${num}Name` as keyof TeamData] as string;
                      const discord = selectedTeam[`student${num}Discord` as keyof TeamData] as string;
                      if (!name) return null;
                      return (
                        <div key={num} className="p-3 bg-primary/10 rounded">
                          <p className="font-semibold">Membru {num}: {name}</p>
                          <p className="text-sm text-muted-foreground">
                            {discord || "Fără Discord"}
                          </p>
                        </div>
                      );
                    })}
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
