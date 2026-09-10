import React, { useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { get } from 'lodash';
import { Howl } from 'howler';
import { joinRoom, getRoom, createRoom } from '../lib/endpoints';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ERROR_TYPE = {
  emptyCode: 'emptyCode',
  roomCode: 'roomCode',
  name: 'name',
  hostRoom: 'hostRoom',
  fullRoom: 'fullRoom',
  dupName: 'dupName',
  hostPassword: 'hostPassword',
};

const ERROR_MESSAGE = {
  [ERROR_TYPE.emptyCode]: 'ENTER ROOM CLEARANCE CODE',
  [ERROR_TYPE.roomCode]: 'UNABLE TO LOCATE ROOM WITH THIS CODE',
  [ERROR_TYPE.name]: 'PLEASE ENTER YOUR PLAYER NAME',
  [ERROR_TYPE.dupName]: 'PLAYER NAME ALREADY CLAIMED IN THIS ROOM',
  [ERROR_TYPE.hostRoom]: 'UNABLE TO INITIATE ROOM // PLEASE RETRY',
  [ERROR_TYPE.fullRoom]: 'ROOM HAS REACHED MAXIMUM CAPACITY (150)',
  [ERROR_TYPE.hostPassword]: 'INCORRECT HOST PASSWORD // ACCESS DENIED',
};

export default function Lobby({ setAuth }) {
  const location = useLocation();
  const prefilledRoomID = get(location, 'state.roomID');

  const history = useHistory();
  const [name, setName] = useState('');
  const [room, setRoom] = useState(prefilledRoomID || '');
  const [hostPassword, setHostPassword] = useState('');
  const [joinMode, setJoinMode] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);

  const previewSound = new Howl({
    src: [
      `${process.env.PUBLIC_URL}/shortBuzz.webm`,
      `${process.env.PUBLIC_URL}/shortBuzz.mp3`,
    ],
    volume: 0.6,
  });

  const handlePlayAudio = () => {
    try {
      setPlayingAudio(true);
      previewSound.play();
      setTimeout(() => setPlayingAudio(false), 600);
    } catch (e) {
      console.log('Audio playback error', e);
      setPlayingAudio(false);
    }
  };

  // enter room: find room, then join it
  async function enterRoom(roomId, hosting = false) {
    if (!hosting) {
      setLoading(true);
    }

    try {
      // get room
      const roomRes = await getRoom(roomId);
      if (roomRes.status !== 200) {
        throw new Error(ERROR_TYPE.roomCode);
      }
      const roomData = roomRes.data;

      // determine seat to take
      const playerSeat = roomData.players.find(
        (player) => player.name === name
      );
      const freeSeat = roomData.players.find((player) => !player.name);

      if (playerSeat && playerSeat.connected) {
        throw new Error(ERROR_TYPE.dupName);
      }
      if (!playerSeat && !freeSeat) {
        throw new Error(ERROR_TYPE.fullRoom);
      }
      const playerID = get(playerSeat, 'id', get(freeSeat, 'id'));
      const joinRes = await joinRoom(roomData.roomID, playerID, name);
      if (joinRes.status !== 200) {
        throw new Error(ERROR_TYPE.roomCode);
      }
      const creds = joinRes.data;
      const auth = {
        playerID,
        credentials: creds.playerCredentials,
        roomID: roomData.roomID,
      };

      // save auth and go to room
      setAuth(auth);
      setLoading(false);
      history.push(`/${roomData.roomID}`);
    } catch (err) {
      setLoading(false);
      setError(ERROR_MESSAGE[err.message] || 'CONNECTION ERROR');
    }
  }

  // make room: create room, then join it
  async function makeRoom() {
    setLoading(true);
    try {
      const createRes = await createRoom();
      if (createRes.status !== 200) {
        throw new Error(ERROR_TYPE.hostRoom);
      }
      const roomID = createRes.data.gameID;
      await enterRoom(roomID, true);
    } catch (err) {
      setLoading(false);
      setError(ERROR_MESSAGE[err.message] || 'UNABLE TO CREATE ROOM');
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    // validate room and/or player name has been filled
    if (joinMode) {
      if (room.trim().length === 0) {
        setError(ERROR_MESSAGE[ERROR_TYPE.emptyCode]);
      } else if (name.trim().length === 0) {
        setError(ERROR_MESSAGE[ERROR_TYPE.name]);
      } else if (room.trim().length !== 6) {
        setError(ERROR_MESSAGE[ERROR_TYPE.roomCode]);
      } else {
        enterRoom(room);
      }
    } else {
      if (name.trim().length === 0) {
        setError(ERROR_MESSAGE[ERROR_TYPE.name]);
      } else if (hostPassword.trim() !== 'messiisgoat') {
        setError(ERROR_MESSAGE[ERROR_TYPE.hostPassword]);
      } else {
        makeRoom();
      }
    }
  }

  return (
    <main className="metabuzz-app-main" id="lobby">
      {/* Background Comic Sky & City Skyline */}
      <div className="comic-city-backdrop">
        <div className="comic-stars" />
        <div className="comic-clouds" />
        <div className="comic-skyline" />
      </div>

      <Header />

      <div className="comic-lobby-wrapper">
        <div className="comic-lobby-container">
          {/* Main 3D Comic METABUZZ Title */}
          <div className="comic-title-wrapper">
            <h1 className="comic-faq-title" data-text="METABUZZ">
              METABUZZ
            </h1>
            <p className="comic-tagline">
              {'// REAL-TIME MULTIPLAYER BUZZER ARENA //'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="comic-file-tabs">
            <button
              type="button"
              className={`comic-tab-btn ${joinMode ? 'active' : ''}`}
              onClick={() => {
                setError('');
                setJoinMode(true);
              }}
            >
              JOIN A GAME
            </button>
            <button
              type="button"
              className={`comic-tab-btn ${!joinMode ? 'active' : ''}`}
              onClick={() => {
                setError('');
                setJoinMode(false);
              }}
            >
              HOST A GAME
            </button>
          </div>

          {/* Interactive Form Terminal Card */}
          <div className="comic-terminal-card lobby-center-card">
            <div className="comic-halftone-overlay" />
            <div className="terminal-header-bar">
              <span className="terminal-status-dot" />
              <span className="terminal-title">
                {joinMode ? 'ENTER ROOM CODE' : 'HOST NEW ROOM'}
              </span>
              <span className="terminal-badge">LIVE SOCKET</span>
            </div>

            <form className="comic-terminal-form" onSubmit={handleSubmit}>
              {joinMode ? (
                <div className="comic-form-group">
                  <label htmlFor="room-code-input" className="comic-label">
                    6-DIGIT ROOM CODE
                  </label>
                  <input
                    id="room-code-input"
                    className="comic-input comic-code-input"
                    placeholder="e.g. AB12CD"
                    maxLength={6}
                    value={room}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="characters"
                    spellCheck="false"
                    onChange={(e) => {
                      setError('');
                      setRoom(e.target.value.toUpperCase());
                    }}
                  />
                </div>
              ) : null}

              <div className="comic-form-group">
                <label htmlFor="player-name-input" className="comic-label">
                  YOUR NAME
                </label>
                <input
                  id="player-name-input"
                  className="comic-input"
                  placeholder="Enter player name..."
                  maxLength={20}
                  value={name}
                  onChange={(e) => {
                    setError('');
                    setName(e.target.value);
                  }}
                />
              </div>

              {!joinMode ? (
                <div className="comic-form-group">
                  <label htmlFor="host-password-input" className="comic-label">
                    HOST ACCESS PASSWORD
                  </label>
                  <input
                    id="host-password-input"
                    type="password"
                    className="comic-input"
                    placeholder="Enter host password..."
                    value={hostPassword}
                    onChange={(e) => {
                      setError('');
                      setHostPassword(e.target.value);
                    }}
                  />
                  <div className="comic-password-hint">
                    {'🔒 HOST CLEARANCE REQUIRED (ENTER PASSWORD TO HOST)'}
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="comic-error-banner">⚠️ {error}</div>
              ) : null}

              <button
                type="submit"
                className="comic-submit-btn"
                disabled={loading}
              >
                {loading
                  ? 'CONNECTING...'
                  : joinMode
                  ? 'JOIN GAME ⚡'
                  : 'HOST GAME ⚡'}
              </button>

              <div className="comic-form-switcher">
                {joinMode ? (
                  <span>
                    Hosting a game?{' '}
                    <button
                      type="button"
                      className="comic-inline-btn"
                      onClick={() => {
                        setError('');
                        setJoinMode(false);
                      }}
                    >
                      Create room
                    </button>
                  </span>
                ) : (
                  <span>
                    Joining a game?{' '}
                    <button
                      type="button"
                      className="comic-inline-btn"
                      onClick={() => {
                        setError('');
                        setJoinMode(true);
                      }}
                    >
                      Enter room
                    </button>
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* 3 Comic Feature Cards (Matching the 3 cards from reference screenshot) */}
          <div className="comic-cards-grid lobby-cards-grid">
            {/* Card 1: Yellow */}
            <div className="comic-card comic-card-yellow">
              <div className="comic-halftone-overlay" />
              <div className="comic-card-header">
                <h3 className="comic-card-title">MULTIPLAYER BUZZER</h3>
                <span className="comic-card-watermark">01</span>
              </div>
              <div className="comic-card-rule" />
              <p className="comic-card-body">
                Host a room and invite up to 150 players to join.
                Sub-millisecond timestamps ensure absolute fairness.
              </p>
              <div className="comic-card-backplate" />
            </div>

            {/* Card 2: Crimson */}
            <div className="comic-card comic-card-red">
              <div className="comic-halftone-overlay" />
              <div className="comic-card-header">
                <h3 className="comic-card-title">JOIN ON ANY DEVICE</h3>
                <span className="comic-card-watermark">02</span>
              </div>
              <div className="comic-card-rule" />
              <p className="comic-card-body">
                Use your computer, smartphone, or tablet. On desktop, press the
                spacebar for lightning-fast buzzing.
              </p>
              <div className="comic-card-backplate" />
            </div>

            {/* Card 3: Cream */}
            <div className="comic-card comic-card-cream">
              <div className="comic-halftone-overlay" />
              <div className="comic-card-header">
                <h3 className="comic-card-title">100% FREE TO USE</h3>
                <span className="comic-card-watermark">03</span>
              </div>
              <div className="comic-card-rule" />
              <p className="comic-card-body">
                Perfect for online quiz bowls, trivia nights, classroom
                activities, and live competitions.
              </p>
              <div className="comic-card-backplate" />
            </div>
          </div>

          {/* Confidential Divider */}
          <div className="comic-confidential-bar">
            <div className="dashed-line" />
            <span className="confidential-text">
              {'// LEVEL 5 REAL-TIME SOCKET PROTOCOL //'}
            </span>
            <div className="dashed-line" />
          </div>
        </div>
      </div>

      {/* Floating Bottom-Right Audio / Play Button */}
      <button
        type="button"
        className={`comic-sound-toggle-btn ${playingAudio ? 'buzzing' : ''}`}
        onClick={handlePlayAudio}
        title="Test MetaBuzz buzzer sound"
        aria-label="Test MetaBuzz buzzer sound"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="currentColor"
          className="play-icon"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>

      <Footer />
    </main>
  );
}
