import { useState, useEffect } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient.ts";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";

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
    captain_discord: string;
    member1_name: string;
    member1_discord: string;
    member2_name: string;
    member2_discord: string;
    member3_name: string;
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
        captain_discord: "",
        member1_name: "",
        member1_discord: "",
        member2_name: "",
        member2_discord: "",
        member3_name: "",
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
            if (data) setTeamData(data);
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

    const handleFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const generateTeamCode = () =>
        Math.random().toString(36).substring(2, 8).toUpperCase();

    const handleCreateOrUpdateTeam = async () => {
        if (!user) return alert("Trebuie să te loghezi!");
        if (!agreedPolicy)
            return alert("Trebuie să accepți politica de confidențialitate!");
        if (!form.name || !form.coordinator_name || !form.coordinator_email || !form.school) {
            return alert("Te rugăm să completezi toate câmpurile obligatorii!");
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
            } else {
                const team_code = generateTeamCode();
                const { data, error } = await supabase
                    .from("teams")
                    .insert([{ ...form, owner_sub: user.sub, team_code }])
                    .select()
                    .single();
                if (error) throw error;
                setTeamData(data);
            }
            setShowModal(false);
        } catch (err: any) {
            alert(`Eroare: ${err.message}`);
        }
    };

    const handleJoinTeam = async () => {
        if (!user || !teamCode) return alert("Trebuie să introduci codul echipei!");
        const { data, error } = await supabase
            .from<Team>("teams")
            .select("*")
            .eq("team_code", teamCode)
            .single();
        if (error || !data) return alert("Cod echipă invalid!");
        setTeamData(data);
        alert(`Te-ai alăturat echipei ${data.name}!`);
    };

    const handleLeaveTeam = async () => {
        if (!user || !teamData) return;
        if (teamData.owner_sub === user.sub) {
            const { error } = await supabase.from("teams").delete().eq("id", teamData.id);
            if (error) return alert(`Eroare: ${error.message}`);
            setTeamData(null);
        } else {
            alert("Ai ieșit din echipă.");
            setTeamData(null);
        }
    };

    const handleUploadGitHub = async () => {
        if (!githubLink.trim()) return alert("Introdu linkul GitHub!");
        if (!teamData) return;
        const { error } = await supabase
            .from("teams")
            .update({ team_src: githubLink })
            .eq("id", teamData.id);
        if (error) return alert("Eroare la trimiterea linkului GitHub!");
        alert("Linkul GitHub a fost trimis!");
        setGithubLink("");
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6 flex flex-col items-center">
            {!user ? (
                <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-lg text-center">
                    <h1 className="text-3xl font-bold mb-2">BUN VENIT!</h1>
                    <p className="text-gray-400 mb-6">
                        Conectează-te cu Google pentru a-ți gestiona echipa.
                    </p>
                    <GoogleLogin
                        onSuccess={handleLoginSuccess}
                        onError={() => alert("Autentificarea a eșuat")}
                        useOneTap
                        text="continue_with"
                    />
                </div>
            ) : (
                <div className="max-w-4xl w-full">
                    {/* HEADER */}
                    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <img src={user.picture} alt={user.name} className="w-16 h-16 rounded-full" />
                            <div>
                                <p className="font-bold text-lg">{user.name}</p>
                                <p className="text-gray-400 text-sm">{user.email}</p>
                            </div>
                        </div>
                        <button
                            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
                            onClick={handleLogout}
                        >
                            Ieșire
                        </button>
                    </div>

                    {/* ECHIPA */}
                    {!teamData ? (
                        <>
                            <div className="bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 text-center">
                                <h2 className="text-2xl font-bold mb-4">ALĂTURĂ-TE UNEI ECHIPE</h2>
                                <input
                                    type="text"
                                    placeholder="COD ECHIPĂ"
                                    value={teamCode}
                                    onChange={(e) => setTeamCode(e.target.value)}
                                    className="w-full mb-4 px-4 py-3 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:ring-2 focus:ring-green-500"
                                />
                                <button
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg"
                                    onClick={handleJoinTeam}
                                >
                                    ALĂTURĂ-TE
                                </button>
                            </div>

                            <div className="bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
                                <h2 className="text-2xl font-bold mb-4">CREEAZĂ ECHIPA TA</h2>
                                <button
                                    className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg"
                                    onClick={() => setShowModal(true)}
                                >
                                    CREEAZĂ ECHIPĂ
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
                            <h2 className="text-2xl font-bold mb-4">ECHIPA TA</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p><b>NUME ECHIPĂ:</b> {teamData.name}</p>
                                    <p><b>COORDONATOR:</b> {teamData.coordinator_name}</p>
                                    <p><b>EMAIL:</b> {teamData.coordinator_email}</p>
                                    <p><b>TELEFON:</b> {teamData.coordinator_phone}</p>
                                    <p><b>ȘCOALA:</b> {teamData.school}</p>
                                </div>
                                <div>
                                    <p><b>CĂPITAN:</b> {teamData.captain_name}</p>
                                    <p><b>MEMBRI:</b> {teamData.member1_name}, {teamData.member2_name}, {teamData.member3_name}</p>
                                    <p><b>DISCORD CAPITAN:</b> {teamData.captain_discord}</p>
                                    <p><b>EMAIL DIPLOMĂ:</b> {teamData.diploma_email}</p>
                                </div>
                            </div>

                            {contestStarted && (
                                <div className="mt-6 bg-gray-700 p-4 rounded-lg">
                                    <h3 className="text-lg font-bold mb-2 text-green-400">
                                        🔥 CONCURSUL ESTE PORNIT
                                    </h3>
                                    <p>
                                        <b>Subiect:</b>{" "}
                                        <a
                                            href={
                                                teamData.section === "liceu"
                                                    ? subjectLinks.liceu
                                                    : subjectLinks.gimnaziu
                                            }
                                            className="underline text-blue-400"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Deschide linkul subiectului
                                        </a>
                                    </p>

                                    <div className="mt-4">
                                        <input
                                            type="text"
                                            placeholder="Introdu linkul de GitHub al soluției"
                                            value={githubLink}
                                            onChange={(e) => setGithubLink(e.target.value)}
                                            className="w-full mb-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-600"
                                        />
                                        <button
                                            onClick={handleUploadGitHub}
                                            className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg w-full"
                                        >
                                            Trimite Linkul GitHub
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex mt-4 gap-4">
                                {teamData.owner_sub === user.sub ? (
                                    <>
                                        <button
                                            className="bg-red-600 hover:bg-red-500 py-2 px-4 rounded-lg"
                                            onClick={handleLeaveTeam}
                                        >
                                            ȘTERGE ECHIPA
                                        </button>
                                        <button
                                            className="bg-yellow-600 hover:bg-yellow-500 py-2 px-4 rounded-lg"
                                            onClick={() => {
                                                setForm({ ...teamData } as any);
                                                setAgreedPolicy(true);
                                                setShowModal(true);
                                            }}
                                        >
                                            MODIFICĂ ECHIPA
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className="bg-gray-600 hover:bg-gray-500 py-2 px-4 rounded-lg"
                                        onClick={handleLeaveTeam}
                                    >
                                        IEȘI DIN ECHIPĂ
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* MODAL */}
                    {showModal && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
                            <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-bold">FORMULAR ECHIPĂ</h3>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="text-gray-400 hover:text-white text-2xl font-bold"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {Object.keys(form).map((key) => (
                                    <div key={key} className="space-y-2 mb-3">
                                        <label className="block text-gray-300 font-semibold uppercase">
                                            {key.replaceAll("_", " ")}
                                        </label>

                                        {key === "section" ? (
                                            <select
                                                name={key}
                                                value={(form as any)[key]}
                                                onChange={handleFormChange}
                                                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-gray-100 focus:ring-2 focus:ring-green-500"
                                            >
                                                <option value="">Alege secțiunea</option>
                                                <option value="gimnaziu">GIMNAZIU</option>
                                                <option value="liceu">LICEU</option>
                                            </select>
                                        ) : (
                                            <input
                                                name={key}
                                                placeholder={key.replaceAll("_", " ").toUpperCase()}
                                                value={(form as any)[key]}
                                                onChange={handleFormChange}
                                                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-gray-100 focus:ring-2 focus:ring-green-500"
                                            />
                                        )}
                                    </div>
                                ))}

                                <div className="flex items-center mt-4">
                                    <input
                                        type="checkbox"
                                        checked={agreedPolicy}
                                        onChange={() => setAgreedPolicy(!agreedPolicy)}
                                        className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded"
                                    />
                                    <label className="ml-2 text-gray-300 text-sm">
                                        Am citit și sunt de acord cu{" "}
                                        <a href="/privacy-policy" target="_blank" className="underline text-green-400">
                                            Politica de Confidențialitate
                                        </a>
                                    </label>
                                </div>

                                <button
                                    onClick={handleCreateOrUpdateTeam}
                                    disabled={!agreedPolicy}
                                    className={`w-full mt-6 py-3 rounded-lg text-white ${
                                        agreedPolicy
                                            ? "bg-green-600 hover:bg-green-500"
                                            : "bg-gray-600 cursor-not-allowed"
                                    }`}
                                >
                                    SALVEAZĂ ECHIPA
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
