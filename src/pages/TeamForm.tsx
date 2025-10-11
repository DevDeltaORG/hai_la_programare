import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Code2, Users, GraduationCap, Mail } from "lucide-react";

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

const TeamForm = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<TeamData>>({
    teamId: teamId,
    teamName: "",
    professorName: "",
    professorPhone: "",
    professorEmail: "",
    schoolName: "",
    captainName: "",
    captainDiscord: "",
    student1Name: "",
    student1Discord: "",
    student2Name: "",
    student2Discord: "",
    student3Name: "",
    student3Discord: "",
    diplomaEmail: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.teamName || !formData.professorName || !formData.schoolName || !formData.captainName) {
      toast({
        title: "Date incomplete",
        description: "Te rugăm să completezi toate câmpurile obligatorii",
        variant: "destructive",
      });
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const completeTeamData: TeamData = {
      ...formData as TeamData,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    const teams = JSON.parse(localStorage.getItem("teams") || "{}");
    teams[teamId!] = completeTeamData;
    localStorage.setItem("teams", JSON.stringify(teams));

    toast({
      title: "Succes!",
      description: "Echipa a fost înregistrată cu succes",
    });

    navigate(`/team/${teamId}`);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Code2 className="w-12 h-12 text-primary mx-auto mb-4 glow-text" />
          <h1 className="text-4xl font-bold mb-2 glow-text">Formular de Înscriere</h1>
          <p className="text-muted-foreground">Completează datele echipei tale</p>
          <p className="text-sm text-primary mt-2">ID Echipă: {teamId}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Info */}
          <Card className="p-6 glow-border">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Informații Echipă</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="teamName">Nume Echipă *</Label>
                <Input
                  id="teamName"
                  value={formData.teamName}
                  onChange={(e) => handleInputChange("teamName", e.target.value)}
                  placeholder="CodeWarriors"
                  required
                />
              </div>
            </div>
          </Card>

          {/* Professor Info */}
          <Card className="p-6 glow-border">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-secondary" />
              <h2 className="text-2xl font-bold">Date Profesor Îndrumător</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="professorName">Nume Complet *</Label>
                <Input
                  id="professorName"
                  value={formData.professorName}
                  onChange={(e) => handleInputChange("professorName", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="professorPhone">Telefon</Label>
                <Input
                  id="professorPhone"
                  type="tel"
                  value={formData.professorPhone}
                  onChange={(e) => handleInputChange("professorPhone", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="professorEmail">Email</Label>
                <Input
                  id="professorEmail"
                  type="email"
                  value={formData.professorEmail}
                  onChange={(e) => handleInputChange("professorEmail", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="schoolName">Școala *</Label>
                <Input
                  id="schoolName"
                  value={formData.schoolName}
                  onChange={(e) => handleInputChange("schoolName", e.target.value)}
                  required
                />
              </div>
            </div>
          </Card>

          {/* Captain */}
          <Card className="p-6 glow-border">
            <div className="flex items-center gap-2 mb-4">
              <Code2 className="w-5 h-5 text-accent" />
              <h2 className="text-2xl font-bold">Căpitan Echipă</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="captainName">Nume Complet *</Label>
                <Input
                  id="captainName"
                  value={formData.captainName}
                  onChange={(e) => handleInputChange("captainName", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="captainDiscord">Discord</Label>
                <Input
                  id="captainDiscord"
                  value={formData.captainDiscord}
                  onChange={(e) => handleInputChange("captainDiscord", e.target.value)}
                  placeholder="username#1234"
                />
              </div>
            </div>
          </Card>

          {/* Students */}
          {[1, 2, 3].map((num) => (
            <Card key={num} className="p-6 glow-border">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-bold">Membru {num}</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`student${num}Name`}>Nume Complet</Label>
                  <Input
                    id={`student${num}Name`}
                    value={formData[`student${num}Name` as keyof typeof formData] as string}
                    onChange={(e) => handleInputChange(`student${num}Name`, e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`student${num}Discord`}>Discord</Label>
                  <Input
                    id={`student${num}Discord`}
                    value={formData[`student${num}Discord` as keyof typeof formData] as string}
                    onChange={(e) => handleInputChange(`student${num}Discord`, e.target.value)}
                    placeholder="username#1234"
                  />
                </div>
              </div>
            </Card>
          ))}

          {/* Diploma Email */}
          <Card className="p-6 glow-border">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-secondary" />
              <h2 className="text-2xl font-bold">Email pentru Diplomă</h2>
            </div>
            <div>
              <Label htmlFor="diplomaEmail">Email</Label>
              <Input
                id="diplomaEmail"
                type="email"
                value={formData.diplomaEmail}
                onChange={(e) => handleInputChange("diplomaEmail", e.target.value)}
                placeholder="team@example.com"
              />
            </div>
          </Card>

          <Button type="submit" size="lg" className="w-full hover-glow">
            Înregistrează Echipa
          </Button>
        </form>
      </div>
    </div>
  );
};

export default TeamForm;
