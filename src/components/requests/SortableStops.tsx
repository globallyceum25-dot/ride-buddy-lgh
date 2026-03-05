import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationAutocomplete, Coordinates } from '@/components/shared/LocationAutocomplete';

interface SortableStopItemProps {
  id: string;
  index: number;
  value: string;
  coords: Coordinates | null;
  onChange: (value: string, coords: Coordinates | null, placeName?: string) => void;
  onRemove: () => void;
}

function SortableStopItem({ id, index, value, coords, onChange, onRemove }: SortableStopItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex gap-2 items-center ${isDragging ? 'opacity-50' : ''}`}
    >
      <button
        type="button"
        className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-sm text-muted-foreground w-12">Stop {index + 1}</span>
      <div className="flex-1">
        <LocationAutocomplete
          value={value}
          onChange={onChange}
          placeholder={`Search stop ${index + 1} location`}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface SortableStopsProps {
  stops: string[];
  onStopsChange: (stops: string[], coords?: (Coordinates | null)[], names?: (string | undefined)[]) => void;
  stopCoords?: (Coordinates | null)[];
  stopNames?: (string | undefined)[];
}

export function SortableStops({ stops, onStopsChange, stopCoords = [], stopNames = [] }: SortableStopsProps) {
  // Generate stable IDs for each stop
  const [stopIds] = useState<string[]>(() => 
    stops.map((_, i) => `stop-${i}-${Date.now()}`)
  );

  // Keep IDs in sync with stops array length
  const getStopIds = () => {
    while (stopIds.length < stops.length) {
      stopIds.push(`stop-${stopIds.length}-${Date.now()}`);
    }
    return stopIds.slice(0, stops.length);
  };

  const currentIds = getStopIds();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addStop = () => {
    stopIds.push(`stop-${stopIds.length}-${Date.now()}`);
    const newCoords = [...stopCoords, null];
    const newNames = [...stopNames, undefined];
    onStopsChange([...stops, ''], newCoords, newNames);
  };

  const removeStop = (index: number) => {
    stopIds.splice(index, 1);
    const newStops = stops.filter((_, i) => i !== index);
    const newCoords = stopCoords.filter((_, i) => i !== index);
    const newNames = stopNames.filter((_, i) => i !== index);
    onStopsChange(newStops, newCoords, newNames);
  };

  const updateStop = (index: number, value: string, coords: Coordinates | null, placeName?: string) => {
    const updatedStops = [...stops];
    updatedStops[index] = value;
    const updatedCoords = [...stopCoords];
    while (updatedCoords.length <= index) updatedCoords.push(null);
    updatedCoords[index] = coords;
    const updatedNames = [...stopNames];
    while (updatedNames.length <= index) updatedNames.push(undefined);
    updatedNames[index] = placeName;
    onStopsChange(updatedStops, updatedCoords, updatedNames);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = currentIds.indexOf(active.id as string);
      const newIndex = currentIds.indexOf(over.id as string);
      
      const newIds = arrayMove(currentIds, oldIndex, newIndex);
      const newStops = arrayMove(stops, oldIndex, newIndex);
      const newCoords = arrayMove([...stopCoords], oldIndex, newIndex);
      const newNames = arrayMove([...stopNames], oldIndex, newIndex);
      
      stopIds.length = 0;
      stopIds.push(...newIds);
      
      onStopsChange(newStops, newCoords, newNames);
    }
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Intermediate Stops</h4>
        <Button type="button" variant="outline" size="sm" onClick={addStop}>
          <Plus className="h-4 w-4 mr-1" />
          Add Stop
        </Button>
      </div>
      {stops.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No intermediate stops added. Click "Add Stop" to add locations between pickup and final destination.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={currentIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {stops.map((stop, index) => (
                <SortableStopItem
                  key={currentIds[index]}
                  id={currentIds[index]}
                  index={index}
                  value={stop}
                  coords={stopCoords[index] || null}
                  onChange={(value, coords, placeName) => updateStop(index, value, coords, placeName)}
                  onRemove={() => removeStop(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      {stops.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Drag the grip handle to reorder stops
        </p>
      )}
    </div>
  );
}
