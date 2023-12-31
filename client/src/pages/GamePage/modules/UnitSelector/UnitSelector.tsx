import React, {memo, MouseEvent, useCallback, useEffect, useState} from 'react';
import {Transition} from "@headlessui/react";

import {Unit} from "@pages/GamePage/classes/Units.ts";
import {PlaceSelector} from "@pages/GamePage/modules/UnitSelector/components/PlaceSelector.tsx";
import {SelectedUnit} from "@pages/GamePage/modules/UnitSelector/components/SelectedUnit.tsx";
import {ListOfUnits} from "@pages/GamePage/modules/UnitSelector/components/ListOfUnits.tsx";
import {GameStageContext, MapContext} from "@pages/GamePage/gameContext.ts";

interface UnitSelectorProps {
    PlacedTile: any;

    isSelectingUnit: boolean;
    setIsSelectingUnit: React.Dispatch<React.SetStateAction<boolean>>;

    placeUnitCallback: () => void;
}

export const UnitSelector: React.FC<UnitSelectorProps> = memo(({
                                                                   PlacedTile,

                                                                   isSelectingUnit,
                                                                   setIsSelectingUnit,

                                                                   placeUnitCallback
                                                               }) => {
    const {setMap} = React.useContext(MapContext);
    const {setStage} = React.useContext(GameStageContext);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

    // Close modal
    const closeSelectingUnit = useCallback(() => {
        setIsSelectingUnit(false);
        setStage('unitPlaced');
    }, []);

    const handleOverlayClick = (e: MouseEvent) => {
        // Only close the modal if the click target is the outer div
        if (e.target === e.currentTarget) closeSelectingUnit();
    };

    // Close modal using escape
    const handleEscClose = (e: KeyboardEvent) => e.keyCode === 27 ? closeSelectingUnit() : null;
    useEffect(() => {
        document.addEventListener('keydown', handleEscClose);
        return () => {document.removeEventListener('keydown', handleEscClose);};
    }, []);

    return (
        <Transition
            show={isSelectingUnit}
        >
            <Transition.Child
                enter="transition-scale duration-300"
                enterFrom="scale-110 -translate-y-8 opacity-0"
                enterTo="scale-100 translate-y-0 opacity-100"
                leave="transition-scale duration-300"
                leaveFrom="scale-100 translate-y-0 opacity-100"
                leaveTo="scale-110 translate-y-8 opacity-0"
                className="transition-scale z-10 w-full h-full fixed inset-0"
            >

                <div
                    className="fixed inset-0 flex-center bg-black/30 backdrop-blur-s cursor-pointer"
                    onClick={handleOverlayClick}
                >
                    {/* Selector of unit place */}
                    <PlaceSelector
                        PlacedTile={PlacedTile}
                        closeSelectingUnit={closeSelectingUnit}

                        selectedUnit={selectedUnit}
                        setMap={setMap}
                    />

                    {/* Selected Unit */}
                    <SelectedUnit
                        selectedUnit={selectedUnit}
                    />

                    {/* Selector of units */}
                    <ListOfUnits
                        selectedUnit={selectedUnit}
                        setSelectedUnit={setSelectedUnit}
                    />
                </div>

            </Transition.Child>
        </Transition>

    );
});