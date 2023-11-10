import React from "react";
import {Tile} from "@pages/GamePage/classes/TilesDeck.tsx";
import {Unit} from "@pages/GamePage/classes/Units.ts";

export const MapContext = React.createContext<{
    myTeam: string,
    tileSize: number,
    map: Tile[],
    setMap: React.Dispatch<React.SetStateAction<Tile[]>>,
    currentTile: Tile | undefined,

    setTooltip: React.Dispatch<React.SetStateAction<string>>,
    setTileInformation: React.Dispatch<React.SetStateAction<Tile | null>>,
    setUnitInformation: React.Dispatch<React.SetStateAction<Unit | null>>,

    endOfTurn: () => void;
}>({} as any);

export type GameStagesType = 'emptyMap' | 'tilePlaced' | 'unitPlaced' | 'scoring' | 'endOfTurn' | 'wait';
export const GameStageContext = React.createContext<{
    stage: GameStagesType,
    setStage: React.Dispatch<React.SetStateAction<GameStagesType>>,
}>({} as any);

