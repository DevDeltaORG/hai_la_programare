import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Code2 } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isJoining, setIsJoining] = useState(false);
  const [teamCode, setTeamCode] = useState("");

  const handleCreateTeam = () => {
    const teamId = `team_${Date.now()}`;
    const mockUser = { id: `user_${Date.now()}`, name: "User" };
    localStorage.setItem("currentUser", JSON.stringify(mockUser));
    navigate(`/team/${teamId}/form`);
  };

  const handleJoinTeam = () => {
    if (!teamCode.trim()) {
      toast({
        title: "Cod lipsă",
        description: "Te rugăm să introduci codul echipei",
        variant: "destructive",
      });
      return;
    }

    const teams = JSON.parse(localStorage.getItem("teams") || "{}");
    if (!teams[teamCode]) {
      toast({
        title: "Echipă inexistentă",
        description: "Codul introdus nu corespunde niciunei echipe",
        variant: "destructive",
      });
      return;
    }

    const mockUser = { id: `user_${Date.now()}`, name: "User" };
    localStorage.setItem("currentUser", JSON.stringify(mockUser));
    navigate(`/team/${teamCode}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Code2 className="w-12 h-12 text-primary glow-text" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 glow-text">
            Alege-ți Drumul
          </h1>
          <p className="text-muted-foreground text-lg">
            Creează o echipă nouă sau alătură-te unei echipe existente
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Team Card */}
          <Card className="p-8 glow-border hover-glow cursor-pointer" onClick={handleCreateTeam}>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/20 rounded-lg flex items-center justify-center">
                <Code2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Creează Echipă</h2>
              <p className="text-muted-foreground">
                Înființează o echipă nouă și invită-ți colegii să se alăture
              </p>
              <Button className="w-full mt-4">
                Creează Echipă Nouă
              </Button>
            </div>
          </Card>

          {/* Join Team Card */}
          <Card className="p-8 glow-border">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-secondary/20 rounded-lg flex items-center justify-center">
                <Code2 className="w-8 h-8 text-secondary" />
              </div>
              <h2 className="text-2xl font-bold">Alătură-te Echipei</h2>
              <p className="text-muted-foreground">
                Ai deja un cod de echipă? Introdu-l aici pentru a te alătura
              </p>
              <div className="space-y-3 mt-4">
                <div className="text-left">
                  <Label htmlFor="teamCode">Cod Echipă</Label>
                  <Input
                    id="teamCode"
                    placeholder="team_12345..."
                    value={teamCode}
                    onChange={(e) => setTeamCode(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={handleJoinTeam}
                >
                  Alătură-te
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
