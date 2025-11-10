// frontend/src/pages/SimulationPage.jsx
// Migrado a React con Tailwind CSS y daisyUI (sin archivos CSS externos)

import React, { useState } from 'react';

// --- Lógica de Simulación (Portado de simulation.js) ---
// Esta lógica es independiente de la UI
const teams = [
  'Japón',
  'Irán',
  'Corea del Sur',
  'Australia',
  'Arabia Saudita',
  'Qatar',
  'Irak',
  'Emiratos Árabes Unidos',
  'Nigeria',
  'Senegal',
  'Egipto',
  'Marruecos',
  'Camerún',
  'Argelia',
  'Túnez',
  'Ghana',
  'Costa de Marfil',
  'México',
  'Estados Unidos',
  'Canadá',
  'Costa Rica',
  'Panamá',
  'Jamaica',
  'Argentina',
  'Brasil',
  'Uruguay',
  'Colombia',
  'Ecuador',
  'Perú',
  'Nueva Zelanda',
  'Francia',
  'Inglaterra',
  'España',
  'Alemania',
  'Países Bajos',
  'Portugal',
  'Bélgica',
  'Italia',
  'Croacia',
  'Suiza',
  'Dinamarca',
  'Serbia',
  'Polonia',
  'Suecia',
  'Noruega',
  'Ucrania',
  'Chile',
  'Honduras',
];

function simulateMatch(teamA, teamB) {
  const scoreA = Math.floor(Math.random() * 5);
  const scoreB = Math.floor(Math.random() * 5);

  teamA.played++;
  teamB.played++;
  teamA.goalsFor += scoreA;
  teamB.goalsFor += scoreB;
  teamA.goalsAgainst += scoreB;
  teamB.goalsAgainst += scoreA;
  teamA.goalDifference = teamA.goalsFor - teamA.goalsAgainst;
  teamB.goalDifference = teamB.goalsFor - teamB.goalsAgainst;

  if (scoreA > scoreB) {
    teamA.wins++;
    teamB.losses++;
    teamA.points += 3;
  } else if (scoreB > scoreA) {
    teamB.wins++;
    teamA.losses++;
    teamB.points += 3;
  } else {
    teamA.draws++;
    teamB.draws++;
    teamA.points++;
    teamB.points++;
  }
}

function simulateKnockoutMatch(teamA, teamB) {
  let scoreA = Math.floor(Math.random() * 4);
  let scoreB = Math.floor(Math.random() * 4);

  if (scoreA === scoreB) {
    // Simple tie-breaker
    Math.random() > 0.5 ? scoreA++ : scoreB++;
  }

  const winner = scoreA > scoreB ? teamA : teamB;
  const loser = scoreA > scoreB ? teamB : teamA;
  // Devolvemos el partido completo para mostrar marcadores
  return {
    winner,
    loser,
    scoreA,
    scoreB,
    teamA: teamA.name,
    teamB: teamB.name,
  };
}

// --- Componente de React ---
const SimulationPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [userPrediction, setUserPrediction] = useState(''); // Estado para tu predicción

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const runSimulation = async () => {
    setIsLoading(true);
    setResults(null);
    await delay(500); // Pequeña espera inicial

    // 1. Barajar equipos y crear grupos
    const shuffledTeams = [...teams].sort(() => 0.5 - Math.random());
    const groupData = [];
    const groupLetters = 'ABCDEFGHIJKL'.split('');
    for (let i = 0; i < 12; i++) {
      const groupTeams = shuffledTeams.splice(0, 4).map((name) => ({
        name,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      }));
      groupData.push({ letter: groupLetters[i], teams: groupTeams });
    }

    // 2. Simular fase de grupos
    groupData.forEach((group) => {
      simulateMatch(group.teams[0], group.teams[1]);
      simulateMatch(group.teams[0], group.teams[2]);
      simulateMatch(group.teams[0], group.teams[3]);
      simulateMatch(group.teams[1], group.teams[2]);
      simulateMatch(group.teams[1], group.teams[3]);
      simulateMatch(group.teams[2], group.teams[3]);
      group.teams.sort(
        (a, b) =>
          b.points - a.points ||
          b.goalDifference - a.goalDifference ||
          b.goalsFor - a.goalsFor
      );
    });

    // Actualiza el estado para mostrar grupos (Aparece poco a poco)
    setResults({ groups: groupData });
    await delay(1500); // Espera para que el usuario vea los grupos

    // 3. Determinar clasificados
    const firstPlace = groupData.map((g) => g.teams[0]);
    const secondPlace = groupData.map((g) => g.teams[1]);
    const bestThirds = groupData
      .map((g) => g.teams[2])
      .sort(
        (a, b) =>
          b.points - a.points ||
          b.goalDifference - a.goalDifference ||
          b.goalsFor - a.goalsFor
      )
      .slice(0, 8);

    let roundOf32 = [...firstPlace, ...secondPlace, ...bestThirds].sort(
      () => 0.5 - Math.random()
    );

    // 4. Simular Eliminatorias
    const knockoutRounds = {};

    const runRound = async (name, teamsIn) => {
      const matches = [];
      for (let i = 0; i < teamsIn.length; i += 2) {
        matches.push(simulateKnockoutMatch(teamsIn[i], teamsIn[i + 1]));
      }
      knockoutRounds[name] = matches;
      // Actualiza resultados ronda por ronda (Aparece poco a poco)
      setResults((prev) => ({ ...prev, knockoutRounds: { ...knockoutRounds } }));
      await delay(1000); // Espera entre rondas
      return matches.map((m) => m.winner);
    };

    const runFinals = async (name, teamsIn, thirdPlaceMatch = false) => {
      const finalMatch = simulateKnockoutMatch(teamsIn[0], teamsIn[1]);
      knockoutRounds[name] = [finalMatch];

      if (thirdPlaceMatch) {
        const losers = thirdPlaceMatch.map((m) => m.loser);
        const thirdPlaceGame = simulateKnockoutMatch(losers[0], losers[1]);
        knockoutRounds['TercerLugar'] = [thirdPlaceGame];
      }

      // Actualiza para mostrar la final (Aparece poco a poco)
      setResults((prev) => ({ ...prev, knockoutRounds: { ...knockoutRounds } }));
      await delay(1000);

      return { winner: finalMatch.winner, loser: finalMatch.loser };
    };

    const roundOf16 = await runRound('Dieciseisavos', roundOf32);
    const quarterFinals = await runRound('Octavos', roundOf16);
    const semiFinals = await runRound('Cuartos', quarterFinals);
    const finalists = await runRound('Semifinal', semiFinals);
    const { winner } = await runFinals(
      'Final',
      finalists,
      knockoutRounds['Semifinal']
    );

    // Actualización final con el ganador (Aparece poco a poco)
    setResults((prev) => ({ ...prev, winner: winner }));
    setIsLoading(false);
  };

  // --- Componentes de UI Internos ---

  const GroupTable = ({ group }) => (
    <div className="bg-base-200 rounded-lg shadow-lg p-4">
      <h3 className="text-xl font-semibold mb-3 text-primary">
        Grupo {group.letter}
      </h3>
      <div className="overflow-x-auto">
        <table className="table table-xs">
          <thead>
            <tr>
              <th>Equipo</th>
              <th>Pts</th>
              <th>PJ</th>
              <th>G</th>
              <th>E</th>
              <th>P</th>
              <th>DG</th>
            </tr>
          </thead>
          <tbody>
            {group.teams.map((team, index) => (
              <tr
                key={team.name}
                className={`
                                ${(index < 2) ? 'bg-success/20' : ''}
                                ${(index === 2) ? 'bg-warning/20' : ''}
                            `}
              >
                <td>{team.name}</td>
                <td>{team.points}</td>
                <td>{team.played}</td>
                <td>{team.wins}</td>
                <td>{team.draws}</td>
                <td>{team.losses}</td>
                <td>{team.goalDifference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const KnockoutRound = ({ roundName, matches }) => (
    <div className="bg-base-200 rounded-lg shadow-lg p-4">
      <h3 className="text-xl font-semibold mb-4 text-primary">{roundName}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches.map((match, index) => (
          <div
            key={index}
            className="bg-base-100 p-3 rounded-md flex justify-between items-center"
          >
            <span className={match.scoreA > match.scoreB ? 'font-bold' : 'opacity-60'}>
              {match.teamA}
            </span>
            <span className="badge badge-neutral">{`${match.scoreA} - ${match.scoreB}`}</span>
            <span className={match.scoreB > match.scoreA ? 'font-bold' : 'opacity-60'}>
              {match.teamB}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    // El `pt-24` existente ya baja el título
    <div className="container mx-auto p-4 pt-24 min-h-screen">
      <header className="text-center mb-8">
        <h1 className="text-5xl font-bold">
          Simulador <span className="text-primary">Copa Mundial 2026</span>
        </h1>
      </header>

      {/* --- INICIO: CAMBIOS SOLICITADOS --- */}
      {/* Contenedor Flex para alinear Select y Botón */}
      <div className="flex justify-center items-end gap-4 mb-6">
        {/* 1. Recuadro para la predicción (Ahora a la izquierda) */}
        <div className="form-control w-full max-w-xs">
          <label className="label">
            <span className="label-text text-base-content">
              ¿Quién crees que ganará?
            </span>
          </label>
          <select
            className="select select-bordered"
            value={userPrediction}
            onChange={(e) => setUserPrediction(e.target.value)}
            disabled={isLoading}
          >
            <option value="" disabled>
              Elige un país
            </option>
            {teams.sort().map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Botón de simulación (Ahora más chico y a la derecha) */}
        <button
          id="start-simulation"
          onClick={runSimulation}
          disabled={isLoading}
          className="btn btn-primary" // Quitamos btn-lg y w-full
        >
          {isLoading ? 'Simulando...' : 'Simular Torneo'}
        </button>
      </div>

      {/* 3. Indicador de carga de daisyUI (centrado) */}
      {isLoading && (
        <div className="text-center my-4">
          <span className="loading loading-dots loading-lg text-primary"></span>
        </div>
      )}
      {/* --- FIN: CAMBIOS SOLICITADOS --- */}

      {/* Contenedor de resultados (La lógica de aparición gradual ya está aquí) */}
      {results && !isLoading && (
        <div id="results" className="mt-8 animate-fadeIn">
          {/* Bonus: Mostrar resultado de la predicción */}
          {userPrediction && results.winner && (
            <div
              role="alert"
              className={`alert ${
                userPrediction === results.winner.name
                  ? 'alert-success' // Verde si acierta
                  : 'alert-error' // Rojo si falla
              } shadow-lg mb-8`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {userPrediction === results.winner.name ? (
                <span>
                  ¡Felicidades! 🏆 Tu predicción fue correcta:{' '}
                  <b>{results.winner.name}</b>
                </span>
              ) : (
                <span>
                  Tu predicción fue <b>{userPrediction}</b>, pero el ganador fue{' '}
                  <b>{results.winner.name}</b>.
                </span>
              )}
            </div>
          )}

          {/* Fase de Grupos (sin cambios) */}
          {results.groups && (
            <section id="group-stage-section" className="mb-10">
              <h2 className="text-3xl font-bold mb-6 text-center">
                Fase de Grupos
              </h2>
              <div
                id="groups-container"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {results.groups.map((group) => (
                  <GroupTable key={group.letter} group={group} />
                ))}
              </div>
            </section>
          )}

          {/* Eliminatorias (sin cambios) */}
          {results.knockoutRounds && (
            <section id="knockout-section" className="mb-10">
              <h2 className="text-3xl font-bold mb-6 text-center">
                Fase de Eliminatorias
              </h2>
              <div id="knockout-container" className="space-y-6">
                {results.knockoutRounds.Dieciseisavos && (
                  <KnockoutRound
                    roundName="Dieciseisavos"
                    matches={results.knockoutRounds.Dieciseisavos}
                  />
                )}
                {results.knockoutRounds.Octavos && (
                  <KnockoutRound
                    roundName="Octavos de Final"
                    matches={results.knockoutRounds.Octavos}
                  />
                )}
                {results.knockoutRounds.Cuartos && (
                  <KnockoutRound
                    roundName="Cuartos de Final"
                    matches={results.knockoutRounds.Cuartos}
                  />
                )}
                {results.knockoutRounds.Semifinal && (
                  <KnockoutRound
                    roundName="Semifinales"
                    matches={results.knockoutRounds.Semifinal}
                  />
                )}
                {results.knockoutRounds.TercerLugar && (
                  <KnockoutRound
                    roundName="Tercer Lugar"
                    matches={results.knockoutRounds.TercerLugar}
                  />
                )}
                {results.knockoutRounds.Final && (
                  <KnockoutRound
                    roundName="Final"
                    matches={results.knockoutRounds.Final}
                  />
                )}
              </div>
            </section>
          )}

          {/* Ganador (sin cambios) */}
          {results.winner && (
            <div className="text-center p-6 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-lg shadow-2xl mt-12">
              <h3 className="text-4xl font-extrabold text-black">
                🏆 ¡Ganador: {results.winner.name}!
              </h3>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SimulationPage;