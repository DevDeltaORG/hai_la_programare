import { useState, useEffect } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient.ts";

interface GoogleUser {
    name: string;
    email: string;
    picture: string;
    sub: string;
}

interface Team {
    id: string;
    name: string;
    coordinator_name: string;
    coordinator_phone: string;
    coordinator_email: string;
    school: string;
    captain_name: string;
    captain_email: string;
    captain_discord: string;
    member1_name: string;
    member1_email: string;
    member1_discord: string;
    member2_name: string;
    member2_email: string;
    member2_discord: string;
    member3_name: string;
    member3_email: string;
    member3_discord: string;
    diploma_email: string;
    owner_sub: string;
    team_code: string;
    section?: string;
    team_src?: string;
}

const StudentsPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<GoogleUser | null>(
        JSON.parse(localStorage.getItem("currentUser") || "null")
    );
    const [showModal, setShowModal] = useState(false);
    const [teamData, setTeamData] = useState<Team | null>(null);
    const [teamCode, setTeamCode] = useState("");
    const [agreedPolicy, setAgreedPolicy] = useState(false);
    const [contestStarted, setContestStarted] = useState(false);
    const [subjectLinks, setSubjectLinks] = useState<{ gimnaziu?: string; liceu?: string }>({});
    const [githubLink, setGithubLink] = useState("");

    const [form, setForm] = useState({
        name: "",
        coordinator_name: "",
        coordinator_phone: "",
        coordinator_email: "",
        school: "",
        captain_name: "",
        captain_email: "",
        captain_discord: "",
        member1_name: "",
        member1_email: "",
        member1_discord: "",
        member2_name: "",
        member2_email: "",
        member2_discord: "",
        member3_name: "",
        member3_email: "",
        member3_discord: "",
        diploma_email: "",
        section: "",
    });

    useEffect(() => {
        const fetchFlags = async () => {
            const { data, error } = await supabase
                .from("flags")
                .select("flag, value")
                .in("flag", ["start", "subject_gimnaziu", "subject_liceu"]);

            if (!error && data) {
                const flags: any = {};
                data.forEach((row) => (flags[row.flag] = row.value));
                setContestStarted(flags["start"] === "TRUE");
                setSubjectLinks({
                    gimnaziu: flags["subject_gimnaziu"],
                    liceu: flags["subject_liceu"],
                });
            }
        };
        fetchFlags();
    }, []);

    useEffect(() => {
        const fetchTeam = async () => {
            if (!user) return;
            const { data } = await supabase
                .from<Team>("teams")
                .select("*")
                .eq("owner_sub", user.sub)
                .single();
            if (data) {
                setTeamData(data);
                // Setează link-ul GitHub dacă există în baza de date
                if (data.team_src) {
                    setGithubLink(data.team_src);
                }
            }
        };
        fetchTeam();
    }, [user]);

    const handleLoginSuccess = (credentialResponse: any) => {
        if (!credentialResponse.credential) return;
        const decoded: GoogleUser = jwtDecode(credentialResponse.credential);
        localStorage.setItem("currentUser", JSON.stringify(decoded));
        setUser(decoded);
    };

    const handleLogout = () => {
        googleLogout();
        localStorage.removeItem("currentUser");
        setUser(null);
        navigate("/");
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const generateTeamCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

    const handleCreateOrUpdateTeam = async () => {
        if (!user) return alert("Trebuie să te loghezi!");
        if (!agreedPolicy) return alert("Trebuie să accepți politica de confidențialitate!");
        if (!form.name || !form.coordinator_name || !form.coordinator_email || !form.school) {
            return alert("Te rugăm să completezi toate câmpurile obligatorii!");
        }
        if (!form.captain_name || !form.captain_email) {
            return alert("Căpitanul trebuie să aibă nume și email!");
        }
        if (!form.section) {
            return alert("Te rugăm să selectezi secțiunea (Gimnaziu sau Liceu)!");
        }

        try {
            if (teamData && teamData.owner_sub === user.sub) {
                const { data, error } = await supabase
                    .from("teams")
                    .update(form)
                    .eq("id", teamData.id)
                    .select()
                    .single();
                if (error) throw error;
                setTeamData(data);
                alert("Echipa a fost actualizată cu succes!");
            } else {
                const team_code = generateTeamCode();
                const { data, error } = await supabase
                    .from("teams")
                    .insert([{ ...form, owner_sub: user.sub, team_code }])
                    .select()
                    .single();
                if (error) throw error;
                setTeamData(data);
                alert(`Echipa a fost creată cu succes! Codul echipei: ${team_code}`);
            }
            setShowModal(false);
        } catch (err: any) {
            alert(`Eroare: ${err.message}`);
        }
    };

    const handleJoinTeam = async () => {
        if (!user || !teamCode) return alert("Trebuie să introduci codul echipei!");
        const { data, error } = await supabase.from<Team>("teams").select("*").eq("team_code", teamCode).single();
        if (error || !data) return alert("Cod echipă invalid!");
        setTeamData(data);
        alert(`Te-ai alăturat echipei ${data.name}!`);
    };

    const handleLeaveTeam = async () => {
        if (!user || !teamData) return;
        if (teamData.owner_sub === user.sub) {
            const confirmDelete = window.confirm("Ești sigur că vrei să ștergi echipa? Această acțiune este permanentă!");
            if (!confirmDelete) return;
            const { error } = await supabase.from("teams").delete().eq("id", teamData.id);
            if (error) return alert(`Eroare: ${error.message}`);
            setTeamData(null);
            alert("Echipa a fost ștearsă!");
        } else {
            alert("Ai ieșit din echipă.");
            setTeamData(null);
        }
    };

    const handleUploadGitHub = async () => {
        if (!githubLink.trim()) return alert("Introdu linkul GitHub!");
        if (!teamData) return;
        const { error } = await supabase.from("teams").update({ team_src: githubLink }).eq("id", teamData.id);
        if (error) return alert("Eroare la trimiterea linkului GitHub!");
        alert("Linkul GitHub a fost trimis cu succes!");
        setTeamData({ ...teamData, team_src: githubLink });
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6 flex flex-col items-center">
            {!user ? (
                <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-lg text-center">
                    <h1 className="text-3xl font-bold mb-2">BUN VENIT!</h1>
                    <p className="text-gray-400 mb-6">Conectează-te cu Google pentru a-ți gestiona echipa.</p>
                    <GoogleLogin onSuccess={handleLoginSuccess} onError={() => alert("Autentificarea a eșuat")} useOneTap text="continue_with" />
                </div>
            ) : (
                <div className="max-w-4xl w-full">
                    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <img src={user.picture} alt={user.name} className="w-16 h-16 rounded-full" />
                            <div>
                                <p className="font-bold text-lg">{user.name}</p>
                                <p className="text-gray-400 text-sm">{user.email}</p>
                            </div>
                        </div>
                        <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg" onClick={handleLogout}>Ieșire</button>
                    </div>

                    {!teamData ? (
                        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
                            <h2 className="text-2xl font-bold mb-4">CREEAZĂ ECHIPA TA</h2>
                            <button className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg" onClick={() => setShowModal(true)}>CREEAZĂ ECHIPĂ</button>
                        </div>
                    ) : (
                        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
                            <h2 className="text-2xl font-bold mb-4">ECHIPA TA</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p><b>NUME ECHIPĂ:</b> {teamData.name}</p>
                                    <p><b>COORDONATOR:</b> {teamData.coordinator_name}</p>
                                    <p><b>EMAIL COORDONATOR:</b> {teamData.coordinator_email}</p>
                                    <p><b>TELEFON COORDONATOR:</b> {teamData.coordinator_phone}</p>
                                    <p><b>ȘCOALA:</b> {teamData.school}</p>
                                    <p><b>SECȚIUNE:</b> {teamData.section?.toUpperCase()}</p>
                                </div>
                                <div>
                                    <p><b>CĂPITAN:</b> {teamData.captain_name}</p>
                                    <p><b>EMAIL CĂPITAN:</b> {teamData.captain_email}</p>
                                    <p><b>DISCORD CĂPITAN:</b> {teamData.captain_discord}</p>
                                    {teamData.member1_name && (
                                        <>
                                            <p className="mt-2"><b>MEMBRU 1:</b> {teamData.member1_name}</p>
                                            {teamData.member1_email && <p className="text-sm text-gray-400">Email: {teamData.member1_email}</p>}
                                        </>
                                    )}
                                    {teamData.member2_name && (
                                        <>
                                            <p className="mt-2"><b>MEMBRU 2:</b> {teamData.member2_name}</p>
                                            {teamData.member2_email && <p className="text-sm text-gray-400">Email: {teamData.member2_email}</p>}
                                        </>
                                    )}
                                    {teamData.member3_name && (
                                        <>
                                            <p className="mt-2"><b>MEMBRU 3:</b> {teamData.member3_name}</p>
                                            {teamData.member3_email && <p className="text-sm text-gray-400">Email: {teamData.member3_email}</p>}
                                        </>
                                    )}
                                    <p className="mt-2"><b>EMAIL DIPLOMĂ:</b> {teamData.diploma_email}</p>
                                </div>
                            </div>

                            {contestStarted && (
                                <div className="mt-6 bg-gray-700 p-4 rounded-lg">
                                    <h3 className="text-lg font-bold mb-2 text-green-400">🔥 CONCURSUL ESTE PORNIT</h3>
                                    <p><b>Subiect:</b>{" "}
                                        <a href={teamData.section === "liceu" ? subjectLinks.liceu : subjectLinks.gimnaziu} className="underline text-blue-400" target="_blank" rel="noreferrer">
                                            Deschide linkul subiectului
                                        </a>
                                    </p>
                                    <div className="mt-4">
                                        <label className="block text-sm font-semibold mb-2">Link-ul GitHub cu soluția:</label>
                                        <input type="text" placeholder="https://github.com/username/repo" value={githubLink} onChange={(e) => setGithubLink(e.target.value)} className="w-full mb-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-600" />
                                        <button onClick={handleUploadGitHub} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg w-full">Trimite Linkul GitHub</button>
                                        {teamData.team_src && <p className="text-sm text-green-400 mt-2">✓ Soluție trimisă: {teamData.team_src}</p>}
                                    </div>
                                </div>
                            )}

                            <div className="flex mt-4 gap-4">
                                {teamData.owner_sub === user.sub ? (
                                    <>
                                        <button className="bg-red-600 hover:bg-red-500 py-2 px-4 rounded-lg" onClick={handleLeaveTeam}>ȘTERGE ECHIPA</button>
                                        <button className="bg-yellow-600 hover:bg-yellow-500 py-2 px-4 rounded-lg" onClick={() => { setForm({ ...teamData } as any); setAgreedPolicy(true); setShowModal(true); }}>MODIFICĂ ECHIPA</button>
                                    </>
                                ) : (
                                    <button className="bg-gray-600 hover:bg-gray-500 py-2 px-4 rounded-lg" onClick={handleLeaveTeam}>IEȘI DIN ECHIPĂ</button>
                                )}
                            </div>
                        </div>
                    )}

                    {showModal && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
                            <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-bold">FORMULAR ECHIPĂ</h3>
                                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-2xl font-bold">✕</button>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-gray-700 p-4 rounded-lg">
                                        <h4 className="font-bold text-lg mb-3">📋 INFORMAȚII GENERALE</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-gray-300 font-semibold text-sm mb-1">NUME ECHIPĂ *</label>
                                                <input name="name" placeholder="Numele echipei" value={form.name} onChange={handleFormChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-green-500" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-300 font-semibold text-sm mb-1">ȘCOALĂ *</label>
                                                <input name="school" placeholder="Numele școlii" value={form.school} onChange={handleFormChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-green-500" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-300 font-semibold text-sm mb-1">SECȚIUNE *</label>
                                                <select name="section" value={form.section} onChange={handleFormChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-green-500">
                                                    <option value="">Alege secțiunea</option>
                                                    <option value="gimnaziu">GIMNAZIU</option>
                                                    <option value="liceu">LICEU</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-700 p-4 rounded-lg">
                                        <h4 className="font-bold text-lg mb-3">👨‍🏫 PROFESOR COORDONATOR</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-gray-300 font-semibold text-sm mb-1">NUME COORDONATOR *</label>
                                                <input name="coordinator_name" placeholder="Numele profesorului coordonator" value={form.coordinator_name} onChange={handleFormChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-green-500" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-300 font-semibold text-sm mb-1">EMAIL COORDONATOR *</label>
                                                <input name="coordinator_email" type="email" placeholder="email@scoala.ro" value={form.coordinator_email} onChange={handleFormChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-green-500" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-300 font-semibold text-sm mb-1">TELEFON COORDONATOR</label>
                                                <input name="coordinator_phone" placeholder="07XXXXXXXX" value={form.coordinator_phone} onChange={handleFormChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-green-500" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-700 p-4 rounded-lg">
                                        <h4 className="font-bold text-lg mb-3">👑 CĂPITAN ECHIPĂ</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-gray-300 font-semibold text-sm mb-1">NUME CĂPITAN *</label>
                                                <input name="captain_name" placeholder="Numele căpitanului" value={form.captain_name} onChange={handleFormChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-green-500" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-300 font-semibold text-sm mb-1">EMAIL CĂPITAN *</label>
                                                <input name="captain_email" type="email" placeholder="capitan@email.ro" value={form.captain_email} onChange={handleFormChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-green-500" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-300 font-semibold text-sm mb-1">DISCORD CĂPITAN</label>
                                                <input name="captain_discord" placeholder="username#1234" value={form.captain_discord} onChange={handleFormChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-green-500" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-700 p-4 rounded-lg">
                                        <h4 className="font-bold text-lg mb-3">👥 MEMBRI ECHIPĂ (Opțional)</h4>
                                        <div className="mb-4 pb-4 border-b border-gray-600">
                                            <p className="text-sm font-semibold text-green-400 mb-2">MEMBRU 1</p>
                                            <div className="space-y-2">
                                                <input name="member1_name" placeholder="Nume membru 1" value={form.member1_name} onChange={handleFormChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-green-500" />
                                                <input name="member1_email" type="email" placeholder="Email membru 1" value={form.member1_email} onChange={handleFormChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-green-500" />
                                                <input name="member1_discord" placeholder="Discord membru 1" value={form.member1_discord} onChange={handleFormChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-green-500" />
                                            </div>
                                        </div>
                                        <div className="mb-4 pb-4 border-b border-gray-600">
                                            <p className="text-sm font-semibold text-green-400 mb-2">MEMBRU 2</p>
                                            <div className="space-y-2">
                                                <input name="member2_name" placeholder="Nume membru 2" value={form.member2_name} onChange={handleFormChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-green-500" />
                                                <input name="member2_email" type="email" placeholder="Email membru 2" value={form.member2_email} onChange={handleFormChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-green-500" />
                                                <input name="member2_discord" placeholder="Discord membru 2" value={form.member2_discord} onChange={handleFormChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-green-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-green-400 mb-2">MEMBRU 3</p>
                                            <div className="space-y-2">
                                                <input name="member3_name" placeholder="Nume membru 3" value={form.member3_name} onChange={handleFormChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-green-500" />
                                                <input name="member3_email" type="email" placeholder="Email membru 3" value={form.member3_email} onChange={handleFormChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-green-500" />
                                                <input name="member3_discord" placeholder="Discord membru 3" value={form.member3_discord} onChange={handleFormChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-green-500" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-700 p-4 rounded-lg">
                                        <h4 className="font-bold text-lg mb-3">📧 EMAIL PENTRU DIPLOMĂ</h4>
                                        <div>
                                            <label className="block text-gray-300 font-semibold text-sm mb-1">EMAIL DIPLOMĂ</label>
                                            <input name="diploma_email" type="email" placeholder="email@diploma.ro" value={form.diploma_email} onChange={handleFormChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-green-500" />
                                            <p className="text-xs text-gray-400 mt-1">Email-ul pe care vei primi diploma în format digital</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center mt-6 bg-gray-700 p-3 rounded-lg">
                                    <input type="checkbox" checked={agreedPolicy} onChange={() => setAgreedPolicy(!agreedPolicy)} className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded" />
                                    <label className="ml-2 text-gray-300 text-sm">Am citit și sunt de acord cu <a href="/privacy-policy" target="_blank" className="underline text-green-400">Politica de Confidențialitate</a></label>
                                </div>

                                <button onClick={handleCreateOrUpdateTeam} disabled={!agreedPolicy} className={`w-full mt-4 py-3 rounded-lg text-white font-bold ${agreedPolicy ? "bg-green-600 hover:bg-green-500" : "bg-gray-600 cursor-not-allowed"}`}>
                                    {teamData ? "ACTUALIZEAZĂ ECHIPA" : "SALVEAZĂ ECHIPA"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentsPage;