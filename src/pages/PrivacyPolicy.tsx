import React from "react";

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6 flex justify-center">
            <div className="max-w-4xl w-full bg-gray-800 rounded-2xl p-8 shadow-lg overflow-y-auto">
                <h1 className="text-3xl font-bold mb-6">Politica de confidențialitate și prelucrare a datelor</h1>

                <section className="mb-4">
                    <h2 className="text-xl font-semibold mb-2">1. Colectarea datelor</h2>
                    <p className="text-gray-300">
                        Colectăm informațiile pe care le furnizați direct prin aplicație, cum ar fi numele, email-ul și alte date necesare pentru gestionarea echipei.
                    </p>
                </section>

                <section className="mb-4">
                    <h2 className="text-xl font-semibold mb-2">2. Utilizarea datelor</h2>
                    <p className="text-gray-300">
                        Datele colectate sunt folosite exclusiv pentru funcționalitățile aplicației, precum crearea echipelor, comunicarea între membri și trimiterea diplomelor.
                    </p>
                </section>

                <section className="mb-4">
                    <h2 className="text-xl font-semibold mb-2">3. Protecția datelor</h2>
                    <p className="text-gray-300">
                        Datele tale sunt stocate în condiții de siguranță și nu sunt partajate cu terțe părți fără consimțământul tău.
                    </p>
                </section>

                <section className="mb-4">
                    <h2 className="text-xl font-semibold mb-2">4. Drepturile utilizatorului</h2>
                    <p className="text-gray-300">
                        Ai dreptul să accesezi, să corectezi sau să ștergi datele tale personale în orice moment, contactând echipa noastră.
                    </p>
                </section>

                <section className="mb-4">
                    <h2 className="text-xl font-semibold mb-2">5. Contact</h2>
                    <p className="text-gray-300">
                        Pentru orice întrebări privind politica de confidențialitate, te rugăm să ne contactezi la cristi.gabriel.rusu@gmail.com.
                    </p>
                </section>

                <p className="text-gray-400 text-sm mt-6">
                    Această politică de confidențialitate este valabilă de la data publicării și poate fi actualizată periodic.
                </p>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
