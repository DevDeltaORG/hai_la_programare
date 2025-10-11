import { useState, useEffect } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import {jwtDecode} from "jwt-decode";
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
    });

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

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
                // update echipă
                const { data, error } = await supabase
                    .from("teams")
                    .update(form)
                    .eq("id", teamData.id)
                    .select()
                    .single();

                if (error) {
                    console.error("Eroare la update echipă:", error);
                    alert(`A apărut o eroare la update echipei: ${error.message}`);
                    return;
                }

                setTeamData(data);
                setShowModal(false);
            } else {
                // creare echipă
                const team_code = generateTeamCode();
                const { data, error } = await supabase
                    .from("teams")
                    .insert([{ ...form, owner_sub: user.sub, team_code }])
                    .select()
                    .single();

                if (error) {
                    console.error("Eroare la crearea echipei:", error);
                    alert(`A apărut o eroare la crearea echipei: ${error.message}`);
                    return;
                }

                setTeamData(data);
                setShowModal(false);
            }
        } catch (err: any) {
            console.error("Catch error:", err);
            alert(`A apărut o eroare neașteptată: ${err.message || err}`);
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
            if (error) return alert(`Eroare la ștergerea echipei: ${error.message}`);
            setTeamData(null);
        } else {
            alert("Ai ieșit din echipă.");
            setTeamData(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6 flex flex-col items-center">
            {!user ? (
                <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-lg text-center">
                    <h1 className="text-3xl font-bold mb-2">Bun venit!</h1>
                    <p className="text-gray-400 mb-6">
                        Conectează-te cu Google pentru a-ți gestiona echipa
                    </p>
                    <GoogleLogin
                        onSuccess={handleLoginSuccess}
                        onError={() => alert("Autentificarea a eșuat")}
                        useOneTap
                        text="continue_with"
                    />
                </div>
            ) : (
                <>
                    <div className="max-w-4xl w-full">
                        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <img src={user.picture} alt={user.name} className="w-16 h-16 rounded-full" />
                                <div>
                                    <p className="font-bold">{user.name}</p>
                                    <p className="text-gray-400">{user.email}</p>
                                </div>
                            </div>
                            <button
                                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
                                onClick={handleLogout}
                            >
                                Ieșire
                            </button>
                        </div>

                        {!teamData ? (
                            <>
                                <div className="bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col items-center mb-8">
                                    <h2 className="text-xl font-bold mb-2">Alătură-te echipei</h2>
                                    <input
                                        type="text"
                                        placeholder="Cod echipă"
                                        value={teamCode}
                                        onChange={(e) => setTeamCode(e.target.value)}
                                        className="w-full mb-4 px-4 py-3 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none"
                                    />
                                    <button
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg"
                                        onClick={handleJoinTeam}
                                    >
                                        Alătură-te
                                    </button>
                                </div>

                                <div className="bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col items-center mb-8">
                                    <h2 className="text-xl font-bold mb-4">Creează echipa ta</h2>
                                    <button
                                        className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg mb-4"
                                        onClick={() => setShowModal(true)}
                                    >
                                        Creează echipă
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 w-full">
                                <h2 className="text-2xl font-bold mb-4 flex items-center justify-between">
                                    Echipa ta
                                    {teamData.team_code && (
                                        <div className="flex items-center space-x-2">
                                            <span className="font-mono tracking-wider text-gray-300">{teamData.team_code}</span>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(teamData.team_code);
                                                    alert("Cod echipă copiat!");
                                                }}
                                                className="text-gray-300 hover:text-green-400"
                                            >
                                                <ClipboardDocumentIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <p><strong>Nume echipă:</strong> {teamData.name}</p>
                                        <p><strong>Coordonator:</strong> {teamData.coordinator_name}</p>
                                        <p><strong>Email:</strong> {teamData.coordinator_email}</p>
                                        <p><strong>Telefon:</strong> {teamData.coordinator_phone}</p>
                                        <p><strong>Școala:</strong> {teamData.school}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p><strong>Căpitan:</strong> {teamData.captain_name} ({teamData.captain_discord})</p>
                                        <p><strong>Elev 1:</strong> {teamData.member1_name} ({teamData.member1_discord})</p>
                                        <p><strong>Elev 2:</strong> {teamData.member2_name} ({teamData.member2_discord})</p>
                                        <p><strong>Elev 3:</strong> {teamData.member3_name} ({teamData.member3_discord})</p>
                                        <p><strong>Email diplome:</strong> {teamData.diploma_email}</p>
                                    </div>
                                </div>

                                <div className="flex mt-4 gap-4">
                                    {teamData.owner_sub === user.sub ? (
                                        <>
                                            <button
                                                className="bg-red-600 hover:bg-red-500 py-2 px-4 rounded-lg"
                                                onClick={handleLeaveTeam}
                                            >
                                                Șterge echipa
                                            </button>
                                            <button
                                                className="bg-green-600 hover:bg-green-500 py-2 px-4 rounded-lg"
                                                onClick={() => {
                                                    setForm({ ...teamData });
                                                    setAgreedPolicy(true);
                                                    setShowModal(true);
                                                }}
                                            >
                                                Modifică echipa
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            className="bg-yellow-600 hover:bg-yellow-500 py-2 px-4 rounded-lg"
                                            onClick={handleLeaveTeam}
                                        >
                                            Ieși din echipă
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                {/* Modal */}
                    {showModal && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
                            <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-bold">Creează/Modifică echipă</h3>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="text-gray-400 hover:text-white text-2xl font-bold"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {teamData && teamData.team_code && (
                                    <div className="flex items-center justify-between bg-gray-700 p-3 rounded-lg mb-4">
                    <span className="font-mono tracking-wider text-gray-100">
                      Cod echipă: {teamData.team_code}
                    </span>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(teamData.team_code);
                                                alert("Cod echipă copiat în clipboard!");
                                            }}
                                            className="text-gray-300 hover:text-green-400"
                                        >
                                            <ClipboardDocumentIcon className="w-6 h-6" />
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-5">
                                    {Object.keys(form).map((key) => (
                                        <div key={key} className="space-y-2">
                                            <label className="block text-gray-300 font-semibold">{key.replace("_", " ")}</label>
                                            <input
                                                name={key}
                                                placeholder={key.replace("_", " ")}
                                                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                value={(form as any)[key]}
                                                onChange={handleFormChange}
                                            />
                                        </div>
                                    ))}

                                    <div className="flex items-start mt-4">
                                        <input
                                            type="checkbox"
                                            id="privacyPolicy"
                                            checked={agreedPolicy}
                                            onChange={() => setAgreedPolicy(!agreedPolicy)}
                                            className="w-4 h-4 mt-1 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                                        />
                                        <label htmlFor="privacyPolicy" className="ml-2 text-gray-300 text-sm">
                                            Am citit și sunt de acord cu{" "}
                                            <a
                                                href="/privacy-policy"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline hover:text-green-400"
                                            >
                                                Politica de Confidențialitate și Prelucrare a Datelor
                                            </a>
                                        </label>
                                    </div>

                                    <button
                                        className={`w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg mt-4 ${
                                            !agreedPolicy ? "opacity-50 cursor-not-allowed" : ""
                                        }`}
                                        onClick={handleCreateOrUpdateTeam}
                                        disabled={!agreedPolicy}
                                    >
                                        Salvează echipa
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StudentsPage;
