import {Helmet} from "react-helmet";
import React, {useCallback, useEffect, useRef, useState} from "react";
import TilesDeck, {Tile} from "./classes/TilesDeck";
import {Unit, units as listOfUnits} from "./classes/Units.ts";
import {Board} from "./modules/Board/Board";

import {ControlPanel} from "@pages/GamePage/modules/ControlPanel/ControlPanel.tsx";
import {Teams} from "@pages/GamePage/modules/Teams/Teams.tsx";
import {GameStageContext, GameStagesType, MapContext, MultiplayerContext} from "@pages/GamePage/gameContext.ts";
import {Information} from "@pages/GamePage/modules/Inforamtion/Information.tsx";
import {defaultTeams, Team, TeamColorType, TeamsType} from "@pages/GamePage/classes/teams.ts";
import {IRooms, useMultiplayer} from "@pages/GamePage/hooks/useMultiplayer.ts";
import {IUser} from "@/store/auth/auth.slice.ts";
import {RainbowLoader} from "@UI/Loaders";
import {StartGameScreen} from "@pages/GamePage/modules/StartGameScreen/StartGameScreen.tsx";
import {ComposeContexts, contextProvider} from "@components/Helpers";
import {GameOverScreen} from "@pages/GamePage/modules/GameOverScreen/GameOverScreen.tsx";
import {useTSelector} from "@hooks/redux.ts";
import {YourMove} from "@pages/GamePage/Components/YourMove.tsx";
import {RoomSelectorScreen} from "@pages/GamePage/modules/RoomSelectorScreen/RoomSelectorScreen.tsx";

const user: IUser = {
    id: Date.now().toString(),
    name: 'ColorKat',
};

/**
 * This component renders the game page.
 * It is responsible for the global state of the game,
 * and it provides an interface for multiplayer realization.
 *
 * @constructor
 */
export const GamePage = () => {
    const user = useTSelector(state => state.auth.user) as IUser;

    // Rooms
    const [roomId, setRoomId] = useState("");

    // Teams
    const [myTeamColor, setMyTeamColor] = useState<TeamColorType | null>(null); // Will be set by server
    const [teams, setTeams] = useState<TeamsType>(defaultTeams);

    // State with current stage of the game
    const [stage, setStage] = useState<GameStagesType>('notStarted');
    const isConnectedToRoom = !!myTeamColor;

    // States for information about current tile, unit and tooltip.
    const [infoMessage, setInfoMessage] = useState("");
    const [tooltip, setTooltip] = useState("");
    const [tileInformation, setTileInformation] = useState<Tile | null>(null);
    const [unitInformation, setUnitInformation] = useState<Unit | null>(null);

    // Get shuffled deck of tiles
    const [deck, setDeck] = useState((new TilesDeck()).getShuffledDeck());
    // Map state
    const [map, setMap] = useState<Tile[]>([]);
    // State for current tile
    const [currentTile, setCurrentTile] = useState<Tile | undefined>(undefined);

    // Game over state - data about winners
    const [winners, setWinners] = useState<Team[]>([]);

    /* ------- Functions for multiplayer ------- */
    // Retrieve methods for multiplayer
    const {
        connectUser,
        freeRooms,
        joinRoom,
        ready,
        passTheMove,
        leaveRoom
    } = useMultiplayer({
        user,
        stage, setStage,
        setDeck,
        setMyTeamColor, teams, setTeams,
        map, setMap,
        setWinners,
        setInfoMessage
    });

    useEffect(() => {
        connectUser();
    }, []);

    // Catch disconnect event
    useEffect(() => {
        const handleBeforeUnload = () => leaveRoom(roomId);
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [roomId, user]);
    /* ------- Functions for multiplayer ------- */

    /**
     * Reset information states, reset current tile.
     * Pass the move.
     *
     * @param updatedMap - use it because original map state is not updated here at the moment of running this function.
     */
    const endOfTurn = useCallback(() => {
        // Hide tooltip, tile and unit information
        setTooltip("");
        setTileInformation(null);
        setUnitInformation(null);
        setInfoMessage("");

        // Clear current tile
        setCurrentTile(undefined);

        // Pass the turn to the next player
        handlePassTheMove();
    }, [map, teams]);

    useEffect(() => {
        if (stage === 'endOfTurn') endOfTurn();
    }, [stage]);

    const handlePassTheMove = () => {
        // Change stage to wait
        setStage('wait');

        // Pass the move to the next player in the multiplayer
        passTheMove({
            roomId,
            user,
            data: {
                deck: deck,
                map: map,
                teams: teams
            }
        });
    };

    const skipTheMove = () => {
        setCurrentTile(undefined);
        handlePassTheMove()
    }
    // console.log('STAGE:', stage);
    // console.log(deck)

    return (
        // Compose context providers
        <ComposeContexts providers={[
            /* --- Game stage context --- */
            contextProvider(
                GameStageContext.Provider,
                {stage, setStage}
            ),
            /* --- Map context --- */
            contextProvider(
                MapContext.Provider,
                {
                    myTeamColor: myTeamColor as any,
                    setMyTeamColor,
                    teams,
                    setTeams,

                    tileSize: 192,
                    setDeck,
                    map,
                    setMap,
                    currentTile,

                    setInfoMessage,
                    setTooltip,
                    setTileInformation,
                    setUnitInformation,

                    endOfTurn
                }
            ),
            /* --- Multiplayer context --- */
            contextProvider(
                MultiplayerContext.Provider,
                {
                    roomId,
                    joinRoom,
                    ready,
                    leaveRoom,
                    passTheMove,
                }
            )
        ]}>
            <div className="w-full h-full cursor-default">
                <Helmet>
                    <title>СмолКассон - играть</title>
                    <link rel="canonical" href={import.meta.env.VITE_APP_URL + '/game'}/>
                </Helmet>

                {/*{!isConnectedToRoom && <RainbowLoader className="mt-24"/>}*/}

                {/* Room Selector screen */}
                {stage == 'notStarted' && !isConnectedToRoom &&
                    <RoomSelectorScreen
                        user={user}
                        roomId={roomId}
                        setRoomId={setRoomId}
                        freeRooms={freeRooms}
                    />
                }

                {/* Start Game screen with unit selector */}
                {stage == 'notStarted' && isConnectedToRoom &&
                    <StartGameScreen
                        roomId={roomId}
                    />
                }

                {/* Game */}
                {stage !== 'notStarted' &&
                    <div className="flex h-full w-full relative">

                        {/* Control panel with buttons and the deck of tiles */}
                        <ControlPanel
                            currentTile={currentTile}
                            setCurrentTile={setCurrentTile}
                            deck={deck}
                            setDeck={setDeck}
                            skipTheMove={skipTheMove}
                        />

                        {/* Users list and score */}
                        <Teams
                            teams={teams}
                        />

                        {/* Board with the map */}
                        <Board
                            currentTile={currentTile}
                            setCurrentTile={setCurrentTile}

                            endOfTurn={endOfTurn}
                        />

                        {stage == 'takeTile' && !currentTile && <YourMove />}

                    </div>
                }

                {/* Game over screen */}
                {stage == 'gameOver' &&
                    <GameOverScreen
                        winners={winners}
                        setWinners={setWinners}
                        user={user}
                        roomId={roomId}
                        setRoomId={setRoomId}
                    />
                }

                {/* Information messages, tooltips and info */}
                <Information
                    tileInformation={tileInformation}
                    unitInformation={unitInformation}
                    tooltip={tooltip}
                    infoMessage={infoMessage}
                    setInfoMessage={setInfoMessage}
                    setTooltip={setTooltip}
                    setTileInformation={setTileInformation}
                    setUnitInformation={setUnitInformation}
                />

            </div>
        </ComposeContexts>
    );
};