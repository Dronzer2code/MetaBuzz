import React from 'react';
import { useParams } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { Buzzer } from '../lib/store';
import { GAME_SERVER } from '../lib/endpoints';
import Table from '../components/Table';
import Header from '../components/Header';

export default function Game({ auth, setAuth }) {
  const { id: roomID } = useParams();

  const loadingComponent = () => (
    <div className="comic-table-view">
      <div className="comic-city-backdrop">
        <div className="comic-stars" />
        <div className="comic-clouds" />
        <div className="comic-skyline" />
      </div>
      <Header
        auth={auth}
        clearAuth={() =>
          setAuth({
            playerID: null,
            credentials: null,
            roomID: null,
          })
        }
        inGame={true}
      />
      <div className="comic-loading-container">
        <Spinner animation="border" role="status" className="comic-spinner">
          <span className="sr-only">CONNECTING FREQUENCY...</span>
        </Spinner>
        <p className="comic-loading-text">
          {`// ESTABLISHING LEVEL 5 UPLINK TO ROOM #${roomID} //`}
        </p>
      </div>
    </div>
  );

  const App = Client({
    game: Buzzer,
    board: Table,
    multiplayer: SocketIO({ server: GAME_SERVER }),
    debug: false,
    loading: loadingComponent,
  });

  return (
    <main id="game" className="metabuzz-game-main">
      <div className="primary">
        <App
          gameID={roomID}
          playerID={String(auth.playerID)}
          credentials={auth.credentials}
          headerData={{ ...auth, setAuth }}
        />
      </div>
    </main>
  );
}
