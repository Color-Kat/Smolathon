import {Instance as WSServerInstance} from "express-ws";
import {WSClient} from "../types/multiplayer";
import WebSocket from "ws";

interface IRoom {
    roomId: string;
    isGameStarted: boolean
    playersCount: number;
}

const rooms: {[key: string]: IRoom} = {};

export class MultiplayerService {
    // /**
    //  * Websocket server instance
    //  * @private
    //  */
    // private wsServer;
    //
    // /**
    //  * All websocket connections
    //  * @private
    //  */
    // private aWss;

    constructor(
        // wsServer: WSServerInstance
    ) {
        // this.wsServer = wsServer;
        // this.aWss = this.wsServer.getWss();
    }

    private teams = ['blue', 'red', 'green', 'yellow'];

    /**
     * Create or update room.
     * Return false if player can't be connected to the room.
     *
     * @param roomId
     */
    public joinRoom(roomId: string): boolean {
        // Create new room
        if(!rooms[roomId]) rooms[roomId] = {
            roomId,
            isGameStarted: false,
            playersCount: 0
        };

        // The game is already started
        if(rooms[roomId].isGameStarted) return false;

        // The room is full
        if(rooms[roomId].playersCount + 1 > 4) return false;
        rooms[roomId].playersCount++;
        console.log(rooms[roomId].playersCount);

        return true;
    }

    /**
     * Mark the room as game started.
     * @param roomId
     */
    public startGame(roomId: string): void {
        rooms[roomId].isGameStarted = true;
    }

    /**
     * Decrement players count in this room.
     * If there's no players, delete this room
     * @param roomId
     */
    public leaveRoom(roomId: string): void {
        if(rooms[roomId]) {
            console.log('leave count', rooms[roomId].playersCount - 1)
            rooms[roomId].playersCount--;
            if (rooms[roomId].playersCount == 0) delete rooms[roomId];
        }
    }

    /**
     * Return the first free team color.
     * @param players
     */
    public getFreeTeam(players: WSClient[]): string {
        // List of free teams (blue, red, etc.)
        let freeTeams = this.teams;

        // Iterate all players of this room
        players.forEach((player) => {
            // Delete already taken team names
            freeTeams = freeTeams.filter((team) => team != player.team)
        });

        return freeTeams[0];
    }

    /**
     * Return the list of teams that are connected to this room.
     * @param clients
     */
    public getTeamsList(clients: Set<WSClient>): string[] {
        return this.teams.slice(0, clients.size);
    }

    /**
     * Return the next player id.
     * @param players
     */
    public getNextPlayerId(players: WSClient[]): string {
        let currentPlayerIndex = 0;

        for (let i = 0; i < players.length; i++) {
            if(players[i].isCurrentPlayer) {
                currentPlayerIndex = i;
                break;
            }
        }

        const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
        return players[nextPlayerIndex].user?.id ?? "";
    }

}