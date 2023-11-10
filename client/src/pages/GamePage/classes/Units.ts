import {Tile} from "@pages/GamePage/classes/TilesDeck.tsx";

interface IUnit {
    id: number;
    team?: string;
    name: string;
    description: string;
    image: string;
    occupied: boolean;
    role: 'traveler' | 'scientist';
}

export class Unit implements IUnit {

    public id: number;
    public team: string = '';
    public name: string;
    public description: string;
    public image: string;
    public occupied: boolean;
    public role: 'traveler' | 'scientist';

    constructor(unitData: IUnit) {
        this.id = unitData.id;
        this.name = unitData.name;
        this.description = unitData.description;
        this.image = unitData.image;
        this.occupied = unitData.occupied;
        this.role = unitData.role;
    }

    public setTeam(team: string) {
        this.team = team;
        return this;
    }

    public getRole() {
        switch (this.role) {
            case 'traveler':
                return 'Путешественник';
            case 'scientist':
                return 'Учёный';
            default:
                return 'Поэт';
        }
    }

    public canBePlacedOnMap(
        position: 0 | 1 | 2 | 3,
        map: Tile[],
        tileSize: number
    ): boolean {

        console.log(map);

        // Get just placed tile
        let lastTile = map.at(-1) as Tile;

        // The border name where the unit was placed
        const borderName = lastTile.borders[position];

        // Algorithm
        // We will count units on the map.
        // If it is more than 0, we can't place a unit on this border.
        // We need to count the units on all the same borders.
        // If it's a city at the top and a city at the bottom - check top and bottom tiles.

        let checkedIds: number[] = [];

        const countUnits = (tile: Tile, side: number) => {
            let result = 0;

            let mapSide = 0;
            if(side === 0) mapSide = 2;
            if(side === 1) mapSide = 3;
            if(side === 2) mapSide = 0;
            if(side === 3) mapSide = 1;

            for (const mapTile of map) {
                if(checkedIds.includes(mapTile.id)) continue; // Skip checked tiles
                if(tile.id == mapTile.id) continue; // Skip the same tile
                if(mapTile.borders[mapSide] != borderName) continue; // Skip tiles that are not connected to our

                if(
                    (side == 0 || side == 2) &&
                    (
                        mapTile.coords.x != tile.coords.x ||
                        Math.abs(mapTile.coords.y - tile.coords.y) > tileSize
                    )
                ) continue; // It is not a vertical neighbor

                if(
                    (side == 1 || side == 3) &&
                    (
                        Math.abs(mapTile.coords.x - tile.coords.x) > tileSize ||
                        mapTile.coords.y != tile.coords.y
                    )
                ) continue; // It is not a horizontal neighbor

                // We have checked this tile
                checkedIds.push(mapTile.id);

                // --- This tile is a neighbor --- //

                // Check if there is a unit on the neighbor
                if(mapTile.units[(mapSide + 0) % 4])
                    result += 1;
                if(mapTile.units[(mapSide + 1) % 4])
                    result += 1;
                if(mapTile.units[(mapSide + 2) % 4])
                    result += 1;
                if(mapTile.units[(mapSide + 3) % 4])
                    result += 1;

                // Check other sides of the neighbor that is the same border (check all cities, fields, etc)
                if(mapTile.borders[(mapSide + 1) % 4])
                    result += countUnits(mapTile, (mapSide + 1) % 4);

                if(mapTile.borders[(mapSide + 2) % 4])
                    result += countUnits(mapTile, (mapSide + 2) % 4);

                if(mapTile.borders[(mapSide + 3) % 4])
                    result += countUnits(mapTile, (mapSide + 3) % 4);
            }

            return result;
        }

        let result = 0;
        if(borderName == lastTile.borders[position % 4])
            result += countUnits(lastTile, position % 4);

        if(borderName == lastTile.borders[(position + 1) % 4])
            result += countUnits(lastTile, (position + 1) % 4);

        if(borderName == lastTile.borders[(position + 2) % 4])
            result += countUnits(lastTile, (position + 2) % 4);

        if(borderName == lastTile.borders[(position + 3) % 4])
            result += countUnits(lastTile, (position + 3) % 4);

        console.log(result);
        return result === 0;
    }
}

const traveler = new Unit({
    id: 0,
    name: 'Николай Михайлович Пржевальский',
    description: 'Никола́й Миха́йлович Пржева́льский — русский путешественник, географ и натуралист, почётный член Русского географического общества. Предпринял несколько экспедиций в Центральную Азию, во время которых изучил территорию Монголии, Китая и Тибета. Генерал-майор. Брат адвоката Владимира и математика Евгения Пржевальских',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDDNnZ-mO6UTZ4jSDCWlQ27RbJVmjr67Jw-w1uWqhH3z5S61OoT8JSmjxO4E03U5HXbBA&usqp=CAU',
    occupied: false,
    role: 'traveler'
});

const scientist = new Unit({
    id: 1,
    name: 'Василий Васильевич Докучаев',
    description: 'Васи́лий Васи́льевич Докуча́ев — русский геолог и почвовед, профессор минералогии и кристаллографии Санкт-Петербургского университета, директор Ново-Александрийского института сельского хозяйства и лесоводства. Известен как основоположник школы научного почвоведения и географии почв.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Dokuchaev_1888.jpg/274px-Dokuchaev_1888.jpg',
    occupied: false,
    role: 'scientist'
});

const listOfUnits = [
    traveler,
    scientist
];

function getUnitsByTeam(team: string) {
    return listOfUnits.map(unit => {
        const teamUnit = new Unit(unit);
        return teamUnit.setTeam(team);
    });
}

export const units = {
    blue: getUnitsByTeam('blue'),
    red: getUnitsByTeam('red'),
};

console.log(units);
