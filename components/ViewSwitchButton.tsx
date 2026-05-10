import { ArrowUp, ArrowDown } from 'lucide-react';
import './ViewSwitchButton.css';

export interface ViewSwitchButtonProps {
    dungeonUnlocked: boolean;
    activeView: 'SURFACE' | 'DUNGEON';
    onToggle: () => void;
}

export const ViewSwitchButton: React.FC<ViewSwitchButtonProps> = ({ dungeonUnlocked, activeView, onToggle }) => {
    if (!dungeonUnlocked) {
        return null;
    }

    const isDungeon = activeView === 'DUNGEON';

    return (
        <button
            onClick={onToggle}
            className={`view-switch-button ${isDungeon ? 'is-dungeon' : 'is-surface'}`}
            title={isDungeon ? 'Return to Surface (U)' : 'Enter Dungeon (U)'}
        >
            <div className="flex items-center gap-2">
                {isDungeon ? (
                    <>
                        <ArrowUp size={16} strokeWidth={3} />
                        <span className="font-black tracking-tighter uppercase text-[10px]">Surface</span>
                    </>
                ) : (
                    <>
                        <ArrowDown size={16} strokeWidth={3} />
                        <span className="font-black tracking-tighter uppercase text-[10px]">Dungeon</span>
                    </>
                )}
            </div>
        </button>
    );
};
