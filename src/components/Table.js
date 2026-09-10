import React, { useState, useEffect, useRef } from 'react';
import { get, some, values, sortBy, orderBy, isEmpty, round } from 'lodash';
import { Howl } from 'howler';
import { AiOutlineDisconnect } from 'react-icons/ai';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Table(game) {
  const [loaded, setLoaded] = useState(false);
  const [buzzed, setBuzzer] = useState(
    some(game.G.queue, (o) => o.id === game.playerID)
  );
  const [lastBuzz, setLastBuzz] = useState(null);
  const [sound, setSound] = useState(true);
  const [soundPlayed, setSoundPlayed] = useState(false);
  const buzzButton = useRef(null);
  const queueRef = useRef(null);

  const buzzSound = new Howl({
    src: [
      `${process.env.PUBLIC_URL}/shortBuzz.webm`,
      `${process.env.PUBLIC_URL}/shortBuzz.mp3`,
    ],
    volume: 0.7,
    rate: 1.3,
  });

  const playSound = () => {
    if (sound && !soundPlayed) {
      buzzSound.play();
      setSoundPlayed(true);
    }
  };

  useEffect(() => {
    // reset buzzer based on game
    if (!game.G.queue[game.playerID]) {
      // delay the reset, in case game state hasn't reflected your buzz yet
      if (lastBuzz && Date.now() - lastBuzz < 500) {
        setTimeout(() => {
          const queue = queueRef.current;
          if (queue && !queue[game.playerID]) {
            setBuzzer(false);
          }
        }, 500);
      } else {
        // immediate reset, if it's been awhile
        setBuzzer(false);
      }
    }

    // reset ability to play sound if there is no pending buzzer
    if (isEmpty(game.G.queue)) {
      setSoundPlayed(false);
    } else if (loaded) {
      playSound();
    }

    if (!loaded) {
      setLoaded(true);
    }

    queueRef.current = game.G.queue;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.G.queue]);

  const attemptBuzz = () => {
    if (!buzzed && !game.G.locked) {
      playSound();
      game.moves.buzz(game.playerID);
      setBuzzer(true);
      setLastBuzz(Date.now());
    }
  };

  // spacebar will buzz
  useEffect(() => {
    function onKeydown(e) {
      if (e.keyCode === 32 && !e.repeat) {
        if (buzzButton.current) {
          buzzButton.current.click();
          e.preventDefault();
        }
      }
    }
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, []);

  const players = !game.gameMetadata
    ? []
    : game.gameMetadata
        .filter((p) => p.name)
        .map((p) => ({ ...p, id: String(p.id) }));
  // host is lowest active user
  const firstPlayer =
    get(
      sortBy(players, (p) => parseInt(p.id, 10)).filter((p) => p.connected),
      '0'
    ) || null;
  const isHost = get(firstPlayer, 'id') === game.playerID;

  const queue = sortBy(values(game.G.queue), ['timestamp']);
  const buzzedPlayers = queue
    .map((p) => {
      const player = players.find((pl) => pl.id === p.id);
      if (!player) {
        return {};
      }
      return {
        ...p,
        name: player.name,
        connected: player.connected,
      };
    })
    .filter((p) => p.name);

  // active players who haven't buzzed
  const activePlayers = orderBy(
    players.filter((p) => !some(queue, (q) => q.id === p.id)),
    ['connected', 'name'],
    ['desc', 'asc']
  );

  const timeDisplay = (delta) => {
    if (delta > 1000) {
      return `+${round(delta / 1000, 2)}s`;
    }
    return `+${delta}ms`;
  };

  return (
    <div className="comic-table-view">
      {/* Background Comic Sky & City Skyline */}
      <div className="comic-city-backdrop">
        <div className="comic-stars" />
        <div className="comic-clouds" />
        <div className="comic-skyline" />
      </div>

      <Header
        auth={game.headerData}
        clearAuth={() =>
          game.headerData.setAuth({
            playerID: null,
            credentials: null,
            roomID: null,
          })
        }
        sound={sound}
        setSound={() => setSound(!sound)}
        inGame={true}
      />

      <div className="comic-table-content">
        <div className="comic-table-container">
          {/* Room Header Badge */}
          <div className="comic-room-badge-wrap">
            <div className="comic-room-badge">
              <span className="badge-prefix">{'ARENA SECTOR //'}</span>
              <span className="badge-room-id">ROOM #{game.gameID}</span>
            </div>
            {isHost ? (
              <span className="comic-host-tag">⚡ HOST PRIVILEGES ACTIVE</span>
            ) : null}
          </div>

          {!game.isConnected ? (
            <div className="comic-warning-banner">
              ⚠️ FREQUENCY LOST &mdash; ATTEMPTING TO RE-ESTABLISH UPLINK...
            </div>
          ) : null}

          {/* Buzzer Live/Locked Status Indicator Banner */}
          {game.G.locked ? (
            <div className="comic-status-banner locked">
              {isHost ? (
                <span>
                  🔒 <strong>BUZZER INACTIVE:</strong> CLICK &quot;ACTIVATE
                  BUZZER&quot; BELOW TO OPEN THE ROUND FOR ALL PLAYERS
                </span>
              ) : (
                <span>
                  🔒 <strong>BUZZER INACTIVE:</strong> WAITING FOR HOST TO
                  ACTIVATE...
                </span>
              )}
            </div>
          ) : (
            <div className="comic-status-banner live">
              <span>
                ⚡ <strong>BUZZER IS LIVE!</strong> FIRST TO PRESS WINS QUEUE
                POSITION!
              </span>
            </div>
          )}

          {/* Giant Comic Buzzer Section */}
          <div className="comic-buzzer-stage">
            <div className="comic-buzzer-wrap">
              <button
                ref={buzzButton}
                type="button"
                className={`comic-super-buzzer ${
                  game.G.locked
                    ? 'buzzer-locked'
                    : buzzed
                    ? 'buzzer-buzzed'
                    : 'buzzer-ready'
                }`}
                disabled={buzzed || game.G.locked}
                onClick={attemptBuzz}
              >
                <div className="buzzer-halftone" />
                <span className="buzzer-main-label">
                  {game.G.locked ? 'LOCKED' : buzzed ? 'BUZZED!' : 'BUZZ!'}
                </span>
                <span className="buzzer-sub-label">
                  {game.G.locked
                    ? isHost
                      ? 'ACTIVATE BELOW'
                      : 'WAITING FOR HOST'
                    : buzzed
                    ? 'POSITION LOCKED'
                    : 'TAP OR PRESS SPACE'}
                </span>
              </button>
            </div>

            <p className="comic-spacebar-hint">
              {game.G.locked
                ? isHost
                  ? '[ CLICK "ACTIVATE BUZZER" TO OPEN ROUND ]'
                  : '[ BUZZER INACTIVE — WAITING FOR HOST ]'
                : '[ PRO-TIP: PRESS SPACEBAR FOR FASTEST REFLEXES ]'}
            </p>
          </div>

          {/* Host Tactical Controls (HOST ONLY) */}
          {isHost ? (
            <div className="comic-host-panel">
              <div className="host-panel-header">
                <span className="confidential-pill">
                  {'// COMMAND OVERRIDE //'}
                </span>
                <h4>HOST TACTICAL CONTROLS</h4>
              </div>
              <div className="host-actions">
                {game.G.locked ? (
                  <button
                    type="button"
                    className="comic-control-btn btn-activate-live"
                    onClick={() => {
                      if (game.moves.activateBuzzer) {
                        game.moves.activateBuzzer();
                      } else {
                        game.moves.toggleLock();
                      }
                    }}
                  >
                    ⚡ ACTIVATE BUZZER (OPEN FOR PLAYERS)
                  </button>
                ) : (
                  <button
                    type="button"
                    className="comic-control-btn btn-deactivate"
                    onClick={() => {
                      if (game.moves.deactivateBuzzer) {
                        game.moves.deactivateBuzzer();
                      } else {
                        game.moves.toggleLock();
                      }
                    }}
                  >
                    🔒 DEACTIVATE BUZZER (LOCK)
                  </button>
                )}

                <button
                  type="button"
                  className="comic-control-btn btn-next-deactivate"
                  onClick={() => {
                    if (game.moves.resetAndDeactivate) {
                      game.moves.resetAndDeactivate();
                    } else {
                      game.moves.resetBuzzers();
                      if (!game.G.locked) {
                        game.moves.toggleLock();
                      }
                    }
                  }}
                  title="Clear queue and deactivate buzzer for the next question"
                >
                  🛑 NEXT &amp; DEACTIVATE
                </button>

                <button
                  type="button"
                  className="comic-control-btn btn-next-round"
                  onClick={() => {
                    if (game.moves.resetAndActivate) {
                      game.moves.resetAndActivate();
                    } else {
                      game.moves.resetBuzzers();
                      if (game.G.locked) {
                        game.moves.toggleLock();
                      }
                    }
                  }}
                >
                  ⚡ NEXT &amp; ACTIVATE
                </button>

                <button
                  type="button"
                  className="comic-control-btn btn-reset"
                  disabled={isEmpty(game.G.queue)}
                  onClick={() => game.moves.resetBuzzers()}
                >
                  🔄 CLEAR QUEUE
                </button>
              </div>
            </div>
          ) : null}

          {/* Buzzed & Standby Queues */}
          <div className="comic-queues-grid">
            {/* Buzzed Players */}
            <div className="comic-queue-card card-buzzed">
              <div className="comic-halftone-overlay" />
              <div className="queue-header">
                <span className="queue-badge yellow">SPEED QUEUE</span>
                <h3>OPERATIVES BUZZED ({buzzedPlayers.length})</h3>
              </div>

              {buzzedPlayers.length === 0 ? (
                <div className="empty-queue-msg">
                  NO OPERATIVES HAVE BUZZED YET. READY ON TRIGGER...
                </div>
              ) : (
                <ul className="comic-player-list">
                  {buzzedPlayers.map(
                    ({ id, name: pName, timestamp, connected }, i) => (
                      <li
                        key={id}
                        className={`comic-player-item ${
                          isHost ? 'resettable' : ''
                        } ${i === 0 ? 'first-place' : ''}`}
                        onClick={() => {
                          if (isHost) {
                            game.moves.resetBuzzer(id);
                          }
                        }}
                        title={isHost ? 'Click to reset this operative' : ''}
                      >
                        <div className="player-rank">#{i + 1}</div>
                        <div className="player-details">
                          <span
                            className={`player-name ${!connected ? 'dim' : ''}`}
                          >
                            {pName}
                          </span>
                          {!connected ? (
                            <AiOutlineDisconnect
                              className="comic-dc-icon"
                              title="Disconnected"
                            />
                          ) : null}
                          {i === 0 ? (
                            <span className="first-badge">⚡ 1ST TRIGGER</span>
                          ) : (
                            <span className="time-delta">
                              {timeDisplay(timestamp - queue[0].timestamp)}
                            </span>
                          )}
                        </div>
                        {isHost ? (
                          <span className="reset-hint">✕ RESET</span>
                        ) : null}
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>

            {/* Standby Players */}
            <div className="comic-queue-card card-standby">
              <div className="comic-halftone-overlay" />
              <div className="queue-header">
                <span className="queue-badge cream">RADAR</span>
                <h3>STANDBY OPERATIVES ({activePlayers.length})</h3>
              </div>

              {activePlayers.length === 0 ? (
                <div className="empty-queue-msg">
                  ALL OPERATIVES ARE CURRENTLY BUZZED.
                </div>
              ) : (
                <ul className="comic-standby-list">
                  {activePlayers.map(({ id, name: pName, connected }) => (
                    <li key={id} className="comic-standby-item">
                      <span
                        className={`status-indicator ${
                          connected ? 'online' : 'offline'
                        }`}
                      />
                      <span
                        className={`standby-name ${!connected ? 'dim' : ''}`}
                      >
                        {pName}
                      </span>
                      {!connected ? (
                        <AiOutlineDisconnect
                          className="comic-dc-icon"
                          title="Disconnected"
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer mobileOnly={false} />
    </div>
  );
}
