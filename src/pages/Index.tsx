import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Code2, Users, Trophy, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // ✅ import Supabase client

const Index = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchFlag = async () => {
      const { data, error } = await supabase
          .from("flags")
          .select("value")
          .eq("flag", "registration")
          .maybeSingle();

      if (error) {
        console.error("Eroare la preluarea flagului:", error);
        setRegistrationOpen(false);
        return;
      }

      if (!data || data.length === 0) {
        console.warn("Niciun rând găsit pentru flag=registration");
        setRegistrationOpen(false);
        return;
      }

      const registrationValue = data["value"];
      setRegistrationOpen(registrationValue === "TRUE");
    };

    fetchFlag();
  }, []);



  // Animatie fade-in la scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
  }, []);

  return (
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-secondary/5 to-background"></div>
          <div className="relative max-w-6xl mx-auto text-center">
            <div className="inline-block mb-6 animate-float">
              <Code2 className="w-20 h-20 text-primary glow-text" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 glow-text">
              Hai la Programare
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Descoperă puterea codului! Înscrie-ți echipa la concursul de programare
              pentru elevi de gimnaziu și liceu.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {registrationOpen === null ? (
                  <p className="text-muted-foreground text-lg">Se încarcă...</p>
              ) : registrationOpen ? (
                  <Button
                      size="lg"
                      className="text-lg hover-glow"
                      onClick={() => navigate("/students")}
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Înscrie-te acum
                  </Button>
              ) : (
                  <p className="text-lg text-muted-foreground">
                    Înscrierile nu sunt disponibile momentan...
                  </p>
              )}
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mt-16">
              <div className="p-6 bg-card rounded-lg glow-border">
                <div className="w-12 h-12 mx-auto mb-4 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Competiție</h3>
                <p className="text-muted-foreground text-sm">
                  Participă la provocări de programare alături de echipa ta
                </p>
              </div>

              <div className="p-6 bg-card rounded-lg glow-border">
                <div className="w-12 h-12 mx-auto mb-4 bg-secondary/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Lucru în Echipă</h3>
                <p className="text-muted-foreground text-sm">
                  Colaborează cu colegii și învățați împreună
                </p>
              </div>

              <div className="p-6 bg-card rounded-lg glow-border">
                <div className="w-12 h-12 mx-auto mb-4 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">Dezvoltare Rapidă</h3>
                <p className="text-muted-foreground text-sm">
                  Învață și dezvoltă-ți abilitățile de programare
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-t from-primary/5 to-background">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Gata să începi aventura?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Înregistrează-ți echipa acum și pregătește-te pentru competiție!
            </p>
          </div>
        </section>

        {/* Program Concurs */}
        <section
            ref={sectionRef}
            className={`py-16 px-6 max-w-4xl mx-auto rounded-2xl shadow-lg bg-gradient-to-r from-primary/20 via-secondary/10 to-accent/20 transition-all duration-1000 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
        >
          <h3 className="text-3xl font-bold text-center mb-6 text-white">
            Programul Concursului
          </h3>
          <ul className="list-disc list-inside space-y-4 text-white text-lg">
            <li>
              <strong>Anunțarea temei concursului – Programare aplicată:</strong>{" "}
              12 februarie 2023, 14:00
            </li>
            <li>
              <strong>Secțiunea „Gimnaziu” – prezentări live:</strong> 14 februarie
              2023, 14:30 – 16:00
            </li>
            <li>
              <strong>Secțiunea „Liceu” – prezentări live:</strong> 14 februarie
              2023, 16:00 – 17:30
            </li>
          </ul>

          <div className="mt-8 text-white text-base leading-relaxed">
            <p>
              <strong>SECȚIUNEA I: „APLICAȚII PRACTICE – SECȚIUNEA GIMNAZIU”</strong>{" "}
              – concurs de aplicații practice respectând specificațiile tehnice
              realizate de juriu în etapa premergătoare desfășurării concursului.
              Aplicațiile din această etapă vor fi prezentate începând cu ora 14:30,
              membrii juriului adresând întrebări echipei. Se acordă câte un premiu
              I, II, III și 3 mențiuni.
            </p>
            <p className="mt-4">
              <strong>SECȚIUNEA II: „APLICAȚII PRACTICE – SECȚIUNEA LICEU”</strong> – concurs de aplicații practice din domeniul roboticii care rezolvă o problemă curentă din viața de zi cu zi. Juriul adresează întrebări echipelor începând cu ora 16:00 și notează răspunsurile conform criteriilor de jurizare: originalitate, utilitate, fiabilitate, modul de prezentare și posibilități de dezvoltare a aplicației. Se acordă câte un premiu I, II, III și 3 mențiuni.
            </p>
            <p className="mt-4">
              <strong>Alte precizări organizatorice:</strong> Înscrierea la concurs se face în perioada 15 – 30 octombrie 2025. Profesorii coordonatori vor trimite scanat fișele de înscriere, acordul de parteneriat și lucrările destinate fiecărei secțiuni la care participă.
            </p>
          </div>
        </section>
      </div>
  );
};

export default Index;
