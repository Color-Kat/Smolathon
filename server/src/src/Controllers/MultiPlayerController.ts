import {AbstractController} from "./AbstractController.js";
import WebSocket from "ws";
import {WebsocketRequestHandler, Instance as WSServerInstance} from "express-ws";
import {IUser} from "../types/types";
import {MultiplayerService} from "../Services/MultiplayerService.js";
import {WSClient} from "../types/multiplayer";
import {response} from "express";

// Common Multiplayer request
interface MultiPlayerRequest<T = undefined> {
    roomId: string;
    method: string;
    user: IUser;

    data: T;
}

type MultiplayerSyncRequest = MultiPlayerRequest<{
    map: [];
    teams: any[];
}>;

/**
 * This controller is responsible for multiplayer realization.
 * Here must not be a logic, the logic is placed in the multiplayer service.
 * This controller just provides an interface between request and multiplayer service.
 * This controller must get data from ws request and send data using ws. All logic is in the multiplayer service.
 */
export class MultiPlayerController extends AbstractController {
    private ws: WSClient | null = null;

    // /**
    //  * Websocket server instance
    //  * @private
    //  */
    // private wsServer;
    //
    /**
     * All websocket connections
     * @private
     */
    private aWss;

    private multiplayerService: MultiplayerService;

    constructor(wsServer: WSServerInstance) {
        super();

        // this.wsServer = wsServer;
        this.aWss = wsServer.getWss();

        this.multiplayerService = new MultiplayerService();
    }

    /* ------- Helpers ------- */
    /**
     * Broadcast data from callback to all clients of this roomId.
     *
     * @param roomId
     * @param callback
     */
    private broadcast = (roomId: string, callback: (client: WSClient) => {}) => {
        this.aWss.clients.forEach((client: WSClient) => {
            if (client.roomId != roomId) return; // Skip other rooms

            const result = callback(client);

            // Send a message
            client.send(JSON.stringify(result));
        });
    };

    /**
     * Return array of the players from the roomId room.
     * @param roomId
     * @private
     */
    private getRoomPlayers(roomId: string): WSClient[] {
        return [...this.aWss.clients].filter((client: WSClient) => client.roomId == roomId);
    }

    /* ------- Helpers ------- */

    /**
     * Parse data from ws request and run endpoint function by method.
     *
     * @param ws
     * @param req
     */
    public initWebsocket: WebsocketRequestHandler = (ws, req): void => {
        console.log('Client connected to the websocket server');
        this.ws = ws;

        this.ws.on('message', (message: string) => {
            const request: MultiPlayerRequest<any> = JSON.parse(message);
            // console.log(data);

            switch (request.method) {
                case 'joinRoom':
                    this.joinRoomHandler(request);
                    break;

                case 'startGame':
                    this.startGameHandler(request);
                    break;

                case 'disconnect':
                    this.disconnectHandler(request);
                    break;

                case 'passTheMove':
                    this.passTheMoveHandler(request);
                    break;

                default:
                    console.log('Unknown method: ', request.method);
                    break;
            }
        });
    };

    /* ------- Handlers ------- */
    /**
     * Send a message about new player to all clients of this roomId
     * And initiate an assigning a team for the new player.
     *
     * @param request
     */
    public joinRoomHandler(request: MultiPlayerRequest): void {
        if (!this.ws) return;

        const result = this.multiplayerService.joinRoom(request.roomId);

        if (result) {
            // Send a message about new player
            this.broadcast(request.roomId, (client: WSClient) => ({
                method: 'message',
                message: "Новый игрок подключился к комнате " + request.roomId
            }));

            this.initPlayer(request);
        } else {
            // User can't join this room
            this.ws.send(JSON.stringify({
                method: 'message',
                message: "Невозможно присоединиться к комнате " + request.roomId
            }));
        }
    }

    /**
     * Init player.
     * Save user data for this ws connection,
     * Assign a team for the new player.
     * And send setMyTeam event to this player.
     *
     * @param request
     */
    public initPlayer(request: MultiPlayerRequest): void {
        if (!this.ws) return;
        const roomId = request.roomId;

        // Get team for just connected player
        const team = this.multiplayerService.getFreeTeam(this.getRoomPlayers(roomId));

        // Save user data for this ws connection
        this.ws.roomId = request.roomId;
        this.ws.user = request.user;
        this.ws.team = team;
        this.ws.isCurrentPlayer = false;

        // Send to just connected user his team
        this.ws.send(JSON.stringify({
            method: 'setMyTeam',
            team: this.ws.team
        }));
    }

    /**
     * Send event "startGame" with list of teams that are connected to this room.
     * Send event "passTheMove" to the player, who started this game, with isCurrentPlayer property.
     * @param request
     */
    public startGameHandler(request: MultiPlayerRequest): void {
        if (!this.ws) return;

        // Mark this room as game started
        this.multiplayerService.startGame(request.roomId);

        // Get list of teams that are connected to this room
        const teamsList = this.multiplayerService.getTeamsList(this.aWss.clients);

        // Send a message about new player
        this.broadcast(request.roomId, (client: WSClient) => ({
            method: 'startGame',
            teamsList
        }));

        // Pass the move to the player, who started this game
        setTimeout(() => this.passTheFirstMoveHandler(request), 250);
    }

    /**
     * Send message about player disconnect
     * and remove him from this room.
     * @param request
     */
    public disconnectHandler(request: MultiPlayerRequest): void {
        if (!this.ws) return;

        // Send message to all users
        this.broadcast(request.roomId, (client: WSClient) => ({
            method: 'message',
            message: `Пользователь ${request.user?.name} покинул игру`
        }));

        this.multiplayerService.leaveRoom(request.roomId);

        // Todo sync teams after disconnect
    }

    /**
     * Pass the move to the player in this.ws (the player, who started this game).
     *
     * @param request
     */
    public passTheFirstMoveHandler = (request: MultiPlayerRequest): void => {
        // Player, who started the game, moves first
        this.broadcast(request.roomId, (client: WSClient) => {
            client.isCurrentPlayer = this.ws?.user?.id == client.user?.id;

            // Sync data between all players
            return {
                isCurrentPlayer: this.ws?.user?.id == client.user?.id,
                method: 'passTheMove',
            };
        });
    };

    /**
     * Pass the turn to the next player.
     * Set isCurrentPlayer = false for all players besides the new active player.
     *
     * @param request
     */
    public passTheMoveHandler = (request: MultiplayerSyncRequest): void => {
        if (!this.ws) return;
        const roomId = request.roomId;

        // Get the next player user id
        const nextPlayerId = this.multiplayerService.getNextPlayerId(this.getRoomPlayers(roomId));

        this.broadcast(roomId, (client: WSClient) => {
            // Pass the turn
            client.isCurrentPlayer = client.user?.id == nextPlayerId;

            // Sync data between all players
            return {
                isCurrentPlayer: client.user?.id == nextPlayerId,
                method: 'passTheMove',
            };
        });

        this.syncDataHandler(request);
    };

    /**
     * Sync data between all players connected to this room.
     * @param request
     */
    public syncDataHandler = (request: MultiplayerSyncRequest): void => {
        if (!this.ws) return;
        const roomId = request.roomId;

        this.broadcast(roomId, (client: WSClient) => {
            return {
                data: request.data,
                method: 'syncData',
            };
        });
    }
    /* ------- Handlers ------- */
}