import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Code2, Copy, Edit, Users, GraduationCap, Mail } from "lucide-react";

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

const TeamDashboard = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teamData, setTeamData] = useState<TeamData | null>(null);

  useEffect(() => {
    const teams = JSON.parse(localStorage.getItem("teams") || "{}");
    const team = teams[teamId!];
    
    if (!team) {
      toast({
        title: "Echipă negăsită",
        description: "Această echipă nu există sau nu a fost înregistrată încă",
        variant: "destructive",
      });
      navigate("/register");
      return;
    }

    setTeamData(team);
  }, [teamId, navigate, toast]);

  const copyTeamId = () => {
    navigator.clipboard.writeText(teamId!);
    toast({
      title: "Copiat!",
      description: "ID-ul echipei a fost copiat în clipboard",
    });
  };

  if (!teamData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Code2 className="w-12 h-12 text-primary mx-auto mb-4 glow-text" />
          <h1 className="text-4xl font-bold mb-2 glow-text">{teamData.teamName}</h1>
          <p className="text-muted-foreground">{teamData.schoolName}</p>
          
          <div className="flex items-center justify-center gap-2 mt-4">
            <code className="bg-card px-4 py-2 rounded-lg text-sm border border-primary/30">
              {teamId}
            </code>
            <Button variant="outline" size="sm" onClick={copyTeamId}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Professor Info */}
          <Card className="p-6 glow-border">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-secondary" />
              <h2 className="text-xl font-bold">Profesor Îndrumător</h2>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Nume:</span> {teamData.professorName}</p>
              {teamData.professorPhone && (
                <p><span className="text-muted-foreground">Telefon:</span> {teamData.professorPhone}</p>
              )}
              {teamData.professorEmail && (
                <p><span className="text-muted-foreground">Email:</span> {teamData.professorEmail}</p>
              )}
            </div>
          </Card>

          {/* Team Info */}
          <Card className="p-6 glow-border">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Informații Echipă</h2>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Școala:</span> {teamData.schoolName}</p>
              {teamData.diplomaEmail && (
                <p><span className="text-muted-foreground">Email diplomă:</span> {teamData.diplomaEmail}</p>
              )}
              <p><span className="text-muted-foreground">Înregistrată:</span> {new Date(teamData.createdAt).toLocaleDateString('ro-RO')}</p>
            </div>
          </Card>
        </div>

        {/* Team Members */}
        <Card className="p-6 glow-border mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Code2 className="w-5 h-5 text-accent" />
            <h2 className="text-2xl font-bold">Membri Echipă</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Captain */}
            <div className="p-4 bg-accent/10 rounded-lg border border-accent/30">
              <p className="text-xs text-accent font-mono mb-2">CĂPITAN</p>
              <p className="font-bold">{teamData.captainName}</p>
              {teamData.captainDiscord && (
                <p className="text-sm text-muted-foreground">Discord: {teamData.captainDiscord}</p>
              )}
            </div>

            {/* Members */}
            {[1, 2, 3].map((num) => {
              const name = teamData[`student${num}Name` as keyof TeamData] as string;
              const discord = teamData[`student${num}Discord` as keyof TeamData] as string;
              
              if (!name) return null;

              return (
                <div key={num} className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                  <p className="text-xs text-primary font-mono mb-2">MEMBRU {num}</p>
                  <p className="font-bold">{name}</p>
                  {discord && (
                    <p className="text-sm text-muted-foreground">Discord: {discord}</p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate(`/team/${teamId}/form`)} className="hover-glow">
            <Edit className="w-4 h-4 mr-2" />
            Editează Datele
          </Button>
          <Button variant="outline" onClick={() => navigate("/")}>
            Înapoi Acasă
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeamDashboard;
